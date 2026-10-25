// A mission with one of its `variants` applied. `delay` is the time from the start to the first moment of the road user.
export const withVariant = (m, v = {}) => {
  const r = { ...m, ...v, actor: v.actor ? { ...m.actor, ...v.actor } : m.actor };
  return r.delay === undefined ? r : { ...r, initialActorTime: -r.delay };
};
