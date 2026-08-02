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

create index if not exists lab_classes_room_day_start_idx
  on public.lab_classes (room, day, start_hour);

create or replace function public.set_lab_classes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_lab_classes_updated_at on public.lab_classes;
create trigger trg_lab_classes_updated_at
before update on public.lab_classes
for each row
execute function public.set_lab_classes_updated_at();
