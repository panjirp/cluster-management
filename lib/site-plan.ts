// Single source of truth for the cluster site-plan image, used by both the
// map editor and the public cluster map. Bump the version whenever
// public/denah_bc.png is replaced so browsers/Next's image cache never serve
// a stale mismatched version on one page but not the other.
const VERSION = 2;

export const SITE_PLAN_URL = `/denah_bc.png?v=${VERSION}`;
export const SITE_PLAN_WIDTH = 907;
export const SITE_PLAN_HEIGHT = 1734;
export const SITE_PLAN_ASPECT = `${SITE_PLAN_WIDTH}/${SITE_PLAN_HEIGHT}`;
