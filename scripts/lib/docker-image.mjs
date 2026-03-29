import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

function readPackageVersion() {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function runGitShortSha() {
  const result = spawnSync('git', ['rev-parse', '--short', 'HEAD'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    return 'unknown';
  }

  return result.stdout.trim() || 'unknown';
}

function currentTimestamp() {
  const date = new Date();
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0'),
  ];
  return parts.join('');
}

export function resolveImageMetadata(kind) {
  if (kind !== 'site') {
    throw new Error(`Unsupported image kind: ${kind}`);
  }

  const imageRepo = process.env.REPOSITORY?.trim() || 'docker.peakwalk.tech/oae';
  const version = process.env.VERSION?.trim() || readPackageVersion();
  const buildNumber = process.env.BUILD_NUMBER?.trim() || '0';
  const revision = process.env.SCM_REVISION?.trim() || runGitShortSha();
  const timestamp = process.env.TIMESTAMP?.trim() || currentTimestamp();
  const imageName = `${imageRepo}/site`;
  const shortTag = `${imageName}:${version}`;
  const longTag = `${imageName}:${version}-${buildNumber}`;
  const fullTag = `${imageName}:${version}-${buildNumber}-${revision}-${timestamp}`;
  const nginxImage = process.env.NGINX_IMAGE?.trim();
  const labels = {
    'org.opencontainers.image.version': version,
    'org.opencontainers.image.revision': revision,
    'org.opencontainers.image.created': timestamp,
    'com.peakwalk.image.short-version': shortTag,
    'com.peakwalk.image.long-version': longTag,
    'com.peakwalk.image.full-version': fullTag,
  };

  return {
    kind,
    imageName,
    version,
    buildNumber,
    revision,
    timestamp,
    shortTag,
    longTag,
    fullTag,
    tags: [shortTag, longTag, fullTag],
    dockerfile: 'Dockerfile',
    contextDir: '.',
    buildArgs: nginxImage ? { NGINX_IMAGE: nginxImage } : {},
    labels,
  };
}

export function runDocker(args) {
  const result = spawnSync('docker', args, {
    stdio: 'inherit',
    cwd: process.cwd(),
    env: process.env,
  });

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}
