"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Share2, Trash2, Heart, MessageSquare, Image as ImageIcon, X, Loader2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Post {
  id: number;
  author: string;
  role: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  time: string;
  liked: boolean;
}

const INITIAL_POSTS: Post[] = [];

// Algoritmo de compresión de imágenes
const compressImage = (
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo seleccionado no es una imagen válida."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Redimensionar respetando la relación de aspecto
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("No se pudo obtener el contexto de canvas 2D."));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Comprimir como JPEG con la calidad indicada
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Función para formatear fechas al formato: "miércoles, 05 de agosto de 2026 a las 15:30"
const formatDate = (dateInput: Date | string | number) => {
  const date = new Date(dateInput);
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const dayName = days[date.getDay()];
  const dayNumber = String(date.getDate()).padStart(2, '0');
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${dayName}, ${dayNumber} de ${monthName} de ${year} a las ${hours}:${minutes}`;
};

// Función para detectar URLs y transformarlas en enlaces HTML interactivos
const renderContentWithLinks = (text: string) => {
  if (!text) return "";
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer font-semibold break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export default function InicioPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string; avatar?: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostText, setNewPostText] = useState("");
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [newPostImage, setNewPostImage] = useState("");
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = getSupabaseBrowserClient();

  // Cargar usuario e inicializar publicaciones
  useEffect(() => {
    const handleUserUpdate = () => {
      const stored = localStorage.getItem("labsy_user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    };
    handleUserUpdate();
    window.addEventListener("storage", handleUserUpdate);

    // Cargar posts persistidos en localStorage (o iniciales)
    const storedPosts = localStorage.getItem("labsy_forum_posts");
    if (storedPosts) {
      try {
        setPosts(JSON.parse(storedPosts));
      } catch (e) {
        setPosts(INITIAL_POSTS);
      }
    } else {
      setPosts(INITIAL_POSTS);
      localStorage.setItem("labsy_forum_posts", JSON.stringify(INITIAL_POSTS));
    }

    // Intentar obtener publicaciones de Supabase si está disponible
    const fetchSupabasePosts = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("forum_posts")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error && data && data.length > 0) {
        const formatted: Post[] = data.map((d: any) => ({
          id: d.id,
          author: d.author_name,
          role: d.author_role,
          avatar: d.author_avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
          content: d.content,
          image: d.image_url || undefined,
          likes: d.likes,
          comments: d.comments,
          time: formatDate(d.created_at),
          liked: false
        }));
        setPosts(formatted);
        localStorage.setItem("labsy_forum_posts", JSON.stringify(formatted));
      }
    };
    fetchSupabasePosts();

    return () => window.removeEventListener("storage", handleUserUpdate);
  }, [supabase]);

  // Cerrar lightbox con tecla Escape y resetear zoom
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoomedImage) {
          setZoomedImage(null);
          setImageScale(1);
          setImageOffset({ x: 0, y: 0 });
        }
        if (deleteConfirmId !== null) {
          setDeleteConfirmId(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomedImage, deleteConfirmId]);

  // Bloquear scroll del body y zoom con rueda del ratón cuando lightbox abierto
  useEffect(() => {
    if (!zoomedImage) return;
    document.body.style.overflow = "hidden";
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("wheel", handleWheel);
    };
  }, [zoomedImage]);

  // Zoom centrado con rueda del ratón (mínimo 100%, centrado gradual al alejar)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const zoomingIn = e.deltaY < 0;

    setImageScale(prev => {
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      const newScale = Math.min(Math.max(prev + delta, 1), 5);
      setImageOffset(offset => {
        if (newScale <= 1) return { x: 0, y: 0 };
        if (zoomingIn) return offset;
        const t = (newScale - 1) / 4;
        const progress = Math.sqrt(t);
        return {
          x: offset.x * progress,
          y: offset.y * progress
        };
      });
      return newScale;
    });
  }, []);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - imageOffset.x, y: e.clientY - imageOffset.y });
  }, [imageOffset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setImageOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom al abrir nueva imagen
  const openZoom = (src: string) => {
    setZoomedImage(src);
    setImageScale(1);
    setImageOffset({ x: 0, y: 0 });
  };

  // Guardar publicaciones en localStorage al cambiar
  const savePosts = (updatedPosts: Post[]) => {
    setPosts(updatedPosts);
    localStorage.setItem("labsy_forum_posts", JSON.stringify(updatedPosts));
  };

  // Manejo de la selección de imágenes y compresión
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setErrorMsg("");
    try {
      // Comprimir imagen a máximo 1024x1024 con calidad del 70%
      const compressedData = await compressImage(file);
      setNewPostImage(compressedData);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la imagen.");
    } finally {
      setIsCompressing(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const removeSelectedImage = () => {
    setNewPostImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setIsCompressing(true);
    setErrorMsg("");
    try {
      const compressedData = await compressImage(file);
      setNewPostImage(compressedData);
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar la imagen.");
    } finally {
      setIsCompressing(false);
    }
  }, []);

  // Crear una nueva publicación
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newPostText.trim() && !newPostImage) || !currentUser) return;

    const defaultAvatar = currentUser.role === "docente" 
      ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" 
      : currentUser.role === "admin" 
      ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100"
      : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100";

    const userAvatar = currentUser.avatar || defaultAvatar;

    const newPost: Post = {
      id: Date.now(),
      author: currentUser.name,
      role: currentUser.role,
      avatar: userAvatar,
      content: newPostText,
      image: newPostImage || undefined,
      likes: 0,
      comments: 0,
      time: formatDate(new Date()),
      liked: false
    };

    // Intentar insertar en Supabase si está disponible
    if (supabase) {
      const { data, error } = await supabase
        .from("forum_posts")
        .insert({
          author_name: currentUser.name,
          author_role: currentUser.role,
          author_avatar: userAvatar,
          content: newPostText,
          image_url: newPostImage || null
        })
        .select()
        .single();
      
      if (!error && data) {
        newPost.id = data.id;
        newPost.time = formatDate(data.created_at);
      }
    }

    const updated = [newPost, ...posts];
    savePosts(updated);
    setNewPostText("");
    removeSelectedImage();
  };

  const handleLike = async (id: number) => {
    const updated = posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    });

    savePosts(updated);

    if (supabase) {
      const postToLike = updated.find(p => p.id === id);
      if (postToLike) {
        await supabase
          .from("forum_posts")
          .update({ likes: postToLike.likes })
          .eq("id", id);
      }
    }
  };

  const handleDeletePost = async (id: number) => {
    const updated = posts.filter(post => post.id !== id);
    savePosts(updated);

    if (supabase) {
      await supabase
        .from("forum_posts")
        .delete()
        .eq("id", id);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Write Post Box */}
        {currentUser && (
          <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full overflow-hidden shrink-0">
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`relative rounded-xl transition-colors ${isDragOver ? "ring-2 ring-amber-500 bg-amber-500/5" : ""}`}
                  >
                    <textarea
                      placeholder="¿Qué quieres compartir hoy?"
                      value={newPostText}
                      onChange={(e) => setNewPostText(e.target.value)}
                      className="w-full bg-transparent border-0 resize-none text-sm focus:outline-none min-h-[70px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                    />
                    {isDragOver && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="flex items-center gap-2 text-amber-500 text-xs font-medium">
                          <ImageIcon className="h-4 w-4" />
                          <span>Soltar imagen aquí</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Vista previa de imagen comprimida */}
                  {newPostImage && (
                    <div className="relative inline-block rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[220px]">
                      <img src={newPostImage} alt="Vista previa de compresión" className="max-h-[200px] w-auto object-contain rounded-lg" />
                      <button
                        type="button"
                        onClick={removeSelectedImage}
                        className="absolute top-1.5 right-1.5 p-1 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full transition-colors"
                        title="Quitar imagen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {isCompressing && (
                    <div className="flex items-center gap-2 text-xs text-amber-500 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Comprimiendo imagen en tiempo real...</span>
                    </div>
                  )}

                  {errorMsg && (
                    <p className="text-xs text-red-500 font-medium">{errorMsg}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center">
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={triggerFileSelect}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Subir imagen"
                    disabled={isCompressing}
                  >
                    <ImageIcon className="h-4 w-4 text-amber-500" />
                    <span>Imagen</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={(!newPostText.trim() && !newPostImage) || isCompressing}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-bold px-5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5"
                >
                  Publicar
                  <Share2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Feed List */}
        <div className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-250 dark:border-slate-800/80 rounded-2xl bg-white/50 dark:bg-slate-900/30 transition-colors">
              <p className="text-sm text-slate-400 dark:text-slate-500">No hay publicaciones aún. ¡Sé el primero en compartir algo con la comunidad!</p>
            </div>
          ) : (
            posts.map((post) => (
              <article key={post.id} className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={post.avatar} alt={post.author} className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-850 dark:text-slate-100">{post.author}</span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          post.role === "docente" 
                            ? "bg-amber-500/10 text-amber-550 dark:text-amber-500" 
                            : post.role === "admin" 
                            ? "bg-red-500/10 text-red-500" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}>
                          {post.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500">{post.time}</span>
                    </div>
                  </div>

                  {currentUser && (currentUser.role === "admin" || currentUser.role === "docente" || post.author === currentUser.name) && (
                    <button
                      onClick={() => setDeleteConfirmId(post.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="Eliminar publicación"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {post.content && (
                  <p className="text-md leading-relaxed text-slate-800 dark:text-slate-300 whitespace-pre-wrap">{renderContentWithLinks(post.content)}</p>
                )}

                {post.image && (
                  <div 
                    onClick={() => post.image && openZoom(post.image)}
                    className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 max-h-[400px] bg-slate-50 dark:bg-slate-950 flex justify-center cursor-zoom-in hover:opacity-95 transition-opacity"
                  >
                    <img src={post.image} alt="Publicación" className="max-h-[400px] w-auto object-contain rounded-lg" />
                  </div>
                )}

                <div className="flex items-center gap-6 pt-2 text-xs text-slate-450 dark:text-slate-400">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center gap-2 transition-colors ${post.liked ? "text-rose-500 font-medium" : "hover:text-rose-550"}`}
                  >
                    <Heart className={`h-4.5 w-4.5 ${post.liked ? "fill-current" : ""}`} />
                    <span>{post.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-amber-500 transition-colors">
                    <MessageSquare className="h-4.5 w-4.5" />
                    <span>{post.comments}</span>
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm shadow-xl overflow-hidden z-10 transition-all transform scale-100 flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-950/40">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-100">
                  Eliminar publicación
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-xs text-slate-700 dark:text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar esta publicación de la comunidad?
              </p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-950/40">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-250 dark:border-slate-800 hover:bg-slate-500 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  handleDeletePost(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-500 hover:bg-red-400 text-white transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox para agrandar imágenes */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 transition-all duration-300"
          style={{ cursor: isDragging ? "grabbing" : "grab" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setZoomedImage(null);
              setImageScale(1);
              setImageOffset({ x: 0, y: 0 });
            }
          }}
        >
          <div className="relative max-w-5xl max-h-[90vh] flex flex-col items-center">
            <img 
              src={zoomedImage} 
              alt="Imagen ampliada" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-slate-800 select-none"
              style={{
                transform: `scale(${imageScale}) translate(${imageOffset.x / imageScale}px, ${imageOffset.y / imageScale}px)`,
                transition: isDragging ? "none" : "transform 0.15s ease-out"
              }}
              draggable={false}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
