# SPEC 03 — Silencio de audio (mute) con ícono de estado

> **Status:** Implemented
> **Depends on:** SPEC 01
> **Date:** 2026-07-09
> **Objective:** Agregar un control de silencio (mute) al juego, activo por defecto al iniciar, alternable con la tecla M durante 'playing' y 'paused', con un ícono discreto de bocina (normal/muted) en la esquina superior derecha del HUD, debajo de las vidas.

## Scope

**In:**

- Nuevo flag de estado `state.muted`, `true` por defecto al cargar la página.
- Tecla **M** alterna `state.muted` (true ↔ false), pero solo tiene efecto durante `'playing'` y `'paused'`.
- `playSound()` no reproduce nada mientras `state.muted === true` (aplica a `ball-bounce.mp3` y `break-sound.mp3`, los únicos sonidos existentes).
- Ícono de bocina dibujado con formas de canvas (sin assets nuevos), esquina superior derecha del HUD, debajo del texto "Vidas: X".
- Dos estados visuales del ícono: bocina normal (audio activo) y bocina tachada/muted (audio silenciado).
- El ícono solo se renderiza durante `'playing'` y `'paused'` (mismo alcance que el resto del HUD, vía `renderPlayingScene()`).
- `resetGame()` no cambia `state.muted` (el mute es independiente del ciclo de partida; solo se resetea al recargar la página).

**Out of scope (for future specs):**

- Persistencia del mute entre recargas de página (localStorage).
- Control de volumen (solo binario mute/unmute, sin slider).
- Interacción con mouse/click sobre el ícono (solo teclado, consistente con SPEC 01).
- Ícono visible en pantallas `'start'`, `'levelup'`, `'gameover'`, `'win'`.
- Música de fondo (no existe actualmente; el mute solo afecta efectos de sonido puntuales).

## Data model

```js
// Estado ampliado
state.muted = true; // true por defecto al cargar la página; no se resetea en resetGame()

// Ícono de mute: esquina superior derecha del HUD, debajo de "Vidas: X" (que está en y=28)
const MUTE_ICON = { x: CANVAS_WIDTH - 36, y: 40, size: 20 };
```

Conventions:

- `state.muted` se consulta dentro de `playSound()`: si es `true`, la función retorna sin reproducir nada.
- El ícono se dibuja con `ctx.beginPath()` / `ctx.moveTo()` / `ctx.lineTo()` / `ctx.arc()` sobre el canvas existente, sin sprites ni archivos nuevos:
  - Forma base (trapecio simulando el cono de una bocina) se dibuja siempre.
  - Si `state.muted === false`: se agregan 2 arcos concéntricos a la derecha del trapecio (ondas de sonido).
  - Si `state.muted === true`: se dibuja una línea diagonal (X o slash) cruzando el ícono.
- No se introduce ningún archivo nuevo; todo vive en `game.js`.

## Implementation plan

1. Agregar `state.muted = true` y la constante `MUTE_ICON` en `game.js`, sin cambiar comportamiento visible. Manual test: el juego carga sin errores; `state.muted` es `true` por defecto (verificable desde la consola).
2. Modificar `playSound()` para que no reproduzca nada si `state.muted === true`. Manual test: con el estado por defecto (muted), romper un bloque o rebotar la bola no emite sonido.
3. Manejar la tecla **M** en el listener de `keydown`: si `state.screen` es `'playing'` o `'paused'`, alternar `state.muted`. Manual test: presionar M durante `'playing'` cambia `state.muted` a `false` (verificable desde consola); presionar de nuevo vuelve a `true`.
4. Implementar `drawMuteIcon(ctx)`: dibuja el trapecio de la bocina siempre, más ondas de sonido si `!state.muted` o una línea diagonal si `state.muted`. Manual test: llamar la función manualmente no rompe nada (aún no se invoca desde el render loop).
5. Invocar `drawMuteIcon(ctx)` dentro de `renderPlayingScene()`, en la posición de `MUTE_ICON`. Manual test: el ícono aparece en la esquina superior derecha debajo de "Vidas", mostrado en estado muted por defecto, visible en `'playing'` y `'paused'`.
6. Confirmar el flujo completo: presionar M durante `'playing'` reproduce sonido en el siguiente rebote/rotura y el ícono cambia a estado normal; presionar M durante `'paused'` también alterna el ícono. Manual test: alternar M varias veces en ambas pantallas y verificar consistencia entre ícono y sonido real.

## Acceptance criteria

- [x] Al cargar la página, `state.muted` es `true` por defecto y no se reproduce ningún sonido (rebotes ni roturas de bloque).
- [x] Presionar M durante `'playing'` alterna `state.muted` entre `true` y `false`.
- [x] Presionar M durante `'paused'` también alterna `state.muted`.
- [x] Presionar M en cualquier otra pantalla (`'start'`, `'levelup'`, `'gameover'`, `'win'`) no tiene efecto.
- [x] Con `state.muted === false`, los rebotes reproducen `ball-bounce.mp3` y romper un bloque reproduce `break-sound.mp3`.
- [x] Con `state.muted === true`, ningún sonido se reproduce sin importar los eventos del juego.
- [x] El ícono de bocina se renderiza en la esquina superior derecha del HUD, debajo de "Vidas: X", solo durante `'playing'` y `'paused'`.
- [x] El ícono refleja visualmente el estado actual: forma con ondas cuando `state.muted === false`, forma tachada cuando `state.muted === true`.
- [x] El ícono no se muestra en `'start'`, `'levelup'`, `'gameover'` ni `'win'`.
- [x] `resetGame()` no modifica `state.muted` (el mute persiste durante toda la sesión del navegador, independientemente de reinicios de partida).
- [x] Recargar la página (F5) siempre vuelve a `state.muted = true`, sin importar el valor elegido antes de recargar.

## Decisions

- **Yes:** `muted = true` por defecto al cargar la página. Pedido explícito del usuario; evita sonido inesperado al abrir el juego.
- **Yes:** el mute solo se alterna con la tecla M durante `'playing'` y `'paused'`. Consistente con el pedido original; en otras pantallas no hay sonidos que silenciar todavía.
- **No:** interacción por mouse/click sobre el ícono. Fuera de alcance; SPEC 01 ya descartó el control por mouse en general.
- **Yes:** ícono de bocina dibujado con formas de canvas (paths/arcos), sin archivos nuevos. Mantiene el patrón minimalista del HUD actual (todo texto/formas dibujadas directamente, sin sprites para el HUD).
- **No:** ícono como SVG nuevo en `assets/`. Descartado para no agregar un archivo extra cuando el dibujo con canvas es suficiente para un ícono tan simple.
- **Yes:** el ícono solo es visible en `'playing'` y `'paused'`. Igual alcance que el resto del HUD (`renderPlayingScene()`), sin necesidad de duplicar lógica en otras pantallas.
- **No:** persistencia del mute vía localStorage. El juego arranca siempre en `muted = true`, sin importar sesiones anteriores; consistente con la ausencia de persistencia general del MVP (SPEC 01).
- **Yes:** `resetGame()` no toca `state.muted`. El mute es una preferencia de sesión de audio, no parte del ciclo de vida de una partida (score/vidas/nivel).

## What is **not** in this spec

- Persistencia del mute entre recargas de página (localStorage).
- Control de volumen (solo binario mute/unmute).
- Interacción con mouse/click sobre el ícono.
- Ícono visible en pantallas `'start'`, `'levelup'`, `'gameover'`, `'win'`.
- Música de fondo.

Cada uno de estos, si se implementa, va en su propio spec.
