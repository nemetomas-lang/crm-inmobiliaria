# CRM Inmobiliaria — Neme Negocios Inmobiliarios

CRM completo para inmobiliaria en Córdoba, Argentina. Construido con **Next.js 16**, **TypeScript**, **Tailwind CSS** y **Supabase**.

## Features

- **Auth** con Supabase (email + contraseña)
- **Dashboard** con KPIs y suscripciones realtime
- **Contactos / Leads** — CRUD + timeline de actividades
- **Empresas** — CRUD
- **Pipeline Kanban** — drag & drop con `@dnd-kit` entre stages
- **Propiedades** — ficha técnica con 5 pestañas (Generales, Propietario, Inquilino/Garantes, Contrato, Impuestos)
- **Calendario** mensual con eventos
- **Administración** — alertas, cobranzas, contratos por vencer, avisos automáticos

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Base de datos | Supabase (Postgres + Auth + Realtime) |
| Drag & drop | @dnd-kit/core |
| Iconos | lucide-react |
| Fechas | date-fns |

## Setup local

```bash
npm install
cp .env.local.example .env.local  # completá con tus credenciales de Supabase
npm run dev
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## Esquema de base de datos

Tablas en Postgres (`public` schema):

- `profiles` — extiende `auth.users`
- `companies` — empresas / propietarios
- `pipeline_stages` — stages del pipeline (Nuevo → Cerrado)
- `contacts` — leads / clientes
- `deals` — operaciones (van por el pipeline)
- `activities` — timeline de actividades de contactos y deals
- `properties` — fichas técnicas inmobiliarias
- `tasks` — eventos del calendario

Row Level Security activo en todas las tablas. Realtime habilitado en `contacts`, `deals`, `activities`, `tasks`.

## Deploy

Desplegado en Netlify con auto-deploy desde `main`.

---

© 2026 Neme Negocios Inmobiliarios — Mat. CPI 1.482
