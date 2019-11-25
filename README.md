#Vuex Subscription Manager

##What is Vuex Subscription Manager
Vuex Subscription Manger is a small Vuex plugin that you can use to manage subscriptions to Actions and Mutations in your Vuex store [Vuex subscriptions docs](https://vuex.vuejs.org/api/#subscribe).  Additionally it can be used to eliminate intra store dependencies.  

Usage Demo: https://github.com/GuinivereJane/demo-veux-subscription-manager

##Set Up

**Installation**

Use the following at the command line to add the package to your project

    npm i vuex-subscription-manager

**Configuration**

Add the following to the import statments in your store.js file

    import subscriptionManager from 'vuex-subscription-manager';

Add the following before your export statment
    
    const subscriptions = subscriptionManager(modules);

Add the subscriptions to your plugins
    
    plugins: [subscriptions]


your store.js file should look something like this....

    import Vue from 'vue';
    import Vuex from 'vuex';
    import modules from './modules';
    import subscriptionManager from 'vuex-subscription-manager';
    Vue.use(Vuex);

    const subscriptions = subscriptionManager(modules);   

    export default new Vuex.Store({
      modules: {
        ...modules,
      },
      plugins: [subscriptions],

      ...

      });

You are now ready to start using Vuex Subscritption Manager !!


In order to use subscriptions within a particular module all you need to do is add a subscriptions.js file to the module 

    - store
      - error
      - index.js
      - actions.js
      - mutations.js
      - subscritpions.js

and then in yout index.js file you can import it in the same way that you import your the other files for your module

    import mutations from './mutations';
    import subscriptions from './subscriptions';

    const state = {};

    const namespaced = true;

    export default {
      namespaced,
      state,
      mutations,
      subscriptions,
    };



##subscription.js format

Your subscription.js files need to export a JSON object that defines the actions and mutations within the module that you wish to add subscriptions to

A subscritption needs to indicate the name of the method is is subscribing too, whether or not it is subscribing to a mutation or an action, and in the case of an action it also needs to know whether to run before or after the action has taken place.  You also need to include the method you want the subscription to execute when it is triggered

*note, it is possible to have multiple subscriptions on the same Action or Mutation, or on Actions and Muations of the same name, to do this you need to nest the type within the method in the JSON object*

**Subscribe to a Mutation**

      [method] subscribed to':{
        [type]:{
          method: function({ dispatch }, payload = {}, state) {
            ...
            do stuff here
            ...
          }
      }
    }

  *Example*

    error: {
      mutation: {
        method: function(store, payload, state) {
        store.commit('snackbar/show', {message: payload.error.message })
        }
      },
    }

**Subscribe to an Action**

  *you do not need to include both a before and an after, one or the other or both are fine as needed

    [method subscribed to]:{
      [type]:{
        'timing':{
          method: function({ dispatch }, payload = {}, state) {
            ...
            do stuff here
            ...
          }
        }
      }
    }

  *Example*

    login: {
      action: {
        before: {
          method: function({ dispatch }, payload = {}, state) {
            console.log('Before Login Action)
          },
        },
        after: {
          method: function({ dispatch }, payload = {}, state) {
            console.log('After Login Action')
          },
        },
      },
    },


**Full Example of a subscriptions.js file**

    export default {
      login: {
        action: {
          before: {
            method: function({ dispatch }, payload = {}, state) {
              console.log('Before Login Action)
            },
          },
          after: {
            method: function({ dispatch }, payload = {}, state) {
              dispatch('user/fetch', payload);
            },
          },
        },
      },
      logout: {
        mutation: {
          method: function({ commit }, payload = {}, state) {
            commit('resetState');
          },
        },
      },
    };

**Root Level Subscriptions**

As you do not import your root level store.js in your modules folder any subscriptions that you need to be triggered by mutations or actions in your store.js file require a little more configuration.

- include a subscriptions,js in the root level of your store with the same structure as any other subscritpions file.
- add the following import to your modules.js (or whatever you call the file that you use to import your modules into your store)

    `import rootSubscriptions from './subscriptions';`

- and then export that along with the other modules in your store 

        export default {
          rootSubscriptions,
        }
  
*Example*

    // UI stores
    import menu from './menu';
    import snackbar from './snackbar';
    import overlay from './overlay';

    // Data stores
    import user from './user';

    // Form stores
    import loginForm from './forms/login';

    // Error store
    import error from './error';

    //root subscriptions
    import rootSubscriptions from './subscriptions';

    export default {
      rootSubscriptions,
      error,
      menu,
      snackbar,
      overlay,
      user,
      loginForm,
    };

_note that you **must** name import your root level subscriptions file as 'rootSubscriptions' or you will have a bad day_

For a very basic example of this package in action, check out https://github.com/GuinivereJane/demo-veux-subscription-manager !

##Suggested Usage (AKA reasons I built this thing)

I wrote this package to address the follow twothree structral issues in my code

**As the number of subscritpions in my store began to grow I needed a good way to orgainze them**

**I wanted to eliminate dependancies between my stores**

  I really don't like calling commits or mutations for one store from within another.  It looks awkward, but, more importantly it creates dependancies between the stores.  If I trigger an action in my auth store from an action in my user store, and then the auth store is changed or removed, there is the possibility of a breaking change in my user store.  If I move the dispatch for the auth action outside of the user actions and into the subscritptions the user actions will still work if auth changes/breaks/is removed. The subscriptions may now break instead, but if these fail the user store still functions.  

**Sometimes I really want to dispatch an asynchronous action when I commit a mutation.**

  I cannot do that from within the mutation (mutations are supposed to be pure functions !!) but, I can subscribe to the mutation and dispatch that same action when the mutation executes, keeping the mutation pure.  A good example of this is after a successful auth attempt for a user I want to get some additional information about the user and stick it in the store.  I don't want to do this before I know whether the auth attempt is successful (for, I hope, obvious reasons).  Also, I need the token returned from auth to hit the second end point (in this example the auth service is seperate from the user information serivce).  I know that when a mutation that updates the store with the auth token is triggered that the auth attempt has been successful and that I have the auth token available, so I can confidently subscribe to that and trigger the action to get more information only once I know the auth token has been commited.  If auth fails, the commit will not be triggered and my subscription will not execute.   A bit contrived maybe, and sure, there are other ways to do this, but I think it makes the point and I like doing it this way :p 

