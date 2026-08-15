/**
 * Virtual left-stick for mobile / touch play.
 * Uses Pointer Events so one finger steals the stick without scrolling the page.
 */
export class TouchControls {
  constructor({ zone, base, knob, onPause }) {
    this.zone = zone;
    this.base = base;
    this.knob = knob;
    this.onPause = onPause;
    this.active = false;
    this.pointerId = null;
    this.x = 0;
    this.y = 0;
    this.origin = { x: 0, y: 0 };
    this.maxTravel = 48;
    this.enabled = false;

    this._onDown = (e) => this.onDown(e);
    this._onMove = (e) => this.onMove(e);
    this._onUp = (e) => this.onUp(e);
  }

  static isTouchPreferred() {
    return (
      (typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0)) ||
      window.matchMedia("(hover: none), (pointer: coarse)").matches ||
      window.matchMedia("(max-width: 900px)").matches
    );
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.zone.classList.add("visible");
    this.zone.addEventListener("pointerdown", this._onDown);
    window.addEventListener("pointermove", this._onMove);
    window.addEventListener("pointerup", this._onUp);
    window.addEventListener("pointercancel", this._onUp);
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.zone.classList.remove("visible");
    this.resetStick();
    this.zone.removeEventListener("pointerdown", this._onDown);
    window.removeEventListener("pointermove", this._onMove);
    window.removeEventListener("pointerup", this._onUp);
    window.removeEventListener("pointercancel", this._onUp);
  }

  onDown(e) {
    if (this.pointerId !== null) return;
    if (e.target.closest && e.target.closest("button, .overlay, .choice")) return;
    e.preventDefault();
    this.pointerId = e.pointerId;
    this.active = true;
    const rect = this.zone.getBoundingClientRect();
    // Anchor stick under finger within the left zone
    const cx = Math.min(Math.max(e.clientX, rect.left + 56), rect.right - 56);
    const cy = Math.min(Math.max(e.clientY, rect.top + 56), rect.bottom - 56);
    this.origin.x = cx;
    this.origin.y = cy;
    this.base.style.left = `${cx - rect.left - 56}px`;
    this.base.style.top = `${cy - rect.top - 56}px`;
    this.base.style.bottom = "auto";
    this.base.classList.add("active");
    this.setKnob(0, 0);
    try {
      this.zone.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  onMove(e) {
    if (!this.active || e.pointerId !== this.pointerId) return;
    e.preventDefault();
    const dx = e.clientX - this.origin.x;
    const dy = e.clientY - this.origin.y;
    const len = Math.hypot(dx, dy) || 1;
    const capped = Math.min(len, this.maxTravel);
    const nx = (dx / len) * capped;
    const ny = (dy / len) * capped;
    this.x = nx / this.maxTravel;
    this.y = ny / this.maxTravel;
    this.setKnob(nx, ny);
  }

  onUp(e) {
    if (e.pointerId !== this.pointerId) return;
    this.resetStick();
  }

  resetStick() {
    this.active = false;
    this.pointerId = null;
    this.x = 0;
    this.y = 0;
    this.base.classList.remove("active");
    this.setKnob(0, 0);
    this.base.style.left = "";
    this.base.style.top = "";
    this.base.style.bottom = "";
  }

  setKnob(nx, ny) {
    this.knob.style.transform = `translate(${nx}px, ${ny}px)`;
  }

  vector() {
    if (!this.enabled) return { x: 0, y: 0 };
    const mag = Math.hypot(this.x, this.y);
    if (mag < 0.12) return { x: 0, y: 0 };
    return { x: this.x, y: this.y };
  }
}
