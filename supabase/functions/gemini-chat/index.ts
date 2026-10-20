import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "jsr:@supabase/server@^1";

interface GeminiRequest {
  message: string;
  history?: Array<{ role?: "user" | "model" | "assistant"; text?: string; content?: string }>;
}

export default {
  fetch: withSupabase({ auth: "user" }, async (req) => {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return Response.json({ error: "Gemini ainda não foi configurado." }, { status: 503 });
    }

    const body: GeminiRequest = await req.json();
    const message = String(body.message || "").trim();
    if (!message) return Response.json({ error: "Escreva uma pergunta." }, { status: 400 });
    if (message.length > 4000) {
      return Response.json({ error: "A mensagem deve ter no máximo 4.000 caracteres." }, { status: 400 });
    }

    const contents = (body.history || []).slice(-12).map((item) => ({
      role: item.role === "model" || item.role === "assistant" ? "model" : "user",
      parts: [{ text: String(item.text || item.content || "").slice(0, 4000) }],
    })).filter((item) => item.parts[0].text);
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{
              text: "Você é o assistente Gemini do IL Bate Papo. Responda em português do Brasil de forma clara, respeitosa e útil. Proteja a privacidade e nunca peça senhas, códigos de acesso ou dados bancários.",
            }],
          },
          contents,
          generationConfig: {
            maxOutputTokens: 1200,
            thinkingConfig: { thinkingLevel: "low" },
          },
        }),
      },
    );

    const data = await response.json();
    if (!response.ok) {
      return Response.json(
        { error: data?.error?.message || "O Gemini não respondeu." },
        { status: response.status },
      );
    }

    const reply = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return Response.json({ error: "O Gemini não retornou uma resposta." }, { status: 502 });
    }

    return Response.json({ text: reply, reply });
  }),
};
