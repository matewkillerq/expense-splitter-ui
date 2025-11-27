# Guía de Despliegue en Vercel

Esta guía te ayudará a desplegar tu aplicación **Expense Splitter** en Vercel.

## 1. Prerrequisitos

*   Una cuenta en [Vercel](https://vercel.com/).
*   Tu proyecto subido a GitHub (o GitLab/Bitbucket).
*   Tu proyecto de Supabase configurado y funcionando.

## 2. Configuración en Vercel

1.  Ve a tu **Dashboard de Vercel** y haz clic en **"Add New..."** -> **"Project"**.
2.  Importa tu repositorio de GitHub `expense-splitter-ui`.
3.  En la configuración del proyecto ("Configure Project"):
    *   **Framework Preset:** Next.js (debería detectarse automáticamente).
    *   **Root Directory:** `./` (por defecto).
    *   **Build Command:** `npm run build` (o `next build`).
    *   **Output Directory:** `.next` (por defecto).

## 3. Variables de Entorno

Es CRÍTICO configurar las variables de entorno para que la aplicación pueda conectarse a Supabase.

Despliega la sección **"Environment Variables"** y agrega las siguientes:

| Nombre | Valor | Descripción |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tu-proyecto.supabase.co` | URL de tu proyecto Supabase. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Tu clave pública `anon` de Supabase. |

> **¿Dónde encontrar estos valores?**
> Ve a tu Supabase Dashboard -> Project Settings -> API.

## 4. Despliegue

1.  Haz clic en **"Deploy"**.
2.  Espera a que termine el proceso de construcción (Build).
3.  Si todo sale bien, verás una pantalla de felicitaciones y la URL de tu aplicación (ej: `expense-splitter-ui.vercel.app`).

## 5. Configuración Adicional en Supabase (Auth)

Para que el Login funcione correctamente en producción, debes autorizar la URL de Vercel en Supabase.

1.  Ve a **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2.  En **Site URL**, pon la URL de tu producción (ej: `https://expense-splitter-ui.vercel.app`).
3.  En **Redirect URLs**, agrega:
    *   `https://expense-splitter-ui.vercel.app/**`
    *   `https://expense-splitter-ui.vercel.app/auth/callback` (si usas callback)

## 6. Solución de Problemas Comunes

*   **Error 500 en Login:** Verifica que las variables de entorno estén bien copiadas en Vercel.
*   **"AuthApiError: Redirect URL not allowed":** Asegúrate de haber agregado la URL de Vercel en la configuración de Auth de Supabase (Paso 5).
*   **Tablas vacías:** Recuerda que la base de datos es la misma (producción), así que deberías ver los mismos datos que en local si usas la misma instancia de Supabase.

---

¡Listo! Tu aplicación debería estar funcionando en vivo. 🚀
