import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = [
  { path: "/", name: "Home" },
  { path: "/essencia", name: "Essência" },
  { path: "/produto/glowdown", name: "Produto" },
  { path: "/checkout", name: "Checkout" },
];

test.describe("Auditoria de Acessibilidade", () => {
  for (const { path, name } of PAGES) {
    test(`${name} (${path}) - deve passar nas regras axe`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();

      const violations = accessibilityScanResults.violations;

      if (violations.length > 0) {
        const report = violations
          .map(
            (v) =>
              `\n[${v.impact}] ${v.id}\n  ${v.help}\n  ${v.nodes.length} elemento(s) afetado(s)\n  ${v.nodes.map((n) => n.html).join("\n  ")}`,
          )
          .join("\n");
        throw new Error(
          `Acessibilidade: ${violations.length} violação(ões) encontrada(s):${report}`,
        );
      }

      expect(violations).toHaveLength(0);
    });
  }
});
