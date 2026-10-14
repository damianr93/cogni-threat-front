// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import viteConfig from "../vite.config";

// The app owns an /assets route, so built bundles must not live under /assets.
describe("build output paths", () => {
  it("emits bundles under static/ instead of assets/", () => {
    expect(viteConfig.build?.assetsDir).toBe("static");
  });

  it("keeps nginx redirects relative so the internal host and port never leak", () => {
    const nginx = readFileSync(resolve(__dirname, "../nginx.conf"), "utf8");
    expect(nginx).toMatch(/^\s*absolute_redirect off;/m);
  });
});
