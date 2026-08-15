# Shardfall

A simple 2D survivor / bullet-hell game with deep meta progression.

## Play

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Controls

- **WASD / Arrow keys** — move
- **Left virtual stick** (phones / tablets) — move
- **Auto-fire** — weapons aim at nearest enemies
- **Space** or **Pause (II)** — pause / resume
- **Esc** (while paused) or **Abandon** — end run and return rewards
- **Resume / Abandon** buttons on the pause overlay (touch-friendly)

## Meta progression

- **Essence** — earned each run; spend on Core upgrades, pilots, weapons, relics
- **Core Systems** — permanent stat tree (HP, damage, luck, deflect, relic slots, …)
- **Pilots** — unique run identities with different tradeoffs
- **Arsenal** — unlock starting weapons and expand the in-run pool
- **Relics** — equip limited permanent artifacts
- **Modifiers** — risk options that multiply essence
- **Codex** — milestones that unlock new systems
- **Synergies** — hidden bonuses from specific combinations
- **Ascension** — reset Core/essence for Ascension Points and a lasting damage multiplier

Progress is saved in `localStorage`.
