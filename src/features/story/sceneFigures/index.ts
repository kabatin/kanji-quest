/**
 * 場面の 共通部品(人・あるき・背景・小さな 生きもの・気持ち の しるし・色)。
 * 場面からは import { Person, walk, Backdrop, PALETTE } from '../sceneFigures' のように 読む。
 * 使い方 と きまり は docs/scene-guide.md の「共通部品」。
 */
export { BUILDS, DEFAULT_HEIGHT, HANG_ARM, STRAIGHT_LEG, bodyScale, mixLimb, mixPose, nearSide, personRig, reach } from './body'
export type { BodySide, Build, Facing, Limb, LimbAngles, LimbMix, LimbTarget, PersonPose, Placement, Point, Rig } from './body'
export { gaitAt, turnAround, walk } from './walk'
export type { Gait, WalkPlan, WalkResult } from './walk'
export { CLOTHES, PALETTE, mixColor, shade } from './palette'
export { Person } from './Person'
export type { PersonProps } from './Person'
export { DEFAULT_LOOK, LOOKS } from './looks'
export type { BottomKind, Look } from './looks'
export type { Expression, HairStyle } from './head'
export { Backdrop, ByDepth, Canopy, Cloud, Clouds, Flower, Hills, House, Meadow, PineTree, Sun, Tree, Tuft } from './scenery'
export type { CanopyProps, CloudSpot, DepthItem } from './scenery'
export { Bird, Butterfly } from './critters'
export { Dust, Hearts, Notice, Sigh, Sweat } from './effects'
