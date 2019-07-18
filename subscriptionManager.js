function parseSubscriptionMethod(action) {
  const items = action.split('/');
  if (items.length === 1)
    return { object: 'rootSubscriptions', actor: items[0] };
  return { object: items[0], actor: items[1] };
}

function guard(object, actor, modules, payload, timing) {
  if (
    object === 'rootSubscriptions' &&
    !modules.hasOwnProperty('rootSubscriptions')
  )
    return false;
  if (object === 'route') return false;
  if (!actor) return false;
  if (!payload) return false;
  if (!modules[object].subscriptions) return false;
  if (!modules[object].subscriptions[actor]) return false;
  if (timing && !modules[object].subscriptions[actor][timing]) return false;

  return true;
}

function configSubscriptions(store, modules, subscribeTarget, timing = null) {
  return function applySubscriptions({ type, payload }, state) {
    const { object, actor } = parseSubscriptionMethod(type);
    const passGaurd = guard(object, actor, modules, payload, timing);
    if (!passGaurd) return;
    //if timing is not null then go one level deeper to get the method
    const { method } = timing
      ? modules[object].subscriptions[actor][subscribeTarget][timing]
      : modules[object].subscriptions[actor][subscribeTarget];
    try {
      method(store, payload, state);
    } catch (error) {
      store.commit('error/error', { error });
    }
  };
}

function formatRootSubscriptions(modules) {
  return {
    ...modules,
    rootSubscriptions: { subscriptions: modules.rootSubscriptions },
  };
}
export default modules => async store => {
  if (modules.hasOwnProperty('rootSubscriptions')) {
    modules = formatRootSubscriptions(modules);
  }

  const applyMutations = configSubscriptions(store, { ...modules }, 'mutation');
  const applyBeforeActions = configSubscriptions(
    { ...store },
    { ...modules },
    'action',
    'before'
  );
  const applyAfterActions = configSubscriptions(
    { ...store },
    { ...modules },
    'action',
    'after'
  );
  store.subscribe(({ type, payload }, state) => {
    applyMutations({ type, payload }, state);
  });
  store.subscribeAction({
    before: ({ type, payload }, state) => {
      applyBeforeActions({ type, payload }, state);
    },
    after: ({ type, payload }, state) => {
      applyAfterActions({ type, payload }, state);
    },
  });
};
