# RefactorIA

Sitio público estático de [refactoria.dev](https://refactoria.dev): la casa canónica de la comunidad, con identidad verificable (organización de GitHub, canales de YouTube, música y contacto oficial).

**Modernize with engineering judgment. No hype.**

## Inicio rápido

1. Usá Node.js 24 y npm 11 o versiones compatibles.
2. Instalá dependencias con `npm ci`.
3. Iniciá el sitio con `npm run dev`.

## Comandos

| Comando          | Propósito                                               |
| ---------------- | ------------------------------------------------------- |
| `npm run dev`    | Servidor local de Astro.                                |
| `npm run format` | Verifica el formato.                                    |
| `npm run check`  | Ejecuta la verificación de Astro y TypeScript.          |
| `npm test`       | Construye el sitio y valida el HTML estático publicado. |
| `npm run build`  | Genera el sitio estático en `dist/`.                    |

## Estructura

- `src/pages/index.astro`: única página (hero, qué es, contenido, open source, music, about, contacto).
- `src/layouts/BaseLayout.astro`: SEO, Open Graph, Twitter cards y JSON-LD (`Organization`, `Person`, `WebSite`) que conecta RefactorIA con Juan Barbat y los canales oficiales.
- `src/styles/global.css`: paleta violeta-negro derivada de los assets de marca.
- `public/`: favicon, apple-touch-icon, og-image, robots.txt. El sitemap se genera en el build.
- `scripts/generate-assets.py`: regenera favicon y og-image desde los assets de marca (requiere `cairosvg` y `Pillow`).

Los sources de marca (logo barba, fuente FiraCode custom) viven en el repositorio de contenido `refactoria`, en `assets/`.

## Deploy

Salida 100% estática en `dist/`, servible desde cualquier hosting de archivos.

- **GitHub Pages**: se despliega solo al hacer push a `main` (workflow `deploy.yml`). Los pull requests no despliegan.
- **Hostinger** (deploy primario mientras el DNS apunte ahí): subir el contenido de `dist/` al directorio del dominio vía SSH/SFTP. No requiere Node en el servidor.

La URL canónica es `https://refactoria.dev`. Este repositorio no incluye archivo `CNAME` ni administra DNS: el dominio y el email se gestionan en Hostinger.

## Regla para cambios

Cada cambio empieza en un issue. Trabajá desde un fork o rama propia y abrí un pull request que vincule el issue antes de pedir revisión.
