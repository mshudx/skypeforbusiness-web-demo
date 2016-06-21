var client;
var registeredListeners = registeredListeners || [];
var lblDevices = $('<div class="status">').appendTo($('.device-manager'));

$(function () {
    'use strict';

    registeredListeners.forEach(function (listener) {
        listener.dispose();
    });
    registeredListeners = [];

    function onChanged(name, newState, reason, oldState) {
        console.log(name + ': %c' + oldState + ' -> ' + newState, 'color:green;font-weight:bold', 'Reason: ', reason);
    }


    Skype.initialize({ apiKey: config.apiKey }, function (api) {
        client = new api.application();
        // whenever client.state changes, display its value
        client.signInManager.state.changed(function (state) {
            console.log(state);
        });
        client.signInManager.signIn({
            "client_id": config.client_id, //GUID obtained from Azure app registration.
            "origins": ["https://webdir.online.lync.com/autodiscover/autodiscoverservice.svc/root"],
            "cors": true,
            "redirect_uri": config.redirect_uri, // Can be any location in the current site. (Any valid Url)
            "version": config.version
        }).then(function () {
            setupDeviceManager();
            clearExistingConversations();
            setupConversationManager();
        });

    }, function (err) {
        console.log(err);
        alert('Cannot load the SDK.');
    });


    function setupDeviceManager() {
        client.devicesManager.speakers.subscribe();
        client.devicesManager.microphones.subscribe();
        client.devicesManager.cameras.subscribe();
        // observe .speakers
        client.devicesManager.speakers.added(function (ad) {
            lblDevices.append($('<div>').text('Added speaker: ' + ad().value.id()));
            $('#spks').append($('<option/>', {
                value: ad().value.id(),
                text: ad().value.id()
            }));
        });
        client.devicesManager.speakers.removed(function (ad) {
            lblDevices.append($('<div>').text('Removed speaker: ' + ad.id()));
            $('#spks option[value="' + ad.id() + '"]')[0].remove();
        });
        // observe .microphones
        client.devicesManager.microphones.added(function (ad) {
            lblDevices.append($('<div>').text('Added mic: ' + ad.id()));
            $('#mics').append($('<option/>', {
                value: ad.id(),
                text: ad.id()
            }));
        });
        client.devicesManager.microphones.removed(function (ad) {
            lblDevices.append($('<div>').text('Removed mic: ' + ad.id()));
            $('#mics option[value="' + ad.id() + '"]')[0].remove();
        });
        // observe .cameras
        client.devicesManager.cameras.added(function (vd) {
            lblDevices.append($('<div>').text('Added camera: ' + vd.name()));
            $('#cams').append($('<option/>', {
                value: vd.name(),
                text: vd.name()
            }));
        });
        client.devicesManager.cameras.removed(function (vd) {
            lblDevices.append($('<div>').text('Removed camera: ' + vd.name()));
            $('#cams option[value="' + vd.name() + '"]')[0].remove();
        });
        // observe .selected*
        client.devicesManager.selectedSpeaker.changed(function (ad) {
            lblDevices.append($('<div>').text('Selected speaker: ' +
                (ad ? ad.value.id() : 'None')));
        });
        client.devicesManager.selectedMicrophone.changed(function (ad) {
            lblDevices.append($('<div>').text('Selected microphone: ' +
                (ad ? ad.id() : 'None')));
        });
        client.devicesManager.selectedCamera.changed(function (vd) {
            lblDevices.append($('<div>').text('Selected video: ' +
                (vd ? vd.name() : 'None')));
        });
    }
    function clearExistingConversations() {
        client.conversationsManager.conversations.get().then(function (conversationsArray) {
            if (conversationsArray && conversationsArray.length > 0) {
                $('#status').text('Disconnecting existing conversations: ' + conversationsArray.length);
                conversationsArray.forEach(function (element, index, array) {
                    console.log('Closing conversation: ' + index);
                    client.conversationsManager.conversations.remove(element);
                });
            }
        });
    }
    function setupConversationManager() {
        var addedListener = client.conversationsManager.conversations.added(function (conversation) {
            var chatService, dfdChatAccept, audioService, dfdAudioAccept, videoService, dfdVideoAccept, selfParticipant, name, timerId;
            selfParticipant = conversation.selfParticipant;
            chatService = conversation.chatService;
            audioService = conversation.audioService;
            videoService = conversation.videoService;
            if (chatService.accept.enabled()) {
                name = conversation.participants(0).person.displayName();
                if (confirm('Accept incoming chat request from ' + name + '?')) {
                    console.log('accepting the incoming chat request');
                    dfdChatAccept = chatService.accept();
                    monitor('Accepting chat request from ' + name, dfdChatAccept);
                }
                else {
                    console.log('declining the incoming chat request');
                    chatService.reject();
                }
            }
            // participant audio and video state changes
            conversation.participants.added(function (p) {
                p.video.state.changed(function (newState, reason, oldState) {
                    // a convenient place to set the video stream container 
                    if (newState == 'Connected')
                        p.video.channels(0).stream.source.sink.container(document.getElementById("renderWindow"));
                });
                p.audio.state.changed(function (newState, reason, oldState) {
                    //onChanged('_participant.audio.state', newState, reason, oldState);
                });
            });
            function onAudioVideoNotified() {
                // AV invitation may come from a 1:1 conversation only, so the caller is
                // the single participant in the participants collection
                var name = conversation.participants(0).person.displayName();
                if (selfParticipant.video.state() == 'Notified') {
                    if (confirm('Accept a video call from ' + name + '?')) {
                        console.log('accepting a video call');
                        // selfParticipant video stream container can be set before we 
                        // accept the incominng video call or after it is accepted or even 
                        // later, when the selfParticipant video state becomes "Connected"
                        dfdVideoAccept = videoService.accept();
                        monitor('Accepting video request from ' + name, dfdVideoAccept);
                    }
                    else if (confirm('Accept a video call from ' + name + ' with audio only?\n' +
                        '(You will still see the incoming video)')) {
                        console.log('accepting a video call with audio');
                        dfdAudioAccept = audioService.accept();
                        monitor('Accepting audio request from ' + name, dfdAudioAccept);
                    }
                    else {
                        console.log('declining the incoming video request');
                        videoService.reject();
                    }
                }
                else if (selfParticipant.audio.state() == 'Notified') {
                    if (confirm('Accept an audio call from ' + name + '?')) {
                        console.log('accepting the audio call');
                        dfdAudioAccept = audioService.accept();
                        monitor('Accepting audio call from ' + name, dfdAudioAccept);
                    }
                    else {
                        console.log('declining the incoming audio request');
                        audioService.reject();
                    }
                }
                timerId = null;
            }
            selfParticipant.audio.state.changed(function (newState, reason, oldState) {
                console.log('audio new state:' + newState);
                if (newState == 'Notified' && !timerId)
                    timerId = setTimeout(onAudioVideoNotified, 0);
            });
            selfParticipant.video.state.changed(function (newState, reason, oldState) {
                var selfChannel;
                console.log('video new state:' + newState);
                if (newState == 'Notified' && !timerId) {
                    timerId = setTimeout(onAudioVideoNotified, 0);
                }
                else if (newState == 'Connected') {
                    selfChannel = conversation.selfParticipant.video.channels(0);
                    selfChannel.stream.source.sink.container.set(document.getElementById("previewWindow"));
                }
            });
            conversation.state.changed(function onDisconnect(state) {
                console.log('conversations new state:' + state);

                if (state == 'Disconnected') {
                    conversation.state.changed.off(onDisconnect);
                    client.conversationsManager.conversations.remove(conversation);
                }
            });
        });
        registeredListeners.push(addedListener);
    }
    function addParticipant(conv, uri) {
        var person, participant, searchQuery;
        searchQuery = client.personsAndGroupsManager.createPersonSearchQuery();
        searchQuery.text(uri);
        return searchQuery.getMore().then(function (results) {
            person = results[0].result;
            participant = conv.createParticipant(person);
            conv.participants.add(participant);
            conv.chatService.sendMessage('Hi, meeting now!');
        });
    }
    $(".contactAdd").click(function () {
        $(".add-p-container").toggleClass("hide");
    });
    $("#btn-add-participant").click(function () {
        var conv = client.conversationsManager.conversations(0), uri = $('#txt-contact').val(), dfd;
        if (conv) {
            dfd = addParticipant(conv, uri);
        }
        $(".av-controls").show();
        $(".add-p-container").hide();
    });
    // join an online meeting and start chat
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
    // join an online meeting and start video
    $('#startVideoMeeting').click(function () {
        var uri = $('#meetingUri').text(), conv, dfd;
        conv = client.conversationsManager.getConversationByUri(uri);
        dfd = conv.videoService.start();
    });
    // start an online meeting and start chat
    $('#startNewChatMeeting').click(function () {
        var conv, dfd, meetingUri;
        conv = client.conversationsManager.createConversation();
        $('#newMeetingUri').val("");
        dfd = conv.chatService.start().then(function () {
            meetingUri = conv.uri();
            $('#newMeetingUri').val(meetingUri);
            $(".c-add-p-container").removeClass('hide');
        });
    });
    // start an online meeting and start audio
    $('#startNewAudioMeeting').click(function () {
        var conv, dfd, meetingUri;
        conv = client.conversationsManager.createConversation();
        $('#newMeetingUri').val("");
        dfd = conv.audioService.start().then(function () {
            meetingUri = conv.uri();
            $('#newMeetingUri').val(meetingUri);
            $(".c-add-p-container").removeClass('hide');
        });
    });
    // start an online meeting and start video
    $('#startNewVideoMeeting').click(function () {
        var conv, dfd, meetingUri;
        conv = client.conversationsManager.createConversation();
        $('#newMeetingUri').val("");
        dfd = conv.videoService.start().then(function () {
            meetingUri = conv.uri();
            $('#newMeetingUri').val(meetingUri);
            $(".c-add-p-container").removeClass('hide');
        });
    });
    // start video
    $('#showRemoteVideoInMeeting').click(function () {
        var conv, channel, dfd;
        if (client.conversationsManager.conversations.size() == 1) {
            conv = client.conversationsManager.conversations(0);
            channel = conv.participants(0).video.channels(0);
            channel.stream.source.sink.container(document.getElementById('renderWindow'));
            dfd = channel.isStarted.set(true);
        }
    });
    // start video
    $('#removeRemoteVideoInMeeting').click(function () {
        var conv, channel, dfd;
        if (client.conversationsManager.conversations.size() == 1) {
            conv = client.conversationsManager.conversations(0);
            channel = conv.participants(0).video.channels(0);
            dfd = channel.isStarted.set(false);
        }
    });
});
