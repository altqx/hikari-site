import { describe, expect, test } from 'bun:test';
import legacyManifest from '../../tests/fixtures/manifest-0.0.2.json';
import qtManifest from '../../tests/fixtures/manifest-0.1.0-beta.1.json';
import legacyReleases from '../../tests/fixtures/releases-0.0.2.json';
import {
  compareVersions,
  detectOs,
  type GitHubRelease,
  parseManifest,
  parseVersion,
  pickReleases,
  toChannel,
} from './downloads';

function release(tag: string, options: Partial<GitHubRelease> = {}): GitHubRelease {
  const version = tag.slice(1);
  const names = Object.values(qtManifest.packages).map((pkg) => pkg.name.replace('0.1.0-beta.1', version));
  return {
    tag_name: tag,
    draft: false,
    prerelease: version.includes('-'),
    published_at: '2026-11-03T00:00:00Z',
    html_url: `https://github.com/altqx/hikari/releases/tag/${tag}`,
    assets: [...names, 'hikarisub-update.json', 'SHA256SUMS'].map((name) => ({
      name,
      browser_download_url: `https://github.com/altqx/hikari/releases/download/${tag}/${name}`,
    })),
    ...options,
  };
}

describe('versions', () => {
  test('follow SemVer precedence', () => {
    const order = ['0.0.2', '0.1.0-beta.1', '0.1.0-beta.2', '0.1.0-beta.10', '0.1.0-rc.1', '0.1.0', '0.1.1'];
    const parsed = order.map((v) => parseVersion(v));
    for (let i = 1; i < parsed.length; i++) {
      // biome-ignore lint/style/noNonNullAssertion: every entry is valid SemVer
      expect(compareVersions(parsed[i - 1]!, parsed[i]!)).toBeLessThan(0);
    }
  });

  test('reject non-SemVer tags', () => {
    expect(parseVersion('0.1')).toBeUndefined();
    expect(parseVersion('qt-metadata-linux-6.11.2-20261002')).toBeUndefined();
  });
});

describe('parseManifest', () => {
  test('reads the real v0.0.2 manifest', () => {
    const manifest = parseManifest(legacyManifest);
    expect(manifest.codebase).toBe('legacy');
    expect(manifest.packages.map((pkg) => pkg.kind)).toEqual([
      'nsis',
      'portable-windows',
      'appimage',
      'deb',
      'rpm',
      'portable-linux',
    ]);
    expect(manifest.packages[0]).toEqual({
      kind: 'nsis',
      name: 'HikariSub-0.0.2-windows-x64-setup.exe',
      size: 90442474,
      sha256: 'a0fc2ff5798d9284b3b4963dfb7a1c85b6ef833b189152e5fff8bbab7901f2e1',
    });
  });

  test('skips package kinds it does not know', () => {
    const manifest = parseManifest({
      ...qtManifest,
      packages: { ...qtManifest.packages, flatpak: { name: 'x.flatpak', size: 1, sha256: 'a'.repeat(64) } },
    });
    expect(manifest.packages).toHaveLength(6);
  });

  test('throws on a broken manifest', () => {
    expect(() => parseManifest({ ...qtManifest, schema: 2 })).toThrow('schema');
    expect(() => parseManifest({ ...qtManifest, product: 'Kainote' })).toThrow('Kainote');
    expect(() =>
      parseManifest({ ...qtManifest, packages: { nsis: { ...qtManifest.packages.nsis, sha256: 'nope' } } }),
    ).toThrow('SHA-256');
    expect(() => parseManifest({ ...qtManifest, packages: {} })).toThrow('no known package');
  });
});

describe('pickReleases', () => {
  test('ignores legacy 0.0.x, so there is nothing to offer yet', () => {
    expect(pickReleases(legacyReleases)).toEqual({});
  });

  test('offers the first beta while no stable release exists', () => {
    const picked = pickReleases([release('v0.1.0-beta.1'), ...legacyReleases]);
    expect(picked.stable).toBeUndefined();
    expect(picked.beta?.version).toBe('0.1.0-beta.1');
  });

  test('offers a beta only when it is newer than the stable release', () => {
    const older = pickReleases([release('v0.1.0'), release('v0.1.0-rc.1')]);
    expect(older.stable?.version).toBe('0.1.0');
    expect(older.beta).toBeUndefined();

    const newer = pickReleases([release('v0.1.1-beta.1'), release('v0.1.0')]);
    expect(newer.stable?.version).toBe('0.1.0');
    expect(newer.beta?.version).toBe('0.1.1-beta.1');
  });

  test('skips drafts, releases without a manifest and other tags', () => {
    const noManifest = release('v0.2.0');
    noManifest.assets = noManifest.assets.filter((asset) => asset.name !== 'hikarisub-update.json');
    const picked = pickReleases([
      release('v0.3.0', { draft: true }),
      noManifest,
      release('vnext'),
      release('v0.1.0'),
    ]);
    expect(picked.stable?.version).toBe('0.1.0');
  });

  test('treats a GitHub prerelease as beta even without a SemVer prerelease', () => {
    expect(pickReleases([release('v0.1.0', { prerelease: true })]).beta?.version).toBe('0.1.0');
  });
});

describe('toChannel', () => {
  const choice = { release: release('v0.1.0-beta.1'), version: '0.1.0-beta.1', prerelease: true };

  test('links each package to its release asset', () => {
    const channel = toChannel(choice, parseManifest(qtManifest));
    expect(channel.packages[2]).toMatchObject({
      kind: 'appimage',
      url: 'https://github.com/altqx/hikari/releases/download/v0.1.0-beta.1/HikariSub-0.1.0-beta.1-linux-x86_64.AppImage',
    });
    expect(channel.checksumsUrl).toBe(
      'https://github.com/altqx/hikari/releases/download/v0.1.0-beta.1/SHA256SUMS',
    );
    expect(channel.notesUrl).toBe('https://github.com/altqx/hikari/releases/tag/v0.1.0-beta.1');
  });

  test('refuses a manifest for another version or codebase', () => {
    expect(() => toChannel(choice, parseManifest({ ...qtManifest, version: '0.1.0' }))).toThrow(
      'manifest says',
    );
    expect(() => toChannel(choice, parseManifest({ ...qtManifest, codebase: 'legacy' }))).toThrow('not a Qt');
  });

  test('refuses a package that is not on the release', () => {
    const missing = { ...choice, release: { ...choice.release, assets: [] } };
    expect(() => toChannel(missing, parseManifest(qtManifest))).toThrow('is not on the release');
  });
});

describe('detectOs', () => {
  test('reads common user agents', () => {
    expect(detectOs('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')).toBe('windows');
    expect(detectOs('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36')).toBe('linux');
    expect(detectOs('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36')).toBeUndefined();
    expect(detectOs('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)')).toBeUndefined();
    expect(detectOs('Mozilla/5.0', 'Windows')).toBe('windows');
  });
});
