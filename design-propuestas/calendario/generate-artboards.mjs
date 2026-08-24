// Genera los 10 artboards (.dc.html) de las 5 propuestas del módulo
// calendario, usando los tokens EXACTOS del design system de radar-personal
// (app/globals.css, tema "radar").
import { writeFileSync } from "node:fs";

const T = {
  bg: "#F5F7F8", surface: "#FFFFFF", border: "#DBE1E5",
  text: "#1C2429", muted: "#5A6871",
  accent: "#3C464A", onAccent: "#FFFFFF",
  cta: "#1B62E0", onCta: "#FFFFFF",
  infoBg: "#E8ECEE", successBg: "#E4F1EB", onSuccessBg: "#0E5239",
  warningBg: "#F7EEDC", onWarningBg: "#66450A",
  errorBg: "#F9E7E5", onErrorBg: "#7E2119",
};

// —— íconos inline estilo Lucide (stroke 1.75, sin emoji) ——
const PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
  book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
  wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevL: '<polyline points="15 18 9 12 15 6"/>',
  chevR: '<polyline points="9 18 15 12 9 6"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
};
const ic = (name, size = 20, color = "currentColor") =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="flex:none">${PATHS[name]}</svg>`;

// —— datos de muestra (semana real: lun 10 – dom 16 ago 2026; hoy jue 13) ——
const HABITS = [
  { name: "Meditar", icon: "sun", comp: "Baja", compTone: "success", per: "Diaria", today: true },
  { name: "Agradecimientos", icon: "heart", comp: "Baja", compTone: "success", per: "Diaria", today: false },
  { name: "Ejercicio", icon: "activity", comp: "Media", compTone: "warning", per: "Diaria", today: true },
  { name: "Leer 20 min", icon: "book", comp: "Baja", compTone: "success", per: "Diaria", today: false },
  { name: "Revisar finanzas", icon: "wallet", comp: "Alta", compTone: "error", per: "Semanal", today: false },
];
const DAYS = [
  { d: "Lun", n: 10, habits: ["Meditar", "Agradecimientos"], events: [] },
  { d: "Mar", n: 11, habits: ["Meditar", "Ejercicio"], events: [] },
  { d: "Mié", n: 12, habits: ["Meditar"], events: ["Dentista"] },
  { d: "Jue", n: 13, habits: ["Meditar", "Ejercicio"], events: [], today: true },
  { d: "Vie", n: 14, habits: [], events: ["Entrega cliente Acme"] },
  { d: "Sáb", n: 15, habits: [], events: [] },
  { d: "Dom", n: 16, habits: [], events: ["Cumple de mamá"] },
];
const UPCOMING = [
  { t: "Entrega cliente Acme", d: "14 ago", rel: "mañana" },
  { t: "Cumple de mamá", d: "16 ago", rel: "en 3 días" },
  { t: "Pago de la tarjeta", d: "28 ago", rel: "en 2 semanas" },
  { t: "Renovar seguro", d: "5 sep", rel: "en 3 semanas" },
  { t: "Viaje a CDMX", d: "26 sep", rel: "en 1 mes y medio" },
  { t: "Aniversario", d: "3 oct", rel: "en casi 2 meses" },
];
const HAB_BY_NAME = Object.fromEntries(HABITS.map((h) => [h.name, h]));

// Agosto 2026: cuadrícula lunes-domingo SIEMPRE de 6 filas (27 jul – 6 sep).
function monthCells() {
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const day = 27 + i; // 27 jul
    let n, out = false;
    if (day <= 31) { n = day; out = true; }            // julio
    else if (day <= 62) { n = day - 31; out = false; } // agosto
    else { n = day - 62; out = true; }                 // septiembre
    const c = { n, out };
    if (!out) {
      if (n === 12) c.events = ["Dentista"];
      if (n === 14) c.events = ["Entrega Acme"];
      if (n === 16) c.events = ["Cumple de mamá"];
      if (n === 28) c.events = ["Pago de tarjeta"];
      if (n === 13) c.today = true;
      if ([10, 11, 12, 13].includes(n)) c.habitDots = n === 13 || n === 10 ? 2 : n === 11 ? 2 : 1;
    } else if (day === 67) c.events = ["Renovar seguro"]; // 5 sep
    cells.push(c);
  }
  return cells;
}

const toneBg = { success: T.successBg, warning: T.warningBg, error: T.errorBg };
const toneFg = { success: T.onSuccessBg, warning: T.onWarningBg, error: T.onErrorBg };
// sólidos semánticos del DS (--c-success/-warning/-error)
const toneSolid = { success: "#16704F", warning: "#8C6112", error: "#A93226" };

// —— piezas compartidas ——
const header = (view) => `
<div style="display:flex;align-items:center;gap:12px;height:56px;padding:0 16px;background:${T.surface};border-bottom:1px solid ${T.border};flex:none">
  <div class="display" style="font-size:19px;color:${T.text}">Radar Personal</div>
  <div style="flex:1;display:flex;justify-content:center">
    <div style="display:inline-flex;gap:3px;padding:3px;border-radius:10px;background:${T.bg};border:1px solid ${T.border}">
      <div style="font-size:13.5px;font-weight:600;padding:7px 14px;border-radius:6px;color:${view === "listas" ? T.text : T.muted};background:${view === "listas" ? T.surface : "transparent"};${view === "listas" ? "box-shadow:0 1px 2px rgba(16,12,8,0.06);" : ""}">Listas</div>
      <div style="font-size:13.5px;font-weight:600;padding:7px 14px;border-radius:6px;color:${view === "semana" ? T.text : T.muted};background:${view === "semana" ? T.surface : "transparent"};${view === "semana" ? "box-shadow:0 1px 2px rgba(16,12,8,0.06);" : ""}">Semana</div>
      <div style="font-size:13.5px;font-weight:600;padding:7px 14px;border-radius:6px;color:${view === "mes" ? T.text : T.muted};background:${view === "mes" ? T.surface : "transparent"};${view === "mes" ? "box-shadow:0 1px 2px rgba(16,12,8,0.06);" : ""}">Mes</div>
    </div>
  </div>
  <div style="display:flex;gap:8px;color:${T.muted}">${ic("moon", 20)}${ic("logout", 20)}</div>
</div>`;

const zone = (inner, extra = "") =>
  `<div style="border:1px solid ${T.border};border-radius:16px;padding:16px;display:flex;flex-direction:column;gap:12px;min-height:0;${extra}">${inner}</div>`;

const zoneTitle = (icon, txt, count) => `
<div style="display:flex;align-items:center;gap:8px">
  <span style="color:${T.muted}">${ic(icon, 20)}</span>
  <div class="display" style="font-size:19px;color:${T.text}">${txt}</div>
  ${count ? `<span style="min-width:20px;height:20px;padding:0 6px;border-radius:999px;background:${T.accent};color:${T.onAccent};font-size:12px;font-weight:700;display:inline-flex;align-items:center;justify-content:center">${count}</span>` : ""}
</div>`;

const checkCircle = (done, size = 24) => done
  ? `<span style="width:${size}px;height:${size}px;border-radius:999px;background:${T.accent};color:${T.onAccent};display:inline-flex;align-items:center;justify-content:center;flex:none">${ic("check", size - 10)}</span>`
  : `<span style="width:${size}px;height:${size}px;border-radius:999px;border:1px solid ${T.border};background:${T.surface};flex:none"></span>`;

const compBadge = (h) =>
  `<span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;background:${toneBg[h.compTone]};color:${toneFg[h.compTone]}">${h.comp}</span>`;

// riel de hábitos completo (A, B, E) — variante compact reduce paddings
const habitRail = ({ compact = false } = {}) => zone(`
  ${zoneTitle("activity", "Hábitos", HABITS.filter((h) => !h.today).length)}
  <div style="display:flex;flex-direction:column;gap:8px;overflow:hidden">
    ${HABITS.map((h) => `
    <div style="display:flex;align-items:center;gap:10px;padding:${compact ? "8px 10px" : "12px"};background:${T.surface};border:1px solid ${T.border};border-radius:10px">
      ${checkCircle(h.today)}
      <span style="color:${T.muted}">${ic(h.icon, 18)}</span>
      <div style="min-width:0;flex:1">
        <div style="font-size:${compact ? "13.5px" : "15px"};font-weight:600;color:${T.text};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;${h.today ? "text-decoration:line-through;color:" + T.muted : ""}">${h.name}</div>
        <div style="font-size:${compact ? "11px" : "12px"};color:${T.muted}">${h.per}</div>
      </div>
      ${compBadge(h)}
    </div>`).join("")}
  </div>
  <div style="margin-top:auto;display:flex;align-items:center;justify-content:center;gap:7px;height:44px;border-radius:10px;background:${T.cta};color:${T.onCta};font-weight:600;font-size:13.5px">${ic("plus", 18)} Nuevo hábito</div>
`, "width:224px;flex:none");

// riel de hábitos SOLO íconos (D)
const habitRailIcons = () => zone(`
  <div style="display:flex;flex-direction:column;gap:10px;align-items:center">
    ${HABITS.map((h) => `
    <div title="${h.name} · ${h.comp} · ${h.per}" style="position:relative;width:44px;height:44px;border-radius:10px;border:1px solid ${T.border};background:${h.today ? T.accent : T.surface};color:${h.today ? T.onAccent : T.muted};display:flex;align-items:center;justify-content:center">
      ${ic(h.icon, 20)}
      <span style="position:absolute;top:-3px;right:-3px;width:10px;height:10px;border-radius:999px;background:${toneSolid[h.compTone]};border:2px solid ${T.bg}"></span>
    </div>`).join("")}
    <div style="width:44px;height:44px;border-radius:10px;background:${T.cta};color:${T.onCta};display:flex;align-items:center;justify-content:center">${ic("plus", 20)}</div>
  </div>
`, "width:76px;flex:none;align-items:center");

// barra horizontal de hábitos como chips (C)
const habitChips = () => `
<div style="display:flex;align-items:center;gap:8px;flex:none">
  <span style="color:${T.muted}">${ic("activity", 20)}</span>
  <div class="display" style="font-size:15px;color:${T.text};margin-right:4px">Hábitos de hoy</div>
  ${HABITS.map((h) => `
  <div style="display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:999px;border:1px solid ${h.today ? "transparent" : T.border};background:${h.today ? T.accent : T.surface};color:${h.today ? T.onAccent : T.text};font-size:13.5px;font-weight:600">
    ${ic(h.today ? "check" : h.icon, 16)} ${h.name}
    <span title="Complejidad ${h.comp} · ${h.per}" style="width:7px;height:7px;border-radius:999px;background:${toneSolid[h.compTone]};flex:none"></span>
  </div>`).join("")}
  <div style="display:inline-flex;align-items:center;gap:7px;padding:9px 12px;border-radius:999px;background:${T.cta};color:${T.onCta};font-size:13.5px;font-weight:600">${ic("plus", 16)} Nuevo</div>
</div>`;

const eventChip = (t, style = "") =>
  `<div style="padding:6px 8px;border-radius:6px;background:${T.infoBg};color:${T.accent};font-size:12px;font-weight:600;line-height:1.25;${style}">${t}</div>`;
const habitStamp = (name, style = "") => {
  const h = HAB_BY_NAME[name];
  return `<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:6px;background:${T.successBg};color:${T.onSuccessBg};font-size:12px;font-weight:600;${style}">${ic("check", 12)} ${h ? h.name : name}</div>`;
};

// columnas de semana (mode: equal | todayWide)
const weekColumns = ({ todayWide = false, compact = false } = {}) => `
<div style="flex:1;min-width:0;display:grid;grid-template-columns:${DAYS.map((d) => (todayWide && d.today ? "2.1fr" : "1fr")).join(" ")};gap:${compact ? "6px" : "8px"}">
  ${DAYS.map((day) => `
  <div style="display:flex;flex-direction:column;gap:6px;border:1px solid ${day.today ? T.accent : T.border};border-radius:10px;padding:${compact ? "6px" : "8px"};background:${day.today ? T.surface : "transparent"};min-width:0">
    <div style="text-align:center;padding-bottom:4px;border-bottom:1px solid ${T.border}">
      <div style="font-size:12px;font-weight:600;color:${day.today ? T.accent : T.muted};text-transform:uppercase;letter-spacing:.04em">${day.d}</div>
      <div class="display" style="font-size:${todayWide && day.today ? "27px" : "19px"};color:${T.text}">${day.n}</div>
      ${day.today ? `<div style=\"font-size:11px;font-weight:700;color:${T.cta}\">HOY</div>` : ""}
    </div>
    ${day.events.map((e) => eventChip(e)).join("")}
    ${day.habits.map((h) => habitStamp(h)).join("")}
  </div>`).join("")}
</div>`;

// semana como FILAS (E)
const weekRows = () => `
<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
  ${DAYS.map((day) => `
  <div style="flex:1;display:flex;align-items:center;gap:12px;border:1px solid ${day.today ? T.accent : T.border};border-radius:10px;padding:6px 12px;background:${day.today ? T.surface : "transparent"}">
    <div style="width:64px;flex:none;display:flex;align-items:baseline;gap:6px">
      <span class="display" style="font-size:19px;color:${T.text}">${day.n}</span>
      <span style="font-size:12px;font-weight:600;color:${day.today ? T.cta : T.muted};text-transform:uppercase">${day.d}</span>
    </div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;min-width:0">
      ${day.events.map((e) => eventChip(e)).join("")}
      ${day.habits.map((h) => habitStamp(h)).join("")}
      ${!day.events.length && !day.habits.length ? `<span style=\"font-size:12px;color:${T.muted}\">—</span>` : ""}
    </div>
    ${day.today ? `<div style=\"margin-left:auto;font-size:11px;font-weight:700;color:${T.cta};flex:none\">HOY</div>` : ""}
  </div>`).join("")}
</div>`;

// riel de próximos (mode: list | timeline | grouped)
const upcomingRail = ({ mode = "list", width = 236 } = {}) => {
  let inner = "";
  if (mode === "timeline") {
    inner = `<div style="position:relative;display:flex;flex-direction:column;gap:14px;padding-left:14px">
      <div style="position:absolute;left:3px;top:6px;bottom:6px;width:1px;background:${T.border}"></div>
      ${UPCOMING.map((u) => `
      <div style="position:relative">
        <span style="position:absolute;left:-15px;top:4px;width:7px;height:7px;border-radius:999px;background:${T.accent}"></span>
        <div style="font-size:13.5px;font-weight:600;color:${T.text};line-height:1.3">${u.t}</div>
        <div style="font-size:12px;color:${T.muted}">${u.d} · <span style="color:${T.accent};font-weight:600">${u.rel}</span></div>
      </div>`).join("")}
    </div>`;
  } else if (mode === "grouped") {
    const groups = [["Esta semana", UPCOMING.slice(0, 2)], ["Este mes", UPCOMING.slice(2, 3)], ["Después", UPCOMING.slice(3)]];
    inner = groups.map(([g, xs]) => `
      <div style="font-size:12px;font-weight:700;color:${T.muted};text-transform:uppercase;letter-spacing:.05em;margin-top:2px">${g}</div>
      ${xs.map((u) => `
      <div style="padding:8px 10px;background:${T.surface};border:1px solid ${T.border};border-radius:10px">
        <div style="font-size:13.5px;font-weight:600;color:${T.text}">${u.t}</div>
        <div style="font-size:12px;color:${T.muted}">${u.d} · ${u.rel}</div>
      </div>`).join("")}`).join("");
  } else {
    inner = UPCOMING.map((u) => `
    <div style="display:flex;flex-direction:column;gap:2px;padding:10px 12px;background:${T.surface};border:1px solid ${T.border};border-radius:10px">
      <div style="font-size:13.5px;font-weight:600;color:${T.text}">${u.t}</div>
      <div style="display:flex;justify-content:space-between;gap:8px">
        <span style="font-size:12px;color:${T.muted}">${u.d}</span>
        <span style="font-size:12px;font-weight:600;padding:1px 8px;border-radius:999px;background:${T.infoBg};color:${T.accent}">${u.rel}</span>
      </div>
    </div>`).join("");
  }
  return zone(`${zoneTitle("calendar", "Próximos", UPCOMING.length)}<div style="display:flex;flex-direction:column;gap:8px;overflow:hidden">${inner}</div><div style="font-size:12px;color:${T.muted};margin-top:auto">Siguientes 2 meses</div>`, `width:${width}px;flex:none`);
};

// banda "HOY" para BMensual — el concepto de B llevado a la vista mensual
const todaySpotlight = () => `
<div style="display:flex;align-items:center;gap:10px;border:1px solid ${T.accent};border-radius:10px;background:${T.surface};padding:10px 14px;flex:none">
  <div class="display" style="font-size:19px;color:${T.text}">HOY · Jueves 13</div>
  <span style="font-size:12px;font-weight:600;padding:2px 8px;border-radius:999px;background:${T.infoBg};color:${T.accent}">2/5 hábitos</span>
  ${habitStamp("Meditar")}
  ${habitStamp("Ejercicio")}
  <span style="margin-left:auto;font-size:12px;color:${T.muted}">Próximo evento: <span style="font-weight:600;color:${T.text}">Entrega cliente Acme</span> · mañana</span>
</div>`;

// subheader de mes
const monthNav = () => `
<div style="display:flex;align-items:center;gap:12px;flex:none">
  <div style="width:44px;height:44px;border:1px solid ${T.border};border-radius:10px;background:${T.surface};color:${T.muted};display:flex;align-items:center;justify-content:center">${ic("chevL", 20)}</div>
  <div class="display" style="font-size:27px;color:${T.text}">Agosto 2026</div>
  <div style="width:44px;height:44px;border:1px solid ${T.border};border-radius:10px;background:${T.surface};color:${T.muted};display:flex;align-items:center;justify-content:center">${ic("chevR", 20)}</div>
  <div style="margin-left:8px;padding:10px 18px;border-radius:10px;background:${T.cta};color:${T.onCta};font-size:13.5px;font-weight:600">Hoy</div>
</div>`;

// cuadrícula mensual (mode: chips | dots)
const monthGrid = ({ mode = "chips", weekProgress = false } = {}) => {
  const cells = monthCells();
  const dowRow = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) =>
    `<div style="text-align:center;font-size:12px;font-weight:600;color:${T.muted};text-transform:uppercase;letter-spacing:.04em;padding:4px 0">${d}</div>`).join("");
  const rows = [];
  for (let r = 0; r < 6; r++) {
    const rowCells = cells.slice(r * 7, r * 7 + 7).map((c) => `
    <div style="border:1px solid ${c.today ? T.accent : T.border};border-radius:6px;padding:6px;display:flex;flex-direction:column;gap:4px;background:${c.today ? T.surface : "transparent"};min-width:0;${c.out ? "opacity:.45;" : ""}">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:13.5px;font-weight:600;color:${c.today ? T.cta : T.text}">${c.n}</span>
        ${c.habitDots && mode === "dots" ? `<span style="display:flex;gap:3px">${(`<span style="width:6px;height:6px;border-radius:999px;background:${T.accent}"></span>`).repeat(c.habitDots)}</span>` : ""}
      </div>
      ${(c.events || []).map((e) => mode === "dots"
        ? `<div style=\"display:flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:${T.accent};white-space:nowrap;overflow:hidden;text-overflow:ellipsis\"><span style=\"width:6px;height:6px;border-radius:999px;background:${T.cta};flex:none\"></span>${e}</div>`
        : eventChip(e, "white-space:nowrap;overflow:hidden;text-overflow:ellipsis")).join("")}
      ${c.habitDots && mode === "chips" ? habitStamp("Meditar", "white-space:nowrap;overflow:hidden;text-overflow:ellipsis") : ""}
    </div>`).join("");
    const progress = weekProgress
      ? `<div style="border:1px solid ${T.border};border-radius:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;padding:4px"><span style="font-size:11px;font-weight:700;color:${T.muted}">S${r + 31}</span><span style="font-size:12px;font-weight:600;color:${r === 2 ? T.onSuccessBg : T.muted};background:${r === 2 ? T.successBg : "transparent"};padding:1px 6px;border-radius:999px">${r === 2 ? "7✓" : "—"}</span></div>`
      : "";
    rows.push(rowCells + progress);
  }
  const cols = weekProgress ? "repeat(7, minmax(0, 1fr)) 56px" : "repeat(7, minmax(0, 1fr))";
  return `
  <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:6px">
    <div style="display:grid;grid-template-columns:${cols};gap:6px">${dowRow}${weekProgress ? "<div></div>" : ""}</div>
    <div style="flex:1;display:grid;grid-template-columns:${cols};grid-template-rows:repeat(6, minmax(0,1fr));gap:6px">${rows.join("")}</div>
  </div>`;
};

// —— cascarón de artboard ——
const shell = (name, view, body) => `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Instrument+Sans:wght@400;500;600&display=swap">
  <style>
    body { margin: 0; font-family: "Instrument Sans", "Helvetica Neue", Arial, sans-serif; }
    .display { font-family: "Archivo", "Arial Black", sans-serif; font-weight: 700; line-height: 1.15; letter-spacing: -0.01em; }
    a { color: ${T.cta}; } a:hover { color: #154EB8; }
  </style>
</helmet>
<div style="width:1180px;height:820px;background:${T.bg};color:${T.text};display:flex;flex-direction:column;overflow:hidden;font-size:15px;line-height:1.55">
  ${header(view)}
  ${body}
</div>
</x-dc>
<script data-dc-script data-props='{}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>`;

const content = (inner, { column = false } = {}) =>
  `<div style="flex:1;min-height:0;display:flex;${column ? "flex-direction:column;" : ""}gap:12px;padding:16px">${inner}</div>`;

// —— las 5 propuestas ——
const boards = {
  // A · Tres rieles — fiel al pedido original
  "Main": shell("A-Semanal", "semana",
    content(habitRail() + weekColumns() + upcomingRail({ mode: "list" }))),
  "AMensual": shell("A-Mensual", "mes",
    content(habitRail() + `<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">${monthNav()}${monthGrid({ mode: "chips" })}</div>`)),

  // B · Hoy protagonista — el día actual manda
  "BSemanal": shell("B-Semanal", "semana",
    content(habitRail({ compact: true }) + weekColumns({ todayWide: true }) + upcomingRail({ mode: "timeline", width: 224 }))),
  "BMensual": shell("B-Mensual", "mes",
    content(habitRail({ compact: true }) + `<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">${monthNav()}${todaySpotlight()}${monthGrid({ mode: "chips" })}</div>`)),

  // C · Chips arriba — hábitos horizontales, máximo ancho para el calendario
  "CSemanal": shell("C-Semanal", "semana",
    content(habitChips() + `<div style="flex:1;min-height:0;display:flex;gap:12px">${weekColumns()}${upcomingRail({ mode: "list", width: 240 })}</div>`, { column: true })),
  "CMensual": shell("C-Mensual", "mes",
    content(habitChips() + `<div style="display:flex;align-items:center;justify-content:space-between">${monthNav()}</div>` + monthGrid({ mode: "chips" }), { column: true })),

  // D · Densa — riel de íconos + puntos en vez de chips
  "DSemanal": shell("D-Semanal", "semana",
    content(habitRailIcons() + weekColumns({ compact: true }) + upcomingRail({ mode: "grouped", width: 216 }))),
  "DMensual": shell("D-Mensual", "mes",
    content(habitRailIcons() + `<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">${monthNav()}${monthGrid({ mode: "dots" })}</div>`)),

  // E · Agenda en filas — la semana como 7 renglones
  "ESemanal": shell("E-Semanal", "semana",
    content(habitRail() + weekRows() + upcomingRail({ mode: "list", width: 232 }))),
  "EMensual": shell("E-Mensual", "mes",
    content(habitRail() + `<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">${monthNav()}${monthGrid({ mode: "dots", weekProgress: true })}</div>`)),
};

for (const [name, html] of Object.entries(boards)) {
  writeFileSync(`${name}.dc.html`, html);
  console.log(`✓ ${name}.dc.html (${(html.length / 1024).toFixed(1)} KB)`);
}

// —— canvas.json: 5 columnas (propuestas), 2 filas (semanal / mensual) ——
const W = 1180, H = 820, GX = 120, GY = 140;
const col = (i) => i * (W + GX);
const props = [
  ["Main", "AMensual", "A · Tres rieles", "Fiel al pedido: rail de hábitos + semana 7 columnas + próximos. Equilibrada.\\nTradeoff: columnas de día angostas (~97px)."],
  ["BSemanal", "BMensual", "B · Hoy protagonista", "El día actual ocupa doble ancho: lo de HOY se lee desde lejos (pared).\\nTradeoff: los otros días quedan más apretados."],
  ["CSemanal", "CMensual", "C · Chips arriba", "Hábitos como chips horizontales: un tap y listo; el calendario gana todo el ancho.\\nTradeoff: los hábitos pierden detalle (complejidad/periodicidad ocultos)."],
  ["DSemanal", "DMensual", "D · Densa", "Rail de íconos (76px, punto de complejidad en la esquina) + mensual con puntos en vez de chips: máxima información por pantalla.\\nTradeoff: menos legible a distancia; nombres y periodicidad solo al tocar."],
  ["ESemanal", "EMensual", "E · Agenda en filas", "La semana como 7 renglones: lectura natural tipo agenda, texto nunca apretado.\\nTradeoff: los días con mucho contenido compiten por una sola línea."],
];
const canvas = {
  artboards: props.flatMap(([wk, mo, title], i) => [
    { file: `${wk}.dc.html`, x: col(i), y: 0, w: W, h: H, title: `${title} — Semanal` },
    { file: `${mo}.dc.html`, x: col(i), y: H + GY, w: W, h: H, title: `${title} — Mensual` },
  ]),
  annotations: props.map(([, , title, note], i) => ({
    id: `nota-${"abcde"[i]}`, x: col(i), y: -170, w: 460,
    text: `${title}\n${note.replace(/\\n/g, "\n")}`,
  })),
  launch: { view: "canvas" },
};
writeFileSync("canvas.json", JSON.stringify(canvas, null, 2));
console.log("✓ canvas.json");
