
export enum AppState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
}

export interface Message {
  id: string;
  text: string;
  sender: 'you' | 'stranger';
}
