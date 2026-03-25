const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const outputRootDir = path.join(projectRoot, 'output', 'visual-diff', 'home-regions');

const chromeBinary =
  process.env.CHROME_BIN ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const viewport = process.env.HOME_REGIONS_VIEWPORT || '2048,3000';
const cropGeometry = process.env.HOME_REGIONS_CROP || '1550x520+250+500';
const virtualTimeBudget = process.env.HOME_REGIONS_VIRTUAL_TIME_BUDGET || '5000';
const rmseTarget = Number.parseFloat(process.env.HOME_REGIONS_RMSE_TARGET || '10000');
const skipBuild = process.argv.includes('--skip-build');
const outputLabelArgIndex = process.argv.findIndex((arg) => arg === '--label' || arg.startsWith('--label='));
const outputLabel =
  outputLabelArgIndex === -1
    ? 'latest'
    : process.argv[outputLabelArgIndex].includes('=')
      ? process.argv[outputLabelArgIndex].split('=').slice(1).join('=')
      : process.argv[outputLabelArgIndex + 1];
const outputDir = path.join(outputRootDir, outputLabel);
const regionsOutputDir = path.join(outputDir, 'regions');
const regionConfigs = [
  { name: 'africa', crop: '200x100+163+172' },
  { name: 'asia-pacific', crop: '200x100+418+172' },
  { name: 'europe', crop: '200x100+667+176' },
  { name: 'middle-east', crop: '200x100+918+174' },
  { name: 'north-america', crop: '200x100+1173+170' },
  { name: 'australia', crop: '200x100+531+296' },
  { name: 'latin-america', crop: '200x100+810+296' },
];

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function resetDir(dirPath) {
  fs.rmSync(dirPath, { recursive: true, force: true });
  fs.mkdirSync(dirPath, { recursive: true });
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: options.captureOutput ? 'pipe' : 'inherit',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
    timeout: options.timeout ?? 30000,
  });

  if (options.acceptExitCodes?.includes(result.status)) {
    return result;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} failed with exit code ${result.status}\n${result.stderr || ''}`.trim(),
    );
  }

  return result;
}

function findFreePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const { port } = probe.address();
      probe.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(port);
      });
    });
  });
}

function startStaticServer(port) {
  const serverProcess = spawn('python3', ['-m', 'http.server', String(port), '-d', publicDir], {
    cwd: projectRoot,
    env: process.env,
    stdio: 'ignore',
  });

  return serverProcess;
}

function waitForServer(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();

    function attempt() {
      const request = http.get(url, (response) => {
        response.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(attempt, 200);
      });
    }

    attempt();
  });
}

function stopServer(serverProcess) {
  if (!serverProcess || serverProcess.killed) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      serverProcess.kill('SIGKILL');
    }, 1000);

    serverProcess.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });

    serverProcess.kill('SIGTERM');
  });
}

function captureScreenshot(targetUrl, outputPath) {
  process.stdout.write(`capture ${targetUrl}\n`);
  const chrome = spawnSync(
    chromeBinary,
    [
      '--headless=new',
      '--disable-gpu',
      '--disable-background-networking',
      '--disable-component-update',
      '--hide-scrollbars',
      '--no-default-browser-check',
      '--no-first-run',
      `--window-size=${viewport}`,
      '--force-device-scale-factor=1',
      `--virtual-time-budget=${virtualTimeBudget}`,
      `--screenshot=${outputPath}`,
      targetUrl,
    ],
    {
      cwd: projectRoot,
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
      timeout: 30000,
    },
  );

  if (chrome.status !== 0) {
    throw new Error(
      `Chrome screenshot failed for ${targetUrl}\n${chrome.stderr || chrome.stdout || ''}`.trim(),
    );
  }
}

function cropScreenshot(inputPath, outputPath) {
  runCommand('magick', [inputPath, '-crop', cropGeometry, '+repage', outputPath]);
}

function transparentizeWhite(inputPath, outputPath) {
  runCommand('magick', [inputPath, '-alpha', 'set', '-fuzz', '1.5%', '-transparent', 'white', outputPath]);
}

function compareScreenshots(baselinePath, currentPath, diffPath) {
  const result = runCommand(
    'magick',
    ['compare', '-metric', 'RMSE', baselinePath, currentPath, diffPath],
    { captureOutput: true, acceptExitCodes: [0, 1] },
  );

  return (result.stderr || result.stdout || '').trim();
}

function parseRmse(metric) {
  const match = metric.match(/([0-9.]+)\s+\(([0-9.]+)\)/);

  if (!match) {
    return { absolute: Number.NaN, normalized: Number.NaN };
  }

  return {
    absolute: Number.parseFloat(match[1]),
    normalized: Number.parseFloat(match[2]),
  };
}

function createRegionArtifacts(localModulePath) {
  return regionConfigs.map((region) => {
    const baselineSourcePath = path.join(
      projectRoot,
      'src',
      'assets',
      'images',
      'pages',
      'home',
      'regions',
      `${region.name}.png`,
    );
    const baselineOpaquePath = path.join(regionsOutputDir, `${region.name}-baseline-opaque.png`);
    const baselinePath = path.join(regionsOutputDir, `${region.name}-baseline.png`);
    const localOpaquePath = path.join(regionsOutputDir, `${region.name}-local-opaque.png`);
    const localPath = path.join(regionsOutputDir, `${region.name}-local.png`);
    const diffPath = path.join(regionsOutputDir, `${region.name}-diff.png`);

    fs.copyFileSync(baselineSourcePath, baselineOpaquePath);
    transparentizeWhite(baselineOpaquePath, baselinePath);
    runCommand('magick', [localModulePath, '-crop', region.crop, '+repage', localOpaquePath]);
    transparentizeWhite(localOpaquePath, localPath);
    const rmse = compareScreenshots(baselinePath, localPath, diffPath);

    return {
      name: region.name,
      crop: region.crop,
      baselinePath,
      localPath,
      diffPath,
      rmse,
      parsedRmse: parseRmse(rmse),
    };
  });
}

function writeSummary(summaryPath, lines) {
  fs.writeFileSync(summaryPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  resetDir(outputDir);
  ensureDir(regionsOutputDir);

  if (!fs.existsSync(chromeBinary)) {
    throw new Error(`Chrome binary not found: ${chromeBinary}`);
  }

  if (!skipBuild) {
    runCommand('npm', ['run', 'build']);
  }

  const port = await findFreePort();
  const serverProcess = startStaticServer(port);
  const localUrl = `http://127.0.0.1:${port}/index.html`;
  await waitForServer(localUrl);
  process.stdout.write(`serve ${localUrl}\n`);

  const localFullPath = path.join(outputDir, 'local-full.png');
  const localModulePath = path.join(outputDir, 'local-module.png');
  const summaryPath = path.join(outputDir, 'summary.txt');

  try {
    captureScreenshot(localUrl, localFullPath);
    process.stdout.write('crop local\n');
    cropScreenshot(localFullPath, localModulePath);
    process.stdout.write('compare regions\n');
    const regionResults = createRegionArtifacts(localModulePath);
    const sortedRegionResults = [...regionResults].sort(
      (left, right) => right.parsedRmse.absolute - left.parsedRmse.absolute,
    );
    const worstRegion = sortedRegionResults[0];
    const passCount = sortedRegionResults.filter((region) => region.parsedRmse.absolute < rmseTarget).length;

    writeSummary(summaryPath, [
      `baseline: ${path.join(projectRoot, 'src/assets/images/pages/home/regions/*.png')}`,
      `local: ${localUrl}`,
      `viewport: ${viewport}`,
      `crop: ${cropGeometry}`,
      'background: transparentized white before compare',
      `rmse-target: ${rmseTarget.toFixed(0)}`,
      `worst-region: ${worstRegion.name} rmse=${worstRegion.rmse}`,
      `regions-below-target: ${passCount}/${sortedRegionResults.length}`,
      `artifacts: ${outputDir}`,
      ...sortedRegionResults.map(
        (region) =>
          `region:${region.name}: status=${
            region.parsedRmse.absolute < rmseTarget ? 'PASS' : 'FAIL'
          } crop=${region.crop} rmse=${region.rmse}`,
      ),
    ]);

    process.stdout.write(`${summaryPath}\n${worstRegion.name} ${worstRegion.rmse}\n`);
  } finally {
    process.stdout.write('close server\n');
    await stopServer(serverProcess);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
