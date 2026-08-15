import { formatTime, formatNum } from "./utils.js";
import {
  CORE_UPGRADES,
  PILOTS,
  WEAPONS,
  RELICS,
  MODIFIERS,
  CODEX,
  upgradeCost,
  buyCore,
  unlockPilot,
  unlockWeapon,
  unlockRelic,
  toggleModifier,
  computeMetaStats,
  canAscend,
  ascendPreview,
  doAscend,
  reqMet,
  isCodexUnlocked,
  getActiveSynergies,
  modifierMultiplier,
  coreTotalLevel,
} from "./meta.js";
import { Game } from "./game.js";

export class UI {
  constructor(save) {
    this.save = save;
    this.game = null;
    this.bindTabs();
    this.bindActions();
    this.refresh();
  }

  bindTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`panel-${tab.dataset.tab}`).classList.add("active");
      });
    });
  }

  bindActions() {
    document.getElementById("btn-start").addEventListener("click", () => this.startRun());
    document.getElementById("btn-to-hub").addEventListener("click", () => this.toHub());
  }

  refresh() {
    const s = this.save;
    document.getElementById("hub-essence").textContent = `Essence: ${formatNum(s.essence)}`;
    document.getElementById("hub-ascension").textContent = `Ascension: ${s.ascensionPoints} (×${s.ascensionMult.toFixed(2)})`;
    document.getElementById("hub-best").textContent = `Best: ${formatTime(s.stats.bestTime)}`;

    const { stats, pilot } = computeMetaStats(s);
    const weapon = WEAPONS.find((w) => w.id === s.selectedWeapon);
    const relics = s.equippedRelics.map((id) => RELICS.find((r) => r.id === id)?.name).filter(Boolean);
    document.getElementById("loadout-summary").textContent = `${pilot.name} · ${weapon?.name || "?"} · ${relics.length} relics`;
    document.getElementById("loadout-details").innerHTML = `
      <li>Pilot: <strong>${pilot.name}</strong> — ${pilot.desc}</li>
      <li>Weapon: <strong>${weapon?.name}</strong></li>
      <li>Relics (${s.equippedRelics.length}/${stats.relicSlots}): ${relics.join(", ") || "none"}</li>
      <li>Modifiers: ${s.activeModifiers.length ? s.activeModifiers.join(", ") : "none"} (×${modifierMultiplier(s).toFixed(2)} essence)</li>
      <li>Synergies: ${getActiveSynergies(s).map((x) => x.name).join(", ") || "none"}</li>
      <li>Core levels: ${coreTotalLevel(s)} · HP ${stats.maxHp} · DMG ×${stats.damage.toFixed(2)}</li>
    `;

    const last = s.stats.lastRun;
    document.getElementById("last-run").innerHTML = last
      ? `<div><strong>Time</strong> ${formatTime(last.time)} · <strong>Kills</strong> ${last.kills}</div>
         <div><strong>Level</strong> ${last.level} · <strong>Essence</strong> +${last.essence}</div>`
      : "No runs yet.";

    this.renderUpgrades();
    this.renderPilots();
    this.renderWeapons();
    this.renderRelics(stats);
    this.renderModifiers();
    this.renderCodex();
    this.renderAscend();
  }

  cardButton(label, disabled, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    b.disabled = !!disabled;
    b.addEventListener("click", onClick);
    return b;
  }

  renderUpgrades() {
    const box = document.getElementById("upgrade-list");
    box.innerHTML = "";
    for (const u of CORE_UPGRADES) {
      const lvl = this.save.cores[u.id] || 0;
      const locked = !reqMet(this.save, u.req);
      const cost = upgradeCost(u, lvl);
      const card = document.createElement("div");
      card.className = `meta-card ${locked ? "locked" : ""} ${lvl > 0 ? "owned" : ""}`;
      card.innerHTML = `
        <h3>${u.name}</h3>
        <p>${u.desc}</p>
        <div class="meta">
          <span class="badge">${lvl}/${u.max}</span>
          <span>${locked ? "Requires codex" : lvl >= u.max ? "MAX" : cost + " essence"}</span>
        </div>
      `;
      const btn = this.cardButton(lvl >= u.max ? "Maxed" : "Upgrade", locked || lvl >= u.max || this.save.essence < cost, () => {
        buyCore(this.save, u.id);
        this.refresh();
      });
      card.querySelector(".meta").appendChild(btn);
      box.appendChild(card);
    }
  }

  renderPilots() {
    const box = document.getElementById("pilot-list");
    box.innerHTML = "";
    for (const p of PILOTS) {
      const owned = this.save.unlockedPilots.includes(p.id);
      const locked = !owned && !reqMet(this.save, p.unlockReq);
      const selected = this.save.selectedPilot === p.id;
      const card = document.createElement("div");
      card.className = `meta-card ${locked ? "locked" : ""} ${selected ? "selected" : ""} ${owned ? "owned" : ""}`;
      card.innerHTML = `
        <h3 style="color:${p.color}">${p.name}</h3>
        <p>${p.desc}</p>
        <div class="meta">
          <span class="badge">${owned ? "Owned" : locked ? "Locked" : p.unlockCost + " essence"}</span>
        </div>
      `;
      const btn = this.cardButton(selected ? "Selected" : owned ? "Select" : "Unlock", selected || locked || (!owned && this.save.essence < p.unlockCost), () => {
        unlockPilot(this.save, p.id);
        this.refresh();
      });
      card.querySelector(".meta").appendChild(btn);
      box.appendChild(card);
    }
  }

  renderWeapons() {
    const box = document.getElementById("weapon-list");
    box.innerHTML = "";
    for (const w of WEAPONS) {
      const owned = this.save.unlockedWeapons.includes(w.id);
      const locked = !owned && !reqMet(this.save, w.unlockReq);
      const selected = this.save.selectedWeapon === w.id;
      const card = document.createElement("div");
      card.className = `meta-card ${locked ? "locked" : ""} ${selected ? "selected" : ""} ${owned ? "owned" : ""}`;
      card.innerHTML = `
        <h3 style="color:${w.color}">${w.name}</h3>
        <p>${w.desc}</p>
        <div class="meta">
          <span class="badge">${w.pattern}</span>
          <span>${owned ? (selected ? "Starting" : "In pool") : locked ? "Locked" : w.unlockCost + " essence"}</span>
        </div>
      `;
      const btn = this.cardButton(selected ? "Equipped" : owned ? "Start with" : "Unlock", selected || locked || (!owned && this.save.essence < w.unlockCost), () => {
        unlockWeapon(this.save, w.id);
        this.refresh();
      });
      card.querySelector(".meta").appendChild(btn);
      box.appendChild(card);
    }
  }

  renderRelics(stats) {
    document.getElementById("relic-slots").textContent = `Slots ${this.save.equippedRelics.length} / ${stats.relicSlots}`;
    const box = document.getElementById("relic-list");
    box.innerHTML = "";
    for (const r of RELICS) {
      const owned = this.save.unlockedRelics.includes(r.id);
      const locked = !owned && !reqMet(this.save, r.unlockReq);
      const equipped = this.save.equippedRelics.includes(r.id);
      const card = document.createElement("div");
      card.className = `meta-card ${locked ? "locked" : ""} ${equipped ? "selected" : ""} ${owned ? "owned" : ""}`;
      card.innerHTML = `
        <h3>${r.name}</h3>
        <p>${r.desc}</p>
        <div class="meta">
          <span class="badge gold">${owned ? (equipped ? "Equipped" : "Owned") : locked ? "Locked" : r.unlockCost + " essence"}</span>
        </div>
      `;
      const label = !owned ? "Unlock" : equipped ? "Unequip" : "Equip";
      const btn = this.cardButton(label, locked || (!owned && this.save.essence < r.unlockCost), () => {
        unlockRelic(this.save, r.id);
        this.refresh();
      });
      card.querySelector(".meta").appendChild(btn);
      box.appendChild(card);
    }
  }

  renderModifiers() {
    const box = document.getElementById("modifier-list");
    box.innerHTML = "";
    for (const m of MODIFIERS) {
      const locked = !reqMet(this.save, m.unlockReq);
      const on = this.save.activeModifiers.includes(m.id);
      const card = document.createElement("div");
      card.className = `meta-card ${locked ? "locked" : ""} ${on ? "selected" : ""}`;
      card.innerHTML = `
        <h3>${m.name}</h3>
        <p>${m.desc}</p>
        <div class="meta">
          <span class="badge warn">×${m.essenceMul.toFixed(2)} essence</span>
        </div>
      `;
      const btn = this.cardButton(locked ? "Locked" : on ? "Active" : "Enable", locked, () => {
        toggleModifier(this.save, m.id);
        this.refresh();
      });
      card.querySelector(".meta").appendChild(btn);
      box.appendChild(card);
    }
  }

  renderCodex() {
    const box = document.getElementById("codex-list");
    box.innerHTML = "";
    for (const c of CODEX) {
      const done = isCodexUnlocked(this.save, c.id);
      const card = document.createElement("div");
      card.className = `meta-card ${done ? "owned" : "locked"}`;
      card.innerHTML = `
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
        <p>${c.reward}</p>
        <div class="meta"><span class="badge ${done ? "" : "danger"}">${done ? "Complete" : "Incomplete"}</span></div>
      `;
      box.appendChild(card);
    }
  }

  renderAscend() {
    const box = document.getElementById("ascend-panel");
    const ready = canAscend(this.save);
    const prev = ascendPreview(this.save);
    box.innerHTML = `
      <p>Ascension Points: <strong>${this.save.ascensionPoints}</strong> · Damage mult: <strong>×${this.save.ascensionMult.toFixed(2)}</strong></p>
      <div class="stat-block">
        Next ascent grants <strong>+${prev.gain}</strong> AP and mult → <strong>×${prev.newMult}</strong>.<br/>
        Resets essence to 0 and all Core levels. Pilots, weapons, relics, codex, and AP remain.<br/>
        Requirement: 2000 essence <em>or</em> 25 total Core levels.
      </div>
    `;
    const btn = document.createElement("button");
    btn.className = "cta";
    btn.textContent = ready ? "ASCEND" : "NOT READY";
    btn.disabled = !ready;
    btn.addEventListener("click", () => {
      if (!confirm("Ascend? Core upgrades and essence will reset.")) return;
      doAscend(this.save);
      this.refresh();
    });
    box.appendChild(btn);
  }

  startRun() {
    document.getElementById("hub").classList.add("hidden");
    document.getElementById("game-wrap").classList.remove("hidden");
    document.getElementById("gameover-overlay").classList.add("hidden");
    document.getElementById("pause-overlay").classList.add("hidden");
    document.getElementById("levelup-overlay").classList.add("hidden");
    if (this.game) this.game.stop();
    this.game = new Game(document.getElementById("game"), this.save, () => this.toHub());
    this.game.start();
  }

  toHub() {
    if (this.game) this.game.stop();
    document.getElementById("game-wrap").classList.add("hidden");
    document.getElementById("hub").classList.remove("hidden");
    this.refresh();
  }
}
