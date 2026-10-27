import { describe, expect, test } from 'bun:test';
import {
  buildScript,
  defaultStyle,
  dialogueLine,
  formatAssTime,
  isAnimated,
  normalizeText,
  stillName,
  stillTime,
} from './ass-preview';

describe('formatAssTime', () => {
  test('writes H:MM:SS.cc', () => {
    expect(formatAssTime(0)).toBe('0:00:00.00');
    expect(formatAssTime(1500)).toBe('0:00:01.50');
    expect(formatAssTime(61_234)).toBe('0:01:01.23');
    expect(formatAssTime(3_600_000 + 5)).toBe('1:00:00.01');
  });

  test('clamps negative times to zero', () => {
    expect(formatAssTime(-40)).toBe('0:00:00.00');
  });
});

test('line breaks typed into the editor become \\N', () => {
  expect(normalizeText('one\ntwo\r\nthree')).toBe('one\\Ntwo\\Nthree');
});

test('the copied line lasts the given duration in the given style', () => {
  expect(dialogueLine({ text: '{\\b1}Hi', duration: 3000 })).toBe(
    'Dialogue: 0,0:00:00.00,0:00:03.00,Default,,0,0,0,,{\\b1}Hi',
  );
  expect(dialogueLine({ text: 'Hi', style: 'Sign', duration: 1000 })).toContain(',Sign,,');
});

describe('buildScript', () => {
  test('uses a 1280x720 script with the built-in Default style', () => {
    const script = buildScript({ text: 'Hi', duration: 1000 });
    expect(script).toContain('PlayResX: 1280\nPlayResY: 720');
    expect(script).toContain(defaultStyle);
    expect(script).toContain('\nDialogue: 0,0:00:00.00,0:00:01.00,Default,,0,0,0,,Hi\n');
  });

  test('adds extra styles and lets one named Default replace the built-in one', () => {
    const sign =
      'Style: Sign,K2D Bold,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,5,0,0,0,1';
    const extra = buildScript({ text: 'Hi', styles: sign, style: 'Sign', duration: 1000 });
    expect(extra).toContain(defaultStyle);
    expect(extra).toContain(sign);

    const replacement = sign.replace('Sign', 'Default');
    const replaced = buildScript({ text: 'Hi', styles: `  ${replacement}\nnot a style`, duration: 1000 });
    expect(replaced).not.toContain(defaultStyle);
    expect(replaced).toContain(replacement);
    expect(replaced).not.toContain('not a style');
  });
});

describe('isAnimated', () => {
  test.each([
    '{\\t(0,500,\\frz10)}Hi',
    '{\\move(0,0,10,10)}Hi',
    '{\\fad(200,200)}Hi',
    '{\\fade(255,0,255,0,100,200,300)}Hi',
    '{\\k20}Ka{\\kf30}ra{\\ko10}o{\\K5}ke',
  ])('%s changes over time', (text) => {
    expect(isAnimated(text)).toBe(true);
  });

  test.each(['Hi', '{\\pos(640,360)\\b1}Hi', '{\\fscx120\\frz5}Hi'])('%s does not', (text) => {
    expect(isAnimated(text)).toBe(false);
  });
});

test('a still shows the given time, else the middle of an animated line', () => {
  expect(stillTime('{\\t(\\frz5)}Hi', 3000)).toBe(1500);
  expect(stillTime('Hi', 3000)).toBe(0);
  expect(stillTime('Hi', 3000, 1200)).toBe(1200);
  expect(stillTime('Hi', 3000, 9000)).toBe(3000);
});

describe('stillName', () => {
  const input = { text: 'Hi', duration: 1000, frame: 'bridge', time: 0 } as const;

  test('is a stable hex file name', () => {
    expect(stillName(input)).toMatch(/^[0-9a-f]{8}\.webp$/);
    expect(stillName(input)).toBe(stillName({ ...input }));
  });

  test('changes with anything that changes the picture', () => {
    const name = stillName(input);
    expect(stillName({ ...input, text: 'Ho' })).not.toBe(name);
    expect(stillName({ ...input, frame: 'night' })).not.toBe(name);
    expect(stillName({ ...input, time: 500 })).not.toBe(name);
    expect(stillName({ ...input, duration: 2000 })).not.toBe(name);
  });
});
