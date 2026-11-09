import { GEMINI_API_KEY, GEMINI_MODEL } from './env'

export type GeminiMsg = { role: 'user' | 'model'; text: string }

/** Aufruf der kostenlosen Gemini-API (REST, kein SDK nötig). */
export async function geminiGenerate(opts: {
  system?: string
  messages: GeminiMsg[]
  json?: boolean
  maxTokens?: number
}): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`
  const body = {
    ...(opts.system ? { systemInstruction: { parts: [{ text: opts.system }] } } : {}),
    contents: opts.messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    generationConfig: {
      maxOutputTokens: opts.maxTokens ?? 600,
      ...(opts.json ? { responseMimeType: 'application/json' } : {}),
    },
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  }
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') ?? ''
}

export { GEMINI_API_KEY }
