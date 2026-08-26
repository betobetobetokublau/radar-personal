// canvas.json canónico del lienzo: 3 páginas (ronda 1, ronda 2, ronda 3).
// Este script es el ÚNICO dueño de canvas.json desde la ronda 3.
import { writeFileSync } from "node:fs";

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
const r3 = [
  ["MSemanal", "M · Tu dirección (color)", "Tu wireframe fiel: próximos arriba, semana solo-íconos con eventos anclados abajo, dock con racha/última vez. Íconos con COLOR por hábito (paleta curada apagada).\nTradeoff: agrega 5 colores al DS (extensión a documentar)."],
  ["NSemanal", "N · Tu dirección (mono)", "El mismo layout, DS-estricto: todos los íconos en slate. Sobrio total.\nTradeoff: a distancia, los hábitos solo se distinguen por la forma del ícono."],
];

const canvas = {
  pages: [
    { id: "ronda-1", name: "Ronda 1 · Columnas" },
    { id: "ronda-2", name: "Ronda 2 · Cards horizontales" },
    { id: "ronda-3", name: "Ronda 3 · Tu dirección" },
  ],
  artboards: [
    ...r1.flatMap(([wk, mo, title], i) => [
      { file: `${wk}.dc.html`, x: col(i), y: 0, w: W, h: H, title: `${title} — Semanal`, page: "ronda-1" },
      { file: `${mo}.dc.html`, x: col(i), y: H + GY, w: W, h: H, title: `${title} — Mensual`, page: "ronda-1" },
    ]),
    ...r2.map(([file, title], i) => (
      { file: `${file}.dc.html`, x: col(i), y: 0, w: W, h: H, title: `${title} — Semanal`, page: "ronda-2" }
    )),
    ...r3.map(([file, title], i) => (
      { file: `${file}.dc.html`, x: col(i), y: 0, w: W, h: H, title: `${title} — Semanal`, page: "ronda-3" }
    )),
  ],
  annotations: [
    ...r1.map(([, , title, note], i) => ({
      id: `nota-${"abcde"[i]}`, x: col(i), y: -170, w: 460, text: `${title}\n${note}`, page: "ronda-1",
    })),
    ...r2.map(([, title, note], i) => ({
      id: `nota-${"fghijkl"[i]}`, x: col(i), y: -170, w: 460, text: `${title}\n${note}`, page: "ronda-2",
    })),
    ...r3.map(([, title, note], i) => ({
      id: `nota-${"mn"[i]}`, x: col(i), y: -170, w: 460, text: `${title}\n${note}`, page: "ronda-3",
    })),
  ],
  launch: { view: "canvas", page: "ronda-3" },
};
writeFileSync("canvas.json", JSON.stringify(canvas, null, 2));
console.log("✓ canvas.json (3 páginas, abre en Ronda 3)");
