# requirejs-async v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/requirejs-async
# Freely distributable under the MIT license.
#
# Easy async working with huge amount of data


define [], ->
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

  async_iterate = (iterator, complete) ->
    keys = undefined
    balancer = null
    state = is_complete: false
    complete_handlers = []
    complete_handlers.push complete  if _.isFunction(complete)
    call_complete_handlers = ->
      if 0 < complete_handlers.length
        handler = complete_handlers.shift()
        handler state
        balancer.start call_complete_handlers

    iteration_complete = ->
      state.result = state.data unless state.result
      call_complete_handlers()

    iteration = if _.isFunction iterator then ->
      if keys.length isnt 0 and not state.is_complete
        next_index = keys.shift()
        result = iterator state.data[next_index], next_index
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

    iteration_initializer = (data, batch_balancer) ->
      balancer = batch_balancer or new BatchBalancer()
      state.data = data
      keys = (if _.isArray(data) or _.isObject(data) then _.keys(state.data) else [])
      balancer.start iteration

    iteration_initializer.iterator = iterator
    iteration_initializer.complete = (handler) ->
      complete_handlers.push handler
      iteration_complete() if state.is_complete

    iteration_initializer.stop = ->
      state.is_complete = true

    iteration_initializer.state = state
    iteration_initializer

  Worker = (data) ->
    @_last_iteration = async_iterate()
    @_last_iteration data or []
    @_balancer = new BatchBalancer
    @

  Worker:: =
    _push: (data) ->
      new_iteration = async_iterate(data.iterator, data.complete)
      @_last_iteration.complete (state) =>
        new_iteration state.result, @_balancer

      @_last_iteration = new_iteration
      @
    stop: ->
      @_last_iteration.stop()
      @
    after: (handler) ->
      @_push complete: (state) ->
        data = handler(state.result)
        state.result = (if not _.isUndefined(data) then data else state.data)

    pick: (data) ->
      @_push complete: (state) ->
        state.result = data
      @

    each: (iterator) ->
      @_push iterator: (value, index) ->
        data = iterator(value, index)
        @stop()  if data is false
      @


    map: (iterator) ->
      @_push iterator: iterator

    reduce: (iterator) ->
      summary = undefined
      @_push
        iterator: (value, index) ->
          summary = iterator(value, index, summary)

        complete: (state) ->
          state.result = summary
      @


    find: (iterator) ->
      found = undefined
      @_push
        iterator: (value, index) ->
          found = value  if iterator(value, index)

        complete: (state) ->
          state.result = found
      @


    complete: (handler) ->
      @_push complete: (state) ->
        handler state.result
      @


  (data) ->
    new Worker(data)