import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  aurPackages,
  aurPublished,
  aurUrl,
  type Channel,
  detectOs,
  formatSize,
  mainChannel,
  type Os,
  type Package,
  packageKinds,
  primaryKind,
  releasesUrl,
} from '@/lib/downloads';
import { downloads } from '@/lib/downloads-data';

const osNames: Record<Os, string> = { windows: 'Windows', linux: 'Linux' };

function useVisitorOs() {
  // Detected after hydration, so the pre-rendered page and the first render agree.
  const [os, setOs] = useState<Os>();
  useEffect(() => {
    const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
    setOs(detectOs(nav.userAgent, nav.userAgentData?.platform));
  }, []);
  return os;
}

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg bg-fd-primary px-4 py-2.5 text-sm font-medium text-fd-primary-foreground';
const linkClass = 'underline decoration-fd-border underline-offset-4 hover:text-fd-foreground';

function kindName(pkg: Package) {
  const { label, format } = packageKinds[pkg.kind];
  return label === format ? label : `${label} (${format})`;
}

function FormatLink({ pkg }: { pkg: Package }) {
  return (
    <a href={pkg.url} className={linkClass} title={`${pkg.name}, ${formatSize(pkg.size)}`}>
      {kindName(pkg)}
    </a>
  );
}

function Formats({ channel }: { channel: Channel }) {
  const aur = channel.prerelease ? aurPackages.beta : aurPackages.stable;
  const column = (os: Os) => channel.packages.filter((pkg) => packageKinds[pkg.kind].os === os);

  return (
    <div className="mt-5 grid grid-cols-1 gap-4 text-sm text-fd-muted-foreground sm:grid-cols-3">
      {(['windows', 'linux'] as const).map((os) => (
        <div key={os} className="flex flex-col gap-1">
          <span className="font-medium text-fd-foreground">{osNames[os]}</span>
          {column(os).map((pkg) => (
            <FormatLink key={pkg.kind} pkg={pkg} />
          ))}
        </div>
      ))}
      {(aurPublished || channel.checksumsUrl) && (
        <div className="flex flex-col gap-1">
          <span className="font-medium text-fd-foreground">{aurPublished ? 'Arch Linux' : 'Checksums'}</span>
          {aurPublished && (
            <a href={aurUrl(aur)} className={linkClass}>
              AUR: {aur}
            </a>
          )}
          {channel.checksumsUrl && (
            <a href={channel.checksumsUrl} className={linkClass}>
              SHA-256 checksums
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export function DownloadButton() {
  const os = useVisitorOs();
  const channel = mainChannel(downloads);

  if (!channel) {
    return (
      <div className="flex flex-col items-start gap-2">
        <a href={releasesUrl} className={buttonClass} data-testid="download-button">
          <Download className="size-4" />
          Coming with 0.1.0-beta.1
        </a>
        <span className="text-sm text-fd-muted-foreground">
          The first release of the new HikariSub is on its way.
        </span>
      </div>
    );
  }

  const primary = os && channel.packages.find((pkg) => pkg.kind === primaryKind[os]);
  const beta = downloads.stable && downloads.beta;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={primary ? primary.url : '#download-formats'}
          className={buttonClass}
          data-testid="download-button"
        >
          <Download className="size-4" />
          {primary && os ? (
            <>
              Download for {osNames[os]}
              <span className="font-normal opacity-80">{packageKinds[primary.kind].label}</span>
            </>
          ) : (
            'Download'
          )}
        </a>
        <span className="text-sm text-fd-muted-foreground">
          {channel.version}
          {channel.prerelease && ' · Beta'} ·{' '}
          <a href={channel.notesUrl} className={linkClass}>
            Release notes
          </a>
        </span>
      </div>
      <div id="download-formats">
        <Formats channel={channel} />
      </div>
      {beta && (
        <p className="mt-4 text-sm text-fd-muted-foreground">
          Beta: {beta.version} ·{' '}
          <a href={beta.notesUrl} className={linkClass}>
            Release notes and downloads
          </a>
        </p>
      )}
    </div>
  );
}
