# VoiceStranger - Random Voice & Text Chat

A real-time stranger chat application with voice and text capabilities, built with React, WebRTC, and Socket.io.

## Features

- Random 1-on-1 voice chat matching
- Real-time text messaging
- WebRTC peer-to-peer connections
- Voice muting/unmuting
- Clean, modern UI with dark theme
- Instant partner matching system

## Tech Stack

**Frontend:**
- React 19 + TypeScript
- Vite
- Socket.io Client
- WebRTC

**Backend:**
- Node.js + Express
- Socket.io Server
- WebRTC Signaling

## Run Locally

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   Copy `.env.example` to `.env.local` and update:
   ```bash
   VITE_SIGNALING_SERVER_URL=http://localhost:3001
   ```

3. **Run the frontend:**
   ```bash
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Backend Setup

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the backend:**
   ```bash
   npm start
   ```
   Backend will run on `http://localhost:3001`

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Render.

### Quick Deploy to Render

1. Push code to GitHub
2. Import repository to Render as a Blueprint
3. Render will automatically create both frontend and backend services
4. Update environment variables with the deployed URLs

## How It Works

1. Users click "Start Searching" to join the waiting pool
2. When two users are in the pool, they are automatically matched
3. WebRTC connection is established for voice communication
4. Users can chat via voice and text simultaneously
5. Either user can hang up and search for a new partner

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks (WebRTC logic)
│   ├── App.tsx         # Main application component
│   └── types.ts        # TypeScript type definitions
├── server/
│   ├── server.js       # Socket.io signaling server
│   └── package.json    # Backend dependencies
├── .env.example        # Environment variables template
├── DEPLOYMENT.md       # Deployment instructions
└── render.yaml         # Render deployment configuration
```

## Environment Variables

**Frontend (.env.local):**
- `VITE_SIGNALING_SERVER_URL` - Backend WebSocket server URL

**Backend:**
- `PORT` - Server port (default: 3001)
- `ALLOWED_ORIGINS` - Comma-separated list of allowed CORS origins

## License

MIT
