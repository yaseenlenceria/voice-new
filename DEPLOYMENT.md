# Deployment Guide for Render

This guide will help you deploy the VoiceStranger app to Render.

## Prerequisites

- A [Render](https://render.com) account
- A GitHub repository with this code
- Node.js installed locally for testing

## Deployment Options

### Option 1: Using render.yaml (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create a new Blueprint instance on Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" and select "Blueprint"
   - Connect your GitHub repository
   - Render will automatically detect `render.yaml` and create both services

3. **Update Environment Variables**
   After deployment, update the following:
   - **Backend Service**: Set `ALLOWED_ORIGINS` to your frontend URL
   - **Frontend Service**: Set `VITE_SIGNALING_SERVER_URL` to your backend URL

4. **Redeploy both services** after updating environment variables

### Option 2: Manual Deployment

#### Deploy Backend

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: voicestranger-backend
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: (auto-set by Render)
     - `ALLOWED_ORIGINS`: `https://your-frontend-url.onrender.com`

#### Deploy Frontend

1. Create a new **Static Site** on Render
2. Connect your GitHub repository
3. Configure:
   - **Name**: voicestranger-frontend
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**:
     - `VITE_SIGNALING_SERVER_URL`: `https://your-backend-url.onrender.com`

## Important Notes

- **Free Tier Limitations**: Render's free tier spins down after 15 minutes of inactivity, which may cause a delay on first connection
- **HTTPS Required**: WebRTC requires HTTPS in production, which Render provides automatically
- **CORS Configuration**: Make sure to set the correct frontend URL in the backend's `ALLOWED_ORIGINS` variable
- **Environment Variables**: Update URLs after both services are deployed

## Testing Deployment

1. Open your frontend URL in a browser
2. Click "Start Searching" to join the waiting pool
3. Open the same URL in another browser/tab to test matching
4. Check browser console for any connection errors

## Troubleshooting

- **Connection Failed**: Check that `VITE_SIGNALING_SERVER_URL` matches your backend URL
- **CORS Errors**: Verify `ALLOWED_ORIGINS` in backend includes your frontend URL
- **WebRTC Fails**: Ensure both users grant microphone permissions
- **Service Not Starting**: Check Render logs for build/runtime errors
