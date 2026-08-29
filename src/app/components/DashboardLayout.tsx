"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  Calendar,
  GraduationCap,
  LogOut,
  Shield,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  LayoutGrid
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import DashboardSkeleton from "./DashboardSkeleton";

interface User {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [sidebarLeft, setSidebarLeft] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  const headerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state with localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem("labsy_theme");
    if (storedTheme) {
      setIsDarkMode(storedTheme === "dark");
    } else {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    }
    
    const syncUser = async () => {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const userEmail = user.email || "";
          const fullName = (
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split("@")[0] || 
            "USUARIO SIN NOMBRE"
          ).toUpperCase();
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";
          
          const localStored = localStorage.getItem("labsy_user");
          let role = "estudiante";
          if (localStored) {
            role = JSON.parse(localStored).role || "estudiante";
          } else {
            if (userEmail.startsWith("admin")) {
              role = "admin";
            } else if (userEmail.startsWith("docente") || userEmail.startsWith("prof")) {
              role = "docente";
            }
          }

          const realUser = { name: fullName, email: userEmail, role, avatar: avatarUrl };
          setCurrentUser(realUser);
          localStorage.setItem("labsy_user", JSON.stringify(realUser));
          setMounted(true);
          return;
        }
      }

      const storedUser = localStorage.getItem("labsy_user");
      if (!storedUser) {
        router.push("/");
      } else {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.name) {
          parsed.name = parsed.name.toUpperCase();
        }
        setCurrentUser(parsed);
      }
      setMounted(true);
    };

    syncUser();
  }, [router]);

  // Medir la altura real del header fijo para alinear el sidebar sticky
  useEffect(() => {
    if (!mounted) return;
    const updateHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
      // Alinear el sidebar fijo al borde izquierdo del contenido (padding de 2rem)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSidebarLeft(Math.round(rect.left + 32));
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", updateHeight);
    window.addEventListener("scroll", updateHeight);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener("scroll", updateHeight);
    };
  }, [mounted]);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
    localStorage.setItem("labsy_theme", nextTheme ? "dark" : "light");
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    localStorage.removeItem("labsy_user");
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  const switchRole = (role: "estudiante" | "docente" | "admin") => {
    if (!currentUser) return;
    
    // Si el usuario tiene un nombre real (ej. de Google), lo mantenemos.
    // Solo usamos nombres genéricos si el usuario actual tiene un nombre genérico de prueba o está vacío.
    const genericNames = ["ESTUDIANTE SISTEMAS", "DOCENTE PRINCIPAL", "ADMINISTRADOR TI", "ESTUDIANTE DE PRUEBA", "USUARIO SIN NOMBRE"];
    
    let name = currentUser.name;
    let email = currentUser.email;
    
    if (!name || genericNames.includes(name.toUpperCase())) {
      name = "ESTUDIANTE SISTEMAS";
      email = "estudiante@sistemas.edu.pe";
      if (role === "admin") {
        name = "ADMINISTRADOR TI";
        email = "admin@sistemas.edu.pe";
      } else if (role === "docente") {
        name = "DOCENTE PRINCIPAL";
        email = "docente@sistemas.edu.pe";
      }
    }
    
    const updatedUser = { name: name.toUpperCase(), email, role, avatar: currentUser.avatar };
    setCurrentUser(updatedUser);
    localStorage.setItem("labsy_user", JSON.stringify(updatedUser));
    // Trigger storage event so other pages know
    window.dispatchEvent(new Event("storage"));
  };

  if (!mounted || !currentUser) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="min-h-screen font-sans flex flex-col relative transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-full h-[350px] pointer-events-none bg-gradient-to-b from-amber-500/5 via-slate-50/0 to-transparent dark:from-amber-950/10 dark:via-slate-950/0 dark:to-transparent" />

      {/* Cabecera Fija */}
      <div ref={headerRef} className="fixed top-0 left-0 right-0 z-30 flex flex-col">
        {/* Demo role switch bar */}
        {/* Oculte esta sección en producción */}
        <div className={`hidden border-b px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs transition-colors ${
          isDarkMode ? "bg-slate-900 border-slate-800" : "bg-amber-500/10 border-amber-500/20 text-slate-850"
        }`}>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
          <span className="font-semibold">Simulador de Roles (Prototipo):</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => switchRole("estudiante")}
            className={`px-3 py-1 rounded-md transition-all ${
              currentUser.role === "estudiante" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Estudiante
          </button>
          <button
            onClick={() => switchRole("docente")}
            className={`px-3 py-1 rounded-md transition-all ${
              currentUser.role === "docente" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Docente
          </button>
          <button
            onClick={() => switchRole("admin")}
            className={`px-3 py-1 rounded-md transition-all ${
              currentUser.role === "admin" ? "bg-amber-500 text-slate-950 font-bold" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            Administrador
          </button>
        </div>
      </div>

        {/* Header */}
        <header className={`border-b px-6 py-4 flex items-center justify-between transition-colors ${
          isDarkMode ? "bg-slate-950/80 border-slate-900 backdrop-blur-md" : "bg-white/80 border-slate-200 backdrop-blur-md"
        }`}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-linear-to-tr from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-slate-950 stroke-2" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-linear-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
              LabSy
            </h1>
            <p className={`text-[10px] ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>ESCUELA DE INGENIERÍA DE SISTEMAS</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-yellow-400" : "bg-slate-100 border-slate-200 hover:bg-slate-250 text-slate-755"
            }`}
            title="Cambiar Tema"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`md:hidden p-2 rounded-xl border transition-all ${
              isDarkMode ? "bg-slate-900 border-slate-850 hover:bg-slate-800 text-slate-100" : "bg-slate-100 border-slate-200 hover:bg-slate-250 text-slate-800"
            }`}
            title="Menú"
          >
            {isSidebarOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>

          <div className="hidden md:flex items-center gap-3 text-right">
            <div>
              <p className="text-sm font-semibold">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 justify-end">
                {currentUser.role === "admin"}
                {currentUser.role === "docente"}
                <span className={`text-[10px] uppercase font-bold tracking-wider ${
                  currentUser.role === "admin" ? "text-red-400" : currentUser.role === "docente" ? "text-amber-450" : "text-amber-550"
                }`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="h-9 w-9 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className={`h-9 w-9 rounded-full flex items-center justify-center border text-sm font-bold ${
                isDarkMode ? "bg-slate-900 border-slate-800 text-amber-400" : "bg-slate-100 border-slate-200 text-slate-800"
              }`}>
                {currentUser.name.charAt(0)}
              </div>
            )}
          </div>
        </div>
      </header>

      </div>

      {/* Main Container */}
      <div
        ref={containerRef}
        className="max-w-7xl w-full mx-auto px-4 md:px-8 pb-8 flex flex-col md:flex-row gap-8 flex-1 z-10"
        style={{ paddingTop: `${headerHeight + 24}px` }}
      >
        {/* Backdrop for mobile sidebar */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300 ${
            isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Mobile Sidebar (Drawer) */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-72 max-w-[80vw] h-full transition-transform duration-300 ease-in-out md:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className={`h-full border-r p-5 space-y-4 ${
            isDarkMode 
              ? "bg-slate-950 border-slate-900" 
              : "bg-white border-slate-200"
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 bg-linear-to-tr from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-slate-950 stroke-2" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-tight bg-linear-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
                  LabSy
                </h1>
              </div>
            </div>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>-</h3>
            <nav className="space-y-1">
              <Link
                href="/inicio"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/inicio"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users className="h-4 w-4" />
                Foro de Estudiantes
              </Link>
              <Link
                href="/material"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/material"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Material Académico
              </Link>
              <Link
                href="/laboratorio"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/laboratorio"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-655 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Laboratorio
                <span className="ml-auto inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                {/* animate-ping */}
              </Link>
              <Link
                href="/aplicaciones"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/aplicaciones"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-655 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Aplicaciones
              </Link>
              {currentUser && (currentUser.role === "docente" || currentUser.role === "admin") && (
                <Link
                  href="/inscritos"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === "/inscritos"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : isDarkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      : "text-slate-655 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Inscritos
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-red-600"
                    : "text-slate-650 hover:text-slate-900 hover:bg-red-400"
                }`}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>

        {/* Desktop Sidebar (Only visible on desktop/tablet) */}
        <aside
          className="hidden md:block md:w-[262px] shrink-0 self-start space-y-6 md:fixed"
          style={{ top: `${headerHeight + 24}px`, left: `${sidebarLeft}px` }}
        >
          <div className={`border rounded-2xl p-5 space-y-4 ${
            isDarkMode ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>Menú Principal</h3>
            <nav className="space-y-1">
              <Link
                href="/inicio"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/inicio"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Users className="h-4 w-4" />
                Foro de Estudiantes
              </Link>
              <Link
                href="/material"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/material"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Material Académico
              </Link>
              <Link
                href="/laboratorio"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/laboratorio"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-655 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Calendar className="h-4 w-4" />
                Laboratorio
                {/* animate-ping */}
                <span className="ml-auto inline-flex relative text-[10px] font-semibold text-black px-3 py-0.5 rounded-xl border border-emerald-600 bg-green-400 text-emerald-450">
                  On-line
                </span>
              </Link>
              <Link
                href="/aplicaciones"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/aplicaciones"
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    : "text-slate-655 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <LayoutGrid className="h-4 w-4" />
                Aplicaciones
              </Link>
              {currentUser && (currentUser.role === "docente" || currentUser.role === "admin") && (
                <Link
                  href="/inscritos"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname === "/inscritos"
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : isDarkMode
                      ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      : "text-slate-655 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Inscritos
                </Link>
              )}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isDarkMode
                    ? "text-slate-400 hover:text-slate-200 hover:bg-red-600"
                    : "text-slate-650 hover:text-slate-900 hover:bg-red-400"
                }`}
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </nav>
          </div>
        </aside>

        {/* Dynamic content rendering */}
        <main className="flex-1 min-w-0 md:pl-[18rem]">
          {children}
        </main>
      </div>

      {/* Footer */}
      <footer className={`flex justify-center flex-col gap-1 italic border-t py-6 text-center text-xs z-1 backdrop-blur-md ${
        isDarkMode ? "border-gray-700 text-slate-200" : "border-slate-200 text-slate-500 bg-white/80"
      }`}>
        <p>Desarrollado por Gian Carlos Mallqui Sosa </p>
        <p>Presidente CEIS 2027</p>
      </footer>
    </div>
  );
}
