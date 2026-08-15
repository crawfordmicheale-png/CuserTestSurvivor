/** @typedef {{ id: string, name: string, desc: string, max: number, baseCost: number, costScale: number, effect: (lvl:number)=>Record<string,number>, req?: string }} CoreUpgrade */
/** @typedef {{ id: string, name: string, desc: string, color: string, unlockCost: number, unlockReq?: string, stats: Record<string,number>, passive: string }} Pilot */
/** @typedef {{ id: string, name: string, desc: string, color: string, unlockCost: number, unlockReq?: string, base: Record<string,number>, pattern: string }} WeaponDef */
/** @typedef {{ id: string, name: string, desc: string, unlockCost: number, unlockReq?: string, effect: Record<string,number> }} Relic */
/** @typedef {{ id: string, name: string, desc: string, unlockReq?: string, essenceMul: number, effect: Record<string,number> }} Modifier */
/** @typedef {{ id: string, name: string, desc: string, check: (s:any)=>boolean, reward: string }} CodexEntry */

export const CORE_UPGRADES = [
  { id: "hull", name: "Hull Plating", desc: "+8 max HP per level", max: 20, baseCost: 25, costScale: 1.35, effect: (l) => ({ maxHp: l * 8 }) },
  { id: "thrusters", name: "Thrusters", desc: "+4% move speed per level", max: 15, baseCost: 30, costScale: 1.4, effect: (l) => ({ moveSpeed: l * 0.04 }) },
  { id: "caliber", name: "Caliber", desc: "+6% damage per level", max: 25, baseCost: 35, costScale: 1.38, effect: (l) => ({ damage: l * 0.06 }) },
  { id: "reload", name: "Servo Reload", desc: "+4% attack speed per level", max: 20, baseCost: 40, costScale: 1.42, effect: (l) => ({ attackSpeed: l * 0.04 }) },
  { id: "magnet", name: "Magnet Coil", desc: "+12% pickup radius per level", max: 15, baseCost: 20, costScale: 1.3, effect: (l) => ({ pickup: l * 0.12 }) },
  { id: "xp_core", name: "XP Lattice", desc: "+5% XP gain per level", max: 20, baseCost: 45, costScale: 1.4, effect: (l) => ({ xpGain: l * 0.05 }) },
  { id: "luck", name: "Entropy Lens", desc: "+3% luck (better level choices) per level", max: 15, baseCost: 50, costScale: 1.45, effect: (l) => ({ luck: l * 0.03 }) },
  { id: "regen", name: "Nano Repair", desc: "+0.15 HP/s per level", max: 15, baseCost: 55, costScale: 1.45, effect: (l) => ({ regen: l * 0.15 }) },
  { id: "armor", name: "Ablative Mesh", desc: "+3% damage reduction per level (cap 60%)", max: 12, baseCost: 60, costScale: 1.5, effect: (l) => ({ armor: l * 0.03 }) },
  { id: "crit", name: "Crit Prism", desc: "+2% crit chance & +5% crit damage per level", max: 15, baseCost: 70, costScale: 1.48, effect: (l) => ({ critChance: l * 0.02, critDamage: l * 0.05 }) },
  { id: "area", name: "Field Expander", desc: "+5% area / projectile size per level", max: 12, baseCost: 65, costScale: 1.45, effect: (l) => ({ area: l * 0.05 }) },
  { id: "duration", name: "Echo Chamber", desc: "+6% effect duration per level", max: 10, baseCost: 70, costScale: 1.5, effect: (l) => ({ duration: l * 0.06 }) },
  { id: "projectile", name: "Multibarrel", desc: "+1 projectile every 4 levels", max: 12, baseCost: 90, costScale: 1.55, effect: (l) => ({ projectiles: Math.floor(l / 4) }) },
  { id: "essence_find", name: "Essence Siphon", desc: "+8% essence from runs per level", max: 20, baseCost: 40, costScale: 1.4, effect: (l) => ({ essenceFind: l * 0.08 }), req: "codex_first_10" },
  { id: "starting_lvl", name: "Boot Protocol", desc: "Start runs +1 level every 3 ranks", max: 9, baseCost: 120, costScale: 1.6, effect: (l) => ({ startLevel: Math.floor(l / 3) }), req: "codex_survive_5" },
  { id: "relic_slot", name: "Relic Bay", desc: "+1 relic slot at ranks 1/4/8", max: 8, baseCost: 150, costScale: 1.7, effect: (l) => ({ relicSlots: (l >= 1 ? 1 : 0) + (l >= 4 ? 1 : 0) + (l >= 8 ? 1 : 0) }), req: "codex_relics" },
  { id: "bullet_deflect", name: "Phase Skin", desc: "+2% chance to ignore enemy bullets per level", max: 10, baseCost: 100, costScale: 1.55, effect: (l) => ({ deflect: l * 0.02 }), req: "codex_bullet_hell" },
  { id: "swarm_tax", name: "Swarm Tax", desc: "Enemies spawn 1% slower, deal 1% less contact damage per level", max: 15, baseCost: 80, costScale: 1.5, effect: (l) => ({ spawnSlow: l * 0.01, contactReduce: l * 0.01 }), req: "codex_kill_1k" },
];

export const PILOTS = [
  { id: "spark", name: "Spark", desc: "Balanced starter. +5% XP.", color: "#3ec7a0", unlockCost: 0, stats: { xpGain: 0.05 }, passive: "xp" },
  { id: "glass", name: "Glasswing", desc: "-25% HP, +30% damage, +15% speed.", color: "#7ec8ff", unlockCost: 200, unlockReq: "codex_first_10", stats: { maxHp: -0.25, damage: 0.3, moveSpeed: 0.15 }, passive: "glass" },
  { id: "bulwark", name: "Bulwark", desc: "+40% HP, +10% armor, -10% speed.", color: "#e8a04a", unlockCost: 250, unlockReq: "codex_survive_5", stats: { maxHp: 0.4, armor: 0.1, moveSpeed: -0.1 }, passive: "tank" },
  { id: "magnetar", name: "Magnetar", desc: "+50% pickup, XP orbs worth +15%.", color: "#8b7cf0", unlockCost: 300, unlockReq: "codex_kill_1k", stats: { pickup: 0.5, xpGain: 0.15 }, passive: "magnet" },
  { id: "overclock", name: "Overclock", desc: "+25% attack speed, weapons heat: occasional misfire bursts.", color: "#e05a6a", unlockCost: 400, unlockReq: "codex_weapon_3", stats: { attackSpeed: 0.25 }, passive: "overclock" },
  { id: "voidseer", name: "Voidseer", desc: "+20% luck & area. Enemy bullets 8% slower.", color: "#c4b5ff", unlockCost: 600, unlockReq: "codex_bullet_hell", stats: { luck: 0.2, area: 0.2, enemyBulletSlow: 0.08 }, passive: "void" },
  { id: "harvest", name: "Harvester", desc: "+35% essence find, -10% damage.", color: "#e6c35c", unlockCost: 500, unlockReq: "codex_essence_5k", stats: { essenceFind: 0.35, damage: -0.1 }, passive: "harvest" },
  { id: "ascendant", name: "Ascendant", desc: "Gains +2% all stats per Ascension Point (cap +40%).", color: "#9ff0d6", unlockCost: 1000, unlockReq: "codex_ascend_1", stats: {}, passive: "ascendant" },
];

export const WEAPONS = [
  { id: "pulse", name: "Pulse Needle", desc: "Fast single shots toward nearest foe.", color: "#7ec8ff", unlockCost: 0, base: { damage: 8, cooldown: 0.35, speed: 420, count: 1, radius: 4 }, pattern: "aimed" },
  { id: "scatter", name: "Scatterbit", desc: "Fan of short-range pellets.", color: "#e8a04a", unlockCost: 150, unlockReq: "codex_first_10", base: { damage: 5, cooldown: 0.55, speed: 380, count: 5, radius: 3, range: 0.45 }, pattern: "spread" },
  { id: "orbit", name: "Orbit Blades", desc: "Spinning blades around you.", color: "#3ec7a0", unlockCost: 220, unlockReq: "codex_survive_5", base: { damage: 6, cooldown: 0.2, speed: 0, count: 3, radius: 10, duration: 1.4 }, pattern: "orbit" },
  { id: "nova", name: "Nova Pulse", desc: "Periodic ring burst.", color: "#8b7cf0", unlockCost: 280, unlockReq: "codex_kill_1k", base: { damage: 12, cooldown: 1.4, speed: 220, count: 12, radius: 5 }, pattern: "nova" },
  { id: "beam", name: "Lance Beam", desc: "Piercing laser toward mouse/aim.", color: "#e05a6a", unlockCost: 350, unlockReq: "codex_weapon_3", base: { damage: 4, cooldown: 0.08, speed: 900, count: 1, radius: 3, pierce: 4 }, pattern: "beam" },
  { id: "mines", name: "Drift Mines", desc: "Drops lingering mines.", color: "#e6c35c", unlockCost: 320, unlockReq: "codex_bullet_hell", base: { damage: 18, cooldown: 1.1, speed: 0, count: 1, radius: 14, duration: 3.5 }, pattern: "mine" },
  { id: "swarm", name: "Bit Swarm", desc: "Homing micro-drones.", color: "#9ff0d6", unlockCost: 450, unlockReq: "codex_essence_5k", base: { damage: 4, cooldown: 0.7, speed: 260, count: 3, radius: 5 }, pattern: "homing" },
  { id: "rail", name: "Rail Spike", desc: "Slow heavy piercing shot.", color: "#c4b5ff", unlockCost: 550, unlockReq: "codex_ascend_1", base: { damage: 40, cooldown: 1.6, speed: 700, count: 1, radius: 6, pierce: 12 }, pattern: "rail" },
];

export const RELICS = [
  { id: "second_wind", name: "Second Wind", desc: "Once per run, survive fatal hit at 1 HP and gain 2s invuln.", unlockCost: 180, unlockReq: "codex_relics", effect: { secondWind: 1 } },
  { id: "greed_coil", name: "Greed Coil", desc: "+25% essence, -10% HP.", unlockCost: 200, unlockReq: "codex_relics", effect: { essenceFind: 0.25, maxHp: -0.1 } },
  { id: "sharp_echo", name: "Sharp Echo", desc: "Crits explode for 40% damage in a small radius.", unlockCost: 260, unlockReq: "codex_kill_1k", effect: { critExplode: 0.4 } },
  { id: "time_splinter", name: "Time Splinter", desc: "+12% attack speed & duration.", unlockCost: 240, unlockReq: "codex_survive_5", effect: { attackSpeed: 0.12, duration: 0.12 } },
  { id: "blood_tithe", name: "Blood Tithe", desc: "Kills heal 0.4 HP. +10% damage taken.", unlockCost: 220, unlockReq: "codex_first_10", effect: { lifestealKill: 0.4, damageTaken: 0.1 } },
  { id: "bullet_garden", name: "Bullet Garden", desc: "Enemy bullets have 12% chance to become XP.", unlockCost: 300, unlockReq: "codex_bullet_hell", effect: { bulletToXp: 0.12 } },
  { id: "twin_core", name: "Twin Core", desc: "+1 projectile to all weapons.", unlockCost: 400, unlockReq: "codex_weapon_3", effect: { projectiles: 1 } },
  { id: "asc_mirror", name: "Ascension Mirror", desc: "+15% all damage per Ascension Point (cap 5).", unlockCost: 500, unlockReq: "codex_ascend_1", effect: { ascDamage: 0.15 } },
  { id: "safe_pocket", name: "Safe Pocket", desc: "Start with a 4s shield each run.", unlockCost: 150, unlockReq: "codex_relics", effect: { startShield: 4 } },
  { id: "chaos_die", name: "Chaos Die", desc: "+25% luck. Level-ups offer 4 choices.", unlockCost: 350, unlockReq: "codex_essence_5k", effect: { luck: 0.25, choiceCount: 1 } },
];

export const MODIFIERS = [
  { id: "swarm_plus", name: "Swarm+", desc: "+40% enemy spawn rate.", unlockReq: undefined, essenceMul: 1.25, effect: { spawnRate: 0.4 } },
  { id: "bullet_plus", name: "Bullet Hell+", desc: "Enemies shoot 50% more often; bullets +20% speed.", unlockReq: "codex_first_10", essenceMul: 1.35, effect: { enemyFireRate: 0.5, enemyBulletSpeed: 0.2 } },
  { id: "glass_run", name: "Glass Run", desc: "You take double damage.", unlockReq: "codex_survive_5", essenceMul: 1.4, effect: { damageTaken: 1.0 } },
  { id: "elite_tide", name: "Elite Tide", desc: "Elites appear earlier and more often.", unlockReq: "codex_kill_1k", essenceMul: 1.3, effect: { eliteRate: 0.5, eliteEarly: 1 } },
  { id: "famine", name: "Famine", desc: "-30% XP and pickup radius.", unlockReq: "codex_weapon_3", essenceMul: 1.45, effect: { xpGain: -0.3, pickup: -0.3 } },
  { id: "boss_rush", name: "Boss Pressure", desc: "Mini-boss every 60s instead of 90s.", unlockReq: "codex_bullet_hell", essenceMul: 1.5, effect: { bossInterval: 0.67 } },
  { id: "no_magnet", name: "Dead Coil", desc: "No passive XP magnet (walk over orbs).", unlockReq: "codex_essence_5k", essenceMul: 1.2, effect: { noMagnet: 1 } },
  { id: "ascetic", name: "Ascetic", desc: "In-run level-ups offer only 2 choices.", unlockReq: "codex_ascend_1", essenceMul: 1.35, effect: { choiceCount: -1 } },
];

export const CODEX = [
  { id: "codex_first_10", name: "First Ten", desc: "Survive 10 minutes in a single run.", check: (s) => s.bestTime >= 600, reward: "Unlocks Glasswing, Scatterbit, Essence Siphon path, Bullet Hell+" },
  { id: "codex_survive_5", name: "Five Alive", desc: "Survive 5 minutes.", check: (s) => s.bestTime >= 300, reward: "Unlocks Bulwark, Orbit Blades, Boot Protocol, Glass Run" },
  { id: "codex_kill_1k", name: "Thousand Cuts", desc: "Kill 1,000 enemies total.", check: (s) => s.totalKills >= 1000, reward: "Unlocks Magnetar, Nova Pulse, Swarm Tax, Elite Tide" },
  { id: "codex_weapon_3", name: "Triad Arms", desc: "Hold 3 weapons at once in a run.", check: (s) => s.maxWeaponsHeld >= 3, reward: "Unlocks Overclock, Lance Beam, Twin Core path, Famine" },
  { id: "codex_bullet_hell", name: "Hell Walker", desc: "Survive 3 minutes with Bullet Hell+ on.", check: (s) => s.bestBulletHellTime >= 180, reward: "Unlocks Voidseer, Drift Mines, Phase Skin, Boss Pressure" },
  { id: "codex_essence_5k", name: "Rich Drift", desc: "Earn 5,000 lifetime essence.", check: (s) => s.lifetimeEssence >= 5000, reward: "Unlocks Harvester, Bit Swarm, Chaos Die, Dead Coil" },
  { id: "codex_relics", name: "Archive Open", desc: "Reach Core total level 10.", check: (s) => s.coreTotalLevel >= 10, reward: "Unlocks Relic Bay & first relics" },
  { id: "codex_ascend_1", name: "First Ascent", desc: "Perform an Ascension.", check: (s) => s.ascensionPoints >= 1, reward: "Unlocks Ascendant, Rail Spike, Ascension Mirror, Ascetic" },
  { id: "codex_synergy", name: "Resonance", desc: "Own Crit Prism 5 and Sharp Echo equipped.", check: (s) => (s.cores.crit || 0) >= 5 && (s.equippedRelics || []).includes("sharp_echo"), reward: "Synergy: crit explosions +25% radius permanently while both active" },
  { id: "codex_speedrun", name: "Warmachine", desc: "Deal 50,000 damage in one run.", check: (s) => s.bestDamage >= 50000, reward: "+5% global damage permanently (Warmachine seal)" },
];

export const SYNERGIES = [
  { id: "crit_garden", name: "Crit Garden", requires: { cores: { crit: 5 }, relics: ["sharp_echo"] }, effect: { critExplodeArea: 0.25 } },
  { id: "tank_mesh", name: "Iron Lattice", requires: { cores: { hull: 8, armor: 5 }, pilots: ["bulwark"] }, effect: { armor: 0.08, regen: 0.2 } },
  { id: "glass_caliber", name: "Fragile Caliber", requires: { cores: { caliber: 10 }, pilots: ["glass"] }, effect: { damage: 0.15, critChance: 0.05 } },
  { id: "void_phase", name: "Void Phase", requires: { cores: { bullet_deflect: 3 }, pilots: ["voidseer"] }, effect: { deflect: 0.05, enemyBulletSlow: 0.05 } },
  { id: "harvest_siphon", name: "Double Siphon", requires: { cores: { essence_find: 5 }, pilots: ["harvest"] }, effect: { essenceFind: 0.2 } },
];

export const IN_RUN_MUTATIONS = [
  { id: "dmg", name: "Overcharge", kind: "Stat", desc: "+12% damage", apply: (p) => { p.damageMul *= 1.12; } },
  { id: "aspd", name: "Hair Trigger", kind: "Stat", desc: "+12% attack speed", apply: (p) => { p.attackSpeedMul *= 1.12; } },
  { id: "spd", name: "Afterburn", kind: "Stat", desc: "+10% move speed", apply: (p) => { p.moveSpeedMul *= 1.1; } },
  { id: "hp", name: "Bulk Plates", kind: "Stat", desc: "+20 max HP and heal 20", apply: (p) => { p.maxHp += 20; p.hp = Math.min(p.maxHp, p.hp + 20); } },
  { id: "area", name: "Wide Field", kind: "Stat", desc: "+15% area", apply: (p) => { p.areaMul *= 1.15; } },
  { id: "proj", name: "Extra Barrel", kind: "Stat", desc: "+1 projectile", apply: (p) => { p.bonusProjectiles += 1; } },
  { id: "pickup", name: "Pull Coil", kind: "Stat", desc: "+25% pickup radius", apply: (p) => { p.pickupMul *= 1.25; } },
  { id: "regen", name: "Field Patch", kind: "Stat", desc: "+0.4 HP/s", apply: (p) => { p.regen += 0.4; } },
  { id: "crit", name: "Lucky Edge", kind: "Stat", desc: "+8% crit chance", apply: (p) => { p.critChance += 0.08; } },
  { id: "armor", name: "Dampers", kind: "Stat", desc: "+8% armor", apply: (p) => { p.armor = Math.min(0.6, p.armor + 0.08); } },
  { id: "xp", name: "Insight", kind: "Stat", desc: "+15% XP gain", apply: (p) => { p.xpMul *= 1.15; } },
  { id: "duration", name: "Linger", kind: "Stat", desc: "+20% duration", apply: (p) => { p.durationMul *= 1.2; } },
];

export const ENEMY_TYPES = [
  { id: "mite", hp: 12, speed: 55, size: 10, contact: 6, xp: 1, color: "#6a8a9a", score: 1, shoot: null },
  { id: "spitter", hp: 18, speed: 40, size: 12, contact: 5, xp: 2, color: "#8a6aaa", score: 2, shoot: { cooldown: 2.2, speed: 160, damage: 8, count: 1 } },
  { id: "spinner", hp: 28, speed: 35, size: 14, contact: 8, xp: 3, color: "#aa6a6a", score: 3, shoot: { cooldown: 1.8, speed: 140, damage: 6, count: 6, ring: true } },
  { id: "charger", hp: 40, speed: 95, size: 13, contact: 12, xp: 3, color: "#aaa06a", score: 3, shoot: null, charge: true },
  { id: "elite", hp: 120, speed: 45, size: 18, contact: 14, xp: 10, color: "#e05a6a", score: 10, shoot: { cooldown: 1.4, speed: 180, damage: 10, count: 8, ring: true }, elite: true },
  { id: "boss", hp: 800, speed: 28, size: 28, contact: 20, xp: 40, color: "#c4b5ff", score: 50, shoot: { cooldown: 0.9, speed: 200, damage: 12, count: 16, ring: true }, boss: true },
];

export function upgradeCost(def, level) {
  return Math.floor(def.baseCost * Math.pow(def.costScale, level));
}

export function xpForLevel(level) {
  return Math.floor(5 + level * 3.2 + Math.pow(level, 1.3) * 1.6);
}
