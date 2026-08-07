"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../components/DashboardLayout";
import { Calendar, Download, Users, X, Info } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import * as XLSX from "xlsx";

interface Lab {
  id: number;
  name: string;
  course: string;
  day: string; // 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes'
  startHour: number; // 7 to 20
  durationHours: number; // 2 to 4
  room: string;
  teacher: string;
  capacity: number;
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

interface Student {
  number: number;
  fullName: string;
  email: string;
}

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const HOURS_RANGE = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM (20:00)
const LAB_CLASSES_TABLE = "lab_classes";

const SCHOOL_LABS = [
  { name: "Laboratorio 1", room: "H-212" },
  { name: "Laboratorio 2", room: "H-213" },
  { name: "Laboratorio 3", room: "H-214" },
  { name: "Laboratorio 4", room: "H-218" },
  { name: "Laboratorio 5", room: "H-219" },
] as const;

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

const COURSE_POOL = [
  "Estadística Aplicada",
  "Gestión de Datos de Información",
  "Estructura de Datos Fundamentales y Algoritmos",
  "Métodos Numéricos",
  "Pruebas de Aseguramiento de Calidad de Software",
  "Redes de Datos",
  "Modelamiento de Datos",
  "Diseño de Software",
];

const TEACHER_POOL = [
  "TAPIA CALDERÓN, Guillermo",
  "HUARCAYA VICENTE, Gladys",
  "MONTES DE OCA ALCARRÁZ, José Ciro",
  "MENESES YARANGA, Óscar",
];

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

// Deterministic mock student list generator based on class ID and name
function generateEnrolledStudents(labId: number, courseName: string, totalEnrolled: number): Student[] {
  const FIRST_NAMES = ["Juan", "María", "Carlos", "Ana", "Luis", "Gabriela", "Pedro", "Sofía", "José", "Lucía", "Diego", "Elena", "Manuel", "Isabel", "Fernando", "Camila", "Jorge", "Valentina", "Ricardo", "Alejandra"];
  const LAST_NAMES = ["Sosa", "Quispe", "Mendoza", "Alvarado", "Chávez", "Rodríguez", "Sánchez", "Gómez", "Flores", "Díaz", "Vásquez", "Pérez", "Ramos", "Torres", "Castro", "Ortiz", "Ruiz", "Guzmán", "Morales", "Herrera"];

  const students: Student[] = [];
  
  // Use a simple seed pseudo-random generator
  let seed = labId + courseName.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const count = Math.max(1, totalEnrolled);
  const selectedPairs = new Set<string>();

  while (students.length < count) {
    const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
    const lastName1 = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    const lastName2 = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];
    const lastName = `${lastName1} ${lastName2}`;
    const pair = `${lastName}, ${firstName}`;

    if (!selectedPairs.has(pair)) {
      selectedPairs.add(pair);
      
      // Generate email using initials + number
      const cleanLastName = lastName1.toLowerCase().replace(/[^a-z]/g, "");
      const cleanFirstName = firstName.toLowerCase().charAt(0);
      const studentId = Math.floor(2020 + random() * 6).toString() + Math.floor(1000 + random() * 9000).toString();
      const email = `${cleanFirstName}${cleanLastName}@sistemas.edu.pe`;
      
      students.push({
        number: 0, // Assigned later after sorting
        fullName: `${firstName} ${lastName}`,
        email,
      });
    }
  }

  // Sort alphabetically by full name
  students.sort((a, b) => {
    return a.fullName.localeCompare(b.fullName, "es");
  });

  // Assign sequence numbers
  return students.map((student, index) => ({
    ...student,
    number: index + 1,
  }));
}

export default function InscritosPage() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  const [currentUser, setCurrentUser] = useState<{ name: string; role: string } | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [isSupabaseEnabled, setIsSupabaseEnabled] = useState(false);
  const [labsSyncMessage, setLabsSyncMessage] = useState<string>("Sincronizando...");
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [mounted, setMounted] = useState(false);

  // Auth and role check
  useEffect(() => {
    const stored = localStorage.getItem("labsy_user");
    if (!stored) {
      router.push("/");
      return;
    }

    const user = JSON.parse(stored);
    if (user.role !== "docente" && user.role !== "admin") {
      router.push("/inicio");
      return;
    }

    setCurrentUser(user);
    setMounted(true);
  }, [router]);

  // Load labs from Supabase/Local fallback
  useEffect(() => {
    if (!mounted) return;

    if (!supabase) {
      setLabsSyncMessage("Modo local activo");
      return;
    }

    let isActive = true;

    const loadLabs = async () => {
      const { data, error } = await supabase
        .from(LAB_CLASSES_TABLE)
        .select("*")
        .returns<LabClassRow[]>();

      if (!isActive) return;

      if (error) {
        setLabsSyncMessage(`Error: ${error.message}`);
        return;
      }

      setLabs(data.map(toLab));
      setIsSupabaseEnabled(true);
      setLabsSyncMessage("Sincronizado con Supabase");
    };

    loadLabs();

    const channel = supabase
      .channel("inscritos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: LAB_CLASSES_TABLE },
        (payload) => {
          if (!isActive) return;

          if (payload.eventType === "DELETE") {
            const deleted = payload.old as LabClassRow;
            setLabs((previous) => previous.filter((lab) => lab.id !== deleted.id));
            return;
          }

          const row = payload.new as LabClassRow;
          const incoming = toLab(row);
          setLabs((previous) => {
            const idx = previous.findIndex((lab) => lab.id === incoming.id);
            if (idx === -1) return [...previous, incoming];
            const next = [...previous];
            next[idx] = incoming;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      isActive = false;
      channel.unsubscribe();
    };
  }, [mounted, supabase]);

  const handleLabClick = async (lab: Lab) => {
    setSelectedLab(lab);
    setIsStudentModalOpen(true);
    setEnrolledStudents([]);

    if (supabase && isSupabaseEnabled) {
      const { data, error } = await supabase
        .from("lab_enrollments")
        .select("student_name, student_email")
        .eq("lab_class_id", lab.id);

      if (!error && data) {
        const list: Student[] = data.map((item, idx) => {
          return {
            number: idx + 1,
            fullName: item.student_name || "",
            email: item.student_email,
          };
        });

        // Sort alphabetically by full name
        list.sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));

        // Re-assign sequence numbers after sorting
        const sortedList = list.map((student, index) => ({
          ...student,
          number: index + 1,
        }));

        setEnrolledStudents(sortedList);
      } else {
        const totalEnrolled = lab.capacity - lab.vacancies;
        const list = generateEnrolledStudents(lab.id, lab.course, totalEnrolled);
        setEnrolledStudents(list);
      }
    } else {
      const totalEnrolled = lab.capacity - lab.vacancies;
      const list = generateEnrolledStudents(lab.id, lab.course, totalEnrolled);
      setEnrolledStudents(list);
    }
  };

  const exportToExcel = () => {
    if (!selectedLab) return;

    const courseSanitized = selectedLab.course.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `inscritos_${selectedLab.room}_${courseSanitized}.xlsx`;

    const headerInfo = [
      ["PORTAL ACADÉMICO LABSY"],
      [`Reporte de Alumnos Inscritos - Laboratorio: ${selectedLab.room}`],
      [`Curso: ${selectedLab.course}`],
      [`Docente: ${selectedLab.teacher}`],
      [`Día: ${selectedLab.day}`],
      [`Hora: ${selectedLab.startHour}:00 - ${selectedLab.startHour + selectedLab.durationHours}:00`],
      [],
      ["N°", "Alumno", "Correo Electrónico", "Asistencia"]
    ];

    const studentRows = enrolledStudents.map((student, idx) => [
      idx + 1,
      student.fullName,
      student.email,
      ""
    ]);

    const footer = [
      [],
      ["Labsy - Desarrollado por CEIS 2027"]
    ];

    const aoa = [...headerInfo, ...studentRows, ...footer];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 45 },
      { wch: 35 },
      { wch: 15 }
    ];

    worksheet["!views"] = [{ showGridLines: true }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inscritos");

    XLSX.writeFile(workbook, fileName);
  };

  if (!mounted || !currentUser) {
    return null;
  }

  // Group schedules by room
  const laboratorySchedules = SCHOOL_LABS.map((roomDef) => {
    const schedules = labs.filter((lab) => lab.room === roomDef.room);
    return {
      name: roomDef.name,
      room: roomDef.room,
      schedules,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <Users className="h-6 w-6 text-amber-500" />
              Gestión de Inscritos
            </h2>
            <p className="text-xs text-slate-400">
              Visualiza los alumnos inscritos en cada horario y exporta los reportes de asistencia para Excel.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-450 self-start sm:self-auto">
            {labsSyncMessage}
          </span>
        </div>

        {/* Calendar Mode Grid */}
        <div className="space-y-6">
          {laboratorySchedules.map(({ name, room, schedules }) => (
            <section key={room} className="border border-slate-200 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900/60 shadow-sm p-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">{name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Salón {room} · {schedules.length} clases</p>
              </div>

              {schedules.length > 0 ? (
                <div className="overflow-x-auto mt-3">
                  <div className="min-w-[800px] grid grid-cols-6 gap-2">
                    <div className="text-center font-bold text-xs py-2 text-slate-400 dark:text-slate-550 border-b border-slate-100 dark:border-slate-800/80">
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
                              const totalEnrolled = classAtSlot.capacity - classAtSlot.vacancies;

                              return (
                                <div
                                  key={`${room}-${day}-${hour}`}
                                  onClick={() => handleLabClick(classAtSlot)}
                                  style={{ gridRow: `span ${classAtSlot.durationHours}` }}
                                  className="rounded-xl p-3 text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between border bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-850 hover:border-amber-500/70 hover:scale-[1.01] shadow-xs"
                                >
                                  <div>
                                    <h4 className="font-extrabold text-[11px] leading-tight text-slate-800 dark:text-slate-200">{classAtSlot.course}</h4>
                                    <p className="text-[10px] mt-1 truncate text-slate-500 dark:text-slate-400">
                                      {classAtSlot.teacher}
                                    </p>
                                  </div>
                                  <div className="mt-3 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                      {classAtSlot.startHour}:00 - {classAtSlot.startHour + classAtSlot.durationHours}:00
                                    </p>
                                    <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md">
                                      Inscritos: {totalEnrolled}
                                    </span>
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
                                className="rounded-xl border border-dashed border-slate-100 dark:border-gray-800 min-h-12"
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

      {/* STUDENT ENROLLMENTS MODAL */}
      {isStudentModalOpen && selectedLab && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 space-y-6 text-slate-100 max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-start shrink-0">
              <div>
                <span className="text-xs text-amber-500 font-bold uppercase tracking-widest">{selectedLab.room} · {selectedLab.name}</span>
                <h3 className="text-xl font-black mt-1">{selectedLab.course}</h3>
                <p className="text-xs text-slate-450 mt-1">Docente: {selectedLab.teacher}</p>
              </div>
              <button 
                onClick={() => setIsStudentModalOpen(false)} 
                className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 pr-1">
              {enrolledStudents.length > 0 ? (
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/50">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="px-4 py-3 text-center w-12">N°</th>
                        <th className="px-4 py-3">Alumno</th>
                        <th className="px-4 py-3">Correo Electrónico</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {enrolledStudents.map((student) => (
                        <tr key={student.number} className="hover:bg-slate-900/40">
                          <td className="px-4 py-3 text-center font-bold text-slate-500">{student.number}</td>
                          <td className="px-4 py-3 font-semibold text-slate-200">{student.fullName}</td>
                          <td className="px-4 py-3 text-slate-400">{student.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
                  <Info className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-450">No hay alumnos inscritos</p>
                  <p className="text-xs text-slate-550 mt-1">Este horario tiene todas sus vacantes libres.</p>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 shrink-0">
              <span className="text-xs text-slate-400">
                Total matriculados: <strong className="text-amber-500 font-black">{enrolledStudents.length}</strong> alumnos.
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setIsStudentModalOpen(false)}
                  className="flex-1 sm:flex-none border border-slate-800 hover:bg-slate-800 text-slate-300 font-bold px-5 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  Cerrar
                </button>
                {enrolledStudents.length > 0 && (
                  <button
                    onClick={exportToExcel}
                    className="flex-1 sm:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    Exportar para Excel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
