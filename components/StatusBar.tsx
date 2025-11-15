import React from 'react';
import { AppState } from '../types';

interface StatusBarProps {
  state: AppState;
  peerState: RTCIceConnectionState;
}

const StatusBar: React.FC<StatusBarProps> = ({ state, peerState }) => {
  let statusText = '';
  let bgColor = 'bg-gray-700';
  let dotColor = 'bg-gray-400';

  switch (state) {
    case AppState.IDLE:
      statusText = 'Ready to connect. Click "Start Chatting" below.';
      bgColor = 'bg-gray-700';
      dotColor = 'bg-gray-400';
      break;
    case AppState.SEARCHING:
      statusText = 'Searching for a stranger...';
      bgColor = 'bg-yellow-800';
      dotColor = 'bg-yellow-400 animate-pulse';
      break;
    case AppState.CONNECTING:
      statusText = `Connecting... (ICE: ${peerState})`;
      bgColor = 'bg-blue-800';
      dotColor = 'bg-blue-400 animate-pulse';
      break;
    case AppState.CONNECTED:
      statusText = 'You are connected to a stranger.';
      bgColor = 'bg-green-800';
      dotColor = 'bg-green-400';
      break;
    case AppState.DISCONNECTED:
      statusText = 'Stranger has disconnected.';
      bgColor = 'bg-red-800';
      dotColor = 'bg-red-400';
      break;
  }
  
  return (
    <div className={`w-full p-3 rounded-lg flex items-center justify-center text-sm font-medium ${bgColor} text-white`}>
      <div className={`w-3 h-3 rounded-full mr-3 ${dotColor}`}></div>
      <span>{statusText}</span>
    </div>
  );
};

export default StatusBar;