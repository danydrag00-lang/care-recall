/* Browser-local answer revisions shared across Study Room, Library and Practice.
 * Never writes edits to the public GitHub repository.
 */
(() => {
  "use strict";
  const KEY = "care-recall-answer-edits-v1";
  const data = window.CARE_DATA?.questions || [];
  const byId = new Map(data.map(q => [Number(q.id), q]));
  const originals = new Map();
  let storage = null;
  try { storage = window.localStorage; } catch (_) { storage = null; }
  let values = {};
  try {
    const raw = storage?.getItem(KEY);
    const input = raw ? JSON.parse(raw) : {};
    if (input && typeof input === "object" && !Array.isArray(input)) values = input;
  } catch (_) { values = {}; }
  for (const q of data) {
    for (const type of ["short", "full"]) {
      const key = q.id + ":" + type;
      originals.set(key, String(q[type] || ""));
      if (typeof values[key] === "string" && values[key].trim() && values[key].length <= 10000) {
        q[type] = values[key];
      } else {
        delete values[key];
      }
    }
  }
  function keyFor(id, type) {
    if (!byId.has(Number(id)) || !["short", "full"].includes(type))
      throw new Error("Unknown question or answer version.");
    return Number(id) + ":" + type;
  }
  function persist() {
    try { storage?.setItem(KEY, JSON.stringify(values)); return true; }
    catch (_) { return false; }
  }
  window.CareRecallEdits = {
    has(id, type) {
      try { return Object.hasOwn(values, keyFor(id, type)); }
      catch (_) { return false; }
    },
    text(id, type) {
      const key = keyFor(id, type);
      return byId.get(Number(id))[type];
    },
    original(id, type) { return originals.get(keyFor(id, type)); },
    save(id, type, text) {
      const key = keyFor(id, type);
      const value = String(text ?? "").trim();
      if (!value) throw new Error("Your answer cannot be empty.");
      if (value.length > 10000) throw new Error("Keep your answer under 10,000 characters.");
      if (value === originals.get(key)) delete values[key];
      else values[key] = value;
      byId.get(Number(id))[type] = value;
      return {saved: persist(), changed: Object.hasOwn(values, key)};
    },
    reset(id, type) {
      const key = keyFor(id, type);
      delete values[key];
      byId.get(Number(id))[type] = originals.get(key);
      return persist();
    }
  };
})();
