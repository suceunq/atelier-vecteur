// Copies ONLY the single-file NSIS installer out of the deeply nested
// src-tauri/target/release/bundle/nsis/ folder into logiciel-fini/ at the repo root, renamed
// to something unambiguous. The .msi (redundant second format) and the .sig files (only
// needed later for hosting a GitHub Release for the auto-updater) stay out of this folder —
// they'd otherwise clutter the one thing a non-technical user needs to double-click.
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nsisDir = join(repoRoot, "src-tauri", "target", "release", "bundle", "nsis");
const destDir = join(repoRoot, "logiciel-fini");
const destName = "Atelier Vecteur.exe";

if (!existsSync(nsisDir)) {
  console.error("Aucun installateur trouvé — as-tu lancé `npm run tauri build` ?");
  process.exit(1);
}

const setupExe = readdirSync(nsisDir).find((name) => /^Atelier Vecteur.*-setup\.exe$/i.test(name));
if (!setupExe) {
  console.error(`Aucun installateur .exe trouvé dans ${nsisDir}`);
  process.exit(1);
}

rmSync(destDir, { recursive: true, force: true });
mkdirSync(destDir, { recursive: true });
copyFileSync(join(nsisDir, setupExe), join(destDir, destName));

console.log(`Copié : ${destDir}\\${destName}`);
