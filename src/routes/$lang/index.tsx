import { createFileRoute } from '@tanstack/react-router';
import { HomeLayout } from 'fumadocs-ui/layouts/home';
import {
  ArrowRight,
  AudioWaveform,
  CheckCheck,
  Code,
  Languages,
  LayoutPanelLeft,
  type LucideIcon,
  Type,
} from 'lucide-react';
import heroDark from '@/assets/home/hero-dark.webp';
import heroLight from '@/assets/home/hero-light.webp';
import karaokeDark from '@/assets/home/karaoke-dark.webp';
import karaokeLight from '@/assets/home/karaoke-light.webp';
import typesettingDark from '@/assets/home/typesetting-dark.webp';
import typesettingLight from '@/assets/home/typesetting-light.webp';
import { DownloadButton } from '@/components/download-button';
import { GuideLink } from '@/components/guide-link';
import { ThemedImage } from '@/components/themed-image';
import { baseOptions } from '@/lib/layout.shared';
import { appRepoUrl, gitConfig } from '@/lib/shared';

export const Route = createFileRoute('/$lang/')({
  component: Home,
});

interface Feature {
  title: string;
  text: string;
  guide: string;
  more: string;
}

const wideFeatures: (Feature & { image: { light: string; dark: string; alt: string } })[] = [
  {
    title: 'Typesetting',
    text: 'Visual tools on the video for position, rotation, scaling, clips, drawing and perspective, with the exact values beside them.',
    guide: 'typesetting/visual-tools',
    more: 'Visual tools',
    image: {
      light: typesettingLight,
      dark: typesettingDark,
      alt: 'The Perspective tool fitting a Thai sign to a slope in the video.',
    },
  },
  {
    title: 'Karaoke',
    text: 'Split and join syllables, tap to time, the Kanji timer and onset snap, then the templater for effects.',
    guide: 'karaoke/split-and-join',
    more: 'Karaoke',
    image: {
      light: karaokeLight,
      dark: karaokeDark,
      alt: 'Karaoke syllables over the audio waveform, each timed to its sound.',
    },
  },
];

const features: (Feature & { icon: LucideIcon; wide?: boolean })[] = [
  {
    icon: AudioWaveform,
    title: 'Timing',
    text: 'Audio with waveform or spectrum, keyframe snapping, time shifting and a post-processor.',
    guide: 'basics/timing',
    more: 'Timing',
  },
  {
    icon: Type,
    title: 'Styles',
    text: 'A style manager with a live preview, reusable style catalogs and font catalogs.',
    guide: 'basics/styles',
    more: 'Styles',
  },
  {
    icon: Languages,
    title: 'Translation',
    text: 'Translation mode shows the original next to your text, and lines can be matched when pasting a translation.',
    guide: 'translation/translation-mode',
    more: 'Translation',
  },
  {
    icon: CheckCheck,
    title: 'Checking',
    text: 'Spelling, minor-error fixes and side-by-side comparison of two files.',
    guide: 'checking/spelling',
    more: 'Checking',
  },
  {
    icon: Code,
    title: 'Automation',
    text: 'Lua and MoonScript macros, the Automation panel and DependencyControl.',
    guide: 'automation/running-scripts',
    more: 'Automation',
    wide: true,
  },
  {
    icon: LayoutPanelLeft,
    title: 'Your workspace',
    text: 'Layouts for each kind of work, themes and every hotkey remappable.',
    guide: 'customize/layouts',
    more: 'Customize',
    wide: true,
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

function Home() {
  const { lang } = Route.useParams();

  return (
    <HomeLayout {...baseOptions(lang)}>
      <main className="mx-auto w-full max-w-[1120px] px-6">
        <section className="flex flex-col gap-10 pt-16 pb-14 md:pt-20" id="download">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-[2.5rem]">HikariSub</h1>
            <p className="mt-3.5 max-w-[620px] text-lg text-fd-muted-foreground">
              A subtitle editor and player for everything from quick fixes to full typesetting. ASS, SRT and
              other formats, with frame-accurate video, for Windows and Linux.
            </p>
            <div className="mt-7">
              <DownloadButton />
            </div>
          </div>
          <figure>
            <div className="overflow-hidden rounded-xl border bg-fd-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_rgb(0_0_0/0.06)]">
              <ThemedImage
                light={heroLight}
                dark={heroDark}
                width={1600}
                height={960}
                className="h-auto w-full"
                alt="HikariSub editing a karaoke MV: the video with the typeset karaoke, the audio waveform with its syllables, the Line editor and the Grid."
              />
            </div>
            <figcaption className="mt-2.5 text-xs text-fd-muted-foreground">
              Timing a karaoke MV in the Editing layout. Subtitles: Jibrill.
            </figcaption>
          </figure>
        </section>

        <section>
          <h2 className="text-[1.375rem] font-semibold tracking-tight">What it does</h2>
          <p className="mt-1.5 mb-6 text-fd-muted-foreground">Each of these has a guide.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {wideFeatures.map((feature) => (
              <GuideLink
                key={feature.title}
                lang={lang}
                guide={feature.guide}
                className="group sm:col-span-2 [&>div]:hover:border-fd-primary"
              >
                {(published) => (
                  <div className={tileClass}>
                    <div className="-mx-1.5 -mt-1.5 mb-2 overflow-hidden rounded-md">
                      <ThemedImage
                        light={feature.image.light}
                        dark={feature.image.dark}
                        alt={feature.image.alt}
                        width={800}
                        height={350}
                        loading="lazy"
                        className="aspect-[16/7] w-full object-cover"
                      />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-fd-muted-foreground">{feature.text}</p>
                    <More published={published} label={feature.more} />
                  </div>
                )}
              </GuideLink>
            ))}
            {features.map((feature) => (
              <GuideLink
                key={feature.title}
                lang={lang}
                guide={feature.guide}
                className={`group ${feature.wide ? 'sm:col-span-2' : ''} [&>div]:hover:border-fd-primary`}
              >
                {(published) => (
                  <div className={tileClass}>
                    <feature.icon className="size-5 text-fd-primary" />
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-fd-muted-foreground">{feature.text}</p>
                    <More published={published} label={feature.more} />
                  </div>
                )}
              </GuideLink>
            ))}
          </div>
          <p className="mt-3 text-xs text-fd-muted-foreground">Subtitles: Jibrill.</p>
        </section>

        <section className="my-14 flex flex-col gap-4 rounded-xl border border-l-[3px] border-l-fd-primary bg-fd-secondary/50 px-6 py-5 sm:flex-row sm:items-center sm:gap-6">
          <p className="flex-1 text-fd-muted-foreground">
            <strong className="font-semibold text-fd-foreground">Used HikariSub 0.0.x?</strong> 0.1 is a new
            app. It reads your old settings and keeps its own, so you can go back to 0.0.x and find everything
            as you left it.
          </p>
          <GuideLink lang={lang} guide="get-started/moving-from-legacy">
            {(published) =>
              published ? (
                <span className="inline-flex rounded-lg border bg-fd-card px-4 py-2 text-sm font-medium">
                  Moving from legacy
                </span>
              ) : (
                <span className="text-sm text-fd-muted-foreground">Guide coming soon</span>
              )
            }
          </GuideLink>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-[1120px] flex-wrap gap-x-6 gap-y-2 border-t px-6 py-6 text-sm text-fd-muted-foreground">
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
      </footer>
    </HomeLayout>
  );
}
