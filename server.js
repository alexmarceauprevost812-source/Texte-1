// ===== SERVER.JS — Proxy Anthropic pour TI-LEX-AL =====

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
const path      = require('path');

const app    = express();
const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors());
app.use(express.json());

// Sert les fichiers statiques (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// ===== ROUTE CHAT =====
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages invalides!' });
  }

  try {
    const response = await client.messages.create({
      model:      'claude-opus-4-5',
      max_tokens: 1024,
      system:     `Tu es TI-LEX-AL, l'intelligence artificielle du Québec.
Tu parles en joual québécois authentique et coloré.
T'es sharp, direct, drôle mais toujours utile.
Tu aides Alex dans son travail avec efficacité et fierté québécoise.
T'utilises des expressions comme: chu, faque, aweille, en crisse, tsé, c'est l'boutte, câline, pis, dret là.`,
      messages:   messages
    });

    res.json({ reply: response.content[0].text });

  } catch (err) {
    console.error('Erreur Anthropic:', err.message);
    res.status(500).json({ error: 'Câline, erreur serveur: ' + err.message });
  }
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n😈 TI-LEX-AL allumé sur http://localhost:${PORT}\n`);
});