const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '..', 'public');
const launchDateToken = '{{LAUNCH_DATE}}';

if (!fs.existsSync(publicDir)) {
  process.exit(0);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function snapshotDirectory(dir) {
  return walk(dir, () => true)
    .map((filePath) => {
      const stat = fs.statSync(filePath);
      return `${toPublicRelative(filePath)}:${stat.size}:${stat.mtimeMs}`;
    })
    .sort()
    .join('|');
}

function walk(dir, predicate, matches = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, predicate, matches);
      continue;
    }
    if (predicate(fullPath)) {
      matches.push(fullPath);
    }
  }
  return matches;
}

function toPublicRelative(filePath) {
  return path.relative(publicDir, filePath).split(path.sep).join('/');
}

function normalizeAssetPath(assetPath) {
  return assetPath.split(/[?#]/, 1)[0].replace(/^\/+/, '').replace(/^\.\//, '');
}

function isLocalAsset(url) {
  return url && !/^(?:[a-z]+:|\/\/|#)/i.test(url);
}

function collectHtmlReferences() {
  const htmlFiles = walk(publicDir, (filePath) => filePath.endsWith('.html'));
  const references = new Set();

  for (const htmlFile of htmlFiles) {
    const html = fs.readFileSync(htmlFile, 'utf8');
    const assetPattern =
      /<(?:script|link|img)\b[^>]+\b(?:src|href)=["']?([^"' >]+)["']?[^>]*>/gi;
    let match;
    while ((match = assetPattern.exec(html))) {
      if (isLocalAsset(match[1])) {
        references.add(normalizeAssetPath(match[1]));
      }
    }
  }

  return references;
}

function formatLaunchDate(dateIso) {
  const launchDate = new Date(dateIso);
  if (Number.isNaN(launchDate.getTime())) {
    return null;
  }

  return launchDate.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function replaceLaunchDateTokens(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  if (!original.includes(launchDateToken)) {
    return;
  }

  const launchDateMatch = original.match(
    /\bdata-launch-date-iso=(?:"([^"]+)"|([^>\s]+))/,
  );
  if (!launchDateMatch) {
    return;
  }

  const launchDateText = formatLaunchDate(
    launchDateMatch[1] || launchDateMatch[2],
  );
  if (!launchDateText) {
    return;
  }

  const updated = original.replaceAll(launchDateToken, launchDateText);
  if (updated !== original) {
    fs.writeFileSync(filePath, updated);
  }
}

function stripSourceMapComments(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const cleaned = original
    .replace(/\n?\/\/# sourceMappingURL=.*$/gm, '')
    .replace(/\n?\/\*# sourceMappingURL=.*\*\/\s*$/gm, '\n')
    .replace(/\n{3,}/g, '\n\n');

  if (cleaned !== original) {
    fs.writeFileSync(filePath, cleaned);
  }
}

function isHmrRuntimeBundle(filePath) {
  const contents = fs.readFileSync(filePath, 'utf8');
  return (
    contents.includes('HMR_HOST') &&
    contents.includes('Connection to the HMR server was lost') &&
    contents.includes('new WebSocket')
  );
}

async function waitForStableOutput() {
  let previousSnapshot = '';
  let stablePasses = 0;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const currentSnapshot = snapshotDirectory(publicDir);
    if (currentSnapshot === previousSnapshot) {
      stablePasses += 1;
      if (stablePasses >= 3) {
        return;
      }
    } else {
      stablePasses = 0;
      previousSnapshot = currentSnapshot;
    }

    await delay(250);
  }
}

function runCleanupPass() {
  const htmlFiles = walk(publicDir, (filePath) => filePath.endsWith('.html'));
  const referencedAssets = collectHtmlReferences();
  const jsFiles = walk(publicDir, (filePath) => filePath.endsWith('.js'));
  const cssFiles = walk(publicDir, (filePath) => filePath.endsWith('.css'));
  const mapFiles = walk(publicDir, (filePath) => filePath.endsWith('.map'));

  for (const filePath of htmlFiles) {
    replaceLaunchDateTokens(filePath);
  }

  for (const filePath of [...jsFiles, ...cssFiles]) {
    stripSourceMapComments(filePath);
  }

  for (const filePath of jsFiles) {
    const relativePath = toPublicRelative(filePath);
    if (!referencedAssets.has(relativePath) && isHmrRuntimeBundle(filePath)) {
      fs.rmSync(filePath, { force: true });
    }
  }

  for (const filePath of mapFiles) {
    fs.rmSync(filePath, { force: true });
  }
}

async function main() {
  await waitForStableOutput();
  runCleanupPass();
  await delay(500);
  runCleanupPass();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
