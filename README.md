# Cogni-Threat - Frontend

Frontend desarrollado con React, TypeScript y Vite para la visualización y gestión de información relacionada con inteligencia de amenazas.

## Quick Start With Docker

For the community setup, run the full stack from the sibling backend repository (`../cogni-threat`). The backend compose file builds this frontend and serves it through Nginx.

```bash
cd ../cogni-threat
cp .env.template .env
docker compose up --build
```

The frontend is exposed on `http://localhost:8080` by default. Set `VITE_API_URL` only when you need the built frontend to call an API outside the default `/api` proxy path.

On first boot, sign in with the backend `ADMIN_EMAIL` / `ADMIN_PASSWORD` values and use **Administración → Fuentes, credenciales e IA** to configure API keys and Ollama/RAG settings.

The current open-source AI provider is Ollama. The admin panel lets you configure the Ollama URL, chat model, embedding model, and RAG parameters. `EMBEDDING_DIM` is backend-only because it must match the pgvector schema; changing embedding dimensions requires reindexing.

## Tecnologías utilizadas

* React
* TypeScript
* Vite
* Redux Toolkit
* Material UI
* MUI X-Charts
* React Router
* Axios
* Tailwind CSS
* pnpm

---

# Requisitos

* Docker and Docker Compose for the recommended full-stack setup.
* Node.js 22 or higher and pnpm for local frontend development.

El proyecto utiliza Corepack para gestionar la versión de pnpm.

---

# Local Development

Clonar el repositorio:

```bash
git clone <url-del-repositorio>
cd cogni-threat-front
```

Instalar dependencias:

```bash
corepack enable
pnpm install
```

---

# Configuración

Copiar el archivo de ejemplo:

```bash
cp .env.template .env
```

Configurar las variables necesarias:

```env
VITE_API_URL=http://localhost:3000
```

> El archivo `.env` no se versiona.

---

# Ejecución

## Desarrollo

```bash
pnpm run dev
```

## Compilación

```bash
pnpm run build
```

## Vista previa de producción

```bash
pnpm run preview
```

---

# Estructura del proyecto

```text
src/
├── app/
├── pages/
├── shared/
├── store/
├── theme/
├── types/
│
├── index.css
└── vite-env.d.ts

public/
```

---

# Archivos importantes

## src/app/*

Configuración principal de la aplicación.

## src/pages/*

Páginas y vistas principales.

## src/shared/*

Componentes, utilidades y elementos reutilizables.

## src/store/*

Configuración global de Redux Toolkit.

## src/theme/*

Configuración visual y estilos globales.

## src/types/*

Definiciones de tipos TypeScript.

---

# Convenciones del proyecto

## Gestión de dependencias

Utilizar siempre:

```bash
pnpm
```

No utilizar:

```bash
npm
```

ni

```bash
yarn
```

para evitar inconsistencias en el lockfile.

## Variables de entorno

Toda configuración sensible debe declararse mediante variables de entorno.

No versionar:

```text
.env
```

## Estilo de código

* TypeScript estricto.
* Componentes funcionales.
* Hooks para lógica reutilizable.
* Redux Toolkit para gestión de estado.
* Material UI para componentes visuales.
* Axios para comunicación con APIs.

---

# Flujo de trabajo Git

## Rama principal de desarrollo

Todos los cambios deben realizarse sobre la rama:

```bash
develop
```

Flujo habitual:

```bash
git checkout develop

git pull origin develop

git add .

git commit -m "Descripción del cambio"

git push origin develop
```

## Despliegue

La rama `develop` es utilizada como rama principal de desarrollo.

Una vez validados los cambios, el despliegue a los entornos correspondientes se realiza mediante los pipelines de CI/CD configurados para el proyecto.

No realizar cambios directamente sobre los servidores de producción.

## Buenas prácticas

* Mantener la rama `develop` actualizada antes de comenzar a trabajar.
* Realizar commits descriptivos y pequeños cuando sea posible.
* Verificar que la aplicación compile correctamente antes de realizar un push.
* Evitar commits con archivos temporales, credenciales o archivos `.env`.

```
```
