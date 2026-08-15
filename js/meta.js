import {
  CORE_UPGRADES,
  PILOTS,
  WEAPONS,
  RELICS,
  MODIFIERS,
  CODEX,
  SYNERGIES,
  upgradeCost,
} from "./data.js";
import { writeSave } from "./save.js";

export function coreTotalLevel(save) {
  return Object.values(save.cores).reduce((a, b) => a + b, 0);
}

export function isCodexUnlocked(save, id) {
  return save.unlockedCodex.includes(id);
}

export function reqMet(save, req) {
  if (!req) return true;
  return isCodexUnlocked(save, req);
}

export function evaluateCodex(save) {
  const snap = {
    bestTime: save.stats.bestTime,
    totalKills: save.stats.totalKills,
    maxWeaponsHeld: save.stats.maxWeaponsHeld,
    bestBulletHellTime: save.stats.bestBulletHellTime,
    lifetimeEssence: save.lifetimeEssence,
    coreTotalLevel: coreTotalLevel(save),
    ascensionPoints: save.ascensionPoints,
    cores: save.cores,
    equippedRelics: save.equippedRelics,
    bestDamage: save.stats.bestDamage,
  };
  let changed = false;
  for (const entry of CODEX) {
    if (save.unlockedCodex.includes(entry.id)) continue;
    if (entry.check(snap)) {
      save.unlockedCodex.push(entry.id);
      changed = true;
      if (entry.id === "codex_speedrun") save.permanentFlags.warmachine = true;
      if (entry.id === "codex_relics") {
        for (const r of ["second_wind", "greed_coil", "safe_pocket"]) {
          if (!save.unlockedRelics.includes(r)) save.unlockedRelics.push(r);
        }
      }
    }
  }
  return changed;
}

export function getActiveSynergies(save) {
  return SYNERGIES.filter((syn) => {
    const r = syn.requires;
    if (r.cores) {
      for (const [k, v] of Object.entries(r.cores)) {
        if ((save.cores[k] || 0) < v) return false;
      }
    }
    if (r.relics) {
      for (const id of r.relics) {
        if (!save.equippedRelics.includes(id)) return false;
      }
    }
    if (r.pilots) {
      if (!r.pilots.includes(save.selectedPilot)) return false;
    }
    return true;
  });
}

export function computeMetaStats(save) {
  const stats = {
    maxHp: 100,
    moveSpeed: 140,
    damage: 1,
    attackSpeed: 1,
    pickup: 60,
    xpGain: 1,
    luck: 0,
    regen: 0,
    armor: 0,
    critChance: 0.05,
    critDamage: 1.5,
    area: 1,
    duration: 1,
    projectiles: 0,
    essenceFind: 1,
    startLevel: 1,
    relicSlots: 1,
    deflect: 0,
    spawnSlow: 0,
    contactReduce: 0,
    enemyBulletSlow: 0,
    secondWind: 0,
    critExplode: 0,
    critExplodeArea: 0,
    lifestealKill: 0,
    damageTaken: 1,
    bulletToXp: 0,
    startShield: 0,
    choiceCount: 3,
    ascDamage: 0,
  };

  for (const def of CORE_UPGRADES) {
    const lvl = save.cores[def.id] || 0;
    if (!lvl) continue;
    const e = def.effect(lvl);
    mergeEffects(stats, e, true);
  }

  const pilot = PILOTS.find((p) => p.id === save.selectedPilot) || PILOTS[0];
  mergeEffects(stats, pilot.stats, false);

  if (pilot.passive === "ascendant") {
    const bonus = Math.min(0.4, save.ascensionPoints * 0.02);
    stats.damage *= 1 + bonus;
    stats.attackSpeed *= 1 + bonus;
    stats.moveSpeed *= 1 + bonus;
    stats.maxHp *= 1 + bonus;
  }

  for (const rid of save.equippedRelics) {
    const relic = RELICS.find((r) => r.id === rid);
    if (!relic) continue;
    mergeEffects(stats, relic.effect, false);
  }

  for (const syn of getActiveSynergies(save)) {
    mergeEffects(stats, syn.effect, false);
  }

  if (save.permanentFlags.warmachine) stats.damage *= 1.05;

  stats.damage *= save.ascensionMult;
  stats.maxHp = Math.max(20, Math.floor(stats.maxHp));
  stats.armor = Math.min(0.6, stats.armor);
  stats.relicSlots = Math.max(1, stats.relicSlots + Math.floor(save.ascensionPoints / 3));

  return { stats, pilot };
}

function mergeEffects(stats, effect, additiveFlat) {
  for (const [k, v] of Object.entries(effect)) {
    if (k === "maxHp" && !additiveFlat) {
      stats.maxHp *= 1 + v;
    } else if (k === "maxHp" && additiveFlat) {
      stats.maxHp += v;
    } else if (k === "moveSpeed" && !additiveFlat) {
      stats.moveSpeed *= 1 + v;
    } else if (k === "moveSpeed" && additiveFlat) {
      stats.moveSpeed *= 1 + v;
    } else if (["damage", "attackSpeed", "pickup", "xpGain", "area", "duration", "essenceFind"].includes(k) && !additiveFlat) {
      if (k === "pickup") stats.pickup *= 1 + v;
      else if (k === "essenceFind") stats.essenceFind *= 1 + v;
      else stats[k] *= 1 + v;
    } else if (k === "pickup" && additiveFlat) {
      stats.pickup *= 1 + v;
    } else if (k === "essenceFind" && additiveFlat) {
      stats.essenceFind *= 1 + v;
    } else if (k === "damage" || k === "attackSpeed" || k === "xpGain" || k === "area" || k === "duration") {
      stats[k] *= 1 + v;
    } else if (k === "projectiles" || k === "startLevel" || k === "relicSlots" || k === "choiceCount" || k === "secondWind" || k === "startShield") {
      stats[k] = (stats[k] || 0) + v;
    } else {
      stats[k] = (stats[k] || 0) + v;
    }
  }
}

export function modifierMultiplier(save) {
  let mul = 1;
  for (const id of save.activeModifiers) {
    const m = MODIFIERS.find((x) => x.id === id);
    if (m) mul *= m.essenceMul;
  }
  return mul;
}

export function stackedModifierEffects(save) {
  const e = {
    spawnRate: 0,
    enemyFireRate: 0,
    enemyBulletSpeed: 0,
    damageTaken: 0,
    eliteRate: 0,
    eliteEarly: 0,
    xpGain: 0,
    pickup: 0,
    bossInterval: 1,
    noMagnet: 0,
    choiceCount: 0,
  };
  for (const id of save.activeModifiers) {
    const m = MODIFIERS.find((x) => x.id === id);
    if (!m) continue;
    for (const [k, v] of Object.entries(m.effect)) {
      if (k === "bossInterval") e.bossInterval *= v;
      else e[k] = (e[k] || 0) + v;
    }
  }
  return e;
}

export function buyCore(save, id) {
  const def = CORE_UPGRADES.find((u) => u.id === id);
  if (!def) return { ok: false, reason: "Unknown" };
  if (!reqMet(save, def.req)) return { ok: false, reason: "Locked" };
  const lvl = save.cores[id] || 0;
  if (lvl >= def.max) return { ok: false, reason: "Maxed" };
  const cost = upgradeCost(def, lvl);
  if (save.essence < cost) return { ok: false, reason: "Need essence" };
  save.essence -= cost;
  save.cores[id] = lvl + 1;
  evaluateCodex(save);
  writeSave(save);
  return { ok: true };
}

export function unlockPilot(save, id) {
  const p = PILOTS.find((x) => x.id === id);
  if (!p) return { ok: false };
  if (save.unlockedPilots.includes(id)) {
    save.selectedPilot = id;
    writeSave(save);
    return { ok: true };
  }
  if (!reqMet(save, p.unlockReq)) return { ok: false, reason: "Locked" };
  if (save.essence < p.unlockCost) return { ok: false, reason: "Need essence" };
  save.essence -= p.unlockCost;
  save.unlockedPilots.push(id);
  save.selectedPilot = id;
  writeSave(save);
  return { ok: true };
}

export function unlockWeapon(save, id) {
  const w = WEAPONS.find((x) => x.id === id);
  if (!w) return { ok: false };
  if (save.unlockedWeapons.includes(id)) {
    save.selectedWeapon = id;
    writeSave(save);
    return { ok: true };
  }
  if (!reqMet(save, w.unlockReq)) return { ok: false, reason: "Locked" };
  if (save.essence < w.unlockCost) return { ok: false, reason: "Need essence" };
  save.essence -= w.unlockCost;
  save.unlockedWeapons.push(id);
  save.selectedWeapon = id;
  writeSave(save);
  return { ok: true };
}

export function unlockRelic(save, id) {
  const r = RELICS.find((x) => x.id === id);
  if (!r) return { ok: false };
  if (save.unlockedRelics.includes(id)) return toggleRelic(save, id);
  if (!reqMet(save, r.unlockReq)) return { ok: false, reason: "Locked" };
  if (save.essence < r.unlockCost) return { ok: false, reason: "Need essence" };
  save.essence -= r.unlockCost;
  save.unlockedRelics.push(id);
  writeSave(save);
  return { ok: true };
}

export function toggleRelic(save, id) {
  if (!save.unlockedRelics.includes(id)) return { ok: false };
  const { stats } = computeMetaStats(save);
  const slots = stats.relicSlots;
  const idx = save.equippedRelics.indexOf(id);
  if (idx >= 0) {
    save.equippedRelics.splice(idx, 1);
  } else {
    if (save.equippedRelics.length >= slots) return { ok: false, reason: "No slots" };
    save.equippedRelics.push(id);
  }
  evaluateCodex(save);
  writeSave(save);
  return { ok: true };
}

export function toggleModifier(save, id) {
  const m = MODIFIERS.find((x) => x.id === id);
  if (!m) return { ok: false };
  if (!reqMet(save, m.unlockReq)) return { ok: false, reason: "Locked" };
  const i = save.activeModifiers.indexOf(id);
  if (i >= 0) save.activeModifiers.splice(i, 1);
  else save.activeModifiers.push(id);
  writeSave(save);
  return { ok: true };
}

export function canAscend(save) {
  return save.essence >= 2000 || coreTotalLevel(save) >= 25;
}

export function ascendPreview(save) {
  const fromEssence = Math.floor(save.essence / 2000);
  const fromCores = Math.floor(coreTotalLevel(save) / 25);
  const gain = Math.max(1, fromEssence + fromCores);
  return {
    gain,
    newMult: +(save.ascensionMult + gain * 0.08).toFixed(2),
    resetEssence: true,
    resetCores: true,
  };
}

export function doAscend(save) {
  if (!canAscend(save)) return { ok: false, reason: "Not ready" };
  const prev = ascendPreview(save);
  save.ascensionPoints += prev.gain;
  save.ascensionMult = prev.newMult;
  save.essence = 0;
  save.cores = {};
  evaluateCodex(save);
  writeSave(save);
  return { ok: true, gain: prev.gain };
}

export function awardRun(save, run) {
  const { stats } = computeMetaStats(save);
  const modMul = modifierMultiplier(save);
  let essence = Math.floor(
    (run.time * 0.35 + run.kills * 0.4 + run.level * 3 + run.damage / 80) *
      stats.essenceFind *
      modMul *
      save.ascensionMult
  );
  essence = Math.max(1, essence);
  save.essence += essence;
  save.lifetimeEssence += essence;
  save.stats.totalRuns += 1;
  save.stats.totalKills += run.kills;
  save.stats.bestTime = Math.max(save.stats.bestTime, run.time);
  save.stats.bestKills = Math.max(save.stats.bestKills, run.kills);
  save.stats.bestDamage = Math.max(save.stats.bestDamage, run.damage);
  save.stats.maxWeaponsHeld = Math.max(save.stats.maxWeaponsHeld, run.weaponsHeld);
  if (save.activeModifiers.includes("bullet_plus")) {
    save.stats.bestBulletHellTime = Math.max(save.stats.bestBulletHellTime, run.time);
  }
  save.stats.lastRun = { ...run, essence };
  evaluateCodex(save);
  writeSave(save);
  return essence;
}

export { CORE_UPGRADES, PILOTS, WEAPONS, RELICS, MODIFIERS, CODEX, upgradeCost };
