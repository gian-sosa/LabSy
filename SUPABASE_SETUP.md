# Configuración de la Base de Datos en Supabase

Este documento contiene el script de PostgreSQL necesario para configurar la base de datos en Supabase para el correcto funcionamiento del sistema de horarios de laboratorios (`LabSy`).

## Instrucciones de Instalación

1. Ve a tu panel de control de [Supabase](https://supabase.com).
2. Entra a tu proyecto `pobglpcfcokzysfiwlqn`.
3. Ve a la sección **SQL Editor** en el menú lateral izquierdo.
4. Crea un nuevo query haciendo clic en **New query**.
5. Copia y pega el código SQL que se presenta a continuación.
6. Haz clic en **Run** para ejecutar el script y crear la tabla, índices, triggers y habilitar el tiempo real (Realtime).

---

## Código PostgreSQL

```sql
-- 1. Crear la tabla de clases/horarios de laboratorio
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

-- 2. Crear un índice para optimizar las búsquedas por salón, día y hora de inicio
create index if not exists lab_classes_room_day_start_idx
  on public.lab_classes (room, day, start_hour);

-- 3. Crear función para actualizar automáticamente el campo `updated_at`
create or replace function public.set_lab_classes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 4. Crear trigger para disparar la función antes de cada actualización
drop trigger if exists trg_lab_classes_updated_at on public.lab_classes;
create trigger trg_lab_classes_updated_at
before update on public.lab_classes
for each row
execute function public.set_lab_classes_updated_at();

-- 5. Habilitar publicación Realtime en la tabla lab_classes para sincronización en tiempo real
alter table public.lab_classes replica identity full;

-- Agregar la tabla a la publicación en tiempo real de Supabase de manera segura
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'lab_classes'
  ) then
    alter publication supabase_realtime add table public.lab_classes;
  end if;
end $$;

```

---

## Habilitar Políticas RLS (Row Level Security) - Opcional
Si deseas proteger tu base de datos para producción, puedes habilitar RLS y añadir políticas de lectura pública y escritura solo para usuarios autenticados:

```sql
-- Habilitar RLS
alter table public.lab_classes enable row level security;

-- Política: Cualquiera puede leer los horarios
create policy "Permitir lectura pública"
  on public.lab_classes for select
  using (true);

-- Política: Solo usuarios autenticados pueden insertar/modificar/eliminar
create policy "Permitir escritura a usuarios autenticados"
  on public.lab_classes for all
  to authenticated
  using (true)
  with check (true);
```
