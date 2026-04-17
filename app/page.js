"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";

// ─── Utilities ────────────────────────────────────────────────────────────────

function isRTL(text) {
  if (!text) return false;
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
}

const PILLAR_MATCHERS = [
  { pillar: 1, icon: "📡", keys: ["PILLAR 1", "Chain of Events", "الركيزة 1", "سلسلة الأحداث", "التتبع"] },
  { pillar: 2, icon: "🌍", keys: ["PILLAR 2", "Background", "الركيزة 2", "السياق", "الخلفية"] },
  { pillar: 3, icon: "🔬", keys: ["PILLAR 3", "Circumstantial", "الركيزة 3", "الظرفي"] },
  { pillar: 4, icon: "🔎", keys: ["PILLAR 4", "Source", "الركيزة 4", "المصادر", "تحليل المصادر"] },
  { pillar: 5, icon: "🔗", keys: ["PILLAR 5", "Domain Linking", "Power", "Reality Check", "الركيزة 5", "الربط", "القوى"] },
  { pillar: "final", icon: "⚖️", keys: ["FINAL", "ASSESSMENT", "التقييم النهائي", "الحكم"] },
  { pillar: "summary", icon: "📋", keys: ["PLAIN", "SUMMARY", "ملخص", "موجز"] },
  { pillar: "sources", icon: "📰", keys: ["SOURCES CONSULTED", "SOURCES", "المصادر المستشارة", "المراجع"] },
];

function identifyPillar(title) {
  for (const m of PILLAR_MATCHERS) {
    if (m.keys.some((k) => title.includes(k))) return { pillar: m.pillar, icon: m.icon };
  }
  return { pillar: null, icon: "" };
}

function parseAnalysis(text) {
  if (!text) return [];
  const sections = [];
  const lines = text.split("\n");
  let current = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      const title = line.replace("## ", "").trim();
      const { pillar, icon } = identifyPillar(title);
      current = { title, pillar, icon, content: "" };
    } else if (line.startsWith("# ") && !line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace("# ", "").trim(), pillar: "header", icon: "", content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

function extractTheaterRating(text) {
  if (!text) return null;
  if (text.includes("🎭") && /POLITICAL THEATER|THEATER|مسرح سياسي|مسرح/.test(text))
    return { rating: "theater", label: "🎭 POLITICAL THEATER", color: "#ffaa00", icon: "🎭" };
  if (text.includes("🔴") && /GENUINE CRISIS|أزمة حقيقية/.test(text))
    return { rating: "crisis", label: "🔴 GENUINE CRISIS", color: "#ff3366", icon: "🔴" };
  if (text.includes("⚠️") && /MIXED|مختلط/.test(text))
    return { rating: "mixed", label: "⚠️ MIXED", color: "#ff6b00", icon: "⚠️" };
  return null;
}

function extractSourcesList(text) {
  const sources = [];
  for (const line of text.split("\n")) {
    const m = line.match(/^-\s+\*\*(.+?)\*\*\s*[—–-]\s*(.+)$/);
    if (m) sources.push({ name: m[1].trim(), detail: m[2].trim() });
  }
  return sources;
}

const PILLAR_COLORS = {
  1: "#00d4ff", 2: "#00ff88", 3: "#ff6b00", 4: "#ff3366",
  5: "#aa55ff", final: "#ffd700", header: "#ffffff",
  summary: "#00d4ff", sources: "#667788",
};

// ─── Small presentational components ─────────────────────────────────────────

function TheaterBadge({ rating }) {
  if (!rating) return null;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: `${rating.color}15`, border: `1px solid ${rating.color}40`, borderRadius: 8, padding: "8px 16px", marginBottom: 16 }}>
      <span style={{ fontSize: 20 }}>{rating.icon}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: rating.color, letterSpacing: 1 }}>{rating.label}</span>
    </div>
  );
}

function SourcesListSection({ content, rtl }) {
  const sources = extractSourcesList(content);
  if (sources.length === 0) return null;
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ fontSize: 11, color: "#667788", letterSpacing: 1.5, fontWeight: 600, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>{sources.length} SOURCES REFERENCED</div>
      {sources.map((s, i) => (
        <div key={i} dir={rtl ? "rtl" : "ltr"} style={{ display: "flex", alignItems: "center", padding: "8px 12px", marginBottom: 4, background: "rgba(0,212,255,0.03)", borderRadius: 4, borderLeft: rtl ? "none" : "2px solid #334455", borderRight: rtl ? "2px solid #334455" : "none" }}>
          <div style={{ flex: 1 }}>
            <span style={{ color: "#d0d8e8", fontWeight: 600, fontSize: 13 }}>{s.name}</span>
            <span style={{ color: "#556677", fontSize: 12, marginLeft: rtl ? 0 : 8, marginRight: rtl ? 8 : 0 }}>{s.detail}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text, label = "COPY" }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };
  return (
    <button onClick={onCopy} style={{ background: copied ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${copied ? "rgba(0,255,136,0.3)" : "rgba(255,255,255,0.08)"}`, color: copied ? "#00ff88" : "#778899", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1, transition: "all 0.2s" }}>
      {copied ? "✓ COPIED" : label}
    </button>
  );
}

function PillarSection({ section, index, rtl }) {
  const [open, setOpen] = useState(true);
  const color = PILLAR_COLORS[section.pillar] || "#8899aa";
  const theaterRating = section.pillar === 5 ? extractTheaterRating(section.content) : null;
  const isSummary = section.pillar === "summary";
  const isSources = section.pillar === "sources";

  const renderContent = (text) => text.split("\n").map((line, i) => {
    if (!line.trim()) return <div key={i} style={{ height: 8 }} />;
    if (line.includes("🎭") || line.includes("🔴") || line.includes("⚠️")) {
      const r = extractTheaterRating(line);
      return r ? <div key={i} style={{ margin: "8px 0" }}><TheaterBadge rating={r} /></div> : null;
    }
    if (line.startsWith("**") && line.includes("**")) {
      const parts = line.split("**");
      return <p key={i} dir={rtl ? "rtl" : "ltr"} style={{ margin: "4px 0", lineHeight: 1.9, fontSize: 14, color: "#a8b4c8", textAlign: rtl ? "right" : "left" }}>{parts.map((part, j) => j % 2 === 1 ? <strong key={j} style={{ color: "#d0d8e8" }}>{part}</strong> : part)}</p>;
    }
    if (line.startsWith("- ")) return <div key={i} dir={rtl ? "rtl" : "ltr"} style={{ display: "flex", gap: 8, margin: "3px 0 3px 8px", lineHeight: 1.9, fontSize: 14, color: "#a8b4c8", textAlign: rtl ? "right" : "left" }}><span style={{ color: color + "88", flexShrink: 0 }}>▸</span><span>{line.slice(2)}</span></div>;
    return <p key={i} dir={rtl ? "rtl" : "ltr"} style={{ margin: "4px 0", lineHeight: 1.9, fontSize: 14, color: "#a8b4c8", textAlign: rtl ? "right" : "left" }}>{line}</p>;
  });

  if (section.pillar === "header") {
    return (
      <div dir={rtl ? "rtl" : "ltr"} style={{ textAlign: "center", padding: "20px 0 10px", borderBottom: "1px solid rgba(0,212,255,0.15)" }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#e8ecf4", letterSpacing: 0.5, margin: 0 }}>{section.title}</h2>
      </div>
    );
  }

  const sectionMarkdown = `## ${section.title}\n${section.content}`;

  return (
    <div style={{ background: isSummary ? "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(170,85,255,0.04))" : "linear-gradient(135deg, rgba(10,14,28,0.95), rgba(15,20,35,0.9))", border: isSummary ? "1px solid rgba(0,212,255,0.2)" : `1px solid ${color}22`, borderLeft: rtl ? "none" : `3px solid ${color}`, borderRight: rtl ? `3px solid ${color}` : "none", borderRadius: 8, marginBottom: 16, overflow: "hidden", animation: `fadeSlideIn 0.4s ease ${Math.min(index * 0.06, 0.5)}s both` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: `linear-gradient(${rtl ? "270deg" : "90deg"}, ${color}08, transparent)` }}>
        <button onClick={() => setOpen(!open)} dir={rtl ? "rtl" : "ltr"} style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: rtl ? "right" : "left" }}>
          <span style={{ fontSize: 20 }}>{section.icon}</span>
          <span style={{ color, fontWeight: 700, fontSize: 14, letterSpacing: 0.8, fontFamily: rtl ? "'Segoe UI', sans-serif" : "'JetBrains Mono', monospace" }}>{section.title}</span>
          {isSummary && <span style={{ fontSize: 10, color: "#00d4ff88", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginLeft: 4 }}>TL;DR</span>}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CopyButton text={sectionMarkdown} />
          <span onClick={() => setOpen(!open)} style={{ color: "#556", fontSize: 18, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s", cursor: "pointer", padding: "0 4px" }}>▾</span>
        </div>
      </div>
      {open && (
        <div style={{ padding: "4px 18px 18px" }}>
          {theaterRating && <TheaterBadge rating={theaterRating} />}
          {isSources ? <SourcesListSection content={section.content} rtl={rtl} /> : renderContent(section.content)}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ analysis, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const sections = useMemo(() => parseAnalysis(analysis.result), [analysis.result]);
  const date = new Date(analysis.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const pillar5 = sections.find((s) => s.pillar === 5);
  const theaterRating = pillar5 ? extractTheaterRating(pillar5.content) : null;
  const cardRtl = isRTL(analysis.question);

  const handleExport = (e) => {
    e.stopPropagation();
    const blob = new Blob([`# Political Analysis: ${analysis.question}\n\nDate: ${date}\nMode: ${analysis.mode === "auto" ? "Auto-Search" : "Manual Input"}\nModel: ${analysis.model || "claude"}\n\n${analysis.result}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analysis-${analysis.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #0a0e1c, #0f1525)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", gap: 12 }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div dir={cardRtl ? "rtl" : "ltr"} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ color: "#e0e6f0", fontWeight: 600, fontSize: 15, overflow: "hidden", textOverflow: "ellipsis" }}>{analysis.question}</div>
            {theaterRating && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theaterRating.color, background: `${theaterRating.color}15`, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{theaterRating.icon} {theaterRating.label}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#556677", flexWrap: "wrap" }}>
            <span>{date}</span>
            <span style={{ background: analysis.mode === "auto" ? "rgba(0,212,255,0.12)" : "rgba(170,85,255,0.12)", color: analysis.mode === "auto" ? "#00d4ff" : "#aa55ff", padding: "1px 8px", borderRadius: 4, fontWeight: 600 }}>{analysis.mode === "auto" ? "AUTO-SEARCH" : "MANUAL"}</span>
            {analysis.depth === "deep" && <span style={{ background: "rgba(255,215,0,0.12)", color: "#ffd700", padding: "1px 8px", borderRadius: 4, fontWeight: 600 }}>OPUS</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={handleExport} style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>EXPORT</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(analysis.id); }} style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✕</button>
          <span style={{ color: "#445", fontSize: 18, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "0.3s", display: "flex", alignItems: "center", marginLeft: 4 }}>▾</span>
        </div>
      </div>
      {expanded && <div style={{ padding: "0 18px 18px" }}>{sections.map((s, i) => <PillarSection key={i} section={s} index={i} rtl={cardRtl} />)}</div>}
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("auto");
  const [depth, setDepth] = useState("standard"); // "standard" = Sonnet, "deep" = Opus
  const [manualArticles, setManualArticles] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState(""); // live-updating
  const [currentResult, setCurrentResult] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [view, setView] = useState("analyze");
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [historyFilter, setHistoryFilter] = useState("");

  const abortRef = useRef(null);
  const resultRef = useRef(null);
  const textareaRef = useRef(null);

  // Load history
  useEffect(() => {
    try {
      const saved = localStorage.getItem("political_analyses");
      if (saved) setAnalyses(JSON.parse(saved));
    } catch {}
  }, []);

  // Cooldown tick
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const saveAnalyses = useCallback((updated) => {
    setAnalyses(updated);
    try { localStorage.setItem("political_analyses", JSON.stringify(updated)); } catch {}
  }, []);

  const questionRtl = isRTL(question);
  const streamRtl = isRTL(streamingText);
  const resultRtl = currentResult ? isRTL(currentResult.result) : streamRtl;

  const stopAnalysis = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const runAnalysis = useCallback(async () => {
    if (!question.trim() || loading || cooldown > 0) return;
    if (mode === "manual" && !manualArticles.trim()) return;

    setLoading(true);
    setError(null);
    setCurrentResult(null);
    setStreamingText("");
    setStatusMsg(mode === "auto" ? "Connecting to engine..." : "Processing sources...");

    const controller = new AbortController();
    abortRef.current = controller;

    let accumulated = "";
    let meta = null;

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), mode, articles: manualArticles, depth }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try { const j = await res.json(); msg = j.error || msg; } catch {}
        throw new Error(msg);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }

          if (msg.meta) {
            meta = msg.meta;
          } else if (msg.text) {
            accumulated += msg.text;
            setStreamingText(accumulated);
            if (statusMsg) setStatusMsg(""); // text started, hide status
          } else if (msg.status === "searching") {
            setStatusMsg(questionRtl ? "جارٍ البحث في الويب..." : "Searching the web...");
          } else if (msg.heartbeat) {
            // keep-alive, ignore
          } else if (msg.error) {
            throw new Error(msg.error);
          } else if (msg.done) {
            // finished
          }
        }
      }

      if (!accumulated.trim()) throw new Error("No analysis generated");

      const entry = {
        id: Date.now(),
        question: question.trim(),
        mode,
        depth,
        model: meta?.model,
        result: accumulated,
        timestamp: new Date().toISOString(),
      };
      setCurrentResult(entry);
      saveAnalyses([entry, ...analyses]);
      setStreamingText(""); // hand off to currentResult rendering
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(questionRtl ? "تم إلغاء التحليل." : "Analysis cancelled.");
        if (accumulated.trim()) {
          // Save partial result so work isn't lost
          const entry = {
            id: Date.now(),
            question: question.trim(),
            mode,
            depth,
            model: meta?.model,
            result: accumulated + "\n\n*[Analysis cancelled — partial result]*",
            timestamp: new Date().toISOString(),
            partial: true,
          };
          setCurrentResult(entry);
          saveAnalyses([entry, ...analyses]);
        }
      } else {
        setError(err.message || "Analysis failed.");
        // Only cooldown on rate-limit-ish errors
        if (/rate.?limit|429/i.test(err.message || "")) setCooldown(30);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
      setStatusMsg("");
      setStreamingText("");
    }
  }, [question, mode, manualArticles, depth, loading, cooldown, analyses, saveAnalyses, questionRtl, statusMsg]);

  // Keyboard shortcut: Ctrl/Cmd+Enter to submit
  const onKeyDown = useCallback((e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      runAnalysis();
    }
  }, [runAnalysis]);

  // Live streaming sections (parse on every update)
  const liveSections = useMemo(() => {
    if (!streamingText && !currentResult) return [];
    return parseAnalysis(streamingText || currentResult?.result || "");
  }, [streamingText, currentResult]);

  const finalSections = useMemo(
    () => (currentResult ? parseAnalysis(currentResult.result) : []),
    [currentResult]
  );

  const displaySections = streamingText ? liveSections : finalSections;
  const pillar5 = displaySections.find((s) => s.pillar === 5);
  const theaterRating = pillar5 ? extractTheaterRating(pillar5.content) : null;

  // Filtered history
  const filteredAnalyses = useMemo(() => {
    if (!historyFilter.trim()) return analyses;
    const q = historyFilter.toLowerCase();
    return analyses.filter((a) =>
      a.question.toLowerCase().includes(q) || a.result.toLowerCase().includes(q)
    );
  }, [analyses, historyFilter]);

  const canSubmit = question.trim() && !loading && cooldown <= 0 && !(mode === "manual" && !manualArticles.trim());

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #050810, #0a0e1c 30%, #0d1220 60%, #080c18)", color: "#c0c8d8", fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,212,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "linear-gradient(180deg, rgba(5,8,16,0.98), rgba(5,8,16,0.92))", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,212,255,0.08)", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #00d4ff22, #aa55ff22)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, color: "#e8ecf4", letterSpacing: -0.3 }}>POLITICAL ANALYSIS<span style={{ color: "#00d4ff" }}> ENGINE</span></div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#445566", letterSpacing: 2, fontWeight: 600 }}>5-PILLAR • THEATER DETECTION • STREAMING</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
            {[{ key: "analyze", label: "ANALYZE" }, { key: "history", label: `HISTORY${analyses.length ? ` (${analyses.length})` : ""}` }].map((tab) => (
              <button key={tab.key} onClick={() => setView(tab.key)} style={{ padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 1, background: view === tab.key ? "rgba(0,212,255,0.12)" : "transparent", color: view === tab.key ? "#00d4ff" : "#556677", transition: "all 0.2s" }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>
        {view === "analyze" ? (
          <>
            {/* Mode */}
            <div style={{ marginBottom: 12, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[{ key: "auto", icon: "🌐", label: "Auto-Search", desc: "Live web search" }, { key: "manual", icon: "📎", label: "Manual Input", desc: "Paste your own articles" }].map((m) => (
                <button key={m.key} onClick={() => setMode(m.key)} style={{ flex: 1, minWidth: 200, padding: "16px 20px", borderRadius: 10, cursor: "pointer", background: mode === m.key ? "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(170,85,255,0.05))" : "rgba(255,255,255,0.02)", border: mode === m.key ? "1px solid rgba(0,212,255,0.25)" : "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 20 }}>{m.icon}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: mode === m.key ? "#00d4ff" : "#667788", letterSpacing: 0.5 }}>{m.label}</span></div>
                  <div style={{ fontSize: 12, color: "#445566", marginLeft: 30 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {/* Depth toggle */}
            <div style={{ marginBottom: 16, display: "flex", gap: 8, alignItems: "center", padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#667788", letterSpacing: 1.5, fontWeight: 600 }}>DEPTH</span>
              {[{ key: "standard", label: "STANDARD", sub: "Sonnet 4.6 • fast", color: "#00d4ff" }, { key: "deep", label: "DEEP", sub: "Opus 4.7 • thorough", color: "#ffd700" }].map((d) => (
                <button key={d.key} onClick={() => setDepth(d.key)} style={{ padding: "6px 12px", borderRadius: 6, border: depth === d.key ? `1px solid ${d.color}40` : "1px solid rgba(255,255,255,0.05)", background: depth === d.key ? `${d.color}10` : "transparent", color: depth === d.key ? d.color : "#556677", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 0.5 }}>
                  {d.label} <span style={{ opacity: 0.6, fontWeight: 400, marginLeft: 4 }}>· {d.sub}</span>
                </button>
              ))}
            </div>

            {/* Question */}
            <div style={{ background: "linear-gradient(135deg, #0a0e1c, #0f1525)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00d4ff88", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>
                POLITICAL EVENT / QUESTION — TYPE IN ANY LANGUAGE
                <span style={{ float: questionRtl ? "left" : "right", color: "#556677", fontWeight: 400, letterSpacing: 0.5 }}>{question.length}/2000 · ⌘/Ctrl+Enter to run</span>
              </label>
              <textarea
                ref={textareaRef}
                dir={questionRtl ? "rtl" : "ltr"}
                value={question}
                onChange={(e) => setQuestion(e.target.value.slice(0, 2000))}
                onKeyDown={onKeyDown}
                placeholder="e.g. What are the implications of the latest US-China trade tensions? / ما هي تداعيات التوترات التجارية الأخيرة بين أمريكا والصين؟"
                rows={3}
                style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px", color: "#d0d8e8", fontSize: 15, fontFamily: "'Segoe UI', sans-serif", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", textAlign: questionRtl ? "right" : "left" }}
              />
            </div>

            {mode === "manual" && (
              <div style={{ background: "linear-gradient(135deg, #0a0e1c, #0f1525)", border: "1px solid rgba(170,85,255,0.1)", borderRadius: 12, padding: 20, marginBottom: 16, animation: "fadeSlideIn 0.3s ease" }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#aa55ff88", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>
                  PASTE ARTICLES / NEWS SOURCES
                  <span style={{ float: "right", color: "#556677", fontWeight: 400, letterSpacing: 0.5 }}>{manualArticles.length}/50000</span>
                </label>
                <textarea
                  dir={isRTL(manualArticles) ? "rtl" : "ltr"}
                  value={manualArticles}
                  onChange={(e) => setManualArticles(e.target.value.slice(0, 50000))}
                  placeholder={"Paste article text, URLs, or excerpts here...\nالصق نص المقال أو الروابط هنا..."}
                  rows={8}
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px", color: "#d0d8e8", fontSize: 14, fontFamily: "'Segoe UI', sans-serif", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", textAlign: isRTL(manualArticles) ? "right" : "left" }}
                />
              </div>
            )}

            {/* Run / Stop */}
            {!loading ? (
              <button onClick={runAnalysis} disabled={!canSubmit} style={{ width: "100%", padding: "16px", borderRadius: 10, border: canSubmit ? "1px solid rgba(0,212,255,0.2)" : "1px solid rgba(255,255,255,0.04)", background: canSubmit ? "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(170,85,255,0.1))" : "rgba(255,255,255,0.03)", color: canSubmit ? "#00d4ff" : "#445566", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: 2, cursor: canSubmit ? "pointer" : "not-allowed", transition: "all 0.3s", marginBottom: 32 }}>
                {cooldown > 0 ? `COOLDOWN — ${cooldown}s` : "▶ RUN ANALYSIS"}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
                <div style={{ flex: 1, padding: "16px", borderRadius: 10, border: "1px solid rgba(0,212,255,0.1)", background: "rgba(0,212,255,0.06)", color: "#00d4ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, letterSpacing: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span className="pulse-anim">◉</span>
                  {statusMsg || (streamingText ? (questionRtl ? "جارٍ التحليل..." : "STREAMING...") : (questionRtl ? "التهيئة..." : "INITIALIZING..."))}
                </div>
                <button onClick={stopAnalysis} style={{ padding: "0 24px", borderRadius: 10, border: "1px solid rgba(255,51,102,0.25)", background: "rgba(255,51,102,0.08)", color: "#ff4466", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, letterSpacing: 1.5, cursor: "pointer" }}>
                  ■ STOP
                </button>
              </div>
            )}

            {error && <div style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", borderRadius: 10, padding: "16px 20px", marginBottom: 24, color: "#ff6688", fontSize: 14 }}><strong>Error:</strong> {error}</div>}

            {/* Live streaming or final result */}
            {(streamingText || currentResult) && (
              <div ref={resultRef} style={{ animation: "fadeSlideIn 0.5s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: streamingText ? "#ffaa00" : "#00d4ff66", letterSpacing: 2, fontWeight: 600 }}>
                      {streamingText ? "STREAMING" : "ANALYSIS COMPLETE"} — {displaySections.filter((s) => typeof s.pillar === "number").length}/5 PILLARS
                    </div>
                    {theaterRating && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theaterRating.color, background: `${theaterRating.color}15`, border: `1px solid ${theaterRating.color}30`, padding: "3px 10px", borderRadius: 4, letterSpacing: 0.5 }}>{theaterRating.icon} {theaterRating.label}</span>}
                  </div>
                  {currentResult && !streamingText && (
                    <div style={{ display: "flex", gap: 6 }}>
                      <CopyButton text={currentResult.result} label="COPY ALL" />
                      <button onClick={() => { const blob = new Blob([`# Political Analysis: ${currentResult.question}\n\n${currentResult.result}`], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `analysis-${currentResult.id}.md`; a.click(); URL.revokeObjectURL(url); }} style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", padding: "4px 10px", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>⬇ .MD</button>
                    </div>
                  )}
                </div>
                {displaySections.map((s, i) => <PillarSection key={`${i}-${s.title}`} section={s} index={i} rtl={resultRtl} />)}
              </div>
            )}

            {!currentResult && !loading && !streamingText && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#334" }}>
                <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚡</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 2, color: "#334455" }}>AWAITING QUERY</div>
                <div style={{ fontSize: 13, color: "#2a3344", marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>Enter a political event or question in any language to run a full 5-pillar analysis</div>
                <div style={{ fontSize: 12, color: "#223344", marginTop: 4, direction: "rtl" }}>أدخل حدثاً سياسياً أو سؤالاً بأي لغة لتشغيل التحليل الكامل</div>
              </div>
            )}
          </>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#556677", letterSpacing: 2, fontWeight: 600 }}>
                SAVED ANALYSES ({filteredAnalyses.length}{historyFilter && `/${analyses.length}`})
              </div>
              {analyses.length > 0 && <button onClick={() => { if (confirm("Clear all saved analyses?")) saveAnalyses([]); }} style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.15)", color: "#ff4466", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>CLEAR ALL</button>}
            </div>

            {analyses.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <input
                  type="text"
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value)}
                  placeholder="🔍 Search questions or analysis content..."
                  dir={isRTL(historyFilter) ? "rtl" : "ltr"}
                  style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "12px 16px", color: "#d0d8e8", fontSize: 14, fontFamily: "'Segoe UI', sans-serif", boxSizing: "border-box", textAlign: isRTL(historyFilter) ? "right" : "left" }}
                />
              </div>
            )}

            {analyses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a3344" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📁</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 2, color: "#334455" }}>NO SAVED ANALYSES</div>
              </div>
            ) : filteredAnalyses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#334455", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 1 }}>NO MATCHES FOR "{historyFilter}"</div>
            ) : (
              filteredAnalyses.map((a) => <AnalysisCard key={a.id} analysis={a} onDelete={(id) => saveAnalyses(analyses.filter((x) => x.id !== id))} />)
            )}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.03)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#223344", letterSpacing: 1 }}>POLITICAL ANALYSIS ENGINE — 5-PILLAR METHODOLOGY — THEATER DETECTION — POWERED BY CLAUDE AI</footer>
    </div>
  );
}
