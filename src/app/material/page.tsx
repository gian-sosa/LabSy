"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { BookOpen, Search, Upload, FileText, FileDown, Trash2 } from "lucide-react";

interface Resource {
  id: number;
  name: string;
  type: string;
  size: string;
  course: string;
  author: string;
  semester: string;
  url?: string;
}

const INITIAL_RESOURCES: Resource[] = [
  { 
    id: 1, 
    name: "Análisis Matemático I", 
    type: "pdf", 
    size: "42.8 MB", 
    course: "Cálculo I", 
    author: "Eduardo Espinoza Ramos", 
    semester: "3er ciclo",
    url: "https://es.scribd.com/document/583258493/Analisis-Matematico-I-Eduardo-Espinoza-Ramos"
  },
  { id: 2, name: "Guía de Laboratorio 1 - Docker y Containers", type: "pdf", size: "1.8 MB", course: "Desarrollo de Software", author: "MSc. Julio Torres", semester: "6to Semestre" },
  { id: 3, name: "Material Adicional - Redes Neuronales desde Cero", type: "zip", size: "14.5 MB", course: "Inteligencia Artificial", author: "Dra. Martha Ruiz", semester: "9no Semestre" }
];

export default function MaterialPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [resourceSearch, setResourceSearch] = useState("");
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceCourse, setNewResourceCourse] = useState("");
  const [newResourceSemester, setNewResourceSemester] = useState("1er Semestre");

  useEffect(() => {
    const handleUserUpdate = () => {
      const stored = localStorage.getItem("labsy_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    };
    handleUserUpdate();
    window.addEventListener("storage", handleUserUpdate);
    return () => window.removeEventListener("storage", handleUserUpdate);
  }, []);

  const handleUploadResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName.trim() || !newResourceCourse.trim() || !currentUser) return;

    const newResource: Resource = {
      id: Date.now(),
      name: newResourceName,
      type: "pdf",
      size: "1.2 MB",
      course: newResourceCourse,
      author: currentUser.name,
      semester: newResourceSemester
    };

    setResources([newResource, ...resources]);
    setNewResourceName("");
    setNewResourceCourse("");
  };

  const handleDeleteResource = (id: number) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const filteredResources = resources.filter(res =>
    res.name.toLowerCase().includes(resourceSearch.toLowerCase()) ||
    res.course.toLowerCase().includes(resourceSearch.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header repository */}
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-amber-500" />
              Repositorio Académico
            </h2>
            <p className="text-xs text-slate-550 dark:text-slate-400">Material de estudio oficial subido y validado por los docentes.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              placeholder="Buscar recurso o curso..."
              value={resourceSearch}
              onChange={(e) => setResourceSearch(e.target.value)}
              className="w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs outline-none transition-all bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-350 placeholder-slate-400 dark:placeholder-slate-700"
            />
          </div>
        </div>

        {/* Upload Panel (Docente/Admin Only) */}
        {currentUser && (currentUser.role === "docente" || currentUser.role === "admin") && (
          <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">
              <Upload className="h-4 w-4" />
              <span>Subir Nuevo Material Académico (Panel Docente)</span>
            </div>
            <form onSubmit={handleUploadResource} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nombre del recurso"
                value={newResourceName}
                onChange={(e) => setNewResourceName(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-500 text-slate-800 dark:text-slate-300 placeholder-slate-450 dark:placeholder-slate-600 transition-colors"
                required
              />
              <input
                type="text"
                placeholder="Curso relacionado"
                value={newResourceCourse}
                onChange={(e) => setNewResourceCourse(e.target.value)}
                className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-500 text-slate-800 dark:text-slate-300 placeholder-slate-450 dark:placeholder-slate-600 transition-colors"
                required
              />
              <div className="flex gap-2">
                <select
                  value={newResourceSemester}
                  onChange={(e) => setNewResourceSemester(e.target.value)}
                  className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 flex-1 text-slate-800 dark:text-slate-300 transition-colors"
                >
                  <option>1er Semestre</option>
                  <option>2do Semestre</option>
                  <option>6to Semestre</option>
                  <option>8vo Semestre</option>
                  <option>9no Semestre</option>
                </select>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold px-4 rounded-xl text-xs transition-all flex items-center justify-center shrink-0"
                >
                  Subir
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Resources List */}
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
          <div className="divide-y divide-slate-150 dark:divide-slate-800/80">
            {filteredResources.length > 0 ? (
              filteredResources.map((res) => (
                <div 
                  key={res.id} 
                  onClick={res.url ? () => window.open(res.url, "_blank") : undefined}
                  className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/5 transition-colors ${
                    res.url ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-amber-500/10 text-amber-600 dark:text-amber-550">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{res.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-350">{res.course}</span>
                        <span>•</span>
                        <span>{res.semester}</span>
                        <span>•</span>
                        <span>Por: {res.author}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Simulando descarga de: ${res.name}`);
                      }}
                      className="p-2 rounded-lg transition-all flex items-center gap-2 text-xs border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750"
                      title="Descargar archivo"
                    >
                      <FileDown className="h-4 w-4" />
                      <span className="hidden sm:inline">{res.size}</span>
                    </button>
                    
                    {currentUser && (currentUser.role === "admin" || currentUser.role === "docente") && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteResource(res.id);
                        }}
                        className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Eliminar recurso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No se encontraron recursos académicos.
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
