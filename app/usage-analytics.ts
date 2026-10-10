import {inject, track as vercelTrack} from '@vercel/analytics';
import {LESSONS, REGIONS} from './training';
import {BEGINNER_FULL_BODY_ROUTINE} from './routine';
import {PRACTICE_PATTERNS} from './practice-patterns';

/**
 * First-party usage events for massage practice. Page views come from Vercel Web
 * Analytics. Custom events carry only allowlisted ids — never names, search text,
 * discomfort answers, or session replay.
 */
export const USAGE_EVENTS = [
 'atlas_ready',
 'region_opened',
 'lesson_opened',
 'guided_mode_started',
 'routine_step_completed',
 'routine_completed',
 'discomfort_completed',
 'pattern_started',
 'pwa_installed',
] as const;

export type UsageEventName = (typeof USAGE_EVENTS)[number];

export type GuidedModeId = 'routine' | 'discomfort' | 'names' | 'hands';

const USAGE_EVENT_SET = new Set<string>(USAGE_EVENTS);
const REGION_IDS = new Set<string>(REGIONS.map(region => region.id));
const LESSON_IDS = new Set<string>(LESSONS.map(lesson => lesson.id));
const STEP_IDS = new Set(BEGINNER_FULL_BODY_ROUTINE.steps.map(step => step.id));
const GUIDED_MODES = new Set<string>(['routine', 'discomfort', 'names', 'hands']);
const PATTERN_IDS = new Set<string>(PRACTICE_PATTERNS.map(pattern => pattern.id));
const ALLOWED_KEYS = new Set(['regionId', 'lessonId', 'mode', 'stepId', 'patternId']);
const SAFE_ID = /^[a-z0-9-]{1,64}$/;

type UsageProperties = Record<string, string>;

let pwaInstallTracked = false;

function isSafeId(value: unknown): value is string {
 return typeof value === 'string' && SAFE_ID.test(value);
}

export function sanitizeUsageProperties(properties?: Record<string, unknown>): UsageProperties | undefined {
 if (!properties) return undefined;
 const clean: UsageProperties = {};
 for (const [key, value] of Object.entries(properties)) {
  if (!ALLOWED_KEYS.has(key) || !isSafeId(value)) continue;
  if (key === 'regionId' && !REGION_IDS.has(value)) continue;
  if (key === 'lessonId' && !LESSON_IDS.has(value)) continue;
  if (key === 'stepId' && !STEP_IDS.has(value)) continue;
  if (key === 'mode' && !GUIDED_MODES.has(value)) continue;
  if (key === 'patternId' && !PATTERN_IDS.has(value)) continue;
  clean[key] = value;
 }
 return Object.keys(clean).length ? clean : undefined;
}

function stripUsageUrl(url: string) {
 try {
  const parsed = new URL(url, 'https://atlas.humanai.solutions');
  return `${parsed.origin}${parsed.pathname}`;
 } catch (error) {
  console.warn('Usage analytics could not read a page URL.', error);
  return url.split('?')[0]?.split('#')[0] ?? '/';
 }
}

export function trackUsage(name: UsageEventName, properties?: Record<string, unknown>) {
 if (!USAGE_EVENT_SET.has(name)) {
  console.warn('Blocked unknown usage event.');
  return;
 }
 try {
  vercelTrack(name, sanitizeUsageProperties(properties));
 } catch (error) {
  console.warn('Usage event could not be sent.', error);
 }
}

export function trackPwaInstalled() {
 if (pwaInstallTracked) return;
 pwaInstallTracked = true;
 trackUsage('pwa_installed');
}

export function listenForPwaInstall() {
 if (typeof window === 'undefined') return;
 window.addEventListener('appinstalled', trackPwaInstalled);
}

export function startUsageAnalytics() {
 try {
  inject({
   beforeSend(event) {
    return {...event, url: stripUsageUrl(event.url)};
   },
  });
 } catch (error) {
  console.warn('Usage analytics could not start.', error);
 }
 listenForPwaInstall();
}

export function resetUsageAnalyticsForTests() {
 pwaInstallTracked = false;
}
