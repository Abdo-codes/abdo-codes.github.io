// The success text of a street lesson, picked from what the player did (state.summary, filled while driving by street-notes.js).
export function streetSuccess(state) {
  const { mission, summary = {} } = state, lane = mission.lane;
  if (lane.role === 'tram') {
    return summary.waitedStop && summary.waitedCross ? 'You gave the passengers time and let the tram go first.'
      : summary.waitedStop ? 'You gave the passengers time.' : summary.waitedCross ? 'You let the tram go first.' : 'The road was clear. You passed with care.';
  }
  if (lane.role === 'cycle') return summary.pair ? 'You waited behind the cyclists.' : summary.slowed ? 'You slowed down early and gave the cyclist room.' : 'The road was clear. You drove on with care.';
  const f1 = lane.sign === 'F1' ? ' Sign F1 bans motor vehicles from passing each other. A cyclist is not a motor vehicle, so you may pass it if the other rules allow.' : '';
  if (summary.passed) return (lane.go ? 'You checked the line and the road ahead. You passed with a signal, then moved back.' : 'You waited until it was safe. Then you passed with a signal.') + f1;
  return (lane.go ? 'You could pass here. Waiting is also fine.' : 'You stayed behind because passing was not allowed or not safe.') + f1;
}
