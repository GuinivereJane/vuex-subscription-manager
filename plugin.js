import modules from './modules';

function parseSubscriptionMethod(action) {
  const items = action.split('/');
  return { object: items[0], method: items[1] };
}

function guard(type, payload) {
  const { object, method } = parseSubscriptionMethod(type);
  if (object === 'route') return false;
  if (!method) return false;
  if (!payload) return false;
  if (!modules[object].subscriptions) return false;
  if (!modules[object].subscriptions[method]) return false;
  return { object, method };
}
function configSubscriptions(store) {
  return function config({ type, payload }, state) {
    const passGaurd = guard(type, payload);
    if (passGaurd === false) return () => false;
    const { object, method } = passGaurd;
    return function subscribe() {
      if (typeof modules[object].subscriptions[method] !== 'undefined')
        modules[object].subscriptions[method](store, payload, state);
    };
  };
}

function configActionSubscriptions(store) {
  return function config({ type, payload }, state) {
    try {
      const passGaurd = guard(type, payload);
      if (passGaurd === false) throw 'no_subscription';
      const { object, method } = passGaurd;
      return () => modules[object].subscriptions[method];
    } catch (e) {
      return () => ({ timing: false });
    }
  };
}

export default store => {
  const applySubscriptions = configSubscriptions(store);
  const applyActions = configActionSubscriptions(store);
  store.subscribe(({ type, payload }, state) => {
    try {
      applySubscriptions({ type, payload }, state)();
    } catch (error) {
      store.commit('error/error', { error });
    }
  });

  store.subscribeAction({
    before: ({ type, payload }, state) => {
      const { timing, method } = applyActions({ type, payload }, state)();
      if (timing === 'before') {
        try {
          method({ type, payload }, state)();
        } catch (error) {
          store.commit('error/error', { error });
        }
      }
    },
    after: ({ type, payload }, state) => {
      const { timing, method } = applyActions({ type, payload }, state)();
      if (timing === 'after') {
        try {
          method(store, payload, state);
        } catch (error) {
          store.commit('error/error', { error });
        }
      }
    },
  });
};
