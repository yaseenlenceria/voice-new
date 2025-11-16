import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import { AppState } from './types';
import { useWebRTC } from './hooks/useWebRTC';
import AudioPlayer from './components/AudioPlayer';

const SIGNALING_SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER_URL || 'http://localhost:3001';

const howItWorks = [
  {
    title: 'Tune your vibe',
    description: 'Pick country, language, and mood filters. Everything stays anonymous.',
    icon: 'sliders-horizontal',
  },
  {
    title: 'Tap once to connect',
    description: 'Our AI router finds the best available stranger in under a second.',
    icon: 'zap',
  },
  {
    title: 'Talk as long as you want',
    description: 'Crystal-clear WebRTC audio with automatic reconnects and fallback routes.',
    icon: 'mic',
  },
  {
    title: 'Next person anytime',
    description: 'Skip instantly. Auto-next keeps conversations flowing without taps.',
    icon: 'skip-forward',
  },
];

const whyChooseUs = [
  'Anonymous voice-only conversations',
  'AI-powered matching & mood filters',
  'Auto-block toxic or spam callers',
  'Works behind any network or firewall',
  'Adaptive audio quality with TURN fallback',
  'Live analytics to keep the network healthy',
];

const testimonials = [
  {
    quote: 'The matching feels eerily perfect. I met people that genuinely matched my vibe. Audio was flawless.',
    author: 'Amelia — Toronto',
  },
  {
    quote: 'Finally a random chat that doesn\'t drop or lag. The dialer UI is addictive and super premium.',
    author: 'Sasha — Dubai',
  },
  {
    quote: 'I love the mood filters. When I\'m chill, it pairs me with someone who just wants to talk.',
    author: 'Haruto — Tokyo',
  },
];

const countries = ['Worldwide', 'United States', 'Canada', 'United Kingdom', 'India', 'UAE'];
const languages = ['Auto-detect', 'English', 'Spanish', 'Hindi', 'Arabic'];
const moods = ['Talkative', 'Chill', 'Happy', 'Curious', 'Supportive'];

type LiveStats = {
  activeUsers: number;
  callsNow: number;
  avgDuration: string;
};

declare global {
  interface Window {
    lucide?: {
      createIcons: (options?: { attrs?: Record<string, string | number> }) => void;
    };
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const socketRef = useRef<Socket | null>(null);
  const [autoNextEnabled, setAutoNextEnabled] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedMood, setSelectedMood] = useState(moods[0]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [liveStats, setLiveStats] = useState<LiveStats>({ activeUsers: 9240, callsNow: 1120, avgDuration: '07:41' });
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const {
    startCall,
    hangUp,
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

  const noopMessageHandler = () => {};

  useEffect(() => {
    window.lucide?.createIcons({ attrs: { strokeWidth: 1.5 } });
  }, [appState, mobileMenuOpen, mobileFiltersOpen, selectedCountry, selectedLanguage, selectedMood]);

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
    });

    socket.on('matched', (data: { partnerId: string }) => {
      setPartnerId(data.partnerId);
      setAppState(AppState.CONNECTING);
      initialize(noopMessageHandler);
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

  useEffect(() => {
    if (appState === AppState.CONNECTED) {
      callTimerRef.current && clearInterval(callTimerRef.current);
      callTimerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setCallSeconds(0);
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }
    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [appState]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats((current) => ({
        activeUsers: current.activeUsers + Math.round((Math.random() - 0.5) * 40),
        callsNow: current.callsNow + Math.round((Math.random() - 0.5) * 12),
        avgDuration: '07:41',
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStartSearch = async () => {
    setAppState(AppState.SEARCHING);
    resetWebRTC();
    socketRef.current?.emit('join_waiting_pool', {
      country: selectedCountry,
      language: selectedLanguage,
      mood: selectedMood,
    });
  };

  const handleHangupOrNext = () => {
    socketRef.current?.emit('hangup', { partnerId });
    hangUp();
    if (autoNextEnabled) {
      handleStartSearch();
    } else {
      setAppState(AppState.IDLE);
    }
  };

  const dialerState = useMemo(() => {
    switch (appState) {
      case AppState.SEARCHING:
      case AppState.CONNECTING:
        return {
          label: 'Connecting…',
          subtitle: 'Finding someone who matches your vibe',
          status: 'Finding match',
          statusClass: 'text-amber-300',
          dotClass: 'bg-amber-400 shadow-[0_0_0_4px] shadow-amber-400/30',
        };
      case AppState.CONNECTED:
        return {
          label: 'Talking with stranger',
          subtitle: 'Say hi — your voice is the only thing they see',
          status: 'In call',
          statusClass: 'text-emerald-300',
          dotClass: 'bg-emerald-400 shadow-[0_0_0_4px] shadow-emerald-400/30',
        };
      case AppState.DISCONNECTED:
        return {
          label: 'Call ended',
          subtitle: 'Tap start to meet someone new instantly',
          status: 'Disconnected',
          statusClass: 'text-rose-300',
          dotClass: 'bg-rose-400 shadow-[0_0_0_4px] shadow-rose-400/30',
        };
      default:
        return {
          label: 'Idle',
          subtitle: 'Tap to start a new anonymous call',
          status: 'Ready',
          statusClass: 'text-emerald-300',
          dotClass: 'bg-emerald-400 shadow-[0_0_0_4px] shadow-emerald-400/30',
        };
    }
  }, [appState]);

  const connectionQualityLabel = peerConnectionState === 'connected' ? 'Adaptive voice quality enabled' : 'Voice-ready connection';

  const startDisabled = appState === AppState.SEARCHING || appState === AppState.CONNECTING || appState === AppState.CONNECTED;
  const nextDisabled = appState !== AppState.CONNECTED;

  const toggleAutoNext = () => setAutoNextEnabled((prev) => !prev);

  const toggleMobileFilters = () => setMobileFiltersOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-[Inter] antialiased flex flex-col">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-16 w-80 h-80 bg-violet-500/20 blur-3xl rounded-full" />
        <div className="absolute top-10 right-0 w-96 h-96 bg-indigo-500/20 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10rem] left-1/3 w-[32rem] h-[32rem] bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950" />
      </div>

      <header className="relative z-10">
        <nav className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center">
              <span className="text-sm font-semibold tracking-tight text-violet-300">EC</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-slate-50">EchoCall</span>
              <span className="text-[11px] text-slate-400">Random Voice Stranger Chat</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-slate-50 transition-colors">
              How it works
            </a>
            <a href="#why-us" className="hover:text-slate-50 transition-colors">
              Why choose us
            </a>
            <a href="#live-stats" className="hover:text-slate-50 transition-colors">
              Live stats
            </a>
            <a href="#testimonials" className="hover:text-slate-50 transition-colors">
              Stories
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button className="px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700/80 rounded-full hover:border-slate-400 hover:text-slate-50 transition-colors">
              Launch Web
            </button>
            <button className="px-4 py-1.5 text-xs font-medium rounded-full bg-violet-500 text-slate-50 shadow-lg shadow-violet-500/30 hover:bg-violet-400 transition-colors">
              Get Early Access
            </button>
          </div>

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-full border border-slate-700/70 text-slate-200 hover:border-slate-400 hover:text-slate-50 transition-colors"
          >
            <i data-lucide={mobileMenuOpen ? 'x' : 'menu'} className="w-5 h-5" />
          </button>
        </nav>

        {mobileMenuOpen && (
          <div className="md:hidden mx-4 mt-1 rounded-2xl border border-slate-800/80 bg-slate-950/90 backdrop-blur-xl shadow-xl shadow-slate-950/70">
            <div className="px-4 py-3 flex flex-col gap-3 text-sm text-slate-200">
              <a href="#how-it-works" className="py-1 hover:text-slate-50 transition-colors">
                How it works
              </a>
              <a href="#why-us" className="py-1 hover:text-slate-50 transition-colors">
                Why choose us
              </a>
              <a href="#live-stats" className="py-1 hover:text-slate-50 transition-colors">
                Live stats
              </a>
              <a href="#testimonials" className="py-1 hover:text-slate-50 transition-colors">
                Stories
              </a>
              <div className="flex gap-2 pt-1">
                <button className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-200 border border-slate-700/80 rounded-full hover:border-slate-400 hover:text-slate-50 transition-colors">
                  Launch Web
                </button>
                <button className="flex-1 px-3 py-1.5 text-xs font-medium rounded-full bg-violet-500 text-slate-50 shadow-lg shadow-violet-500/30 hover:bg-violet-400 transition-colors">
                  Get Access
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="relative z-10 flex-1">
        <section className="pt-8 pb-16 sm:pt-12 sm:pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[1.2fr,0.9fr] gap-10 items-start lg:items-center">
              <div className="order-2 lg:order-1">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/40 px-2.5 py-1 text-[11px] text-slate-300 mb-4 shadow-sm shadow-slate-900/70">
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="uppercase tracking-[0.16em] text-[10px] text-slate-300">Live</span>
                  <span className="w-px h-3 bg-slate-600" />
                  <span>Thousands of strangers calling right now</span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] tracking-tight font-semibold text-slate-50 mb-3">
                  Random voice chats with real people, in seconds.
                </h1>
                <p className="text-sm sm:text-[15px] text-slate-300 max-w-xl mb-5">
                  Pick your language, mood, and country — then tap once to be instantly connected to a stranger voice call.
                  No accounts, no profiles, just safe real-time conversations.
                </p>
                <ul className="flex flex-wrap gap-3 text-[11px] text-slate-300 mb-6">
                  <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                    <span>Anonymous & secure</span>
                  </li>
                  <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-300/90" />
                    <span>AI-powered matching</span>
                  </li>
                  <li className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-700/70">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/90" />
                    <span>No login required</span>
                  </li>
                </ul>
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center -space-x-2">
                    <img
                      src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=80&q=80"
                      alt="user"
                      className="w-7 h-7 rounded-full border border-slate-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80"
                      alt="user"
                      className="w-7 h-7 rounded-full border border-slate-900 object-cover"
                    />
                    <img
                      src="https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=80&q=80"
                      alt="user"
                      className="w-7 h-7 rounded-full border border-slate-900 object-cover"
                    />
                    <div className="w-7 h-7 rounded-full border border-slate-900 bg-slate-800/70 text-[10px] flex items-center justify-center text-slate-200">
                      +9k
                    </div>
                  </div>
                  <span>People talking in the last hour</span>
                </div>
              </div>

              <div className="order-1 lg:order-2">
                <div className="relative">
                  <div className="relative rounded-[32px] border border-slate-800/90 bg-slate-950/90 shadow-[0_24px_80px_rgba(15,23,42,0.85)] backdrop-blur-3xl px-3 pt-3 pb-4 sm:px-4 sm:pt-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-2xl bg-violet-500/20 border border-violet-400/50 flex items-center justify-center">
                          <i data-lucide="phone-call" className="w-4 h-4 text-violet-50" />
                        </div>
                        <div className="leading-tight">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">EchoCall dialer</p>
                          <p className="text-[11px] text-slate-300">Tap once, talk to a stranger</p>
                        </div>
                      </div>
                      <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        <span>Low latency route</span>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-br from-violet-500/40 via-sky-500/10 to-transparent opacity-70 blur-2xl rounded-[32px] pointer-events-none" />

                      <div className="relative rounded-[28px] border border-slate-700/70 bg-slate-950/80 backdrop-blur-2xl shadow-2xl shadow-slate-950/80 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/80">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-700" />
                              <span className="w-2 h-2 rounded-full bg-slate-700" />
                              <span className="w-2 h-2 rounded-full bg-slate-700" />
                            </div>
                            <span className="text-[11px] text-slate-400 uppercase tracking-[0.16em]">Voice dialer</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-300">
                            <span className="flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${dialerState.dotClass}`} />
                              <span className={dialerState.statusClass}>{dialerState.status}</span>
                            </span>
                            <span className="w-px h-3 bg-slate-700" />
                            <span className="flex items-center gap-1">
                              <i data-lucide="shield" className="w-3.5 h-3.5 text-slate-400" />
                              <span>Safe mode</span>
                            </span>
                          </div>
                        </div>

                        <div className="px-4 pt-4 pb-3 sm:px-5 sm:pt-5 sm:pb-4">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-[0.16em] mb-0.5">{dialerState.label}</p>
                              <p className="text-xs text-slate-300">{dialerState.subtitle}</p>
                            </div>
                            <div className="text-right text-[11px] text-slate-300">
                              <span className="flex items-center justify-end gap-1">
                                <i data-lucide="hash" className="w-3 h-3 text-slate-500" />
                                <span className="font-medium text-slate-200">{partnerId ? partnerId.slice(-4) : 'No match yet'}</span>
                              </span>
                              <span className="text-[10px] text-slate-500">New ID each connection</span>
                            </div>
                          </div>

                          <div className="relative rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-900/90 px-4 py-3 mb-4 overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none opacity-40">
                              <div className="absolute -left-10 top-1/2 -translate-y-1/2 w-[140%] h-24 bg-gradient-to-r from-violet-500/30 via-sky-400/20 to-transparent blur-3xl" />
                            </div>
                            <div className="relative flex items-center justify-between gap-4">
                              <div>
                                <p className="text-xl font-semibold tracking-tight text-slate-50">{formatTime(callSeconds)}</p>
                                <p className="text-[11px] text-slate-300 flex items-center gap-1.5">
                                  <i data-lucide="wifi" className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>{connectionQualityLabel}</span>
                                </p>
                              </div>
                              <div className="flex items-end gap-1.5 h-10 w-28 justify-end">
                                {Array.from({ length: 7 }).map((_, index) => (
                                  <span
                                    key={index}
                                    className="w-1 rounded-full bg-gradient-to-t from-violet-500/60 to-sky-400/80 animate-[pulse_1.2s_ease-in-out_infinite] origin-bottom"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="hidden sm:flex flex-wrap gap-3 mb-4">
                            <button
                              type="button"
                              className="group flex-1 min-w-[7.5rem] inline-flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3.5 py-2 text-[11px] text-slate-200 hover:border-violet-400/70 hover:bg-slate-900/80 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <i data-lucide="globe-2" className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-200" />
                                <span>
                                  <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Country</span>
                                  <span className="block text-[11px] text-slate-100">{selectedCountry}</span>
                                </span>
                              </span>
                              <i data-lucide="chevron-down" className="w-3 h-3 text-slate-500 group-hover:text-violet-200" />
                            </button>
                            <button
                              type="button"
                              className="group flex-1 min-w-[7.5rem] inline-flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3.5 py-2 text-[11px] text-slate-200 hover:border-violet-400/70 hover:bg-slate-900/80 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <i data-lucide="languages" className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-200" />
                                <span>
                                  <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Language</span>
                                  <span className="block text-[11px] text-slate-100">{selectedLanguage}</span>
                                </span>
                              </span>
                              <i data-lucide="chevron-down" className="w-3 h-3 text-slate-500 group-hover:text-violet-200" />
                            </button>
                            <button
                              type="button"
                              className="group flex-1 min-w-[7.5rem] inline-flex items-center justify-between gap-2 rounded-xl border border-slate-800/80 bg-slate-950/70 px-3.5 py-2 text-[11px] text-slate-200 hover:border-violet-400/70 hover:bg-slate-900/80 transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <i data-lucide="sparkles" className="w-3.5 h-3.5 text-slate-400 group-hover:text-violet-200" />
                                <span>
                                  <span className="block text-[10px] uppercase tracking-[0.18em] text-slate-500">Mood</span>
                                  <span className="block text-[11px] text-slate-100">{selectedMood}</span>
                                </span>
                              </span>
                              <i data-lucide="chevron-down" className="w-3 h-3 text-slate-500 group-hover:text-violet-200" />
                            </button>
                          </div>

                          <div className="flex sm:hidden justify-between items-center mb-4">
                            <button
                              type="button"
                              onClick={toggleMobileFilters}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-3 py-1.5 text-[11px] text-slate-200 hover:border-violet-400/70 hover:bg-slate-900/80 transition-colors"
                            >
                              <i data-lucide="sliders-horizontal" className="w-3.5 h-3.5 text-slate-400" />
                              <span>Preferences</span>
                            </button>
                            <span className="text-[10px] text-slate-400">Auto-match based on your mood</span>
                          </div>

                          <div className="flex items-center justify-between gap-3 mb-3">
                            <button
                              type="button"
                              onClick={toggleAutoNext}
                              className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-2 py-1.5 text-[11px] text-slate-200 hover:border-violet-400/70 hover:bg-slate-900/80 transition-colors"
                            >
                              <div className="relative flex items-center">
                                <div className="w-7 h-4 rounded-full bg-slate-800/90 flex items-center px-[2px] transition-colors">
                                  <div
                                    className={`w-3 h-3 rounded-full ${autoNextEnabled ? 'bg-emerald-400 translate-x-2.5' : 'bg-slate-500 translate-x-0'} shadow-[0_0_0_3px] shadow-emerald-400/40 transition-transform`}
                                  />
                                </div>
                                <span className="ml-1.5 text-[11px] text-slate-200">Auto-next</span>
                              </div>
                              <span className={`text-[10px] ${autoNextEnabled ? 'text-emerald-300' : 'text-slate-400'}`}>{autoNextEnabled ? 'On' : 'Off'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={handleHangupOrNext}
                              disabled={nextDisabled}
                              className="inline-flex items-center gap-2 text-[11px] px-3 py-1.5 rounded-full border border-slate-800/80 text-slate-200 bg-slate-950/80 hover:border-violet-400/70 hover:bg-slate-900/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <i data-lucide="skip-forward" className="w-3.5 h-3.5 text-slate-400" />
                              <span>Next person</span>
                            </button>
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 items-center">
                            <button
                              type="button"
                              onClick={handleStartSearch}
                              disabled={startDisabled}
                              className="group relative flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-sky-500 text-slate-50 text-xs font-medium px-4 py-2.5 shadow-lg shadow-violet-500/40 hover:from-violet-400 hover:via-indigo-400 hover:to-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/15 via-transparent to-white/10 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                              <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-slate-950/25 border border-white/20">
                                <i data-lucide="phone" className="w-3.5 h-3.5" />
                              </span>
                              <span className="relative text-left">
                                <span className="block text-[11px] uppercase tracking-[0.18em] text-violet-100/80">Start</span>
                                <span className="block text-xs">Start voice chat</span>
                              </span>
                            </button>
                            <span className="text-[10px] text-slate-400">No login. No phone number shown. 100% voice-only.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-[10px] text-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-emerald-400/15 border border-emerald-400/50 flex items-center justify-center">
                          <i data-lucide="shield-check" className="w-2.5 h-2.5 text-emerald-300" />
                        </div>
                        <div className="leading-tight">
                          <p className="uppercase tracking-[0.18em] text-[9px] text-slate-400">Safety first</p>
                          <p className="text-[10px] text-slate-300">AI auto-flags spam & harassment before it reaches you.</p>
                        </div>
                      </div>
                      <span className="hidden sm:inline text-[10px] text-slate-500">Voice-only. No camera, no screen share.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {mobileFiltersOpen && (
            <div className="fixed inset-x-0 bottom-0 z-40">
              <div className="mx-auto max-w-md rounded-t-3xl border border-slate-800/90 bg-slate-950/95 backdrop-blur-2xl shadow-[0_-16px_60px_rgba(15,23,42,0.75)]">
                <div className="px-4 pt-3 pb-1 border-b border-slate-800/80 flex items-center justify-between">
                  <span className="w-8 h-0.5 rounded-full bg-slate-700 mx-auto block" />
                </div>
                <div className="px-4 pt-3 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Preferences</p>
                      <p className="text-xs text-slate-300">Tune who you want to talk to.</p>
                    </div>
                    <button
                      type="button"
                      onClick={toggleMobileFilters}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-slate-800/80 text-slate-300 hover:border-slate-500 hover:text-slate-50 transition-colors"
                    >
                      <i data-lucide="x" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[11px]">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-[0.18em] mb-1.5">Country</label>
                      <select
                        value={selectedCountry}
                        onChange={(event) => setSelectedCountry(event.target.value)}
                        className="w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-200"
                      >
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px]">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-[0.18em] mb-1.5">Language</label>
                      <select
                        value={selectedLanguage}
                        onChange={(event) => setSelectedLanguage(event.target.value)}
                        className="w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-200"
                      >
                        {languages.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="text-[11px]">
                      <label className="block text-[10px] text-slate-400 uppercase tracking-[0.18em] mb-1.5">Mood</label>
                      <select
                        value={selectedMood}
                        onChange={(event) => setSelectedMood(event.target.value)}
                        className="w-full rounded-xl border border-slate-800/80 bg-slate-950/80 px-3 py-2 text-[11px] text-slate-200"
                      >
                        {moods.map((mood) => (
                          <option key={mood} value={mood}>
                            {mood}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-[11px] text-slate-200">Auto-next</p>
                        <p className="text-[10px] text-slate-400">Jump to the next person when a call ends.</p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAutoNext}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/80 px-2 py-1.5 text-[11px] text-slate-200"
                      >
                        <div className="relative flex items-center">
                          <div className="w-7 h-4 rounded-full bg-slate-800/90 flex items-center px-[2px] transition-colors">
                            <div
                              className={`w-3 h-3 rounded-full ${autoNextEnabled ? 'bg-emerald-400 translate-x-2.5' : 'bg-slate-500 translate-x-0'} shadow-[0_0_0_3px] shadow-emerald-400/40 transition-transform`}
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] ${autoNextEnabled ? 'text-emerald-300' : 'text-slate-400'}`}>{autoNextEnabled ? 'On' : 'Off'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Changes apply to your next match.</span>
                    <button
                      type="button"
                      onClick={toggleMobileFilters}
                      className="text-[10px] px-2 py-1 rounded-full border border-slate-700/80 text-slate-200 hover:border-slate-500 hover:text-slate-50 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section id="how-it-works" className="py-12 sm:py-16 border-t border-slate-900/80 bg-slate-950/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl tracking-tight font-semibold text-slate-50 mb-1.5">How EchoCall works</h2>
                <p className="text-sm text-slate-300 max-w-md">Designed so that your first call is seconds away. No friction, just conversation.</p>
              </div>
              <p className="text-[11px] text-slate-400 max-w-sm">Calls are matched in under 1 second on average. Preferences help align languages, time zones and mood.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {howItWorks.map((step) => (
                <div key={step.title} className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 flex gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900/70 border border-slate-800 flex items-center justify-center">
                    <i data-lucide={step.icon} className="w-4 h-4 text-violet-200" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-50">{step.title}</h3>
                    <p className="text-xs text-slate-400">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="why-us" className="py-12 sm:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-[0.9fr,1.1fr] gap-8">
              <div className="rounded-3xl border border-slate-900 bg-slate-950/60 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.55)]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-3">Why choose us</p>
                <h2 className="text-2xl font-semibold text-slate-50 mb-4">Built for the most reliable stranger calls on the internet.</h2>
                <ul className="space-y-3 text-sm text-slate-200">
                  {whyChooseUs.map((reason) => (
                    <li key={reason} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 flex items-center justify-center text-[10px]">✓</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl border border-slate-900 bg-slate-950/60 p-6 flex flex-col gap-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">Live stats</p>
                  <div id="live-stats" className="grid grid-cols-2 gap-4 text-center">
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                      <p className="text-2xl font-semibold text-slate-50">{liveStats.activeUsers.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Active users</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                      <p className="text-2xl font-semibold text-slate-50">{liveStats.callsNow.toLocaleString()}</p>
                      <p className="text-xs text-slate-400">Calls happening</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                      <p className="text-2xl font-semibold text-slate-50">{liveStats.avgDuration}</p>
                      <p className="text-xs text-slate-400">Average duration</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                      <p className="text-2xl font-semibold text-slate-50">1.3s</p>
                      <p className="text-xs text-slate-400">Match speed</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400 mb-2">Audio tools</p>
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 flex flex-wrap gap-3 text-[11px] text-slate-300">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="px-3 py-1.5 rounded-full border border-slate-800/80 hover:border-violet-400/70"
                    >
                      {isMuted ? 'Unmute microphone' : 'Mute microphone'}
                    </button>
                    <span className="px-3 py-1.5 rounded-full border border-slate-800/80">TURN fallback ready</span>
                    <span className="px-3 py-1.5 rounded-full border border-slate-800/80">24/7 moderation</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-12 sm:py-16 border-t border-slate-900/60 bg-slate-950/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 mb-8">
              <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Stories</p>
              <h2 className="text-2xl font-semibold text-slate-50">Real people. Real-time chemistry.</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <div key={testimonial.author} className="rounded-3xl border border-slate-900 bg-slate-950/70 p-5 flex flex-col gap-3">
                  <p className="text-sm text-slate-200">“{testimonial.quote}”</p>
                  <span className="text-xs text-slate-400">{testimonial.author}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-slate-900/80 bg-slate-950/90">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
              <span className="text-[10px] font-semibold tracking-tight text-violet-300">EC</span>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-[11px] text-slate-200">EchoCall</span>
              <span className="text-[10px] text-slate-500">Random Voice Stranger Chat</span>
            </div>
            <span className="mx-2 hidden sm:inline text-slate-700">•</span>
            <span className="hidden sm:inline text-[10px] text-slate-500">Designed for voice-only conversations. No video, no feeds, no pressure.</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <nav className="flex flex-wrap items-center gap-3">
              <a href="#" className="hover:text-slate-200 transition-colors">
                About
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Support
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Safety
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-slate-200 transition-colors">
                Privacy
              </a>
            </nav>
            <div className="flex items-center gap-2">
              <button className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-800/80 hover:border-slate-500 hover:text-slate-50 transition-colors">
                <i data-lucide="twitter" className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-800/80 hover:border-slate-500 hover:text-slate-50 transition-colors">
                <i data-lucide="instagram" className="w-3.5 h-3.5" />
              </button>
              <button className="w-7 h-7 flex items-center justify-center rounded-full border border-slate-800/80 hover:border-slate-500 hover:text-slate-50 transition-colors">
                <i data-lucide="github" className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="text-[10px] text-slate-600">© {new Date().getFullYear()} EchoCall. All rights reserved.</span>
          </div>
        </div>
      </footer>

      <style>
        {`@keyframes pulse {
          0%, 100% { transform: scaleY(0.4); opacity: 0.7; }
          50% { transform: scaleY(1.15); opacity: 1; }
        }`}
      </style>

      <AudioPlayer stream={remoteStream} />
    </div>
  );
};

export default App;
