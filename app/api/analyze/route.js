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

// Retry helper for rate limit errors
async function fetchWithRetry(url, options, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429 && attempt < maxRetries) {
      const retryAfter = response.headers.get("retry-after");
      const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 15000;
      await new Promise(resolve => setTimeout(resolve, waitMs));
      continue;
    }
    
    return response;
  }
}

export async function POST(request) {
  try {
    const { question, mode, articles } = await request.json();

    if (!question) {
      return Response.json({ error: "Question is required" }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "API key not configured" }, { status: 500 });
    }

    let userPrompt;
    if (mode === "manual") {
      userPrompt = `Analyze this political event using the 5-pillar methodology. IMPORTANT: Respond in the SAME language as the question below.

**Event:** ${question}

**User-provided sources:**
${articles}

Apply ALL 5 pillars. Be ruthless in detecting political theater vs genuine developments.`;
    } else {
      userPrompt = `Search for latest news about this political event, gather multiple sources (4-6), then apply the full 5-pillar analysis. IMPORTANT: Respond in the SAME language as the question below.

**Event:** ${question}

Find multiple perspectives, then deliver the complete 5-pillar analysis. Pay attention to contradictions between what actors SAY and DO.`;
    }

    const body = {
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    };

    if (mode === "auto") {
      body.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      if (data.error.message?.includes("rate limit")) {
        return Response.json({ 
          error: "The analysis engine is busy. Please wait 30 seconds and try again. / محرك التحليل مشغول. يرجى الانتظار 30 ثانية والمحاولة مرة أخرى." 
        }, { status: 429 });
      }
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    const textContent = data.content
      ?.filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return Response.json({ result: textContent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
