import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const scope = process.argv[2] ?? 'all';
const roots = scope === 'all' ? ['src', 'test'] : [`src/${scope}`];
const todoPattern = /\b(?:it|test|describe)\.todo\s*\(/g;
const todos = [];

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scan(path);
      continue;
    }

    if (!/\.(spec|e2e-spec)\.ts$/.test(path)) continue;
    const count = (readFileSync(path, 'utf8').match(todoPattern) ?? []).length;
    if (count > 0) todos.push(`${relative(process.cwd(), path)}: ${count} TODO`);
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

if (process.argv.includes('--strict') && todos.length > 0) {
  process.exitCode = 1;
}
