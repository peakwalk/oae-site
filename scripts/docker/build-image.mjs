import { existsSync } from 'node:fs';
import { resolveImageMetadata, runDocker } from '../lib/docker-image.mjs';

const kind = process.argv[2];

if (!kind) {
  console.error('Usage: node ./scripts/docker/build-image.mjs <site>');
  process.exit(1);
}

if (!existsSync('public')) {
  console.error('Missing public directory. Run `npm run build:release` before building the site image.');
  process.exit(1);
}

const metadata = resolveImageMetadata(kind);
const labelArgs = Object.entries(metadata.labels).flatMap(([key, value]) => ['--label', `${key}=${value}`]);
const buildArgs = Object.entries(metadata.buildArgs ?? {}).flatMap(([key, value]) => ['--build-arg', `${key}=${value}`]);
const tagArgs = metadata.tags.flatMap((tag) => ['--tag', tag]);

runDocker([
  'build',
  '--platform',
  'linux/amd64',
  '--file',
  metadata.dockerfile,
  ...tagArgs,
  ...labelArgs,
  ...buildArgs,
  metadata.contextDir,
]);
