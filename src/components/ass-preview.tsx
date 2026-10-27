import { Check, Copy, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  buildScript,
  dialogueLine,
  type FrameName,
  fontFiles,
  formatAssTime,
  frames,
  isAnimated,
  normalizeText,
  stillName,
  stillTime,
} from '@/lib/ass-preview';

type AkariSub = import('akarisub').default;

export interface AssPreviewProps {
  /** The event text: override tags and text. */
  line: string;
  /** Extra Style: lines; one named Default replaces the built-in style. */
  styles?: string;
  /** The style the line uses (default Default). */
  style?: string;
  /** The line's duration in milliseconds (default 4000). */
  duration?: number;
  /** The time the still shows, in milliseconds (default: the middle of an animated line, else 0). */
  time?: number;
  /** The Sprite Fright frame behind the line. */
  frame?: FrameName;
}

type State = 'waiting' | 'loading' | 'live' | 'still';

function prefersStill() {
  return (
    typeof WebAssembly === 'undefined' ||
    (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)
  );
}

/** Renders an ASS line live with AkariSub, beside the editable line. */
export function AssPreview({
  line,
  styles,
  style,
  duration = 4000,
  time,
  frame = 'bridge',
}: AssPreviewProps) {
  const id = useId();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<AkariSub | null>(null);
  const [text, setText] = useState(line);
  const [state, setState] = useState<State>('waiting');
  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState(() => stillTime(line, duration, time));
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  // The effects below read the current time and play state when they start, not on change.
  const nowRef = useRef(now);
  nowRef.current = now;
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const animated = isAnimated(text);
  const input = useMemo(() => ({ text, styles, style, duration }), [text, styles, style, duration]);
  // Edits made while AkariSub loads reach the renderer when it is created.
  const inputRef = useRef(input);
  inputRef.current = input;
  const still = `/previews/still/${stillName({ text: line, styles, style, duration, frame, time: stillTime(line, duration, time) })}`;

  // Start AkariSub the first time the preview scrolls into view; keep track of visibility
  // so playback pauses off screen.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '200px',
    });
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || state !== 'waiting') return;
    if (prefersStill()) {
      setState('still');
      return;
    }
    setState('loading');
  }, [visible, state]);

  const started = state === 'loading' || state === 'live';

  // biome-ignore lint/correctness/useExhaustiveDependencies: created once; later edits go through setTrack
  useEffect(() => {
    if (!started) return;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;

    const size = () => {
      const rect = stage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      return { width: Math.round(rect.width * ratio), height: Math.round(rect.height * ratio) };
    };

    import('akarisub')
      .then(({ default: AkariSub }) => {
        if (cancelled) return;
        const { width, height } = size();
        canvas.width = width;
        canvas.height = height;
        const renderer = new AkariSub({
          canvas,
          subContent: buildScript(inputRef.current),
          onDemandRender: false,
          useLocalFonts: false,
          fonts: Object.values(fontFiles).flat(),
          availableFonts: { k2d: fontFiles.k2d[1], 'fira sans': fontFiles['fira sans'][0] },
          fallbackFonts: ['k2d'],
          onRender: () => {
            if (!cancelled) setState((current) => (current === 'loading' ? 'live' : current));
          },
        });
        rendererRef.current = renderer;
        renderer.setCurrentTime(true, nowRef.current / 1000);
        resizeObserver = new ResizeObserver(() => {
          const next = size();
          renderer.resize(next.width, next.height);
        });
        resizeObserver.observe(stage);
      })
      .catch(() => {
        if (!cancelled) setState('still');
      });

    // WASM that never renders counts as failed.
    const timeout = setTimeout(() => {
      if (!cancelled) setState((current) => (current === 'loading' ? 'still' : current));
    }, 15000);

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      resizeObserver?.disconnect();
      rendererRef.current?.destroy();
      rendererRef.current = null;
    };
  }, [started]);

  // Edits re-render after a short pause in typing.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    const timer = setTimeout(() => {
      renderer.setTrack(buildScript(input));
      renderer.setCurrentTime(!playingRef.current, nowRef.current / 1000);
    }, 150);
    return () => clearTimeout(timer);
  }, [input]);

  // Playback loops over the line's duration, and runs only while the preview is on screen.
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer || state !== 'live') return;
    if (!playing || !visible) {
      renderer.setCurrentTime(true, nowRef.current / 1000);
      return;
    }
    let frameId = 0;
    let last = performance.now();
    let position = nowRef.current;
    const tick = (stamp: number) => {
      position = (position + (stamp - last)) % duration;
      last = stamp;
      renderer.setCurrentTime(false, position / 1000);
      setNow(Math.round(position));
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [playing, visible, state, duration]);

  const seek = useCallback((ms: number) => {
    setPlaying(false);
    setNow(ms);
    rendererRef.current?.setCurrentTime(true, ms / 1000);
  }, []);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(dialogueLine(input));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [input]);

  return (
    <figure
      className="not-prose my-6 overflow-hidden rounded-xl border bg-fd-card"
      data-ass-preview={state}
      data-still={still}
    >
      <div
        ref={stageRef}
        className="relative aspect-video overflow-hidden bg-linear-to-br from-[#6f8f55] via-[#3b5a3a] to-[#1f2d22]"
      >
        <img
          src={frames[frame].src}
          alt=""
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
          width={1280}
          height={720}
        />
        {started && (
          <canvas ref={canvasRef} className="absolute inset-0 size-full" data-testid="ass-preview-canvas" />
        )}
        {state === 'still' && (
          <img
            src={still}
            alt={`The line rendered: ${line}`}
            className="absolute inset-0 size-full object-cover"
            width={1280}
            height={720}
          />
        )}
      </div>

      {animated && (
        <div className="flex items-center gap-3 border-t px-3 py-2 text-xs text-fd-muted-foreground">
          <button
            type="button"
            className="grid size-7 place-items-center rounded-md border disabled:opacity-50"
            onClick={() => setPlaying((value) => !value)}
            disabled={state !== 'live'}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <input
            type="range"
            min={0}
            max={duration}
            step={10}
            value={now}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={state !== 'live'}
            className="flex-1 accent-fd-primary"
            aria-label="Time"
          />
          <span className="font-mono tabular-nums">{formatAssTime(now)}</span>
        </div>
      )}

      <div className="flex items-stretch border-t">
        <label htmlFor={id} className="sr-only">
          ASS line
        </label>
        <textarea
          id={id}
          value={text}
          onChange={(event) => setText(normalizeText(event.target.value))}
          readOnly={state === 'still'}
          spellCheck={false}
          rows={1}
          className="min-h-11 flex-1 resize-none bg-fd-secondary/50 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-fd-foreground outline-none [field-sizing:content]"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 border-l px-3.5 text-sm font-medium"
          title="Copies the whole Dialogue line"
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
          {copied ? 'Copied' : 'Copy line'}
        </button>
      </div>

      <figcaption className="border-t px-3 py-1.5 text-xs text-fd-muted-foreground">
        Frame: <i>Sprite Fright</i> ({frames[frame].at}), © Blender Foundation, studio.blender.org, CC BY 4.0
        {state === 'still' && ' · a still: live previews need WebAssembly and are off with reduced motion'}
      </figcaption>
    </figure>
  );
}
