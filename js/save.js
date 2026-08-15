const SAVE_KEY = "shardfall_save_v1";

export function defaultSave() {
  return {
    essence: 0,
    lifetimeEssence: 0,
    ascensionPoints: 0,
    ascensionMult: 1,
    cores: {},
    unlockedPilots: ["spark"],
    unlockedWeapons: ["pulse"],
    unlockedRelics: [],
    equippedRelics: [],
    selectedPilot: "spark",
    selectedWeapon: "pulse",
    activeModifiers: [],
    unlockedCodex: [],
    permanentFlags: {},
    stats: {
      bestTime: 0,
      bestKills: 0,
      bestDamage: 0,
      totalKills: 0,
      totalRuns: 0,
      maxWeaponsHeld: 1,
      bestBulletHellTime: 0,
      lastRun: null,
    },
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    const data = JSON.parse(raw);
    return { ...defaultSave(), ...data, stats: { ...defaultSave().stats, ...(data.stats || {}) }, cores: data.cores || {}, permanentFlags: data.permanentFlags || {} };
  } catch {
    return defaultSave();
  }
}

export function writeSave(save) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}

export function resetSave() {
  const s = defaultSave();
  writeSave(s);
  return s;
}
