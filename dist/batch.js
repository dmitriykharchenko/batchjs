window.batch = new function() {
  var BatchBalancer, Worker, get_keys, is_array, is_function, is_object, iteration_flow;
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
  BatchBalancer = function(limit, stack_limit) {
    this.stack_depth = 0;
    this._stack_limit = stack_limit || 5000;
    this._start_time = +new Date();
    return this._limit = limit || 50;
  };
  BatchBalancer.prototype = {
    start: function(callback) {
      var call_date;
      call_date = +new Date();
      if (this._limit < (call_date - this._start_time) || this._stack_limit <= this.stack_depth) {
        this._start_time = call_date;
        this.stack_depth = 0;
        return setTimeout(callback, 0);
      } else {
        this.stack_depth++;
        return callback();
      }
    }
  };
  iteration_flow = function(iterator, balancer) {
    this.iterator = iterator;
    this.balancer = balancer;
    this.state = {};
    this._handlers = [];
    if (!this.balancer) {
      this.balancer = new BatchBalancer();
    }
    return this;
  };
  iteration_flow.prototype = {
    _call_complete_handlers: function() {
      var handler, handler_result,
        _this = this;
      if (0 < this._handlers.length) {
        handler = this._handlers.shift();
        handler_result = handler(this.result, this.state);
        if (handler_result !== void 0) {
          this.result = handler_result;
        }
        return this.balancer.start(function() {
          return _this._call_complete_handlers();
        });
      }
    },
    init: function(data) {
      var keys,
        _this = this;
      this.data = data;
      this.is_array_data = is_array(data);
      keys = (this.is_data_array || is_object(data) ? get_keys(data) : []);
      if (!is_function(this.iterator)) {
        this.iteration = function() {
          _this.state.is_complete = true;
          _this.result = _this.data;
          return _this._call_complete_handlers();
        };
      } else {
        this.iteration = function() {
          var next_index, result;
          if (_this.state.is_wait) {
            return false;
          }
          if (keys.length !== 0 && !_this.state.is_complete) {
            next_index = keys.shift();
            if (_this.is_array_data) {
              next_index = +next_index;
            }
            result = _this.iterator(_this.data[next_index], next_index, _this);
            if (result !== void 0) {
              if (!_this.result) {
                _this.result = (_this.is_array_data ? [] : {});
              }
              _this.result[next_index] = result;
            }
            return _this.balancer.start(_this.iteration);
          } else {
            _this.state.is_complete = true;
            return _this._call_complete_handlers();
          }
        };
      }
      return this.start();
    },
    start: function() {
      return this.balancer.start(this.iteration);
    },
    stop: function() {
      return this.state.is_complete = true;
    },
    pause: function() {
      return this.state.is_wait = true;
    },
    resume: function() {
      this.state.is_wait = false;
      return this.start();
    },
    on_complete: function(handler) {
      if (is_function(handler)) {
        this._handlers.push(handler);
        if (this.state.is_complete) {
          return this._call_complete_handlers();
        }
      }
    }
  };
  Worker = function(data) {
    this._last_iteration = new iteration_flow();
    this._last_iteration.init(data || []);
    this._balancer = new BatchBalancer;
    return this;
  };
  Worker.prototype = {
    _push: function(data) {
      var new_iteration;
      new_iteration = new iteration_flow(data.iterator, this._balancer);
      new_iteration.on_complete(data.complete);
      this._last_iteration.on_complete(function(data, state) {
        return new_iteration.init(data);
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
        complete: function() {
          return data;
        }
      });
      return this;
    },
    each: function(iterator) {
      var _this = this;
      this._push({
        iterator: function(value, index, flow) {
          var result;
          result = iterator(value, index, flow);
          if (result === false) {
            return flow.stop();
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
        complete: function(data, state) {
          return summary;
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
            found = value;
            return flow.stop();
          }
        },
        complete: function(state) {
          return found;
        }
      });
      return this;
    },
    next: function(handler) {
      this._push({
        complete: function(result, state) {
          handler(result);
          return void 0;
        }
      });
      return this;
    }
  };
  return function(data) {
    return new Worker(data);
  };
};
