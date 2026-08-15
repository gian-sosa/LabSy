"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, AlertCircle, Sun, Moon, ShieldCheck, LoaderCircle } from "lucide-react";
import { Analytics } from "@vercel/analytics/next"

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const INSTITUTIONAL_DOMAIN = "unsch.edu.pe";

export default function LoginPage() {
  const router = useRouter();
  const [authError, setAuthError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

          // Determine role based on email domain/prefix
          let role = "estudiante";
          if (userEmail.startsWith("admin")) {
            role = "admin";
          } else if (userEmail.startsWith("docente") || userEmail.startsWith("prof")) {
            role = "docente";
          }

          localStorage.setItem("labsy_user", JSON.stringify({ name: fullName, email: userEmail, role, avatar: avatarUrl }));
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

          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || "";

          let role = "estudiante";
          if (userEmail.startsWith("admin")) {
            role = "admin";
          } else if (userEmail.startsWith("docente") || userEmail.startsWith("prof")) {
            role = "docente";
          }

          localStorage.setItem("labsy_user", JSON.stringify({ name: fullName, email: userEmail, role, avatar: avatarUrl }));
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

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      setIsLoading(true);
      setAuthError("");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });

      if (error) {
        setIsLoading(false);
        setAuthError(`Error de Supabase: ${error.message}`);
      }
    } else {
      setAuthError("Supabase no configurado o inactivo.");
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-300 ${
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
        type="button"
        onClick={toggleTheme}
        aria-label={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        className={`absolute top-6 right-6 p-3 rounded-full border transition-all z-20 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:outline-none ${
          isDarkMode ? "bg-slate-900 border-slate-800 hover:bg-slate-800 text-yellow-400" : "bg-white border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
        }`}
      >
        {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      <div className={`w-full max-w-sm backdrop-blur-xl border rounded-3xl p-8 shadow-2xl z-10 transition-all ${
        isDarkMode ? "bg-slate-900/80 border-slate-800" : "bg-white border-slate-200"
      }`}>
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 bg-linear-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4">
            <GraduationCap className="h-9 w-9 text-slate-950 stroke-2" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-linear-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
            LabSy
          </h1>
          <p className={`text-sm mt-2 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            Portal Académico de Ingeniería de Sistemas
          </p>
        </div>

        {/* Institutional email notice */}
        <div className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 mb-6 ${
          isDarkMode ? "bg-amber-500/5 border-amber-500/25" : "bg-amber-50 border-amber-200"
        }`}>
          <ShieldCheck className={`h-4.5 w-4.5 shrink-0 ${isDarkMode ? "text-amber-400" : "text-amber-600"}`} />
          <p className={`text-xs leading-relaxed ${isDarkMode ? "text-slate-300" : "text-slate-600"}`}>
            Solo correo institucional{" "}
            <span className={`font-mono font-semibold ${isDarkMode ? "text-amber-300" : "text-amber-700"}`}>
              @{INSTITUTIONAL_DOMAIN}
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          aria-busy={isLoading}
          className={`w-full font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-3 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-70 disabled:pointer-events-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
            isDarkMode
              ? "bg-white hover:bg-slate-200 text-slate-950 shadow-lg shadow-white/5"
              : "bg-slate-950 hover:bg-slate-900 text-white shadow-lg shadow-slate-950/15"
          }`}
        >
          {isLoading ? (
            <>
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Conectando…
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Iniciar sesión con Google
            </>
          )}
        </button>

        {authError && (
          <div
            role="alert"
            aria-live="assertive"
            className="flex items-center gap-2 text-xs bg-red-950/20 border border-red-900/30 text-red-400 p-3 rounded-xl mt-4"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>
    </div>
  );
}