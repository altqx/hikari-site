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
import aiReviewDark from '@/assets/home/ai-review-dark.webp';
import aiReviewLight from '@/assets/home/ai-review-light.webp';
import checkingDark from '@/assets/home/checking-dark.webp';
import checkingLight from '@/assets/home/checking-light.webp';
import heroDark from '@/assets/home/hero-dark.webp';
import heroLight from '@/assets/home/hero-light.webp';
import motionTrackingDark from '@/assets/home/motion-tracking-dark.webp';
import motionTrackingLight from '@/assets/home/motion-tracking-light.webp';
import nodeEffectsDark from '@/assets/home/node-effects-dark.webp';
import nodeEffectsLight from '@/assets/home/node-effects-light.webp';
import pluginsDark from '@/assets/home/plugins-dark.webp';
import pluginsLight from '@/assets/home/plugins-light.webp';
import projectsDark from '@/assets/home/projects-dark.webp';
import projectsLight from '@/assets/home/projects-light.webp';
import typesettingDark from '@/assets/home/typesetting-dark.webp';
import typesettingLight from '@/assets/home/typesetting-light.webp';
import windowsDark from '@/assets/home/windows-dark.webp';
import windowsLight from '@/assets/home/windows-light.webp';
import { parityCounts } from '@/components/aegisub-parity';
import { AssPreview } from '@/components/ass-preview';
import { DownloadButton } from '@/components/download-button';
import { GuideLink } from '@/components/guide-link';
import { PageCredits } from '@/components/page-credits';
import { ThemedImage } from '@/components/themed-image';
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
const plusTiles: (Tile & { image: { light: string; dark: string; alt: string } })[] = [
  {
    title: 'Projects and the Explorer',
    text: 'Open a folder as a Project: an Explorer for its files, with catalogues, fonts, scripts and settings that travel with it.',
    image: {
      light: projectsLight,
      dark: projectsDark,
      alt: "The Explorer beside the Grid on a Sprite Fright frame: the Project's settings, its fonts folder and two subtitle files, with Sprite Fright.ass open to show its video and keyframes.",
    },
    guide: 'basics/projects',
    more: 'Projects and the Explorer',
  },
  {
    title: 'Several windows',
    text: 'Move a tab to another window. Each window plays its own video, and a session brings every window back.',
    image: {
      light: windowsLight,
      dark: windowsDark,
      alt: 'Two HikariSub windows on one desktop: Sprite Fright.ass in the Editing layout, and Sprite Fright signs.ass in the Typesetting layout with its sign "Brambleden Woods", each on its own frame of the video.',
    },
    guide: 'customize/layouts#windows',
    more: 'Several windows',
  },
  {
    title: 'Hikari AI with every edit in review',
    text: 'The Agent and inline actions suggest edits, and each one waits in Review until you keep or undo it. One box turns all AI off.',
    image: {
      light: aiReviewLight,
      dark: aiReviewDark,
      alt: "An Agent thread asked to shorten the long lines around 1:15: line 3's edit is kept, line 4's is undone, and line 5's still waits in the Review panel.",
    },
    guide: 'ai/agent',
    more: 'Hikari AI with every edit in review',
  },
  {
    title: 'Node effects',
    text: 'Build karaoke and typesetting effects as a graph of nodes, previewed on the video, written as template lines.',
    image: {
      light: nodeEffectsLight,
      dark: nodeEffectsDark,
      alt: 'Node effects with the Falling letters preset on a karaoke line: its graph of 19 nodes and 29 wires, the preview on the video, and the template lines it writes below.',
    },
    guide: 'karaoke/node-effects',
    more: 'Node effects',
  },
  {
    title: 'Motion and perspective tracking',
    text: 'Apply motion data and Power-Pin tracks so a sign follows the object it sits on.',
    image: {
      light: motionTrackingLight,
      dark: motionTrackingDark,
      alt: 'A Sprite Fright frame with the sign "Sporeling" placed above a walking mushroom, with the visual typesetting tools down the left.',
    },
    guide: 'typesetting/motion-tracking',
    more: 'Motion and perspective tracking',
  },
  {
    title: 'Typesetting tools',
    text: 'Perspective, Gradient and Text on path on the video, with blur and glow layers.',
    image: {
      light: typesettingLight,
      dark: typesettingDark,
      alt: 'The Perspective tool on a Sprite Fright frame: the sign line "Brambleden Woods" turned in 3D inside the tool\'s quad, with its Plane, Origin and Rotation options below the video.',
    },
    guide: 'typesetting/visual-tools',
    more: 'Typesetting tools',
  },
  {
    title: 'Checking',
    text: 'A grammar check, every installed dictionary at once for mixed-language lines, and QC notes kept in the file.',
    image: {
      light: checkingLight,
      dark: checkingDark,
      alt: 'The Spellchecker panel on its Grammar tab: finding 1 of 6 says to use "have" rather than "of" in "We should of brought more marshmallows.", with "should have" to replace it.',
    },
    guide: 'checking/grammar',
    more: 'Checking',
  },
  {
    title: 'Plugins',
    text: 'Add commands, panels and nodes from the marketplace. Each plugin is signed and asks before it reads folders or the network.',
    image: {
      light: pluginsLight,
      dark: pluginsDark,
      alt: "The plugin manager's Marketplace tab listing Git line marks, Keyframe generator and Macro chains. Macro chains 1.0.1 is selected: By HikariSub, what it does, its permissions, what's new, and the Needs, Licence and Updated rows, with an Install button.",
    },
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
          <figure>
            <div className="overflow-hidden rounded-xl border bg-fd-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)]">
              <ThemedImage
                light={heroLight}
                dark={heroDark}
                width={1600}
                height={960}
                className="h-auto w-full"
                alt="HikariSub in the Editing layout on a Sprite Fright frame: the video with the line Finally! Time to get that barbecue burning., the audio waveform and the Line editor on the right, and the Grid along the bottom with that line selected."
              />
            </div>
            <figcaption className="mt-2.5 text-xs text-fd-muted-foreground">The Editing layout.</figcaption>
          </figure>
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
                    <div className="-mx-1.5 -mt-1.5 mb-1 overflow-hidden rounded-md">
                      <ThemedImage
                        light={tile.image.light}
                        dark={tile.image.dark}
                        alt={tile.image.alt}
                        width={1200}
                        height={502}
                        loading="lazy"
                        className="aspect-[1200/502] w-full object-cover"
                      />
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
        <PageCredits commons jibrill="node effects" />
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
