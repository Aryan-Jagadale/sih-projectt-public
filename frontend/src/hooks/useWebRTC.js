import { useCallback, useEffect, useRef, useState } from "react";
import { useStateWithCallBack } from "./useStateWithCallBack";
import socketInit from "../socket/index";
import { ACTIONS } from "../actions";
import freeice from "freeice";

export const useWebRTC = (roomId, user) => {
  const [clients, setClients] = useStateWithCallBack([]);
  const audioElement = useRef({});
  const connections = useRef({});
  const localMediaStream = useRef(null);
  const socket = useRef(null);
  const clientsRef = useRef([]);

  useEffect(() => {
    socket.current = socketInit();
  }, []);

  useEffect(() => {
    clientsRef.current = clients;
  }, [clients]);

  //Listen for mute && unmute
  useEffect(() => {
    socket.current.on(ACTIONS.MUTE, ({ peerID, userId }) => {
      setMute(true, userId);
    });
    socket.current.on(ACTIONS.UNMUTE, ({ peerID, userId }) => {
      setMute(false, userId);
    });

    const setMute = (mute, userId) => {
      const clientIdx = clientsRef.current
        .map((client) => client.id)
        .indexOf(userId);

      console.log("idx", clientIdx);

      const connectedClientsClone = JSON.parse(
        JSON.stringify(clientsRef.current)
      );
      if (clientIdx > -1) {
        connectedClientsClone[clientIdx].muted = mute;
        console.log("muuuu", connectedClientsClone);
        setClients((_) => connectedClientsClone);
      }
    };
  }, []);

  const provideRef = (instance, userId) => {
    audioElement.current[userId] = instance;
  };
  const addNewClients = useCallback(
    (newClient, cb) => {
      const lookingFor = clients.find((client) => client.id === newClient.id);
      if (lookingFor === undefined) {
        setClients((existingClients) => [...existingClients, newClient], cb);
      }
    },
    [clients, setClients]
  );
  //Capture media
  useEffect(() => {
    const startCapture = async () => {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
    };
    startCapture().then(() => {
      //console.log("Captured media from useWebrtc");
      addNewClients({ ...user, muted: true }, () => {
        //console.log("New user added from webRtc");
        const localElement = audioElement.current[user.id];

        if (localElement) {
          localElement.volume = 0;
          localElement.srcObject = localMediaStream.current;
          //localElement.play();
        }
        //Send data to Server with webSocket
        //socket emit
        socket.current.emit(ACTIONS.JOIN, { roomId, user });
      });
    });
    return () => {
      //Leaving the room
      localMediaStream.current.getTracks().forEach((track) => {
        track.stop();
      });
      socket.current.emit(ACTIONS.LEAVE, { roomId });
    };
  }, []);

  useEffect(() => {
    const handleNewPeer = async ({ peerId, createOffer, user: remoteUser }) => {
      //if already connected then give warning
      if (peerId in connections.current) {
        //connections
        return console.warn(`Already connected to ${peerId}`);
      }
      //create new peer connection
      connections.current[peerId] = new RTCPeerConnection({
        iceServers: freeice(),
      });
      //Handle new ice canditae
      connections.current[peerId].onicecandidate = (e) => {
        socket.current.emit(ACTIONS.RELAY_ICE, {
          peerId,
          icecandidate: e.candidate,
        });
      };
      //Handle on track on this connection
      connections.current[peerId].ontrack = ({ streams: [remoteStream] }) => {
        addNewClients({ ...remoteUser, muted: true }, () => {
          if (audioElement.current[remoteUser.id]) {
            audioElement.current[remoteUser.id].srcObject = remoteStream;
          } else {
            let settled = false;
            const interval = setInterval(() => {
              if (audioElement.current[remoteUser.id]) {
                audioElement.current[remoteUser.id].srcObject = remoteStream;
                settled = true;
              }
              if (settled) {
                clearInterval(interval);
              }
            }, 1000);
          }
        });
      };

      //Add local track to remote connections
      localMediaStream.current.getTracks().forEach((track) => {
        connections.current[peerId].addTrack(track, localMediaStream.current);
      });
      //Offer creation
      if (createOffer) {
        const offer = await connections.current[peerId].createOffer();
        await connections.current[peerId].setLocalDescription(offer);
        //send offer to another client
        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: offer,
        });
      }
    };
    socket.current.on(ACTIONS.ADD_PEER, handleNewPeer);
    return () => {
      socket.current.off(ACTIONS.ADD_PEER);
    };
  }, []);

  // Handle ice candidate
  useEffect(() => {
    socket.current.on(ACTIONS.ICE_CANDIDATE, ({ peerId, icecandidate }) => {
      if (icecandidate) {
        connections.current[peerId].addIceCandidate(icecandidate);
      }
    });
    return () => {
      socket.current.off(ACTIONS.ICE_CANDIDATE);
    };
  }, []);

  // Handle session description
  useEffect(() => {
    const setRemoteMedia = async ({
      peerId,
      sessionDescription: remoteSessionDescription,
    }) => {
      connections.current[peerId].setRemoteDescription(
        new RTCSessionDescription(remoteSessionDescription)
      );

      // If session descrition is offer then create an answer
      if (remoteSessionDescription.type === "offer") {
        const connection = connections.current[peerId];

        const answer = await connection.createAnswer();
        connection.setLocalDescription(answer);

        socket.current.emit(ACTIONS.RELAY_SDP, {
          peerId,
          sessionDescription: answer,
        });
      }
    };

    socket.current.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);
    return () => {
      socket.current.off(ACTIONS.SESSION_DESCRIPTION);
    };
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({ peerID, userId }) => {
      //console.log('leaving', peerID, userId);

      if (connections.current[peerID]) {
        connections.current[peerID].close();
      }

      delete connections.current[peerID];
      delete audioElement.current[peerID];

      setClients((list) => list.filter((c) => c.id !== userId));
    };

    socket.current.on(ACTIONS.REMOVE_PEER, handleRemovePeer);

    return () => {
      socket.current.off(ACTIONS.REMOVE_PEER);
    };
  }, []);

  //Handling mute
  const handleMute = (isMute, userId) => {
    //console.log('mute',isMute,userId);
    let settled = false;

    let interval = setInterval(() => {
      if (localMediaStream.current) {
        localMediaStream.current.getTracks()[0].enabled = !isMute;
        if (isMute) {
          socket.current.emit(ACTIONS.MUTE, {
            roomId,
            userId,
          });
        } else {
          socket.current.emit(ACTIONS.UNMUTE, {
            roomId,
            userId,
          });
        }
        settled = true;
      }
      if (settled) {
        clearInterval(interval);
      }
    }, 200);
  };

  return { clients, provideRef, handleMute };
};
