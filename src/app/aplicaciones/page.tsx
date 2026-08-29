"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import {
  Calculator,
  Plus,
  Trash2,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  BookOpen,
  Target,
  BarChart3,
  Check,
  Zap,
  Layers
} from "lucide-react";

interface CourseItem {
  id: string;
  name: string;
  credits: number;
  grade: number | "";
}

interface EvaluationItem {
  id: string;
  name: string;
  weight: number;
  grade: number | "";
  isCompleted: boolean;
}

const DEFAULT_COURSES: CourseItem[] = [
  { id: "1", name: "Estadística Aplicada", credits: 4, grade: 14.5 },
  { id: "2", name: "Gestión de Datos e Información", credits: 4, grade: 15.0 },
  { id: "3", name: "Estructura de Datos y Algoritmos", credits: 4, grade: 13.0 },
  { id: "4", name: "Métodos Numéricos", credits: 3, grade: 12.0 },
  { id: "5", name: "Pruebas de Calidad de Software", credits: 3, grade: "" },
  { id: "6", name: "Redes de Datos", credits: 4, grade: "" }
];

const DEFAULT_EVALUATIONS: EvaluationItem[] = [
  { id: "1", name: "Examen Parcial", weight: 30, grade: 11.5, isCompleted: true },
  { id: "2", name: "Prácticas Calificadas / Laboratorio", weight: 25, grade: 14.0, isCompleted: true },
  { id: "3", name: "Proyecto / Trabajo Final", weight: 15, grade: "", isCompleted: false },
  { id: "4", name: "Examen Final", weight: 30, grade: "", isCompleted: false }
];

export default function AplicacionesPage() {
  const [activeTab, setActiveTab] = useState<"semestre" | "curso">("semestre");
  const [courses, setCourses] = useState<CourseItem[]>(DEFAULT_COURSES);
  const [courseName, setCourseName] = useState("Diseño de Software");
  const [targetGrade, setTargetGrade] = useState<number>(10.5);
  const [evaluations, setEvaluations] = useState<EvaluationItem[]>(DEFAULT_EVALUATIONS);

  useEffect(() => {
    try {
      const savedCourses = localStorage.getItem("labsy_gpa_courses");
      if (savedCourses) {
        setCourses(JSON.parse(savedCourses));
      }
      const savedEvals = localStorage.getItem("labsy_gpa_evals");
      if (savedEvals) {
        setEvaluations(JSON.parse(savedEvals));
      }
      const savedCourseName = localStorage.getItem("labsy_gpa_course_name");
      if (savedCourseName) {
        setCourseName(savedCourseName);
      }
      const savedTarget = localStorage.getItem("labsy_gpa_target");
      if (savedTarget) {
        setTargetGrade(parseFloat(savedTarget) || 10.5);
      }
    } catch (e) {
      console.error("Error al cargar datos guardados:", e);
    }
  }, []);

  const saveCourses = (newCourses: CourseItem[]) => {
    setCourses(newCourses);
    localStorage.setItem("labsy_gpa_courses", JSON.stringify(newCourses));
  };

  const saveEvaluations = (newEvals: EvaluationItem[]) => {
    setEvaluations(newEvals);
    localStorage.setItem("labsy_gpa_evals", JSON.stringify(newEvals));
  };

  const addCourse = () => {
    const newCourse: CourseItem = {
      id: Date.now().toString(),
      name: `Curso ${courses.length + 1}`,
      credits: 3,
      grade: ""
    };
    saveCourses([...courses, newCourse]);
  };

  const updateCourse = (id: string, field: keyof CourseItem, value: any) => {
    const updated = courses.map((c) => {
      if (c.id === id) {
        return { ...c, [field]: value };
      }
      return c;
    });
    saveCourses(updated);
  };

  const removeCourse = (id: string) => {
    const filtered = courses.filter((c) => c.id !== id);
    saveCourses(filtered);
  };

  const resetCourses = () => {
    saveCourses(DEFAULT_COURSES);
  };

  const addEvaluation = () => {
    const newEval: EvaluationItem = {
      id: Date.now().toString(),
      name: `Evaluación ${evaluations.length + 1}`,
      weight: 10,
      grade: "",
      isCompleted: false
    };
    saveEvaluations([...evaluations, newEval]);
  };

  const updateEvaluation = (id: string, field: keyof EvaluationItem, value: any) => {
    const updated = evaluations.map((e) => {
      if (e.id === id) {
        return { ...e, [field]: value };
      }
      return e;
    });
    saveEvaluations(updated);
  };

  const removeEvaluation = (id: string) => {
    const filtered = evaluations.filter((e) => e.id !== id);
    saveEvaluations(filtered);
  };

  const resetEvaluations = () => {
    saveEvaluations(DEFAULT_EVALUATIONS);
    setTargetGrade(10.5);
  };

  const validCourses = courses.filter((c) => typeof c.grade === "number" && c.grade >= 0 && c.grade <= 20);
  const totalCreditsEnrolled = courses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);
  const totalCreditsGraded = validCourses.reduce((acc, c) => acc + (Number(c.credits) || 0), 0);

  const weightedSum = validCourses.reduce((acc, c) => acc + (Number(c.grade) * Number(c.credits)), 0);
  const currentWeightedGPA = totalCreditsGraded > 0 ? (weightedSum / totalCreditsGraded) : 0;

  const approvedCredits = validCourses
    .filter((c) => Number(c.grade) >= 10.5)
    .reduce((acc, c) => acc + (Number(c.credits) || 0), 0);

  const getGPARating = (gpa: number) => {
    if (gpa >= 16.5) return { text: "Excelente (Tercio / Quinto Superior)", color: "text-emerald-500" };
    if (gpa >= 14.0) return { text: "Sobresaliente", color: "text-blue-500" };
    if (gpa >= 11.5) return { text: "Regular / Bueno", color: "text-amber-500" };
    if (gpa >= 10.5) return { text: "Aprobatorio Límite", color: "text-yellow-600 dark:text-yellow-400" };
    return { text: "En Riesgo Académico", color: "text-rose-500" };
  };

  const totalWeight = evaluations.reduce((acc, e) => acc + (Number(e.weight) || 0), 0);
  
  const accumulatedPoints = evaluations.reduce((acc, e) => {
    if (e.isCompleted && typeof e.grade === "number") {
      return acc + (e.grade * (e.weight / 100));
    }
    return acc;
  }, 0);

  const completedWeight = evaluations.reduce((acc, e) => {
    if (e.isCompleted && typeof e.grade === "number") {
      return acc + Number(e.weight);
    }
    return acc;
  }, 0);

  const remainingWeight = evaluations.reduce((acc, e) => {
    if (!e.isCompleted || e.grade === "") {
      return acc + Number(e.weight);
    }
    return acc;
  }, 0);

  const pointsNeeded = targetGrade - accumulatedPoints;
  const gradeNeeded = remainingWeight > 0 ? (pointsNeeded / (remainingWeight / 100)) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 bg-white dark:bg-slate-900/60 shadow-sm transition-colors relative overflow-hidden">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 bg-linear-to-tr from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
                <Calculator className="h-6 w-6 text-slate-950 stroke-2" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  Aplicaciones Académicas
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Herramientas CEIS
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Calculadoras, simuladores y herramientas de apoyo para estudiantes de Ingeniería de Sistemas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("semestre")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "semestre"
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                Promedio Semestral
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("curso")}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "curso"
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Target className="h-3.5 w-3.5" />
                Estimador por Curso
              </button>
            </div>
          </div>
        </div>

        {activeTab === "semestre" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Promedio Ponderado
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                    {currentWeightedGPA.toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ 20</span>
                </div>
                <div className="mt-3">
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-amber-400 to-yellow-500 transition-all duration-500"
                      style={{ width: `${Math.min((currentWeightedGPA / 20) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Rendimiento UNSCH
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Award className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <p className={`text-sm font-bold leading-tight ${getGPARating(currentWeightedGPA).color}`}>
                    {getGPARating(currentWeightedGPA).text}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {currentWeightedGPA >= 10.5 ? "Aprobando el semestre" : "Requiere subir notas"}
                  </p>
                </div>
              </div>

              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Créditos
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <BookOpen className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-50">
                    {totalCreditsEnrolled}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">créditos</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {totalCreditsGraded} calificados de {totalCreditsEnrolled}
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Créditos Aprobados
                  </span>
                  <div className="h-8 w-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    {approvedCredits}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/ {totalCreditsGraded} evaluados</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {totalCreditsGraded > 0
                    ? `${((approvedCredits / totalCreditsGraded) * 100).toFixed(0)}% de éxito en cursos evaluados`
                    : "Sin notas ingresadas"}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 bg-white dark:bg-slate-900/60 shadow-sm transition-colors space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Asignaturas del Semestre
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ingresa los créditos y tu nota final estimada (0 a 20). Los cambios se guardan automáticamente.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetCourses}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                    title="Restablecer cursos por defecto"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Restablecer
                  </button>
                  <button
                    type="button"
                    onClick={addCourse}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Añadir Curso
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-2 w-8">#</th>
                      <th className="pb-3 px-3">Nombre de Asignatura</th>
                      <th className="pb-3 px-3 w-32">Créditos</th>
                      <th className="pb-3 px-3 w-36">Nota Final (0-20)</th>
                      <th className="pb-3 px-3 w-28">Puntaje</th>
                      <th className="pb-3 px-3 w-32">Estado</th>
                      <th className="pb-3 px-2 w-12 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {courses.map((course, index) => {
                      const numGrade = typeof course.grade === "number" ? course.grade : null;
                      const hasGrade = numGrade !== null && numGrade >= 0 && numGrade <= 20;
                      const isPassing = hasGrade && numGrade >= 10.5;
                      const points = hasGrade ? (numGrade * (Number(course.credits) || 0)).toFixed(1) : "-";

                      return (
                        <tr key={course.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-2 text-slate-400 font-medium">{index + 1}</td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={course.name}
                              onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                              placeholder="Nombre del curso"
                              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={course.credits}
                                onChange={(e) => updateCourse(course.id, "credits", Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center"
                              />
                              <span className="text-[11px] text-slate-400">créd.</span>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.1"
                              placeholder="Ej. 14.5"
                              value={course.grade}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                updateCourse(course.id, "grade", val);
                              }}
                              className={`w-28 border rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-center focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                hasGrade
                                  ? isPassing
                                    ? "bg-emerald-50/50 border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-50/50 border-rose-300 dark:bg-rose-950/20 dark:border-rose-800/60 text-rose-600 dark:text-rose-400"
                                  : "bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200"
                              }`}
                            />
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {points}
                          </td>
                          <td className="py-3 px-3">
                            {hasGrade ? (
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isPassing
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                                }`}
                              >
                                {isPassing ? <Check className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
                                {isPassing ? "Aprobado" : "Desaprobado"}
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-400 italic">Pendiente</span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeCourse(course.id)}
                              disabled={courses.length <= 1}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                              title="Eliminar curso"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-4 flex items-start gap-3 mt-4">
                <Sparkles className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-slate-200">Fórmula de ponderación UNSCH:</span>{" "}
                  El promedio ponderado se calcula multiplicando la nota de cada asignatura por su número de créditos, sumando los productos y dividiendo el resultado entre la suma total de créditos calificados.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "curso" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 bg-white dark:bg-slate-900/60 shadow-sm transition-colors space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Target className="h-4 w-4 text-amber-500" />
                    Configuración del Curso a Estimar
                  </h3>
                  <button
                    type="button"
                    onClick={resetEvaluations}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Restablecer
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nombre de la Asignatura
                    </label>
                    <input
                      type="text"
                      value={courseName}
                      onChange={(e) => {
                        setCourseName(e.target.value);
                        localStorage.setItem("labsy_gpa_course_name", e.target.value);
                      }}
                      placeholder="Ej. Estructura de Datos"
                      className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Nota Objetivo Deseada (Mínimo aprobatorio = 10.5)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.5"
                        value={targetGrade}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setTargetGrade(val);
                          localStorage.setItem("labsy_gpa_target", val.toString());
                        }}
                        className="w-28 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-center text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setTargetGrade(10.5);
                            localStorage.setItem("labsy_gpa_target", "10.5");
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            targetGrade === 10.5
                              ? "bg-amber-500 text-slate-950 border-amber-500"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          10.5 (Aprobar)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTargetGrade(14.0);
                            localStorage.setItem("labsy_gpa_target", "14.0");
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            targetGrade === 14.0
                              ? "bg-amber-500 text-slate-950 border-amber-500"
                              : "border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                          }`}
                        >
                          14.0 (Distinción)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className={`border rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  gradeNeeded <= 0
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
                    : gradeNeeded > 20
                    ? "bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Diagnóstico del Curso
                    </span>
                    {gradeNeeded <= 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : gradeNeeded > 20 ? (
                      <AlertTriangle className="h-4 w-4 text-rose-500" />
                    ) : (
                      <Zap className="h-4 w-4 text-amber-500" />
                    )}
                  </div>

                  <div className="mt-3">
                    {remainingWeight <= 0 ? (
                      <div>
                        <span className="text-2xl font-extrabold">
                          {accumulatedPoints.toFixed(2)}
                        </span>
                        <p className="text-xs mt-1">
                          {accumulatedPoints >= targetGrade
                            ? "¡Felicidades! Alcanzaste tu objetivo con éxito."
                            : "Todas las evaluaciones han finalizado."}
                        </p>
                      </div>
                    ) : gradeNeeded <= 0 ? (
                      <div>
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          ¡Ya Aprobaste!
                        </span>
                        <p className="text-xs mt-1">
                          Con tus {accumulatedPoints.toFixed(2)} pts acumulados ya superaste la meta de {targetGrade}.
                        </p>
                      </div>
                    ) : gradeNeeded > 20 ? (
                      <div>
                        <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                          Inalcanzable
                        </span>
                        <p className="text-xs mt-1">
                          Necesitarías {gradeNeeded.toFixed(2)} pts de promedio en lo restante (máximo posible es 20).
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs">Necesitas sacar en promedio:</p>
                        <div className="flex items-baseline gap-2 mt-1">
                          <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
                            {gradeNeeded.toFixed(2)}
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            en el {remainingWeight}% restante
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-[11px] flex justify-between">
                  <span>Puntos acumulados: <strong>{accumulatedPoints.toFixed(2)} pts</strong></span>
                  <span>Evaluado: <strong>{completedWeight}%</strong></span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 bg-white dark:bg-slate-900/60 shadow-sm transition-colors space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Sistema de Calificaciones de {courseName}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        totalWeight === 100
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}
                    >
                      Suma de pesos: {totalWeight}% {totalWeight !== 100 && "(Debe sumar 100%)"}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Marca las evaluaciones que ya rendiste con su respectiva nota. Las desmarcadas se estimarán automáticamente.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addEvaluation}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                >
                  <Plus className="h-4 w-4" />
                  Añadir Evaluación
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-2 w-8">#</th>
                      <th className="pb-3 px-3">Tipo de Evaluación</th>
                      <th className="pb-3 px-3 w-32">Peso (%)</th>
                      <th className="pb-3 px-3 w-32 text-center">¿Ya se rindió?</th>
                      <th className="pb-3 px-3 w-36">Nota Obtenida / Estimada</th>
                      <th className="pb-3 px-3 w-28">Aporte</th>
                      <th className="pb-3 px-2 w-12 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {evaluations.map((item, index) => {
                      const isDone = item.isCompleted && typeof item.grade === "number";
                      const aporte = typeof item.grade === "number" && item.isCompleted
                        ? (item.grade * (item.weight / 100)).toFixed(2)
                        : (gradeNeeded > 0 && gradeNeeded <= 20
                            ? (Math.min(gradeNeeded, 20) * (item.weight / 100)).toFixed(2) + " (req.)"
                            : "-");

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-2 text-slate-400 font-medium">{index + 1}</td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateEvaluation(item.id, "name", e.target.value)}
                              placeholder="Ej. Examen Parcial"
                              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.weight}
                                onChange={(e) => updateEvaluation(item.id, "weight", Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono text-center"
                              />
                              <span className="text-[11px] text-slate-400">%</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => updateEvaluation(item.id, "isCompleted", !item.isCompleted)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                                item.isCompleted
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                                  : "bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400"
                              }`}
                            >
                              {item.isCompleted ? "Sí (Rendido)" : "Pendiente"}
                            </button>
                          </td>
                          <td className="py-3 px-3">
                            {item.isCompleted ? (
                              <input
                                type="number"
                                min="0"
                                max="20"
                                step="0.1"
                                placeholder="Nota"
                                value={item.grade}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? "" : parseFloat(e.target.value);
                                  updateEvaluation(item.id, "grade", val);
                                }}
                                className="w-28 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs font-mono font-bold text-center text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                              />
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-semibold text-xs border border-amber-500/20">
                                {gradeNeeded > 0 && gradeNeeded <= 20
                                  ? `Req. ~${gradeNeeded.toFixed(1)}`
                                  : gradeNeeded <= 0
                                  ? "Asegurado"
                                  : "> 20 (Alerta)"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                            {aporte} pts
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeEvaluation(item.id)}
                              disabled={evaluations.length <= 1}
                              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                              title="Eliminar evaluación"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 bg-white dark:bg-slate-900/60 shadow-sm transition-colors space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-500" />
                Catálogo de Mini-Apps Académicas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Próximas herramientas en desarrollo para la comunidad estudiantil de Sistemas
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div className="border border-amber-500/30 rounded-xl p-4 bg-amber-500/5 space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                  <Calculator className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                  Activo
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Calculadora de Promedio y Notas
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Ponderación semestral y simulador de notas necesarias para aprobar cursos.
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <BookOpen className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Próximamente
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Generador de Referencias APA 7
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Formateador automático de citas bibliográficas y referencias para tesis e informes.
              </p>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-950/40 space-y-2 opacity-80">
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                  <Zap className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Próximamente
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Temporizador Pomodoro de Estudio
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Técnica de enfoque por bloques de tiempo con seguimiento de sesiones académicas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
