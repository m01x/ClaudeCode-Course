# SPEC 01 — MVP jugable de Arkanoid (M10xaloid)

> **Status:** Implemented
> **Depends on:** Ninguno (primer spec del proyecto)
> **Date:** 2026-07-06
> **Objective:** Construir un MVP jugable de Arkanoid en HTML/CSS/JS vanilla, con un nivel fijo, control por teclado, vidas, puntuación por bloque, pantalla de inicio con logo, pausa, y pantallas de victoria/derrota con reinicio.

## Scope

**In:**

- Archivos nuevos: `index.html`, `style.css`, `game.js`, reutilizando `assets/spritesheet.js`, `assets/spritesheet-breakout.png` y los sonidos existentes.
- Canvas fijo de 800×600 px, centrado en la página.
- Movimiento del paddle con teclado: flechas ←/→ y también A/D.
- Bola: se lanza pegada al paddle, se dispara con Espacio; el ángulo de rebote contra el paddle depende del punto de impacto (comportamiento estándar de Arkanoid); rebote reflejado simple contra paredes y bloques.
- Un único nivel fijo de bloques, usando los colores disponibles en el spritesheet (`gray`, `red`, `yellow`, `cyan`, `magenta`, `hotpink`, `green`).
- Al romper un bloque: se reproduce la animación de explosión (`EXPLOSION_FRAMES`) y el sonido `break-sound.mp3`; el rebote de la bola reproduce `ball-bounce.mp3`.
- Puntuación: todos los bloques otorgan el mismo valor fijo; se muestra en pantalla durante la partida; no se persiste entre sesiones.
- Vidas: el jugador empieza con 3; al perder una (bola cae debajo del paddle) se resta una vida y la bola vuelve a engancharse al paddle si quedan vidas.
- Pantalla de inicio: logo "M10xaloid" en estilo 8-bit con degradado top-down (SVG nuevo en `assets/`) y mensaje "Presiona ESPACIO para iniciar".
- Pausa con la tecla P: congela el loop del juego y muestra un overlay/texto de "Pausado"; se reanuda presionando P otra vez.
- Pantalla de "Game Over" al llegar a 0 vidas, con opción de reinicio.
- Pantalla de "¡Ganaste!" al romper todos los bloques del nivel, con opción de reinicio.
- Reinicio: vuelve a la pantalla de inicio con puntuación y vidas reseteadas.

**Out of scope (for future specs):**

- Power-ups.
- Múltiples niveles o progresión de niveles.
- Persistencia de puntuación/high scores (localStorage).
- Control por mouse.
- Sistemas de skins/temas visuales.
- Canvas responsive (se mantiene fijo en 800×600).

## Data model

```js
// Constantes de juego
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const PADDLE = { width: 100, height: 16, speed: 7 };
const BALL_RADIUS = 8;
const BALL_INITIAL_SPEED = 5;

const STARTING_LIVES = 3;
const BLOCK_SCORE_VALUE = 10; // mismo valor fijo para cualquier bloque

const BLOCK_ROWS = 5;
const BLOCK_COLS = 10;
const BLOCK_WIDTH = 64;
const BLOCK_HEIGHT = 24;
// Un color de bloque por fila, de arriba hacia abajo (colores válidos: ver assets/spritesheet.js)
const BLOCK_ROW_COLORS = ['red', 'yellow', 'cyan', 'magenta', 'hotpink'];

// Estado global del juego
const state = {
  screen: 'start', // 'start' | 'playing' | 'paused' | 'gameover' | 'win'
  score: 0,
  lives: STARTING_LIVES,
  paddle: { x: 0, y: 0, width: PADDLE.width, height: PADDLE.height },
  ball: { x: 0, y: 0, dx: 0, dy: 0, radius: BALL_RADIUS, attached: true },
  blocks: [
    // { x, y, width, height, color, active }
  ],
};

// Animaciones de explosión en curso (bloques recién rotos)
const explosions = [
  // { x, y, color, frameIndex, elapsedMs }
];
```

Conventions:

- Coordenadas: origen arriba-izquierda.
- Velocidades en píxeles/frame (`ball.dx`, `ball.dy`).
- `ball.attached === true` mientras la bola sigue al paddle antes del lanzamiento con Espacio.
- Los colores de bloque son las mismas keys que usa `drawSprite(ctx, \`block_${color}\`, ...)` en `assets/spritesheet.js`.

## Implementation plan

1. Crear `assets/logo-m10xaloid.svg`: logo estilo 8-bit con degradado top-down, texto "M10xaloid". Manual test: abrir el SVG directo en el navegador y verificar que se ve correctamente.
2. Crear el esqueleto `index.html` (canvas 800×600 centrado, enlaza `style.css` y `game.js`, carga `assets/spritesheet.js`). Manual test: abrir `index.html`, ver un canvas vacío centrado, sin errores en consola.
3. Implementar el loop base del juego en `game.js` (`requestAnimationFrame` + `loadSpritesheet`) que solo limpia el canvas cada frame. Manual test: sin errores en consola, loop corriendo de forma estable.
4. Implementar la pantalla de inicio (`screen: 'start'`): dibuja el logo SVG y el texto "Presiona ESPACIO para iniciar"; la tecla Espacio cambia a `screen: 'playing'`. Manual test: ver la pantalla de inicio y confirmar el cambio de estado al presionar Espacio.
5. Implementar el paddle: sprite, movimiento con flechas ←/→ y A/D, clamp a los bordes del canvas. Manual test: mover el paddle de lado a lado sin que se salga del canvas.
6. Implementar la bola: enganchada al paddle al entrar en `playing`, se lanza con Espacio, rebota en paredes y en el paddle (ángulo según punto de impacto). Manual test: lanzar la bola y verla rebotar en paredes y paddle.
7. Implementar la grilla de bloques: generar `state.blocks` según `BLOCK_ROWS`/`BLOCK_COLS`/`BLOCK_ROW_COLORS` y dibujarlos con `drawSprite`. Manual test: ver los bloques renderizados sobre el área de juego.
8. Implementar la colisión bola-bloque: detectar impacto, desactivar el bloque, rebotar la bola, sumar `BLOCK_SCORE_VALUE` al score. Manual test: romper un bloque y confirmar que desaparece y el score sube.
9. Implementar animaciones de explosión (`EXPLOSION_FRAMES`) y sonidos (`break-sound.mp3` al romper un bloque, `ball-bounce.mp3` al rebotar). Manual test: romper un bloque y escuchar/ver la animación de 4 frames antes de que desaparezca.
10. Implementar el HUD (score y vidas) visible durante `playing`. Manual test: el HUD se actualiza en vivo mientras se juega.
11. Implementar la pérdida de vida: cuando la bola cae debajo del paddle, restar una vida y reenganchar la bola si quedan vidas. Manual test: dejar caer la bola y confirmar que baja una vida y la bola se reengancha al paddle.
12. Implementar la pantalla de Game Over: al llegar a 0 vidas, cambiar a `screen: 'gameover'`, mostrar el score final y "Presiona ESPACIO para reiniciar". Manual test: perder todas las vidas y ver la pantalla de Game Over.
13. Implementar la pantalla de Victoria: al desactivarse todos los bloques, cambiar a `screen: 'win'`, mostrar el score final y "Presiona ESPACIO para reiniciar". Manual test: romper todos los bloques y ver la pantalla de victoria.
14. Implementar el reinicio: desde `gameover` o `win`, Espacio resetea `score`, `lives`, `blocks`, `paddle` y `ball`, y vuelve a `screen: 'start'`. Manual test: reiniciar desde ambas pantallas y confirmar que los valores quedan en su estado inicial.
15. Implementar la pausa: la tecla P en `playing` cambia a `screen: 'paused'`, congela el loop y muestra un overlay "PAUSADO"; P de nuevo reanuda. Manual test: pausar y reanudar durante una partida y confirmar que el estado se congela y se reanuda correctamente.

## Acceptance criteria

- [x] El juego carga en `index.html` sin errores en la consola.
- [x] La pantalla de inicio muestra el logo "M10xaloid" y el texto "Presiona ESPACIO para iniciar".
- [x] Presionar Espacio en la pantalla de inicio comienza la partida (`screen: 'playing'`).
- [x] El paddle se mueve con las flechas ←/→ y con A/D, sin salirse de los límites del canvas.
- [x] La bola arranca enganchada al paddle y se lanza al presionar Espacio.
- [x] El ángulo de rebote de la bola contra el paddle cambia según el punto de impacto.
- [x] La bola rebota correctamente contra las paredes superior, izquierda y derecha del canvas.
- [x] Los bloques se renderizan en una grilla fija de `BLOCK_ROWS` × `BLOCK_COLS` con los colores definidos en `BLOCK_ROW_COLORS`.
- [x] Al golpear un bloque, este desaparece, se reproduce la animación de explosión de 4 frames y suena `break-sound.mp3`.
- [x] Cada bloque roto suma exactamente `BLOCK_SCORE_VALUE` puntos al score.
- [x] Cada rebote de la bola en pared o paddle reproduce `ball-bounce.mp3`.
- [x] El HUD muestra el score y las vidas restantes actualizados en tiempo real durante `playing`.
- [x] Cuando la bola cae debajo del paddle, se resta una vida y la bola se reengancha al paddle (si quedan vidas).
- [x] Al llegar a 0 vidas, aparece la pantalla de "Game Over" con el score final y opción de reiniciar.
- [x] Al destruir todos los bloques del nivel, aparece la pantalla de "¡Ganaste!" con el score final y opción de reiniciar.
- [x] Presionar Espacio en las pantallas de Game Over o Victoria resetea score, vidas, bloques, paddle y bola, y vuelve a la pantalla de inicio.
- [x] Presionar P durante `playing` pausa el juego (congela el loop) y muestra un overlay "PAUSADO"; presionar P de nuevo reanuda.
- [x] El puntaje no se conserva al recargar la página (no hay persistencia en este MVP).

## Decisions

- **Yes:** un solo nivel fijo de bloques. Simplifica el MVP; niveles múltiples se evalúan en un spec futuro.
- **No:** selección/progresión de niveles. Fuera de alcance por ahora.
- **Yes:** control solo por teclado (flechas + A/D). Más simple de implementar y probar que soporte de mouse.
- **No:** control por mouse. Se puede agregar después si se necesita.
- **Yes:** power-ups fuera del MVP. El spritesheet actual no tiene sprites de power-ups; se diseñarán en un spec dedicado junto con niveles adicionales.
- **Yes:** puntaje con valor fijo por bloque (`BLOCK_SCORE_VALUE`), sin diferenciar por color/fila. Mantiene el MVP simple; se puede sofisticar después.
- **No:** persistencia de score/high scores en localStorage. Se deja explícitamente para otra etapa.
- **Yes:** ángulo de rebote de la bola en el paddle según punto de impacto. Es el comportamiento estándar reconocible de Arkanoid.
- **Yes:** canvas fijo de 800×600 centrado. Evita bugs de reescalado de física; no responsive.
- **Yes:** logo "M10xaloid" como SVG nuevo en `assets/`, estilo 8-bit con degradado top-down. No existía ningún asset de logo previo.
- **Yes:** pausa con la tecla P. Se agrega al alcance del MVP a pedido explícito, junto con las pantallas de inicio/game over/victoria.
- **Yes:** el reinicio (desde Game Over o Victoria) vuelve a la pantalla de inicio, no directo a `playing`. Mantiene un flujo consistente de estados (start → playing → gameover/win → start).

## Risks

| Risk                                                                 | Mitigation                                                                                          |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Políticas de autoplay del navegador bloquean el audio antes de interacción del usuario | Los sonidos solo se reproducen después de que el jugador presiona Espacio por primera vez (gesto de usuario ya registrado). |
| A velocidades altas, la bola puede "atravesar" el paddle o un bloque en un solo frame (tunneling) | Se acepta como límite conocido del MVP; se mitiga limitando `BALL_INITIAL_SPEED` a un valor bajo (ver Data model). |

## What is **not** in this spec

- Power-ups.
- Múltiples niveles o progresión de niveles.
- Persistencia de puntuación/high scores (localStorage).
- Control por mouse.
- Sistemas de skins/temas visuales.
- Canvas responsive.

Cada uno de estos, si se implementa, va en su propio spec.
