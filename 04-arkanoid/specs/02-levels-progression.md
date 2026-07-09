# SPEC 02 — Progresión de niveles

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-07-08
> **Objective:** Añadir progresión de 10 niveles al Arkanoid: al vaciar los bloques de la pantalla, el jugador confirma con Espacio el paso al siguiente nivel, que trae una nueva distribución de bloques generada proceduralmente, una bola más rápida, y —desde el nivel 3 en adelante— un paddle más pequeño.

## Scope

**In:**

- 10 niveles jugables en secuencia (1 a 10), reutilizando `game.js` (sin archivos nuevos).
- Al desactivarse todos los bloques del nivel actual (si `level < 10`): pantalla se congela, overlay "Nivel X completado - Presiona ESPACIO para continuar" sobre el canvas.
- Espacio en el overlay incrementa el nivel, genera la nueva distribución de bloques, ajusta velocidad de bola y ancho de paddle, reengancha la bola al paddle, y vuelve a `playing`.
- Distribución de bloques por nivel generada proceduralmente (más filas según el nivel, colores rotados), no 10 layouts diseñados a mano.
- Velocidad de la bola aumenta cada nivel con un tope máximo (evita que sea injugable/tunneling).
- Desde el nivel 3 en adelante el paddle se reduce a un ancho fijo más pequeño (no se sigue achicando en niveles 4-10).
- Score y vidas se conservan al pasar de nivel (no se resetean).
- HUD muestra el nivel actual además de score y vidas.
- Al completar el nivel 10, se reusa la pantalla de victoria (`win`) existente con el score final acumulado.
- `resetGame()` (desde Game Over o Victoria) vuelve a nivel 1, paddle y velocidad base.

**Out of scope (for future specs):**

- Power-ups.
- Selección manual de nivel / saltar de nivel.
- Persistencia de progreso de nivel entre sesiones (localStorage).
- Layouts de bloques diseñados a mano por nivel.
- Pantalla dedicada distinta de `win` para el fin del juego (se reusa la existente).
- Ajustes de dificultad más allá de velocidad de bola y ancho de paddle (ej. bloques indestructibles, multiplicadores de vida).

## Data model

```js
const MAX_LEVEL = 10;

// Ancho de paddle: base hasta nivel 2, reducido desde nivel 3 en adelante
const PADDLE_WIDTH_BASE = 100;
const PADDLE_WIDTH_REDUCED = 70; // aplica desde level >= 3

// Velocidad de bola: crece 1px/frame por nivel, con tope
const BALL_BASE_SPEED = 5;
const BALL_SPEED_INCREMENT = 1; // por nivel
const BALL_MAX_SPEED = 12;
// speedForLevel(level) = min(BALL_BASE_SPEED + BALL_SPEED_INCREMENT * (level - 1), BALL_MAX_SPEED)
// level: 1->5, 2->6, 3->7, 4->8, 5->9, 6->10, 7->11, 8->12, 9->12, 10->12

// Bloques: filas crecen con el nivel, tope en 8; columnas fijas en 10
const BLOCK_ROWS_BASE = 5;
const BLOCK_ROWS_MAX = 8;
const BLOCK_COLORS = [ 'gray', 'red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green' ];
// rowsForLevel(level) = min(BLOCK_ROWS_BASE + (level - 1), BLOCK_ROWS_MAX)
// color de la fila i en el nivel N = BLOCK_COLORS[(i + N - 1) % BLOCK_COLORS.length]

// Estado ampliado
state.level = 1; // 1..MAX_LEVEL
// screen agrega 'levelup' a los valores posibles:
// 'start' | 'playing' | 'paused' | 'levelup' | 'gameover' | 'win'
```

Conventions:

- Reutiliza las convenciones de coordenadas y velocidades de SPEC 01.
- `BLOCK_COLS` se mantiene fijo en 10 (definido en SPEC 01); solo las filas varían con el nivel.
- El paddle mantiene `PADDLE.height` y `PADDLE.speed` sin cambios; solo su `width` varía según el nivel.

## Implementation plan

1. Agregar constantes de nivel (`MAX_LEVEL`, velocidad/paddle/filas por nivel) y `state.level = 1`, sin cambiar comportamiento visible. Manual test: el juego se ve igual que antes.
2. Extraer la generación de bloques a `createBlocksForLevel(level)` usando `rowsForLevel`/color por nivel, llamada con `level = 1` en el arranque. Manual test: nivel 1 se ve igual que antes (5 filas, mismos colores).
3. Al vaciarse los bloques en `playing`: si `level < MAX_LEVEL` pasar a `screen: 'levelup'` en vez de `'win'`; si `level === MAX_LEVEL` pasar a `'win'` (comportamiento actual). Manual test: romper todos los bloques en nivel 1 muestra el overlay en vez de la pantalla de victoria.
4. Renderizar el overlay de `'levelup'`: fondo semitransparente sobre el juego congelado + texto "Nivel X completado - Presiona ESPACIO para continuar". Manual test: overlay visible y legible.
5. Manejar Espacio en `'levelup'`: incrementar `state.level`, regenerar bloques con `createBlocksForLevel`, reenganchar la bola al paddle, volver a `'playing'`. Manual test: tras presionar espacio aparece la nueva grilla de bloques del nivel siguiente.
6. Aplicar velocidad de bola según nivel (`speedForLevel`) en el lanzamiento inicial y en cada relanzamiento tras perder una vida. Manual test: la bola se lanza notablemente más rápido en nivel 3 que en nivel 1.
7. Aplicar ancho de paddle según nivel (`PADDLE_WIDTH_REDUCED` desde nivel 3) al entrar a `'playing'` tras un level-up, con clamp de posición para que no quede fuera del canvas. Manual test: al llegar a nivel 3 el paddle se ve más pequeño.
8. Actualizar el HUD para mostrar "Nivel N" junto a score y vidas. Manual test: el HUD refleja el nivel actual y cambia al pasar de nivel.
9. Actualizar `resetGame()` para reiniciar `level = 1`, paddle y velocidad base. Manual test: tras Game Over o Victoria en un nivel avanzado, reiniciar vuelve a nivel 1 con paddle completo.

## Acceptance criteria

- [x] Al vaciar los bloques del nivel 1 (con `level < 10`), el juego se congela y aparece un overlay "Nivel 1 completado - Presiona ESPACIO para continuar".
- [x] Presionar Espacio en el overlay pasa a `level 2`, genera una nueva distribución de bloques y vuelve a `'playing'`.
- [ ] La velocidad de la bola en el nivel 2 es mayor que en el nivel 1, y en el nivel 3 mayor que en el nivel 2, siguiendo `speedForLevel`.
- [x] La velocidad de la bola nunca supera `BALL_MAX_SPEED` (12) sin importar el nivel.
- [x] Desde el nivel 3 en adelante el paddle mide `PADDLE_WIDTH_REDUCED` (70px) en vez de 100px.
- [x] En los niveles 1 y 2 el paddle mide el ancho base (100px).
- [x] Cada nivel usa `rowsForLevel(level)` filas de bloques (tope en 8) con colores rotados según `BLOCK_COLORS`.
- [x] El score y las vidas no se resetean al pasar de un nivel a otro.
- [x] El HUD muestra el nivel actual en todo momento durante `'playing'`, `'paused'` y `'levelup'`.
- [x] Al vaciar los bloques del nivel 10, aparece la pantalla de victoria (`'win'`) existente con el score final acumulado (no aparece el overlay de `'levelup'`).
- [x] Al reiniciar desde Game Over o Victoria, el juego vuelve a nivel 1 con paddle de ancho base y velocidad de bola base.
- [x] Perder una vida en cualquier nivel > 1 reengancha la bola al paddle sin resetear el nivel, el score ni la distribución de bloques restante.

## Decisions

- **Yes:** overlay de transición de nivel sobre el juego congelado (como la pausa), no una pantalla dedicada nueva. Reutiliza el patrón visual ya existente de `'paused'`.
- **No:** pantalla dedicada `'levelcomplete'` separada del canvas de juego. Innecesaria dado el patrón de overlay elegido.
- **Yes:** distribución de bloques procedural (fórmula de filas/colores por nivel) en vez de 10 layouts diseñados a mano. Reduce el trabajo de diseño y es suficiente para dar variedad perceptible.
- **No:** layouts manuales por nivel. Se puede revisar en un spec futuro si se quiere curar el diseño de cada nivel.
- **Yes:** velocidad de bola con tope máximo (`BALL_MAX_SPEED`). Sin tope, en niveles altos la bola sería prácticamente imposible de seguir y aumentaría el riesgo de tunneling (ver Risks de SPEC 01).
- **Yes:** el paddle se reduce una sola vez (desde nivel 3) y no sigue achicándose en niveles 4-10. Evita que el juego se vuelva injugable; ya es suficientemente difícil con la bola más rápida.
- **No:** seguir achicando el paddle en cada nivel hasta el 10. Descartado por el mismo motivo.
- **Yes:** score y vidas se conservan entre niveles. Es el comportamiento estándar de Arkanoid; reiniciarlos por nivel penalizaría innecesariamente al jugador.
- **Yes:** reusar la pantalla `'win'` existente al completar el nivel 10, en vez de crear una pantalla nueva de "juego completado". Minimiza cambios y ya comunica claramente el fin del juego.
- **No:** selección manual de nivel o salto de nivel. Fuera de alcance; el progreso es siempre secuencial.

## Risks

| Risk | Mitigation |
| --- | --- |
| A velocidad máxima (12px/frame) la bola puede seguir atravesando el paddle o bloques en un frame (tunneling), agravándose respecto al MVP | Se acepta como límite conocido (igual que en SPEC 01); `BALL_MAX_SPEED` se fijó deliberadamente bajo para acotar el riesgo. |
| Probar manualmente los 10 niveles completos es lento (hay que romper todos los bloques 10 veces) | Durante la verificación se puede forzar `state.level` y regenerar bloques desde la consola del navegador para validar niveles altos sin jugar los anteriores. |
| Con `BLOCK_ROWS_MAX = 8` y `BLOCK_COLS = 10` fijas, los bloques de las filas inferiores pueden quedar muy cerca del paddle en niveles altos | Se acepta para este spec; si se vuelve un problema se puede ajustar `BLOCK_ROWS_MAX` o el offset vertical en una iteración futura. |

## What is **not** in this spec

- Power-ups.
- Selección manual de nivel / saltar de nivel.
- Persistencia de progreso de nivel entre sesiones (localStorage).
- Layouts de bloques diseñados a mano por nivel.
- Pantalla dedicada distinta de `win` para el fin del juego.
- Ajustes de dificultad adicionales (bloques indestructibles, multiplicadores de vida, etc.).

Cada uno de estos, si se implementa, va en su propio spec.
