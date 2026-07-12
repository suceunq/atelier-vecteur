import { describe, expect, it } from "vitest";
import { importErrorMessage } from "./imageImport";

describe("importErrorMessage", () => {
  it("preserves a plain-text Tauri rejection", () => {
    expect(importErrorMessage("Image trop complexe : réduisez la précision.", "Erreur générique"))
      .toBe("Image trop complexe : réduisez la précision.");
  });

  it("preserves JavaScript and object error messages", () => {
    expect(importErrorMessage(new Error("Décodage impossible"), "Erreur générique")).toBe("Décodage impossible");
    expect(importErrorMessage({ message: "Format invalide" }, "Erreur générique")).toBe("Format invalide");
  });

  it("uses the fallback for empty or unknown errors", () => {
    expect(importErrorMessage("  ", "Erreur générique")).toBe("Erreur générique");
    expect(importErrorMessage(null, "Erreur générique")).toBe("Erreur générique");
  });
});
