import {readFileSync} from 'node:fs';
import {afterEach, describe, expect, it, vi} from 'vitest';

vi.mock('@vercel/analytics', () => ({
 inject: vi.fn(),
 track: vi.fn(),
}));

import {inject, track} from '@vercel/analytics';
import {QUALITY_OPTIONS, SAFETY_OPTIONS} from './discomfort-data';
import {LESSONS, REGIONS} from './training';
import {BEGINNER_FULL_BODY_ROUTINE} from './routine';
import {
 resetUsageAnalyticsForTests,
 sanitizeUsageProperties,
 startUsageAnalytics,
 trackPwaInstalled,
 trackUsage,
 USAGE_EVENTS,
} from './usage-analytics';

const send = vi.mocked(track);
const injectAnalytics = vi.mocked(inject);

afterEach(() => {
 send.mockReset();
 injectAnalytics.mockReset();
 resetUsageAnalyticsForTests();
});

describe('usage analytics privacy filter', () => {
 it('keeps only allowlisted training ids', () => {
  expect(sanitizeUsageProperties({
   regionId: 'back',
   lessonId: 'lats',
   mode: 'hands',
   stepId: 'prepare',
   patternId: 'scooter',
   qualities: ['tight', 'burning'],
   flags: ['recent-injury'],
   query: 'traps',
   name: 'Jane',
   answer: 'sharp pain on the left',
  })).toEqual({
   regionId: 'back',
   lessonId: 'lats',
   mode: 'hands',
   stepId: 'prepare',
   patternId: 'scooter',
  });
 });

 it('drops unknown ids and free text', () => {
  expect(sanitizeUsageProperties({
   regionId: 'kidney',
   lessonId: 'diagnose-pain',
   mode: 'replay',
   stepId: 'secret',
   patternId: 'diagnose-pain',
   note: 'client said it hurts',
  })).toBeUndefined();
 });

 it('sends atlas ready without properties', () => {
  trackUsage('atlas_ready');
  expect(send).toHaveBeenCalledWith('atlas_ready', undefined);
 });

 it('sends region, lesson, guided mode, and routine step ids only', () => {
  trackUsage('region_opened', {regionId: REGIONS[0].id, qualities: ['tight']});
  trackUsage('lesson_opened', {lessonId: LESSONS[0].id, title: LESSONS[0].title});
  trackUsage('guided_mode_started', {mode: 'discomfort', flags: ['fever-unwell']});
  trackUsage('routine_step_completed', {stepId: BEGINNER_FULL_BODY_ROUTINE.steps[1].id});
  expect(send.mock.calls).toEqual([
   ['region_opened', {regionId: REGIONS[0].id}],
   ['lesson_opened', {lessonId: LESSONS[0].id}],
   ['guided_mode_started', {mode: 'discomfort'}],
   ['routine_step_completed', {stepId: 'back'}],
  ]);
 });

 it('never forwards discomfort vocabulary as event properties', () => {
  const leaked = [...QUALITY_OPTIONS.map(item => item.id), ...SAFETY_OPTIONS.map(item => item.id)];
  trackUsage('discomfort_completed', {
   qualities: leaked,
   flags: leaked,
   region: 'back',
   message: 'refer out',
  });
  expect(send).toHaveBeenCalledWith('discomfort_completed', undefined);
  const payload = JSON.stringify(send.mock.calls);
  for (const token of leaked) {
   expect(payload).not.toContain(token);
  }
 });

 it('records a PWA install once', () => {
  trackPwaInstalled();
  trackPwaInstalled();
  expect(send).toHaveBeenCalledTimes(1);
  expect(send).toHaveBeenCalledWith('pwa_installed', undefined);
 });

 it('injects analytics without attaching query strings', () => {
  startUsageAnalytics();
  expect(injectAnalytics).toHaveBeenCalledTimes(1);
  const options = injectAnalytics.mock.calls[0]?.[0];
  const sanitized = options?.beforeSend?.({type: 'pageview', url: 'https://atlas.humanai.solutions/?q=sharp-pain#replay'});
  expect(sanitized).toEqual({type: 'pageview', url: 'https://atlas.humanai.solutions/'});
  expect(USAGE_EVENTS).toContain('atlas_ready');
 });
});

describe('usage analytics wiring', () => {
 const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
 const guided = readFileSync(new URL('./use-guided-training.ts', import.meta.url), 'utf8');
 const install = readFileSync(new URL('./install-coach.tsx', import.meta.url), 'utf8');
 const entry = readFileSync(new URL('../web/main.tsx', import.meta.url), 'utf8');
 const worker = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
 const discomfort = readFileSync(new URL('./discomfort-guide.tsx', import.meta.url), 'utf8');

 it('starts Vercel analytics from the app entry', () => {
  expect(entry).toContain('startUsageAnalytics');
 });

 it('records atlas ready, region, lesson ids, and pattern ids from the studio', () => {
  expect(page).toContain("trackUsage('atlas_ready')");
  expect(page).toContain("trackUsage('region_opened'");
  expect(page).toContain("trackUsage('lesson_opened'");
  expect(page).toContain("trackUsage('pattern_started'");
  expect(page).not.toMatch(/trackUsage\([^)]*query/);
  expect(page).not.toMatch(/trackUsage\([^)]*chosen\?\.name/);
 });

 it('records guided modes and routine steps without answers', () => {
  expect(guided).toContain("trackUsage('guided_mode_started', {mode: 'routine'})");
  expect(guided).toContain("trackUsage('guided_mode_started', {mode: 'discomfort'})");
  expect(guided).toContain("trackUsage('guided_mode_started', {mode: 'names'})");
  expect(guided).toContain("trackUsage('guided_mode_started', {mode: 'hands'})");
  expect(guided).toContain("trackUsage('routine_step_completed'");
  expect(guided).toContain("trackUsage('routine_completed')");
  expect(guided).toContain("trackUsage('discomfort_completed')");
  expect(guided).not.toMatch(/trackUsage\([^)]*qualit|flags|answer/i);
 });

 it('records PWA install without capturing the prompt UI text', () => {
  expect(install).toContain('trackPwaInstalled');
  expect(install).not.toMatch(/trackUsage\([^)]*userAgent/);
 });

 it('lets Vercel insight requests bypass the offline cache', () => {
  expect(worker).toContain("url.pathname.startsWith('/_vercel/')");
 });

 it('does not send discomfort answers from the training guide', () => {
  expect(discomfort).not.toContain('trackUsage');
  expect(discomfort).not.toContain('@vercel/analytics');
 });
});
