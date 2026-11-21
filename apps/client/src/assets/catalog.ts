export const CATALOG_VERSION = '1.0.0';

export function assetUrl(relPath: string): string {
  return `/assets/${relPath.replace(/^\//, '')}`;
}

const THREE_STAGE = new Set([
  'b02', 'b04', 'b06', 'b08', 'b10', 'b12', 'b14', 'b16', 'b18', 'b20',
]);

/** Map building stage + style to sprite path (per-object replaceable assets). */
export function buildingSpritePath(
  buildingId: string,
  stage: number,
  style: 'tropical' | 'luxury' | 'fantasy' = 'tropical',
): string {
  const id = buildingId.toLowerCase();
  if (id === 'b01') {
    if (stage <= 0) return assetUrl('buildings/b01/b01_s0_ruins.webp');
    if (stage === 1) return assetUrl('buildings/b01/b01_s1_repair.webp');
    return assetUrl(`buildings/b01/b01_s3_${style}.webp`);
  }
  if (stage <= 0) return assetUrl(`buildings/${id}/${id}_s0.webp`);
  const maxStage = THREE_STAGE.has(id) ? 3 : 2;
  if (stage >= maxStage) return assetUrl(`buildings/${id}/${id}_s3_${style}.webp`);
  // stages 1..(max-1) use s1 until dedicated S2 art lands
  return assetUrl(`buildings/${id}/${id}_s1.webp`);
}

export function gemPath(color: string): string {
  return assetUrl(`match3/gem_${color}.webp`);
}

export function powerPath(power: string): string {
  const map: Record<string, string> = {
    rocket_h: 'power_rocket',
    rocket_v: 'power_rocket',
    bomb: 'power_bomb',
    pearl: 'power_pearl',
    propeller: 'power_propeller',
  };
  return assetUrl(`match3/${map[power] ?? 'power_rocket'}.webp`);
}

export const ZONE_BG: Record<string, string> = {
  Z1: assetUrl('terrain/z1_beach.webp'),
  Z2: assetUrl('terrain/z2_shore.webp'),
  Z3: assetUrl('terrain/z3_grove.webp'),
  Z4: assetUrl('terrain/z4_plaza.webp'),
  Z5: assetUrl('terrain/z5_lagoon.webp'),
  Z6: assetUrl('terrain/z6_festival.webp'),
  Z7: assetUrl('terrain/z7_cape.webp'),
};

export const UI = {
  btnPrimary: assetUrl('ui/btn_primary.webp'),
  btnSecondary: assetUrl('ui/btn_secondary.webp'),
  btnSuccess: assetUrl('ui/btn_success.webp'),
  iconCoins: assetUrl('ui/icon_coins.webp'),
  iconDiamonds: assetUrl('ui/icon_diamonds.webp'),
  iconStar: assetUrl('ui/icon_build_star.webp'),
  iconBuild: assetUrl('ui/icon_build.webp'),
  iconLocked: assetUrl('ui/icon_locked.webp'),
  panel: assetUrl('ui/panel_card.webp'),
  navIsland: assetUrl('ui/nav_island.webp'),
  navPlay: assetUrl('ui/nav_play.webp'),
  navShop: assetUrl('ui/nav_shop.webp'),
  navTeam: assetUrl('ui/nav_team.webp'),
  navPvp: assetUrl('ui/nav_pvp.webp'),
  silhouette: assetUrl('terrain/silhouette_locked.webp'),
};
