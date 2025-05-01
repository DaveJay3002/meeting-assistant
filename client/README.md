# Memo - AI-Powered Meeting Assistant

Memo is a modern, AI-powered note-taking app that records offline (in-person) meetings, transcribes and summarizes them, and allows users to interact with meeting content through an AI chat interface.

## Features

- **Audio Recording**: Easily record in-person meetings with a beautiful, animated recording interface
- **AI Transcription**: Automatic transcription of meeting audio
- **Smart Summaries**: AI-generated summaries of meeting content
- **Interactive Chat**: Ask questions about your meeting and get intelligent responses
- **Firebase Authentication**: Secure login and user management
- **Theme Support**: Both light and dark themes with pastel accent colors
- **Cross-Platform**: Works on iOS and Android

## Architecture

### Frontend
- React Native with Expo
- Expo Router for navigation
- React Native Paper for UI components
- Reanimated for smooth animations
- Firebase for authentication and storage
- Context API for state management

### Backend
- Python with Flask
- SocketIO for WebSocket communication
- OpenAI API for transcription and AI chat

## Getting Started

### Prerequisites

- Node.js (v16 or newer)
- npm or yarn
- Python 3.8+
- Expo CLI
- Firebase account
- OpenAI API key

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/memo.git
   cd memo
   ```

2. Install app dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Install Python server dependencies
   ```bash
   cd server
   pip install -r requirements.txt
   cd ..
   ```

4. Configure environment variables:
   - Create a `.env` file in the root directory
   - Add your API keys:
     ```
     # OpenAI API Key
     OPENAI_API_KEY=your_openai_api_key

     # Firebase Configuration
     FIREBASE_API_KEY=your_firebase_api_key
     FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     FIREBASE_PROJECT_ID=your_firebase_project_id
     FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
     FIREBASE_APP_ID=your_firebase_app_id
     ```

### Running the App

1. Start the Python server:
   ```bash
   npm run server
   ```

2. Start the Expo app:
   ```bash
   npm start
   # or
   yarn start
   ```

3. Follow the instructions in the terminal to run on your device or emulator

### Running on Mobile Devices with Expo Go

To run the app on mobile devices using Expo Go:

1. Start both the server and Expo app using the provided script:
   ```bash
   # Windows
   ./start.ps1
   
   # macOS/Linux
   ./start.sh
   ```

2. When the server starts, it will display its IP address. Note this address.

3. Open `services/WebSocketService.ts` and update the SERVER_URL:
   ```typescript
   const SERVER_URL = Platform.OS === 'web' 
     ? 'http://localhost:5000' 
     : 'http://YOUR_COMPUTER_IP:5000'; // Replace with your computer's IP address
   ```

4. Connect to the Expo app using Expo Go by scanning the QR code in the terminal.

5. Ensure that your mobile device is on the same WiFi network as your computer.

## Project Structure

```
memo/
├── app/                  # Expo Router app directory
│   ├── (tabs)/           # Tab screens
│   ├── auth/             # Authentication screens
│   ├── meeting/          # Meeting detail screens
│   └── _layout.tsx       # Root layout with navigation and theme
├── assets/               # Static assets
├── components/           # Reusable components
├── constants/            # Constants and theme definitions
├── contexts/             # React Context providers
├── hooks/                # Custom hooks
├── services/             # Services for API and WebSockets
└── server/               # Python backend server
    ├── app.py            # Main server file
    └── requirements.txt  # Python dependencies
```

## Development Roadmap

See [dev.md](dev.md) for the current development status and roadmap.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for the powerful AI capabilities
- Firebase for authentication and storage
- Expo team for the excellent development platform
