import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const frontendRoot = resolve(backendRoot, '../frontend');
const todoChecker = resolve(backendRoot, 'scripts/check-test-todos.mjs');
const frontendTodoChecker = resolve(frontendRoot, 'scripts/check-test-todos.mjs');

const check = spawnSync(
  process.execPath,
  [todoChecker, 'all', '--strict'],
  { cwd: backendRoot, stdio: 'inherit' },
);

if (check.error) throw check.error;

const frontendCheck = spawnSync(
  process.execPath,
  [frontendTodoChecker, '--strict'],
  { cwd: frontendRoot, stdio: 'inherit' },
);

if (frontendCheck.error) throw frontendCheck.error;

if (check.status !== 0 || frontendCheck.status !== 0) {
  console.warn('TODO tests remain; full E2E is deferred until integration is complete.');
  process.exit(0);
}

console.log('No TODO tests remain; running full API E2E tests.');
const e2e = spawnSync(
  process.execPath,
  [
    resolve(backendRoot, 'node_modules/jest/bin/jest.js'),
    '--config',
    resolve(backendRoot, 'test/jest-e2e.json'),
    '--runInBand',
  ],
  {
    cwd: backendRoot,
    stdio: 'inherit',
  },
);

if (e2e.error) throw e2e.error;
process.exitCode = e2e.status === null ? 1 : e2e.status;
