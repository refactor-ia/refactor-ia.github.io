# RefactorIA

Sitio público estático de [refactoria.dev](https://refactoria.dev): la casa canónica de la comunidad, con identidad verificable (organización de GitHub, canales de YouTube, música y contacto oficial).

**Modernize with engineering judgment. No hype.**

## Inicio rápido

1. Usá Node.js 24 y pnpm 12 (la versión exacta está en `packageManager` de `package.json`).
2. Instalá dependencias con `pnpm install --frozen-lockfile`.
3. Iniciá el sitio con `pnpm run dev`.

## Comandos

| Comando           | Propósito                                               |
| ----------------- | ------------------------------------------------------- |
| `pnpm run dev`    | Servidor local de Astro.                                |
| `pnpm run format` | Verifica el formato.                                    |
| `pnpm run check`  | Ejecuta la verificación de Astro y TypeScript.          |
| `pnpm test`       | Construye el sitio y valida el HTML estático publicado. |
| `pnpm run build`  | Genera el sitio estático en `dist/`.                    |

## Estructura

- `src/pages/index.astro`: única página (hero, qué es, contenido, open source, music, about, contacto).
- `src/layouts/BaseLayout.astro`: SEO, Open Graph, Twitter cards y JSON-LD (`Organization`, `Person`, `WebSite`) que conecta RefactorIA con Juan Barbat y los canales oficiales.
- `src/styles/global.css`: paleta violeta-negro derivada de los assets de marca.
- `public/`: favicon, apple-touch-icon, og-image, robots.txt. El sitemap se genera en el build.

Los sources de marca (logo barba, fuente FiraCode custom) viven en el repositorio de contenido `refactoria`, en `assets/`.

## Deploy

Salida 100% estática en `dist/`, servible desde cualquier hosting de archivos.

- **GitHub Pages**: se despliega solo al hacer push a `main` (workflow `deploy.yml`). Los pull requests no despliegan.
- **Hostinger** (deploy primario mientras el DNS apunte ahí): subir el contenido de `dist/` al directorio del dominio vía SSH/SFTP. No requiere Node en el servidor.

La URL canónica es `https://refactoria.dev`. Este repositorio no incluye archivo `CNAME` ni administra DNS: el dominio y el email se gestionan en Hostinger.

## Regla para cambios

Cada cambio empieza en un issue. Trabajá desde un fork o rama propia y abrí un pull request que vincule el issue antes de pedir revisión.
---

<a href="https://github.com/Gentleman-Programming/gentle-ai">
  <img width="220" src="https://raw.githubusercontent.com/Gentleman-Programming/gentle-ai/main/docs/assets/brand/built-with-gentle-ai.png" alt="Built with Gentle-AI" />
</a>

<a href="https://nan.builders/?ref=built-with-nan">
  <picture>
    <source media="(prefers-color-scheme: light)" srcset="https://nan.builders/badge/built-with-nan-light.svg">
    <img width="266" src="https://nan.builders/badge/built-with-nan-dark.svg" alt="Built with NaN">
  </picture>
</a>
