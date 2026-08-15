/** Tiny procedural pixel sprites */

export function drawShip(ctx, x, y, color, angle, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fillRect(-5, -4, 12, 8);
  ctx.fillStyle = "#e8f6ff";
  ctx.fillRect(4, -2, 5, 4);
  ctx.fillStyle = "#2a8fd4";
  ctx.fillRect(-6, -6, 4, 3);
  ctx.fillRect(-6, 3, 4, 3);
  ctx.restore();
}

export function drawEnemy(ctx, x, y, color, size, kind, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  if (kind === "spinner" || kind === "elite" || kind === "boss") {
    ctx.rotate(t * (kind === "boss" ? 1.2 : 2));
  }
  const s = size;
  if (kind === "spitter") {
    ctx.beginPath();
    ctx.moveTo(0, -s / 2);
    ctx.lineTo(s / 2, s / 2);
    ctx.lineTo(-s / 2, s / 2);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "charger") {
    ctx.fillRect(-s / 2, -s / 3, s, (s * 2) / 3);
    ctx.fillStyle = "#fff3";
    ctx.fillRect(s / 4, -s / 4, s / 4, s / 2);
  } else if (kind === "boss") {
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.fillStyle = "#210834";
    ctx.fillRect(-s / 4, -s / 4, s / 2, s / 2);
    ctx.fillStyle = "#fff";
    ctx.fillRect(-3, -3, 6, 6);
  } else {
    ctx.fillRect(-s / 2, -s / 2, s, s);
    if (kind === "elite") {
      ctx.strokeStyle = "#ffd0d0";
      ctx.lineWidth = 2;
      ctx.strokeRect(-s / 2 - 2, -s / 2 - 2, s + 4, s + 4);
    }
  }
  ctx.restore();
}

export function drawBullet(ctx, x, y, color, size, friendly) {
  ctx.fillStyle = color;
  if (friendly) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }
}

export function drawOrb(ctx, x, y, t, big = false) {
  const r = big ? 6 : 3.5;
  ctx.fillStyle = big ? "#e6c35c" : "#7ec8ff";
  ctx.globalAlpha = 0.85 + Math.sin(t * 8 + x) * 0.15;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function drawMine(ctx, x, y, r, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(t);
  ctx.fillStyle = "#e6c35c";
  ctx.fillRect(-r / 2, -r / 2, r, r);
  ctx.fillStyle = "#e05a6a";
  ctx.fillRect(-2, -2, 4, 4);
  ctx.restore();
}

export function drawStarfield(ctx, w, h, camX, camY, t) {
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    const sx = ((i * 97 + camX * 0.15) % w + w) % w;
    const sy = ((i * 53 + camY * 0.15) % h + h) % h;
    const a = 0.25 + (i % 5) * 0.1;
    ctx.fillStyle = `rgba(180,210,255,${a})`;
    ctx.fillRect(sx, sy, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1);
  }
  // subtle nebula wash
  const g = ctx.createRadialGradient(w * 0.3, h * 0.2, 10, w * 0.3, h * 0.2, w * 0.5);
  g.addColorStop(0, "rgba(30,60,90,0.18)");
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}
