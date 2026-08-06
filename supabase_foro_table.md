# Configuración del Foro y Almacenamiento de Imágenes (`forum_posts`)

Este documento contiene el script de PostgreSQL necesario para configurar la base de datos en Supabase para el foro estudiantil, la configuración de políticas RLS, la configuración del almacenamiento (Storage) y el algoritmo de compresión de imágenes en el cliente.

---

## 1. Código PostgreSQL (Tablas y Realtime)

Ejecuta el siguiente script en el **SQL Editor** de tu panel de Supabase para crear la tabla de posts del foro y configurar las actualizaciones en tiempo real.

```sql
-- =========================================================================
-- 1. CREAR LA TABLA DE PUBLICACIONES DEL FORO (forum_posts)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  author_name text NOT NULL,
  author_role text NOT NULL,
  author_avatar text,
  content text NOT NULL,
  image_url text, -- Guarda la URL de la imagen subida (comprimida)
  likes int NOT NULL DEFAULT 0,
  comments int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Crear índice para optimizar la consulta por fecha de creación (orden descendente)
CREATE INDEX IF NOT EXISTS forum_posts_created_at_idx 
  ON public.forum_posts (created_at DESC);

-- Función para actualizar automaticamente updated_at
CREATE OR REPLACE FUNCTION public.set_forum_posts_updated_at()
RETURNS trigger LANGUAGE plpgsql as $$
BEGIN
  new.updated_at = now();
  return new;
END;
$$;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS trg_forum_posts_updated_at ON public.forum_posts;
CREATE TRIGGER trg_forum_posts_updated_at
BEFORE UPDATE ON public.forum_posts
FOR EACH ROW EXECUTE FUNCTION public.set_forum_posts_updated_at();

-- =========================================================================
-- 2. HABILITAR TIEMPO REAL (REALTIME)
-- =========================================================================
ALTER TABLE public.forum_posts REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'forum_posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;
  END IF;
END $$;
```

---

## 2. Políticas RLS (Row Level Security)

Para garantizar la seguridad de la base de datos permitiendo operaciones desde nuestra aplicación, ejecuta el siguiente bloque SQL:

```sql
-- Habilitar RLS en la tabla
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas conflictivas anteriores si existen
DROP POLICY IF EXISTS "Lectura pública de publicaciones" ON public.forum_posts;
DROP POLICY IF EXISTS "Inserción de publicaciones" ON public.forum_posts;
DROP POLICY IF EXISTS "Eliminación de publicaciones" ON public.forum_posts;

-- Crear nuevas políticas
CREATE POLICY "Lectura pública de publicaciones" 
  ON public.forum_posts FOR SELECT USING (true);

CREATE POLICY "Inserción de publicaciones" 
  ON public.forum_posts FOR INSERT WITH CHECK (true);

CREATE POLICY "Eliminación de publicaciones" 
  ON public.forum_posts FOR DELETE USING (true);
```

---

## 3. Configuración de Supabase Storage para Imágenes (Opcional)

Si deseas subir las imágenes directamente a un Storage Bucket en vez de almacenarlas como Base64 (que se puede guardar en el campo `image_url` en modo desarrollo o local), sigue estos pasos:

1. Ve a la pestaña **Storage** en tu panel de Supabase.
2. Haz clic en **New Bucket** y nómbralo `forum-images`.
3. Configúralo como **Public** (para que cualquier persona pueda leer las imágenes).
4. Agrega las políticas de Storage para permitir la inserción y lectura de archivos:
   - Política de lectura pública: Permitir `SELECT` para todos los usuarios.
   - Política de subida pública/autenticada: Permitir `INSERT` en la carpeta o bucket para guardar las fotos comprimidas.

---

## 4. Algoritmo de Compresión de Imágenes en el Cliente

Para evitar que los usuarios suban imágenes pesadas que ralenticen la base de datos y la carga del sitio web, se implementa una compresión del lado del cliente utilizando **HTML5 Canvas**. Este algoritmo reduce las dimensiones máximas (manteniendo la relación de aspecto) y disminuye la calidad de la compresión.

Aquí está la función que realiza la compresión:

```typescript
/**
 * Comprime una imagen en el lado del cliente utilizando HTML5 Canvas.
 * 
 * @param file El archivo original tipo File seleccionado por el usuario.
 * @param maxWidth Ancho máximo permitido para la imagen resultante.
 * @param maxHeight Alto máximo permitido para la imagen resultante.
 * @param quality Calidad de compresión entre 0.0 y 1.0.
 * @returns Promesa que resuelve a un string Base64 con la imagen comprimida.
 */
export const compressImage = (
  file: File,
  maxWidth = 1000,
  maxHeight = 1000,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Verificar que sea un archivo de imagen
    if (!file.type.startsWith("image/")) {
      reject(new Error("El archivo no es una imagen válida"));
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

        // Mantener la relación de aspecto
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
          reject(new Error("No se pudo obtener el contexto 2D del Canvas"));
          return;
        }

        // Dibujar la imagen redimensionada en el canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a JPEG comprimido
        const compressedBase64 = canvas.toDataURL("image/jpeg", quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
```

### Ventajas de este Algoritmo:
1. **100% en el Cliente**: No requiere dependencias externas ni procesamiento del lado del servidor.
2. **Control de Calidad y Resolución**: Reduce imágenes grandes (ej. 5MB) a archivos ligeros de menos de 100KB en milisegundos.
3. **Conversión Estándar**: Exporta todo a `image/jpeg` de forma uniforme, eliminando metadatos innecesarios que inflan el peso del archivo.
