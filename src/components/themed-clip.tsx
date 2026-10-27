import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/** One theme's clip: an AV1 MP4, its H.264 fallback, and the still shown before it plays. */
export interface ClipFiles {
  av1: string;
  h264: string;
  poster: string;
}

// Main profile, level 3.0, 8-bit AV1 and High 4.0 H.264, as the clips are encoded.
const av1Type = 'video/mp4; codecs="av01.0.04M.08"';
const h264Type = 'video/mp4; codecs="avc1.640028"';

/**
 * A muted, looping light and dark clip; the one matching the site theme shows. It plays while
 * on screen and pauses off screen. With reduced motion it shows its still until Play is pressed.
 */
export function ThemedClip({
  light,
  dark,
  label,
  width,
  height,
}: {
  light: ClipFiles;
  dark: ClipFiles;
  /** What the clip shows, read out in place of the video. */
  label: string;
  width: number;
  height: number;
}) {
  return (
    <div className="not-prose my-6">
      <Clip {...light} label={label} width={width} height={height} className="dark:hidden" />
      <Clip {...dark} label={label} width={width} height={height} className="hidden dark:block" />
    </div>
  );
}

function Clip({
  av1,
  h264,
  poster,
  label,
  width,
  height,
  className,
}: ClipFiles & { label: string; width: number; height: number; className: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  // The reader's own Play or Pause wins over the default for the motion setting.
  const [choice, setChoice] = useState<'play' | 'pause' | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  // The clip of the other theme is display: none, so it never counts as on screen.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const wanted = choice ?? (reducedMotion ? 'pause' : 'play');
  const shouldPlay = visible && wanted === 'play';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldPlay) {
      video.muted = true;
      // A browser that can play neither source rejects; the still stays.
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [shouldPlay]);

  return (
    <div className={`relative ${className}`} data-clip={playing ? 'playing' : 'paused'}>
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        poster={poster}
        width={width}
        height={height}
        aria-label={label}
        className="h-auto w-full rounded-lg border"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        <source src={av1} type={av1Type} />
        <source src={h264} type={h264Type} />
      </video>
      <button
        type="button"
        className="absolute top-2 right-2 grid size-8 place-items-center rounded-md border bg-fd-background/80 text-fd-foreground backdrop-blur-sm"
        onClick={() => setChoice(playing ? 'pause' : 'play')}
        aria-label={playing ? 'Pause clip' : 'Play clip'}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
      </button>
    </div>
  );
}
