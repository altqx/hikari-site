// The pure part of <AssPreview>: the script AkariSub renders, the line "Copy line"
// copies, and the key of the static image shown with reduced motion or without WASM.

export const playRes = { x: 1280, y: 720 };

/** Sprite Fright (Blender Studio, 2021, CC BY 4.0) frames in public/previews/, by name. */
export const frames = {
  bridge: { src: '/previews/sprite-fright-50.webp', at: '0:50' },
  ellie: { src: '/previews/sprite-fright-150.webp', at: '2:30' },
  sprites: { src: '/previews/sprite-fright-175.webp', at: '2:55' },
  night: { src: '/previews/sprite-fright-440.webp', at: '7:20' },
} as const;
export type FrameName = keyof typeof frames;

/** OFL fonts in public/fonts/, by the family names lines can use. */
export const fontFiles = {
  k2d: ['/fonts/k2d/K2D-Regular.ttf', '/fonts/k2d/K2D-SemiBold.ttf', '/fonts/k2d/K2D-Bold.ttf'],
  'fira sans': ['/fonts/fira-sans/FiraSans-SemiBold-latin.ttf', '/fonts/fira-sans/FiraSans-Bold-latin.ttf'],
};

export const defaultStyle =
  'Style: Default,K2D SemiBold,64,&H00FFFFFF,&H000000FF,&H00141414,&H80000000,0,0,0,0,100,100,0,0,1,3,1.5,2,60,60,48,1';

const styleFormat =
  'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding';
const eventFormat = 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text';

export interface PreviewInput {
  /** The event text: override tags and text, one line (line breaks become \N). */
  text: string;
  /** Extra or replacement Style: lines. A style named Default replaces the built-in one. */
  styles?: string;
  /** The style the event uses. */
  style?: string;
  /** How long the event lasts, in milliseconds. */
  duration: number;
}

/** Text typed into the editor, as one ASS event text. */
export function normalizeText(text: string) {
  return text.replace(/\r?\n/g, '\\N');
}

/** ASS time, H:MM:SS.cc. */
export function formatAssTime(ms: number) {
  const cs = Math.max(0, Math.round(ms / 10));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  const c = cs % 100;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${h}:${pad(m)}:${pad(s)}.${pad(c)}`;
}

function styleLines(styles?: string) {
  const extra = (styles ?? '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('Style:'));
  const replacesDefault = extra.some((line) => /^Style:\s*Default\s*,/.test(line));
  return replacesDefault ? extra : [defaultStyle, ...extra];
}

/** The Dialogue line "Copy line" puts on the clipboard. */
export function dialogueLine({ text, style = 'Default', duration }: PreviewInput) {
  return `Dialogue: 0,${formatAssTime(0)},${formatAssTime(duration)},${style},,0,0,0,,${normalizeText(text)}`;
}

/** The whole script AkariSub renders. */
export function buildScript(input: PreviewInput) {
  return [
    '[Script Info]',
    'ScriptType: v4.00+',
    `PlayResX: ${playRes.x}`,
    `PlayResY: ${playRes.y}`,
    'WrapStyle: 0',
    'ScaledBorderAndShadow: yes',
    'YCbCr Matrix: None',
    '',
    '[V4+ Styles]',
    styleFormat,
    ...styleLines(input.styles),
    '',
    '[Events]',
    eventFormat,
    dialogueLine(input),
    '',
  ].join('\n');
}

/** Whether the line changes over time, so the preview gets a time slider and play. */
export function isAnimated(text: string) {
  return /\\(t\(|move\(|fade?\(|k[fo]?\d|K\d)/i.test(text);
}

/** The time a still of the line shows: given, or the middle of an animated line. */
export function stillTime(text: string, duration: number, time?: number) {
  if (time !== undefined) return Math.min(Math.max(time, 0), duration);
  return isAnimated(text) ? Math.round(duration / 2) : 0;
}

/** FNV-1a, 32 bits, as 8 hex digits. */
function fnv1a(text: string) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * The file name of a preview's static image (public/previews/still/), the same at build
 * time and in the browser. It changes with anything that changes the picture.
 */
export function stillName(input: PreviewInput & { frame: FrameName; time: number }) {
  return `${fnv1a(JSON.stringify([buildScript(input), input.frame, input.time]))}.webp`;
}
