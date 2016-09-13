﻿var client;
$(function () {
    'use strict';
    function onChanged(name, newState, reason, oldState) {
        console.log(name + ': %c' + oldState + ' -> ' + newState, 'color:green;font-weight:bold', 'Reason: ', reason);
    }
    Skype.initialize({ apiKey: config.apiKey }, function (api) {
        client = new api.application();
        // whenever client.state changes, display its value
        client.signInManager.state.changed(function (state) {
            console.log(state);
        });
    }, function (err) {
        console.log(err);
        alert('Cannot load the SDK.');
    });
    $('#meetingUri').keypress(function (evt) {
        if (evt.keyCode === 13) {
            evt.preventDefault();
            $("#signin").click();
        }
    });
    // when the user clicks on the "Sign In" button
    $('#signin').click(function () {
        // SignIn as anonymous user using conference URI
        client.signInManager.signIn({
          auth: function (req, send) {
              req.headers['Authorization'] = 'Bearer cwt=' + $('#accessToken').val();
              return send(req);
          },
          cors: true,
          domain: $('#domain').val()
        }).then(function () {
            console.log('Signed in as: ' + client.personsAndGroupsManager.mePerson.displayName());
            $("#sign-in").addClass("disable");
            //Create a conversation object for this conference:
            //var conversation = application.conversationsManager.getConversationByUri(uri);

            var addedListener = client.conversationsManager.conversations.added(function (conversation) {
                var chatService, audioService, videoService;
                chatService = conversation.chatService;
                audioService = conversation.audioService;
                videoService = conversation.videoService;
                // participant audio and video state changes
                conversation.participants.added(function (p) {
                    p.video.state.changed(function (newState, reason, oldState) {
                        onChanged('_participant.video.state', newState, reason, oldState);
                        // a convenient place to set the video stream container
                        if (newState === 'Connected') {
                            p.video.channels(0).stream.state.changed(function (ns, r, os) {
                                onChanged('_participant.video.channels(0).stream.state', ns, r, os);
                            });
                            // setTimeout is a workaround
                            setTimeout(function () {
                                p.video.channels(0).stream.source.sink.container.set(document.getElementById("renderWindow")).then(function () {
                                    setTimeout(function () {
                                        p.video.channels(0).isStarted(true);
                                    }, 0);
                                });
                            }, 6000);
                        }
                    });
                    p.audio.state.changed(function (newState, reason, oldState) {
                        onChanged('_participant.audio.state', newState, reason, oldState);
                    });
                });
                conversation.selfParticipant.audio.state.changed(function (newState, reason, oldState) {
                    onChanged('selfParticipant.audio.state', newState, reason, oldState);
                });
                conversation.selfParticipant.video.state.changed(function (newState, reason, oldState) {
                    var selfChannel;
                    onChanged('selfParticipant.video.state', newState, reason, oldState);
                    if (newState === 'Connected') {
                        // ...or even here
                        selfChannel = conversation.selfParticipant.video.channels(0);
                        selfChannel.stream.source.sink.container.set(document.getElementById("previewWindow")).then(function () {
                            selfChannel.isStarted(true);
                        });
                    }
                });
            });
        }, function (error) {
            // if something goes wrong in either of the steps above,
            // display the error message
            console.error(error);
            alert(error || 'Cannot sign in');
        });
    });
    // join conference and start chat
    $('#startChatMeeting').click(function () {
        var uri = $('#meetingUri').text(), conv, dfd;
        conv = client.conversationsManager.getConversationByUri(uri);
        dfd = conv.chatService.start().then(function () {
            conv.chatService.sendMessage('Hi');
        });
    });
    // join an online meeting and start audio
    $('#startAudioMeeting').click(function () {
        var uri = $('#meetingUri').text(), conv, dfd;
        conv = client.conversationsManager.getConversationByUri(uri);
        dfd = conv.audioService.start();
    });
    // join confernece and start video
    $('#startVideoMeeting').click(function () {
        var uri = $('#meetingUri').text(), conv, dfd;
        conv = client.conversationsManager.getConversationByUri(uri);
        dfd = conv.videoService.start();
    });
    // end conversation
    $('#end').click(function () {
        var conv = client.conversationsManager.conversations(0), dfd;
        if (conv) {
            dfd = conv.leave();
            dfd.then(function () {
                client.conversationsManager.conversations.remove(conv);
                window.location.reload();
            });
        }
    });
    // when the user clicks on the "Sign Out" button
    $('#signout').click(function () {
        // start signing out
        client.signInManager.signOut()
            .then(function () {
                // report the success
                alert('Signed out');
            }, function (error) {
                // or a failure
                alert(error || 'Cannot sign out');
            });
    });
});
