
function parseSubscriptionMethod(action) {
  const items = action.split('/');
  return { object: items[0], actor: items[1] };
}

function guard(type, modules, payload) {
  const { object, actor } = parseSubscriptionMethod(type);
  if (object === 'route') return false;
  if (!actor) return false;
  if (!payload) return false;
  if (!modules[object].subscriptions) return false;
  if (!modules[object].subscriptions[actor]) return false;
  return { object, actor };
}

function configSubscriptions(store, modules, subcribeTarget, when = null) {
  return function config({ type, payload }, state) {
    const passGaurd = guard(type, modules, payload);
    if (passGaurd === false) return;
    const { object, actor } = passGaurd;
    const { trigger, timing, method } = modules[object].subscriptions[actor];
    if (subcribeTarget === trigger) {
      if (subcribeTarget === 'mutation' || (when && when === timing)) {
        try {
          method(store, payload, state);
        } catch (error) {
          store.commit('error/error', { error });
        }
      }
    }
  };
}

subscriptionManager = modules => store => {
  const applyMutations = configSubscriptions(store, modules, 'mutation');
  const applyBeforeActions = configSubscriptions(store, 'action', 'before');
  const applyAfterActions = configSubscriptions(store, 'action', 'after');
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

module.exports = subscriptionManager;