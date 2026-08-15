import { loadSave } from "./save.js";
import { evaluateCodex } from "./meta.js";
import { UI } from "./ui.js";

const save = loadSave();
evaluateCodex(save);
const ui = new UI(save);

// Expose for quick debugging in console
window.SHARDFALL = { save, ui };
