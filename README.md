# Inventario Motos

Sistema de gestión de inventario para repuestos de motocicletas.

## Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- **Backend:** Next.js API Routes, Prisma 6
- **Base de datos:** PostgreSQL (Supabase)
- **Storage:** Supabase Storage (imágenes)
- **Auth:** Auth.js v5 con roles Admin / Empleado

## Módulos implementados

- Autenticación con roles
- Pantalla Principal y layout responsive
- **Productos:** CRUD, imágenes, búsqueda, filtros, paginación
- **Proveedores:** CRUD con teléfono, WhatsApp, email
- **Relación producto-proveedor:** múltiples proveedores por producto, panel lateral desde productos
- **Usuarios:** gestión de cuentas y accesos (solo administrador)

## Configuración local

```bash
npm install
cp .env.example .env   # Completar DATABASE_URL, secrets y SEED_ADMIN_PASSWORD
npm run db:migrate
npm run db:seed
npm run dev
```

El seed crea el administrador inicial. La contraseña se toma de `SEED_ADMIN_PASSWORD` en tu `.env` local (nunca se documenta en el repositorio). Opcionalmente podés definir `SEED_EMPLOYEE_PASSWORD` para el usuario empleado de desarrollo.

### Probar con un empleado en producción

En producción el administrador puede crear cuentas de empleado desde **Usuarios** (`/usuarios`):

1. Ingresá como administrador.
2. Andá a **Usuarios** desde el menú lateral (`/usuarios`).
3. Creá un usuario con rol **Empleado**, estado **Activo**, color de avatar y una contraseña temporal.
4. Cerrá sesión y entrá con ese email y contraseña para verificar el acceso de solo lectura (productos/proveedores/Principal sin crear ni editar).

Si el empleado demo del seed no existe en producción, crealo desde esa misma pantalla; no hace falta volver a correr el seed solo por eso.

---

## Guía: cómo usar la base de datos para productos

Hay **tres formas** de agregar o quitar productos del sistema. La más recomendada para el día a día es la **aplicación web**.

### 1. Desde la aplicación web (recomendado)

1. Entrá a `/login` con una cuenta **Administrador**.
2. Andá a **Productos** en el menú lateral.
3. **Agregar:** clic en **Nuevo producto** → completá código, nombre, categoría, marca, stock, precio e imagen → **Crear**.
4. **Editar:** clic en el ícono de lápiz en la fila del producto.
5. **Eliminar:** clic en el ícono de papelera → confirmar.
6. **Proveedores de un producto:** clic en **Ver proveedores** → panel lateral para vincular proveedores existentes o crear uno nuevo.

Los empleados pueden **ver** productos y proveedores, pero solo el admin puede crear, editar o eliminar.

### 2. Datos iniciales con seed (desarrollo)

El comando `npm run db:seed` carga usuarios de desarrollo, categorías, marcas, productos de ejemplo y un proveedor vinculado. Las contraseñas de esos usuarios salen de `SEED_ADMIN_PASSWORD` / `SEED_EMPLOYEE_PASSWORD` en tu `.env` local:

```bash
npm run db:seed
```

Podés modificar `prisma/seed.ts` para agregar más productos demo y volver a ejecutar el seed.

### 3. Prisma Studio (vista directa de la DB)

Para inspeccionar o editar registros directamente en PostgreSQL con una interfaz visual:

```bash
npm run db:studio
```

Se abre en [http://localhost:5555](http://localhost:5555). Ahí podés ver tablas `Product`, `Category`, `Brand`, `Supplier`, `ProductSupplier`, etc.

> **Cuidado:** editar manualmente en Studio no valida reglas de negocio (códigos únicos, relaciones). Preferí la app web para altas/bajas habituales.

### Estructura de tablas relevantes

| Tabla | Qué guarda |
|-------|------------|
| `Product` | Código, nombre, stock, precio, imagen, categoría, marca |
| `Category` | Categorías (Motor, Frenos, etc.) |
| `Brand` | Marcas (Honda, Yamaha, etc.) |
| `Supplier` | Proveedores con teléfono, WhatsApp, email |
| `ProductSupplier` | Vínculo producto↔proveedor con precio mayorista |

---

## Deploy en Vercel + GitHub

### 1. Subir a GitHub

```bash
git init
git add .
git commit -m "Inventario Motos: app completa fase 1-3"
git branch -M main
gh repo create inventario-motos --public --source=. --remote=origin --push
```

### 2. Importar en Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → importar el repo.
2. Agregar **Environment Variables** (Production):

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL pooler `:6543` de Supabase |
| `DIRECT_URL` | URL session `:5432` de Supabase |
| `NEXTAUTH_SECRET` o `AUTH_SECRET` | Secreto aleatorio largo |
| `NEXTAUTH_URL` o `AUTH_URL` | `https://amg-motopartes.vercel.app` (Production) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key |
| `SUPABASE_STORAGE_BUCKET` | `product-images` |

3. **Deploy**.

### 3. Migraciones en producción (una sola vez)

Desde tu PC con `.env` apuntando a Supabase:

```bash
npx prisma migrate deploy
npm run db:seed
```

### 4. Supabase Storage

Crear bucket `product-images` (público) en Supabase → Storage.

---

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo local |
| `npm run build` | Build producción |
| `npm run db:migrate` | Migraciones (dev) |
| `npm run db:seed` | Datos demo |
| `npm run db:studio` | Prisma Studio |
