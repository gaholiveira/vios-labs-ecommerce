import { test, expect } from "@playwright/test";

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/produto/prod_2");
    // Aguarda botão (página pode mostrar "Carregando..." durante checagem de estoque)
    const addBtn = page.getByRole("button", { name: "Colocar na sacola" }).first();
    await addBtn.waitFor({ state: "visible", timeout: 20000 });
    await addBtn.click();
    // Navega via link do drawer (preserva estado do carrinho; page.goto recarrega e perde o cart)
    const checkoutLink = page.getByRole("link", { name: "Ir para o checkout" });
    await checkoutLink.waitFor({ state: "visible", timeout: 5000 });
    await checkoutLink.click();
    await expect(page).toHaveURL(/\/checkout/);
  });

  test("deve carregar a página de checkout com formulário", async ({ page }) => {
    await expect(page).toHaveTitle(/Checkout|VIOS/);
    const cepInput = page.getByPlaceholder("00000-000", { exact: true });
    await expect(cepInput).toBeVisible({ timeout: 10000 });
  });

  test("deve preencher CEP e buscar endereço", async ({ page }) => {
    await page.route("**/viacep.com.br/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          cep: "01310-100",
          logradouro: "Avenida Paulista",
          complemento: "",
          bairro: "Bela Vista",
          localidade: "São Paulo",
          uf: "SP",
        }),
      });
    });

    const cepInput = page.getByPlaceholder("00000-000", { exact: true });
    await cepInput.waitFor({ state: "visible", timeout: 10000 });
    await cepInput.fill("01310100");
    await cepInput.blur();

    await page.waitForTimeout(1500);

    const streetInput = page.getByPlaceholder("Nome da rua");
    await expect(streetInput).toHaveValue("Avenida Paulista");
  });

  test("deve exibir método de pagamento PIX", async ({ page }) => {
    const pixButton = page.getByRole("button", { name: /PIX/i }).first();
    await expect(pixButton).toBeVisible({ timeout: 10000 });
  });

  test("deve exibir método de pagamento Cartão", async ({ page }) => {
    const cardButton = page.getByRole("button", { name: /Cartão/i }).first();
    await expect(cardButton).toBeVisible({ timeout: 10000 });
  });
});
