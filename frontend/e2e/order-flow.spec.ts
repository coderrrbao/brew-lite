import { expect, test } from '@playwright/test';

test('customer orders a drink from the menu and views the confirmation and history', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hôm nay bạn muốn uống gì?' })).toBeVisible();

  await page.getByRole('link', { name: /Cà Phê Sữa Đá/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Cà Phê Sữa Đá' })).toBeVisible();

  await page.getByRole('radio', { name: /Lớn/ }).click();
  await page.getByRole('checkbox', { name: 'Syrup Caramel' }).click();
  await page.getByRole('button', { name: 'Thêm vào giỏ' }).click();
  await expect(page.getByRole('button', { name: 'Đã thêm vào giỏ' })).toBeVisible();

  await page.getByRole('link', { name: /Giỏ hàng/ }).click();
  await expect(page.getByRole('heading', { name: 'Giỏ hàng' })).toBeVisible();
  await expect(page.getByText('Cà Phê Sữa Đá')).toBeVisible();
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();

  await expect(page.getByRole('heading', { name: 'Thanh toán' })).toBeVisible();
  await page.getByRole('radio', { name: 'Ví MoMo' }).click();
  await page.getByRole('button', { name: /Xác nhận thanh toán/ }).click();

  await expect(page).toHaveURL(/\/confirmation\/.+/);
  await expect(page.getByRole('heading', { name: 'Đặt hàng thành công' })).toBeVisible();
  await expect(page.getByText('Mã đơn hàng')).toBeVisible();
  await expect(page.getByText('Đã thanh toán')).toBeVisible();

  await page.getByRole('link', { name: 'Lịch sử đơn hàng' }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole('heading', { name: 'Lịch sử đơn hàng' })).toBeVisible();
  await expect(page.getByText('Cà Phê Sữa Đá × 1')).toBeVisible();
  await expect(page.getByText('Đã thanh toán')).toBeVisible();
});
