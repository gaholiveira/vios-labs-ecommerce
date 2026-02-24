import { test, expect } from "@playwright/test";

test.describe("Home", () => {
  test("deve carregar a página inicial com produtos", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/VIOS|Ciência da Longevidade/);
    // TextReveal anima o conteúdo; usamos botão CTA ou seção #produtos como âncora
    const heroCta = page.getByRole("button", { name: "Explorar Loja" });
    await expect(heroCta).toBeVisible({ timeout: 15000 });
  });

  test("deve exibir seção de produtos", async ({ page }) => {
    await page.goto("/");

    // Seção tem id="produtos"; texto "Nossos Produtos" pode estar em animação
    const productsSection = page.locator("#produtos");
    await expect(productsSection).toBeVisible({ timeout: 15000 });
    await expect(productsSection).toContainText("Nossos Produtos");
  });

  test("skip link deve estar presente e funcionar", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", { name: "Pular para o conteúdo" });
    await expect(skipLink).toBeAttached();

    await skipLink.focus();
    await expect(skipLink).toBeFocused();
  });
});
