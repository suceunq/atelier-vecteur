import { describe, expect, it } from "vitest";
import { localizedError, SUPPORTED_LANGUAGES, t, translations, type MessageKey } from ".";

describe("translations", () => {
  it("has a non-empty localized value for every key and language", () => {
    const keys = Object.keys(translations.fr) as MessageKey[];
    for (const language of SUPPORTED_LANGUAGES) {
      expect(Object.keys(translations[language])).toEqual(expect.arrayContaining(keys));
      for (const key of keys) {
        expect(translations[language][key]?.trim(), `${language}:${key}`).toBeTruthy();
        expect(translations[language][key], `${language}:${key}`).not.toBe(key);
      }
    }
  });

  it("interpolates parameters", () => {
    expect(t("about.version", { version: "2" }, "en")).toBe("Version 2");
  });

  it("localizes stable backend error codes", () => {
    expect(localizedError("i18n:image.trace_too_complex:25000:20000", "error.imageImport")).toContain("25");
  });
});
