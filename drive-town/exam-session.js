import { EXAM_SECONDS, PASS_AT } from './exam-config.js';
import { isValidAnswer, isAnswered } from './exam-grade.js';
import { summarise } from './exam-result.js';
import { bankVersion } from './exam-items.js';

const VERSION = 1;
const shuffled = (n, random) => { const out = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } return out; };
const isPermutation = (perm, n) => Array.isArray(perm) && perm.length === n && [...perm].sort((a, b) => a - b).every((v, i) => v === i);
const SHUFFLED = new Set(['choice', 'multi', 'order']);

// One run of an exam or a drill. No DOM, no location. The clock is injected (`now`).
// perms[i] lists the original choice indexes in screen order. Answers always use the original indexes.
export class ExamSession {
  constructor(items, { random = Math.random, now = Date.now, seconds = EXAM_SECONDS, passAt = PASS_AT, id, counts = true, feedback = 'end',
    scenes = {}, perms, startedAt, fresh = 0, bankVersion: version } = {}) {
    this.items = items; this.now = now; this.seconds = seconds; this.passAt = passAt; this.counts = counts; this.feedback = feedback; this.scenes = scenes;
    this.id = id ?? `r${now().toString(36)}${Math.floor(random() * 1e6).toString(36)}`; this.fresh = fresh; this.bankVersion = version ?? null;
    this.perms = perms ?? items.map(item => item.choices && SHUFFLED.has(item.type) && !item.fixedOrder ? shuffled(item.choices.length, random) : (item.choices ?? []).map((_, i) => i));
    this.startedAt = startedAt ?? now(); this.deadline = seconds === null ? null : this.startedAt + seconds * 1000; this.endedAt = null;
    this.answers = items.map(() => null); this.marked = new Set(); this.checked = new Set(); this.index = 0; this.phase = 'running'; this.reason = null;
  }
  get item() { return this.items[this.index]; }
  get finished() { return this.phase === 'finished'; }
  get remaining() {
    if (this.seconds === null) return null;
    return Math.max(0, Math.ceil((this.deadline - (this.endedAt ?? this.now())) / 1000));
  }
  get answeredCount() { return this.items.filter((item, i) => isAnswered(item, this.answers[i])).length; }
  isAnswered(i) { return isAnswered(this.items[i], this.answers[i]); }
  pinsOf(item) { return this.scenes[item.scene]?.pins?.map(pin => pin.id) ?? []; }
  // Instant feedback (drill): an answer is locked once it is checked.
  isChecked(i = this.index) { return this.feedback === 'instant' && this.checked.has(i); }

  goto(i) { if (this.finished || !Number.isInteger(i) || i < 0 || i >= this.items.length) return false; this.index = i; this.phase = 'running'; return true; }
  next() { if (this.finished) return; if (this.index + 1 < this.items.length) this.goto(this.index + 1); else this.openOverview(); }
  prev() { if (!this.finished && this.index > 0) this.goto(this.index - 1); }
  openOverview() { if (!this.finished) this.phase = 'overview'; }
  closeOverview() { if (this.phase === 'overview') this.phase = 'running'; }
  toggleMark(i = this.index) { if (this.finished) return false; if (!this.marked.delete(i)) this.marked.add(i); return this.marked.has(i); }

  // Stores an answer. A value of the wrong shape is ignored. null clears the answer.
  answer(value, i = this.index) {
    if (this.finished || this.isChecked(i)) return false;
    const item = this.items[i];
    if (value !== null && !isValidAnswer(item, value, this.pinsOf(item))) return false;
    this.answers[i] = value;
    if (this.feedback === 'instant' && ['yesno', 'choice', 'hotspot'].includes(item.type) && value !== null) this.checked.add(i);
    return true;
  }
  // Instant feedback: the "Check answer" button of multi, fill and order items.
  check(i = this.index) { if (!this.finished && this.feedback === 'instant' && this.isAnswered(i)) this.checked.add(i); return this.checked.has(i); }

  tick() {
    if (this.finished || this.seconds === null || this.now() < this.deadline) return false;
    this.finish('time'); return true;
  }
  finish(reason = 'handed-in') {
    if (this.finished) return;
    this.phase = 'finished'; this.reason = reason;
    this.endedAt = this.deadline === null ? this.now() : Math.min(this.now(), this.deadline);
  }
  result() { return summarise(this); }

  toJSON() {
    return { v: VERSION, id: this.id, ids: this.items.map(item => item.id), perms: this.perms, answers: this.answers, marked: [...this.marked], checked: [...this.checked],
      index: this.index, phase: this.phase === 'overview' ? 'running' : this.phase, reason: this.reason, startedAt: this.startedAt, endedAt: this.endedAt, seconds: this.seconds,
      passAt: this.passAt, counts: this.counts, feedback: this.feedback, fresh: this.fresh, bankVersion: this.bankVersion };
  }

  // Rebuilds a session. Never throws: returns null when the data does not fit the bank. One bad answer is dropped.
  static fromJSON(json, bank, opts = {}) {
    try {
      if (!json || json.v !== VERSION || !Array.isArray(json.ids) || !json.ids.length) return null;
      const byId = new Map(bank.map(item => [item.id, item])), items = json.ids.map(id => byId.get(id));
      if (items.some(item => !item) || json.bankVersion !== (opts.bankVersion ?? bankVersion(bank))) return null;
      if (!Array.isArray(json.perms) || json.perms.length !== items.length || !items.every((item, i) => isPermutation(json.perms[i], item.choices?.length ?? 0))) return null;
      if (!Array.isArray(json.answers) || json.answers.length !== items.length) return null;
      if (![json.startedAt, json.passAt === null ? 0 : json.passAt].every(Number.isFinite) || !(json.seconds === null || Number.isFinite(json.seconds))) return null;
      const session = new ExamSession(items, { ...opts, id: String(json.id), perms: json.perms, startedAt: json.startedAt, seconds: json.seconds, passAt: json.passAt,
        counts: Boolean(json.counts), feedback: json.feedback === 'instant' ? 'instant' : 'end', fresh: Number(json.fresh) || 0, bankVersion: json.bankVersion });
      session.answers = json.answers.map((value, i) => value !== null && isValidAnswer(items[i], value, session.pinsOf(items[i])) ? value : null);
      const inRange = v => Number.isInteger(v) && v >= 0 && v < items.length;
      session.marked = new Set((json.marked ?? []).filter(inRange)); session.checked = new Set((json.checked ?? []).filter(inRange));
      session.index = inRange(json.index) ? json.index : 0;
      if (json.phase === 'finished') { session.phase = 'finished'; session.reason = json.reason === 'time' ? 'time' : 'handed-in'; session.endedAt = Number.isFinite(json.endedAt) ? json.endedAt : session.startedAt; }
      else session.tick();
      return session;
    } catch { return null; }
  }
}
