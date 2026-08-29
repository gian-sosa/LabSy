"use client";

import React from "react";
import { GraduationCap } from "lucide-react";

export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen font-sans flex flex-col relative transition-colors duration-300 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Background radial glow */}
      <div className="absolute top-0 left-0 w-full h-[350px] pointer-events-none bg-gradient-to-b from-amber-500/5 via-slate-50/0 to-transparent dark:from-amber-950/10 dark:via-slate-950/0 dark:to-transparent" />

      {/* Cabecera Fija Skeleton */}
      <header className="sticky top-0 left-0 right-0 z-30 border-b px-6 py-4 flex items-center justify-between transition-colors bg-white/80 border-slate-200 backdrop-blur-md dark:bg-slate-950/80 dark:border-slate-900">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-linear-to-tr from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center animate-pulse">
            <GraduationCap className="h-6 w-6 text-slate-950 stroke-2" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-linear-to-r from-yellow-500 to-amber-600 bg-clip-text text-transparent">
              LabSy
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              ESCUELA DE INGENIERÍA DE SISTEMAS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-xl border animate-pulse bg-slate-100 border-slate-200 dark:bg-slate-900 dark:border-slate-800" />
          <div className="hidden md:flex items-center gap-3">
            <div className="flex flex-col items-end gap-1.5">
              <div className="h-3.5 w-28 rounded-md animate-pulse bg-slate-200 dark:bg-slate-800" />
              <div className="h-2.5 w-16 rounded-md animate-pulse bg-slate-200/70 dark:bg-slate-800/60" />
            </div>
            <div className="h-9 w-9 rounded-full animate-pulse border bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700" />
          </div>
        </div>
      </header>

      {/* Main Container Skeleton */}
      <div className="max-w-7xl w-full mx-auto px-4 md:px-8 pt-6 pb-8 flex flex-col md:flex-row gap-8 flex-1 z-10">
        {/* Desktop Sidebar Skeleton */}
        <aside className="hidden md:block md:w-[262px] shrink-0 self-start space-y-6">
          <div className="border rounded-2xl p-5 space-y-4 bg-white border-slate-200 shadow-sm dark:bg-slate-900/60 dark:border-slate-800/80">
            <div className="h-3 w-24 rounded-md animate-pulse bg-slate-200 dark:bg-slate-800" />
            <div className="space-y-2 pt-1">
              <div className="h-11 w-full rounded-xl animate-pulse bg-amber-500/15 dark:bg-amber-500/20" />
              <div className="h-11 w-full rounded-xl animate-pulse bg-slate-100 dark:bg-slate-800/50" />
              <div className="h-11 w-full rounded-xl animate-pulse bg-slate-100 dark:bg-slate-800/50" />
              <div className="h-11 w-full rounded-xl animate-pulse bg-slate-100 dark:bg-slate-800/50" />
              <div className="h-11 w-full rounded-xl animate-pulse bg-slate-100/60 dark:bg-slate-800/30" />
            </div>
          </div>
        </aside>

        {/* Main Feed Content Skeleton */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* Create Post Card Skeleton */}
          <div className="border rounded-2xl p-5 shadow-sm space-y-4 bg-white border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full shrink-0 animate-pulse bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-14 w-full rounded-xl animate-pulse bg-slate-100 dark:bg-slate-800/50" />
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="h-7 w-20 rounded-lg animate-pulse bg-slate-200 dark:bg-slate-800" />
              <div className="h-7 w-24 rounded-lg animate-pulse bg-amber-500/20 dark:bg-amber-500/30" />
            </div>
          </div>

          {/* Posts Feed Skeletons */}
          {[1, 2].map((item) => (
            <div
              key={item}
              className="border rounded-2xl p-5 space-y-4 shadow-sm bg-white border-slate-200 dark:bg-slate-900/60 dark:border-slate-800/80"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full animate-pulse bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-3.5 w-32 rounded-md animate-pulse bg-slate-200 dark:bg-slate-800" />
                      <div className="h-3 w-16 rounded-full animate-pulse bg-amber-500/10 dark:bg-amber-500/20" />
                    </div>
                    <div className="h-2.5 w-24 rounded-md animate-pulse bg-slate-200/70 dark:bg-slate-800/60" />
                  </div>
                </div>
              </div>

              <div className="space-y-2 py-1">
                <div className="h-3.5 w-full rounded-md animate-pulse bg-slate-200/80 dark:bg-slate-800/70" />
                <div className="h-3.5 w-4/5 rounded-md animate-pulse bg-slate-200/80 dark:bg-slate-800/70" />
                <div className="h-3.5 w-2/3 rounded-md animate-pulse bg-slate-200/60 dark:bg-slate-800/50" />
              </div>

              {item === 1 && (
                <div className="h-48 w-full rounded-xl animate-pulse bg-slate-100 dark:bg-slate-800/40" />
              )}

              <div className="flex items-center gap-6 pt-2">
                <div className="h-4 w-12 rounded animate-pulse bg-slate-200 dark:bg-slate-800" />
                <div className="h-4 w-12 rounded animate-pulse bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
