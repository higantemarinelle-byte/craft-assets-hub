import { describe, it, expect } from "vitest";
import { isCtaVisible } from "./theme";

describe("isCtaVisible", () => {
  it("shows the button when the setting is missing", () => expect(isCtaVisible(undefined)).toBe(true));
  it("shows the button when switched on", () => expect(isCtaVisible(true)).toBe(true));
  it("hides the button when switched off", () => expect(isCtaVisible(false)).toBe(false));
});
