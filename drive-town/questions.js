import { MISSIONS } from './missions.js';

export function ruleQuestion(index, round = 0, variation = 0) {
  const bank = MISSIONS[index].questions, turn = Math.max(0, Math.trunc(round));
  const original = bank[(turn + Math.abs(Math.trunc(variation))) % bank.length];
  // Changed scenarios after mistakes, with answer positions rotated on each new question.
  const shift = (turn + Math.abs(Math.trunc(variation))) % original.choices.length;
  return { ...original, choices: [...original.choices.slice(shift), ...original.choices.slice(0, shift)],
    correct: (original.correct - shift + original.choices.length) % original.choices.length };
}
