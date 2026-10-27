import data from '@/generated/downloads.json';
import type { Downloads } from './downloads';

// Written at build time by scripts/fetch-downloads.ts.
export const downloads = data as Downloads;
