# Design System — Radar Personal

> Contrato de diseño del proyecto. Generado por /design-consultation el
> 2026-08-13, anclado al logo del proyecto (`public/logo.png`). Reemplaza al
> tema de arranque "Serio" de raicode: cambió la piel (colores + fuentes),
> se conservaron los huesos (spacing, radii, sombras, motion, utilidades).
> La implementación viva es `app/globals.css` — tema `[data-theme="radar"]`.

## Contexto del producto

- **Qué es:** panel personal de 3 listas (tareas, fechas con cuenta
  regresiva, proyectos con nota) con acomodos configurables.
- **Para quién:** un solo usuario (Beto). Sin colaboración.
- **Superficies:** iPad 11″ horizontal SIEMPRE prendido en una pared
  (caso principal, ~1180×820 pt) + celular como PWA instalada.
- **Tipo:** herramienta de trabajo personal, densidad media, cero adorno.

## Dirección estética

- **Dirección:** industrial-precisa — la "B" del logo es una grotesca
  geométrica pesada; el producto se siente como ella: sobrio, sólido,
  sin decoración, legible a distancia.
- **Decoración:** mínima. La jerarquía la hacen el peso y el espacio,
  nunca el color ni los adornos.
- **Mood:** una herramienta que está tranquila en la pared de una casa.
  Ni estridente ni tibia; presente.

## Color (implementado en `app/globals.css`, tema `radar`)

Un solo acento protagonista — **el color exacto del logo** — y neutros
fríos derivados de su misma familia (azul-gris, hue ~197°). Nunca
inventar colores nuevos; usar SIEMPRE los tokens vía utilidades
(`bg-app`, `text-default`, `btn-primary`, `var(--c-*)`).

| rol | claro | oscuro |
| --- | --- | --- |
| bg | `#F5F7F8` | `#101517` |
| surface | `#FFFFFF` | `#191F22` |
| border | `#DBE1E5` | `#2B343A` |
| text | `#1C2429` | `#E7ECEE` |
| text-muted | `#5A6871` | `#97A5AC` |
| accent / hover / on | `#3C464A` / `#2A3236` / `#FFFFFF` | `#A9BEC7` / `#BFD1D8` / `#0D1418` |
| cta / hover / on | `#1B62E0` / `#154EB8` / `#FFFFFF` | `#66A3F2` / `#85B7F6` / `#0B1524` |
| success / bg / on | `#16704F` / `#E4F1EB` / `#0E5239` | `#5CC49B` / `#10291F` / `#9BDFC4` |
| warning / bg / on | `#8C6112` / `#F7EEDC` / `#66450A` | `#DDB566` / `#2A2210` / `#EED8A2` |
| error / bg / on | `#A93226` / `#F9E7E5` / `#7E2119` | `#EC8175` / `#301714` / `#F7B4AB` |
| info (= accent) / bg | `#3C464A` / `#E8ECEE` | `#A9BEC7` / `#202B31` |

- **Acento vs. CTA (regla de uso):** el **acento** (slate del logo) marca
  IDENTIDAD y SELECCIÓN — navegación activa, círculos tachados, tabs,
  contadores. El **CTA** (azul vibrante) marca ACCIÓN — todos los botones
  primarios (`btn-primary`: agregar, guardar, entrar). Razón: el slate en
  un botón parecía deshabilitado (el estado disabled también es gris).
  Nunca usar el CTA como color de texto decorativo ni de fondo de secciones.
- **Verificación:** los 16 pares texto/fondo clave pasan WCAG AA
  (mínimo 5.35:1; la mayoría >7:1) + los 2 pares del CTA (5.43:1 claro,
  7.05:1 oscuro). Validado por script el 2026-08-13.
- **Modo oscuro:** primera clase (el iPad de pared vive de noche). El
  acento se invierte a un slate claro (`#A9BEC7`); los semánticos se
  heredaron del tema anterior (ya verificados en oscuro).
- Los semánticos (success/warning/error) se conservaron del tema Serio:
  tonalmente compatibles con el slate y ya auditados AA.

## Tipografía (via `next/font/google` en `app/layout.tsx`)

- **Display:** **Archivo** 700 (títulos, nombre de la app, números
  grandes) — grotesca geométrica con ADN industrial: la misma sangre que
  la letra del logo. Pesos 500/600/700.
- **Body:** **Instrument Sans** 400/500/600 — humanista-grotesca, muy
  legible en tamaños chicos y a distancia (pared). Soporta
  `tabular-nums` (usado por `.num` en cuentas regresivas y contadores).
- **Escala:** 12 / 13.5 / 15 / 19 / 27 / 38 px (sin cambios).
  Line-height 1.15 títulos, 1.55 texto.
- Nunca agregar una segunda familia ni cargar fuentes por CSS `@import`.

## Spacing, radii, sombras, motion (LOS HUESOS — sin cambios)

- Spacing: escala 4px (1=4 … 20=80). Padding de card 22-24px (16px móvil).
- Radii: sm 6 / md 10 / lg 16 / full 999.
- Sombras: solo `--shadow-1` y `--shadow-2`.
- Motion: 200ms `cubic-bezier(.2,0,.2,1)` en color/border/opacity/shadow,
  más las View Transitions del intercambio de zonas (ver Extensiones).

## Componentes

Los componentes base y v1.1 del sistema (badges, tabs, bottom-nav,
modal/sheet, toast, list-row, empty-state, skeleton, icon-btn, segmented)
viven como `@utility` en `app/globals.css` y NO cambiaron con el
branding. Reglas destacadas:

- **Estado vacío:** ninguna lista queda en blanco (título + línea de ayuda).
- **Destructivo:** borrar SIEMPRE confirma nombrando la cosa, foco inicial
  en Cancelar, peligroso arriba en móvil. Tachar = inmediato + Deshacer 7s.
- **Toast:** 4s informativo / 7s con acción; arriba en móvil.
- **Modal:** centrado en escritorio, sheet desde abajo en móvil.

## Iconografía

**Lucide**, única librería. `stroke-width` 1.75; 18px en botón con texto,
20px suelto, 22px en bottom-nav; caja tocable siempre ≥44px.

- **Excepción aprobada (2026-08-13):** cada lista tiene un **ícono de
  identidad** junto a su título — `ListTodo` (Tareas), `CalendarDays`
  (Fechas), `FolderKanban` (Proyectos), definidos en
  `components/kindIcons.ts` y compartidos con el bottom-nav. Es funcional
  en este producto: con zonas intercambiables, el ícono identifica la
  lista de un vistazo a distancia de pared. Fuera de este caso, sigue
  prohibido el ícono decorativo junto a títulos.
- Cero emoji en la UI.

## Móvil (el celular entra por PWA)

Un solo breakpoint: **768px**. Abajo: una columna, pestañas en la barra
de abajo (nunca hamburguesa), inputs a 16px, botones ancho completo
≥48px, tablas → list-rows, nunca scroll horizontal de página.

## Logo y marca

- Archivo fuente: `public/logo.png` (376×422, fondo transparente).
- Favicon: `app/icon.png` (512², transparente). iOS: `app/apple-icon.png`
  (512², fondo `--c-bg` claro — iOS no soporta transparencia).
- Manifest/Android: `public/logo-512.png`; `theme_color #3C464A`,
  `background_color #F5F7F8` (espejo de tokens; el manifest no lee CSS).
- El logo se muestra en la pantalla de login (h-14). En el header basta
  el wordmark tipográfico.

## Colores de hábito (paleta curada, aprobada 2026-08-13)

Cada hábito tiene un color de IDENTIDAD además de su ícono (doble
codificación: a distancia de pared el color se lee antes que la forma).
Tokens `--c-habit-*` en `app/globals.css` (claro / oscuro):

| nombre | claro | oscuro |
| --- | --- | --- |
| ambar | `#C07A3D` | `#D9A06B` |
| vino | `#B05C6E` | `#D08A9B` |
| azul | `#5B7BA6` | `#8FB0D4` |
| violeta | `#7C66B8` | `#A796DB` |
| verde | `#4E8F6E` | `#7CBFA0` |

Reglas: SOLO para íconos y puntos de hábito — nunca texto, nunca fondos
grandes, nunca estados semánticos (eso sigue siendo de success/warning/
error). Máximo estos 5; un hábito nuevo elige de la paleta, no inventa.

## Extensiones del proyecto (aprobadas 2026-08-13)

- **Intercambio de zonas animado:** View Transitions API con
  `--motion-duration`/`--motion-easing`; instantáneo con
  `prefers-reduced-motion` o sin soporte del navegador.
- **`scroll-panel` / `scroll-panel-x`:** scroll interno de las zonas de
  altura fija; barra de 8px con `--c-border` (hover `--c-text-muted`),
  espacio siempre reservado.
- **Zonas del layout:** borde sutil (`--c-border`, `--radius-lg`), sin
  fondo propio, altura fija llenando la pantalla — el contenido scrollea
  adentro.

## Anti-patterns (vigentes)

- Nada de hex sueltos en componentes — solo tokens/utilidades.
- Nada de pixeles fuera de la escala de 4px.
- No usar el acento como fondo de secciones grandes.
- Ni una segunda familia tipográfica ni un segundo acento.
- Nunca menú hamburguesa; nunca borrar sin confirmar; nunca un toast
  para un error que exige decisión.
- Sin gradientes, sin 3D, sin ilustraciones decorativas.

## Bitácora de decisiones

| Fecha | Decisión | Razón |
|------|----------|-------|
| 2026-08-12 | Arranque con tema "Serio" de raicode | Default del scaffolding |
| 2026-08-13 | Íconos de identidad por lista | Zonas intercambiables: reconocimiento a distancia (pedido del dueño) |
| 2026-08-13 | Animación de swap + scrollbars tematizadas | Pedido del dueño; documentadas como extensiones |
| 2026-08-13 | Branding propio anclado al logo: paleta slate `#3C464A` + Archivo/Instrument Sans | /design-consultation con el logo como ancla (pedido del dueño); AA verificado por script |
| 2026-08-13 | Token CTA `#1B62E0` (azul de acción) separado del acento de identidad; `btn-primary` lo usa | El slate como botón parecía deshabilitado (feedback del dueño); AA verificado |
| 2026-08-13 | Ícono de identidad también en estados vacíos (32px, muted, arriba del título) | Pedido del dueño; refuerza el reconocimiento de lista |
