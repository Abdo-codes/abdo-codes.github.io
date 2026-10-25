import { MISSIONS } from './missions.js';
import { mapPoint } from './route.js';
import { routeFor } from './routes.js';
import { actorIndexFor, actorContext } from './road-users.js';
import { CHAPTERS, chapterFor } from './chapters.js';
import { driveTarget, speedLimit } from './lesson-state.js';
import { coachFor, overlayFor } from './lesson-ui.js';
import { usingHints, isIndependent } from './practice.js';
import { DirectionAlerts } from './navigation-ui.js';
import { contextAction } from './context-action.js';
import { markersFor } from './minimap-markers.js';
import { updateLightsHud } from './lights-hud.js';
import { updateStreetHud } from './street-hud.js';
import { laneStage } from './lane-change.js';

const element = id => document.getElementById(id);
const two = number => String(number).padStart(2, '0');
export class GameUI {
  constructor(onDirectionAlert) {
    this.lastOverlay = ''; this.lastList = ''; this.lastCoach = '';
    this.directions = new DirectionAlerts(onDirectionAlert);
  }
  drawRoute(route) {
    if (route === this.route) return;
    this.route = route;
    const points = [];
    for (let d = 0; d <= route.length; d += 1) { const p = mapPoint(route.at(d), route.map); points.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`); }
    const path = `M${points.join(' L')}${route.loop ? ' Z' : ''}`;
    element('map-route').setAttribute('d', path); element('map-travel').setAttribute('d', path);
  }
  // The contextual action button (key F): Park in the parking lesson, Merge in the lessons that change lane. CSS shows it by body[data-action].
  // The overtake lesson names the button by stage: Overtake, then Back to lane from the move out to the end of the road.
  contextButton(mission, stage = 'idle') {
    const action = contextAction(mission) ?? '', slow = mission.slowSpeed ?? 10, back = mission.lane?.role === 'overtake' && ['out', 'moving-back', 'done'].includes(stage), key = `${action}:${mission.signal}:${slow}:${back}`;
    document.body.dataset.action = action; document.body.dataset.kind = mission.kind;
    if (key === this.lastAction) return;
    this.lastAction = key;
    const button = element('park'), arrow = mission.signal === 'left' !== back ? '←' : '→', word = mission.lane?.role === 'overtake' ? back ? 'Back to lane' : 'Overtake' : 'Merge';
    if (action === 'merge') {
      button.querySelector('span').textContent = arrow; button.querySelector('strong').textContent = word;
      button.setAttribute('aria-label', back ? 'Move back to the right lane (F)' : `${word} into the ${mission.signal === 'left' ? 'left' : 'right'} lane (F)`);
    } else {
      button.querySelector('span').textContent = 'P'; button.querySelector('strong').textContent = 'Park';
      button.setAttribute('aria-label', 'Park in the bakery bay (F)');
    }
    element('cruise').querySelector('strong').textContent = slow;
    element('cruise').setAttribute('aria-label', `Slow to ${slow} kilometres per hour (C)`);
  }
  toast(message) {
    clearTimeout(this.toastTimer);
    element('toast').textContent = message; element('toast').classList.add('visible');
    this.toastTimer = setTimeout(() => element('toast').classList.remove('visible'), 3500);
  }
  update(state, practised, display = null, independent = []) {
    document.body.classList.toggle('in-drive', state.status !== 'ready');
    document.body.dataset.status = state.status; document.body.dataset.mission = state.missionIndex;
    document.body.dataset.mode = state.mode;
    const stage = laneStage(state.mission, state.merge ?? null, state.distance, state.time ?? 0);
    this.contextButton(state.mission, stage);
    document.body.dataset.distance = state.distance.toFixed(2); document.body.dataset.busy = state.busy;
    const mission = state.mission, chapter = chapterFor(state.missionIndex), route = routeFor(mission);
    this.drawRoute(route);
    const number = chapter.indices.indexOf(state.missionIndex) + 1;
    const doneCount = chapter.indices.filter(index => practised.includes(MISSIONS[index].id)).length;
    const view = display ?? state;
    element('speed-limit').textContent = speedLimit(mission, view.distance);
    element('speed-limit').setAttribute('aria-label', `${speedLimit(mission, view.distance)} kilometres per hour maximum`);
    element('drive-hint').textContent = `TAP ${driveTarget(mission, state.distance)} / HOLD`;
    element('accelerate').setAttribute('aria-label', `Drive: tap for ${driveTarget(mission, state.distance)} kilometres per hour or hold to accelerate (W)`);
    element('show-hint').hidden = !isIndependent(state) || state.hintUsed || state.status !== 'driving';
    element('attempt-credit').hidden = !isIndependent(state) || !state.hintUsed || state.status !== 'driving';
    element('independent-count').textContent = `${independent.length}/${MISSIONS.length} independent passes`;
    for (const button of document.querySelectorAll('button[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
    element('speed').textContent = Math.round((display ?? state).speed);
    element('progress-count').textContent = `${doneCount} / ${chapter.indices.length}`;
    element('progress-fill').style.width = `${doneCount / chapter.indices.length * 100}%`;
    element('mission-number').textContent = `MISSION ${two(number)} / ${two(chapter.indices.length)}`;
    element('mission-title').textContent = mission.title; element('ribbon-icon').textContent = mission.icon; element('ribbon-icon').classList.toggle('long-icon', mission.icon.length >= 4);
    const distance = Math.max(0, Math.round(mission.gate - state.distance));
    element('distance-hint').textContent = state.status === 'ready' ? 'Ready when you are'
      : distance > 0 ? `${distance} m to your next decision` : mission.id === 'parking' ? 'Your bakery stop' : 'Keep going gently';
    for (const side of ['left', 'right']) {
      const button = element(`signal-${side}`); button.classList.toggle('active', state.signal === side);
      button.setAttribute('aria-pressed', String(state.signal === side));
    }
    const slow = state.cruise && state.cruiseSpeed === (mission.slowSpeed ?? 10), drive = state.cruise && state.cruiseSpeed === driveTarget(mission, state.distance);
    element('cruise').classList.toggle('active', slow); element('cruise').setAttribute('aria-pressed', String(slow));
    element('accelerate').classList.toggle('active', drive); element('accelerate').setAttribute('aria-pressed', String(drive));
    document.body.dataset.trafficWaiting = (display ?? state.snapshot()).traffic.filter(car => car.waiting).length;
    for (const id of ['accelerate', 'brake', 'cruise', 'signal-left', 'signal-right', 'park']) element(id).disabled = state.status !== 'driving';
    if (state.mission.lane?.role === 'overtake') element('park').disabled ||= !['idle', 'out'].includes(stage);
    element('camera').disabled = ['review', 'replay'].includes(state.status);
    element('pause').disabled = !['driving', 'paused'].includes(state.status);
    element('pause').textContent = state.status === 'paused' ? '▷' : 'Ⅱ';
    element('pause').setAttribute('aria-label', state.status === 'paused' ? 'Resume driving' : 'Pause driving');
    const listKey = `${state.missionIndex}:${state.mode}:${practised.join(',')}:${independent.join(',')}`;
    if (listKey !== this.lastList) {
      this.lastList = listKey;
      element('chapter-label').innerHTML = `YOUR CHAPTER <span>${chapter.number}</span>`;
      element('chapter-heading').innerHTML = chapter.heading; element('chapter-intro').textContent = chapter.intro;
      element('toolbar-chapter').textContent = `${chapter.name.toUpperCase()} / NEIGHBOURHOOD ${chapter.number}`;
      element('chapter-tabs').innerHTML = CHAPTERS.map((item, index) => `<button data-chapter="${index}" aria-pressed="${item === chapter}">${item.number} ${item.name}</button>`).join('');
      element('map-markers').innerHTML = markersFor(chapter, MISSIONS).filter(marker => marker.route === (mission.route ?? 'town')).map(marker => {
        const markerRoute = routeFor(MISSIONS[marker.index]), p = mapPoint(markerRoute.at(MISSIONS[marker.index].gate), markerRoute.map);
        return `<circle cx="${p.x}" cy="${p.y}" r="3.1" fill="#f8f5e5" stroke="#8f9e86" stroke-width=".5"/><text x="${p.x}" y="${p.y + 1.2}" text-anchor="middle" font-size="3.3" fill="#637b5d">${marker.label}</text>`;
      }).join('');
      element('lesson-outline').innerHTML = CHAPTERS.map(item => `<section><h3>${item.number} · ${item.name}</h3>${item.indices.map(index => {
        const lesson = MISSIONS[index];
        return `<button class="outline-lesson" data-mission="${index}" ${index === state.missionIndex ? 'aria-current="step"' : ''}><strong>${lesson.title}</strong><small>${lesson.skill}</small><span>${independent.includes(lesson.id) ? 'Independent pass' : practised.includes(lesson.id) ? 'Practised' : 'Try this lesson'}</span></button>`;
      }).join('')}</section>`).join('');
      element('mission-list').innerHTML = chapter.indices.map(index => {
        const item = MISSIONS[index];
        const done = practised.includes(item.id), clean = independent.includes(item.id), active = index === state.missionIndex;
        return `<button class="mission-item ${active ? 'active' : ''} ${done ? 'done' : ''}" data-mission="${index}" ${active ? 'disabled' : ''} ${active ? 'aria-current="step"' : ''} aria-label="${clean ? 'Independent pass. ' : ''}${done ? 'Practise again: ' : ''}${item.title}"><span class="mission-icon ${item.icon.length >= 4 ? 'stop-icon' : ''}">${clean ? '★' : done ? '✓' : item.icon}</span><span><strong>${item.title}</strong><small>${clean ? '★ Independent pass' : item.skill}</small></span><span class="mission-short-name" aria-hidden="true">${item.shortTitle}</span><span class="item-end">${active ? '›' : done ? '✓' : '·'}</span></button>`;
      }).join('');
    }
    const coach = coachFor(state);
    if (coach !== this.lastCoach) { element('coach-message').textContent = coach; this.lastCoach = coach; }
    element('footer-state').textContent = state.status === 'review' ? 'Showing the recorded decision' : state.status === 'replay' ? state.replayPaused ? 'Replay paused · recorded scene' : 'Replay · half speed' : 'Take your time. There is no timer.';
    const p = mapPoint(route.at((display ?? state).distance), route.map);
    element('map-player').setAttribute('cx', p.x); element('map-player').setAttribute('cy', p.y);
    const actorIndex = actorIndexFor(state.missionIndex), hazard = element('map-hazard');
    hazard.style.display = usingHints(state) && actorIndex && state.busy ? '' : 'none';
    if (actorIndex) { const h = mapPoint(actorContext(actorIndex, view, state.missionIndex).point, route.map); hazard.setAttribute('cx', h.x); hazard.setAttribute('cy', h.y); }
    hazard.setAttribute('fill', mission.kind === 'siren' ? '#3f7fe0' : mission.kind === 'priority' ? '#e3b93a' : '#dd755b');
    updateLightsHud(state, view); updateStreetHud(state, view);
    this.directions.update(state, display);
    this.overlay(state, practised);
    if (state.status === 'replay') {
      const toggle = element('overlay').querySelector('[data-action="replay-toggle"]');
      if (toggle) toggle.textContent = state.replayPaused ? 'Play replay' : 'Pause replay';
      const seek = element('overlay').querySelector('[data-replay-seek]');
      if (seek) {
        if (document.activeElement !== seek) seek.value = Math.floor(state.replayTime * 30);
        seek.setAttribute('aria-valuetext', `${state.replayTime.toFixed(1)} seconds of ${state.replayDuration.toFixed(1)} seconds`);
      }
      element('replay-clock').textContent = `${state.replayTime.toFixed(1)} / ${state.replayDuration.toFixed(1)} s${state.replayPaused ? ' · paused' : ''}`;
    }
  }
  overlay(state, practised) {
    const key = `${state.status}:${state.missionIndex}:${state.mode}:${state.variation}:${state.questionRound}:${state.result?.reason}:${state.questionError}:${practised.join(',')}`;
    if (key === this.lastOverlay) return;
    this.lastOverlay = key;
    element('overlay').innerHTML = overlayFor(state, practised);
  }
}
