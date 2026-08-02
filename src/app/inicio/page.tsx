"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Share2, Trash2, Heart, MessageSquare } from "lucide-react";

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

const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    author: "Ing. Carlos Mendoza",
    role: "docente",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100",
    content: "Bienvenidos al nuevo ciclo 2026-II. He subido las guías para el Laboratorio de Redes y Conectividad al repositorio de Material Académico. ¡Mucho éxito a todos!",
    image: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=600",
    likes: 24,
    comments: 5,
    time: "Hace 2 horas",
    liked: false
  },
  {
    id: 2,
    author: "Ana Guevara",
    role: "estudiante",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100",
    content: "¡Al fin logré hacer funcionar el clúster de Kubernetes en el Laboratorio B! Si alguien necesita ayuda con la configuración de Helm, me avisa. 🚀",
    image: "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?auto=format&fit=crop&q=80&w=600",
    likes: 42,
    comments: 12,
    time: "Hace 4 horas",
    liked: true
  }
];

export default function InicioPage() {
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState("");

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

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim() || !currentUser) return;

    const newPost: Post = {
      id: Date.now(),
      author: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.role === "docente" 
        ? "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100" 
        : currentUser.role === "admin" 
        ? "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100"
        : "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
      content: newPostText,
      image: newPostImage || undefined,
      likes: 0,
      comments: 0,
      time: "Ahora mismo",
      liked: false
    };

    setPosts([newPost, ...posts]);
    setNewPostText("");
    setNewPostImage("");
  };

  const handleLike = (id: number) => {
    setPosts(posts.map(post => {
      if (post.id === id) {
        return {
          ...post,
          liked: !post.liked,
          likes: post.liked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const handleDeletePost = (id: number) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Write Post Box */}
        {currentUser && (
          <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div className="flex gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-amber-400 font-bold flex items-center justify-center shrink-0">
                  {currentUser.name.charAt(0)}
                </div>
                <textarea
                  placeholder="¿Qué quieres compartir hoy con Ingeniería de Sistemas?"
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  className="flex-1 bg-transparent border-0 resize-none text-sm focus:outline-none min-h-[60px] text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="text"
                  placeholder="Pegar URL de foto (opcional)"
                  value={newPostImage}
                  onChange={(e) => setNewPostImage(e.target.value)}
                  className="border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 rounded-lg px-3 py-1.5 text-xs outline-none w-full sm:max-w-xs focus:border-amber-500 transition-colors text-slate-800 dark:text-slate-350 placeholder-slate-450 dark:placeholder-slate-600"
                />
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1.5 self-end sm:self-auto"
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
          {posts.map((post) => (
            <article key={post.id} className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 space-y-4 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={post.avatar} alt={post.author} className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-800" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{post.author}</span>
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
                    onClick={() => handleDeletePost(post.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                    title="Eliminar publicación"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>

              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{post.content}</p>

              {post.image && (
                <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-slate-800 max-h-[300px]">
                  <img src={post.image} alt="Publicación" className="w-full object-cover" />
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
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
