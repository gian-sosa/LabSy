# Configuración de la Base de Datos en Supabase

Este documento contiene el script de PostgreSQL necesario para configurar la base de datos en Supabase para el correcto funcionamiento del sistema de horarios y matrículas de laboratorios (`LabSy`).

## Instrucciones de Instalación

1. Ve a tu panel de control de [Supabase](https://supabase.com).
2. Entra a tu proyecto `pobglpcfcokzysfiwlqn`.
3. Ve a la sección **SQL Editor** en el menú lateral izquierdo.
4. Crea un nuevo query haciendo clic en **New query**.
5. Copia y pega el código SQL que se presenta a continuación.
6. Haz clic en **Run** para ejecutar el script completo. Esto configurará las tablas, índices, funciones, triggers automáticos y el tiempo real (Realtime).

---

## Código PostgreSQL

```sql
-- =========================================================================
-- 1. CREAR LA TABLA DE HORARIOS (lab_classes)
-- =========================================================================
create table if not exists public.lab_classes (
  id bigint generated always as identity primary key,
  lab_name text not null,
  course text not null,
  day text not null check (day in ('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes')),
  start_hour int not null check (start_hour >= 7 and start_hour <= 20),
  duration_hours int not null check (duration_hours >= 1 and duration_hours <= 4),
  room text not null,
  teacher text not null,
  capacity int not null default 20 check (capacity > 0),
  vacancies int not null default 20 check (vacancies >= 0 and vacancies <= capacity),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Crear índice para optimizar búsquedas
create index if not exists lab_classes_room_day_start_idx
  on public.lab_classes (room, day, start_hour);

-- Función para actualizar updated_at
create or replace function public.set_lab_classes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Trigger para updated_at
drop trigger if exists trg_lab_classes_updated_at on public.lab_classes;
create trigger trg_lab_classes_updated_at
before update on public.lab_classes
for each row execute function public.set_lab_classes_updated_at();


-- =========================================================================
-- 2. CREAR LA TABLA DE MATRÍCULAS/INSCRITOS (lab_enrollments)
-- =========================================================================
create table if not exists public.lab_enrollments (
  id bigint generated always as identity primary key,
  lab_class_id bigint not null references public.lab_classes(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  created_at timestamptz not null default now(),
  unique (lab_class_id, student_email) -- Evita inscripciones duplicadas
);

-- Crear índice para búsquedas por estudiante y clase
create index if not exists lab_enrollments_student_idx 
  on public.lab_enrollments (student_email);
create index if not exists lab_enrollments_class_idx 
  on public.lab_enrollments (lab_class_id);


-- =========================================================================
-- 3. TRIGGER AUTOMÁTICO PARA ACTUALIZAR VACANTES EN LAB_CLASSES
-- =========================================================================
create or replace function public.update_lab_class_vacancies()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.lab_classes
    set vacancies = greatest(0, vacancies - 1)
    where id = new.lab_class_id;
    return new;
  elsif tg_op = 'DELETE' then
    update public.lab_classes
    set vacancies = least(capacity, vacancies + 1)
    where id = old.lab_class_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_update_lab_class_vacancies on public.lab_enrollments;
create trigger trg_update_lab_class_vacancies
after insert or delete on public.lab_enrollments
for each row execute function public.update_lab_class_vacancies();


-- =========================================================================
-- 4. CONFIGURAR REPLICA IDENTITY Y REALTIME
-- =========================================================================
alter table public.lab_classes replica identity full;
alter table public.lab_enrollments replica identity full;

-- Agregar tablas a la publicación de tiempo real de Supabase
do $$
begin
  -- Registrar lab_classes en tiempo real
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lab_classes'
  ) then
    alter publication supabase_realtime add table public.lab_classes;
  end if;

  -- Registrar lab_enrollments en tiempo real
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'lab_enrollments'
  ) then
    alter publication supabase_realtime add table public.lab_enrollments;
  end if;
end $$;
```

---

## Habilitar Políticas RLS (Row Level Security) - Opcional

Si deseas que la base de datos sea segura en producción, puedes aplicar las siguientes políticas de seguridad:

```sql
-- 1. Habilitar RLS en ambas tablas
alter table public.lab_classes enable row level security;
alter table public.lab_enrollments enable row level security;

-- 2. Políticas para lab_classes
create policy "Lectura pública de clases" 
  on public.lab_classes for select using (true);
create policy "Modificación de clases por usuarios autenticados" 
  on public.lab_classes for all to authenticated using (true) with check (true);

-- 3. Políticas para lab_enrollments
create policy "Lectura pública de inscripciones" 
  on public.lab_enrollments for select using (true);
create policy "Inscripción/Desinscripción para usuarios autenticados" 
  on public.lab_enrollments for all to authenticated using (true) with check (true);
```
