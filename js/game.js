import { clamp, dist, angleTo, rand, formatTime, weightedPick } from "./utils.js";
import { WEAPONS, ENEMY_TYPES, IN_RUN_MUTATIONS, xpForLevel } from "./data.js";
import { computeMetaStats, stackedModifierEffects, awardRun } from "./meta.js";
import { drawShip, drawEnemy, drawBullet, drawOrb, drawMine, drawStarfield } from "./sprites.js";

const W = 960;
const H = 540;

export class Game {
  constructor(canvas, save, onHub) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.save = save;
    this.onHub = onHub;
    this.keys = {};
    this.mouse = { x: W / 2, y: H / 2, down: false };
    this.running = false;
    this.paused = false;
    this.levelUpOpen = false;
    this.dead = false;
    this._boundKey = (e) => this.onKey(e);
    this._boundKeyUp = (e) => this.onKeyUp(e);
    this._boundMove = (e) => this.onMouse(e);
    this._raf = 0;
  }

  start() {
    const meta = computeMetaStats(this.save);
    const mod = stackedModifierEffects(this.save);
    this.meta = meta.stats;
    this.pilot = meta.pilot;
    this.mod = mod;

    this.player = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      hp: this.meta.maxHp,
      maxHp: this.meta.maxHp,
      level: this.meta.startLevel || 1,
      xp: 0,
      xpNext: xpForLevel(this.meta.startLevel || 1),
      angle: 0,
      iFrames: 0,
      secondWind: this.meta.secondWind > 0,
      shield: this.meta.startShield || 0,
      damageMul: this.meta.damage,
      attackSpeedMul: this.meta.attackSpeed,
      moveSpeedMul: 1,
      areaMul: this.meta.area,
      durationMul: this.meta.duration,
      pickupMul: 1,
      xpMul: this.meta.xpGain * (1 + (this.mod.xpGain || 0)),
      bonusProjectiles: this.meta.projectiles,
      regen: this.meta.regen,
      armor: this.meta.armor,
      critChance: this.meta.critChance,
      critDamage: this.meta.critDamage,
      baseSpeed: this.meta.moveSpeed,
      pickupBase: this.meta.pickup * (1 + (this.mod.pickup || 0)),
      deflect: this.meta.deflect,
      critExplode: this.meta.critExplode,
      critExplodeArea: this.meta.critExplodeArea || 0,
      lifestealKill: this.meta.lifestealKill,
      damageTakenMul: this.meta.damageTaken * (1 + (this.mod.damageTaken || 0)),
      bulletToXp: this.meta.bulletToXp,
      enemyBulletSlow: this.meta.enemyBulletSlow || 0,
      contactReduce: this.meta.contactReduce || 0,
      choiceBonus: this.meta.choiceCount + (this.mod.choiceCount || 0),
    };

    this.weapons = [];
    this.addWeapon(this.save.selectedWeapon);
    this.enemies = [];
    this.bullets = [];
    this.enemyBullets = [];
    this.orbs = [];
    this.mines = [];
    this.particles = [];
    this.orbiters = [];
    this.time = 0;
    this.killCount = 0;
    this.damageDealt = 0;
    this.spawnAcc = 0;
    this.bossTimer = 0;
    this.camX = 0;
    this.camY = 0;
    this.levelQueue = Math.max(0, (this.meta.startLevel || 1) - 1);
    this.running = true;
    this.paused = false;
    this.levelUpOpen = false;
    this.dead = false;
    this.last = performance.now();

    window.addEventListener("keydown", this._boundKey);
    window.addEventListener("keyup", this._boundKeyUp);
    this.canvas.addEventListener("mousemove", this._boundMove);

    if (this.levelQueue > 0) this.openLevelUp();
    this.loop();
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this._raf);
    window.removeEventListener("keydown", this._boundKey);
    window.removeEventListener("keyup", this._boundKeyUp);
    this.canvas.removeEventListener("mousemove", this._boundMove);
  }

  addWeapon(id) {
    const def = WEAPONS.find((w) => w.id === id);
    if (!def) return;
    if (this.weapons.find((w) => w.id === id)) {
      const w = this.weapons.find((w) => w.id === id);
      w.level = Math.min(8, w.level + 1);
      return;
    }
    if (this.weapons.length >= 5) return;
    this.weapons.push({
      id: def.id,
      def,
      level: 1,
      cd: 0,
      angle: 0,
    });
  }

  onKey(e) {
    this.keys[e.code] = true;
    if (e.code === "Space") {
      e.preventDefault();
      if (this.dead || this.levelUpOpen) return;
      this.paused = !this.paused;
      this.syncOverlay();
    }
    if (e.code === "Escape") {
      if (this.dead) return;
      if (this.levelUpOpen) return;
      if (this.paused) {
        this.abandon();
      } else {
        this.paused = true;
        this.syncOverlay();
      }
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
  }

  onMouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const sx = this.canvas.width / rect.width;
    const sy = this.canvas.height / rect.height;
    this.mouse.x = (e.clientX - rect.left) * sx;
    this.mouse.y = (e.clientY - rect.top) * sy;
  }

  abandon() {
    this.endRun(false);
  }

  endRun(natural) {
    if (this.dead) return;
    this.dead = true;
    this.paused = true;
    const run = {
      time: this.time,
      kills: this.killCount,
      level: this.player.level,
      damage: Math.floor(this.damageDealt),
      weaponsHeld: this.weapons.length,
    };
    const essence = awardRun(this.save, run);
    this.syncOverlay();
    const el = document.getElementById("gameover-stats");
    el.innerHTML = `
      <div><strong>Time</strong> ${formatTime(this.time)}</div>
      <div><strong>Kills</strong> ${this.killCount}</div>
      <div><strong>Level</strong> ${this.player.level}</div>
      <div><strong>Damage</strong> ${Math.floor(this.damageDealt)}</div>
      <div><strong>Essence gained</strong> ${essence}</div>
    `;
    document.getElementById("gameover-overlay").classList.remove("hidden");
    document.getElementById("pause-overlay").classList.add("hidden");
  }

  syncOverlay() {
    document.getElementById("pause-overlay").classList.toggle("hidden", !this.paused || this.dead || this.levelUpOpen);
    document.getElementById("levelup-overlay").classList.toggle("hidden", !this.levelUpOpen);
  }

  loop = () => {
    if (!this.running) return;
    const now = performance.now();
    let dt = (now - this.last) / 1000;
    this.last = now;
    dt = Math.min(0.05, dt);
    if (!this.paused && !this.dead && !this.levelUpOpen) this.update(dt);
    this.draw();
    this.updateHud();
    this._raf = requestAnimationFrame(this.loop);
  };

  update(dt) {
    this.time += dt;
    const p = this.player;
    if (p.iFrames > 0) p.iFrames -= dt;
    if (p.shield > 0) p.shield -= dt;

    let mx = 0;
    let my = 0;
    if (this.keys.KeyW || this.keys.ArrowUp) my -= 1;
    if (this.keys.KeyS || this.keys.ArrowDown) my += 1;
    if (this.keys.KeyA || this.keys.ArrowLeft) mx -= 1;
    if (this.keys.KeyD || this.keys.ArrowRight) mx += 1;
    if (mx || my) {
      const len = Math.hypot(mx, my) || 1;
      mx /= len;
      my /= len;
    }
    const spd = p.baseSpeed * p.moveSpeedMul * (1 + (this.pilot.stats.moveSpeed || 0) * 0);
    p.x += mx * spd * dt;
    p.y += my * spd * dt;

    const worldMx = this.mouse.x - W / 2 + p.x;
    const worldMy = this.mouse.y - H / 2 + p.y;
    p.angle = angleTo(p.x, p.y, worldMx, worldMy);

    if (p.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.regen * dt);

    this.camX = p.x;
    this.camY = p.y;

    this.spawnEnemies(dt);
    this.updateWeapons(dt);
    this.updateEnemies(dt);
    this.updateBullets(dt);
    this.updateEnemyBullets(dt);
    this.updateOrbs(dt);
    this.updateMines(dt);
    this.updateParticles(dt);

    this.bossTimer += dt;
    const interval = 90 * (this.mod.bossInterval || 1);
    if (this.bossTimer >= interval) {
      this.bossTimer = 0;
      this.spawnEnemy("boss");
    }
  }

  spawnEnemies(dt) {
    const t = this.time;
    const baseRate = 1.1 + t / 50;
    const rate = baseRate * (1 + (this.mod.spawnRate || 0)) * (1 - (this.meta.spawnSlow || 0));
    this.spawnAcc += dt * rate;
    while (this.spawnAcc >= 1) {
      this.spawnAcc -= 1;
      if (this.enemies.length > 180) break;
      const roll = Math.random();
      let type = "mite";
      if (t > 30 && roll < 0.25) type = "spitter";
      if (t > 50 && roll < 0.18) type = "spinner";
      if (t > 70 && roll < 0.12) type = "charger";
      const eliteChance = 0.02 + t / 4000 + (this.mod.eliteRate || 0) * 0.03;
      const eliteMin = this.mod.eliteEarly ? 40 : 90;
      if (t > eliteMin && Math.random() < eliteChance) type = "elite";
      this.spawnEnemy(type);
    }
  }

  spawnEnemy(typeId) {
    const def = ENEMY_TYPES.find((e) => e.id === typeId);
    const ang = rand(0, Math.PI * 2);
    const rad = 320 + rand(0, 120);
    const scale = 1 + this.time / 400;
    this.enemies.push({
      ...def,
      x: this.player.x + Math.cos(ang) * rad,
      y: this.player.y + Math.sin(ang) * rad,
      hp: def.hp * scale,
      maxHp: def.hp * scale,
      speed: def.speed * (1 + this.time / 600),
      shootCd: rand(0.5, 1.5),
      flash: 0,
      chargeT: 0,
      alive: true,
    });
  }

  updateWeapons(dt) {
    for (const w of this.weapons) {
      w.cd -= dt;
      const b = w.def.base;
      const cd = b.cooldown / this.player.attackSpeedMul / (1 + (w.level - 1) * 0.06);
      if (w.cd > 0) continue;
      w.cd = cd;

      const dmg =
        b.damage *
        this.player.damageMul *
        (1 + (w.level - 1) * 0.18) *
        (1 + Math.min(5, this.save.ascensionPoints) * (this.meta.ascDamage || 0));
      const count = b.count + this.player.bonusProjectiles + Math.floor((w.level - 1) / 2);
      const radius = (b.radius || 4) * this.player.areaMul;
      const nearest = this.nearestEnemy();

      if (w.def.pattern === "aimed" || w.def.pattern === "beam" || w.def.pattern === "rail") {
        const ang = nearest ? angleTo(this.player.x, this.player.y, nearest.x, nearest.y) : this.player.angle;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * 0.08;
          this.firePlayer(ang + spread, b.speed, dmg, radius, b.pierce || 1, w.def.color, w.def.pattern === "beam" ? 0.25 : 1.2);
        }
      } else if (w.def.pattern === "spread") {
        const baseAng = nearest ? angleTo(this.player.x, this.player.y, nearest.x, nearest.y) : this.player.angle;
        const cone = b.spread || 0.22;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1) / 2) * cone;
          this.firePlayer(baseAng + spread, b.speed, dmg, radius, 1, w.def.color, 0.55);
        }
      } else if (w.def.pattern === "nova") {
        for (let i = 0; i < count; i++) {
          const ang = (i / count) * Math.PI * 2 + this.time;
          this.firePlayer(ang, b.speed, dmg, radius, 1, w.def.color, 0.9);
        }
      } else if (w.def.pattern === "orbit") {
        // refresh orbiters
        this.orbiters = this.orbiters.filter((o) => o.weaponId !== w.id);
        const n = count;
        for (let i = 0; i < n; i++) {
          this.orbiters.push({
            weaponId: w.id,
            i,
            n,
            r: 48 + w.level * 4,
            dmg,
            size: radius + 4,
            color: w.def.color,
            hitCd: {},
          });
        }
      } else if (w.def.pattern === "mine") {
        for (let i = 0; i < count; i++) {
          this.mines.push({
            x: this.player.x + rand(-20, 20),
            y: this.player.y + rand(-20, 20),
            r: radius,
            dmg,
            life: (b.duration || 3) * this.player.durationMul,
            color: w.def.color,
          });
        }
      } else if (w.def.pattern === "homing") {
        for (let i = 0; i < count; i++) {
          const ang = this.player.angle + rand(-0.5, 0.5);
          this.bullets.push({
            x: this.player.x,
            y: this.player.y,
            vx: Math.cos(ang) * b.speed,
            vy: Math.sin(ang) * b.speed,
            dmg,
            size: radius,
            pierce: 1,
            life: 2.5,
            color: w.def.color,
            homing: 320,
          });
        }
      }
    }

    // orbit damage
    for (const o of this.orbiters) {
      o.angle = (o.angle || 0) + dt * 3.2;
      const ang = o.angle + (o.i / o.n) * Math.PI * 2;
      o.x = this.player.x + Math.cos(ang) * o.r;
      o.y = this.player.y + Math.sin(ang) * o.r;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (dist(o.x, o.y, e.x, e.y) < o.size / 2 + e.size / 2) {
          const key = e;
          if (!o.hitCd[key] || o.hitCd[key] <= 0) {
            this.hurtEnemy(e, o.dmg, false);
            o.hitCd[key] = 0.25;
          }
        }
      }
      for (const k of Object.keys(o.hitCd)) {
        o.hitCd[k] -= dt;
      }
    }
  }

  firePlayer(ang, speed, dmg, size, pierce, color, life = 1.2) {
    this.bullets.push({
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      dmg,
      size,
      pierce,
      life,
      color,
    });
  }

  nearestEnemy() {
    let best = null;
    let bestD = Infinity;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const d = dist(this.player.x, this.player.y, e.x, e.y);
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  updateEnemies(dt) {
    const p = this.player;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      e.flash = Math.max(0, e.flash - dt);
      let ang = angleTo(e.x, e.y, p.x, p.y);
      if (e.charge) {
        e.chargeT += dt;
        if (e.chargeT % 3 < 0.6) {
          e.x += Math.cos(ang) * e.speed * 2.4 * dt;
          e.y += Math.sin(ang) * e.speed * 2.4 * dt;
        } else {
          e.x += Math.cos(ang) * e.speed * 0.5 * dt;
          e.y += Math.sin(ang) * e.speed * 0.5 * dt;
        }
      } else {
        e.x += Math.cos(ang) * e.speed * dt;
        e.y += Math.sin(ang) * e.speed * dt;
      }

      if (dist(e.x, e.y, p.x, p.y) < e.size / 2 + 8) {
        this.hurtPlayer(e.contact * (1 - p.contactReduce));
      }

      if (e.shoot) {
        e.shootCd -= dt * (1 + (this.mod.enemyFireRate || 0));
        if (e.shootCd <= 0) {
          e.shootCd = e.shoot.cooldown;
          const spd = e.shoot.speed * (1 + (this.mod.enemyBulletSpeed || 0)) * (1 - p.enemyBulletSlow);
          if (e.shoot.ring) {
            for (let i = 0; i < e.shoot.count; i++) {
              const a = (i / e.shoot.count) * Math.PI * 2 + this.time;
              this.enemyBullets.push({
                x: e.x,
                y: e.y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                dmg: e.shoot.damage,
                size: 5,
                life: 4,
              });
            }
          } else {
            const a = angleTo(e.x, e.y, p.x, p.y);
            this.enemyBullets.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(a) * spd,
              vy: Math.sin(a) * spd,
              dmg: e.shoot.damage,
              size: 5,
              life: 4,
            });
          }
        }
      }
    }
    this.enemies = this.enemies.filter((e) => e.alive && dist(e.x, e.y, p.x, p.y) < 1400);
  }

  updateBullets(dt) {
    for (const b of this.bullets) {
      if (b.homing) {
        const t = this.nearestEnemy();
        if (t) {
          const desired = angleTo(b.x, b.y, t.x, t.y);
          const cur = Math.atan2(b.vy, b.vx);
          let diff = desired - cur;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          const spd = Math.hypot(b.vx, b.vy);
          const na = cur + clamp(diff, -b.homing * dt * 0.01, b.homing * dt * 0.01) * 8;
          b.vx = Math.cos(na) * spd;
          b.vy = Math.sin(na) * spd;
        }
      }
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (dist(b.x, b.y, e.x, e.y) < b.size / 2 + e.size / 2) {
          const crit = Math.random() < this.player.critChance;
          let dmg = b.dmg * (crit ? this.player.critDamage : 1);
          this.hurtEnemy(e, dmg, crit);
          b.pierce -= 1;
          if (b.pierce <= 0) {
            b.life = 0;
            break;
          }
        }
      }
    }
    this.bullets = this.bullets.filter((b) => b.life > 0);
  }

  updateEnemyBullets(dt) {
    const p = this.player;
    for (const b of this.enemyBullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      if (dist(b.x, b.y, p.x, p.y) < b.size / 2 + 8) {
        if (Math.random() < p.deflect) {
          b.life = 0;
          continue;
        }
        if (p.bulletToXp > 0 && Math.random() < p.bulletToXp) {
          this.spawnOrb(b.x, b.y, 1);
          b.life = 0;
          continue;
        }
        this.hurtPlayer(b.dmg);
        b.life = 0;
      }
    }
    this.enemyBullets = this.enemyBullets.filter((b) => b.life > 0 && dist(b.x, b.y, p.x, p.y) < 1200);
  }

  updateMines(dt) {
    for (const m of this.mines) {
      m.life -= dt;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (dist(m.x, m.y, e.x, e.y) < m.r / 2 + e.size / 2) {
          this.hurtEnemy(e, m.dmg, false);
          m.life = 0;
          this.burst(m.x, m.y, m.color);
          break;
        }
      }
    }
    this.mines = this.mines.filter((m) => m.life > 0);
  }

  updateOrbs(dt) {
    const p = this.player;
    const magnet = this.mod.noMagnet ? 0 : p.pickupBase * p.pickupMul;
    for (const o of this.orbs) {
      const d = dist(o.x, o.y, p.x, p.y);
      if (d < magnet) {
        const pull = clamp((magnet - d) / magnet, 0.15, 1) * 280 * dt;
        const a = angleTo(o.x, o.y, p.x, p.y);
        o.x += Math.cos(a) * pull;
        o.y += Math.sin(a) * pull;
      }
      if (d < 14) {
        o.alive = false;
        this.gainXp(o.value);
      }
    }
    this.orbs = this.orbs.filter((o) => o.alive);
  }

  updateParticles(dt) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }

  hurtEnemy(e, dmg, crit) {
    e.hp -= dmg;
    e.flash = 0.08;
    this.damageDealt += dmg;
    if (crit && this.player.critExplode > 0) {
      const r = 28 * this.player.areaMul * (1 + this.player.critExplodeArea);
      const splash = dmg * this.player.critExplode;
      for (const o of this.enemies) {
        if (!o.alive || o === e) continue;
        if (dist(e.x, e.y, o.x, o.y) < r) {
          o.hp -= splash;
          this.damageDealt += splash;
          if (o.hp <= 0) this.killEnemy(o);
        }
      }
      this.burst(e.x, e.y, "#e6c35c");
    }
    if (e.hp <= 0) this.killEnemy(e);
  }

  killEnemy(e) {
    if (!e.alive) return;
    e.alive = false;
    this.killCount += 1;
    this.spawnOrb(e.x, e.y, e.xp * (e.elite || e.boss ? 1 : 1));
    if (e.boss) this.spawnOrb(e.x, e.y, 15, true);
    if (this.player.lifestealKill) {
      this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.lifestealKill);
    }
    this.burst(e.x, e.y, e.color);
  }

  spawnOrb(x, y, value, big = false) {
    this.orbs.push({ x, y, value, big, alive: true });
  }

  burst(x, y, color) {
    for (let i = 0; i < 6; i++) {
      const a = rand(0, Math.PI * 2);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * rand(40, 120),
        vy: Math.sin(a) * rand(40, 120),
        life: rand(0.2, 0.45),
        color,
      });
    }
  }

  hurtPlayer(raw) {
    const p = this.player;
    if (this.dead || p.iFrames > 0 || p.shield > 0) return;
    const dmg = raw * (1 - p.armor) * p.damageTakenMul;
    p.hp -= dmg;
    p.iFrames = 0.45;
    if (p.hp <= 0) {
      if (p.secondWind) {
        p.secondWind = false;
        p.hp = 1;
        p.iFrames = 2;
        this.burst(p.x, p.y, "#9ff0d6");
        return;
      }
      p.hp = 0;
      this.endRun(true);
    }
  }

  gainXp(amount) {
    const p = this.player;
    p.xp += amount * p.xpMul;
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level += 1;
      p.xpNext = xpForLevel(p.level);
      this.levelQueue = (this.levelQueue || 0) + 1;
    }
    if (this.levelQueue > 0 && !this.levelUpOpen) this.openLevelUp();
  }

  openLevelUp() {
    this.levelUpOpen = true;
    this.syncOverlay();
    const choices = this.rollChoices();
    const box = document.getElementById("levelup-choices");
    box.innerHTML = "";
    for (const c of choices) {
      const btn = document.createElement("button");
      btn.className = "choice";
      btn.innerHTML = `<div class="kind">${c.kind}</div><h3>${c.name}</h3><p>${c.desc}</p>`;
      btn.onclick = () => {
        c.apply(this);
        this.levelQueue -= 1;
        if (this.levelQueue > 0) {
          this.openLevelUp();
        } else {
          this.levelUpOpen = false;
          this.syncOverlay();
        }
      };
      box.appendChild(btn);
    }
  }

  rollChoices() {
    const n = clamp(this.player.choiceBonus || 3, 2, 4);
    const options = [];
    const luck = this.meta.luck + this.player.critChance * 0.1;

    // weapon offers
    const unlocked = this.save.unlockedWeapons;
    for (const id of unlocked) {
      const existing = this.weapons.find((w) => w.id === id);
      const def = WEAPONS.find((w) => w.id === id);
      if (existing && existing.level >= 8) continue;
      if (!existing && this.weapons.length >= 5) continue;
      options.push({
        kind: existing ? `Weapon Lv${existing.level + 1}` : "New Weapon",
        name: def.name,
        desc: existing ? `Upgrade ${def.name}` : def.desc,
        weight: existing ? 1.2 : 0.7 + luck,
        apply: (g) => g.addWeapon(id),
      });
    }

    for (const m of IN_RUN_MUTATIONS) {
      options.push({
        kind: m.kind,
        name: m.name,
        desc: m.desc,
        weight: 1,
        apply: (g) => m.apply(g.player),
      });
    }

    const picked = [];
    const pool = [...options];
    for (let i = 0; i < n && pool.length; i++) {
      const choice = weightedPick(pool, (o) => o.weight * (1 + luck));
      picked.push(choice);
      pool.splice(pool.indexOf(choice), 1);
    }
    return picked;
  }

  updateHud() {
    const p = this.player;
    document.getElementById("hp-fill").style.width = `${clamp((p.hp / p.maxHp) * 100, 0, 100)}%`;
    document.getElementById("xp-fill").style.width = `${clamp((p.xp / p.xpNext) * 100, 0, 100)}%`;
    document.getElementById("hud-level").textContent = `Lv ${p.level}`;
    document.getElementById("hud-time").textContent = formatTime(this.time);
    document.getElementById("hud-kills").textContent = `${this.killCount} kills`;
    document.getElementById("hud-weapons").textContent = this.weapons.map((w) => `${w.def.name} ${w.level}`).join(" · ");
  }

  draw() {
    const ctx = this.ctx;
    const p = this.player;
    drawStarfield(ctx, W, H, this.camX, this.camY, this.time);

    const sx = (x) => x - this.camX + W / 2;
    const sy = (y) => y - this.camY + H / 2;

    for (const o of this.orbs) drawOrb(ctx, sx(o.x), sy(o.y), this.time, o.big);
    for (const m of this.mines) drawMine(ctx, sx(m.x), sy(m.y), m.r, this.time * 2);
    for (const b of this.bullets) drawBullet(ctx, sx(b.x), sy(b.y), b.color, b.size, true);
    for (const b of this.enemyBullets) drawBullet(ctx, sx(b.x), sy(b.y), "#e05a6a", b.size, false);
    for (const e of this.enemies) {
      if (!e.alive) continue;
      if (e.flash > 0) ctx.globalAlpha = 0.5;
      drawEnemy(ctx, sx(e.x), sy(e.y), e.color, e.size, e.id, this.time);
      ctx.globalAlpha = 1;
    }
    for (const o of this.orbiters) {
      drawBullet(ctx, sx(o.x), sy(o.y), o.color, o.size, true);
    }
    for (const pt of this.particles) {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = clamp(pt.life * 3, 0, 1);
      ctx.fillRect(sx(pt.x), sy(pt.y), 3, 3);
      ctx.globalAlpha = 1;
    }

    if (p.shield > 0) {
      ctx.strokeStyle = "rgba(126,200,255,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(sx(p.x), sy(p.y), 16, 0, Math.PI * 2);
      ctx.stroke();
    }
    const blink = p.iFrames > 0 && Math.floor(this.time * 20) % 2 === 0;
    if (!blink) drawShip(ctx, sx(p.x), sy(p.y), this.pilot.color, p.angle, 1.2);
  }
}
