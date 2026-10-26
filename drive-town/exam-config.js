// Mock exam settings. CBR (since 7 April 2025): one test of 50 questions, 30 minutes, pass at 44.
// Replay of a clip is not confirmed by CBR text: change `replay` here if CBR says otherwise.
export const EXAM_SIZE = 50, EXAM_SECONDS = 1800, EXTRA_SECONDS = 2700, PASS_AT = 44;
export const DRILL_SIZE = 10, MAX_SAME_TYPE_RUN = 3, HISTORY_LIMIT = 10;
export const DEV_CLOCK = { min: 10, max: 1800 }; // ?examSeconds=60 shortens the clock for browser tests
export const CLIP = { replay: true, minLead: 2, maxLead: 5 };
export const LIMITS = { prompt: 25, explanation: 25, choice: 12, describe: 40, firstChoiceShare: .7 };
export const DEFAULT_PREFS = { dutch: true, singleKeys: true, chooseN: true, extra: false };
