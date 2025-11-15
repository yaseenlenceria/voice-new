import React from 'react';
import { AppState } from '../types';
import { StartIcon, StopIcon, NextIcon, SearchIcon, MicrophoneOnIcon, MicrophoneOffIcon } from './Icons';

interface ControlsProps {
  appState: AppState;
  onStart: () => void;
  onHangup: () => void;
  onFindNew: () => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

const Controls: React.FC<ControlsProps> = ({ appState, onStart, onHangup, onFindNew, isMuted, onToggleMute }) => {
    const baseButtonClasses = "px-6 py-3 rounded-full font-semibold text-lg flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 shadow-lg transform hover:scale-105";
    const primaryButtonClasses = "bg-brand-secondary text-white hover:bg-blue-500 focus:ring-blue-400";
    const secondaryButtonClasses = "bg-red-600 text-white hover:bg-red-500 focus:ring-red-400";
    const disabledButtonClasses = "bg-gray-600 text-gray-400 cursor-not-allowed";
    const muteButtonClasses = "bg-gray-700 text-white hover:bg-gray-600 focus:ring-gray-500";


  switch (appState) {
    case AppState.IDLE:
      return (
        <button onClick={onStart} className={`${baseButtonClasses} ${primaryButtonClasses}`}>
          <StartIcon className="w-6 h-6 mr-2" /> Start Chatting
        </button>
      );
    case AppState.SEARCHING:
      return (
        <button disabled className={`${baseButtonClasses} ${disabledButtonClasses}`}>
          <SearchIcon className="w-6 h-6 mr-2 animate-spin" /> Searching...
        </button>
      );
    case AppState.CONNECTING:
    case AppState.CONNECTED:
      return (
        <div className="flex space-x-4 justify-center">
             <button onClick={onToggleMute} className={`${baseButtonClasses} ${muteButtonClasses} p-3`}>
                {isMuted ? (
                    <MicrophoneOffIcon className="w-6 h-6" />
                ) : (
                    <MicrophoneOnIcon className="w-6 h-6" />
                )}
            </button>
            <button onClick={onHangup} className={`${baseButtonClasses} ${secondaryButtonClasses}`}>
                <StopIcon className="w-6 h-6 mr-2" /> Hang Up & Find Next
            </button>
        </div>
      );
    case AppState.DISCONNECTED:
       return (
        <button onClick={onFindNew} className={`${baseButtonClasses} ${primaryButtonClasses}`}>
            <NextIcon className="w-6 h-6 mr-2" /> Find a New Stranger
        </button>
       );
    default:
      return null;
  }
};

export default Controls;