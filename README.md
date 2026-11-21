# PocketLM

PocketLM is a mobile document-chat app. Ask questions about PDF and text files,
resume previous conversations, and view uploaded documents in the Library.

The Expo React Native app talks to a FastAPI backend. LangGraph coordinates
retrieval and answer generation, Groq provides chat completions, Cohere creates
document and query embeddings, and SQLite stores the document index and
on-device chat history.

## Features

- Chat with PDF and UTF-8 TXT documents (up to 10 MB per file).
- View and manage uploaded documents in the drawer's Library.
- Resume, automatically title, and delete conversations from chat history.
- See document sources used in an answer.
- Ask general questions as well as document-specific questions.

Groq and Cohere are cloud APIs, so chat and document search require internet
access. The phone and PC must also be on the same local network to reach the
backend.

## Requirements

- Windows PC with Python 3.11 or newer and Node.js/npm.
- Groq and Cohere API keys.
- Expo Go installed on your Android or iOS phone.
- Phone and PC connected to the same Wi-Fi network.

## Run the backend on your PC

Open PowerShell in the project folder:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set `GROQ_API_KEY` and `COHERE_API_KEY`. Keep this file
private and never commit your API keys.

Start the API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Check that it is running by opening
[http://localhost:8000/api/health](http://localhost:8000/api/health) on the PC.
The response should be `{"status":"ok"}`.

## Run the app on your phone

Find your PC's Wi-Fi IPv4 address by running `ipconfig` in PowerShell. It is
usually a private address such as `192.168.1.25`.

Create `mobile/.env` and set the backend URL to your PC's address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.25:8000
```

Replace the example address with the actual PC address. Do not use
`localhost` here: on a phone, `localhost` refers to the phone itself. Restart
Expo whenever you change this setting.

In a second PowerShell window:

```powershell
cd mobile
npm install
npx expo start --lan
```

Open Expo Go on your phone and scan the QR code shown in the terminal. If
Windows Firewall asks, allow Python on your **Private network**. You can also
open `http://<PC-WI-FI-IP>:8000/api/health` in the phone's browser to verify
that the phone can reach the backend.

### Emulator addresses

- Android emulator: set `EXPO_PUBLIC_API_URL=http://10.0.2.2:8000`.
- iOS simulator: set `EXPO_PUBLIC_API_URL=http://localhost:8000`.

For a physical phone, use the PC's Wi-Fi IPv4 address instead.

## Data and document notes

- Documents, extracted text, and embeddings are stored in the backend SQLite
  database (`backend/data/rag.db` by default).
- Conversations and messages are stored in SQLite on the phone.
- PDFs are parsed with PyMuPDF. Scanned/image-only PDFs need OCR, which is not
  currently included.
- Document ingestion and chat use Cohere and Groq, respectively; offline use
  is not currently supported.

## Project layout

- `backend/app/`: FastAPI endpoints, SQLite access, document processing, and
  the LangGraph RAG flow.
- `mobile/src/screens/`: React Native screens.
- `mobile/src/components/`: reusable UI components.
- `mobile/src/hooks/`: chat and document state.
- `mobile/src/services/`: backend API and local SQLite services.
- `mobile/src/types/`: shared frontend types.

For more backend setup details, see [backend/README.md](./backend/README.md).

This project is intended for local development. Add authentication, rate
limits, and production deployment safeguards before exposing the API publicly.
