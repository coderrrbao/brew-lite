import { spawnSync } from 'node:child_process';

const feature = process.env.FEATURE_MODULE ?? process.argv[2] ?? '';
const suites = {
  auth: 'src/auth/auth.service.spec.ts',
  orders: 'src/orders/orders.service.spec.ts',
  payments: 'src/payments/payments.service.spec.ts',
  products: 'src/products/products.service.spec.ts',
  promotions: 'src/promotions/promotions.service.spec.ts',
};

const suite = suites[feature];
if (!suite) {
  console.error(`Unknown feature module "${feature}". Expected: ${Object.keys(suites).join(', ')}`);
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  ['node_modules/jest/bin/jest.js', '--runInBand', suite],
  { stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exitCode = result.status === null ? 1 : result.status;
