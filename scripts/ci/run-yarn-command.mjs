import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error('Usage: node ./scripts/ci/run-yarn-command.mjs <yarn-args...>');
  process.exit(1);
}

const result = spawnSync('corepack', ['yarn', ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
  env: process.env,
});

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1);
}
