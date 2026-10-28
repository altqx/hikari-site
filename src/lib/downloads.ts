// Download data from hikari's releases and their update manifests (hikarisub-update.json).
// The manifest format is hikari's tools/release/make-update-manifest.py on qt; the
// channels follow docs/qt/distribution.md. Pure functions only: scripts/fetch-downloads.ts
// does the network part at build time.

export const appRepo = 'altqx/hikari';
export const releasesUrl = `https://github.com/${appRepo}/releases`;
export const manifestName = 'hikarisub-update.json';

export type PackageKind = 'nsis' | 'portable-windows' | 'appimage' | 'deb' | 'rpm' | 'portable-linux';
export type Os = 'windows' | 'linux';

export const packageKinds: Record<PackageKind, { os: Os; label: string; format: string }> = {
  nsis: { os: 'windows', label: 'Installer', format: 'setup.exe' },
  'portable-windows': { os: 'windows', label: 'Portable', format: 'zip' },
  appimage: { os: 'linux', label: 'AppImage', format: 'AppImage' },
  deb: { os: 'linux', label: 'Debian, Ubuntu', format: 'deb' },
  rpm: { os: 'linux', label: 'Fedora, openSUSE', format: 'rpm' },
  'portable-linux': { os: 'linux', label: 'Portable', format: 'tar.gz' },
};

/** What each OS downloads first. */
export const primaryKind: Record<Os, PackageKind> = { windows: 'nsis', linux: 'appimage' };

/** Off until the AUR packages are out (owner, 2026-10-28): set to true to show their links again. */
export const aurPublished = false;

export const aurPackages = {
  stable: 'hikarisub-stable-bin',
  beta: 'hikarisub-beta-bin',
} as const;

export function aurUrl(name: string) {
  return `https://aur.archlinux.org/packages/${name}`;
}

export interface Package {
  kind: PackageKind;
  name: string;
  url: string;
  size: number;
  sha256: string;
}

export interface Channel {
  version: string;
  prerelease: boolean;
  published: string;
  notesUrl: string;
  checksumsUrl?: string;
  packages: Package[];
}

export interface Downloads {
  /** The newest stable release. */
  stable?: Channel;
  /** The newest prerelease, when it is newer than the stable one. */
  beta?: Channel;
}

/** The subset of GitHub's release JSON that is read. */
export interface GitHubRelease {
  tag_name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string | null;
  html_url: string;
  assets: { name: string; browser_download_url: string }[];
}

const semver =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?$/;

export interface Version {
  major: number;
  minor: number;
  patch: number;
  pre: string[];
}

export function parseVersion(text: string): Version | undefined {
  const match = semver.exec(text);
  if (!match) return undefined;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    pre: match[4] ? match[4].split('.') : [],
  };
}

/** SemVer precedence: negative when a is lower. */
export function compareVersions(a: Version, b: Version) {
  for (const key of ['major', 'minor', 'patch'] as const) {
    if (a[key] !== b[key]) return a[key] - b[key];
  }
  if (a.pre.length === 0 || b.pre.length === 0) return b.pre.length - a.pre.length;
  for (let i = 0; i < Math.min(a.pre.length, b.pre.length); i++) {
    const x = a.pre[i];
    const y = b.pre[i];
    if (x === y) continue;
    const xn = /^\d+$/.test(x);
    const yn = /^\d+$/.test(y);
    if (xn && yn) return Number(x) - Number(y);
    if (xn !== yn) return xn ? -1 : 1;
    return x < y ? -1 : 1;
  }
  return a.pre.length - b.pre.length;
}

/** The Qt app is 0.1.0 and later; 0.0.x is legacy. */
export function isQtVersion(version: Version) {
  return version.major > 0 || version.minor > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const assetName = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const sha256 = /^[0-9a-f]{64}$/;

export interface Manifest {
  version: string;
  codebase: 'legacy' | 'qt';
  published: string;
  packages: Omit<Package, 'url'>[];
}

/** Checks a manifest the way the app's update check reads it; throws on anything off. */
export function parseManifest(json: unknown): Manifest {
  if (!isRecord(json)) throw new Error('the manifest is not an object');
  if (json.schema !== 1) throw new Error(`unknown manifest schema ${String(json.schema)}`);
  if (json.product !== 'HikariSub') throw new Error(`the manifest is for ${String(json.product)}`);
  const version = typeof json.version === 'string' ? parseVersion(json.version) : undefined;
  if (!version) throw new Error(`the manifest version ${String(json.version)} is not SemVer`);
  if (json.codebase !== 'legacy' && json.codebase !== 'qt') {
    throw new Error(`unknown codebase ${String(json.codebase)}`);
  }
  if (typeof json.published !== 'string') throw new Error('the manifest has no published date');
  if (!isRecord(json.packages)) throw new Error('the manifest has no packages');

  const packages: Manifest['packages'] = [];
  for (const [kind, value] of Object.entries(json.packages)) {
    // A kind this site doesn't know yet is skipped, as the app skips it.
    if (!(kind in packageKinds) || !isRecord(value)) continue;
    const { name, size, sha256: digest } = value;
    if (typeof name !== 'string' || !assetName.test(name)) throw new Error(`${kind}: bad asset name`);
    if (typeof size !== 'number' || !Number.isInteger(size) || size <= 0)
      throw new Error(`${kind}: bad size`);
    if (typeof digest !== 'string' || !sha256.test(digest)) throw new Error(`${kind}: bad SHA-256`);
    packages.push({ kind: kind as PackageKind, name, size, sha256: digest });
  }
  if (packages.length === 0) throw new Error('the manifest lists no known package');

  return { version: json.version as string, codebase: json.codebase, published: json.published, packages };
}

export interface ReleaseChoice {
  release: GitHubRelease;
  version: string;
  prerelease: boolean;
}

/**
 * The newest Qt stable release and the newest Qt prerelease, if newer than it. Drafts,
 * non-SemVer tags, legacy 0.0.x and releases without a manifest are skipped.
 */
export function pickReleases(releases: GitHubRelease[]): { stable?: ReleaseChoice; beta?: ReleaseChoice } {
  let stable: (ReleaseChoice & { parsed: Version }) | undefined;
  let newest: (ReleaseChoice & { parsed: Version }) | undefined;
  for (const release of releases) {
    if (release.draft || !release.tag_name.startsWith('v')) continue;
    const parsed = parseVersion(release.tag_name.slice(1));
    if (!parsed || !isQtVersion(parsed)) continue;
    if (!release.assets.some((asset) => asset.name === manifestName)) continue;
    const prerelease = release.prerelease || parsed.pre.length > 0;
    const choice = { release, version: release.tag_name.slice(1), prerelease, parsed };
    if (!prerelease && (!stable || compareVersions(parsed, stable.parsed) > 0)) stable = choice;
    if (!newest || compareVersions(parsed, newest.parsed) > 0) newest = choice;
  }
  const strip = (choice?: ReleaseChoice & { parsed: Version }) =>
    choice && { release: choice.release, version: choice.version, prerelease: choice.prerelease };
  return {
    stable: strip(stable),
    beta: newest?.prerelease ? strip(newest) : undefined,
  };
}

/** One channel from a release and its manifest. */
export function toChannel(choice: ReleaseChoice, manifest: Manifest): Channel {
  if (manifest.version !== choice.version) {
    throw new Error(`${choice.release.tag_name}: the manifest says ${manifest.version}`);
  }
  if (manifest.codebase !== 'qt') throw new Error(`${choice.release.tag_name}: not a Qt release`);
  const assets = new Map(choice.release.assets.map((asset) => [asset.name, asset.browser_download_url]));
  const order = Object.keys(packageKinds);
  const packages = manifest.packages
    .map((pkg) => {
      const url = assets.get(pkg.name);
      if (!url) throw new Error(`${choice.release.tag_name}: ${pkg.name} is not on the release`);
      return { ...pkg, url };
    })
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
  return {
    version: choice.version,
    prerelease: choice.prerelease,
    published: manifest.published,
    notesUrl: choice.release.html_url,
    checksumsUrl: assets.get('SHA256SUMS'),
    packages,
  };
}

/** The OS to offer first, from the browser's user agent. */
export function detectOs(userAgent: string, platform = ''): Os | undefined {
  const text = `${platform} ${userAgent}`;
  if (/Windows|Win32|Win64/i.test(text)) return 'windows';
  if (/Android|CrOS/i.test(text)) return undefined;
  if (/Linux|X11|FreeBSD/i.test(text)) return 'linux';
  return undefined;
}

/** The channel the button offers: stable once there is one, else the beta. */
export function mainChannel(downloads: Downloads) {
  return downloads.stable ?? downloads.beta;
}

export function formatSize(bytes: number) {
  return `${Math.round(bytes / 1e6)} MB`;
}
