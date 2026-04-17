export const runtime = 'edge';
export const maxDuration = 120;

const SYSTEM_PROMPT = `You are a Political Analysis Engine applying a strict 5-pillar methodology. Structure EVERY analysis using ALL 5 pillars. Never skip a pillar.

LANGUAGE RULE (MANDATORY): You MUST detect the language of the user's question and respond ENTIRELY in that same language. If the user writes in Arabic, respond fully in Arabic. If in English, respond in English. If in French, respond in French. This applies to ALL sections including headers, analysis, and summary. The section header emojis (📡🌍🔬🔎🔗⚖️📋📰) must remain the same regardless of language, but translate the header text. For example in Arabic: "## 📡 الركيزة 1: سلسلة الأحداث" instead of "## 📡 PILLAR 1: Chain of Events".

CORE RULES:
- NEVER take political statements at face value — assume hidden purposes.
- Always ask: "Is this real confrontation or choreographed theater?"
- Look for contradictions between ACTIONS and WORDS — actions reveal truth.
- Distinguish events that change reality from events manufactured to shape perception.
- Statements may mean the EXACT OPPOSITE of their surface meaning — circumstances reveal true intent.

## 5-Pillar Methodology

### PILLAR 1: CONTINUOUS TRACKING (Chain of Events)
Trace the full chain of events. What happened before, what triggered this, what followed. Flag suspicious gaps — missing context often reveals manipulation.

### PILLAR 2: BACKGROUND INFORMATION (Context)
Cover geographic, historical, political, ideological, and domestic context. Internal pressures often drive foreign policy.

### PILLAR 3: NEVER ABSTRACT FROM CIRCUMSTANCES
Analyze this event in its UNIQUE circumstances. No generalizations, no analogies to other events. Each incident is individual.

### PILLAR 4: SOURCE ANALYSIS
For each major source: Who reported it? Why now? What is the likely purpose? Is it credible? Are multiple outlets pushing the same narrative (coordinated messaging)?

### PILLAR 5: DOMAIN LINKING & REALITY CHECK
Link to proper domain. Identify major powers and interests. Who benefits? Who loses?

**THEATER vs. REALITY CHECK (MANDATORY):**
For each major actor: What are they SAYING vs DOING? Do words match actions? Does the appearance of conflict benefit both sides? Rate: 🎭 POLITICAL THEATER | ⚠️ MIXED | 🔴 GENUINE CRISIS

## OUTPUT FORMAT (use these exact headers, translated to the user's language):

# [Event/Question Title]

## 📡 PILLAR 1: Chain of Events
[Timeline and sequence]

## 🌍 PILLAR 2: Background & Context
[All context dimensions]

## 🔬 PILLAR 3: Circumstantial Analysis
[What makes this unique]

## 🔎 PILLAR 4: Source Analysis
[Source evaluation — who reported, why, credibility assessment]

## 🔗 PILLAR 5: Domain Linking, Power Analysis & Reality Check
[Connections, beneficiaries, theater vs reality rating]

## ⚖️ FINAL ASSESSMENT
[What is ACTUALLY happening vs what we are told]

## 📋 PLAIN LANGUAGE SUMMARY
[5-8 clear sentences for non-experts: What happened? Why does it matter? What's really going on? What to watch next?]

## 📰 SOURCES CONSULTED
[List all sources referenced]
- **[Source Name]** — [URL or description]

Be ruthlessly analytical. Find the real story behind the surface story.`;

// Input limits to prevent abuse
const MAX_QUESTION_LENGTH = 2000;
const MAX_ARTICLES_LENGTH = 50000;

// Model selection: Opus 4.7 = deepest analysis, Sonnet 4.6 = faster/cheaper fallback
const MODEL_OPUS = 'claude-opus-4-7';
const MODEL_SONNET = 'claude-sonnet-4-6';

function errorResponse(message, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function validateInput({ question, mode, articles }) {
  if (!question || typeof question !== 'string' || !question.trim()) {
    return 'Question is required';
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return `Question too long (max ${MAX_QUESTION_LENGTH} chars)`;
  }
  if (mode === 'manual') {
    if (!articles || !articles.trim()) {
      return 'Manual mode requires pasted articles';
    }
    if (articles.length > MAX_ARTICLES_LENGTH) {
      return `Articles too long (max ${MAX_ARTICLES_LENGTH} chars)`;
    }
  }
  if (mode !== 'auto' && mode !== 'manual') {
    return 'Invalid mode';
  }
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  const { question, mode = 'auto', articles = '', depth = 'standard' } = body;

  const validationError = validateInput({ question, mode, articles });
  if (validationError) return errorResponse(validationError, 400);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return errorResponse('API key not configured', 500);

  const userPrompt = mode === 'manual'
    ? `Analyze this political event using the 5-pillar methodology. IMPORTANT: Respond in the SAME language as the question below.

**Event:** ${question.trim()}

**User-provided sources:**
${articles.trim()}

Apply ALL 5 pillars. Be ruthless in detecting political theater vs genuine developments.`
    : `Search for latest news about this political event, gather multiple sources (4-6), then apply the full 5-pillar analysis. IMPORTANT: Respond in the SAME language as the question below.

**Event:** ${question.trim()}

Find multiple perspectives, then deliver the complete 5-pillar analysis. Pay attention to contradictions between what actors SAY and DO.`;

  // Depth lets subscribers opt into Opus for deep dives (Sonnet default keeps costs sane)
  const model = depth === 'deep' ? MODEL_OPUS : MODEL_SONNET;

  const anthropicBody = {
    model,
    max_tokens: 8000,
    stream: true,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  };

  if (mode === 'auto') {
    anthropicBody.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
  }

  let anthropicResponse;
  try {
    anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(anthropicBody),
      signal: request.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') return errorResponse('Request aborted', 499);
    return errorResponse(`Upstream error: ${err.message}`, 502);
  }

  if (!anthropicResponse.ok) {
    let errorText = 'Analysis engine error';
    try {
      const errBody = await anthropicResponse.json();
      errorText = errBody.error?.message || errorText;
    } catch { /* ignore */ }

    if (anthropicResponse.status === 429) {
      return errorResponse(
        'The analysis engine is rate-limited. Please wait 30 seconds and try again. / محرك التحليل مشغول. يرجى الانتظار 30 ثانية.',
        429
      );
    }
    if (anthropicResponse.status === 529) {
      return errorResponse('The analysis engine is temporarily overloaded. Try again shortly.', 529);
    }
    return errorResponse(errorText, anthropicResponse.status);
  }

  // Stream: parse Anthropic SSE, forward only text deltas as NDJSON to the client.
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = anthropicResponse.body.getReader();
      let buffer = '';
      let currentBlockType = null;
      let usage = null;

      const send = (obj) => {
        controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      };

      // Heartbeat so reverse proxies don't time out during long web searches
      const heartbeat = setInterval(() => send({ heartbeat: true }), 15000);

      try {
        // Signal model + mode so the client can display it
        send({ meta: { model, mode, depth } });

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';

          for (const rawEvent of events) {
            const dataLine = rawEvent.split('\n').find((l) => l.startsWith('data: '));
            if (!dataLine) continue;
            const payload = dataLine.slice(6);
            if (payload === '[DONE]') continue;

            let evt;
            try { evt = JSON.parse(payload); } catch { continue; }

            switch (evt.type) {
              case 'content_block_start':
                currentBlockType = evt.content_block?.type || null;
                // Let client show "searching the web..." when tool use starts
                if (currentBlockType === 'server_tool_use' || currentBlockType === 'tool_use') {
                  send({ status: 'searching' });
                }
                break;

              case 'content_block_delta':
                if (currentBlockType === 'text' && evt.delta?.type === 'text_delta') {
                  send({ text: evt.delta.text });
                }
                break;

              case 'content_block_stop':
                currentBlockType = null;
                break;

              case 'message_delta':
                if (evt.usage) usage = evt.usage;
                break;

              case 'message_stop':
                send({ done: true, usage });
                break;

              case 'error':
                send({ error: evt.error?.message || 'Stream error' });
                break;
            }
          }
        }
      } catch (err) {
        send({ error: err.message || 'Stream aborted' });
      } finally {
        clearInterval(heartbeat);
        controller.close();
      }
    },
    cancel() {
      // Propagate client cancel upstream
      anthropicResponse.body?.cancel?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
