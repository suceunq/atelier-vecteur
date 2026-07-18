import { describe, expect, it } from "vitest";
import { importErrorMessage } from "./imageImport";

describe("importErrorMessage", () => {
  it("does not expose untranslated Tauri or library rejections", () => {
    expect(importErrorMessage("Image trop complexe : réduisez la précision.", "Erreur générique"))
      .toBe("Erreur générique");
    expect(importErrorMessage(new Error("Decode failed"), "Erreur générique")).toBe("Erreur générique");
    expect(importErrorMessage({ message: "Invalid format" }, "Erreur générique")).toBe("Erreur générique");
  });

  it("uses the fallback for empty or unknown errors", () => {
    expect(importErrorMessage("  ", "Erreur générique")).toBe("Erreur générique");
    expect(importErrorMessage(null, "Erreur générique")).toBe("Erreur générique");
  });
});
