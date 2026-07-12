// Copies the compiled installers (and their updater .sig files) out of the deeply nested
// src-tauri/target/release/bundle/... tree into logiciel-fini/ at the repo root, so testing
// the app doesn't require digging through several folders after every build.
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const bundleRoot = join(repoRoot, "src-tauri", "target", "release", "bundle");
const destDir = join(repoRoot, "logiciel-fini");

const sourceDirs = [join(bundleRoot, "msi"), join(bundleRoot, "nsis")];

mkdirSync(destDir, { recursive: true });

let copied = 0;
for (const dir of sourceDirs) {
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir)) {
    if (!/\.(msi|exe|sig)$/i.test(name)) continue;
    copyFileSync(join(dir, name), join(destDir, name));
    copied++;
  }
}

if (copied === 0) {
  console.error("Aucun installateur trouvé — as-tu lancé `npm run tauri build` ?");
  process.exit(1);
}

console.log(`${copied} fichier(s) copié(s) dans ${destDir}`);
