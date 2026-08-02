## LabSy

Aplicación Next.js para gestión visual de horarios de laboratorios.

## Ejecutar en local

```bash
npm install
npm run dev
```

## Conexión con Supabase

Se dejó integrada la base para Supabase en frontend:

- Cliente: `src/lib/supabase/client.ts`
- Tabla esperada: `public.lab_classes`
- Script SQL: `supabase/lab_classes.sql`

### 1) Configurar variables de entorno

1. Copia `.env.example` a `.env.local`
2. Completa:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2) Crear tabla en Supabase

Ejecuta el script `supabase/lab_classes.sql` en el SQL Editor de tu proyecto.

### 3) Activar Realtime para `lab_classes`

En Supabase, habilita Realtime para la tabla `public.lab_classes` para recibir actualizaciones en vivo en la vista calendario.

> Si no hay variables de entorno configuradas, la página de laboratorio funciona en modo local con datos semilla.
