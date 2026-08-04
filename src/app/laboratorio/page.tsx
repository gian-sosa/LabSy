"use client";

import React, { useState, useEffect } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { Plus, Edit2 } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

interface Lab {
  id: number;
  name: string;
  course: string;
  day: string; // 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'
  startHour: number; // 7 to 20
  durationHours: number; // 2 to 4
  room: string;
  teacher: string;
  capacity: number; // 20
  vacancies: number;
}

interface LabClassRow {
  id: number;
  lab_name: string;
  course: string;
  day: string;
  start_hour: number;
  duration_hours: number;
  room: string;
  teacher: string;
  capacity: number;
  vacancies: number;
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const HOURS_RANGE = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM (20:00)
const SCHOOL_LABS = [
  { name: "Laboratorio 1", room: "H-212" },
  { name: "Laboratorio 2", room: "H-213" },
  { name: "Laboratorio 3", room: "H-214" },
  { name: "Laboratorio 4", room: "H-218" },
  { name: "Laboratorio 5", room: "H-219" },
] as const;
const COURSE_POOL = [
  "Estadística Aplicada",
  "Gestión de Datos de Información",
  "Estructura de Datos Fundamentales y Algoritmos",
  "Métodos Numéricos",
  "Pruebas de Aseguramiento de Calidad de Software",
  "Redes de Datos",
  "Modelamiento de Datos",
  "Diseño de Software",
  "Lenguaje de Programación",
  "Gestión de Riesgos y Seguridad de TI",
  "Gestión de Datos e Información",
  "Comercio Electrónico",
  "Fundamentos de Sistemas de Información",
  "Sistemas Distribuidos",
  "Gestión de Procesos de Negocios",
  "Sistemas Eléctricos y Electrónicos",
];
const TEACHER_POOL = [
  "TAPIA CALDERÓN, Guillermo",
  "HUARCAYA VICENTE, Gladys",
  "MONTES DE OCA ALCARRÁZ, José Ciro",
  "MENESES YARANGA, Óscar",
  "ZAPATA CASAVERDE, Richard",
  "PERALTA SOTOMAYOR, Karel",
  "PORTILLO QUISPE, Javier",
  "QUISPE BAUTISTA, Pelayo",
  "VILA HUAMÁN, Eloy",
  "CARREÑO GAMARRA, Juan Carlos",
  "AYALA FARFÁN, Jhimy",
  "MENESES CCONISLLA, Yudith",
  "MARTÍNEZ CÓRDOVA, Celia Edith",
  "GUEVARA MOROTE, Edith",
  "QUISPE YAULI, Grover",
  "RUIZ HUAMAN, Luis Adderlin",
  "YAURI VIDALÓN, José Elías",
  "JANAMPA PATILLA, Hubner",
  "TERRAZA HUAMÁN, Edem Jersson",
  "FERNÁNDEZ JERÍ, Elvira",
  "LEZAMA CUELLAR, Christian",
  "LUQUE MENDIETA, Fiorella",
];
const CLASS_SLOTS = [
  { day: "Lunes", startHour: 7, durationHours: 2 },
  { day: "Lunes", startHour: 10, durationHours: 2 },
  { day: "Martes", startHour: 8, durationHours: 2 },
  { day: "Martes", startHour: 11, durationHours: 2 },
  { day: "Miércoles", startHour: 7, durationHours: 2 },
  { day: "Miércoles", startHour: 10, durationHours: 2 },
  { day: "Jueves", startHour: 9, durationHours: 2 },
  { day: "Jueves", startHour: 14, durationHours: 2 },
  { day: "Viernes", startHour: 8, durationHours: 2 },
  { day: "Viernes", startHour: 15, durationHours: 2 },
] as const;
const LAB_CLASSES_TABLE = "lab_classes";

const INITIAL_LABS: Lab[] = SCHOOL_LABS.flatMap((labDef, labIndex) =>
  CLASS_SLOTS.map((slot, slotIndex) => ({
    id: labIndex * CLASS_SLOTS.length + slotIndex + 1,
    name: labDef.name,
    room: labDef.room,
    course: COURSE_POOL[(labIndex * 2 + slotIndex) % COURSE_POOL.length],
    teacher: TEACHER_POOL[(labIndex + slotIndex) % TEACHER_POOL.length],
    day: slot.day,
    startHour: slot.startHour,
    durationHours: slot.durationHours,
    capacity: 20,
    vacancies: 5 + ((labIndex + slotIndex * 3) % 15),
  }))
);

const toLab = (row: LabClassRow): Lab => ({
  id: row.id,
  name: row.lab_name,
  course: row.course,
  day: row.day,
  startHour: row.start_hour,
  durationHours: row.duration_hours,
  room: row.room,
  teacher: row.teacher,
  capacity: row.capacity,
  vacancies: row.vacancies,
});

const toLabInsert = (lab: Omit<Lab, "id">) => ({
  lab_name: lab.name,
  course: lab.course,
  day: lab.day,
  start_hour: lab.startHour,
  duration_hours: lab.durationHours,
  room: lab.room,
  teacher: lab.teacher,
  capacity: lab.capacity,
  vacancies: lab.vacancies,
});

export default function LaboratorioPage() {
  const supabase = getSupabaseBrowserClient();
  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [enrolledLabs, setEnrolledLabs] = useState<number[]>([]);
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState(false);
  const [labsSyncMessage, setLabsSyncMessage] = useState<string>(
    supabase ? "Conectando horarios con Supabase..." : "Modo local activo. Agrega tus keys de Supabase para persistencia."
  );
  
  // Modals / Editing States
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form Fields
  const [formCourse, setFormCourse] = useState("");
  const [formDay, setFormDay] = useState("Lunes");
  const [formStartHour, setFormStartHour] = useState(8);
  const [formDuration, setFormDuration] = useState(3);
  const [formRoom, setFormRoom] = useState("");
  const [formTeacher, setFormTeacher] = useState("");

  // Sync state
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

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let isActive = true;

    const mergeLab = (incoming: Lab) => {
      setLabs((previous) => {
        const idx = previous.findIndex((lab) => lab.id === incoming.id);
        if (idx === -1) return [...previous, incoming];
        const next = [...previous];
        next[idx] = incoming;
        return next;
      });
    };

    const loadLabs = async () => {
      const { data, error } = await supabase
        .from(LAB_CLASSES_TABLE)
        .select("*")
        .returns<LabClassRow[]>();

      if (!isActive) return;

      if (error) {
        setLabsSyncMessage(`No se pudo cargar Supabase: ${error.message}`);
        return;
      }

      setLabs(data.map(toLab));
      setIsSupabaseEnabled(true);
      setLabsSyncMessage("Horarios sincronizados con Supabase");

      // Cargar inscripciones reales del usuario desde la BD
      if (currentUser) {
        const { data: enrollments, error: enrollError } = await supabase
          .from("lab_enrollments")
          .select("lab_class_id")
          .eq("student_email", currentUser.email);

        if (!enrollError && enrollments && isActive) {
          setEnrolledLabs(enrollments.map((e: any) => Number(e.lab_class_id)));
        }
      }
    };

    loadLabs();

    const channel = supabase
      .channel("lab-classes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: LAB_CLASSES_TABLE },
        (payload) => {
          if (!isActive) return;

          console.log("Supabase Realtime event received:", payload);

          if (payload.eventType === "DELETE") {
            const deleted = payload.old as LabClassRow;
            setLabs((previous) => previous.filter((lab) => lab.id !== deleted.id));
            return;
          }

          const row = payload.new as LabClassRow;
          mergeLab(toLab(row));
        }
      )
      .subscribe((status, err) => {
        console.log(`Realtime subscription status: ${status}`, err || "");
        if (status === "CHANNEL_ERROR") {
          setLabsSyncMessage("Error de conexión en tiempo real con Supabase. Verifica políticas RLS/Replicación.");
        }
      });

    return () => {
      isActive = false;
      channel.unsubscribe();
    };
  }, [supabase, currentUser]);

  // Live real-time vacancies fluctuation simulator
  useEffect(() => {
    if (isSupabaseEnabled) {
      return;
    }

    const interval = setInterval(() => {
      setLabs(prevLabs =>
        prevLabs.map(lab => {
          if (Math.random() > 0.7) {
            const change = Math.random() > 0.5 ? 1 : -1;
            const newVacancies = Math.max(0, Math.min(lab.capacity, lab.vacancies + change));
            return { ...lab, vacancies: newVacancies };
          }
          return lab;
        })
      );
    }, 4500);
    return () => clearInterval(interval);
  }, [isSupabaseEnabled]);

  const getLabNameByRoom = (room: string) => {
    const labMatch = SCHOOL_LABS.find((lab) => lab.room === room);
    return labMatch ? labMatch.name : "Laboratorio";
  };

  const handleEnrollment = async (labId: number) => {
    if (!currentUser) return;
    const target = labs.find((lab) => lab.id === labId);
    if (!target) return;

    const alreadyEnrolled = enrolledLabs.includes(labId);

    if (!alreadyEnrolled && target.vacancies === 0) {
      return;
    }

    if (isSupabaseEnabled && supabase) {
      if (alreadyEnrolled) {
        // Desmatricular del curso en Supabase
        const { error } = await supabase
          .from("lab_enrollments")
          .delete()
          .eq("lab_class_id", labId)
          .eq("student_email", currentUser.email);

        if (error) {
          setLabsSyncMessage(`No se pudo cancelar la inscripción: ${error.message}`);
          return;
        }
      } else {
        // Matricularse en Supabase con los datos reales
        const { error } = await supabase
          .from("lab_enrollments")
          .insert({
            lab_class_id: labId,
            student_name: currentUser.name,
            student_email: currentUser.email
          });

        if (error) {
          setLabsSyncMessage(`No se pudo realizar la inscripción: ${error.message}`);
          return;
        }
      }
      
      // El trigger en Supabase actualizará la columna vacancies en la tabla lab_classes automáticamente
      // e informará a todos los clientes por Realtime. Actualizamos el estado local por velocidad de respuesta:
      setEnrolledLabs((previous) =>
        alreadyEnrolled ? previous.filter((id) => id !== labId) : [...previous, labId]
      );
    } else {
      // Fallback local sin Supabase
      const nextVacancies = alreadyEnrolled
        ? Math.min(target.capacity, target.vacancies + 1)
        : Math.max(0, target.vacancies - 1);

      setEnrolledLabs((previous) =>
        alreadyEnrolled ? previous.filter((id) => id !== labId) : [...previous, labId]
      );

      setLabs((previous) =>
        previous.map((lab) =>
          lab.id === labId
            ? { ...lab, vacancies: nextVacancies }
            : lab
        )
      );
    }
    
    setIsDetailModalOpen(false);
  };

  const openCreateModal = () => {
    setFormCourse(COURSE_POOL[0]);
    setFormDay("Lunes");
    setFormStartHour(8);
    setFormDuration(3);
    setFormRoom(SCHOOL_LABS[0].room);
    setFormTeacher(TEACHER_POOL[0]);
    setIsCreateModalOpen(true);
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    const newLabDraft: Omit<Lab, "id"> = {
      name: getLabNameByRoom(formRoom),
      course: formCourse,
      day: formDay,
      startHour: Number(formStartHour),
      durationHours: Number(formDuration),
      room: formRoom,
      teacher: formTeacher,
      capacity: 20,
      vacancies: 20
    };

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from(LAB_CLASSES_TABLE)
        .insert(toLabInsert(newLabDraft))
        .select("*")
        .returns<LabClassRow[]>();

      if (error) {
        setLabsSyncMessage(`No se pudo crear el horario: ${error.message}`);
        return;
      }

      const created = data[0];
      if (created) {
        setLabs((previous) => [...previous, toLab(created)]);
      }
      setIsCreateModalOpen(false);
      return;
    }

    const newLab: Lab = {
      id: Date.now(),
      ...newLabDraft,
    };
    setLabs((previous) => [...previous, newLab]);
    setIsCreateModalOpen(false);
  };

  const openEditModal = (lab: Lab) => {
    setSelectedLab(lab);
    setFormCourse(lab.course);
    setFormDay(lab.day);
    setFormStartHour(lab.startHour);
    setFormDuration(lab.durationHours);
    setFormRoom(lab.room);
    setFormTeacher(lab.teacher);
    setIsEditModalOpen(true);
    setIsDetailModalOpen(false);
  };

  const handleEditLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLab) return;

    const updatedDraft: Omit<Lab, "id"> = {
      name: getLabNameByRoom(formRoom),
      course: formCourse,
      day: formDay,
      startHour: Number(formStartHour),
      durationHours: Number(formDuration),
      room: formRoom,
      teacher: formTeacher,
      capacity: selectedLab.capacity,
      vacancies: selectedLab.vacancies,
    };

    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from(LAB_CLASSES_TABLE)
        .update(toLabInsert(updatedDraft))
        .eq("id", selectedLab.id);

      if (error) {
        setLabsSyncMessage(`No se pudo actualizar el horario: ${error.message}`);
        return;
      }
    }

    setLabs((previous) =>
      previous.map((lab) =>
        lab.id === selectedLab.id
          ? { id: selectedLab.id, ...updatedDraft }
          : lab
      )
    );
    setIsEditModalOpen(false);
  };

  const handleDeleteLab = async (labId: number) => {
    if (confirm("¿Estás seguro de eliminar este laboratorio?")) {
      if (isSupabaseEnabled && supabase) {
        const { error } = await supabase
          .from(LAB_CLASSES_TABLE)
          .delete()
          .eq("id", labId);

        if (error) {
          setLabsSyncMessage(`No se pudo eliminar el horario: ${error.message}`);
          return;
        }
      }

      setLabs((previous) => previous.filter((lab) => lab.id !== labId));
      setIsDetailModalOpen(false);
    }
  };

  const dayIndex = (day: string) => DAYS_OF_WEEK.indexOf(day);
  const getVacancyColorClass = (vacancies: number) => {
    if (vacancies === 0) return "text-red-500";
    if (vacancies <= 10) return "text-amber-500";
    return "text-emerald-500 dark:text-emerald-400";
  };
  const laboratorySchedules = SCHOOL_LABS.map(({ name, room }) => ({
    name,
    room,
    schedules: labs
      .filter((lab) => lab.room === room)
      .sort((a, b) => {
        const dayOrder = dayIndex(a.day) - dayIndex(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.startHour - b.startHour;
      }),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Banner header */}
        <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 bg-white dark:bg-slate-900/60 shadow-sm transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h2 className="text-lg font-bold">Matrícula de Laboratorios (Horario)</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Todos los laboratorios tienen cupo máximo de 20 vacantes y duran entre 2 a 4 horas. Horarios de Lunes a Viernes de 7:00 AM a 8:00 PM.
            </p>
          </div>

          {currentUser && (currentUser.role === "admin" || currentUser.role === "docente") && (
            <button
              onClick={openCreateModal}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-amber-500/10 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              Crear Laboratorio
            </button>
          )}
        </div>

        <div className="text-xs rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/40 px-4 py-2 text-slate-600 dark:text-slate-350">
          {labsSyncMessage}
        </div>

        {/* Laboratory schedules (calendar mode) */}
        <div className="space-y-4">
          {laboratorySchedules.map(({ name, room, schedules }) => (
            <section key={room} className="border border-slate-250 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/60 shadow-sm transition-all p-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Salón {room} · {schedules.length} clases</p>
              </div>

              {schedules.length > 0 ? (
                <div className="overflow-x-auto mt-3">
                  <div className="min-w-200 grid grid-cols-6 gap-2">
                    <div className="text-center font-bold text-xs py-2 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80">
                      Hora
                    </div>
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={`${room}-${day}`} className="text-center font-bold text-xs py-2 border-b border-slate-100 dark:border-slate-800/80">
                        {day}
                      </div>
                    ))}

                    {HOURS_RANGE.map((hour) => {
                      const hourString = `${hour.toString().padStart(2, "0")}:00`;

                      return (
                        <React.Fragment key={`${room}-${hour}`}>
                          <div className="text-center text-xs py-3 text-slate-400 dark:text-slate-500 flex items-center justify-center font-medium border-r border-slate-100 dark:border-slate-800/40">
                            {hourString}
                          </div>

                          {DAYS_OF_WEEK.map((day) => {
                            const classAtSlot = schedules.find((s) => s.day === day && s.startHour === hour);
                            const isInsideClass = schedules.some(
                              (s) => s.day === day && hour > s.startHour && hour < s.startHour + s.durationHours
                            );

                            if (classAtSlot) {
                              const isEnrolled = enrolledLabs.includes(classAtSlot.id);
                              const isFull = classAtSlot.vacancies === 0;
                              const vacancyColorClass = getVacancyColorClass(classAtSlot.vacancies);

                              return (
                                <div
                                  key={`${room}-${day}-${hour}`}
                                  onClick={() => {
                                    setSelectedLab(classAtSlot);
                                    setIsDetailModalOpen(true);
                                  }}
                                  style={{ gridRow: `span ${classAtSlot.durationHours}` }}
                                  className={`rounded-xl p-2 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between border shadow-sm hover:scale-[1.01] ${
                                    isEnrolled
                                      ? "bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400"
                                      : isFull
                                      ? "bg-red-500/10 border-red-500/30 text-red-500 dark:bg-red-950/20"
                                      : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-amber-500/50"
                                  }`}
                                >
                                  <div>
                                    <h4 className="font-extrabold text-[11px] leading-tight">{classAtSlot.course}</h4>
                                    <p className={`text-[10px] mt-1 truncate ${isEnrolled ? "text-slate-900" : "text-slate-500 dark:text-slate-400"}`}>
                                      {classAtSlot.teacher}
                                    </p>
                                  </div>
                                  <div className="mt-2 space-y-0.5">
                                    <p className={`text-[10px] font-bold ${isEnrolled ? "text-slate-900" : "text-slate-500 dark:text-slate-400"}`}>
                                      {classAtSlot.startHour}:00 - {classAtSlot.startHour + classAtSlot.durationHours}:00
                                    </p>
                                    <p className={`text-[10px] font-black ${vacancyColorClass}`}>
                                      Vacantes: {classAtSlot.vacancies}
                                    </p>
                                  </div>
                                </div>
                              );
                            }

                            if (isInsideClass) {
                              return null;
                            }

                            return (
                              <div
                                key={`${room}-${day}-${hour}-empty`}
                                className="rounded-xl border border-dashed border-slate-100 dark:border-slate-850 min-h-12"
                              />
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Sin horarios registrados.</p>
              )}
            </section>
          ))}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {isDetailModalOpen && selectedLab && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-6 text-slate-100">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">{selectedLab.room}</span>
                <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-200">✕</button>
              </div>
              <h3 className="text-lg font-bold mt-1 text-slate-100">{selectedLab.name}</h3>
              <p className="text-xs text-slate-400">{selectedLab.course}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-950 p-4 rounded-2xl border border-slate-850">
              <div>
                <span className="text-[10px] text-slate-500 block">Horario</span>
                <span className="font-semibold text-slate-350">{selectedLab.day}</span>
                <span className="block text-xs text-slate-450">{selectedLab.startHour}:00 - {selectedLab.startHour + selectedLab.durationHours}:00</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Duración</span>
                <span className="font-semibold text-slate-350">{selectedLab.durationHours} horas</span>
              </div>
              <div className="col-span-2 border-t border-slate-850 pt-2.5 mt-1">
                <span className="text-[10px] text-slate-500 block">Docente</span>
                <span className="font-semibold text-slate-300">{selectedLab.teacher}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <div>
                <span className="text-xs text-slate-500">Vacantes Restantes</span>
                <span className={`block text-lg font-black ${getVacancyColorClass(selectedLab.vacancies)}`}>
                  {selectedLab.vacancies} / {selectedLab.capacity}
                </span>
              </div>

              <div className="flex gap-2">
                {currentUser && (currentUser.role === "admin" || currentUser.role === "docente") && (
                  <button
                    onClick={() => openEditModal(selectedLab)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-all border border-slate-750"
                    title="Editar Horario"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}

                {currentUser && currentUser.role === "estudiante" && (
                  <button
                    onClick={() => handleEnrollment(selectedLab.id)}
                    disabled={selectedLab.vacancies === 0 && !enrolledLabs.includes(selectedLab.id)}
                    className={`px-6 py-3 rounded-xl text-xs font-bold transition-all ${
                      enrolledLabs.includes(selectedLab.id)
                        ? "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20"
                        : selectedLab.vacancies === 0
                        ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                        : "bg-amber-500 hover:bg-amber-400 text-slate-950"
                    }`}
                  >
                    {enrolledLabs.includes(selectedLab.id) ? "Desmatricular" : selectedLab.vacancies === 0 ? "Sin vacantes" : "Matricularse"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE LAB MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateLab} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 text-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold">Crear Horario de Laboratorio</h3>
              <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
            <div>
              <label className="text-[10px] text-slate-400 block font-semibold mb-1">Curso</label>
              <input
                type="text"
                list="course-options"
                value={formCourse}
                onChange={(e) => setFormCourse(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:border-amber-555 outline-none"
                required
              />
              <datalist id="course-options">
                {COURSE_POOL.map((course) => (
                  <option key={course} value={course} />
                ))}
              </datalist>
            </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Día</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-555"
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Hora Inicio</label>
                  <select
                    value={formStartHour}
                    onChange={(e) => setFormStartHour(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-555"
                  >
                    {HOURS_RANGE.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Duración (Horas)</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-555"
                  >
                    <option value={2}>2 Horas</option>
                    <option value={3}>3 Horas</option>
                    <option value={4}>4 Horas</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Laboratorio / Aula</label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:border-amber-555 outline-none"
                  >
                    {SCHOOL_LABS.map((lab) => (
                      <option key={lab.room} value={lab.room}>
                        {lab.name} - {lab.room}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-semibold mb-1">Docente Encargado</label>
                <input
                  type="text"
                  list="teacher-options"
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:border-amber-555 outline-none"
                  required
                />
                <datalist id="teacher-options">
                  {TEACHER_POOL.map((teacher) => (
                    <option key={teacher} value={teacher} />
                  ))}
                </datalist>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl text-xs transition-all mt-4"
            >
              Crear Horario
            </button>
          </form>
        </div>
      )}

      {/* EDIT LAB MODAL */}
      {isEditModalOpen && selectedLab && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditLab} className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 text-slate-100">
            <div className="flex justify-between items-center">
              <h3 className="text-md font-bold">Configurar Horario</h3>
              <button type="button" onClick={() => setIsEditModalOpen(false)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 block font-semibold mb-1">Curso</label>
                <input
                  type="text"
                  list="course-options"
                  value={formCourse}
                  onChange={(e) => setFormCourse(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:border-amber-555 outline-none"
                  required
                />
                <datalist id="course-options">
                  {COURSE_POOL.map((course) => (
                    <option key={course} value={course} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Día</label>
                  <select
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-555"
                  >
                    {DAYS_OF_WEEK.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Hora Inicio</label>
                  <select
                    value={formStartHour}
                    onChange={(e) => setFormStartHour(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-555"
                  >
                    {HOURS_RANGE.map(h => <option key={h} value={h}>{h}:00</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Duración (Horas)</label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 outline-none focus:border-amber-555"
                  >
                    <option value={2}>2 Horas</option>
                    <option value={3}>3 Horas</option>
                    <option value={4}>4 Horas</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block font-semibold mb-1">Laboratorio / Aula</label>
                  <select
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:border-amber-555 outline-none"
                  >
                    {SCHOOL_LABS.map((lab) => (
                      <option key={lab.room} value={lab.room}>
                        {lab.name} - {lab.room}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block font-semibold mb-1">Docente</label>
                <input
                  type="text"
                  list="teacher-options"
                  value={formTeacher}
                  onChange={(e) => setFormTeacher(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-350 focus:border-amber-555 outline-none"
                  required
                />
                <datalist id="teacher-options">
                  {TEACHER_POOL.map((teacher) => (
                    <option key={teacher} value={teacher} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => handleDeleteLab(selectedLab.id)}
                className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Eliminar
              </button>
              <button
                type="submit"
                className="flex-2 bg-amber-500 hover:bg-amber-400 text-slate-955 font-bold py-3 rounded-xl text-xs transition-all"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
