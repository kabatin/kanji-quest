import { buildAreas } from '../lib/stages'
import { KANJI } from './kanji'

/** ぼうけんのエリアとステージ(収録している漢字から決まる) */
export const AREAS = buildAreas(KANJI)

export const ALL_STAGES = AREAS.flatMap((area) => area.stages)
