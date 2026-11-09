import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const strict = process.argv.includes('--strict');
const todos = [];

function scan(directory) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) {
      scan(path);
      continue;
    }

    if (!/\.test\.ts$/.test(path)) continue;
    const count = (readFileSync(path, 'utf8').match(/\btest\.todo\s*\(/g) ?? []).length;
    if (count > 0) todos.push(`${relative(process.cwd(), path)}: ${count} TODO`);
  }
}

scan('tests');

if (todos.length > 0) {
  console.warn('Unfinished frontend tests:');
  console.warn(todos.join('\n'));
}

if (strict && todos.length > 0) process.exitCode = 1;
