import type {Atlas, View} from './anatomy';
import {REGIONS, isTrainingPart, partsInRegion, type RegionId} from './training';

/** Camera presets. Front/Side/Back turn a standing person, they do not mean “full body”. */
export const CAMERA_VIEWS: {id: View; mark: string; label: string}[] = [
 {id: 'three-quarter', mark: '¾', label: 'Three-quarter view'},
 {id: 'front', mark: 'Front', label: 'Front view'},
 {id: 'side', mark: 'Side', label: 'Side view'},
 {id: 'back', mark: 'Back', label: 'Back view'},
];

/** Aim vectors. ¾ must sit clearly between Front and Side — not a near-front full figure. */
export const CAMERA_AIMS: Record<View, [number, number, number]> = {
 front: [0, 0.04, 1],
 back: [0, 0.04, -1],
 side: [1, 0.04, 0],
 'three-quarter': [0.92, 0.12, 1],
};

export function cameraAim(view: View | string): [number, number, number] {
 return CAMERA_AIMS[(view as View)] ?? CAMERA_AIMS['three-quarter'];
}

export function trainingPartIds(atlas: Atlas) {
 return atlas.parts.filter(isTrainingPart).map(part => part.id);
}

/** Whole standing person unless a body area is chosen. */
export function visibleIdsForStudio(atlas: Atlas | null, region: RegionId | null) {
 if (!atlas || !region) return null;
 return partsInRegion(atlas, region);
}

export type FrameKind = 'body' | 'region';

export function frameKind(state: {visibleIds: string[] | null}): FrameKind {
 if (state.visibleIds?.length) return 'region';
 return 'body';
}

/**
 * Distance multiplier over a tight fit. A selected region is closer than the
 * standing person while retaining neighboring anatomical context.
 */
export function framePadding(kind: FrameKind, mobile: boolean) {
 if (kind === 'region') return mobile ? 1.72 : 1.5;
 return mobile ? 2.85 : 1.85;
}

export function minFrameDistance(kind: FrameKind, mobile: boolean) {
 if (kind === 'region') return mobile ? 0.28 : 0.2;
 return mobile ? 1.15 : 0.75;
}

/** How large the part looks to the camera. On a phone, do not let a wide girdle zoom the area away. */
export function frameSpan(size: {x: number; y: number; z: number}, aspect: number, kind: FrameKind, mobile: boolean) {
 if (kind === 'region' && mobile) return Math.max(size.y, size.z, size.x * 0.52);
 return Math.max(size.y, size.x / Math.max(0.35, aspect), size.z);
}

export function shouldReframeArea(current: RegionId | null, next: RegionId | null) {
 return current !== next;
}

export function regionForPart(atlas: Atlas, partId: string): RegionId | null {
 for (const region of REGIONS) {
  if (partsInRegion(atlas, region.id).includes(partId)) return region.id;
 }
 return null;
}

/** Frame the standing person or active body area, never one muscle alone. */
export function idsToFrame(
 atlas: Atlas,
 state: {visibleIds: string[] | null},
) {
 if (state.visibleIds?.length) return state.visibleIds;
 return trainingPartIds(atlas);
}

export function figureSpan(atlas: Atlas, ids: string[] | null) {
 const parts = ids
  ? atlas.parts.filter(part => ids.includes(part.id))
  : atlas.parts.filter(isTrainingPart);
 let y0 = Infinity;
 let y1 = -Infinity;
 for (const part of parts) {
  y0 = Math.min(y0, part.bounds[0][1], part.bounds[1][1]);
  y1 = Math.max(y1, part.bounds[0][1], part.bounds[1][1]);
 }
 return {y0, y1, height: y1 - y0};
}

/** A standing adult is about 1.6m in this model. A torso-only crop is much shorter. */
export const STANDING_HEIGHT_MIN = 1.4;
export const TORSO_HEIGHT_MAX = 0.9;

export function lessonStaysOnCurrentFigure(visibleIds: string[] | null, lessonPartIds: string[]) {
 if (!visibleIds) return true;
 return lessonPartIds.some(id => visibleIds.includes(id));
}
