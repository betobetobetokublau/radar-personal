// Ronda 2: la semana como CARDS HORIZONTALES apiladas (feedback del dueño:
// las 7 columnas verticales se ven muy delgadas). Anatomía de card:
//   1) título del día + número   2) pila horizontal de íconos de hábitos
//   completados   3) badges de eventos con fecha — secciones al 100% width.
import { writeFileSync } from "node:fs";
import {
  T, ic, HABITS, DAYS, UPCOMING, HAB_BY_NAME, toneSolid,
  header, zone, zoneTitle, habitRail, habitChips, upcomingRail,
  weekColumns, compBadge, checkCircle,
  shell, content,
} from "./generate-artboards.mjs";

const doneToday = HABITS.filter((h) => h.today);
const pendingToday = HABITS.filter((h) => !h.today);

// pastilla de ícono de hábito completado
const habitIcon = (name, { size = 28, solid = false } = {}) => {
  const h = HAB_BY_NAME[name];
  return `<span title="${h.name}" style="width:${size}px;height:${size}px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;flex:none;${
    solid ? `background:${T.accent};color:${T.onAccent}` : `background:${T.infoBg};color:${T.accent}`
  }">${ic(h.icon, Math.round(size * 0.56))}</span>`;
};
const habitIconPending = (h, size = 28) =>
  `<span title="${h.name} (pendiente)" style="width:${size}px;height:${size}px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;flex:none;border:1px dashed ${T.border};color:${T.muted};background:transparent">${ic(h.icon, Math.round(size * 0.56))}</span>`;

// badge de evento CON fecha
const eventBadge = (t, d) =>
  `<span style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:${T.infoBg};color:${T.accent};font-size:12px;font-weight:600">${ic("calendar", 12)} ${t} · ${d}</span>`;
const DAY_EVENT_DATES = { Dentista: "12 ago", "Entrega cliente Acme": "14 ago", "Cumple de mamá": "16 ago" };

// —— la card de día (anatomía del dueño) ——
const dayCard = (day, {
  iconSize = 28, solidIcons = false, showPending = false,
  tall = false, progress = false, flexHeight = true,
} = {}) => `
<div style="display:flex;flex-direction:column;gap:${tall ? "10px" : "6px"};padding:${tall ? "12px 16px" : "8px 14px"};border:1px solid ${day.today ? T.accent : T.border};border-radius:10px;background:${day.today ? T.surface : "transparent"};${flexHeight ? `flex:${tall ? "2.1" : "1"};` : ""}min-height:0">
  <div style="display:flex;align-items:baseline;gap:8px;width:100%">
    <span class="display" style="font-size:${tall ? "27px" : "19px"};color:${T.text}">${day.n}</span>
    <span style="font-size:12px;font-weight:600;color:${day.today ? T.cta : T.muted};text-transform:uppercase;letter-spacing:.04em">${day.d}</span>
    ${day.today ? `<span style="font-size:11px;font-weight:700;color:${T.cta}">HOY</span>` : ""}
    ${progress ? `<span style="margin-left:auto;font-size:12px;font-weight:600;padding:1px 8px;border-radius:999px;background:${T.infoBg};color:${T.accent}">${day.habits.length}/${HABITS.length}</span>` : ""}
  </div>
  <div style="display:flex;align-items:center;gap:6px;width:100%;min-height:${iconSize}px">
    ${day.habits.map((h) => habitIcon(h, { size: iconSize, solid: solidIcons })).join("")}
    ${showPending && day.today ? pendingToday.map((h) => habitIconPending(h, iconSize)).join("") : ""}
    ${!day.habits.length && !(showPending && day.today) ? `<span style="font-size:12px;color:${T.muted}">Sin hábitos registrados</span>` : ""}
  </div>
  ${day.events.length ? `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;width:100%">
    ${day.events.map((e) => eventBadge(e, DAY_EVENT_DATES[e] || "")).join("")}
  </div>` : ""}
</div>`;

const weekStack = (opts = {}) => `
<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px">
  ${DAYS.map((d) => dayCard(d, { ...opts, tall: opts.expandToday && d.today })).join("")}
</div>`;

// I · semana partida en dos columnas (Lun–Jue / Vie–Dom + resumen)
const weekTwoCols = () => {
  const resumen = `
  <div style="display:flex;flex-direction:column;gap:8px;padding:12px 14px;border:1px solid ${T.border};border-radius:10px;flex:1;min-height:0">
    <div style="font-size:12px;font-weight:700;color:${T.muted};text-transform:uppercase;letter-spacing:.05em">Resumen de la semana</div>
    <div style="display:flex;align-items:center;gap:8px">
      ${habitIcon("Meditar", { size: 32 })}<span style="font-size:13.5px;color:${T.text}"><span style="font-weight:600">Meditar</span> · 4 de 7 días</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px">
      ${habitIcon("Ejercicio", { size: 32 })}<span style="font-size:13.5px;color:${T.text}"><span style="font-weight:600">Ejercicio</span> · 2 de 7 días</span>
    </div>
    <div style="margin-top:auto;font-size:12px;color:${T.muted}">3 eventos esta semana</div>
  </div>`;
  const colA = DAYS.slice(0, 4).map((d) => dayCard(d, { iconSize: 32 })).join("");
  const colB = DAYS.slice(4).map((d) => dayCard(d, { iconSize: 32 })).join("") + resumen;
  return `
  <div style="flex:1;min-width:0;display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div style="display:flex;flex-direction:column;gap:8px;min-height:0">${colA}</div>
    <div style="display:flex;flex-direction:column;gap:8px;min-height:0">${colB}</div>
  </div>`;
};

// —— barra inferior de hábitos (K y L): 100% width, 15–25% del alto ——
// K · tarjetas con detalle (~24% del alto: 188px de 820)
const habitDockCards = () => zone(`
  ${zoneTitle("activity", "Hábitos de hoy", pendingToday.length)}
  <div style="display:flex;gap:10px;min-width:0">
    ${HABITS.map((h) => `
    <div style="flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:12px;background:${T.surface};border:1px solid ${T.border};border-radius:10px">
      ${checkCircle(h.today)}
      <span style="color:${T.muted}">${ic(h.icon, 20)}</span>
      <div style="min-width:0;flex:1">
        <div style="font-size:13.5px;font-weight:600;color:${T.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${h.today ? "text-decoration:line-through;color:" + T.muted : ""}">${h.name}</div>
        <div style="display:flex;align-items:center;gap:6px"><span style="font-size:12px;color:${T.muted}">${h.per}</span>${compBadge(h)}</div>
      </div>
    </div>`).join("")}
  </div>
`, "height:188px;flex:none");

// L · dock minimal (~16% del alto: 132px de 820)
const habitDockMinimal = () => zone(`
  <div style="display:flex;align-items:center;gap:10px;height:100%">
    <div style="display:flex;flex-direction:column;gap:2px;width:150px;flex:none">
      <div class="display" style="font-size:15px;color:${T.text}">Hábitos de hoy</div>
      <div style="font-size:12px;color:${T.muted}">${doneToday.length} de ${HABITS.length} completados</div>
    </div>
    <div style="flex:1;display:flex;justify-content:space-around;align-items:center;gap:10px">
      ${HABITS.map((h) => `
      <div title="${h.comp} · ${h.per}" style="display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0">
        <span style="position:relative;width:48px;height:48px;border-radius:999px;display:inline-flex;align-items:center;justify-content:center;${h.today ? `background:${T.accent};color:${T.onAccent}` : `background:${T.surface};border:1px solid ${T.border};color:${T.muted}`}">
          ${ic(h.today ? "check" : h.icon, 22)}
          <span style="position:absolute;top:0;right:0;width:11px;height:11px;border-radius:999px;background:${toneSolid[h.compTone]};border:2px solid ${T.bg}"></span>
        </span>
        <span style="font-size:12px;font-weight:600;color:${h.today ? T.muted : T.text};white-space:nowrap;${h.today ? "text-decoration:line-through" : ""}">${h.name}</span>
      </div>`).join("")}
    </div>
  </div>
`, "height:132px;flex:none");

// —— las 5 propuestas (F–J), solo vista semanal ——
const boards = {
  FSemanal: shell("F-Semanal", "semana",
    content(habitRail() + weekStack() + upcomingRail({ mode: "list" }))),
  GSemanal: shell("G-Semanal", "semana",
    content(habitRail({ compact: true }) + weekStack({ expandToday: true, iconSize: 32, solidIcons: true }) + upcomingRail({ mode: "timeline", width: 224 }))),
  HSemanal: shell("H-Semanal", "semana",
    content(habitChips() + `<div style="flex:1;min-height:0;display:flex;gap:12px">${weekStack({ iconSize: 32 })}${upcomingRail({ mode: "list", width: 240 })}</div>`, { column: true })),
  ISemanal: shell("I-Semanal", "semana",
    content(habitRail() + weekTwoCols())),
  JSemanal: shell("J-Semanal", "semana",
    content(habitRail() + weekStack({ progress: true, showPending: true, solidIcons: true }) + upcomingRail({ mode: "grouped", width: 224 }))),
  // K/L: semana en columnas (SIN rail izquierdo → columnas ~30% más anchas)
  // + barra de hábitos abajo a todo lo ancho
  KSemanal: shell("K-Semanal", "semana",
    content(`<div style="flex:1;min-height:0;display:flex;gap:12px">${weekColumns()}${upcomingRail({ mode: "list", width: 236 })}</div>` + habitDockCards(), { column: true })),
  LSemanal: shell("L-Semanal", "semana",
    content(`<div style="flex:1;min-height:0;display:flex;gap:12px">${weekColumns()}${upcomingRail({ mode: "timeline", width: 224 })}</div>` + habitDockMinimal(), { column: true })),
};

for (const [name, html] of Object.entries(boards)) {
  writeFileSync(`${name}.dc.html`, html);
  console.log(`✓ ${name}.dc.html (${(html.length / 1024).toFixed(1)} KB)`);
}

// —— canvas.json completo: página 1 (ronda 1) + página 2 (ronda 2) ——
const W = 1180, H = 820, GX = 120, GY = 140;
const col = (i) => i * (W + GX);
const r1 = [
  ["Main", "AMensual", "A · Tres rieles", "Fiel al pedido: rail de hábitos + semana 7 columnas + próximos. Equilibrada.\nTradeoff: columnas de día angostas (~97px)."],
  ["BSemanal", "BMensual", "B · Hoy protagonista", "El día actual ocupa doble ancho: lo de HOY se lee desde lejos (pared).\nTradeoff: los otros días quedan más apretados."],
  ["CSemanal", "CMensual", "C · Chips arriba", "Hábitos como chips horizontales: un tap y listo; el calendario gana todo el ancho.\nTradeoff: los hábitos pierden detalle (complejidad/periodicidad ocultos)."],
  ["DSemanal", "DMensual", "D · Densa", "Rail de íconos (76px, punto de complejidad en la esquina) + mensual con puntos en vez de chips: máxima información por pantalla.\nTradeoff: menos legible a distancia; nombres y periodicidad solo al tocar."],
  ["ESemanal", "EMensual", "E · Agenda en filas", "La semana como 7 renglones: lectura natural tipo agenda, texto nunca apretado.\nTradeoff: los días con mucho contenido compiten por una sola línea."],
];
const r2 = [
  ["FSemanal", "F · Cards limpias", "Tu anatomía tal cual: día+número, pila de íconos, badges con fecha. El punto de partida.\nTradeoff: los días vacíos gastan el mismo alto que los llenos."],
  ["GSemanal", "G · Hoy expandido", "La card de HOY al doble de alto con íconos sólidos grandes — para leer desde la pared.\nTradeoff: los otros 6 días respiran menos."],
  ["HSemanal", "H · Ancho total", "Hábitos como chips arriba: las cards de día ganan TODO el ancho.\nTradeoff: hábitos sin complejidad/periodicidad a la vista (solo el punto de color)."],
  ["ISemanal", "I · Dos columnas", "Semana partida Lun–Jue / Vie–Dom + card de resumen semanal: cards altas y anchas.\nTradeoff: rompe la lectura lineal de la semana."],
  ["JSemanal", "J · Con progreso", "Cada card muestra su avance (2/5) y HOY enseña también los hábitos pendientes (punteados) — ves lo que falta, no solo lo hecho.\nTradeoff: más tinta por card."],
  ["KSemanal", "K · Hábitos abajo (tarjetas)", "Semana en columnas SIN rail izquierdo (columnas ~30% más anchas) + barra inferior de hábitos con detalle completo (~23% del alto).\nTradeoff: los hábitos quedan lejos del pulgar si el iPad está alto en la pared."],
  ["LSemanal", "L · Dock de hábitos", "Igual que K pero con dock minimal (~16% del alto): círculos grandes tocables, la semana gana aún más aire.\nTradeoff: complejidad/periodicidad solo como punto de color."],
];
const canvas = {
  pages: [
    { id: "ronda-1", name: "Ronda 1 · Columnas" },
    { id: "ronda-2", name: "Ronda 2 · Cards horizontales" },
  ],
  artboards: [
    ...r1.flatMap(([wk, mo, title], i) => [
      { file: `${wk}.dc.html`, x: col(i), y: 0, w: W, h: H, title: `${title} — Semanal`, page: "ronda-1" },
      { file: `${mo}.dc.html`, x: col(i), y: H + GY, w: W, h: H, title: `${title} — Mensual`, page: "ronda-1" },
    ]),
    ...r2.map(([file, title], i) => (
      { file: `${file}.dc.html`, x: col(i), y: 0, w: W, h: H, title: `${title} — Semanal`, page: "ronda-2" }
    )),
  ],
  annotations: [
    ...r1.map(([, , title, note], i) => ({
      id: `nota-${"abcde"[i]}`, x: col(i), y: -170, w: 460, text: `${title}\n${note}`, page: "ronda-1",
    })),
    ...r2.map(([, title, note], i) => ({
      id: `nota-${"fghijkl"[i]}`, x: col(i), y: -170, w: 460, text: `${title}\n${note}`, page: "ronda-2",
    })),
  ],
  launch: { view: "canvas", page: "ronda-2" },
};
writeFileSync("canvas.json", JSON.stringify(canvas, null, 2));
console.log("✓ canvas.json (2 páginas, abre en Ronda 2)");
