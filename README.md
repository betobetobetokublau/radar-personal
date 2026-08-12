# Radar Personal

Panel personal con 3 columnas — tareas pendientes, fechas importantes (con
cuenta regresiva) y proyectos a mediano plazo (con notas). Pensado para vivir
como ícono en la pantalla del celular, siempre a un toque.

Construido con el asistente de [raicode.ai](https://raicode.ai).

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript, Tailwind)
- [Supabase](https://supabase.com) — datos y login por código de un solo uso (OTP)
- Design system: tema "Serio" de raicode (tokens en `app/globals.css` + `DESIGN.md`)

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # y llena las credenciales de Supabase
npm run dev
```

Las migraciones de la base viven en `supabase/migrations/`.

## App en vivo

_Pendiente de publicar._
