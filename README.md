# a medias

Una web para compartir los gastos de un viaje entre tres personas.

## Ejecutar

1. Creá una base PostgreSQL y copiá `.env.example` a `.env`, reemplazando `DATABASE_URL` por la conexión de la base.
2. Instalá las dependencias con `npm install`.
3. Creá las tablas con `npm run db:push`.
4. Iniciá la app con `npm run dev` y abrí http://localhost:3000.

Para publicar, configurá la misma variable de entorno en el proveedor de hosting y ejecutá `npm run db:push` contra la base correspondiente antes de iniciar la aplicación. El enlace del viaje da acceso de lectura y edición a quien lo tenga: compartilo únicamente con los participantes. Las transferencias son sugerencias, no se registran como pagos.
