import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState, Message } from './types';
import { useWebRTC } from './hooks/useWebRTC';
import ChatWindow from './components/ChatWindow';
import Controls from './components/Controls';
import StatusBar from './components/StatusBar';
import AudioPlayer from './components/AudioPlayer';
import { LogoIcon } from './components/Icons';

// IMPORTANT: Set VITE_SIGNALING_SERVER_URL in your .env file
// For local development: http://localhost:3001
// For production: Your Render backend URL
const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3001';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socketId, setSocketId] = useState<string | null>(null);

  const {
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
  } = useWebRTC(socketRef);
  
  const handleNewMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  useEffect(() => {
    if (mediaError) {
      alert(mediaError);
      setAppState(AppState.IDLE);
      resetWebRTC();
    }
  }, [mediaError, resetWebRTC]);

  useEffect(() => {
    const socket = io(SIGNALING_SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to signaling server with ID:', socket.id);
      setSocketId(socket.id);
    });

    socket.on('matched', (data: { partnerId: string }) => {
      console.log('Matched with partner:', data.partnerId);
      setPartnerId(data.partnerId);
      setAppState(AppState.CONNECTING);
      initialize(handleNewMessage);
      if (socket.id > data.partnerId) {
        startCall();
      }
    });
    
    socket.on('user_left', () => {
        if (appState === AppState.CONNECTED || appState === AppState.CONNECTING) {
            setAppState(AppState.DISCONNECTED);
            hangUp();
        }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (peerConnectionState === 'connected') {
      setAppState(AppState.CONNECTED);
    }
  }, [peerConnectionState]);

  const handleStartSearch = async () => {
    setAppState(AppState.SEARCHING);
    setMessages([]);
    resetWebRTC();
    socketRef.current?.emit('join_waiting_pool');
  };

  const handleHangupOrNext = () => {
    socketRef.current?.emit('hangup', { partnerId });
    hangUp();
    handleStartSearch();
  };

  const handleFindNew = () => {
    handleStartSearch();
  };
  
  const handleSendMessage = (text: string) => {
    if (text.trim()) {
      sendMessage(text);
      handleNewMessage({ id: Date.now().toString(), text, sender: 'you' });
    }
  };
  
  return (
    <div className="min-h-screen bg-dark-bg text-dark-text-primary flex flex-col items-center justify-center p-4 font-sans">
       <header className="w-full max-w-4xl text-center mb-8">
         <div className="flex items-center justify-center space-x-3 mb-2">
           <LogoIcon className="h-10 w-10 text-brand-secondary" />
           <h1 className="text-4xl font-bold">V<span className="text-brand-secondary">o</span>iceStr<span className="text-brand-secondary">a</span>nger</h1>
         </div>
         <p className="text-dark-text-secondary">Connect with a random person for a voice and text chat.</p>
       </header>

       <main className="w-full max-w-4xl flex flex-col items-center justify-center">
         <div className="w-full h-[65vh] md:h-[70vh] bg-dark-surface rounded-xl shadow-2xl flex flex-col p-4 md:p-6 space-y-4">
           <StatusBar state={appState} peerState={peerConnectionState} />
           
           {(appState === AppState.CONNECTING || appState === AppState.CONNECTED) && (
              <div className="text-center text-xs text-dark-text-secondary -my-2">
                <p>Your ID: <span className="font-mono bg-gray-700 px-1 rounded">{socketId}</span></p>
                <p>Partner ID: <span className="font-mono bg-gray-700 px-1 rounded">{partnerId}</span></p>
              </div>
            )}

           <ChatWindow messages={messages} onSendMessage={handleSendMessage} appState={appState} />
           <div className="mt-auto pt-4 border-t border-gray-700">
              <Controls 
                appState={appState} 
                onStart={handleStartSearch} 
                onHangup={handleHangupOrNext} 
                onFindNew={handleFindNew}
                isMuted={isMuted}
                onToggleMute={toggleMute}
              />
           </div>
         </div>
       </main>
       
       <AudioPlayer stream={remoteStream} />
    </div>
  );
};

export default App;