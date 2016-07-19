/* globals $ io */
$(function () {
  'use strict'
  // connect the socket.io client to our webserver (assuming it's running on the same port)
  var socket = io(window.location.host)

  // create an object for storing our user
  var user = {
    name: 'anon'
  }

  // some basic form validation functions
  function disableForm (disable) {
    $('form fieldset').prop('disabled', disable)
  }
  $('#MessageForm input').on('input', function () {
    $('#sendMessage').prop('disabled', $(this).val().length === 0)
  })
  $('#JoinForm input').on('input', function () {
    $('#sendJoin').prop('disabled', $(this).val().length === 0)
  })

  // function for setting the connection status
  function status (isConnected) {
    if (isConnected) {
      $('#join').removeClass('hidden')
      $('#status').addClass('label-success').removeClass('label-danger label-default').text('connected')
    } else {
      $('main').addClass('hidden')
      $('#messages').empty()
      $('#status').addClass('label-danger').removeClass('label-success label-default').text('disconnected')
    }
    disableForm(!isConnected)
  }

  // SOCKET EVENTS
  // handle connectting to and disconnecting from the chat server
  socket.on('connect', function () {
    console.log('Connected to Chat Socket')
    status(true)
  })
  socket.on('disconnect', function () {
    console.log('Disconnected from Chat Socket')
    status(false)
  })

  // welcome message received from the server
  socket.on('welcome', function (msg) {
    console.log('Received welcome message: ', msg)
    // enable the form and add welcome message
    $('main').removeClass('hidden')
    $('#messages').prepend($('<div class="text-center">').html('<strong>' + msg + '<strong>'))
  })

  // chat message from another user
  socket.on('chat', function (msg) {
    console.log('Received message: ', msg)
    $('#messages').prepend($('<div class="alert alert-success">').html('<strong>' + msg.user.name + ':</strong> ' + msg.message))
  })

  // message received that new user has joined the chat
  socket.on('joined', function (user) {
    console.log(user.name + ' joined left the chat.')
    $('#messages').prepend($('<div class="text-center">').html('<strong>' + user.name + ' joined the chat.' + '<strong> '))
  })

  // handle leaving message
  socket.on('left', function (user) {
    console.log(user.name + ' left the chat.')
    $('#messages').prepend($('<div class="text-center">').html('<strong>' + user.name + ' left the chat.' + '<strong> '))
  })

  // keep track of who is online
  socket.on('online', function (connections) {
    var names = ''
    console.log('Connections: ', connections)
    for (var i = 0; i < connections.length; ++i) {
      if (connections[i].user) {
        if (i > 0) {
          if (i === connections.length - 1) names += ' and '
          else names += ', '
        }
        names += connections[i].user.name
      }
    }
    $('#connected').text(names)
  })

  // handle form submission for joining the chat
  $('#JoinForm').submit(function (event) {
    user.name = $('#JoinForm input').val()
    if (user.name.length === 0) return false

    console.log('Joining chat with name: ', user.name)
    socket.emit('join', user)
    $('#sendJoin').focus()

    // asuming it is will be successful so hide the form
    $('section#join').addClass('hidden')

    // halt default form behaviour
    return false
  })

  // handle form submission for sending a message
  $('#MessageForm').submit(function (event) {
    var msg = $('#MessageForm input').val()
    if (msg.length === 0) return false

    $('#MessageForm input').val('')
    console.log('Sending message: ', msg)
    socket.emit('chat', msg)

    // attach clients own message in a different style
    $('#messages').prepend($('<div class="alert alert-info text-right">').text(msg))

    // halt default form behaviour
    return false
  })
})
