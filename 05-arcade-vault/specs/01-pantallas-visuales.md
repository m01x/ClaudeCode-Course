# SPEC 01 — Pantallas visuales de Arcade Vault (MVP)

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-07-16
> **Objective:** Portar las 5 pantallas del prototipo en references/templates (Biblioteca, Detalle, Reproductor, Auth, Salón de la Fama) a páginas reales de Next.js App Router, conservando el diseño visual retro-arcade y las interacciones mock, sin implementar lógica de juego real.

## Scope

**In:**

- Layout raíz (`app/layout.tsx`) con fondo animado (`av-bg`/scanlines), fuentes vía `next/font/google` (Press Start 2P, JetBrains Mono, Courier Prime) y `Nav` + footer compartidos en todas las rutas.
- Página **Biblioteca** (`/`): hero, buscador por nombre, chips de categoría (TODOS/ARCADE/PUZZLE/SHOOTER/VERSUS), grilla de `GameCard` con tilt al hover, estado "sin resultados".
- Página **Detalle** (`/juego/[id]`): portada, tags, descripción larga, stats (partidas/mejor global/dificultad), botones "Jugar ahora"/"Volver", tabla de mejores puntuaciones (mock).
- Página **Reproductor** (`/juego/[id]/jugar`): HUD (jugador/puntaje/vidas/nivel), pantalla CRT decorativa con animación de puntaje automático (igual que el template, sin lógica de juego real), pausa, botón fin, modal de fin de partida con guardado de puntaje.
- Página **Auth** (`/auth`): tabs iniciar sesión / crear cuenta, formulario mock (sin validación más allá de la nativa del navegador), botón "jugar como invitado", botones sociales decorativos (sin acción real).
- Página **Salón de la Fama** (`/salon-de-la-fama`): tabs por juego, podio (oro/plata/bronce), tabla de posiciones, fila destacada "tu mejor marca" si hay sesión.
- Página **404** (`app/not-found.tsx`) con estilo retro-arcade acorde al resto de la UI.
- Datos mock tipados en `lib/data.ts`/`lib/types.ts` (catálogo de 8 juegos, generador `seededScores`, lista de jugadores), migrados tal cual desde `data.jsx`.
- Persistencia mock en `localStorage` de sesión (`av_user`) y puntajes guardados (`av_scores`), igual que el original.
- Navegación real entre rutas usando `next/navigation` (`useRouter`/`Link`) en vez del router de hash del prototipo.
- Estilos portados desde `styles.css` (variables, clases `.av-*`, efectos CRT/scanlines/neón) a `app/globals.css` o un archivo de estilos importado.

**Out of scope (para futuros specs):**

- Lógica real de cualquiera de los 8 juegos (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel).
- Autenticación real / backend / base de datos (todo sigue siendo mock en cliente).
- Persistencia de puntajes en un servidor o ranking global real.
- Internacionalización (la UI queda solo en español, como el original).
- Accesibilidad avanzada más allá de lo que ya trae el markup del prototipo.
- Tests automatizados (no hay framework de testing configurado en el proyecto).

## Data model

```ts
// lib/types.ts
export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
  cover: string; // clase CSS de portada, ej. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string; // ej. "12.4K"
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string; // "DD/MM/AAAA"
}

export interface SessionUser {
  name: string;
}

export interface SavedScoreEntry {
  game: string; // Game.id
  score: number;
  name: string;
  at: number; // Date.now()
}
```

```ts
// lib/data.ts
export const GAMES: Game[] = [/* los mismos 8 juegos de data.jsx, migrados tal cual */];
export const CATS = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"] as const;
export const PLAYERS: string[] = [/* mismos 18 nombres */];
export function seededScores(seed: number, count?: number): ScoreRow[] { /* mismo algoritmo pseudoaleatorio */ }
```

Claves de `localStorage` (mismas que el original):

- `av_user` → `SessionUser | null`, serializado JSON.
- `av_scores` → `SavedScoreEntry[]`, serializado JSON.

Convenciones:

- Todo el acceso a `localStorage` pasa por un helper en `lib/storage.ts` (get/set con `try/catch`), para no repetir el parseo defensivo en cada componente.
- Los montos se formatean con `.toLocaleString("es-ES")` como en el original.

## Implementation plan

1. Configurar fuentes con `next/font/google` (Press Start 2P, JetBrains Mono, Courier Prime) en `app/layout.tsx` y portar `styles.css` a `app/globals.css` (variables, fondo animado, scanlines). Test manual: `npm run dev` muestra el fondo CRT sin errores de consola sobre la página default.
2. Crear `lib/types.ts` y `lib/data.ts` portando `GAMES`, `CATS`, `PLAYERS` y `seededScores` desde `data.jsx`. Test manual: script/página temporal confirma `GAMES.length === 8`.
3. Crear `lib/storage.ts` con helpers `getUser`/`setUser`/`clearUser`/`getScores`/`addScore` sobre `localStorage`, con `try/catch` defensivo.
4. Crear `components/session-provider.tsx` (client component) que expone `{ user, login, signOut }` respaldado por `lib/storage.ts`, y envolver `{children}` con él en `app/layout.tsx`. Necesario porque en Next.js cada ruta es un árbol de componentes distinto; sin este contexto compartido, el Nav no se enteraría de un login hecho en `/auth`.
5. Crear `components/nav.tsx` (client) portando `nav.jsx`, usando `usePathname`/`Link` de `next/navigation` para el estado activo y el contexto de sesión para el botón de login/cerrar sesión; montarlo junto al footer en `app/layout.tsx`.
6. Crear `components/game-card.tsx` y `app/page.tsx` portando `biblioteca.jsx` (buscador, chips de categoría, grilla), enlazando cada card a `/juego/[id]`.
7. Crear `app/juego/[id]/page.tsx` portando `detalle.jsx`; usar `notFound()` cuando el `id` no exista en `GAMES`; tabla de puntuaciones vía `seededScores`.
8. Crear `app/not-found.tsx` con estilo retro-arcade construido en Tailwind, reutilizando las variables CSS ya portadas.
9. Crear `app/juego/[id]/jugar/page.tsx` portando `reproductor.jsx` (HUD, animación decorativa del CRT, pausa, modal de fin con guardado de puntaje vía `lib/storage.ts`).
10. Crear `app/auth/page.tsx` portando `auth.jsx`, conectado a `login` del contexto de sesión, redirigiendo a `/` al enviar el formulario o al entrar como invitado.
11. Crear `app/salon-de-la-fama/page.tsx` portando `salon.jsx` (tabs por juego, podio, tabla), usando el contexto de sesión para la fila "tu mejor marca".

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola del navegador ni del servidor.
- [ ] `/` muestra el hero, el buscador y la grilla de 8 juegos; escribir en el buscador filtra por título en tiempo real.
- [ ] Hacer clic en un chip de categoría filtra la grilla; seleccionar "TODOS" la restaura.
- [ ] Buscar un texto sin coincidencias muestra el estado "NO HAY RESULTADOS".
- [ ] Hacer clic en una `GameCard` o su botón "JUGAR" navega a `/juego/[id]` con los datos del juego correcto.
- [ ] `/juego/[id]` muestra portada, tags, descripción, stats y una tabla de mejores puntuaciones con 10 filas.
- [ ] `/juego/id-inexistente` dispara la página `not-found.tsx` con el estilo retro-arcade.
- [ ] En `/juego/[id]`, el botón "JUGAR AHORA" navega a `/juego/[id]/jugar`.
- [ ] En `/juego/[id]/jugar`, el puntaje del HUD sube automáticamente cada ~220ms mientras no está en pausa ni terminado.
- [ ] El botón "PAUSA" detiene el incremento de puntaje y muestra el overlay "EN PAUSA"; "REANUDAR" lo retoma.
- [ ] El botón "FIN" abre el modal de fin de partida con el puntaje final.
- [ ] Guardar el puntaje en el modal lo persiste en `localStorage` bajo `av_scores` y muestra el mensaje "PUNTUACIÓN GUARDADA".
- [ ] "JUGAR DE NUEVO" reinicia puntaje/vidas/nivel y cierra el modal; "VOLVER AL VAULT" navega a `/`.
- [ ] `/auth` permite alternar entre tabs "INICIAR SESIÓN" y "CREAR CUENTA", mostrando/ocultando el campo de correo según corresponda.
- [ ] Enviar el formulario de `/auth` (con cualquier dato) guarda la sesión en `localStorage` bajo `av_user`, redirige a `/` y el Nav muestra el nombre de usuario.
- [ ] "JUGAR COMO INVITADO" navega a `/` sin crear sesión (Nav sigue mostrando "Iniciar Sesión").
- [ ] Con sesión activa, el botón de usuario en el Nav permite cerrar sesión y vuelve a mostrar "Iniciar Sesión".
- [ ] `/salon-de-la-fama` muestra tabs por cada uno de los 8 juegos; cambiar de tab actualiza podio y tabla.
- [ ] Con sesión activa, la tabla de `/salon-de-la-fama` muestra la fila destacada "TU MEJOR MARCA"; sin sesión, no aparece.
- [ ] Recargar la página conserva la sesión (`av_user`) y los puntajes guardados (`av_scores`) previamente guardados.
- [ ] El Nav y el footer se ven en las 5 rutas sin duplicarse ni desaparecer al navegar entre ellas.

## Decisions

- **Yes:** rutas reales de Next.js App Router (`/`, `/juego/[id]`, `/juego/[id]/jugar`, `/auth`, `/salon-de-la-fama`) en vez del router de hash del prototipo. Es lo idiomático en App Router y da URLs navegables/compartibles.
- **No:** replicar el router casero basado en `location.hash`. Iría contra las convenciones de Next.js que el propio `AGENTS.md`/`CLAUDE.md` piden respetar.
- **Yes:** Tailwind v4 es el sistema de estilos del proyecto. Todo lo que ya está resuelto en `references/templates` (variables, clases `.av-*`, efectos CRT/scanlines/neón) se porta casi tal cual a `app/globals.css` para máxima fidelidad visual. Todo lo que **no** está en las referencias (ej. `not-found.tsx`) se construye con utilidades Tailwind, reutilizando las variables CSS ya portadas (`var(--cyan)`, `var(--pixel)`, etc.) para que combine con el resto de la UI.
- **No:** reescribir en Tailwind lo que ya viene resuelto en los templates. Se evita el riesgo de perder los efectos retro al traducirlos a utilities sin necesidad.
- **Yes:** `next/font/google` para las tipografías en vez de `<link>` a Google Fonts. Es la forma idiomática en Next.js (self-hosting, sin flash ni llamada externa por carga).
- **Yes:** mantener la animación decorativa del reproductor (puntaje sube solo, HUD, pausa, modal de fin) porque no es lógica de juego real — es la misma simulación visual que ya trae el prototipo.
- **No:** implementar mecánica real de algún juego (colisiones, input del jugador, etc.) en este spec.
- **Yes:** persistencia mock en `localStorage` (`av_user`, `av_scores`), igual que el original, para que sesión y puntajes guardados sobrevivan a un refresh.
- **Yes:** un `SessionProvider` (contexto de cliente) en `app/layout.tsx` para compartir el usuario logueado entre Nav, Auth, Reproductor y Salón de la Fama. Necesario porque cada ruta de Next.js es un árbol de componentes distinto; `localStorage` solo no dispara re-render entre páginas.
- **Yes:** login 100% mock — cualquier usuario/contraseña "entra", botones sociales decorativos sin acción real, "jugar como invitado" no crea sesión. Igual que el prototipo, sin backend ni validación más allá de la nativa del navegador.
- **Yes:** página `not-found.tsx` con estilo retro-arcade construida en Tailwind (no existía en el prototipo original) — se agregó porque Next.js la requiere para rutas dinámicas con id inválido.
- **Yes:** datos mock (`GAMES`, `PLAYERS`, `seededScores`) migrados tal cual desde `data.jsx` a `lib/data.ts`/`lib/types.ts`, sin cambios de catálogo.
- **No:** tests automatizados — no hay framework de testing configurado en el proyecto (ver CLAUDE.md).

## Lo que **no** está en este spec

- Lógica real de cualquiera de los 8 juegos (Bloque Buster, Caída, Serpentina, Glotón, Invasores, Rocas, Ranaria, Duelo Pixel).
- Autenticación real, backend o base de datos.
- Persistencia de puntajes en un servidor o ranking global real.
- Internacionalización (la UI queda solo en español).
- Accesibilidad avanzada más allá de lo que ya trae el markup del prototipo.
- Tests automatizados.

Cada uno de estos, si se implementa, va en su propio spec.
