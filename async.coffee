# requirejs-async v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/requirejs-async
# Freely distributable under the MIT license.
#
# Easy async working with huge amount of data


define ["underscore"], (_) ->
  BatchBalancer = (limit) ->
    @_start_time = +new Date()
    @_limit = limit or 50

  BatchBalancer:: =
    start: (callback) ->
      call_date = +new Date()
      if @_limit < (call_date - @_start_time)
        @_start_time = call_date
        _.delay callback
      else
        callback()

  helpers = 
    call_complete_handlers: (handlers, state, balancer) ->
      if 0 < handlers.length
        handler = handlers.shift()
        handler state
        balancer.start ->
          helpers.call_complete_handlers handlers, state, balancer


  async_iterate = (iterator, batch_balancer, complete) ->
    keys = undefined
    iteration_initializer = null
    balancer = batch_balancer or new BatchBalancer()
    state = is_complete: false
    complete_handlers = []
    complete_handlers.push complete  if _.isFunction(complete)

    iteration_complete = ->
      state.result = state.data unless state.result
      helpers.call_complete_handlers complete_handlers, state, balancer

    iteration = if _.isFunction iterator then ->
      return false if state.is_wait
      if keys.length isnt 0 and not state.is_complete
        next_index = keys.shift()
        result = iterator state.data[next_index], next_index, iteration_initializer
        if result isnt undefined
          state.result = (if _.isArray state.data then [] else {}) unless state.result
          state.result[next_index] = result
      else
        state.is_complete = true
        iteration_complete()
        return state

      balancer.start iteration

    else ->
      state.is_complete = true
      state.result = state.data
      iteration_complete()
      state

    iteration_initializer = (data) ->
      state.data = data
      keys = (if _.isArray(data) or _.isObject(data) then _.keys(state.data) else [])
      balancer.start iteration

    iteration_initializer.iterator = iterator

    iteration_initializer.complete = (handler) ->
      complete_handlers.push handler
      iteration_complete() if state.is_complete

    iteration_initializer.stop = ->
      state.is_complete = true

    iteration_initializer.pause = () ->
      state.is_wait = true

    iteration_initializer.resume = () ->
      state.is_wait = false
      balancer?.start iteration

    iteration_initializer.state = state
    iteration_initializer

  Worker = (data) ->
    @_last_iteration = async_iterate()
    @_last_iteration data or []
    @_balancer = new BatchBalancer
    @

  Worker:: =
    _push: (data) ->
      new_iteration = async_iterate(data.iterator, @_balancer, data.complete)
      @_last_iteration.complete (state) ->
        new_iteration state.result

      @_last_iteration = new_iteration
      @

    stop: ->
      @_last_iteration.stop()
      @

    use: (data) ->
      @_push complete: (state) ->
        state.result = data
      @

    each: (iterator) ->
      @_push iterator: (value, index, flow) ->
        @stop() if iterator(value, index, flow) is false
      @


    map: (iterator) ->
      @_push iterator: iterator

    reduce: (iterator) ->
      summary = undefined
      @_push
        iterator: (value, index, flow) ->
          summary = iterator(value, index, summary, flow)

        complete: (state) ->
          state.result = summary
      @


    find: (iterator) ->
      found = undefined
      @_push
        iterator: (value, index, flow) ->
          found = value  if iterator(value, index, flow)

        complete: (state) ->
          state.result = found
      @


    next: (handler) ->
      @_push complete: (state) ->
        data = handler(state.result)
        state.result = (if not _.isUndefined(data) then data else state.data)
      @


  (data) ->
    new Worker(data)