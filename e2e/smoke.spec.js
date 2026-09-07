import { test, expect } from "@playwright/test";

test("landing shows create account CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Criar conta" }).first()).toBeVisible();
});

test("signup page renders", async ({ page }) => {
  await page.goto("/criar-conta");
  await expect(page.getByRole("heading", { name: "Crie sua conta" })).toBeVisible();
});

test("privacy page renders", async ({ page }) => {
  await page.goto("/privacidade");
  await expect(page.getByRole("heading", { name: "Política de Privacidade" })).toBeVisible();
});
