# a medias

Una web para compartir los gastos de un viaje entre tres personas.

## Entorno

Next.js, Prisma 6 y PostgreSQL en Neon. Node.js 22.
Vercel `a-medias` está conectado a `MarcoSavarin0/a-medias`: main publica producción y los PR generan Preview.
Neon: organización PSD, proyecto a-medias, rama production, base neondb, AWS us-east-1. Funciones Vercel en iad1.
Production, Preview y Development comparten una única base: las pruebas modifican datos de producción.

## Variables

Configurar en Vercel para los tres entornos, sin prefijo NEXT_PUBLIC_:

| Variable | Uso |
| --- | --- |
| DATABASE_URL | Conexión Neon con pool (-pooler) para la aplicación |
| DATABASE_URL_UNPOOLED | Conexión directa para Prisma Migrate |

Nunca subir credenciales al repositorio. `.env.example` contiene solo ejemplos.

## Ejecutar localmente

1. Instalar Node.js 22 y ejecutar `npm ci`.
2. Vincular con `vercel link --project a-medias` en la cuenta correspondiente.
3. Obtener variables con `vercel env pull .env --environment development`.
   Alternativamente copiar `.env.example` a `.env` y completar ambas conexiones.
4. Ejecutar `npx prisma generate`.
5. Ejecutar `npm run dev` y abrir http://localhost:3000.

## Migraciones y despliegue

Las migraciones SQL están versionadas en `prisma/migrations`.
Con el proyecto vinculado y ambas variables verificadas, ejecutar `npm run db:migrate`
para inicializar una base vacía o aplicar migraciones pendientes.
Es idempotente; no usar `db:push` en la base compartida.

Para cambios futuros, generar y revisar la migración en una base aislada,
y aplicarla explícitamente antes de desplegar código que la necesite.
Los builds Vercel ejecutan `npm run build` (Prisma Generate + Next Build), nunca migraciones.
Validar con `npx tsc --noEmit` y `npm run build`, revisar el Preview y luego integrar a main.
Cambiar variables requiere un nuevo despliegue.

Comprobar crear un viaje, agregar/editar/eliminar un gasto y recargar para verificar persistencia.
El enlace del viaje da acceso de lectura y edición a quien lo tenga: compartirlo únicamente con los participantes.
Las transferencias son sugerencias, no se registran como pagos.
