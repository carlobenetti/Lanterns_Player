import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const playerDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const localAppData =
  process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local');

const ANDROID_STUDIO_JAVA = 'C:\\Program Files\\Android\\Android Studio\\jbr';
const DEFAULT_SDK = join(localAppData, 'Android', 'Sdk');
const APK_SOURCE = join(
  playerDir,
  'src-tauri/gen/android/app/build/outputs/apk/universal/release/app-universal-release.apk',
);
const RELEASE_DIR = join(playerDir, 'release');

const newestNdk = (sdk) => {
  const ndkDir = join(sdk, 'ndk');
  if (!existsSync(ndkDir)) {
    return undefined;
  }
  const versions = readdirSync(ndkDir).sort((first, second) =>
    second.localeCompare(first, undefined, { numeric: true }),
  );
  return versions[0] && join(ndkDir, versions[0]);
};

const env = { ...process.env };
env.JAVA_HOME ??= ANDROID_STUDIO_JAVA;
env.ANDROID_HOME ??= DEFAULT_SDK;
env.NDK_HOME ??= newestNdk(env.ANDROID_HOME);

for (const name of ['JAVA_HOME', 'ANDROID_HOME', 'NDK_HOME']) {
  if (!env[name] || !existsSync(env[name])) {
    console.error(
      `${name} not found (${env[name] ?? 'unset'}). See ANDROID.md.`,
    );
    process.exit(1);
  }
}

const build = spawnSync(
  'pnpm',
  [
    'tauri',
    'android',
    'build',
    '--apk',
    '--target',
    'aarch64',
    ...process.argv.slice(2),
  ],
  { cwd: playerDir, env, stdio: 'inherit', shell: true },
);
if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const { version } = JSON.parse(
  readFileSync(join(playerDir, 'src-tauri/tauri.conf.json'), 'utf8'),
);
mkdirSync(RELEASE_DIR, { recursive: true });
const destination = join(RELEASE_DIR, `LanternsPlayer-${version}.apk`);
copyFileSync(APK_SOURCE, destination);
console.log(`\nAPK ready: ${destination}`);
