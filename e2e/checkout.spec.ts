import { test, expect } from "@playwright/test";

/** Carrinho injetado no localStorage — mesma estrutura que CartContext espera (prod_2 = Vios Sleep) */
const CART_FIXTURE = [
  {
    id: "prod_2",
    name: "Vios Sleep",
    price: 179,
    image: "/images/products/sleepnew.jpeg",
    description: "Suporte nutricional avançado para um sono profundo e restaurador.",
    category: "Suplemento",
    quantity: 1,
    isKit: false,
  },
];

test.describe("Checkout", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate((cart) => {
      localStorage.setItem("vios_cart", JSON.stringify(cart));
    }, CART_FIXTURE);
    await page.goto("/checkout");
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
