"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, AlertCircle, Sun, Moon } from "lucide-react";
import { Analytics } from "@vercel/analytics/next"

import { getSupabaseBrowserClient, hasSupabaseConfig } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [authError, setAuthError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // 1. Listen for Supabase Auth state changes (useful for Google OAuth redirects)
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const user = session.user;
          const userEmail = user.email || "";
          
          // Get full name from metadata and convert it to uppercase
          const fullName = (
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split("@")[0] || 
            "USUARIO SIN NOMBRE"
          ).toUpperCase();

          // Determine role based on email domain/prefix
          let role = "estudiante";
          if (userEmail.startsWith("admin")) {
            role = "admin";
          } else if (userEmail.startsWith("docente") || userEmail.startsWith("prof")) {
            role = "docente";
          }

          localStorage.setItem("labsy_user", JSON.stringify({ name: fullName, email: userEmail, role }));
          router.push("/inicio");
        }
      });

      // Also check if already logged in with Supabase
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const user = session.user;
          const userEmail = user.email || "";
          const fullName = (
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split("@")[0] || 
            "USUARIO SIN NOMBRE"
          ).toUpperCase();

          let role = "estudiante";
          if (userEmail.startsWith("admin")) {
            role = "admin";
          } else if (userEmail.startsWith("docente") || userEmail.startsWith("prof")) {
            role = "docente";
          }

          localStorage.setItem("labsy_user", JSON.stringify({ name: fullName, email: userEmail, role }));
          router.push("/inicio");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Fallback: Check if user is already logged in locally (if Supabase is not configured)
      const storedUser = localStorage.getItem("labsy_user");
      if (storedUser) {
        router.push("/inicio");
      }
    }
  }, [router]);

  useEffect(() => {
    const storedTheme = localStorage.getItem("labsy_theme");
    if (storedTheme) {
      setIsDarkMode(storedTheme === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = !isDarkMode;
    setIsDarkMode(nextTheme);
    localStorage.setItem("labsy_theme", nextTheme ? "dark" : "light");
  };

  const handleGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        setAuthError(`Error de Supabase: ${error.message}`);
      }
      return;
    }

    // Fallback: Mock login logic if Supabase is not configured
    if (!email) {
      setAuthError("Ingresa tu correo institucional");
      return;
    }
    if (!email.endsWith("@sistemas.edu.pe") && !email.endsWith("@uni.edu.pe")) {
      setAuthError("Debe ser un correo con dominio @sistemas.edu.pe o @uni.edu.pe");
      return;
    }

    let role = "estudiante";
    let name = "ESTUDIANTE SISTEMAS";
    if (email.startsWith("admin")) {
      role = "admin";
      name = "ADMINISTRADOR TI";
    } else if (email.startsWith("docente") || email.startsWith("prof")) {
      role = "docente";
      name = "DOCENTE PRINCIPAL";
    }

    localStorage.setItem("labsy_user", JSON.stringify({ name: name.toUpperCase(), email, role }));
    router.push("/inicio");
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    }`}>
      {/* Background Lights */}
      <div className={`absolute top-[-20%] left-[-10%] w-125 h-125 rounded-full blur-[120px] pointer-events-none transition-all ${
        isDarkMode ? "bg-amber-900/15" : "bg-amber-200/30"
      }`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-125 h-125 rounded-full blur-[120px] pointer-events-none transition-all ${
        isDarkMode ? "bg-slate-800/20" : "bg-slate-200/40"
      }`} />
      
      {/* Theme toggle float */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 p-3 rounded-full border transition-all ${
          isDarkMode ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-yellow-400" : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
        }`}
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className={`w-full max-w-md backdrop-blur-xl border rounded-3xl p-8 shadow-2xl z-10 transition-all ${
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-linear-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
            <GraduationCap className="h-9 w-9 text-slate-950 stroke-2" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight gradient-linear-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            LabSy
          </h1>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Portal Académico de Ingeniería de Sistemas
          </p>
        </div>

        <form onSubmit={handleGoogleLogin} className="space-y-6">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${
              isDarkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              Correo Institucional
            </label>
            <div className="relative">
              <input
                type="email"
                placeholder="usuario@sistemas.edu.pe"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 text-sm transition-all outline-none ${
                  isDarkMode 
                    ? "bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-200 placeholder-slate-700" 
                    : "bg-slate-100 border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-slate-900 placeholder-slate-400"
                }`}
              />
            </div>
            <p className={`text-[11px] mt-1.5 ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
              * Usa <code className="text-amber-500 font-bold">docente@sistemas.edu.pe</code> o <code className="text-amber-500 font-bold">admin@sistemas.edu.pe</code> para probar otros roles.
            </p>
          </div>

          {authError && (
            <div className="flex items-center gap-2 text-xs bg-red-950/20 border border-red-900/30 text-red-400 p-3 rounded-xl">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className={`w-full font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
              isDarkMode 
                ? "bg-white hover:bg-slate-200 text-slate-950 shadow-lg shadow-white/5" 
                : "bg-slate-950 hover:bg-slate-900 text-white shadow-lg shadow-slate-950/15"
            }`}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Iniciar sesión con Google
          </button>
        </form>
      </div>
    </div>
  );
}
