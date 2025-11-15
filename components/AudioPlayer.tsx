
import React, { useRef, useEffect } from 'react';

interface AudioPlayerProps {
  stream: MediaStream | null;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  return <audio ref={audioRef} autoPlay playsInline />;
};

export default AudioPlayer;
