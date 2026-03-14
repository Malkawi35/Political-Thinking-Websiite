"use client";
import { useState, useEffect, useRef } from "react";

// Detect if text contains Arabic characters
function isRTL(text) {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
}

// Parse markdown-like formatting for display
function parseAnalysis(text) {
  if (!text) return [];
  const sections = [];
  const lines = text.split("\n");
  let current = null;
  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (current) sections.push(current);
      const title = line.replace("## ", "").trim();
      let pillar = null, icon = "";
      if (title.includes("PILLAR 1") || title.includes("Chain of Events") || title.includes("الركيزة 1") || title.includes("سلسلة الأحداث") || title.includes("التتبع")) { pillar = 1; icon = "📡"; }
      else if (title.includes("PILLAR 2") || title.includes("Background") || title.includes("الركيزة 2") || title.includes("السياق") || title.includes("الخلفية")) { pillar = 2; icon = "🌍"; }
      else if (title.includes("PILLAR 3") || title.includes("Circumstantial") || title.includes("الركيزة 3") || title.includes("الظرفي")) { pillar = 3; icon = "🔬"; }
      else if (title.includes("PILLAR 4") || title.includes("Source") || title.includes("الركيزة 4") || title.includes("المصادر") || title.includes("تحليل المصادر")) { pillar = 4; icon = "🔎"; }
      else if (title.includes("PILLAR 5") || title.includes("Domain Linking") || title.includes("Power") || title.includes("Reality Check") || title.includes("الركيزة 5") || title.includes("الربط") || title.includes("القوى")) { pillar = 5; icon = "🔗"; }
      else if (title.includes("FINAL") || title.includes("ASSESSMENT") || title.includes("التقييم النهائي") || title.includes("الحكم")) { pillar = "final"; icon = "⚖️"; }
      else if (title.includes("PLAIN") || title.includes("SUMMARY") || title.includes("ملخص") || title.includes("موجز")) { pillar = "summary"; icon = "📋"; }
      else if (title.includes("SOURCES CONSULTED") || title.includes("SOURCES") || title.includes("المصادر المستشارة") || title.includes("المراجع")) { pillar = "sources"; icon = "📰"; }
      current = { title, pillar, icon, content: "" };
    } else if (line.startsWith("# ") && !line.startsWith("## ")) {
      if (current) sections.push(current);
      current = { title: line.replace("# ", ""), pillar: "header", icon: "", content: "" };
    } else if (current) {
      current.content += line + "\n";
    }
  }
  if (current) sections.push(current);
  return sections;
}

function extractTheaterRating(text) {
  if (text.includes("🎭") && (text.includes("POLITICAL THEATER") || text.includes("THEATER") || text.includes("مسرح سياسي") || text.includes("مسرح"))) return { rating: "theater", label: "🎭 POLITICAL THEATER / مسرح سياسي", color: "#ffaa00", icon: "🎭" };
  if (text.includes("🔴") && (text.includes("GENUINE CRISIS") || text.includes("أزمة حقيقية"))) return { rating: "crisis", label: "🔴 GENUINE CRISIS / أزمة حقيقية", color: "#ff3366", icon: "🔴" };
  if (text.includes("⚠️") && (text.includes("MIXED") || text.includes("مختلط"))) return { rating: "mixed", label: "⚠️ MIXED / مختلط", color: "#ff6b00", icon: "⚠️" };
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

function PillarSection({ section, index, rtl }) {
  const [open, setOpen] = useState(true);
  const pillarColors = { 1: "#00d4ff", 2: "#00ff88", 3: "#ff6b00", 4: "#ff3366", 5: "#aa55ff", final: "#ffd700", header: "#ffffff", summary: "#00d4ff", sources: "#667788" };
  const color = pillarColors[section.pillar] || "#8899aa";
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

  if (section.pillar === "header") return <div dir={rtl ? "rtl" : "ltr"} style={{ textAlign: "center", padding: "20px 0 10px", borderBottom: "1px solid rgba(0,212,255,0.15)" }}><h2 style={{ fontSize: 22, fontWeight: 700, color: "#e8ecf4", letterSpacing: 0.5, margin: 0 }}>{section.title}</h2></div>;

  return (
    <div style={{ background: isSummary ? "linear-gradient(135deg, rgba(0,212,255,0.06), rgba(170,85,255,0.04))" : "linear-gradient(135deg, rgba(10,14,28,0.95), rgba(15,20,35,0.9))", border: isSummary ? "1px solid rgba(0,212,255,0.2)" : `1px solid ${color}22`, borderLeft: rtl ? "none" : `3px solid ${color}`, borderRight: rtl ? `3px solid ${color}` : "none", borderRadius: 8, marginBottom: 16, overflow: "hidden", animation: `fadeSlideIn 0.5s ease ${index * 0.1}s both` }}>
      <button onClick={() => setOpen(!open)} dir={rtl ? "rtl" : "ltr"} style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(${rtl ? "270deg" : "90deg"}, ${color}08, transparent)`, border: "none", cursor: "pointer" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>{section.icon}</span>
          <span style={{ color, fontWeight: 700, fontSize: 14, letterSpacing: 0.8, fontFamily: rtl ? "'Segoe UI', 'Arabic UI', sans-serif" : "'JetBrains Mono', 'Fira Code', monospace" }}>{section.title}</span>
          {isSummary && <span style={{ fontSize: 10, color: "#00d4ff88", fontFamily: "'JetBrains Mono', monospace", letterSpacing: 1, marginLeft: 4 }}>TL;DR</span>}
        </div>
        <span style={{ color: "#556", fontSize: 18, transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s" }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: "4px 18px 18px" }}>
          {theaterRating && <TheaterBadge rating={theaterRating} />}
          {isSources ? <SourcesListSection content={section.content} rtl={rtl} /> : renderContent(section.content)}
        </div>
      )}
    </div>
  );
}

function AnalysisCard({ analysis, onDelete, rtl }) {
  const [expanded, setExpanded] = useState(false);
  const sections = parseAnalysis(analysis.result);
  const date = new Date(analysis.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const pillar5 = sections.find(s => s.pillar === 5);
  const theaterRating = pillar5 ? extractTheaterRating(pillar5.content) : null;
  const cardRtl = isRTL(analysis.question);

  const handleExport = () => {
    const blob = new Blob([`# Political Analysis: ${analysis.question}\n\nDate: ${date}\nMode: ${analysis.mode === "auto" ? "Auto-Search" : "Manual Input"}\n\n${analysis.result}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `analysis-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #0a0e1c, #0f1525)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 10, marginBottom: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        <div style={{ flex: 1 }}>
          <div dir={cardRtl ? "rtl" : "ltr"} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ color: "#e0e6f0", fontWeight: 600, fontSize: 15 }}>{analysis.question}</div>
            {theaterRating && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theaterRating.color, background: `${theaterRating.color}15`, padding: "2px 8px", borderRadius: 4, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{theaterRating.icon} {theaterRating.label}</span>}
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#556677" }}>
            <span>{date}</span>
            <span style={{ background: analysis.mode === "auto" ? "rgba(0,212,255,0.12)" : "rgba(170,85,255,0.12)", color: analysis.mode === "auto" ? "#00d4ff" : "#aa55ff", padding: "1px 8px", borderRadius: 4, fontWeight: 600 }}>{analysis.mode === "auto" ? "AUTO-SEARCH" : "MANUAL"}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={(e) => { e.stopPropagation(); handleExport(); }} style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>EXPORT</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(analysis.id); }} style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", color: "#ff3366", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600 }}>✕</button>
          <span style={{ color: "#445", fontSize: 18, transform: expanded ? "rotate(180deg)" : "rotate(0)", transition: "0.3s", display: "flex", alignItems: "center", marginLeft: 4 }}>▾</span>
        </div>
      </div>
      {expanded && <div style={{ padding: "0 18px 18px" }}>{sections.map((s, i) => <PillarSection key={i} section={s} index={i} rtl={cardRtl} />)}</div>}
    </div>
  );
}

export default function Home() {
  const [question, setQuestion] = useState("");
  const [mode, setMode] = useState("auto");
  const [manualArticles, setManualArticles] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [view, setView] = useState("analyze");
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const resultRef = useRef(null);

  useEffect(() => {
    try { const saved = localStorage.getItem("political_analyses"); if (saved) setAnalyses(JSON.parse(saved)); } catch(e){}
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const saveAnalyses = (updated) => { setAnalyses(updated); try { localStorage.setItem("political_analyses", JSON.stringify(updated)); } catch(e){} };

  // Detect if current question is RTL
  const questionRtl = isRTL(question);
  // Detect if current result is RTL
  const resultRtl = currentResult ? isRTL(currentResult.result) : false;

  const runAnalysis = async () => {
    if (!question.trim() || cooldown > 0) return;
    setLoading(true); setError(null); setCurrentResult(null);
    const msgs = questionRtl
      ? ["جارٍ البحث عن مصادر الأخبار...", "جمع المعلومات من مصادر متعددة...", "مقارنة الروايات...", "كشف المسرح مقابل الواقع...", "بناء التحليل بالركائز الخمس..."]
      : mode === "auto"
        ? ["Searching for news sources...", "Gathering intelligence from multiple sources...", "Cross-referencing narratives...", "Detecting theater vs. reality...", "Structuring 5-pillar analysis..."]
        : ["Analyzing provided sources...", "Processing through 5-pillar methodology...", "Running theater detection..."];
    let mi = 0; setStatusMsg(msgs[0]);
    const si = setInterval(() => { mi = Math.min(mi + 1, msgs.length - 1); setStatusMsg(msgs[mi]); }, 12000);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question.trim(), mode, articles: manualArticles }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      if (!data.result) throw new Error("No analysis generated");
      const entry = { id: Date.now(), question: question.trim(), mode, result: data.result, timestamp: new Date().toISOString() };
      setCurrentResult(entry);
      const updated = [entry, ...analyses];
      saveAnalyses(updated);
      setCooldown(30);
      setTimeout(() => { resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300);
    } catch (err) { setError(err.message || "Analysis failed."); } finally { clearInterval(si); setStatusMsg(""); setLoading(false); }
  };

  const sections = currentResult ? parseAnalysis(currentResult.result) : [];
  const p5 = sections.find(s => s.pillar === 5);
  const theaterRating = p5 ? extractTheaterRating(p5.content) : null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(170deg, #050810, #0a0e1c 30%, #0d1220 60%, #080c18)", color: "#c0c8d8", fontFamily: "'Segoe UI', -apple-system, sans-serif" }}>
      {/* Ambient grid */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(0,212,255,0.03) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <header style={{ position: "sticky", top: 0, zIndex: 50, background: "linear-gradient(180deg, rgba(5,8,16,0.98), rgba(5,8,16,0.92))", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(0,212,255,0.08)", padding: "0 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #00d4ff22, #aa55ff22)", border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>⚡</div>
            <div>
              <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 17, color: "#e8ecf4", letterSpacing: -0.3 }}>POLITICAL ANALYSIS<span style={{ color: "#00d4ff" }}> ENGINE</span></div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: "#445566", letterSpacing: 2, fontWeight: 600 }}>5-PILLAR METHODOLOGY • THEATER DETECTION</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 3, border: "1px solid rgba(255,255,255,0.05)" }}>
            {[{ key: "analyze", label: "ANALYZE" }, { key: "history", label: `HISTORY${analyses.length ? ` (${analyses.length})` : ""}` }].map(tab => (
              <button key={tab.key} onClick={() => setView(tab.key)} style={{ padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 1, background: view === tab.key ? "rgba(0,212,255,0.12)" : "transparent", color: view === tab.key ? "#00d4ff" : "#556677", transition: "all 0.2s" }}>{tab.label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px", position: "relative", zIndex: 1 }}>
        {view === "analyze" ? (<>
          <div style={{ marginBottom: 24, display: "flex", gap: 12 }}>
            {[{ key: "auto", icon: "🌐", label: "Auto-Search", desc: "Claude searches live news" }, { key: "manual", icon: "📎", label: "Manual Input", desc: "Paste your own articles" }].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)} style={{ flex: 1, padding: "16px 20px", borderRadius: 10, cursor: "pointer", background: mode === m.key ? "linear-gradient(135deg, rgba(0,212,255,0.08), rgba(170,85,255,0.05))" : "rgba(255,255,255,0.02)", border: mode === m.key ? "1px solid rgba(0,212,255,0.25)" : "1px solid rgba(255,255,255,0.05)", transition: "all 0.3s", textAlign: "left" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}><span style={{ fontSize: 20 }}>{m.icon}</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: mode === m.key ? "#00d4ff" : "#667788", letterSpacing: 0.5 }}>{m.label}</span></div>
                <div style={{ fontSize: 12, color: "#445566", marginLeft: 30 }}>{m.desc}</div>
              </button>
            ))}
          </div>

          <div style={{ background: "linear-gradient(135deg, #0a0e1c, #0f1525)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#00d4ff88", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>POLITICAL EVENT / QUESTION — {questionRtl ? "اكتب سؤالك بالعربية أو الإنجليزية" : "TYPE IN ANY LANGUAGE"}</label>
            <textarea dir={questionRtl ? "rtl" : "ltr"} value={question} onChange={e => setQuestion(e.target.value)} placeholder="e.g. What are the implications of the latest US-China trade tensions? / ما هي تداعيات التوترات التجارية الأخيرة بين أمريكا والصين؟" rows={3} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px", color: "#d0d8e8", fontSize: 15, fontFamily: "'Segoe UI', sans-serif", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", textAlign: questionRtl ? "right" : "left" }} />
          </div>

          {mode === "manual" && (
            <div style={{ background: "linear-gradient(135deg, #0a0e1c, #0f1525)", border: "1px solid rgba(170,85,255,0.1)", borderRadius: 12, padding: 20, marginBottom: 16, animation: "fadeSlideIn 0.3s ease" }}>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#aa55ff88", letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>PASTE ARTICLES / NEWS SOURCES</label>
              <textarea dir={isRTL(manualArticles) ? "rtl" : "ltr"} value={manualArticles} onChange={e => setManualArticles(e.target.value)} placeholder={"Paste article text, URLs, or excerpts here...\nالصق نص المقال أو الروابط هنا..."} rows={8} style={{ width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "14px 16px", color: "#d0d8e8", fontSize: 14, fontFamily: "'Segoe UI', sans-serif", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", textAlign: isRTL(manualArticles) ? "right" : "left" }} />
            </div>
          )}

          <button onClick={runAnalysis} disabled={loading || !question.trim() || (mode === "manual" && !manualArticles.trim()) || cooldown > 0} style={{ width: "100%", padding: "16px", borderRadius: 10, border: loading ? "1px solid rgba(0,212,255,0.1)" : "1px solid rgba(0,212,255,0.2)", background: loading ? "rgba(0,212,255,0.06)" : cooldown > 0 ? "rgba(255,255,255,0.03)" : "linear-gradient(135deg, rgba(0,212,255,0.15), rgba(170,85,255,0.1))", color: loading ? "#557" : cooldown > 0 ? "#445566" : "#00d4ff", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, letterSpacing: 2, cursor: loading || cooldown > 0 ? "wait" : "pointer", transition: "all 0.3s", marginBottom: 32, opacity: (!question.trim() || (mode === "manual" && !manualArticles.trim())) ? 0.4 : 1 }}>
            {loading ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span className="pulse-anim">◉</span>{statusMsg || "ANALYZING..."}</span> : cooldown > 0 ? `COOLDOWN — ${cooldown}s` : "▶ RUN ANALYSIS"}
          </button>

          {error && <div style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.2)", borderRadius: 10, padding: "16px 20px", marginBottom: 24, color: "#ff6688", fontSize: 14 }}><strong>Analysis Error:</strong> {error}</div>}

          {currentResult && (
            <div ref={resultRef} style={{ animation: "fadeSlideIn 0.5s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#00d4ff66", letterSpacing: 2, fontWeight: 600 }}>ANALYSIS COMPLETE — {sections.filter(s => typeof s.pillar === "number").length} PILLARS</div>
                  {theaterRating && <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: theaterRating.color, background: `${theaterRating.color}15`, border: `1px solid ${theaterRating.color}30`, padding: "3px 10px", borderRadius: 4, letterSpacing: 0.5 }}>{theaterRating.icon} {theaterRating.label}</span>}
                </div>
                <button onClick={() => { const blob = new Blob([`# Political Analysis: ${currentResult.question}\n\n${currentResult.result}`], { type: "text/markdown" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `analysis-${Date.now()}.md`; a.click(); URL.revokeObjectURL(url); }} style={{ background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88", padding: "8px 16px", borderRadius: 6, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}>⬇ EXPORT .MD</button>
              </div>
              {sections.map((s, i) => <PillarSection key={i} section={s} index={i} rtl={resultRtl} />)}
            </div>
          )}

          {!currentResult && !loading && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#334" }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>⚡</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, letterSpacing: 2, color: "#334455" }}>AWAITING QUERY</div>
              <div style={{ fontSize: 13, color: "#2a3344", marginTop: 8, maxWidth: 400, margin: "8px auto 0" }}>Enter a political event or question in any language to run a full 5-pillar analysis</div>
              <div style={{ fontSize: 12, color: "#223344", marginTop: 4, direction: "rtl" }}>أدخل حدثاً سياسياً أو سؤالاً بأي لغة لتشغيل التحليل الكامل</div>
            </div>
          )}
        </>) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#556677", letterSpacing: 2, fontWeight: 600 }}>SAVED ANALYSES ({analyses.length})</div>
              {analyses.length > 0 && <button onClick={() => { if (confirm("Clear all saved analyses?")) saveAnalyses([]); }} style={{ background: "rgba(255,51,102,0.08)", border: "1px solid rgba(255,51,102,0.15)", color: "#ff4466", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, letterSpacing: 1 }}>CLEAR ALL</button>}
            </div>
            {analyses.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#2a3344" }}>
                <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }}>📁</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: 2, color: "#334455" }}>NO SAVED ANALYSES</div>
              </div>
            ) : analyses.map(a => <AnalysisCard key={a.id} analysis={a} onDelete={(id) => saveAnalyses(analyses.filter(x => x.id !== id))} />)}
          </div>
        )}
      </main>

      <footer style={{ textAlign: "center", padding: "24px", borderTop: "1px solid rgba(255,255,255,0.03)", fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#223344", letterSpacing: 1 }}>POLITICAL ANALYSIS ENGINE — 5-PILLAR METHODOLOGY — THEATER DETECTION — POWERED BY CLAUDE AI</footer>
    </div>
  );
}
