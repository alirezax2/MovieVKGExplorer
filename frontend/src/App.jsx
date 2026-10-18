import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Database,
  Terminal,
  Network,
  Table,
  Play,
  Copy,
  Check,
  Download,
  AlertCircle,
  Film,
  Search,
  ShieldCheck,
  Cpu,
  Key,
  RefreshCw,
  Sun,
  Moon,
} from "lucide-react";

const DEFAULT_API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const DEFAULT_API_KEY = "dev_movie_vkg_secret_api_key_2026";

const SAMPLE_QUESTIONS = [
  "What are the top 5 highest rated movies?",
  "Show me superhero movies and their ratings",
  "How many movies belong to each movie class?",
  "Find movies released after 2010 with a rating above 8.5",
  "Which subclasses belong to the Action class?",
];

const SAMPLE_QUERIES = [
  {
    title: "Top 10 Highest Rated Movies",
    query: `PREFIX : <https://example.org/movie-vkg/>
SELECT ?movie ?title ?rating ?year ?director WHERE {
  ?movie a :Movie ;
         :title ?title ;
         :rating ?rating ;
         :releaseYear ?year ;
         :director ?director .
}
ORDER BY DESC(?rating) ?title
LIMIT 10`,
  },
  {
    title: "Subclass Taxonomy Hierarchy",
    query: `PREFIX : <https://example.org/movie-vkg/>
SELECT ?className ?subclassName ?description WHERE {
  ?subclass a :MovieSubclass ;
            :name ?subclassName ;
            :description ?description ;
            :belongsToClass ?class .
  ?class a :MovieClass ;
         :name ?className .
}
ORDER BY ?className ?subclassName
LIMIT 15`,
  },
  {
    title: "Movies by Class with Classification",
    query: `PREFIX : <https://example.org/movie-vkg/>
SELECT ?title ?year ?className ?subclassName ?rating WHERE {
  ?m a :Movie ;
     :title ?title ;
     :releaseYear ?year ;
     :rating ?rating ;
     :hasGenreClass ?c ;
     :hasSubclass ?sc .
  ?c :name ?className .
  ?sc :name ?subclassName .
  FILTER(?className = "Sci-Fi")
}
ORDER BY DESC(?rating)
LIMIT 10`,
  },
  {
    title: "Metadata Definitions & Schemas",
    query: `PREFIX : <https://example.org/movie-vkg/>
SELECT ?name ?entityType ?namespace ?version ?description WHERE {
  ?d a :MetadataDefinition ;
     :name ?name ;
     :entityType ?entityType ;
     :namespace ?namespace ;
     :version ?version ;
     :description ?description .
}
LIMIT 10`,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("ask");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [showKeyConfig, setShowKeyConfig] = useState(false);

  // Theme state: dark | light (persisted in localStorage and system preference aware)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("movie_vkg_theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.body.setAttribute("data-theme", theme);
    localStorage.setItem("movie_vkg_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Health state
  const [health, setHealth] = useState(null);
  const [_ready, setReady] = useState(null);

  // Ask tab state
  const [question, setQuestion] = useState("");
  const [askLoading, setAskLoading] = useState(false);
  const [askResult, setAskResult] = useState(null);
  const [askError, setAskError] = useState(null);

  // SPARQL Studio state
  const [sparqlQuery, setSparqlQuery] = useState(SAMPLE_QUERIES[0].query);
  const [queryLimit, setQueryLimit] = useState(50);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [queryError, setQueryError] = useState(null);

  // Ontology state
  const [ontology, setOntology] = useState(null);
  const [ontologyLoading, setOntologyLoading] = useState(false);
  const [ontologyViewMode, setOntologyViewMode] = useState("visual"); // visual or turtle

  // Schema state
  const [schemaData, setSchemaData] = useState(null);
  const [schemaLoading, setSchemaLoading] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  const fetchHealthAndReady = async () => {
    try {
      const hRes = await fetch(`${apiUrl}/health`);
      if (hRes.ok) setHealth(await hRes.json());
      const rRes = await fetch(`${apiUrl}/ready`);
      if (rRes.ok) setReady(await rRes.json());
    } catch {
      setHealth({ status: "offline", database_connected: false, ontop_connected: false });
    }
  };

  const loadOntology = async () => {
    setOntologyLoading(true);
    try {
      const res = await fetch(`${apiUrl}/ontology`, {
        headers: { "X-API-Key": apiKey },
      });
      if (res.ok) {
        setOntology(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setOntologyLoading(false);
    }
  };

  const loadSchema = async () => {
    setSchemaLoading(true);
    try {
      const res = await fetch(`${apiUrl}/schema`, {
        headers: { "X-API-Key": apiKey },
      });
      if (res.ok) {
        setSchemaData(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSchemaLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthAndReady();
  }, [apiUrl]);

  // Load ontology when switching to ontology tab
  useEffect(() => {
    if (activeTab === "ontology" && !ontology) {
      loadOntology();
    }
    if (activeTab === "schema" && !schemaData) {
      loadSchema();
    }
  }, [activeTab]);

  const handleAsk = async (qToAsk) => {
    const q = qToAsk || question;
    if (!q.trim()) return;
    setAskLoading(true);
    setAskError(null);
    setAskResult(null);

    try {
      const res = await fetch(`${apiUrl}/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ question: q }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail?.message || data.detail || "Query failed");
      }
      setAskResult(data);
    } catch (e) {
      setAskError(e.message);
    } finally {
      setAskLoading(false);
    }
  };

  const handleExecuteQuery = async () => {
    if (!sparqlQuery.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);

    try {
      const res = await fetch(`${apiUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ query: sparqlQuery, limit: queryLimit }),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data.detail?.message || data.detail || "Query execution failed";
        throw new Error(msg);
      }
      setQueryResult(data);
    } catch (e) {
      setQueryError(e.message);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportCSV = (results, columns) => {
    if (!results || !results.length) return;
    const header = columns.join(",");
    const rows = results.map((r) =>
      columns.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(",")
    );
    const csvContent = "data:text/csv;charset=utf-8," + [header, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `vkg_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navigation Bar */}
      <header
        style={{
          borderBottom: "1px solid var(--border-color)",
          background: "var(--bg-header)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
            }}
          >
            <Film size={22} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
              Movie VKG Explorer
            </h1>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
              Virtual Knowledge Graph with Ontop, PostgreSQL & OmniRoute AI
            </p>
          </div>
        </div>

        {/* Status Indicators & Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {health && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                className={`badge ${
                  health.database_connected ? "badge-emerald" : "badge-rose"
                }`}
              >
                <div
                  className="pulse-indicator"
                  style={{
                    backgroundColor: health.database_connected ? "#10b981" : "#f43f5e",
                  }}
                />
                PostgreSQL: {health.database_connected ? "1,000 Movies" : "Offline"}
              </div>

              <div
                className={`badge ${
                  health.ontop_connected ? "badge-cyan" : "badge-rose"
                }`}
              >
                <div
                  className="pulse-indicator"
                  style={{
                    backgroundColor: health.ontop_connected ? "#06b6d4" : "#f43f5e",
                  }}
                />
                Ontop VKG: {health.ontop_connected ? "Active" : "Offline"}
              </div>

              <div className="badge badge-indigo">
                <Cpu size={12} />
                OmniRoute: claude-sonnet
              </div>
            </div>
          )}

          {/* Dark / Light Mode Switch Icon Button */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            <div key={theme} className="theme-toggle-icon">
              {theme === "dark" ? (
                <Sun size={18} color="#f59e0b" />
              ) : (
                <Moon size={18} color="#6366f1" />
              )}
            </div>
          </button>

          <button
            onClick={() => setShowKeyConfig(!showKeyConfig)}
            className="glass-panel"
            style={{
              padding: "8px 12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
            }}
          >
            <Key size={14} />
            <span>API Config</span>
          </button>

          <button
            onClick={fetchHealthAndReady}
            style={{
              padding: "8px",
              background: "transparent",
              color: "var(--text-secondary)",
              borderRadius: "var(--radius-md)",
            }}
            title="Refresh status"
            aria-label="Refresh status"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* API Key Modal / Drawer */}
      {showKeyConfig && (
        <div
          className="glass-panel"
          style={{
            margin: "12px 28px",
            padding: "16px 20px",
            background: "var(--bg-card)",
            border: "1px solid var(--border-highlight)",
            display: "flex",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              FastAPI Endpoint URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              style={{ width: "100%", fontSize: "0.85rem" }}
            />
          </div>

          <div style={{ flex: "1 1 320px" }}>
            <label style={{ fontSize: "0.75rem", color: "var(--text-muted)", display: "block", marginBottom: "4px" }}>
              API Key (X-API-Key)
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              style={{ width: "100%", fontSize: "0.85rem" }}
            />
          </div>

          <button
            onClick={() => setShowKeyConfig(false)}
            style={{
              padding: "10px 18px",
              background: "var(--accent-indigo)",
              color: "#fff",
              borderRadius: "var(--radius-md)",
              fontWeight: 600,
              alignSelf: "flex-end",
            }}
          >
            Save & Close
          </button>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid var(--border-color)",
          padding: "0 28px",
          background: "var(--bg-nav)",
        }}
      >
        <button
          onClick={() => setActiveTab("ask")}
          style={{
            padding: "14px 20px",
            background: "transparent",
            color: activeTab === "ask" ? "var(--accent-cyan)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: activeTab === "ask" ? "2px solid var(--accent-cyan)" : "2px solid transparent",
          }}
        >
          <Sparkles size={18} />
          <span>AI Assistant</span>
        </button>

        <button
          onClick={() => setActiveTab("sparql")}
          style={{
            padding: "14px 20px",
            background: "transparent",
            color: activeTab === "sparql" ? "var(--accent-indigo)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: activeTab === "sparql" ? "2px solid var(--accent-indigo)" : "2px solid transparent",
          }}
        >
          <Terminal size={18} />
          <span>SPARQL Studio</span>
        </button>

        <button
          onClick={() => setActiveTab("ontology")}
          style={{
            padding: "14px 20px",
            background: "transparent",
            color: activeTab === "ontology" ? "var(--accent-purple)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: activeTab === "ontology" ? "2px solid var(--accent-purple)" : "2px solid transparent",
          }}
        >
          <Network size={18} />
          <span>Ontology Vocabulary</span>
        </button>

        <button
          onClick={() => setActiveTab("schema")}
          style={{
            padding: "14px 20px",
            background: "transparent",
            color: activeTab === "schema" ? "var(--accent-emerald)" : "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.9rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            borderBottom: activeTab === "schema" ? "2px solid var(--accent-emerald)" : "2px solid transparent",
          }}
        >
          <Database size={18} />
          <span>Relational Schema</span>
        </button>
      </div>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "28px", maxWidth: "1400px", margin: "0 auto", width: "100%" }}>
        {/* =================================================================== */}
        {/* TAB 1: AI ASSISTANT */}
        {/* =================================================================== */}
        {activeTab === "ask" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Input Card */}
            <div className="glass-panel" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Sparkles size={22} color="var(--accent-cyan)" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Ask natural language questions about the Movie Knowledge Graph
                </h2>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "20px" }}>
                OmniRoute translates your query into validated, read-only SPARQL. Ontop translates SPARQL into SQL and executes it over PostgreSQL without materializing triples.
              </p>

              {/* Sample Suggestions */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {SAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuestion(q);
                      handleAsk(q);
                    }}
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-color)",
                      color: "var(--text-secondary)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.78rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>{q}</span>
                  </button>
                ))}
              </div>

              {/* Form Input */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAsk();
                }}
                style={{ display: "flex", gap: "12px" }}
              >
                <div style={{ position: "relative", flex: 1 }}>
                  <Search
                    size={18}
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g. Which action thriller movies have a rating above 8.0?"
                    style={{
                      width: "100%",
                      paddingLeft: "42px",
                      paddingRight: "14px",
                      fontSize: "0.95rem",
                      height: "48px",
                      borderRadius: "var(--radius-md)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={askLoading || !question.trim()}
                  style={{
                    padding: "0 28px",
                    height: "48px",
                    background: "linear-gradient(135deg, #06b6d4 0%, #6366f1 100%)",
                    color: "#ffffff",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: askLoading || !question.trim() ? 0.6 : 1,
                    boxShadow: "0 0 15px rgba(6, 182, 212, 0.3)",
                  }}
                >
                  {askLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      <span>Ask AI</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Error Message */}
            {askError && (
              <div
                className="glass-panel"
                style={{
                  padding: "16px 20px",
                  borderColor: "var(--border-error)",
                  background: "var(--bg-error)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <AlertCircle size={20} color="var(--accent-rose)" />
                <span style={{ color: "var(--text-error)", fontSize: "0.9rem" }}>{askError}</span>
              </div>
            )}

            {/* Ask Results */}
            {askResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* AI Explanation Box */}
                <div
                  className="glass-panel"
                  style={{
                    padding: "24px",
                    borderLeft: "4px solid var(--accent-cyan)",
                    background: "var(--bg-banner)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <Sparkles size={18} color="var(--accent-cyan)" />
                    <span style={{ fontWeight: 600, color: "var(--accent-cyan)", fontSize: "0.9rem" }}>
                      Grounded Answer
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {askResult.row_count} records retrieved in {askResult.execution_time_ms} ms
                    </span>
                  </div>
                  <p style={{ fontSize: "1.05rem", lineHeight: 1.6, color: "var(--text-primary)" }}>
                    {askResult.explanation}
                  </p>
                </div>

                {/* Generated SPARQL Collapsible Box */}
                <div className="glass-panel" style={{ padding: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Terminal size={16} color="var(--accent-indigo)" />
                      <span style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        Generated & Validated SPARQL Query
                      </span>
                    </div>

                    <button
                      onClick={() => handleCopy(askResult.generated_sparql)}
                      style={{
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-color)",
                        padding: "6px 10px",
                        borderRadius: "var(--radius-sm)",
                        color: "var(--text-secondary)",
                        fontSize: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <pre
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "0.85rem",
                      background: "var(--bg-code)",
                      padding: "16px",
                      borderRadius: "var(--radius-md)",
                      overflowX: "auto",
                      color: "var(--text-code)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    {askResult.generated_sparql}
                  </pre>
                </div>

                {/* Result Table */}
                {askResult.results && askResult.results.length > 0 && (
                  <div className="glass-panel" style={{ padding: "24px", overflow: "hidden" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "16px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Table size={18} color="var(--accent-emerald)" />
                        <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>Retrieved Records</h3>
                        <span className="badge badge-emerald">{askResult.results.length} rows</span>
                      </div>

                      <button
                        onClick={() =>
                          exportCSV(
                            askResult.results,
                            Object.keys(askResult.results[0] || {})
                          )
                        }
                        style={{
                          background: "var(--bg-subtle)",
                          border: "1px solid var(--border-color)",
                          padding: "6px 12px",
                          borderRadius: "var(--radius-md)",
                          fontSize: "0.8rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <Download size={14} />
                        <span>Export CSV</span>
                      </button>
                    </div>

                    <div style={{ overflowX: "auto", maxHeight: "450px" }}>
                      <table className="vkg-table">
                        <thead>
                          <tr>
                            {Object.keys(askResult.results[0] || {}).map((col) => (
                              <th key={col}>{col}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {askResult.results.map((row, rIdx) => (
                            <tr key={rIdx}>
                              {Object.keys(askResult.results[0] || {}).map((col) => (
                                <td key={col}>{String(row[col] ?? "")}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: SPARQL STUDIO */}
        {/* =================================================================== */}
        {activeTab === "sparql" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-panel" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Terminal size={20} color="var(--accent-indigo)" />
                    <span>SPARQL Query Studio</span>
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Execute constrained read-only SPARQL queries against the Ontop Virtual Knowledge Graph endpoint.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <label style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Limit:</label>
                  <select
                    value={queryLimit}
                    onChange={(e) => setQueryLimit(Number(e.target.value))}
                    style={{ fontSize: "0.85rem", padding: "6px 12px" }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>

              {/* Sample Templates */}
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
                {SAMPLE_QUERIES.map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSparqlQuery(sq.query)}
                    className="query-chip"
                  >
                    {sq.title}
                  </button>
                ))}
              </div>

              {/* Textarea Editor */}
              <textarea
                value={sparqlQuery}
                onChange={(e) => setSparqlQuery(e.target.value)}
                rows={10}
                style={{
                  width: "100%",
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.88rem",
                  background: "var(--bg-code-editor)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  padding: "16px",
                  lineHeight: 1.5,
                  color: "var(--text-primary)",
                  marginBottom: "16px",
                }}
              />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Constrained to read-only SELECT. Updates, SERVICE, and dataset mutations are blocked.
                </span>

                <button
                  onClick={handleExecuteQuery}
                  disabled={queryLoading || !sparqlQuery.trim()}
                  style={{
                    padding: "10px 24px",
                    background: "var(--accent-indigo)",
                    color: "#ffffff",
                    fontWeight: 600,
                    borderRadius: "var(--radius-md)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    opacity: queryLoading || !sparqlQuery.trim() ? 0.6 : 1,
                    boxShadow: "0 0 15px rgba(99, 102, 241, 0.4)",
                  }}
                >
                  {queryLoading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Executing...</span>
                    </>
                  ) : (
                    <>
                      <Play size={16} fill="#ffffff" />
                      <span>Execute Query</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {queryError && (
              <div
                className="glass-panel"
                style={{
                  padding: "16px 20px",
                  borderColor: "var(--border-error)",
                  background: "var(--bg-error)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <AlertCircle size={20} color="var(--accent-rose)" />
                <span style={{ color: "var(--text-error)", fontSize: "0.9rem" }}>{queryError}</span>
              </div>
            )}

            {/* Query Results */}
            {queryResult && (
              <div className="glass-panel" style={{ padding: "24px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Table size={18} color="var(--accent-indigo)" />
                    <h3 style={{ fontSize: "1rem", fontWeight: 600 }}>SPARQL Results</h3>
                    <span className="badge badge-indigo">{queryResult.row_count} rows</span>
                    <span className="badge badge-cyan">{queryResult.execution_time_ms} ms</span>
                  </div>

                  <button
                    onClick={() => exportCSV(queryResult.results, queryResult.columns)}
                    style={{
                      background: "var(--bg-subtle)",
                      border: "1px solid var(--border-color)",
                      padding: "6px 12px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div style={{ overflowX: "auto", maxHeight: "500px" }}>
                  <table className="vkg-table">
                    <thead>
                      <tr>
                        {queryResult.columns.map((col) => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queryResult.results.map((row, idx) => (
                        <tr key={idx}>
                          {queryResult.columns.map((col) => (
                            <td key={col}>{String(row[col] ?? "")}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: ONTOLOGY & TAXONOMY */}
        {/* =================================================================== */}
        {activeTab === "ontology" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-panel" style={{ padding: "28px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "1.2rem", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px" }}>
                    <Network size={20} color="var(--accent-purple)" />
                    <span>Ontology Specification & Vocabulary</span>
                  </h2>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Base IRI: <code style={{ color: "var(--accent-cyan)" }}>{ontology?.base_iri || "https://example.org/movie-vkg/"}</code>
                  </p>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setOntologyViewMode("visual")}
                    className={ontologyViewMode === "visual" ? "badge badge-indigo" : "badge"}
                    style={{ cursor: "pointer", border: "1px solid var(--border-color)" }}
                  >
                    Structured View
                  </button>
                  <button
                    onClick={() => setOntologyViewMode("turtle")}
                    className={ontologyViewMode === "turtle" ? "badge badge-indigo" : "badge"}
                    style={{ cursor: "pointer", border: "1px solid var(--border-color)" }}
                  >
                    Raw Turtle (.ttl)
                  </button>
                </div>
              </div>

              {ontologyLoading ? (
                <div style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>
                  <RefreshCw size={24} className="animate-spin" />
                  <p style={{ marginTop: "8px" }}>Loading ontology specification...</p>
                </div>
              ) : ontologyViewMode === "visual" && ontology ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {/* Classes */}
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>
                      OWL Classes ({ontology.classes?.length || 0})
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                      {ontology.classes?.map((c) => (
                        <div
                          key={c.iri}
                          style={{
                            background: "var(--bg-item)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                          }}
                        >
                          <div style={{ fontWeight: 600, color: "var(--accent-purple)", marginBottom: "4px" }}>
                            {c.label}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", wordBreak: "break-all", marginBottom: "6px" }}>
                            {c.iri}
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {c.comment || "No description available"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Properties */}
                  <div>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "12px" }}>
                      Properties ({ontology.properties?.length || 0})
                    </h3>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
                      {ontology.properties?.map((p) => (
                        <div
                          key={p.iri}
                          style={{
                            background: "var(--bg-item)",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            padding: "16px",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 600, color: "var(--accent-cyan)" }}>{p.label}</span>
                            <span className={p.property_type === "ObjectProperty" ? "badge badge-purple" : "badge badge-amber"}>
                              {p.property_type}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", wordBreak: "break-all", marginBottom: "6px" }}>
                            {p.iri}
                          </div>
                          {p.range && (
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                              Range: <code>{p.range}</code>
                            </div>
                          )}
                          <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                            {p.comment || "No description"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <pre
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.85rem",
                    background: "var(--bg-code)",
                    padding: "20px",
                    borderRadius: "var(--radius-md)",
                    overflowX: "auto",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-color)",
                  }}
                >
                  {ontology?.ontology_ttl}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: RELATIONAL SCHEMA */}
        {/* =================================================================== */}
        {activeTab === "schema" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div className="glass-panel" style={{ padding: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Database size={22} color="var(--accent-emerald)" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                  Discovered PostgreSQL Relational Architecture
                </h2>
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
                Inspected tables, foreign keys, unique constraints, and mapping eligibility for the movie metadata source of truth.
              </p>

              {schemaLoading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <RefreshCw size={24} className="animate-spin" />
                  <p style={{ marginTop: "8px" }}>Reading database metadata...</p>
                </div>
              ) : schemaData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {Object.entries(schemaData.schemas?.public?.tables || {}).map(([tname, tdata]) => (
                    <div
                      key={tname}
                      style={{
                        background: "var(--bg-item)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: "12px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "var(--text-primary)" }}>{tname}</span>
                          <span className="badge badge-emerald">PK: [{tdata.primary_key?.join(", ")}]</span>
                          {tdata.row_count !== null && (
                            <span className="badge badge-indigo">{tdata.row_count} rows</span>
                          )}
                        </div>
                        <span className="badge badge-cyan">{tdata.mapping_eligibility}</span>
                      </div>

                      {/* Columns */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                        {tdata.columns?.map((col) => (
                          <div
                            key={col.name}
                            style={{
                              background: col.is_primary_key
                                ? "rgba(16, 185, 129, 0.15)"
                                : "var(--bg-subtle)",
                              border: col.is_primary_key
                                ? "1px solid rgba(16, 185, 129, 0.3)"
                                : "1px solid var(--border-color)",
                              padding: "4px 8px",
                              borderRadius: "var(--radius-sm)",
                              fontSize: "0.75rem",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: col.is_primary_key ? "var(--accent-emerald)" : "var(--text-primary)" }}>
                              {col.name}
                            </span>
                            <span style={{ color: "var(--text-muted)", marginLeft: "4px" }}>
                              ({col.type})
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Foreign Keys */}
                      {tdata.foreign_keys && tdata.foreign_keys.length > 0 && (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                          <strong>Foreign Keys:</strong>
                          <ul style={{ marginLeft: "20px", marginTop: "4px" }}>
                            {tdata.foreign_keys.map((fk, idx) => (
                              <li key={idx}>
                                {fk.constrained_columns?.join(", ")} &rarr; {fk.referred_table}(
                                {fk.referred_columns?.join(", ")})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid var(--border-color)",
          padding: "16px 28px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "var(--text-muted)",
          background: "var(--bg-footer)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <ShieldCheck size={14} color="var(--accent-emerald)" />
          <span>PostgreSQL Source Records Preserved (Read-Only Isolated VKG)</span>
        </div>
        <div>FastAPI &bull; Ontop 5.5.0 &bull; OmniRoute AI &bull; React + Bun</div>
      </footer>
    </div>
  );
}
