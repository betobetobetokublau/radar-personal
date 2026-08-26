// Ronda 3: la dirección del dueño (wireframe adjunto 2026-08-13).
// 3 secciones a todo lo ancho: próximos eventos (cards horizontales arriba),
// semana Lun–Dom (SOLO íconos de hábitos por día + eventos anclados abajo),
// y dock de hábitos con "última vez" / "racha". Dos variantes: íconos a
// color por hábito (M) vs. monocromo slate DS-estricto (N).
import { writeFileSync } from "node:fs";
import {
  T, ic, DAYS, HAB_BY_NAME, toneSolid,
  zone, zoneTitle, shell, content,
} from "./generate-artboards.mjs";

// Paleta curada de colores de hábito (tonos apagados, familia del tema;
// extensión del DS pendiente de aprobación del dueño).
const HABIT_COLORS = {
  Meditar: "#C07A3D",          // ámbar apagado
  Agradecimientos: "#B05C6E",  // vino apagado
  Ejercicio: "#5B7BA6",        // azul pizarra
  "Leer 20 min": "#7C66B8",    // violeta apagado
  "Revisar finanzas": "#4E8F6E", // verde apagado
};
const habitColor = (name, mono) => (mono ? T.accent : HABIT_COLORS[name] || T.accent);

// estado del dock: hecho hoy → racha; pendiente → última vez
const DOCK = [
  { name: "Meditar", done: true, legend: "x4 días seguidos" },
  { name: "Ejercicio", done: true, legend: "x2 días seguidos" },
  { name: "Agradecimientos", done: false, legend: "ayer" },
  { name: "Leer 20 min", done: false, legend: "hace 3 días" },
  { name: "Revisar finanzas", done: false, legend: "hace 8 días" },
];

// próximos eventos como cards horizontales (arriba)
const UPCOMING_CARDS = [
  { rel: "Mañana", day: "Vie 14", t: "Entrega cliente Acme", alert: true },
  { rel: "En 3 días", day: "Dom 16", t: "Cumple de mamá" },
  { rel: "En 2 semanas", day: "Vie 28", t: "Pago de la tarjeta" },
  { rel: "En 3 semanas", day: "Sáb 5 sep", t: "Renovar seguro" },
  { rel: "En 1 mes y medio", day: "Sáb 26 sep", t: "Viaje a CDMX" },
];
const alertIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${T.errorSolid || "#A93226"}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;

const upcomingStrip = () => `
<div style="display:flex;flex-direction:column;gap:8px;flex:none">
  ${zoneTitle("calendar", "Próximos eventos", UPCOMING_CARDS.length)}
  <div style="display:flex;gap:10px">
    ${UPCOMING_CARDS.map((u) => `
    <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;padding:10px 14px;background:${T.surface};border:1px solid ${u.alert ? T.accent : T.border};border-radius:10px">
      <div style="display:flex;align-items:center;gap:6px">
        <span style="font-size:13.5px;font-weight:700;color:${T.text}">${u.rel}</span>
        <span style="font-size:12px;color:${T.muted}">· ${u.day}</span>
        ${u.alert ? `<span style="margin-left:auto">${alertIcon}</span>` : ""}
      </div>
      <div style="font-size:13.5px;color:${T.muted};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${u.t}</div>
    </div>`).join("")}
  </div>
</div>`;

// columna de día: header, pila de íconos de hábitos, eventos anclados abajo
const dayColumn = (day, mono) => {
  const events = {
    12: [{ t: "Dentista", past: true }],
    14: [{ t: "Entrega Acme", past: false }],
    16: [{ t: "Cumple de mamá", past: false }],
  }[day.n] || [];
  return `
  <div style="display:flex;flex-direction:column;gap:8px;border:1px solid ${day.today ? T.accent : T.border};border-radius:10px;padding:10px 8px;background:${day.today ? T.surface : "transparent"};min-width:0">
    <div style="text-align:center;padding-bottom:6px;border-bottom:1px solid ${T.border}">
      <div style="font-size:12px;font-weight:600;color:${day.today ? T.cta : T.muted};text-transform:uppercase;letter-spacing:.04em">${day.d}</div>
      <div class="display" style="font-size:27px;color:${T.text}">${day.n}</div>
      ${day.today ? `<div style="font-size:11px;font-weight:700;color:${T.cta}">HOY</div>` : ""}
    </div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:12px;padding-top:8px">
      ${day.habits.map((name) => {
        const h = HAB_BY_NAME[name];
        return `<span title="${name}" style="color:${habitColor(name, mono)}">${ic(h.icon, 26)}</span>`;
      }).join("")}
    </div>
    ${events.length ? `<div style="display:flex;flex-direction:column;gap:5px;border-top:1px solid ${T.border};padding-top:8px">
      ${events.map((e) => `
      <div style="display:flex;align-items:flex-start;gap:5px;font-size:12px;font-weight:600;color:${e.past ? T.muted : T.accent};${e.past ? "opacity:.7" : ""}">
        <span style="margin-top:1px">${ic("calendar", 12)}</span><span style="min-width:0">${e.t}</span>
      </div>`).join("")}
    </div>` : ""}
  </div>`;
};

const weekStrip = (mono) => `
<div style="flex:1;min-height:0;display:grid;grid-template-columns:repeat(7, minmax(0, 1fr));gap:10px">
  ${DAYS.map((d) => dayColumn(d, mono)).join("")}
</div>`;

// dock de hábitos: ícono + nombre + leyenda (racha o última vez)
const check = `<span style="width:18px;height:18px;border-radius:999px;background:#16704F;color:#FFFFFF;display:inline-flex;align-items:center;justify-content:center;flex:none">${ic("check", 11)}</span>`;
const habitDock = (mono) => `
<div style="display:flex;flex-direction:column;gap:8px;flex:none">
  <div style="display:flex;align-items:center;gap:8px">
    ${zoneTitle("activity", "Hábitos", DOCK.filter((d) => !d.done).length)}
    <span style="font-size:12px;color:${T.muted}">pendientes hoy</span>
  </div>
  <div style="display:flex;gap:10px">
    ${DOCK.map((d) => {
      const h = HAB_BY_NAME[d.name];
      return `
      <div style="position:relative;width:172px;display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 12px 12px;background:${T.surface};border:1px solid ${d.done ? T.accent : T.border};border-radius:10px">
        ${d.done ? `<span style="position:absolute;top:8px;right:8px">${check}</span>` : ""}
        <span style="position:relative;color:${habitColor(d.name, mono)}">
          ${ic(h.icon, 30)}
          <span title="Complejidad ${h.comp}" style="position:absolute;top:-2px;right:-6px;width:9px;height:9px;border-radius:999px;background:${toneSolid[h.compTone]};border:2px solid ${T.surface}"></span>
        </span>
        <span style="font-size:13.5px;font-weight:600;color:${T.text};white-space:nowrap">${d.name}</span>
        <span style="font-size:12px;font-weight:${d.done ? "600" : "400"};color:${d.done ? "#0E5239" : T.muted};${d.done ? `background:${T.successBg};padding:1px 8px;border-radius:999px` : ""}">${d.legend}</span>
      </div>`;
    }).join("")}
  </div>
</div>`;

const board = (name, mono) => shell(name, "semana",
  content(upcomingStrip() + weekStrip(mono) + habitDock(mono), { column: true }));

const boards = {
  MSemanal: board("M-Semanal", false),
  NSemanal: board("N-Semanal", true),
};
for (const [name, html] of Object.entries(boards)) {
  writeFileSync(`${name}.dc.html`, html);
  console.log(`✓ ${name}.dc.html (${(html.length / 1024).toFixed(1)} KB)`);
}
console.log("listo (canvas.json lo escribe generate-canvas-final.mjs)");
