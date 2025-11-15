import { useState, useRef, useCallback, useEffect, MutableRefObject } from 'react';
import type { Socket } from 'socket.io-client';
import type { Message } from '../types';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    // The following are public TURN servers provided by the openrelayproject.
    // They are for testing purposes and may have limitations.
    // For production, it is highly recommended to use your own TURN server.
    // To enable, uncomment the block below.
    /*
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turns:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    */
    // Another public TURN server for testing from bromo.sh
    /*
    {
      urls: 'turn:global.bromo.sh:80',
      username: 'test',
      credential: 'test',
    },
    {
      urls: 'turns:global.bromo.sh:443',
      username: 'test',
      credential: 'test',
    },
    */
  ],
};

export const useWebRTC = (socketRef: MutableRefObject<Socket | null>) => {
  const [peerConnectionState, setPeerConnectionState] = useState<RTCIceConnectionState>('new');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  
  const onNewMessageCallbackRef = useRef<(message: Message) => void>(() => {});

  const initialize = useCallback((onNewMessage: (message: Message) => void) => {
    onNewMessageCallbackRef.current = onNewMessage;
  }, []);

  const resetWebRTC = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
    }
    setRemoteStream(null);
    setPeerConnectionState('new');
    setPartnerId(null);
    dataChannelRef.current = null;
    setIsMuted(false);
    setMediaError(null);
  }, []);

  const createPeerConnection = useCallback(async () => {
    if (!socketRef.current) return null;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && partnerId) {
        socketRef.current?.emit('signal', {
          partnerId,
          signalData: { candidate: event.candidate },
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      setPeerConnectionState(pc.iceConnectionState);
      console.log(`ICE connection state changed: ${pc.iceConnectionState}`);
      if (['disconnected', 'failed', 'closed'].includes(pc.iceConnectionState)) {
          // Handle disconnects gracefully
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    try {
      if (!localStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStreamRef.current = stream;
      }
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current as MediaStream);
      });
    } catch (error: any) {
      console.error('Error getting user media:', error);
       if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            setMediaError('Microphone access was denied. Please grant permission in your browser settings and try again.');
        } else {
            setMediaError('Could not access your microphone. Please ensure it is connected and not in use by another application.');
        }
      return null;
    }

    return pc;
  }, [socketRef, partnerId]);

  const handleSignal = useCallback(async (signalData: any) => {
    if (!peerConnectionRef.current) {
        const pc = await createPeerConnection();
        if(!pc) return;
        peerConnectionRef.current = pc;
    }
    const pc = peerConnectionRef.current;

    if (signalData.offer) {
      pc.ondatachannel = (event) => {
        dataChannelRef.current = event.channel;
        setupDataChannel(event.channel);
      };
      
      await pc.setRemoteDescription(new RTCSessionDescription(signalData.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketRef.current?.emit('signal', {
        partnerId,
        signalData: { answer },
      });
    } else if (signalData.answer) {
      await pc.setRemoteDescription(new RTCSessionDescription(signalData.answer));
    } else if (signalData.candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
      } catch (error) {
        console.error('Error adding received ice candidate', error);
      }
    }
  }, [createPeerConnection, partnerId, socketRef]);

  useEffect(() => {
    socketRef.current?.on('signal', (data: { signalData: any }) => {
      handleSignal(data.signalData);
    });

    return () => {
      socketRef.current?.off('signal');
    };
  }, [socketRef, handleSignal]);

  const setupDataChannel = (channel: RTCDataChannel) => {
    channel.onopen = () => console.log('Data channel opened');
    channel.onclose = () => console.log('Data channel closed');
    channel.onmessage = (event) => {
      onNewMessageCallbackRef.current({ id: Date.now().toString(), text: event.data, sender: 'stranger' });
    };
  };
  
  const startCall = useCallback(async () => {
    const pc = await createPeerConnection();
    if (!pc) return;
    peerConnectionRef.current = pc;
    
    const channel = pc.createDataChannel('chat');
    dataChannelRef.current = channel;
    setupDataChannel(channel);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current?.emit('signal', {
      partnerId,
      signalData: { offer },
    });
  }, [createPeerConnection, partnerId, socketRef]);

  const hangUp = useCallback(() => {
    socketRef.current?.emit('hangup', { partnerId });
    resetWebRTC();
  }, [partnerId, resetWebRTC, socketRef]);

  const sendMessage = (text: string) => {
    if (dataChannelRef.current?.readyState === 'open') {
      dataChannelRef.current.send(text);
    }
  };

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !track.enabled;
      setIsMuted(!track.enabled);
    });
  }, []);

  return { 
    startCall, 
    hangUp, 
    sendMessage, 
    remoteStream, 
    peerConnectionState,
    resetWebRTC,
    partnerId,
    setPartnerId,
    initialize,
    isMuted,
    toggleMute,
    mediaError,
  };
};