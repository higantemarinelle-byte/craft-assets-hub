import { describe, it, expect } from "vitest";
import { validateAssetFile } from "./AssetFileDropzone";
const MB = 1024 * 1024;
describe("validateAssetFile", () => {
  it("accepts a 2 MB PNG", () => expect(validateAssetFile({ type: "image/png", size: 2 * MB })).toBeNull());
  it("rejects a 16 MB image", () => expect(validateAssetFile({ type: "image/jpeg", size: 16 * MB })).not.toBeNull());
  it("rejects a PDF", () => expect(validateAssetFile({ type: "application/pdf", size: MB })).not.toBeNull());
});
