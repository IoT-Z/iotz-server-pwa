/* eslint-disable */

function isFunction(fn) {
  return fn && {}.toString.call(fn) === '[object Function]';
}

function MakeObservable(obj, fn, triggerOnSetup = false, path = '') {
  let observable = {};
  let _observable = {};

  let counter = 0;

  for (let prop in obj) {
    let completeProp = (path ? path + '.' : '') + prop;

    _observable[prop] = obj[prop];

    if (typeof obj[prop] == 'object') {
      _observable[prop] = MakeObservable(obj[prop], fn, triggerOnSetup, completeProp);
    }

    Object.defineProperty(observable, prop, {
      get: function () {
        return _observable[prop];
      },
      set: function (newVal) {
        if (_observable[prop] != newVal) {
          let oldVal = _observable[prop];

          if (typeof newVal == 'object') {
            newVal = MakeObservable(newVal, fn, triggerOnSetup, completeProp);
          }

          _observable[prop] = newVal;

          fn(completeProp, oldVal, newVal);
        }
      },
      enumerable: true,
      configurable: true
    });

    counter++;
  }

  if (Array.isArray(obj)) {
    Object.defineProperty(observable, 'length', {
      value: counter
    });
  }

  Object.defineProperty(observable, 'get', {
    value: function get(prop) {
      return prop.split('.').reduce((nestedObject, key) => {
        if (nestedObject && key in nestedObject) {
          return nestedObject[key];
        }

        return undefined;
      }, this);
    }
  });

  Object.defineProperty(observable, 'set', {
    value: function set(prop, value) {
      let parts = prop.split('.');
      let last = parts.pop();

      let nestedObject = parts.reduce((nestedObject, key) => {
        if (nestedObject && key in nestedObject) {
          return nestedObject[key];
        }

        return undefined;
      }, this);

      nestedObject[last] = value;
    }
  });

  if (triggerOnSetup) {
    for (let prop in obj) {
      let completeProp = (path ? path + '.' : '') + prop;

      fn(completeProp, undefined, observable.get(completeProp));
    }
  }

  return observable;
}

function MakeObservableFn(obj, fn) {
  const observable = {};

  for (let prop in obj) {
    if (isFunction(obj[prop])) {
      Object.defineProperty(observable, prop, {
        value: function (...params) {
          fn(prop, params);
          obj[prop].apply(this, params);
        }
      });
    }
  }

  return observable;
}

export { MakeObservable, MakeObservableFn };
