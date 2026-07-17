# SPEC 02 — Página de Home (landing) de Arcade Vault

> **Status:** Implementado
> **Depends on:** 01-pantallas-visuales
> **Date:** 2026-07-16
> **Objective:** Portar la landing page Home del prototipo (`references/templates/home-about/home.jsx`) a `/` en Next.js, moviendo la Biblioteca actual a `/biblioteca` y dejando en el Nav un enlace "Acerca de" que cae en la 404 existente, sin implementar la página About.

## Scope

**In:**

- `app/page.tsx` se reemplaza por la landing Home portada de `home.jsx`: hero con siluetas flotantes, sección "¿Por qué Arcade Vault?" (feature grid), "Juegos disponibles ahora" (mini-cards), stats, "Actividad en vivo" (últimas puntuaciones + top jugadores), Precios/FAQ, CTA final.
- El contenido actual de `app/page.tsx` (grilla de Biblioteca) se mueve tal cual a una nueva ruta `app/biblioteca/page.tsx`.
- `components/nav.tsx`: se agrega el enlace "Inicio" (`href="/"`), el enlace que hoy dice "Biblioteca" pasa de `href="/"` a `href="/biblioteca"`, y se agrega "Acerca de" (`href="/acerca-de"`, sin página propia). Se actualiza la lógica de estado activo (`isLibraryActive` pasa a chequear `/biblioteca` + `/juego`, se agrega `isHomeActive` para `/`). El logo sigue apuntando a `/` (ahora es Home).
- Se actualizan los 6 lugares que hoy esperan la Biblioteca en `"/"`: `router.push("/")` en el submit y en "jugar como invitado" de `app/auth/page.tsx`, y en el botón "VOLVER AL VAULT" de `components/game-player.tsx`; y `href="/"` en los enlaces "VOLVER AL VAULT" de `app/not-found.tsx` y `app/juego/[id]/page.tsx`, y "VOLVER A LA BIBLIOTECA" de `app/salon-de-la-fama/page.tsx`. Todos pasan a apuntar a `/biblioteca`.
- Estilos de Home portados desde `references/templates/home-about/styles.css` (`.home-*`, `.reveal`/`.in`, `.mini-card`, `.feature-card`, `.activity-grid`, `.pricing-grid`, `.silo`, `.hero-scroll`, `.stat-block`, etc.) hacia `app/globals.css`.
- Hook de scroll-reveal (IntersectionObserver sobre `.reveal`) portado desde `useReveal` de `home.jsx`, con alcance local a la página Home.
- Siluetas SVG decorativas (`FloatingSilhouettes`) e íconos de features (`FeatureIcon`) portados tal cual.
- Sección "Juegos disponibles ahora": usa `GAMES` real de `lib/data.ts` (primeros 6), cada mini-card enlaza a `/juego/[id]`.
- Contenido mock de "Actividad en vivo" (últimas puntuaciones, top jugadores) y de Precios/FAQ: arrays hardcodeados locales a la página Home (mismo patrón que el template), sin tocar `lib/data.ts`/`lib/types.ts`.
- CTAs de Home enlazan a rutas reales: "Explorar juegos"/"Ver todos los juegos"/CTA final → `/biblioteca`; "Crear cuenta"/"Empezar gratis" → `/auth`; "Ver salón" → `/salon-de-la-fama`.

**Out of scope (para futuros specs):**

- Página About/Acerca de real (misión, highlights, formulario de contacto). El enlace del Nav a `/acerca-de` no tiene página propia, por lo que Next.js resuelve automáticamente `app/not-found.tsx` (ya existente) al navegar ahí.
- Cualquier cambio a Detalle, Reproductor, Auth o Salón de la Fama más allá de las redirecciones/enlaces mencionados arriba.
- Datos reales para "Actividad en vivo"/stats/pricing — siguen siendo mock estático, no conectado a `localStorage` ni a un backend.
- Tests automatizados (no hay framework configurado en el proyecto).
- Internacionalización.

## Data model

No se agregan tipos ni estructuras compartidas a `lib/types.ts`/`lib/data.ts`. `GAMES` se reutiliza tal cual (spec 01).

La página Home define localmente (dentro de `app/page.tsx` o un archivo `home-data.ts` local a la página, a decidir en el plan de implementación) los siguientes arrays mock, migrados tal cual desde `home.jsx` — sin tipos compartidos porque no se consumen fuera de Home:

```ts
// Forma de los arrays mock, solo para esta página
type ActivityRow = { p: string; g: string; s: number; t: string; c: "magenta" | "yellow" | "green" | "cyan" };
type TopPlayerRow = { r: number; p: string; s: number };
type FeatureItem = { i: string; t: string; d: string; c: "cyan" | "yellow" | "magenta" | "green" };
type StatBlock = { n: string; u: string; s: string };
```

Convenciones:

- Los montos se formatean con `.toLocaleString("es-ES")`, igual que el resto de la app (spec 01).
- Los primeros 6 elementos de `GAMES` alimentan la sección "Juegos disponibles ahora" (`GAMES.slice(0, 6)`), igual que el template.

## Implementation plan

1. Crear `app/biblioteca/page.tsx` con el contenido actual de `app/page.tsx` (hero, buscador, chips de categoría, grilla), sin cambios de lógica. Test manual: `/biblioteca` funciona igual que `/` funciona hoy (buscador, filtros, navegación a `/juego/[id]`).
2. Portar los estilos de Home desde `references/templates/home-about/styles.css` hacia `app/globals.css` (`.home-*`, `.reveal`/`.in`, `.mini-card`, `.feature-card`, `.activity-grid`, `.pricing-grid`, `.silo`, `.hero-scroll`, `.stat-block`, etc.). Test manual: `npm run dev` sigue sirviendo `/` y `/biblioteca` sin errores de CSS ni de consola.
3. Reemplazar `app/page.tsx` por la landing Home portada de `home.jsx` (client component): hero con `FloatingSilhouettes`, hook `useReveal` (IntersectionObserver sobre `.reveal`), sección "¿Por qué Arcade Vault?", "Juegos disponibles ahora" con `GAMES.slice(0, 6)` enlazando a `/juego/[id]`, stats, "Actividad en vivo" (mock), Precios/FAQ, CTA final. Los CTAs enlazan a `/biblioteca`, `/auth` o `/salon-de-la-fama` según corresponda. Test manual: `/` muestra el landing completo; `/biblioteca` sigue mostrando la grilla (aún duplicada respecto al paso 1, es esperado en este punto).
4. Actualizar `components/nav.tsx`: agregar el enlace "Inicio" (`href="/"`), cambiar el enlace "Biblioteca" a `href="/biblioteca"`, agregar "Acerca de" (`href="/acerca-de"`, sin página propia), y actualizar la lógica de estado activo (`isHomeActive` para `/`, `isLibraryActive` para `/biblioteca` y `/juego`) tanto en el menú desktop como en el panel móvil. Test manual: navegar entre Inicio/Biblioteca resalta el enlace correcto; hacer clic en "Acerca de" muestra la página 404 existente.
5. Actualizar los 6 lugares que hoy esperan la Biblioteca en `"/"`: `router.push("/")` → `router.push("/biblioteca")` en el submit y en "jugar como invitado" de `app/auth/page.tsx`, y en el botón "VOLVER AL VAULT" de `components/game-player.tsx`; y `href="/"` → `href="/biblioteca"` en los enlaces "VOLVER AL VAULT" de `app/not-found.tsx` y `app/juego/[id]/page.tsx`, y "VOLVER A LA BIBLIOTECA" de `app/salon-de-la-fama/page.tsx`. Test manual: cada uno de esos 6 puntos navega a `/biblioteca`, no a `/`.
6. Verificación manual completa de `/` contra los criterios de aceptación (ver siguiente sección).

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola del navegador ni del servidor.
- [ ] `/` muestra la landing Home: hero con eyebrow, título, subtítulo y botones "EXPLORAR JUEGOS"/"CREAR CUENTA".
- [ ] Las siluetas flotantes decorativas se renderizan en el hero de `/`.
- [ ] Al hacer scroll en `/`, las secciones con clase `.reveal` aparecen animadas (se agrega la clase `.in` al entrar en el viewport).
- [ ] La sección "¿Por qué Arcade Vault?" muestra las 4 feature cards con ícono, título y descripción.
- [ ] La sección "Juegos disponibles ahora" muestra 6 mini-cards correspondientes a los primeros 6 juegos de `GAMES`; hacer clic en una navega a `/juego/[id]` con el juego correcto.
- [ ] El botón "VER TODOS LOS JUEGOS →" navega a `/biblioteca`.
- [ ] La sección de stats muestra los 3 bloques (juegos, partidas, ranking).
- [ ] La sección "Actividad en vivo" muestra el ticker de últimas puntuaciones y el top 5 de jugadores del día.
- [ ] El botón "VER SALÓN →" navega a `/salon-de-la-fama`.
- [ ] La sección de precios muestra el plan único ($0) y las 3 preguntas frecuentes.
- [ ] Los botones "EMPEZAR GRATIS →" y "CREAR CUENTA" navegan a `/auth`.
- [ ] El CTA final "INSERTAR MONEDA →" navega a `/biblioteca`.
- [ ] `/biblioteca` muestra la misma grilla/buscador/chips que antes mostraba `/` (sin regresión funcional del spec 01).
- [ ] El Nav muestra "Inicio", "Biblioteca", "Salón de la Fama" y "Acerca de" en todas las rutas de la app, sin duplicarse ni desaparecer al navegar.
- [ ] En `/`, el enlace "Inicio" del Nav aparece resaltado como activo; en `/biblioteca` y `/juego/[id]`, el enlace "Biblioteca" aparece resaltado.
- [ ] Hacer clic en "Acerca de" navega a `/acerca-de` y muestra la página 404 existente (`app/not-found.tsx`).
- [ ] El logo del Nav navega a `/` (Home).
- [ ] Iniciar sesión desde `/auth` redirige a `/biblioteca` (no a `/`).
- [ ] "Jugar como invitado" desde `/auth` redirige a `/biblioteca` (no a `/`).
- [ ] Terminar una partida y hacer clic en "VOLVER AL VAULT" redirige a `/biblioteca` (no a `/`).
- [ ] Desde la página 404, el botón "VOLVER AL VAULT" navega a `/biblioteca`.
- [ ] Desde `/juego/[id]`, el botón "VOLVER AL VAULT" navega a `/biblioteca`.
- [ ] Desde `/salon-de-la-fama`, el botón "VOLVER A LA BIBLIOTECA" navega a `/biblioteca`.

## Decisions

- **Yes:** Home ocupa `/` y la Biblioteca se mueve a `/biblioteca`. Coincide con el Nav del template (Inicio/Biblioteca como enlaces separados) y es lo esperado de una landing: la raíz del sitio es el marketing/entrada, no la grilla de juegos.
- **No:** dejar Home en una ruta secundaria (ej. `/inicio`) manteniendo Biblioteca en `/`. Habría dejado el logo del Nav apuntando a Biblioteca en vez de a Home, algo inusual.
- **Yes:** actualizar los 6 lugares (3 redirecciones de router + 3 enlaces `<Link>`) que hoy esperan la Biblioteca en `"/"`, para que apunten a `/biblioteca`. Mantiene el comportamiento actual (caer en la grilla de juegos tras esas acciones) ahora que `/` cambió de significado; se detectaron con una búsqueda exhaustiva de `href="/"` y `push("/")` en todo el código, no solo los 3 casos evidentes iniciales.
- **Yes:** el enlace "Acerca de" del Nav apunta a `/acerca-de` sin crear ninguna página para esa ruta, dejando que Next.js resuelva automáticamente `app/not-found.tsx` (ya existente desde spec 01). Cumple el pedido explícito de no implementar About en este spec sin necesidad de código adicional.
- **No:** implementar la página About/Acerca de (misión, highlights, formulario de contacto de `about.jsx`). Queda fuera de este spec, para uno futuro.
- **Yes:** la sección "Juegos disponibles ahora" reutiliza `GAMES` de `lib/data.ts` (`GAMES.slice(0, 6)`) en vez de datos inventados. Consistente con el resto de la app y evita mantener un catálogo duplicado.
- **Yes:** los mocks de "Actividad en vivo" (últimas puntuaciones, top jugadores) y de Precios/FAQ se copian tal cual del template como arrays locales a la página Home, sin promoverlos a `lib/data.ts`/`lib/types.ts`. Es contenido puramente decorativo/de marketing que no se consume en ninguna otra pantalla, a diferencia de `GAMES`/`PLAYERS`.
- **No:** crear tipos compartidos en `lib/types.ts` para esos mocks. Habría sido una abstracción sin uso real fuera de esta página.
- **Yes:** el hook de scroll-reveal (`useReveal`, IntersectionObserver sobre `.reveal`) se porta con alcance local a la página Home, igual que en el template (`about.jsx` define su propia copia en vez de compartir un hook).
- **Yes:** estilos de Home portados desde `styles.css` a `app/globals.css` tal cual, siguiendo el mismo criterio de fidelidad visual usado en spec 01 para el resto de las pantallas.
- **No:** tests automatizados — no hay framework de testing configurado en el proyecto (ver CLAUDE.md).
