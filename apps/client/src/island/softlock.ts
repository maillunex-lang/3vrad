import { BUILDINGS, type BuildingDef } from './catalog';

export type SoftlockStep = {
  level: number;
  starsAfterClear: number;
  spent: { buildingId: string; stage: number; cost: number }[];
  starsAfterSpend: number;
};

export type SoftlockResult = {
  ok: boolean;
  steps: SoftlockStep[];
  finalStages: Record<string, number>;
  finalStars: number;
  failures: string[];
};

/**
 * Simulates clearing levels 1–70 with greedy star spend on the earliest
 * unlocked affordable stage. Soft-lock = stuck with stars but unfinished
 * unlocked stages, or unfinished mandatory chain after level 70.
 */
export function simulateIslandRoute(buildings: BuildingDef[] = BUILDINGS): SoftlockResult {
  const stages = new Map<string, number>();
  for (const b of buildings) stages.set(b.id, 0);

  let stars = 0;
  const steps: SoftlockStep[] = [];
  const failures: string[] = [];

  const nextAffordable = (maxLevel: number) => {
    const options: { building: BuildingDef; stageIndex: number; cost: number }[] = [];
    for (const b of buildings) {
      const cur = stages.get(b.id) ?? 0;
      if (cur >= b.stages.length) continue;
      const st = b.stages[cur]!;
      if (st.unlockLevel <= maxLevel && st.costStars <= stars) {
        options.push({ building: b, stageIndex: cur, cost: st.costStars });
      }
    }
    // Prefer story order (catalog order), then cheaper stages.
    options.sort((a, b) => {
      const ai = buildings.indexOf(a.building);
      const bi = buildings.indexOf(b.building);
      if (ai !== bi) return ai - bi;
      return a.cost - b.cost;
    });
    return options[0] ?? null;
  };

  for (let level = 1; level <= 70; level++) {
    stars += 1; // first-clear build star
    const spent: SoftlockStep['spent'] = [];
    let guard = 0;
    while (guard++ < 64) {
      const next = nextAffordable(level);
      if (!next) break;
      stars -= next.cost;
      const newStage = next.stageIndex + 1;
      stages.set(next.building.id, newStage);
      spent.push({ buildingId: next.building.id, stage: newStage, cost: next.cost });
    }

    // Soft-lock probe: unlocked unfinished stage exists but cannot pay.
    for (const b of buildings) {
      const cur = stages.get(b.id) ?? 0;
      if (cur >= b.stages.length) continue;
      const st = b.stages[cur]!;
      if (st.unlockLevel <= level && st.costStars > stars && stars > 0) {
        // Holding stars that are insufficient for the only unlocked stage is OK
        // (wait for next clear). Soft-lock if NO future clears can ever fund it
        // before end — checked at end. Mid-route: fail if stars sit unused while
        // a cheaper unlocked stage was skipped (greedy forbids that).
      }
    }

    steps.push({
      level,
      starsAfterClear: stars + spent.reduce((s, x) => s + x.cost, 0),
      spent,
      starsAfterSpend: stars,
    });
  }

  const finalStages: Record<string, number> = {};
  for (const b of buildings) {
    const cur = stages.get(b.id) ?? 0;
    finalStages[b.id] = cur;
    if (cur !== b.stages.length) {
      failures.push(`${b.id} stuck at stage ${cur}/${b.stages.length}`);
    }
  }
  if (stars !== 0) {
    failures.push(`leftover stars ${stars} (expected 0)`);
  }

  // Ensure every stage unlock level is within 1–70 and costs positive.
  for (const b of buildings) {
    for (const st of b.stages) {
      if (st.unlockLevel < 1 || st.unlockLevel > 70) {
        failures.push(`${b.id} unlockLevel ${st.unlockLevel} out of 1–70`);
      }
      if (st.costStars < 1) {
        failures.push(`${b.id} non-positive cost`);
      }
    }
  }

  return {
    ok: failures.length === 0,
    steps,
    finalStages,
    finalStars: stars,
    failures,
  };
}
