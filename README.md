# ⚡ QUIZ//FORGE
### by DevDynasty

> Turn any PDF into a quiz. Instantly.

A no-signup, link-shareable AI quiz generator. Upload a PDF → Claude generates 10-15 MCQ questions → get a shareable link. Anyone can play with zero login.

---

## 🚀 Quick Start

**Built by DevDynasty**

Turn any PDF into a shareable quiz in seconds — powered by Claude AI. No signup, no login.

---

## Setup

### 1. Get an Anthropic API Key
- Sign up at https://console.anthropic.com
- Create an API key

### 2. Configure the Backend

```bash
cd backend
```

Edit the `.env` file and paste your API key:
```
PORT=5000
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

### 3. Start the Backend

```bash
cd backend
node server.js
```

Backend runs on http://localhost:5000

### 4. Start the Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on http://localhost:5173

### 5. Open the App

Visit http://localhost:5173 in your browser.

---

## How to Use

1. Click **CREATE A QUIZ** on the welcome screen
2. Upload a PDF (lecture notes, textbook, document)
3. Wait ~30s for AI to generate questions
4. Copy the shareable link and send it to friends
5. Anyone can play by opening the link — no account needed!

---

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS v4 + canvas-confetti + Web Audio API
- **Backend**: Node.js + Express + multer + pdf-parse + @anthropic-ai/sdk
- **Database**: SQLite (file: `backend/quizforge.db`)
- **AI Model**: Claude 3.5 Sonnet (via Anthropic API)
