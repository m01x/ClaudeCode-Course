# SPEC 03 — Página About y formulario de contacto (Resend)

> **Status:** Implementado
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-07-17
> **Objective:** Portar la página About del prototipo (`references/templates/home-about/about.jsx`) a `/acerca-de` en Next.js, con un formulario de contacto que envía el mensaje como correo real vía Resend a través de un Server Action.

## Scope

**In:**

- `app/acerca-de/page.tsx`: página About portada de `about.jsx` — hero de misión con `highlight-row` (3 highlights: HECHO CON ❤️, JUEGOS EN HTML, PROYECTO EN CRECIMIENTO), banner divisor de píxeles, y sección de contacto (intro con tips + formulario).
- Formulario de contacto con campos NOMBRE, CORREO ELECTRÓNICO, MENSAJE: validación de campos no vacíos (igual que el template, con el efecto `shake`) + validación básica de formato de email (nuevo respecto al template).
- Server Action (`app/acerca-de/actions.ts`) que usa el SDK de `resend` para enviar el mensaje como correo real a `CONTACT_TO_EMAIL`, desde `CONTACT_FROM_EMAIL` (`onboarding@resend.dev`), con el nombre/email/mensaje del formulario.
- Estado de éxito: pantalla `terminal-success` portada tal cual del template, mostrada tras un envío exitoso.
- Estado de error (nuevo, no existe en el template): si el Server Action falla (Resend caído, credenciales inválidas, etc.), el formulario muestra un mensaje de error visible y permanece editable con los datos ingresados, sin perderlos.
- Hook de scroll-reveal local (IntersectionObserver sobre `.reveal`) portado con el mismo patrón usado en Home (spec 02): copia local a esta página, no compartida.
- `HighlightIcon` (íconos SVG pixel-art para HEART/BROWSER/PLANT) portado tal cual.
- Estilos portados desde `references/templates/home-about/styles.css` (`.about-*`, `.contact-*`, `.highlight*`, `.terminal-success`, `.div-pixels`, etc.) hacia `app/globals.css`.
- Nueva dependencia `resend` agregada a `package.json`.
- Variables de entorno `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (`fortiz.informatica@gmail.com`) y `CONTACT_FROM_EMAIL` (`onboarding@resend.dev`), documentadas en un nuevo `.env.example` committeado (los valores reales van en `.env.local`, ya ignorado por `.gitignore`).

**Out of scope (para futuros specs):**

- Persistencia de los mensajes de contacto (localStorage, base de datos, etc.) — solo se envían por correo, no se guarda historial ni "bandeja de mensajes" dentro de la app.
- Protección anti-spam (honeypot, captcha, rate limiting).
- Dominio propio verificado en Resend — se usa el dominio de pruebas `onboarding@resend.dev`; migrar a un dominio propio queda para un spec futuro si se necesita.
- Internacionalización.
- Tests automatizados (no hay framework configurado en el proyecto).
- Cambios al Nav más allá de lo ya hecho en spec 02 — el enlace "Acerca de" (`/acerca-de`) y su lógica de estado activo (`isAboutActive`) ya existen.
- Cambios a Home, Biblioteca, Auth o Salón de la Fama.

## Data model

```ts
// Estado local del formulario, en app/acerca-de/page.tsx
type ContactFormState = {
  name: string;
  email: string;
  msg: string;
};

// Resultado del Server Action, usado por el cliente para decidir qué UI mostrar
type ContactActionResult =
  | { ok: true }
  | { ok: false; error: string };

// Firma del Server Action, en app/acerca-de/actions.ts
// sendContactMessage(data: ContactFormState): Promise<ContactActionResult>
```

Variables de entorno (`.env.example` documentado, valores reales en `.env.local`):

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=fortiz.informatica@gmail.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
```

Convenciones:

- `ContactFormState` y `ContactActionResult` viven local a `app/acerca-de/` (dentro de `actions.ts`), sin promoverse a `lib/types.ts`, siguiendo el mismo criterio que spec 02 para datos que no se consumen fuera de una sola página.
- El correo enviado usa como asunto `[Arcade Vault] Nuevo mensaje de contacto de {name}` y como cuerpo el email y el mensaje del remitente.
- No se agrega ni modifica nada en `lib/data.ts`.

## Implementation plan

1. Instalar la dependencia `resend` (`npm install resend`) y crear `.env.example` documentando `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` (sin valores reales de API key). Test manual: `npm run dev` sigue funcionando igual que antes, sin cambios funcionales todavía.
2. Portar los estilos de About/Contacto desde `references/templates/home-about/styles.css` (`.about-*`, `.contact-*`, `.highlight*`, `.terminal-success`, `.div-pixels`, etc.) hacia `app/globals.css`. Test manual: `npm run dev` sigue sirviendo todas las rutas existentes sin errores de CSS ni de consola.
3. Crear `app/acerca-de/page.tsx` (client component) con el hero de misión, `highlight-row` + `HighlightIcon`, banner divisor y el hook `useReveal` local, sin la sección de contacto todavía. Test manual: navegar a `/acerca-de` muestra el hero de misión con highlights y el divisor; el link "Acerca de" del Nav aparece resaltado como activo.
4. Agregar la sección de contacto a `app/acerca-de/page.tsx`: intro con tips y formulario controlado (`ContactFormState`) con validación de campos vacíos (shake) + validación de formato de email, con el submit todavía simulado localmente (sin llamar al Server Action). Test manual: enviar el formulario con datos válidos muestra `terminal-success`; dejar un campo vacío o un email inválido dispara el shake sin "enviar" nada.
5. Crear `app/acerca-de/actions.ts` con el Server Action `sendContactMessage`, que usa el SDK `resend` (instanciado con `RESEND_API_KEY`) para enviar el correo a `CONTACT_TO_EMAIL` desde `CONTACT_FROM_EMAIL`, devolviendo `ContactActionResult`. Conectar el submit del formulario a este Server Action en lugar del mock. Test manual: con `RESEND_API_KEY` real en `.env.local`, enviar el formulario hace llegar un correo real a `fortiz.informatica@gmail.com` y muestra `terminal-success`.
6. Agregar el estado de error en el formulario: si `sendContactMessage` devuelve `{ ok: false, error }`, mostrar un mensaje de error visible sin perder los datos ingresados, en vez de `terminal-success`. Test manual: con `RESEND_API_KEY` inválida o vacía, enviar el formulario muestra el estado de error en vez de fallar silenciosamente o crashear la página.
7. Verificación manual completa de `/acerca-de` contra los criterios de aceptación (ver siguiente sección).

## Acceptance criteria

- [x] `npm run dev` levanta la app sin errores en consola del navegador ni del servidor.
- [x] `/acerca-de` muestra el hero de misión con kicker, título "ACERCA DE ARCADE VAULT" y el texto de misión.
- [x] Los 3 highlights (HECHO CON ❤️, JUEGOS EN HTML, PROYECTO EN CRECIMIENTO) se muestran con su ícono correspondiente.
- [x] Al hacer scroll, las secciones con clase `.reveal` aparecen animadas (se agrega la clase `.in` al entrar en el viewport).
- [x] El banner divisor de píxeles se renderiza entre el hero y la sección de contacto.
- [x] La sección de contacto muestra el kicker, el título "CONTÁCTANOS", el texto introductorio y los 3 tips.
- [x] El formulario muestra los campos NOMBRE, CORREO ELECTRÓNICO y MENSAJE.
- [x] Enviar el formulario con algún campo vacío dispara el efecto shake y no envía el correo.
- [x] Enviar el formulario con un email de formato inválido (ej. `abc`) dispara el shake y no envía el correo.
- [x] Enviar el formulario con datos válidos envía un correo real a `fortiz.informatica@gmail.com` vía Resend.
- [x] Tras un envío exitoso se muestra la pantalla `terminal-success` con el nombre del remitente en mayúsculas.
- [x] Desde `terminal-success`, el botón "ENVIAR OTRO MENSAJE" limpia el formulario y permite un nuevo envío.
- [x] Si el envío falla (ej. `RESEND_API_KEY` inválida o vacía), se muestra un mensaje de error visible y los datos ingresados no se pierden.
- [x] El link "Acerca de" del Nav navega a `/acerca-de` y aparece resaltado como activo en esa ruta (ya no cae en la página 404).
- [x] `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` están documentadas en `.env.example` sin valores reales de API key.

## Decisions

- **Yes:** Server Action (`app/acerca-de/actions.ts`) para el envío de correo, en vez de un Route Handler. Es el patrón recomendado en los docs de Next 16 pinned para mutaciones de formularios y evita exponer un endpoint público sin un consumidor real hoy.
- **No:** Route Handler (`app/api/contacto/route.ts`). Más código sin beneficio actual — nada más llamaría a ese endpoint.
- **Yes:** destinatario fijo `fortiz.informatica@gmail.com` vía `CONTACT_TO_EMAIL`. Correo real confirmado por el usuario, en vez de dejar un placeholder sin completar.
- **Yes:** remitente `onboarding@resend.dev` (dominio de pruebas de Resend). No hay dominio propio verificado todavía; permite enviar correos reales sin configurar DNS.
- **No:** dominio propio verificado en Resend. Queda para un spec futuro si se necesita branding en el remitente.
- **Yes:** agregar validación de formato de email en el cliente, además de la validación de "campo no vacío" que ya traía el template. Evita envíos con emails claramente inválidos.
- **Yes:** agregar un estado de error visible en el formulario cuando el Server Action falla. El template original (`about.jsx`) no lo contempla porque ahí el envío era simulado; con un envío real a Resend, un fallo de red o credenciales es un caso esperado que debe comunicarse.
- **No:** persistir los mensajes de contacto (localStorage o backend). Es contenido transaccional que se envía y se olvida, a diferencia de datos de la app como `GAMES` o la sesión.
- **No:** protección anti-spam (honeypot, captcha, rate limiting). Fuera de alcance de este spec; se puede agregar después si se vuelve un problema real.
- **Yes:** `ContactFormState` y `ContactActionResult` viven local a `app/acerca-de/`, sin promoverse a `lib/types.ts`. Mismo criterio usado en spec 02 para datos que no se consumen fuera de una sola página.
- **Yes:** estilos portados tal cual desde `styles.css` a `app/globals.css`, siguiendo el mismo criterio de fidelidad visual usado en specs 01 y 02.
- **Yes:** hook de scroll-reveal (`useReveal`) con alcance local a la página About, igual que en Home (spec 02) — no se comparte como hook global.
- **Yes:** `.env.example` committeado documentando las 3 variables sin valores reales; `.env.local` con los valores reales queda fuera de git (ya cubierto por el `.env*` existente en `.gitignore`).
- **No:** tests automatizados. No hay framework de testing configurado en el proyecto (ver CLAUDE.md).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El dominio de pruebas `onboarding@resend.dev` de Resend, sin un dominio propio verificado, normalmente solo permite enviar a la casilla asociada a la cuenta de Resend usada para crear el API key. | Confirmar que la cuenta de Resend con la que se genera `RESEND_API_KEY` sea la de `fortiz.informatica@gmail.com` (`CONTACT_TO_EMAIL`). Si no lo es, los envíos de prueba pueden fallar hasta verificar un dominio propio (fuera de alcance de este spec). |
| `RESEND_API_KEY` ausente o inválida en el entorno donde corre la app. | El Server Action captura el error de la llamada a Resend y devuelve `{ ok: false, error }` en vez de dejar que la página crashee; el formulario muestra el estado de error definido en el plan de implementación. |
| Límite de envíos del plan gratuito de Resend. | Riesgo conocido, sin mitigación automática en este spec — no hay rate limiting del lado del formulario (decisión explícita: anti-spam fuera de alcance). |

## What is **not** in this spec

- Persistencia de mensajes de contacto (localStorage o backend).
- Protección anti-spam (honeypot, captcha, rate limiting).
- Dominio propio verificado en Resend.
- Internacionalización.
- Tests automatizados.

Cada uno de estos, si se necesita, va en su propio spec.
