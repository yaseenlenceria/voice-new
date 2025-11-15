import React from 'react';

type IconProps = {
  className?: string;
};

export const LogoIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
    <rect width="256" height="256" fill="none"></rect>
    <path d="M168,88H152a40,40,0,0,0-80,0H56a48,48,0,0,1,48-48,47.9,47.9,0,0,1,44.9,32.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
    <path d="M88,168H104a40,40,0,0,0,80,0h16a48,48,0,0,1-48,48,47.9,47.9,0,0,1-44.9-32.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></path>
    <line x1="168" y1="88" x2="88" y2="168" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="16"></line>
  </svg>
);

export const SendIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
  </svg>
);

export const StartIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.647c1.295.742 1.295 2.545 0 3.286L7.279 20.99c-1.25.717-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 013-3h9a3 3 0 013 3v9a3 3 0 01-3 3h-9a3 3 0 01-3-3v-9z" clipRule="evenodd" />
  </svg>
);

export const NextIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" d="M16.28 11.47a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 01-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 011.06-1.06l7.5 7.5z" clipRule="evenodd" />
    </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
);

export const MicrophoneOnIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
        <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.75 6.75 0 1 1-13.5 0v-1.5A.75.75 0 0 1 6 10.5Z" />
    </svg>
);

export const MicrophoneOffIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.5 4.06c0-1.336-1.076-2.411-2.421-2.411S8.658 2.724 8.658 4.06v6.182A4.5 4.5 0 0 0 13.5 14.5v-4.258A4.486 4.486 0 0 0 13.5 4.06Z" />
        <path fillRule="evenodd" d="M5.059 12.016a.75.75 0 0 1 .493.851 6.72 6.72 0 0 0 1.264 2.842 6.75 6.75 0 0 0 10.36 0 6.72 6.72 0 0 0 1.264-2.842.75.75 0 1 1 1.433.434 8.22 8.22 0 0 1-1.543 3.472A8.25 8.25 0 0 1 4.07 13.3a.75.75 0 0 1 .99-.434Zm-2.274-5.22a.75.75 0 0 1 1.06-1.06l16.5 16.5a.75.75 0 1 1-1.06 1.06l-16.5-16.5Z" clipRule="evenodd" />
    </svg>
);