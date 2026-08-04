# Tabla de Inscripciones a Laboratorios (`lab_enrollments`)

Este archivo contiene el script SQL para crear la tabla de inscripciones (`lab_enrollments`) en Supabase, la cual vincula a los estudiantes autenticados con sus respectivos horarios de laboratorio.

## Script SQL de Creación

Ejecuta el siguiente script en el **SQL Editor** de tu panel de Supabase:

```sql
-- 1. CREAR LA TABLA DE MATRÍCULAS/INSCRITOS (lab_enrollments)
CREATE TABLE IF NOT EXISTS public.lab_enrollments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  lab_class_id bigint NOT NULL REFERENCES public.lab_classes(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_class_id, student_email) -- Evita inscripciones duplicadas al mismo horario
);

-- 2. CREAR ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
CREATE INDEX IF NOT EXISTS lab_enrollments_student_idx 
  ON public.lab_enrollments (student_email);
CREATE INDEX IF NOT EXISTS lab_enrollments_class_idx 
  ON public.lab_enrollments (lab_class_id);

-- 3. TRIGGER AUTOMÁTICO PARA ACTUALIZAR VACANTES EN LAB_CLASSES
CREATE OR REPLACE FUNCTION public.update_lab_class_vacancies()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF tg_op = 'INSERT' THEN
    UPDATE public.lab_classes
    SET vacancies = GREATEST(0, vacancies - 1)
    WHERE id = NEW.lab_class_id;
    RETURN NEW;
  ELSIF tg_op = 'DELETE' THEN
    UPDATE public.lab_classes
    SET vacancies = LEAST(capacity, vacancies + 1)
    WHERE id = OLD.lab_class_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_lab_class_vacancies ON public.lab_enrollments;
CREATE TRIGGER trg_update_lab_class_vacancies
AFTER INSERT OR DELETE ON public.lab_enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_lab_class_vacancies();

-- 4. HABILITAR TIEMPO REAL (REALTIME) PARA LA TABLA
ALTER TABLE public.lab_enrollments REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'lab_enrollments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.lab_enrollments;
  END IF;
END $$;
```

## Características del Diseño
- **Clave Foránea (`lab_class_id`)**: Vincula a la tabla de clases con comportamiento `ON DELETE CASCADE` para eliminar inscripciones si se borra una clase.
- **Restricción de Unicidad**: Garantiza que un correo de estudiante no se registre más de una vez en el mismo horario de laboratorio.
- **Trigger Automatizado**: Ajusta dinámicamente la columna `vacancies` (vacantes) en `lab_classes` cada vez que un estudiante se inscribe o cancela su inscripción.
- **Realtime**: Sincroniza al instante los cambios de vacantes e inscripciones con todos los usuarios conectados.
