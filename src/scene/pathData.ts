import { createId } from "./factory";
import type { PathAnchor, PathSubpath, Point } from "./types";

/**
 * Parses an SVG path `d` attribute into this app's editable anchor/handle subpath model.
 * Scoped to the commands our own `vtracer`-based image tracer actually emits (M/L/H/V/C/Q/Z,
 * upper and lowercase) rather than being a fully general SVG path parser — arcs (`A`) and the
 * `S`/`T` smooth-shorthand commands are handled with a safe straight-line/no-mirroring fallback
 * so an unexpected command can never throw, only lose a little curve fidelity.
 */
export function parsePathData(d: string): PathSubpath[] {
  const tokens = tokenize(d);
  const subpaths: PathSubpath[] = [];

  let current: PathAnchor[] = [];
  let cur: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let closed = false;
  let command = "";
  let i = 0;

  const pushAnchor = (point: Point, handleInAbs?: Point) => {
    const anchor: PathAnchor = {
      id: createId(),
      anchor: point,
      handleIn: handleInAbs ? { x: handleInAbs.x - point.x, y: handleInAbs.y - point.y } : null,
      handleOut: null,
      type: "corner",
    };
    current.push(anchor);
  };

  const setLastHandleOut = (handleOutAbs: Point) => {
    const last = current[current.length - 1];
    if (last) last.handleOut = { x: handleOutAbs.x - last.anchor.x, y: handleOutAbs.y - last.anchor.y };
  };

  const finishSubpath = () => {
    if (current.length === 0) return;
    // A trailing anchor that lands back on the start point (common when a curve/line command
    // explicitly returns to the origin right before Z) would otherwise create a redundant
    // zero-length closing edge on top of the implicit close.
    if (closed && current.length > 1) {
      const last = current[current.length - 1];
      if (Math.hypot(last.anchor.x - start.x, last.anchor.y - start.y) < 1e-6 && !last.handleIn) {
        current.pop();
      }
    }
    subpaths.push({ nodes: current, closed });
    current = [];
    closed = false;
  };

  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const token = tokens[i];
    if (typeof token === "string") {
      command = token;
      i++;
    }
    const isRelative = command === command.toLowerCase();
    const upper = command.toUpperCase();

    switch (upper) {
      case "M": {
        finishSubpath();
        const x = num();
        const y = num();
        cur = isRelative ? { x: cur.x + x, y: cur.y + y } : { x, y };
        start = cur;
        pushAnchor(cur);
        command = isRelative ? "l" : "L"; // subsequent implicit pairs are lineto
        break;
      }
      case "L": {
        const x = num();
        const y = num();
        cur = isRelative ? { x: cur.x + x, y: cur.y + y } : { x, y };
        pushAnchor(cur);
        break;
      }
      case "H": {
        const x = num();
        cur = isRelative ? { x: cur.x + x, y: cur.y } : { x, y: cur.y };
        pushAnchor(cur);
        break;
      }
      case "V": {
        const y = num();
        cur = isRelative ? { x: cur.x, y: cur.y + y } : { x: cur.x, y };
        pushAnchor(cur);
        break;
      }
      case "C": {
        const x1 = num();
        const y1 = num();
        const x2 = num();
        const y2 = num();
        const x = num();
        const y = num();
        const base = isRelative ? cur : { x: 0, y: 0 };
        const c1 = { x: base.x + x1, y: base.y + y1 };
        const c2 = { x: base.x + x2, y: base.y + y2 };
        const end = isRelative ? { x: cur.x + x, y: cur.y + y } : { x, y };
        setLastHandleOut(c1);
        pushAnchor(end, c2);
        cur = end;
        break;
      }
      case "Q": {
        const qx = num();
        const qy = num();
        const x = num();
        const y = num();
        const base = isRelative ? cur : { x: 0, y: 0 };
        const q = { x: base.x + qx, y: base.y + qy };
        const end = isRelative ? { x: cur.x + x, y: cur.y + y } : { x, y };
        // Quadratic-to-cubic: c1 = p0 + 2/3(q-p0), c2 = p1 + 2/3(q-p1).
        const c1 = { x: cur.x + (2 / 3) * (q.x - cur.x), y: cur.y + (2 / 3) * (q.y - cur.y) };
        const c2 = { x: end.x + (2 / 3) * (q.x - end.x), y: end.y + (2 / 3) * (q.y - end.y) };
        setLastHandleOut(c1);
        pushAnchor(end, c2);
        cur = end;
        break;
      }
      case "S":
      case "T": {
        // Smooth shorthand: approximate without mirroring the previous handle (safe fallback).
        const argCount = upper === "S" ? 4 : 2;
        const args = Array.from({ length: argCount }, () => num());
        const x = args[argCount - 2];
        const y = args[argCount - 1];
        cur = isRelative ? { x: cur.x + x, y: cur.y + y } : { x, y };
        pushAnchor(cur);
        break;
      }
      case "A": {
        // Arc: skip its 7 parameters and fall back to a straight line to the endpoint.
        num();
        num();
        num();
        num();
        num();
        const x = num();
        const y = num();
        cur = isRelative ? { x: cur.x + x, y: cur.y + y } : { x, y };
        pushAnchor(cur);
        break;
      }
      case "Z": {
        closed = true;
        finishSubpath();
        cur = start;
        break;
      }
      default:
        // Unknown/unsupported command: stop parsing rather than loop forever on bad input.
        finishSubpath();
        return subpaths;
    }
  }
  finishSubpath();
  return subpaths;
}

export interface TracedShape {
  fill: string;
  x: number;
  y: number;
  subpaths: PathSubpath[];
}

const SAFE_FILL = /^#[0-9a-fA-F]{6}$|^rgba?\([0-9.,\s%]+\)$/;

/**
 * Parses the SVG string produced by the Rust `trace_image` command (via `vtracer`) into one
 * entry per traced `<path>` — its fill color, its `translate(x,y)` offset (mapped straight onto
 * our own per-node transform), and its subpaths. The regex targets vtracer's own known, fixed
 * output format (`<path d="..." fill="..." transform="translate(x,y)"/>`), not arbitrary SVG.
 */
export function parseTracedSvg(svg: string): TracedShape[] {
  const shapes: TracedShape[] = [];
  const re = /<path d="([^"]*)" fill="([^"]*)" transform="translate\(([^,]+),([^)]+)\)"\s*\/>/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(svg))) {
    const [, d, fillRaw, txRaw, tyRaw] = match;
    const subpaths = parsePathData(d);
    if (subpaths.length === 0) continue;
    const fill = SAFE_FILL.test(fillRaw) ? fillRaw : "#808080";
    const x = Number(txRaw);
    const y = Number(tyRaw);
    shapes.push({ fill, x: Number.isFinite(x) ? x : 0, y: Number.isFinite(y) ? y : 0, subpaths });
  }
  return shapes;
}

function tokenize(d: string): (string | number)[] {
  const tokens: (string | number)[] = [];
  const re = /([MLHVCSQTAZmlhvcsqtaz])|(-?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(d))) {
    if (match[1]) tokens.push(match[1]);
    else tokens.push(Number(match[2]));
  }
  return tokens;
}
