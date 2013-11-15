# batch.js v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/batchjs
# Freely distributable under the MIT license.
#
# Easy async working with huge amount of data


window.batch = new () ->

  #
  # Utitity helpers, got from underscore.js (http://underscorejs.org/)
  #
  is_function = (func) ->
    typeof func is 'function'

  is_array = Array.isArray or (obj) ->
    toString.call(obj) is '[object Array]'

  is_object = (obj) ->
    obj is Object obj

  get_keys = Object.keys or (obj) ->
    if not is_object obj
      throw new TypeError 'Invalid object'

    keys = [];
    for key in obj 
      if obj.hasOwnProperty key
        keys[keys.length] = key

    keys


  BatchBalancer = (limit, stack_limit) ->
    @stack_depth = 0;
    @_stack_limit = stack_limit or 5000;
    @_start_time = +new Date()
    @_limit = limit or 50

  BatchBalancer:: =
    start: (callback) ->
      call_date = +new Date()
      if @_limit < (call_date - @_start_time) or @_stack_limit <= @stack_depth
        @_start_time = call_date
        @stack_depth = 0;
        setTimeout callback, 0
      else
        @stack_depth++
        callback()

  iteration_flow = (@iterator, @balancer) ->
    @state = {}
    @_handlers = []

    if not @balancer
      @balancer = new BatchBalancer()

    @

  iteration_flow:: =
    _call_complete_handlers: () ->
      if 0 < @_handlers.length
        handler = @_handlers.shift()
        handler_result = handler @result, @state

        if handler_result isnt undefined
          @result = handler_result

        @balancer.start =>
          @_call_complete_handlers()

    init: (data) ->

      @data = data
      @is_array_data = is_array(data)
      keys = (if @is_data_array or is_object(data) then get_keys(data) else [])

      if not is_function @iterator

        @iteration = () =>

          @state.is_complete = true
          @result = @data
          @_call_complete_handlers()

      else 

        @iteration = () =>
          return false if @state.is_wait

          if keys.length isnt 0 and not @state.is_complete
            next_index = keys.shift()
            if @is_array_data
              next_index = +next_index

            result = @iterator @data[next_index], next_index, @
            if result isnt undefined
              @result = (if @is_array_data then [] else {}) unless @result
              @result[next_index] = result

            @balancer.start @iteration
          else
            @state.is_complete = true
            @_call_complete_handlers()

      @start()
      

    start: () ->
      @balancer.start @iteration

    stop: () ->
      @state.is_complete = true

    pause: () ->
      @state.is_wait = true

    resume: () ->
      @state.is_wait = false
      @start()


    on_complete: (handler) ->
      if is_function handler
        @_handlers.push handler

        if @state.is_complete
          @_call_complete_handlers()


  Worker = (data) ->
    @_last_iteration = new iteration_flow()
    @_last_iteration.init data or []

    @_balancer = new BatchBalancer
    @

  Worker:: =
    _push: (data) ->
      new_iteration = new iteration_flow(data.iterator, @_balancer)
      new_iteration.on_complete data.complete

      @_last_iteration.on_complete (data, state) ->
        new_iteration.init data

      @_last_iteration = new_iteration
      @

    stop: ->
      @_last_iteration.stop()
      @

    use: (data) ->
      @_push complete: () ->
        data
      @

    each: (iterator) ->
      @_push iterator: (value, index, flow) =>
        result = iterator(value, index, flow)
        flow.stop() if result is false
      @


    map: (iterator) ->
      @_push
        iterator: iterator

    reduce: (iterator) ->
      summary = undefined
      @_push
        iterator: (value, index, flow) ->
          summary = iterator(value, index, summary, flow)

        complete: (data, state) ->
          summary
      @


    find: (iterator) ->
      found = undefined
      @_push
        iterator: (value, index, flow) ->
          if iterator(value, index, flow)
            found = value
            flow.stop()

        complete: (state) ->
          found
      @


    next: (handler) ->
      @_push complete: (result, state) ->
        handler(result)
        return undefined
      @


  (data) ->
    new Worker(data)