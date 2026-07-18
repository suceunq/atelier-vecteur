import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { localizedError, t } from "../i18n";


/** Tauri command rejections are commonly plain strings, not JavaScript Error instances. */
export function importErrorMessage(error: unknown, fallback: string): string {
  const localized = localizedError(error, "error.imageImport");
  if (localized !== t("error.imageImport")) return localized;
  return fallback;
}

/** Opens the native file picker restricted to raster image formats. Returns null if cancelled. */
export async function pickImagePath(): Promise<string | null> {
  const path = await open({ filters: [{ name: t("file.image"), extensions: ["png", "jpg", "jpeg", "gif", "webp"] }], multiple: false });
  if (!path || Array.isArray(path)) return null;
  return path;
}

function loadImageDimensions(dataUri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error(t("error.imageDimensions")));
    img.src = dataUri;
  });
}

/** Reads the picked file as a base64 data URI (raster/"svg" import mode) and its intrinsic size. */
export async function importImageAsDataUri(
  path: string
): Promise<{ dataUri: string; width: number; height: number }> {
  const dataUri = await invoke<string>("import_image", { path });
  const { width, height } = await loadImageDimensions(dataUri);
  return { dataUri, width, height };
}

export type TraceColorMode = "color" | "binary";
export type TraceHierarchical = "stacked" | "cutout";
export type TracePathMode = "spline" | "polygon" | "none";

export interface TraceOptions {
  colorMode: TraceColorMode;
  hierarchical: TraceHierarchical;
  filterSpeckle: number;
  colorPrecision: number;
  layerDifference: number;
  mode: TracePathMode;
  cornerThreshold: number;
  lengthThreshold: number;
  maxIterations: number;
  spliceThreshold: number;
  pathPrecision: number | null;
}

export const DEFAULT_TRACE_OPTIONS: TraceOptions = {
  colorMode: "color",
  hierarchical: "stacked",
  filterSpeckle: 4,
  colorPrecision: 6,
  layerDifference: 16,
  mode: "spline",
  cornerThreshold: 60,
  lengthThreshold: 4,
  maxIterations: 10,
  spliceThreshold: 45,
  pathPrecision: 2,
};

/** Traces the picked file into an SVG string ("vectoriel" import mode) — returns raw SVG for the caller to parse. */
export async function traceImage(path: string, options: TraceOptions): Promise<string> {
  return invoke<string>("trace_image", { path, options });
}
