# Meeting Assistant Project

This project is a meeting assistant application that helps with recording, transcribing, and summarizing meetings.

## Project Structure

The project consists of two main parts:

### Client

Located in the `client` directory, this is a React Native/Expo application that provides the mobile interface for recording meetings, viewing summaries, and interacting with the transcriptions.

### Server

Located in the `server` directory, this contains a Python-based backend service that handles audio processing, transcription, and summarization.

## Getting Started

### Setting up the Client

```
cd client
npm install
npx expo start
```

### Setting up the Server

```
cd server
pip install -r requirements.txt
python app/main.py
```

## Architecture

The client application communicates with the server through REST APIs for all functionality. The server processes audio recordings and provides meeting summaries and transcriptions.