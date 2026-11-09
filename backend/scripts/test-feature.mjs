import { execFileSync } from 'node:child_process';

const feature = process.argv[2];
const testFiles = {
  auth: ['src/auth/auth.service.spec.ts'],
  orders: ['src/orders/orders.service.spec.ts'],
  payments: ['src/payments/payments.service.spec.ts'],
  products: ['src/products/products.service.spec.ts'],
  promotions: ['src/promotions/promotions.service.spec.ts'],
};

if (!feature || !testFiles[feature]) {
  throw new Error(`Unknown feature. Expected one of: ${Object.keys(testFiles).join(', ')}`);
}

const pnpm = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

execFileSync(pnpm, ['exec', 'jest', '--runInBand', ...testFiles[feature]], {
  shell: true,
  stdio: 'inherit',
});
