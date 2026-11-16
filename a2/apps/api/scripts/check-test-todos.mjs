import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const scope = process.argv[2] ?? 'all';
const strict = process.argv.includes('--strict');
const roots = scope === 'all' ? ['src', 'test'] : [`src/${scope}`];
const pattern = /\b(?:it|test|describe)\.todo\s*\(/g;
const todos = [];

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    const filePath = join(directory, entry);
    if (statSync(filePath).isDirectory()) {
      scan(filePath);
      continue;
    }

    if (!/\.(spec|e2e-spec)\.ts$/.test(filePath)) continue;
    const count = (readFileSync(filePath, 'utf8').match(pattern) ?? []).length;
    if (count > 0) todos.push(`${relative(process.cwd(), filePath)}: ${count} TODO`);
  }
}

for (const root of roots) {
  try {
    scan(root);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

if (todos.length > 0) {
  console.warn(`Unfinished ${scope} tests:`);
  console.warn(todos.join('\n'));
}

if (strict && todos.length > 0) process.exitCode = 1;
