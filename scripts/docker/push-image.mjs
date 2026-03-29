import { resolveImageMetadata, runDocker } from '../lib/docker-image.mjs';

const kind = process.argv[2];

if (!kind) {
  console.error('Usage: node ./scripts/docker/push-image.mjs <site>');
  process.exit(1);
}

const metadata = resolveImageMetadata(kind);

for (const tag of metadata.tags) {
  runDocker(['push', tag]);
}
