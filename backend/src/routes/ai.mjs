// AI support routes — chat assistant trained on the KingBot V8.7 guide.
import { Router } from "express";
import { authRequired } from "../middleware/auth.mjs";
import { aiChat } from "../utils/ai.mjs";
import { insertOne } from "../utils/store.mjs";
import { nanoid } from "nanoid";

const router = Router();

router.post("/chat", authRequired, async (req, res) => {
  try {
    const { messages = [], context = {} } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0)
      return res.status(400).json({ error: "messages array required" });
    const reply = await aiChat(messages, req.user.id);

    // store conversation (lightweight)
    await insertOne("ai_chats", {
      id: nanoid(12),
      userId: req.user.id,
      messages: [...messages, reply],
      context,
      at: new Date().toISOString(),
    });

    res.json(reply);
  } catch (e) {
    console.error("[ai chat]", e);
    res.status(500).json({ error: "AI assistant unavailable" });
  }
});

// Suggested prompts (quick-start chips)
router.get("/suggestions", (_req, res) => {
  res.json({
    suggestions: [
      "How do I set up the EA for a $20 account?",
      "What risk % should I use?",
      "Which pairs are best for micro-flip?",
      "Why is my EA not taking trades?",
      "How does the profit-lock engine work?",
      "Should I use martingale?",
      "How do I connect my EA from my phone?",
      "Explain Profile E (extreme mode)",
      "What are the 10 blow-up protection layers?",
    ],
  });
});

export default router;
