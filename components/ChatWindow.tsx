import React, { useState, useRef, useEffect } from 'react';
// Fix: Changed import to correctly import AppState as a value, as it is an enum used in runtime logic.
import { AppState, type Message } from '../types';
import { SendIcon } from './Icons';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  appState: AppState;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, onSendMessage, appState }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  const disabled = appState !== AppState.CONNECTED;

  const getPlaceholder = () => {
    switch(appState) {
        case AppState.IDLE:
            return "Click 'Start Chatting' to find someone.";
        case AppState.SEARCHING:
        case AppState.CONNECTING:
            return "Waiting to connect...";
        case AppState.CONNECTED:
            return "Type a message...";
        case AppState.DISCONNECTED:
            return "Chat ended. Find a new stranger.";
        default:
            return "Loading...";
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'you' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-2xl ${
                msg.sender === 'you'
                  ? 'bg-brand-secondary text-white rounded-br-none'
                  : 'bg-gray-700 text-dark-text-secondary rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
            </div>
          </div>
        ))}
         <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex items-center bg-gray-700 rounded-full px-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={disabled}
            className="flex-1 bg-transparent p-3 text-dark-text-primary placeholder-gray-400 focus:outline-none"
            autoComplete="off"
          />
          <button
            type="submit"
            disabled={disabled || !inputText.trim()}
            className="p-3 rounded-full bg-brand-secondary text-white disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;
