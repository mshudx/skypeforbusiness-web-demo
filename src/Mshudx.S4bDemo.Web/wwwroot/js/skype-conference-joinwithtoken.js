var client;
var registeredListeners = registeredListeners || [];
var conv;

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
            client_id: config.client_id, //GUID obtained from Azure app registration.
            origins: ["https://webdir.online.lync.com/autodiscover/autodiscoverservice.svc/root"],
            cors: true,
            redirect_uri: config.redirect_uri, // Can be any location in the current site. (Any valid Url)
            version: config.version
        }).then(function () {
            setupDeviceManager();
            var uri = $('#meetingUri').val();
            conv = client.conversationsManager.getConversationByUri(uri);
            conv.videoService.start();
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
            console.log('Added speaker: ' + ad.id());
            $('#spks').append($('<option/>', {
                value: ad.id(),
                text: ad.id()
            }));
        });
        client.devicesManager.speakers.removed(function (ad) {
            console.log('Removed speaker: ' + ad.id());
            $('#spks option[value="' + ad.id() + '"]')[0].remove();
        });
        // observe .microphones
        client.devicesManager.microphones.added(function (ad) {
            console.log('Added mic: ' + ad.id());
            $('#mics').append($('<option/>', {
                value: ad.id(),
                text: ad.id()
            }));
        });
        client.devicesManager.microphones.removed(function (ad) {
            console.log('Removed mic: ' + ad.id());
            $('#mics option[value="' + ad.id() + '"]')[0].remove();
        });
        // observe .cameras
        client.devicesManager.cameras.added(function (vd) {
            console.log('Added camera: ' + vd.name());
            $('#cams').append($('<option/>', {
                value: vd.name(),
                text: vd.name()
            }));
        });
        client.devicesManager.cameras.removed(function (vd) {
            console.log('Removed camera: ' + vd.name());
            $('#cams option[value="' + vd.name() + '"]')[0].remove();
        });
        // observe .selected*
        client.devicesManager.selectedSpeaker.changed(function (ad) {
            console.log('Selected speaker: ' + (ad ? ad.id() : 'None'));
        });
        client.devicesManager.selectedMicrophone.changed(function (ad) {
            console.log('Selected microphone: ' + (ad ? ad.id() : 'None'));
        });
        client.devicesManager.selectedCamera.changed(function (vd) {
            console.log('Selected video: ' + (vd ? vd.name() : 'None'));
        });
    }
    function setupConversationManager() {
        var addedListener = client.conversationsManager.conversations.added(function (conversation) {

            $('.c-add-p-container').removeClass('hide'); //display invite panel


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
                    if (newState === 'Connected')
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
                if (selfParticipant.video.state() === 'Notified') {
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
                else if (selfParticipant.audio.state() === 'Notified') {
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
                if (newState === 'Notified' && !timerId)
                    timerId = setTimeout(onAudioVideoNotified, 0);
            });
            selfParticipant.video.state.changed(function (newState, reason, oldState) {
                var selfChannel;
                console.log('video new state:' + newState);
                if (newState === 'Notified' && !timerId) {
                    timerId = setTimeout(onAudioVideoNotified, 0);
                }
                else if (newState === 'Connected') {
                    selfChannel = conversation.selfParticipant.video.channels(0);
                    selfChannel.stream.source.sink.container.set(document.getElementById("previewWindow"));
                }
            });
            conversation.state.changed(function onDisconnect(state) {
                console.log('conversations new state:' + state);

                if (state === 'Disconnected') {
                    conversation.state.changed.off(onDisconnect);
                    client.conversationsManager.conversations.remove(conversation);
                }
            });

            conversation.videoService.start().then(function () {
                console.log("video started");
                $('#meetingUri').val(conversation.uri());
                $('#inviteUrl').val("http://localhost:5000/home/joinwithtoken?conv=" + encodeURIComponent(conversation.uri()));
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
});
