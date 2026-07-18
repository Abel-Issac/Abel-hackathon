const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ─── File Upload ─────────────────────────────────────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
    if (isPdf) cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// ─── JSON Extractor ───────────────────────────────────────────────────────────
function extractJson(raw) {
  try { return JSON.parse(raw.trim()); } catch (_) {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('No valid JSON found in AI response');
}

// ─── AI Quiz Generator ────────────────────────────────────────────────────────
async function processPDFAndGenerateQuiz(pdfBuffer) {
  require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
  
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey || geminiKey === 'your_gemini_api_key_here') {
    throw new Error('No GEMINI_API_KEY configured. Please set it in backend/.env');
  }

  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are an expert quiz generator. Carefully read the provided document and generate multiple choice questions (MCQs) that test deep understanding of the specific content in this document. 
  Generate between 10 to 15 questions based on the length of the document.

CRITICAL RULES:
- Questions must be ENTIRELY based on the document
- Do NOT use any general knowledge or outside information
- Each question must be answerable from the document
- Return ONLY valid JSON — no preamble, no explanation, no markdown code fences

Required JSON format:
{
  "quiz_title": "A descriptive title based on the document topic",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "One sentence explaining why this answer is correct, citing the document."
    }
  ]
}

Additional rules:
- Each question must have exactly 4 answer options
- correct_index must be 0, 1, 2, or 3
- Vary difficulty: some factual, some inferential, some application-based
- Do NOT repeat questions or paraphrase the same question twice
- Do NOT output anything outside the JSON object`;

  try {
    console.log(`[QUIZ//FORGE] Generating quiz via Gemini 2.5 Flash SDK...`);
    const result = await model.generateContent([
      {
        inlineData: {
          data: pdfBuffer.toString('base64'),
          mimeType: "application/pdf",
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    return extractJson(responseText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error('Gemini failed to generate valid quiz: ' + error.message);
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/quizzes — Upload PDF → generate quiz → save → return quiz data
app.post('/api/quizzes', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  // Generate quiz directly from PDF buffer using Gemini SDK
  let quizData;
  try {
    quizData = await processPDFAndGenerateQuiz(req.file.buffer);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Validate structure
  if (!quizData?.quiz_title || !Array.isArray(quizData?.questions) || quizData.questions.length < 1) {
    return res.status(500).json({ error: 'AI returned an invalid quiz structure. Please try again.' });
  }

  // Save to database
  const quizId = uuidv4();
  const db = getDb();
  db.prepare('INSERT INTO quizzes (id, title, questions_json) VALUES (?, ?, ?)')
    .run(quizId, quizData.quiz_title, JSON.stringify(quizData.questions));

  console.log(`[QUIZ//FORGE] Quiz saved: ${quizId} — "${quizData.quiz_title}" (${quizData.questions.length} questions)`);

  res.json({
    id: quizId,
    title: quizData.quiz_title,
    questionCount: quizData.questions.length,
    questions: quizData.questions,
  });
});

// GET /api/quizzes/:id — Fetch a saved quiz by ID
app.get('/api/quizzes/:id', async (req, res) => {
  const { id } = req.params;
  const db = getDb();
  const row = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
  if (!row) return res.status(404).json({ error: 'Quiz not found' });
  res.json({
    id: row.id,
    title: row.title,
    questions: JSON.parse(row.questions_json),
    created_at: row.created_at,
  });
});

// GET /api/check-key — Let the frontend know whether an AI key is configured
app.get('/api/check-key', (req, res) => {
  require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
  const hasGemini = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
  res.json({
    ready: hasGemini,
    engine: hasGemini ? 'gemini-2.5-flash (SDK)' : null,
  });
});

// GET /api/health — Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`QUIZ//FORGE Backend running on http://localhost:${PORT}`);
});
