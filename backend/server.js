const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');
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

// ─── Prompt Builder ───────────────────────────────────────────────────────────
function buildPrompt(text, questionCount) {
  return `You are an expert quiz generator. Carefully read the following document text and generate exactly ${questionCount} multiple choice questions (MCQs) that test deep understanding of the specific content in this document.

CRITICAL RULES:
- Questions must be ENTIRELY based on the document text provided below
- Do NOT use any general knowledge or outside information
- Each question must be answerable from the document text
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
- Generate exactly ${questionCount} questions
- Each question must have exactly 4 answer options
- correct_index must be 0, 1, 2, or 3
- Vary difficulty: some factual, some inferential, some application-based
- Do NOT repeat questions or paraphrase the same question twice
- Do NOT output anything outside the JSON object

Document text to generate quiz from:
---
${text.slice(0, 15000)}
---`;
}

// ─── JSON Extractor ───────────────────────────────────────────────────────────
function extractJson(raw) {
  // Try direct parse first
  try { return JSON.parse(raw.trim()); } catch (_) {}
  // Fallback: extract largest JSON object
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  throw new Error('No valid JSON found in AI response');
}

// ─── AI Quiz Generator ────────────────────────────────────────────────────────
async function generateQuizFromText(text, filename) {
  // Hot-reload .env on every request
  require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey    = process.env.GEMINI_API_KEY;

  const hasAnthropic = anthropicKey && anthropicKey !== 'your_anthropic_api_key_here';
  const hasGemini    = geminiKey    && geminiKey    !== 'your_gemini_api_key_here';

  if (!hasAnthropic && !hasGemini) {
    throw new Error(
      'No AI API key is configured. Please open backend/.env and set either ANTHROPIC_API_KEY or GEMINI_API_KEY to generate quizzes from your PDF.'
    );
  }

  const wordCount = text.split(/\s+/).length;
  let questionCount = 10;
  if (wordCount > 3000) questionCount = 15;
  else if (wordCount > 1500) questionCount = 12;

  const prompt = buildPrompt(text, questionCount);

  // ── Anthropic Claude ────────────────────────────────────────────────────────
  if (hasAnthropic) {
    console.log(`[QUIZ//FORGE] Generating quiz via Anthropic Claude (${questionCount} questions)...`);
    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const callClaude = async (p) => {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: p }],
      });
      return response.content[0].text;
    };

    try {
      return extractJson(await callClaude(prompt));
    } catch (firstErr) {
      console.warn('[QUIZ//FORGE] First Claude attempt failed, retrying...', firstErr.message);
      try {
        const retry = prompt + '\n\nIMPORTANT: Your previous response could not be parsed. Return ONLY the raw JSON object. Start with { and end with }. No other characters.';
        return extractJson(await callClaude(retry));
      } catch (err) {
        throw new Error('Claude failed to generate valid quiz: ' + err.message);
      }
    }
  }

  // ── Gemini Flash ────────────────────────────────────────────────────────────
  if (hasGemini) {
    const models = ['gemini-3.5-flash', 'gemini-3.1-flash-lite'];
    let lastError = null;

    const callGemini = async (modelName, p) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: p }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Gemini HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      if (!data.candidates?.length) throw new Error('Gemini returned no candidates');
      return data.candidates[0].content.parts[0].text;
    };

    for (const model of models) {
      console.log(`[QUIZ//FORGE] Generating quiz via Gemini (${model}, ${questionCount} questions)...`);
      try {
        return extractJson(await callGemini(model, prompt));
      } catch (firstErr) {
        console.warn(`[QUIZ//FORGE] Gemini attempt with ${model} failed:`, firstErr.message);
        
        // If the failure is a service error (503, 429), skip retrying and fall back to the next model immediately
        const isServiceError = firstErr.message.includes('HTTP 503') || firstErr.message.includes('HTTP 429');
        if (!isServiceError) {
          try {
            console.log(`[QUIZ//FORGE] Retrying with model ${model} and strict JSON prompt...`);
            const retry = prompt + '\n\nIMPORTANT: Return ONLY raw JSON. Start with { and end with }. No other text.';
            return extractJson(await callGemini(model, retry));
          } catch (retryErr) {
            console.warn(`[QUIZ//FORGE] Retry with ${model} failed:`, retryErr.message);
            lastError = retryErr;
          }
        } else {
          lastError = firstErr;
        }
      }
    }
    throw new Error('Gemini failed to generate valid quiz: ' + (lastError ? lastError.message : 'Unknown error'));
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/quizzes — Upload PDF → generate quiz → save → return quiz data
app.post('/api/quizzes', upload.single('pdf'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No PDF file uploaded' });
  }

  // Extract text from PDF
  let extractedText;
  try {
    const data = await pdfParse(req.file.buffer);
    extractedText = data.text?.trim();
  } catch (err) {
    return res.status(422).json({
      error: 'Failed to read PDF. The file may be corrupted or password-protected.',
    });
  }

  if (!extractedText || extractedText.length < 100) {
    return res.status(422).json({
      error:
        'This PDF has no readable text. It may be a scanned or image-only PDF. Please upload a text-based PDF.',
    });
  }

  // Generate quiz from PDF content
  let quizData;
  try {
    quizData = await generateQuizFromText(extractedText, req.file.originalname);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  // Validate structure
  if (!quizData?.quiz_title || !Array.isArray(quizData?.questions) || quizData.questions.length < 1) {
    return res.status(500).json({ error: 'AI returned an invalid quiz structure. Please try again.' });
  }

  // Save to database
  const quizId = uuidv4();
  const db = await getDb();
  await db.run(
    'INSERT INTO quizzes (id, title, questions_json) VALUES (?, ?, ?)',
    [quizId, quizData.quiz_title, JSON.stringify(quizData.questions)]
  );

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
  const db = await getDb();
  const row = await db.get('SELECT * FROM quizzes WHERE id = ?', [id]);
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
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here');
  const hasGemini    = !!(process.env.GEMINI_API_KEY    && process.env.GEMINI_API_KEY    !== 'your_gemini_api_key_here');
  res.json({
    ready: hasAnthropic || hasGemini,
    engine: hasAnthropic ? 'claude-sonnet-4-6' : hasGemini ? 'gemini-3.5-flash (with 3.1 fallback)' : null,
  });
});

// GET /api/health — Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`QUIZ//FORGE Backend running on http://localhost:${PORT}`);
});
