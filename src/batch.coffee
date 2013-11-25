# batch.js v 0.0.1
# (c) 2012 Dmitriy Kharchenko
# https://github.com/aki-russia/batchjs
# Freely distributable under the MIT license.
#
# Easy async working with huge amount of data


window.batch = new () ->

  #### Utitity helpers
  # Got from underscore.js (http://underscorejs.org/)
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

    keys = []
    for key in obj 
      if obj.hasOwnProperty key
        keys[keys.length] = key

    keys


  # Some hardcoded defaults for BatchBalancer.
  # There should be better way for that :-)

  balancer_defaults =
    stack_limit: 5000,
    block_limit: 50

  
  #### BatchBalancer(limit, stack_limit)
  # Allows to make huge amout of calls without blocked UI

  BatchBalancer = (limit, stack_limit) ->
    @stack_depth = 0
    @_stack_limit = stack_limit or balancer_defaults.stack_limit
    @_start_time = +new Date()
    @_limit = limit or balancer_defaults.block_limit

  BatchBalancer:: =

  ##### BatchBalancer::next(callback)
  # Takes callback and balancing between sync or async call to callback function.
    next: (callback) ->
      call_date = +new Date()

      # brakes if time or stack limit exeeded
      is_block_limit_exceed = @_limit < (call_date - @_start_time)
      is_stack_overflow = @_stack_limit <= @stack_depth

      if is_block_limit_exceed or is_stack_overflow
        @_start_time = call_date
        @stack_depth = 0
        setTimeout callback, 0
      else
        @stack_depth++
        callback()

  #### IterationFlow(iterator, balancer)
  # Initialize with iterator and balancer, and receives data on start.
  # Controls start/stop of iterations, also collects data and calls complete callbacks when done

  # Such way of initalizing is for sake of asyncronus nature, 
  # when initialising new interation flow, there still might be no data for it.
  # Data appears after previous flow is done.

  IterationFlow = (@iterator, @balancer) ->
    @state = {}
    @_handlers = []

    if not @balancer
      @balancer = new BatchBalancer()

    @

  IterationFlow:: =

    ##### IterationFlow::_call_complete_handlers()
    # Calls complete callbacks with BatchBalancer

    _call_complete_handlers: () ->
      if 0 < @_handlers.length
        handler = @_handlers.shift()
        handler_result = handler @result, @state

        if handler_result isnt undefined
          @result = handler_result

        @balancer.next =>
          @_call_complete_handlers()


    ##### IterationFlow::start(data)
    # Initializes iteration function for data.
    # If iteration flow didn't received iterator, then makes empty one, which  only completes flow and calls complete handlers

    start: (data) ->
      if @_iteration
        if not @state.is_complete
          @balancer.next @_iteration
        else
          @_call_complete_handlers()
      else 
        @data = data
        @is_array_data = is_array(@data)
        keys = (if @is_data_array or is_object(@data) then get_keys(@data) else [])

        #empty iterator
        if not is_function @iterator

          @_iteration = () =>

            @state.is_complete = true
            @result = @data
            @_call_complete_handlers()

        else 

        # iteration function, gets next key (or index), takes data for this key and calls iterator callback.
        # When comes to the end, calls complete handlers
          @_iteration = () =>

            # stops if flow is paused
            return false if @state.is_wait

            if keys.length isnt 0 and not @state.is_complete
              next_index = keys.shift()

              if @is_array_data
                next_index = +next_index

              result = @iterator @data[next_index], next_index, @

              # collecting data from iterator callback
              if result isnt undefined
                @result = (if @is_array_data then [] else {}) unless @result
                @result[next_index] = result

              @balancer.next @_iteration
            else
              @state.is_complete = true
              @_call_complete_handlers()

        @balancer.next @_iteration
      

    ##### IterationFlow::stop()
    # Stops iterations and cause calling complete handlers,
    # since that there is no way to resume iterations
    stop: () ->
      @state.is_complete = true

    ##### IterationFlow::pause()
    # Pauses iterations without calling complete handlers,
    # it can be resumed later with IterationFlow::resume() method

    pause: () ->
      @state.is_wait = true


    ##### IterationFlow::resume()
    # Resumes iterations.

    resume: () ->
      @state.is_wait = false
      @start()

    ##### IterationFlow::on_complete()
    # Binds handler to complete of this flow

    on_complete: (handler) ->
      if is_function handler
        @_handlers.push handler

        if @state.is_complete
          @_call_complete_handlers()



  #### Stream
  # Consumes data and iterator for it, chain it with previous iteration flow and return result to complete callbacks

  Stream = (data) ->
    @_flow = new IterationFlow()
    @_flow.start data or []

    @_balancer = new BatchBalancer
    @

  Stream:: =

    ##### Stream::_push(data)
    # creates new iterations flow and chains it to previous one
    # 'data' should contain iterator function or/and complete handler.

    _push: (data) ->
      new_flow = new IterationFlow(data.iterator, @_balancer)
      new_flow.on_complete data.complete

      @_flow.on_complete (data, state) ->
        new_flow.start data

      @_flow = new_flow
      @

    ##### Stream::stop()
    # stops current flow

    stop: ->
      @_flow.stop()
      @

    ##### Stream::use(data)
    # set data for any next iterations

    use: (data) ->
      @_push complete: () ->
        data
      @


    ##### Stream::each(iterator)
    # calls iterator for each element in data
    # stops if iterator return false

    each: (iterator) ->
      @_push iterator: (value, index, flow) =>
        result = iterator(value, index, flow)
        flow.stop() if result is false
      @

    ##### Stream::map(transformator)
    # Produces new hash or array (depends of source data) 
    # by mapping elements from source through a 'transformator' function

    map: (transformator) ->
      @_push
        iterator: transformator


    ##### Stream::reduce(iterator, summary_initial)
    # Converts data into a single value.
    # Initial state of reduce value can be set in second argument.
    # Iterator for 'reduce()' method accepts additional 3rd argument 'summary',
    # ('flow' is 4th in this case)

    reduce: (iterator, summary_initial) ->
      summary = summary_initial
      @_push
        iterator: (value, index, flow) ->
          result = iterator(value, index, summary, flow)
          if result isnt undefined
            summary = result

        complete: (data, state) ->
          summary
      @

    ##### Stream::find(iterator)
    # finds first element in collection

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


    ##### Stream::next(handler)
    # binds handler to complete of current flow

    next: (handler) ->
      @_flow.on_complete (result, state) ->
        handler(result)
        return undefined
      @


  (data) ->
    new Stream(data)