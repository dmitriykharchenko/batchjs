(global || window).batch = new function() {
  var BatchBalancer, Worker, async_iterate, get_keys, helpers, is_array, is_function, is_object;
  is_function = function(func) {
    return typeof func === 'function';
  };
  is_array = Array.isArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };
  is_object = function(obj) {
    return obj === Object(obj);
  };
  get_keys = Object.keys || function(obj) {
    var key, keys, _i, _len;
    if (!is_object(obj)) {
      throw new TypeError('Invalid object');
    }
    keys = [];
    for (_i = 0, _len = obj.length; _i < _len; _i++) {
      key = obj[_i];
      if (obj.hasOwnProperty(key)) {
        keys[keys.length] = key;
      }
    }
    return keys;
  };
  BatchBalancer = function(limit) {
    this._start_time = +new Date();
    return this._limit = limit || 50;
  };
  BatchBalancer.prototype = {
    start: function(callback) {
      var call_date;
      call_date = +new Date();
      if (this._limit < (call_date - this._start_time)) {
        this._start_time = call_date;
        return setTimeout(callback, 0);
      } else {
        return callback();
      }
    }
  };
  helpers = {
    call_complete_handlers: function(handlers, state, balancer) {
      var handler;
      if (0 < handlers.length) {
        handler = handlers.shift();
        handler(state);
        return balancer.start(function() {
          return helpers.call_complete_handlers(handlers, state, balancer);
        });
      }
    }
  };
  async_iterate = function(iterator, batch_balancer, complete) {
    var balancer, complete_handlers, iteration, iteration_complete, iteration_initializer, keys, state;
    keys = void 0;
    iteration_initializer = null;
    balancer = batch_balancer || new BatchBalancer();
    state = {
      is_complete: false
    };
    complete_handlers = [];
    if (is_function(complete)) {
      complete_handlers.push(complete);
    }
    iteration_complete = function() {
      if (!state.result) {
        state.result = state.data;
      }
      return helpers.call_complete_handlers(complete_handlers, state, balancer);
    };
    iteration = is_function(iterator) ? function() {
      var next_index, result;
      if (state.is_wait) {
        return false;
      }
      if (keys.length !== 0 && !state.is_complete) {
        next_index = keys.shift();
        result = iterator(state.data[next_index], next_index, iteration_initializer);
        if (result !== void 0) {
          if (!state.result) {
            state.result = (is_array(state.data) ? [] : {});
          }
          state.result[next_index] = result;
        }
      } else {
        state.is_complete = true;
        iteration_complete();
        return state;
      }
      return balancer.start(iteration);
    } : function() {
      state.is_complete = true;
      state.result = state.data;
      iteration_complete();
      return state;
    };
    iteration_initializer = function(data) {
      state.data = data;
      keys = (is_array(data) || is_object(data) ? get_keys(state.data) : []);
      return balancer.start(iteration);
    };
    iteration_initializer.iterator = iterator;
    iteration_initializer.complete = function(handler) {
      complete_handlers.push(handler);
      if (state.is_complete) {
        return iteration_complete();
      }
    };
    iteration_initializer.stop = function() {
      return state.is_complete = true;
    };
    iteration_initializer.pause = function() {
      return state.is_wait = true;
    };
    iteration_initializer.resume = function() {
      state.is_wait = false;
      return balancer != null ? balancer.start(iteration) : void 0;
    };
    iteration_initializer.state = state;
    return iteration_initializer;
  };
  Worker = function(data) {
    this._last_iteration = async_iterate();
    this._last_iteration(data || []);
    this._balancer = new BatchBalancer;
    return this;
  };
  Worker.prototype = {
    _push: function(data) {
      var new_iteration;
      new_iteration = async_iterate(data.iterator, this._balancer, data.complete);
      this._last_iteration.complete(function(state) {
        return new_iteration(state.result);
      });
      this._last_iteration = new_iteration;
      return this;
    },
    stop: function() {
      this._last_iteration.stop();
      return this;
    },
    use: function(data) {
      this._push({
        complete: function(state) {
          return state.result = data;
        }
      });
      return this;
    },
    each: function(iterator) {
      this._push({
        iterator: function(value, index, flow) {
          if (iterator(value, index, flow) === false) {
            return this.stop();
          }
        }
      });
      return this;
    },
    map: function(iterator) {
      return this._push({
        iterator: iterator
      });
    },
    reduce: function(iterator) {
      var summary;
      summary = void 0;
      this._push({
        iterator: function(value, index, flow) {
          return summary = iterator(value, index, summary, flow);
        },
        complete: function(state) {
          return state.result = summary;
        }
      });
      return this;
    },
    find: function(iterator) {
      var found;
      found = void 0;
      this._push({
        iterator: function(value, index, flow) {
          if (iterator(value, index, flow)) {
            return found = value;
          }
        },
        complete: function(state) {
          return state.result = found;
        }
      });
      return this;
    },
    next: function(handler) {
      this._push({
        complete: function(state) {
          var data;
          data = handler(state.result);
          return state.result = data !== void 0 ? data : state.data;
        }
      });
      return this;
    }
  };
  return function(data) {
    return new Worker(data);
  };
};
