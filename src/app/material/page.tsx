"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { BookOpen, Search, Upload, FileText, FileDown, Trash2, Pencil, Check, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Resource {
  id: number;
  name: string;
  type: string;
  course: string;
  author: string;
  semester: string;
  url?: string;
}

const INITIAL_RESOURCES: Resource[] = [];

const getTypeColorClass = (type?: string) =>
  type?.toLowerCase() === "sílabo"
    ? "bg-blue-500/10 text-blue-600 dark:text-blue-505"
    : type?.toLowerCase() === "examen"
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-505"
    : type?.toLowerCase() === "ppt"
    ? "bg-red-500/10 text-red-600 dark:text-red-505"
    : type?.toLowerCase() === "video"
    ? "bg-violet-500/10 text-violet-600 dark:text-violet-505"
    : type?.toLowerCase() === "otros"
    ? "bg-slate-500/10 text-slate-600 dark:text-slate-400"
    : "bg-amber-500/10 text-amber-600 dark:text-amber-550";

const tagClass =
  "px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-500 text-slate-650 dark:text-slate-200";

export default function MaterialPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [resourceSearch, setResourceSearch] = useState("");
  const [newResourceName, setNewResourceName] = useState("");
  const [newResourceType, setNewResourceType] = useState("Libro");
  const [newResourceCourse, setNewResourceCourse] = useState("");
  const [newResourceAuthor, setNewResourceAuthor] = useState("");
  const [newResourceSemester, setNewResourceSemester] = useState("Ciclo 1");
  const [newResourceUrl, setNewResourceUrl] = useState("");
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  const [editingResourceId, setEditingResourceId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("Libro");
  const [editCourse, setEditCourse] = useState("");
  const [editSemester, setEditSemester] = useState("Ciclo 1");
  const [editAuthor, setEditAuthor] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const handleUserUpdate = () => {
      const stored = localStorage.getItem("labsy_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    };
    handleUserUpdate();
    window.addEventListener("storage", handleUserUpdate);

    // Cargar de localStorage inicialmente
    const storedResources = localStorage.getItem("labsy_resources");
    if (storedResources) {
      try {
        setResources(JSON.parse(storedResources));
      } catch (e) {
        setResources(INITIAL_RESOURCES);
      }
    } else {
      setResources(INITIAL_RESOURCES);
    }

    // Obtener de Supabase si está disponible
    const fetchResources = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("academic_materials")
        .select("*")
        .order("id", { ascending: false });
      
      if (!error && data) {
        setResources(data);
        localStorage.setItem("labsy_resources", JSON.stringify(data));
      }
    };
    fetchResources();

    return () => window.removeEventListener("storage", handleUserUpdate);
  }, [supabase]);

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResourceName.trim() || !newResourceCourse.trim() || !newResourceAuthor.trim() || !currentUser) return;

    const newResource = {
      name: newResourceName,
      type: newResourceType,
      course: newResourceCourse,
      author: newResourceAuthor,
      semester: newResourceSemester,
      url: newResourceUrl.trim() || undefined
    };

    if (supabase) {
      const { data, error } = await supabase
        .from("academic_materials")
        .insert([newResource])
        .select();
      
      if (!error && data && data[0]) {
        const updated = [data[0], ...resources];
        setResources(updated);
        localStorage.setItem("labsy_resources", JSON.stringify(updated));
      } else {
        const localResource: Resource = {
          id: Date.now(),
          ...newResource
        };
        const updated = [localResource, ...resources];
        setResources(updated);
        localStorage.setItem("labsy_resources", JSON.stringify(updated));
      }
    } else {
      const localResource: Resource = {
        id: Date.now(),
        ...newResource
      };
      const updated = [localResource, ...resources];
      setResources(updated);
      localStorage.setItem("labsy_resources", JSON.stringify(updated));
    }

    setNewResourceName("");
    setNewResourceType("Libro");
    setNewResourceCourse("");
    setNewResourceAuthor("");
    setNewResourceUrl("");
    setShowUploadPanel(false);
  };

  const handleDeleteResource = useCallback(async (id: number) => {
    if (supabase) {
      const { error } = await supabase
        .from("academic_materials")
        .delete()
        .eq("id", id);

      if (!error) {
        const updated = resources.filter(r => r.id !== id);
        setResources(updated);
        localStorage.setItem("labsy_resources", JSON.stringify(updated));
      }
    } else {
      const updated = resources.filter(r => r.id !== id);
      setResources(updated);
      localStorage.setItem("labsy_resources", JSON.stringify(updated));
    }
  }, [resources, supabase]);

  const handleStartEdit = useCallback((res: Resource) => {
    setEditingResourceId(res.id);
    setEditName(res.name);
    setEditType(res.type || "Libro");
    setEditCourse(res.course);
    setEditSemester(res.semester);
    setEditAuthor(res.author);
    setEditUrl(res.url || "");
  }, []);

  const handleSaveEdit = useCallback(async (id: number) => {
    const updatedFields = {
      name: editName,
      type: editType,
      course: editCourse,
      semester: editSemester,
      author: editAuthor,
      url: editUrl.trim() || undefined
    };

    if (supabase) {
      const { error } = await supabase
        .from("academic_materials")
        .update(updatedFields)
        .eq("id", id);

      if (!error) {
        const updated = resources.map(r => r.id === id ? { ...r, ...updatedFields } : r);
        setResources(updated);
        localStorage.setItem("labsy_resources", JSON.stringify(updated));
      }
    } else {
      const updated = resources.map(r => r.id === id ? { ...r, ...updatedFields } : r);
      setResources(updated);
      localStorage.setItem("labsy_resources", JSON.stringify(updated));
    }

    setEditingResourceId(null);
  }, [editName, editType, editCourse, editSemester, editAuthor, editUrl, resources, supabase]);

  const searchQuery = resourceSearch.toLowerCase().trim();

  const filteredResources = useMemo(() => resources.filter(res =>
    res.name.toLowerCase().includes(searchQuery) ||
    res.course.toLowerCase().includes(searchQuery) ||
    res.author.toLowerCase().includes(searchQuery) ||
    res.semester.toLowerCase().includes(searchQuery) ||
    (res.type || "").toLowerCase().includes(searchQuery)
  ), [resources, searchQuery]);

    const resourceList = useMemo(() => (
    <>
      {filteredResources.length > 0 ? (
              filteredResources.map((res) => (
                <div
                  key={res.id}
                  onClick={res.url && editingResourceId !== res.id ? () => window.open(res.url, "_blank") : undefined}
                  className={`p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/5 transition-colors ${
                    res.url && editingResourceId !== res.id ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex flex-col items-center gap-1 shrink-0 w-14">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center">
                        <FileText className={`h-5 w-5 ${getTypeColorClass(res.type).split(" ")[1]}`} />
                      </div>
                      <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded truncate max-w-full leading-none ${getTypeColorClass(res.type)}`}>
                        {res.type || "Libro"}
                      </span>
                    </div>
                    
                    {editingResourceId === res.id ? (
                      <div className="flex-1 space-y-2 pr-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border rounded-lg px-2 py-1 text-xs bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                          placeholder="Nombre del recurso"
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editCourse}
                            onChange={(e) => setEditCourse(e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                            placeholder="Curso"
                          />
                          <input
                            type="text"
                            value={editAuthor}
                            onChange={(e) => setEditAuthor(e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                            placeholder="Autor / Docente"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <select
                            value={editSemester}
                            onChange={(e) => setEditSemester(e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option>Ciclo 1</option>
                            <option>Ciclo 2</option>
                            <option>Ciclo 3</option>
                            <option>Ciclo 4</option>
                            <option>Ciclo 5</option>
                            <option>Ciclo 6</option>
                            <option>Ciclo 7</option>
                            <option>Ciclo 8</option>
                            <option>Ciclo 9</option>
                            <option>Ciclo 10</option>
                          </select>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                          >
                            <option value="Libro">Libro</option>
                            <option value="Sílabo">Sílabo</option>
                            <option value="Examen">Examen</option>
                            <option value="PPT">PPT</option>
                            <option value="Video">Video</option>
                            <option value="Otros">Otros</option>
                          </select>
                          <input
                            type="url"
                            value={editUrl}
                            onChange={(e) => setEditUrl(e.target.value)}
                            className="border rounded-lg px-2 py-1 text-xs bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-amber-500"
                            placeholder="URL de enlace (opcional)"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{res.name}</h4>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className={tagClass}>{res.course}</span>
                          <span className={tagClass}>{res.semester}</span>
                          <span className={tagClass}>{res.author}</span>
                        </div>
                      </div>
                    )}
                  </div>
 
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {editingResourceId === res.id ? (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleSaveEdit(res.id)}
                          className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-955 rounded-lg transition-all"
                          title="Guardar cambios"
                        >
                          <Check className="h-4 w-4 text-slate-950 font-bold" />
                        </button>
                        <button
                          onClick={() => setEditingResourceId(null)}
                          className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 rounded-lg transition-all"
                          title="Cancelar"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (res.url) {
                              window.open(res.url, "_blank");
                            } else {
                              alert(`Simulando descarga de: ${res.name}`);
                            }
                          }}
                          className="p-2 rounded-lg transition-all flex items-center gap-2 text-xs border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-750"
                          title={res.url ? "Ver enlace" : "Descargar archivo"}
                        >
                          <FileDown className="h-4 w-4" />
                        </button>
                        
                        {currentUser && (currentUser.role === "admin" || currentUser.role === "docente") && (
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleStartEdit(res)}
                              className="p-2 text-slate-450 hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-all"
                              title="Editar recurso"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmId(res.id);
                                setDeleteConfirmName(res.name);
                              }}
                              className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                              title="Eliminar recurso"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No se encontraron recursos académicos.
              </div>
            )}
          </>
  ), [filteredResources, currentUser, editingResourceId, editName, editCourse, editAuthor, editSemester, editType, editUrl, handleSaveEdit, handleStartEdit]);

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
            <p className="text-xs text-slate-550 dark:text-slate-400">Material de estudio subido y compartido por la comunidad académica.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre, curso, docente, ciclo o tipo..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                className="w-full border focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl pl-9 pr-4 py-2 text-xs outline-none transition-all bg-slate-100 dark:bg-slate-955 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-350 placeholder-slate-450 dark:placeholder-slate-700"
              />
            </div>
            
            {currentUser && (
              <button
                onClick={() => setShowUploadPanel(!showUploadPanel)}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {showUploadPanel ? "Ocultar Formulario" : "Subir Material"}
              </button>
            )}
          </div>
        </div>

        {/* Upload Modal (All Logged-in Users) */}
        {currentUser && showUploadPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <div 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
              onClick={() => setShowUploadPanel(false)}
            />
            
            {/* Modal Box */}
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden z-10 transition-all transform scale-100 flex flex-col">
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between bg-slate-50 dark:bg-slate-950/40">
                <h3 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                  <Upload className="h-4 w-4 text-amber-500" />
                  Subir Nuevo Material Académico
                </h3>
                <button 
                  onClick={() => setShowUploadPanel(false)}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleUploadResource} className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500">Nombre del material</label>
                  <input
                    type="text"
                    placeholder="Ej: Análisis Matemático I"
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-555 text-slate-350 placeholder-slate-450 dark:placeholder-slate-600 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500">Tipo de material</label>
                  <select
                    value={newResourceType}
                    onChange={(e) => setNewResourceType(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-555 text-slate-350 transition-colors"
                  >
                    <option value="Libro">Libro</option>
                    <option value="Sílabo">Sílabo</option>
                    <option value="Examen">Examen</option>
                    <option value="PPT">PPT</option>
                    <option value="Video">Video</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500">Curso relacionado</label>
                  <input
                    type="text"
                    placeholder="Ej: Cálculo I"
                    value={newResourceCourse}
                    onChange={(e) => setNewResourceCourse(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-555 text-slate-350 placeholder-slate-450 dark:placeholder-slate-600 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500">Autor / Docente</label>
                  <input
                    type="text"
                    placeholder="Ej: Eduardo Espinoza Ramos"
                    value={newResourceAuthor}
                    onChange={(e) => setNewResourceAuthor(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-555 text-slate-350 placeholder-slate-450 dark:placeholder-slate-600 transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500">Ciclo / Semestre</label>
                  <select
                    value={newResourceSemester}
                    onChange={(e) => setNewResourceSemester(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-555 text-slate-350 transition-colors"
                  >
                    <option>Ciclo 1</option>
                    <option>Ciclo 2</option>
                    <option>Ciclo 3</option>
                    <option>Ciclo 4</option>
                    <option>Ciclo 5</option>
                    <option>Ciclo 6</option>
                    <option>Ciclo 7</option>
                    <option>Ciclo 8</option>
                    <option>Ciclo 9</option>
                    <option>Ciclo 10</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-450 dark:text-slate-500">URL del enlace</label>
                  <input
                    type="url"
                    placeholder="Ej: https://es.scribd.com/..."
                    value={newResourceUrl}
                    onChange={(e) => setNewResourceUrl(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-700 rounded-xl px-4 py-2 text-xs outline-none focus:border-amber-555 text-slate-350 placeholder-slate-450 dark:placeholder-slate-600 transition-colors"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowUploadPanel(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold px-4 py-2 rounded-xl text-xs transition-all"
                  >
                    Subir Material
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        {deleteConfirmId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setDeleteConfirmId(null);
                setDeleteConfirmName("");
              }}
            />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden z-10 transition-all transform scale-100 flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40">
                <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    Eliminar material
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  ¿Estás seguro de que deseas eliminar <span className="font-semibold text-slate-800 dark:text-slate-100">"{deleteConfirmName}"</span> de la lista de materiales?
                </p>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/40">
                <button
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteConfirmName("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 hover:bg-slate-500 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDeleteResource(deleteConfirmId);
                    setDeleteConfirmId(null);
                    setDeleteConfirmName("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resources List */}
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {resourceList}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
