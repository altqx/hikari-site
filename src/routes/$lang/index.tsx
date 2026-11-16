import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import {
  ArrowRight,
  AudioWaveform,
  CheckCheck,
  Code,
  FileText,
  Languages,
  type LucideIcon,
  Move,
  Music,
  Type,
} from 'lucide-react';
import { parityCounts } from '@/components/aegisub-parity';
import { AssPreview } from '@/components/ass-preview';
import { DownloadButton } from '@/components/download-button';
import { GuideLink } from '@/components/guide-link';
import { ShotPlaceholder } from '@/components/shot-placeholder';
import { baseOptions } from '@/lib/layout.shared';
import { pageHead, siteDescription } from '@/lib/seo';
import { appName, appRepoUrl, gitConfig } from '@/lib/shared';

export const Route = createFileRoute('/$lang/')({
  component: Home,
  head: ({ params }) => pageHead({ path: `/${params.lang}`, title: appName, description: siteDescription }),
});

// The owner's pitch (altqx/hikari#810, Q486 and gate 2 Q1).
const pitch =
  'Everything you do in Aegisub, plus projects, several windows and an AI that only changes what you keep. The subtitle editor for typesetting, timing, karaoke and translation, for Windows and Linux.';

interface Tile {
  title: string;
  text: string;
  guide: string;
  more: string;
}

/** What Aegisub does, and HikariSub does too: one line each (Q486, Q488, Q10). */
const aegisubTiles: (Tile & { icon: LucideIcon; extra?: string })[] = [
  {
    icon: AudioWaveform,
    title: 'Timing and audio',
    text: 'Waveform and spectrum, keyframe snapping, shift times and the post-processor.',
    guide: 'basics/timing',
    more: 'Timing',
  },
  {
    icon: Move,
    title: 'Visual typesetting tools',
    text: 'Move, rotate, scale, clip and draw on the video, with the exact values beside them.',
    guide: 'typesetting/visual-tools',
    more: 'Visual typesetting tools',
  },
  {
    icon: Type,
    title: 'Styles and fonts',
    text: 'The Style manager and its catalogues, the font collector and resampling.',
    guide: 'basics/styles',
    more: 'Styles',
  },
  {
    icon: Music,
    title: 'Karaoke',
    text: 'Split, join, the Kanji timer, and the native Karaoke Templater with its Template editor.',
    guide: 'karaoke/split-and-join',
    more: 'Karaoke',
  },
  {
    icon: Languages,
    title: 'Translation',
    text: 'Translation mode keeps the original beside your text.',
    extra: 'Thai: marks stay on their letters in splits, karaoke and templates.',
    guide: 'translation/translation-mode',
    more: 'Translation',
  },
  {
    icon: CheckCheck,
    title: 'Checking',
    text: 'Spell check, find and replace, and select lines by any field.',
    guide: 'checking/spelling',
    more: 'Checking',
  },
  {
    icon: Code,
    title: 'Automation',
    text: 'Your Lua and MoonScript macros run, DependencyControl included.',
    guide: 'automation/running-scripts',
    more: 'Automation',
  },
  {
    icon: FileText,
    title: 'Files and formats',
    text: 'ASS, SSA, SRT, MicroDVD and plain text, subtitles from MKV, and export to other formats.',
    guide: 'basics/files-and-formats',
    more: 'Files',
  },
];

/** What Aegisub doesn't have: the eight Q488 tiles, in order. */
const plusTiles: (Tile & { shows: string })[] = [
  {
    title: 'Projects and the Explorer',
    text: 'Open a folder as a Project: an Explorer for its files, with catalogues, fonts, scripts and settings that travel with it.',
    shows: 'The Explorer with an episode group open.',
    guide: 'basics/projects',
    more: 'Projects and the Explorer',
  },
  {
    title: 'Several windows',
    text: 'Move a tab to another window. Each window plays its own video, and a session brings every window back.',
    shows: 'Two windows on one desktop, each with its own video.',
    guide: 'customize/layouts#windows',
    more: 'Several windows',
  },
  {
    title: 'Hikari AI with every edit in review',
    text: 'The Agent and inline actions suggest edits, and each one waits in Review until you keep or undo it. One box turns all AI off.',
    shows: 'An Agent panel thread, with Review showing a kept and an undone line.',
    guide: 'ai/agent',
    more: 'Hikari AI with every edit in review',
  },
  {
    title: 'Node effects',
    text: 'Build karaoke and typesetting effects as a graph of nodes, previewed on the video, written as template lines.',
    shows: 'The node graph with its preview.',
    guide: 'karaoke/node-effects',
    more: 'Node effects',
  },
  {
    title: 'Motion and perspective tracking',
    text: 'Apply motion data and Power-Pin tracks so a sign follows the object it sits on.',
    shows: 'Motion data applied: a sign tracking a moving object.',
    guide: 'typesetting/motion-tracking',
    more: 'Motion and perspective tracking',
  },
  {
    title: 'Typesetting tools',
    text: 'Perspective, Gradient and Text on path on the video, with blur and glow layers.',
    shows: 'The Perspective tool on a sign.',
    guide: 'typesetting/visual-tools',
    more: 'Typesetting tools',
  },
  {
    title: 'Checking',
    text: 'A grammar check, every installed dictionary at once for mixed-language lines, and QC notes kept in the file.',
    shows: 'The Spellchecker panel with grammar flags.',
    guide: 'checking/grammar',
    more: 'Checking',
  },
  {
    title: 'Plugins',
    text: 'Add commands, panels and nodes from the marketplace. Each plugin is signed and asks before it reads folders or the network.',
    shows: 'The plugin manager with the Marketplace.',
    guide: 'plugins/using-plugins',
    more: 'Plugins',
  },
];

const tileClass =
  'flex h-full flex-col gap-1.5 rounded-xl border bg-fd-card p-5 text-fd-card-foreground transition-colors';

function More({ published, label }: { published: boolean; label: string }) {
  return (
    <span className="mt-auto pt-2 text-sm text-fd-primary">
      {published ? (
        <>
          {label} <ArrowRight className="inline size-3.5" />
        </>
      ) : (
        <span className="text-fd-muted-foreground">Guide coming soon</span>
      )}
    </span>
  );
}

function SectionHead({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="text-[1.375rem] font-semibold tracking-tight">{title}</h2>
      <p className="mt-1.5 mb-6 text-fd-muted-foreground">{sub}</p>
    </>
  );
}

function Home() {
  const { lang } = Route.useParams();
  const { checked, notYet } = parityCounts();

  return (
    <HomeLayout {...baseOptions(lang)}>
      <main className="mx-auto w-full max-w-[1120px] px-6">
        <section className="flex flex-col gap-10 pt-16 pb-14 md:pt-20" id="download">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-[2.5rem]">HikariSub</h1>
            <p className="mt-3.5 max-w-[680px] text-lg text-fd-muted-foreground">{pitch}</p>
            <div className="mt-7">
              <DownloadButton />
            </div>
            <GuideLink
              lang={lang}
              guide="help/whats-new"
              className="mt-3 inline-block text-sm text-fd-primary"
            >
              {(published) =>
                published && (
                  <>
                    What's new <ArrowRight className="inline size-3.5" />
                  </>
                )
              }
            </GuideLink>
          </div>
          <ShotPlaceholder
            shows="The Editing layout with a Project open: the Explorer, Grid, Line editor, the video with a typeset sign, and the audio waveform."
            caption="Editing a Project in the Editing layout."
            aspect="5 / 3"
          />
        </section>

        <section>
          <SectionHead title="Everything you do in Aegisub" sub="Each of these has a guide." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {aegisubTiles.map((tile) => (
              <GuideLink
                key={tile.title}
                lang={lang}
                guide={tile.guide}
                className="group [&>div]:hover:border-fd-primary"
              >
                {(published) => (
                  <div className={tileClass}>
                    <tile.icon className="size-5 text-fd-primary" />
                    <h3 className="font-semibold">{tile.title}</h3>
                    <p className="text-sm text-fd-muted-foreground">{tile.text}</p>
                    {tile.extra && <p className="text-sm text-fd-muted-foreground">{tile.extra}</p>}
                    <More published={published} label={tile.more} />
                  </div>
                )}
              </GuideLink>
            ))}
          </div>
          <GuideLink
            lang={lang}
            guide="get-started/coming-from-aegisub"
            className="mt-4 flex flex-col gap-1 rounded-xl border border-l-[3px] border-l-fd-primary bg-fd-secondary/50 px-5 py-3.5 text-sm hover:border-fd-primary sm:flex-row sm:items-center sm:justify-between"
          >
            {(published) => (
              <>
                <span className="text-fd-muted-foreground">
                  <strong className="font-semibold text-fd-foreground">Coming from Aegisub:</strong> what's
                  the same, what's better, and what isn't in HikariSub yet
                </span>
                <span className="font-medium text-fd-primary" data-testid="parity-band">
                  {checked} Aegisub features checked · {notYet} not yet
                  {published && <ArrowRight className="ms-1 inline size-3.5" />}
                </span>
              </>
            )}
          </GuideLink>
        </section>

        <section className="mt-14">
          <SectionHead title="Plus" sub="What Aegisub doesn't have." />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {plusTiles.map((tile) => (
              <GuideLink
                key={tile.title}
                lang={lang}
                guide={tile.guide}
                className="group [&>div]:hover:border-fd-primary"
              >
                {(published) => (
                  <div className={tileClass}>
                    <div className="-mx-1.5 -mt-1.5 mb-1">
                      <ShotPlaceholder shows={tile.shows} aspect="16 / 7" className="my-0" />
                    </div>
                    <h3 className="font-semibold">{tile.title}</h3>
                    <p className="text-sm text-fd-muted-foreground">{tile.text}</p>
                    <More published={published} label={tile.more} />
                  </div>
                )}
              </GuideLink>
            ))}
          </div>
        </section>

        <section className="mt-14 grid items-start gap-6 md:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-[1.375rem] font-semibold tracking-tight">Try a line</h2>
            <p className="mt-1.5 text-fd-muted-foreground">
              This line renders live with AkariSub, which uses libass as HikariSub does. Edit it to see the
              change.
            </p>
          </div>
          <AssPreview
            line="{\an5\pos(640,360)\t(0,1500,\frz-6\fscx115\fscy115)}Ready when you are"
            duration={3000}
            time={1500}
          />
        </section>

        <section className="my-14 flex flex-col gap-3 rounded-xl border px-6 py-5">
          <h2 className="text-[1.375rem] font-semibold tracking-tight">Free and open</h2>
          <p className="text-fd-muted-foreground">
            GPL-3.0, with no account. HikariSub says what it sends, and one box,{' '}
            <strong className="font-semibold text-fd-foreground">Turn off all AI features</strong>, switches
            the AI off everywhere.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <GuideLink lang={lang} guide="get-started/install" className="text-fd-primary">
              {() => 'Install'}
            </GuideLink>
            <GuideLink lang={lang} guide="reference/settings#updates-and-privacy" className="text-fd-primary">
              {() => 'Updates and privacy'}
            </GuideLink>
            <a href={appRepoUrl} className="text-fd-primary">
              Source on GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1120px] flex-col gap-2 border-t px-6 py-6 text-sm text-fd-muted-foreground">
        <p className="text-xs">Sprite Fright, © Blender Foundation | studio.blender.org</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <span>HikariSub is free software under the GNU GPL v3.</span>
          <span className="flex-1" />
          <a href={`${appRepoUrl}/issues/new`} className="hover:text-fd-foreground">
            Report a problem
          </a>
          <a
            href={`https://github.com/${gitConfig.user}/${gitConfig.repo}`}
            className="hover:text-fd-foreground"
          >
            Site source
          </a>
        </div>
      </footer>
    </HomeLayout>
  );
}
