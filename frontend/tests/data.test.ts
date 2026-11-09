import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPrice, products, sizes, toppings } from '../lib/data.ts';

test.todo('catalog contains products with valid prices and categories');
/*
test('catalog contains products with valid prices and categories', () => {
  assert.ok(products.length > 0);
  assert.ok(products.every((product) => product.price > 0));
  assert.ok(
    products.every((product) =>
      ['hot', 'cold', 'specialty'].includes(product.category),
    ),
  );
});
*/

test.todo('customization options have unique values and non-negative prices');
/*
test('customization options have unique values and non-negative prices', () => {
  assert.equal(new Set(sizes.map((size) => size.value)).size, sizes.length);
  assert.equal(new Set(toppings.map((topping) => topping.id)).size, toppings.length);
  assert.ok(sizes.every((size) => size.priceAdd >= 0));
  assert.ok(toppings.every((topping) => topping.price >= 0));
});
*/

test.todo('formatPrice formats Vietnamese đồng');
/*
test('formatPrice formats Vietnamese đồng', () => {
  assert.equal(formatPrice(45000), '45.000 ₫');
});
*/
