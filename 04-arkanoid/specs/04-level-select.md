# SPEC 04 — Selección de nivel inicial

> **Status:** Draft
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-07-09
> **Objective:** Permitir elegir en la pantalla de inicio el nivel (1 a 10) en el que arranca la partida, tipeando su dígito (1-9, 0 para el nivel 10) antes de confirmar con Espacio, que sigue iniciando en el nivel 1 por defecto.

## Scope

**In:**

- Nuevo campo de estado, `state.selectedLevel`, con valor por defecto `1`, relevante solo en `screen: 'start'`.
- En la pantalla de inicio, las teclas de dígito **1-9** seleccionan los niveles 1-9; la tecla **0** selecciona el nivel 10.
- Todos los 10 niveles están libremente disponibles desde el inicio (sin sistema de desbloqueo por progreso).
- La pantalla de inicio muestra el nivel actualmente seleccionado (ej. "Nivel seleccionado: 1"), actualizándose en vivo cada vez que se tipea un dígito distinto.
- Presionar Espacio en `'start'` inicia la partida en `state.selectedLevel`: fija `state.level`, genera bloques con `createBlocksForLevel(level)`, y aplica ancho de paddle (`paddleWidthForLevel`) correspondiente a ese nivel.
- Score inicia en 0 y vidas en `STARTING_LIVES` (3) sin importar el nivel elegido.
- `resetGame()` vuelve a `screen: 'start'` y reinicia `state.selectedLevel` a `1` (selección fresca en cada reinicio, el jugador debe volver a tipear si quiere otro nivel distinto de 1).

**Out of scope (for future specs):**

- Persistencia del nivel seleccionado entre sesiones/recargas.
- Sistema de desbloqueo de niveles según progreso alcanzado.
- Selección o salto de nivel durante la partida (`'playing'`, `'paused'`, `'levelup'`) — ya excluido en SPEC 02.
- Soporte de teclado numérico (Numpad); solo los dígitos de la fila superior del teclado.
- Validación o advertencias adicionales más allá del texto de nivel seleccionado.

Nota: aplicar `speedForLevel(level)` no requiere ningún cambio adicional — ya se calcula a partir de `state.level` en el momento del lanzamiento de la bola (SPEC 02).

## Data model

```js
// Estado ampliado
state.selectedLevel = 1; // 1..MAX_LEVEL; solo relevante en screen 'start'
```

Conventions:

- Mapeo de teclas en `'start'`: `Digit1`...`Digit9` → niveles 1-9; `Digit0` → nivel 10 (reutilizando `e.code`, igual que `KeyA`/`KeyD` ya usados en el proyecto).
- Al confirmar con Espacio en `'start'`: `state.level = state.selectedLevel`, luego se reutilizan `createBlocksForLevel(state.level)` y `paddleWidthForLevel(state.level)` (de SPEC 02) para inicializar bloques y paddle antes de pasar a `'playing'`.
- No se introduce ninguna estructura de datos nueva más allá de `state.selectedLevel`.

## Implementation plan

1. Agregar `state.selectedLevel = 1` al objeto `state`, sin cambiar comportamiento visible. Manual test: el juego carga sin errores; `state.selectedLevel` es `1` por defecto (verificable desde consola).
2. Manejar las teclas de dígito (`Digit1`...`Digit9`, `Digit0`) en el listener de `keydown`: solo si `state.screen === 'start'`, fijar `state.selectedLevel` (1-9, o 10 para `Digit0`). Manual test: en la pantalla de inicio, presionar un dígito cambia `state.selectedLevel` (verificable desde consola).
3. Actualizar `renderStartScreen()` para mostrar el nivel seleccionado (ej. "Nivel seleccionado: N") debajo del texto "Presiona ESPACIO para iniciar". Manual test: al tipear distintos dígitos en la pantalla de inicio, el texto en pantalla refleja el cambio en vivo.
4. Actualizar el manejo de Espacio en `'start'`: fijar `state.level = state.selectedLevel`, regenerar `state.blocks` con `createBlocksForLevel(state.level)`, aplicar `paddleWidthForLevel(state.level)` al paddle (con el mismo clamp de posición usado en `'levelup'`), y recién entonces pasar a `screen: 'playing'`. Manual test: seleccionar nivel 5 con la tecla `5`, presionar Espacio, y confirmar que arranca en nivel 5 con la cantidad de filas de bloques y el ancho de paddle correspondientes (paddle reducido, ya que nivel ≥ 3).
5. Actualizar `resetGame()` para reiniciar `state.selectedLevel = 1` junto con el resto del estado. Manual test: tras Game Over o Victoria habiendo arrancado en un nivel > 1, `resetGame()` vuelve a `'start'` mostrando "Nivel seleccionado: 1".

## Acceptance criteria

- [ ] Al cargar la página, `state.selectedLevel` es `1` y la pantalla de inicio muestra "Nivel seleccionado: 1".
- [ ] En la pantalla de inicio, presionar un dígito del 1 al 9 actualiza `state.selectedLevel` a ese número y el texto en pantalla lo refleja.
- [ ] En la pantalla de inicio, presionar el dígito 0 fija `state.selectedLevel` en 10 y el texto en pantalla muestra "Nivel seleccionado: 10".
- [ ] Presionar Espacio en `'start'` sin tipear ningún dígito inicia la partida en el nivel 1 (comportamiento actual preservado).
- [ ] Presionar Espacio en `'start'` después de tipear un dígito inicia la partida directamente en el nivel elegido, con la cantidad de filas de bloques (`rowsForLevel`) y el ancho de paddle (`paddleWidthForLevel`) correspondientes a ese nivel.
- [ ] Al arrancar en cualquier nivel > 1, el score inicia en 0 y las vidas en `STARTING_LIVES` (3).
- [ ] Tipear dígitos fuera de la pantalla `'start'` (durante `'playing'`, `'paused'`, `'levelup'`, `'gameover'`, `'win'`) no tiene ningún efecto sobre `state.level` ni `state.selectedLevel`.
- [ ] Al perder todas las vidas o ganar habiendo arrancado en un nivel > 1, presionar Espacio en Game Over/Victoria vuelve a `'start'` con "Nivel seleccionado: 1" (no se conserva el nivel de la partida anterior).
- [ ] Los 10 niveles son seleccionables desde el inicio sin ninguna restricción de desbloqueo.

## Decisions

- **Yes:** tipear un dígito selecciona el nivel sin iniciar la partida; Espacio confirma. Permite corregir la elección antes de arrancar.
- **No:** tipear un dígito inicia la partida de inmediato. Descartado para evitar arranques accidentales por apretar la tecla equivocada.
- **Yes:** dígito `0` mapea al nivel 10 (según pedido explícito: "los números del 1 al 0 simbolizan los niveles desde el 1 al 10").
- **Yes:** todos los 10 niveles son libremente seleccionables desde el inicio, sin sistema de desbloqueo por progreso. Es un requerimiento explícito y simplifica el alcance; un sistema de desbloqueo queda para un spec futuro si se pide.
- **No:** sistema de desbloqueo de niveles. Fuera de alcance por ahora.
- **Yes:** score en 0 y vidas base (3) sin importar el nivel elegido. Mantiene la partida comparable entre niveles de arranque; no hay pedido de penalización/bonificación por elegir un nivel alto.
- **No:** reducir vidas o modificar el score inicial según el nivel elegido. Descartado por falta de un requerimiento concreto para esa mecánica.
- **Yes:** `resetGame()` vuelve a `'start'` y resetea `state.selectedLevel` a 1. Consistente con SPEC 01 (el reinicio siempre pasa por la pantalla de inicio) y evita que una selección vieja persista sin que el jugador la note.
- **No:** soporte de teclado numérico (Numpad) para la selección. Los dígitos de la fila superior son suficientes y evita duplicar el manejo de teclas.

## Risks

| Risk | Mitigation |
| --- | --- |
| El mapeo de `e.code` (`Digit1`...`Digit0`) asume una distribución de teclado tipo QWERTY estándar; en layouts distintos (ej. AZERTY) la tecla física en esa posición podría no corresponder visualmente al número esperado | Se acepta como límite conocido; `e.code` es estable entre layouts para el mismo tipo de tecla física, y es el mismo enfoque ya usado en el proyecto (`KeyA`/`KeyD`). |
| Al no existir sistema de desbloqueo, un jugador puede arrancar directo en nivel 10 sin haber jugado los anteriores, saltándose la curva de dificultad progresiva de SPEC 02 | Aceptado; es un requerimiento explícito del usuario. Si se necesita curva de progresión forzada, se evalúa en un spec futuro de desbloqueo de niveles. |

## What is **not** in this spec

- Persistencia del nivel seleccionado entre sesiones/recargas.
- Sistema de desbloqueo de niveles según progreso alcanzado.
- Selección o salto de nivel durante la partida (`'playing'`, `'paused'`, `'levelup'`).
- Soporte de teclado numérico (Numpad).
- Validación o advertencias adicionales más allá del texto de nivel seleccionado.

Cada uno de estos, si se implementa, va en su propio spec.
