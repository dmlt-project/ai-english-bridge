export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "AI is not configured yet. Add OPENAI_API_KEY in Vercel Environment Variables." });
  }
  try {
    const { module, grammar, sentenceKazakh, sentenceType, answer, hint } = req.body || {};
    if (!answer || !sentenceKazakh || !sentenceType) {
      return res.status(400).json({ error: "Missing answer or task details." });
    }
    const system = `You are a kind English tutor for Grade 5 learners in Kazakhstan. Check the student's English translation of a Kazakh sentence.
Priorities: meaning accuracy, grammar target, sentence type, age-appropriate supportive feedback.
Accept valid alternative translations; do not insist on one exact wording. Do not penalize capitalization or punctuation. If uncertain, say the answer may be acceptable and explain briefly.
Do not reveal the model answer on the first incorrect attempt. Give one short hint that helps the learner self-correct. Be encouraging and concise.
Return ONLY a JSON object with keys: isCorrect (boolean), feedback (string, 1-2 short sentences), nextHint (string, may be empty), showAnswer (boolean), modelAnswer (string, may be empty).
Set showAnswer=false. Only show an answer if the student explicitly asks for it in their answer text (e.g. "show answer") or the request includes revealAnswer=true.`;
    const user = `Module: ${module}
Target grammar: ${grammar}
Kazakh source sentence: ${sentenceKazakh}
Required sentence type: ${sentenceType}
Student answer: ${answer}
Optional learning hint: ${hint || ""}
Judge fairly and provide a useful next step.`;
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user", content: [{ type: "input_text", text: user }] }
        ],
        text: { format: { type: "json_object" } },
        max_output_tokens: 220
      })
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("OpenAI API error:", data);
      return res.status(502).json({ error: "The AI service could not check this answer right now." });
    }
    const output = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text)
      .join("");
    const result = JSON.parse(output);
    return res.status(200).json({
      isCorrect: Boolean(result.isCorrect),
      feedback: String(result.feedback || "Жауабыңды тексеріп көр."),
      nextHint: String(result.nextHint || ""),
      showAnswer: Boolean(result.showAnswer),
      modelAnswer: String(result.modelAnswer || "")
    });
  } catch (error) {
    console.error("AI checker error:", error);
    return res.status(500).json({ error: "Unexpected server error." });
  }
}
