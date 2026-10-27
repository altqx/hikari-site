import { aurPackages, aurUrl, type Channel, formatSize, packageKinds, releasesUrl } from '@/lib/downloads';
import { downloads } from '@/lib/downloads-data';

function ChannelTable({ channel, title }: { channel: Channel; title: string }) {
  const aur = channel.prerelease ? aurPackages.beta : aurPackages.stable;

  return (
    <div data-testid={`downloads-${channel.prerelease ? 'beta' : 'stable'}`}>
      <p>
        <strong>{title}</strong>: {channel.version}, published {channel.published.slice(0, 10)} ·{' '}
        <a href={channel.notesUrl}>Release notes</a>
        {channel.checksumsUrl && (
          <>
            {' '}
            · <a href={channel.checksumsUrl}>SHA256SUMS</a>
          </>
        )}
      </p>
      <table>
        <thead>
          <tr>
            <th>System</th>
            <th>Format</th>
            <th>Size</th>
            <th>SHA-256</th>
          </tr>
        </thead>
        <tbody>
          {channel.packages.map((pkg) => {
            const kind = packageKinds[pkg.kind];
            return (
              <tr key={pkg.kind}>
                <td>{kind.os === 'windows' ? 'Windows' : 'Linux'}</td>
                <td>
                  <a href={pkg.url}>
                    {kind.label === kind.format ? kind.label : `${kind.label} (${kind.format})`}
                  </a>
                </td>
                <td>{formatSize(pkg.size)}</td>
                <td>
                  <code className="break-all text-xs">{pkg.sha256}</code>
                </td>
              </tr>
            );
          })}
          <tr>
            <td>Arch Linux</td>
            <td>
              <a href={aurUrl(aur)}>AUR: {aur}</a>
            </td>
            <td colSpan={2}>Built from the tar.gz</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** Every download of the newest releases, for the install guide. */
export function DownloadTable() {
  const { stable, beta } = downloads;

  if (!stable && !beta) {
    return (
      <p data-testid="downloads-coming">
        Downloads are coming with 0.1.0-beta.1. Releases will appear on <a href={releasesUrl}>GitHub</a>.
      </p>
    );
  }

  return (
    <>
      {stable && <ChannelTable channel={stable} title="Stable" />}
      {beta && <ChannelTable channel={beta} title="Beta" />}
    </>
  );
}
