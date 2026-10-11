
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({
      error: "AI is not configured yet. Add OPENAI_API_KEY in Vercel Environment Variables."
    });
  }

  try {
    const {
      module,
      grammar,
      sentenceKazakh,
      sentenceType,
      answer,
      hint
    } = req.body || {};

    if (!answer || !sentenceKazakh || !sentenceType) {
      return res.status(400).json({
        error: "Missing answer or task details."
      });
    }

    const system = `You are a kind English tutor for Grade 5 learners in Kazakhstan.
Check the student's English translation of a Kazakh sentence.

Judge meaning first, then the required grammar and sentence type.
Accept natural alternative translations and word order when they preserve the meaning and meet the task.
For "Мен кеше Абай мұражайына бардым", both
"Yesterday, I went to the Abai Museum" and
"I visited the Abai Museum yesterday" are correct.
Do not require an exact model answer. Ignore capitalization and minor punctuation differences.
Accept contractions and full forms as equally correct, including did not/didn't, was not/wasn't, were not/weren't, and could not/couldn't. For regular verbs in negative sentences, use the base verb after did not or didn't.
If the answer may contain a speech-recognition error, politely ask the student to check the recognized words.
If the meaning is correct but the required grammar is missing, acknowledge the meaning and give a gentle reminder.
On the first incorrect attempt, give one short hint. Do not reveal the full answer unless the student explicitly asks to see it.

Return ONLY a JSON object with these keys:
isCorrect (boolean), feedback (string), nextHint (string),
showAnswer (boolean), modelAnswer (string).

Set showAnswer=false unless the student explicitly asks for the answer.
Be encouraging, concise, and age-appropriate.`;

    const user = `Module: ${module || ""}
Target grammar: ${grammar || ""}
Kazakh source sentence: ${sentenceKazakh}
Required sentence type: ${sentenceType}
Student answer: ${answer}
Optional learning hint: ${hint || ""}`;

    const apiResponse = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          "Authorization": \`Bearer \${process.env.OPENAI_API_KEY}\`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
          input: [
            {
              role: "system",
              content: [{ type: "input_text", text: system }]
            },
            {
              role: "user",
              content: [{ type: "input_text", text: user }]
            }
          ],
          text: { format: { type: "json_object" } },
          max_output_tokens: 220
        })
      }
    );

    const data = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error("OpenAI API error:", data);
      return res.status(502).json({
        error: "The AI service could not check this answer right now."
      });
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
    return res.status(500).json({
      error: "Unexpected server error."
    });
  }
}
