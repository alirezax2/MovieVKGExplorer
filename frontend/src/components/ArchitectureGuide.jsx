import React, { useState } from "react";
import {
  Layers,
  Database,
  Terminal,
  Network,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Workflow,
  Zap,
  X,
  ExternalLink,
  FileText,
  Sparkles,
  RefreshCw,
  Table,
  Info,
  Lock,
  Server,
  HelpCircle,
  Maximize2,
  Minimize2,
  ChevronRight,
  Code2,
  BookOpen,
  Sliders,
  Check,
  Flame,
} from "lucide-react";

export default function ArchitectureGuide({ isModal = false, onClose = () => {} }) {
  const [subTab, setSubTab] = useState("overview"); // overview | concepts | components | workprocess | sections
  const [copiedSnippet, setCopiedSnippet] = useState(null);
  const [imageExpanded, setImageExpanded] = useState(false);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2000);
  };

  const TIERS = [
    {
      name: "1. Client & Presentation Tier",
      icon: Terminal,
      color: "var(--accent-cyan)",
      badge: "Port 5125",
      items: [
        "React 19 + Bun 1.4 + Vite 8 SPA",
        "AI Assistant & Natural Language Q&A",
        "SPARQL Studio with Query Editor & CSV Export",
        "Ontology Vocabulary & Relational Schema Inspectors",
      ],
    },
    {
      name: "2. Security & API Gateway Tier",
      icon: ShieldCheck,
      color: "var(--accent-indigo)",
      badge: "Port 8025",
      items: [
        "FastAPI Asynchronous Gateway & Authentication",
        "RDFLib Syntax-Aware SPARQL AST Validator",
        "Anti-SSRF (Service Graph Block) & Limit Clamping (<=500)",
        "OmniRoute LLM Gateway (Claude 3.5 Sonnet)",
      ],
    },
    {
      name: "3. Semantic & Virtual Engine Tier",
      icon: Network,
      color: "var(--accent-purple)",
      badge: "Port 8825",
      items: [
        "Ontop 5.5.0 Virtual Knowledge Graph Engine",
        "W3C OWL 2 QL Domain Ontology (ontology.ttl)",
        "Declarative OBDA Mappings (mapping.obda)",
        "HikariCP Connection Pool & Mounted PostgreSQL JDBC Driver",
      ],
    },
    {
      name: "4. Relational Storage Tier",
      icon: Database,
      color: "var(--accent-emerald)",
      badge: "Port 5425 / 3000",
      items: [
        "PostgreSQL 16.4 Single Source of Truth (1,000 movies)",
        "Dedicated Read-Only User 'ontop_ro' (SELECT-only privilege)",
        "Zero Data Duplication (Zero RDF Triples written to disk)",
        "Metabase 0.50 Parallel Relational Analytics (Port 3000)",
      ],
    },
  ];

  const COMPONENTS_LIST = [
    {
      title: "Frontend Application",
      tech: "React 19, Bun 1.4, Vite 8",
      port: "5125",
      role: "User Interface & Semantic Explorer",
      description:
        "Modern single-page application with cyber-dark glassmorphic design. Features 4 interactive tabs (AI Assistant, SPARQL Studio, Ontology Explorer, Relational Schema), instant query suggestions, dark/light theme toggle, and live status monitors.",
      icon: Sparkles,
      color: "#06b6d4",
      highlight: "Sub-second dev reload via Bun & Vite",
    },
    {
      title: "FastAPI Security Gateway",
      tech: "Python 3.12, FastAPI, Uvicorn, UV",
      port: "8025",
      role: "Secure Query Broker & API Layer",
      description:
        "Coordinates all client requests. Houses health/ready probes, ontology discovery, raw SPARQL dispatch, and error sanitization to prevent internal database secrets or connection strings from leaking to clients.",
      icon: Server,
      color: "#6366f1",
      highlight: "Multi-stage UV container build",
    },
    {
      title: "RDFLib AST Validator",
      tech: "RDFLib 7.1.3 SPARQL Parser",
      port: "Internal",
      role: "Syntax-Aware Query Firewall",
      description:
        "Parses every SPARQL query into an Abstract Syntax Tree before it touches the engine. Guarantees queries are strictly read-only SELECT, rejects mutation attacks (INSERT/DELETE/DROP), blocks SSRF (SERVICE), and clamps LIMIT <= 500.",
      icon: ShieldCheck,
      color: "#10b981",
      highlight: "AST parsing avoids regex bypasses",
    },
    {
      title: "OmniRoute AI Gateway",
      tech: "Claude 3.5 Sonnet / OpenAI Compatible",
      port: "External API",
      role: "Two-Phase Grounded Natural Language AI",
      description:
        "Translates user English questions into formal SPARQL queries using domain ontology context. In Phase 2, synthesizes natural language answers strictly from PostgreSQL query records, completely eliminating AI hallucinations.",
      icon: Cpu,
      color: "#a855f7",
      highlight: "Strict grounded factual answers",
    },
    {
      title: "Ontop 5.5.0 VKG Engine",
      tech: "Java 17, Ontop SPARQL Endpoint",
      port: "8825",
      role: "SPARQL-to-SQL In-Memory Rewriter",
      description:
        "Compiles SPARQL queries on the fly into highly optimized SQL using self-join elimination, projection pruning, and join folding. Directly executes SQL against PostgreSQL over JDBC without intermediate RDF storage.",
      icon: Network,
      color: "#ec4899",
      highlight: "W3C SPARQL 1.1 & OWL 2 QL compliance",
    },
    {
      title: "PostgreSQL 16.4 Database",
      tech: "PostgreSQL 16.4 Alpine",
      port: "5425",
      role: "Enterprise Relational Source of Truth",
      description:
        "Primary storage containing 1,000 real movies, 14 taxonomy classes, 50 subclasses, and schema definitions. Hardware-level security enforces ontop_ro user permissions to disallow any write or DDL operations.",
      icon: Database,
      color: "#3b82f6",
      highlight: "Dedicated read-only ontop_ro user",
    },
    {
      title: "Metabase BI Dashboards",
      tech: "Metabase v0.50.23",
      port: "3000",
      role: "Parallel Relational Business Intelligence",
      description:
        "Interactive business intelligence dashboards querying PostgreSQL directly in parallel with the VKG engine, demonstrating seamless coexistence of semantic graphs and traditional SQL reporting.",
      icon: Table,
      color: "#f59e0b",
      highlight: "Direct SQL analytics alongside VKG",
    },
  ];

  const WORK_STEPS = [
    {
      step: 1,
      name: "Natural Language Prompt",
      desc: "User submits an English question (e.g., 'What are the top 3 highest rated movies?') via the AI Assistant input.",
      icon: Sparkles,
      color: "var(--accent-cyan)",
    },
    {
      step: 2,
      name: "Ontology Context Injection",
      desc: "FastAPI extracts classes, properties, and relationships from ontology.ttl and injects them into the LLM system prompt.",
      icon: Network,
      color: "var(--accent-purple)",
    },
    {
      step: 3,
      name: "Phase 1: Text-to-SPARQL Generation",
      desc: "OmniRoute LLM (Claude 3.5 Sonnet) generates a formal SPARQL query with exact prefixes and predicates.",
      icon: Cpu,
      color: "var(--accent-indigo)",
    },
    {
      step: 4,
      name: "Formal AST Security Validation",
      desc: "RDFLib parses the query AST. Confirms SELECT-only, strips comments, blocks SERVICE/FROM, and clamps LIMIT <= 500.",
      icon: ShieldCheck,
      color: "var(--accent-emerald)",
    },
    {
      step: 5,
      name: "Ontop SPARQL-to-SQL Compilation",
      desc: "Ontop unfolds OBDA mappings, eliminates redundant self-joins, and rewrites the graph pattern into a single optimized SQL statement.",
      icon: Workflow,
      color: "var(--accent-rose)",
    },
    {
      step: 6,
      name: "Fast Indexed PostgreSQL Execution",
      desc: "PostgreSQL executes the SQL query via JDBC in ~2-8ms, leveraging B-Tree indexes on object and class tables.",
      icon: Database,
      color: "var(--accent-blue)",
    },
    {
      step: 7,
      name: "Phase 2: Grounded Answer Synthesis",
      desc: "FastAPI passes the raw record set back to the LLM. The model is instructed to answer strictly using the returned rows.",
      icon: CheckCircle2,
      color: "var(--accent-amber)",
    },
    {
      step: 8,
      name: "Unified Response & UI Render",
      desc: "Frontend renders the natural answer, syntax-highlighted SPARQL with one-click copy, and interactive record table.",
      icon: Terminal,
      color: "var(--accent-cyan)",
    },
  ];

  const SECTIONS_TOUR = [
    {
      id: "ask",
      title: "AI Assistant (Natural Language)",
      icon: Sparkles,
      color: "var(--accent-cyan)",
      summary: "Query the knowledge graph in plain human language without writing code.",
      features: [
        "Pre-configured suggestion pills for quick queries",
        "Grounded AI natural language answers with source validation",
        "Generated SPARQL code card with one-click copy",
        "Tabular result view displaying raw PostgreSQL records",
      ],
      tips: "Try asking: 'Which Action movies were released after 2015 with rating above 8.0?'",
    },
    {
      id: "sparql",
      title: "SPARQL Studio",
      icon: Terminal,
      color: "var(--accent-indigo)",
      summary: "Full-featured interactive IDE for querying the Virtual Knowledge Graph.",
      features: [
        "Interactive query editor with prefix autocompletion",
        "Pre-loaded templates (Top Rated Movies, Hierarchy, Definitions, Aggregations)",
        "Real-time execution latency badge (displaying response time in milliseconds)",
        "One-click CSV Export to download query datasets",
      ],
      tips: "Select a pre-loaded template from the dropdown to run complex analytical aggregations.",
    },
    {
      id: "ontology",
      title: "Ontology Vocabulary Explorer",
      icon: Network,
      color: "var(--accent-purple)",
      summary: "Inspect formal OWL 2 QL taxonomy, classes, and properties.",
      features: [
        "OWL Class catalog with live instance counts",
        "Object Property cards showing domain and range entity connections",
        "Datatype Property cards showing XML Schema datatypes (string, decimal, integer)",
        "Full raw Turtle (.ttl) viewer with copyable ontology contract",
      ],
      tips: "Explore how classes like :Movie and :MovieClass connect via the :hasGenreClass predicate.",
    },
    {
      id: "schema",
      title: "Relational Schema Inspector",
      icon: Database,
      color: "var(--accent-emerald)",
      summary: "Direct live inspection of PostgreSQL source tables and physical constraints.",
      features: [
        "Live table list with real-time row counts (1,000 movies, 14 classes, 50 subclasses)",
        "Column schema inspection with data types, nullability, and default values",
        "Primary key and Foreign key relationship mapping",
        "PostgreSQL version and connection metadata",
      ],
      tips: "Notice how foreign keys in 'object' match the 'metaid' primary key in 'class'!",
    },
  ];

  const content = (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: "24px 28px",
          background: "linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(99, 102, 241, 0.12) 50%, rgba(168, 85, 247, 0.12) 100%)",
          border: "1px solid var(--border-highlight)",
          borderRadius: "var(--radius-lg)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #06b6d4, #6366f1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  boxShadow: "0 0 15px rgba(6, 182, 212, 0.4)",
                }}
              >
                <BookOpen size={20} />
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
                System Architecture & VKG Blueprint Guide
              </h2>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.92rem", maxWidth: "850px", lineHeight: "1.5" }}>
              Comprehensive engineering walkthrough of the <strong>Virtual Knowledge Graph (VKG)</strong>, <strong>Ontop 5.5.0 engine</strong>, <strong>OWL 2 QL Ontologies</strong>, <strong>FastAPI Security Broker</strong>, and <strong>OmniRoute AI Grounding</strong>.
            </p>
          </div>

          {isModal && (
            <button
              onClick={onClose}
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border-color)",
                color: "var(--text-secondary)",
                borderRadius: "var(--radius-md)",
                padding: "8px",
                cursor: "pointer",
              }}
              title="Close guide"
              aria-label="Close guide"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Quick KPI stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid var(--border-color)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={18} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Data Duplication</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-cyan)" }}>0% (Pure VKG)</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ActivityIcon size={18} color="var(--accent-emerald)" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Query Latency</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-emerald)" }}>~2.8 ms (Indexed)</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <ShieldCheck size={18} color="var(--accent-indigo)" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Security Validation</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-indigo)" }}>RDFLib AST Strict</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Database size={18} color="var(--accent-purple)" />
            <div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Relational Source</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--accent-purple)" }}>1,000 Movies (PG 16)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          borderBottom: "1px solid var(--border-color)",
          paddingBottom: "8px",
          overflowX: "auto",
        }}
      >
        {[
          { id: "overview", label: "System Architecture", icon: Layers, color: "var(--accent-cyan)" },
          { id: "concepts", label: "Core Concepts (VKG)", icon: BookOpen, color: "var(--accent-indigo)" },
          { id: "components", label: "Components Deep Dive", icon: Cpu, color: "var(--accent-purple)" },
          { id: "workprocess", label: "Work Process & SPARQL-to-SQL", icon: Workflow, color: "var(--accent-rose)" },
          { id: "sections", label: "Different Sections Guide", icon: Sparkles, color: "var(--accent-emerald)" },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-md)",
                background: isActive ? "var(--bg-subtle)" : "transparent",
                border: isActive ? `1px solid ${tab.color}` : "1px solid transparent",
                color: isActive ? tab.color : "var(--text-secondary)",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s ease",
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* SUB-TAB 1: SYSTEM ARCHITECTURE & 3D BLUEPRINT */}
      {/* =================================================================== */}
      {subTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Visual Architecture Card */}
          <div className="glass-panel" style={{ padding: "24px", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Layers size={20} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Visual End-to-End System Architecture</h3>
              </div>
              <button
                onClick={() => setImageExpanded(!imageExpanded)}
                style={{
                  background: "var(--bg-subtle)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                  padding: "6px 12px",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.78rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  cursor: "pointer",
                }}
              >
                {imageExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{imageExpanded ? "Compact View" : "Full View"}</span>
              </button>
            </div>

            <div
              style={{
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                border: "1px solid var(--border-color)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                background: "#0a0e17",
                textAlign: "center",
              }}
            >
              <img
                src="/vkg_architecture_diagram.jpg"
                alt="VKG Architecture Blueprint"
                style={{
                  width: "100%",
                  maxHeight: imageExpanded ? "none" : "480px",
                  objectFit: "contain",
                  display: "block",
                  margin: "0 auto",
                  cursor: "pointer",
                }}
                onClick={() => setImageExpanded(!imageExpanded)}
              />
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "10px", textAlign: "center" }}>
              Isometric System Blueprint: React UI & AI Brain (left) &rarr; Secure FastAPI AST Gateway (center) &rarr; Ontop VKG Engine with OWL Ontology (core) &rarr; PostgreSQL Database (right) via JDBC on-the-fly SQL.
            </p>
          </div>

          {/* 4 Tiers Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {TIERS.map((tier, idx) => {
              const Icon = tier.icon;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    borderTop: `3px solid ${tier.color}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Icon size={18} color={tier.color} />
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700 }}>{tier.name}</h4>
                    </div>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-color)",
                        color: tier.color,
                        fontWeight: 600,
                      }}
                    >
                      {tier.badge}
                    </span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                    {tier.items.map((item, itemIdx) => (
                      <li
                        key={itemIdx}
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          lineHeight: "1.4",
                        }}
                      >
                        <CheckCircle2 size={14} color={tier.color} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: CORE CONCEPTS (VKG vs MATERIALIZED GRAPH) */}
      {/* =================================================================== */}
      {subTab === "concepts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Paradigm Comparison Card */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
              Virtual Knowledge Graph (VKG) vs. Traditional Graph ETL
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "20px" }}>
              Why organizations choose Ontology-Based Data Access (OBDA) over duplicate graph databases like Neo4j or GraphDB.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {/* Traditional ETL */}
              <div
                style={{
                  background: "rgba(244, 63, 94, 0.05)",
                  border: "1px solid rgba(244, 63, 94, 0.2)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--accent-rose)" }}>
                  <X size={20} />
                  <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Traditional ETL (Materialized Graph)</h4>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  <li style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--accent-rose)" }}>•</span>
                    <span><strong>Data Duplication</strong>: Millions of relational rows are converted to RDF and duplicated into a second database.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--accent-rose)" }}>•</span>
                    <span><strong>Synchronization Lag & Drift</strong>: Batch ETL jobs or CDC pipelines leave the graph out-of-sync with transaction data.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--accent-rose)" }}>•</span>
                    <span><strong>Loss of Relational Optimizations</strong>: PostgreSQL B-tree indexes, parallel scan workers, and query planners are discarded.</span>
                  </li>
                </ul>
              </div>

              {/* VKG / Ontop */}
              <div
                style={{
                  background: "rgba(6, 182, 212, 0.05)",
                  border: "1px solid rgba(6, 182, 212, 0.25)",
                  borderRadius: "var(--radius-md)",
                  padding: "18px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", color: "var(--accent-cyan)" }}>
                  <CheckCircle2 size={20} />
                  <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>Virtual Knowledge Graph (Ontop OBDA)</h4>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                  <li style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--accent-cyan)" }}>•</span>
                    <span><strong>Zero Data Replication</strong>: Data remains exclusively in PostgreSQL. Zero RDF triples are written to disk.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--accent-cyan)" }}>•</span>
                    <span><strong>Instant Consistency</strong>: The moment a row is committed in PostgreSQL, it is immediately queryable via SPARQL.</span>
                  </li>
                  <li style={{ display: "flex", gap: "8px" }}>
                    <span style={{ color: "var(--accent-cyan)" }}>•</span>
                    <span><strong>Native Relational Speed</strong>: Ontop compiles SPARQL to SQL that leverages PostgreSQL B-tree indexes in ~2-8ms.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Relational vs Semantic Mapping Table */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
              Relational Database vs. Semantic Graph Concepts
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
              How relational tables map directly to RDF triples and OWL ontologies.
            </p>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--bg-table-header)", borderBottom: "1px solid var(--border-color)", textAlign: "left" }}>
                    <th style={{ padding: "10px 14px" }}>Relational (RDBMS)</th>
                    <th style={{ padding: "10px 14px" }}>Semantic Web (RDF / OWL)</th>
                    <th style={{ padding: "10px 14px" }}>Movie VKG Concrete Example</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>Row / Record</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent-cyan)" }}>Resource / Subject</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>:movie/42 &rarr; &lt;.../movie/42&gt;</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>Column Name</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent-indigo)" }}>Predicate / Property</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>:title, :rating, :hasGenreClass</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>Cell Value</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent-purple)" }}>Object / Literal</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>"Inception"^^xsd:string, 8.8^^xsd:decimal</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>Foreign Key (FK)</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent-emerald)" }}>Object Property Edge</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>:movie/1 :hasGenreClass :class/class:drama</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>Table Schema (DDL)</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent-amber)" }}>Ontology (TBox)</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>ontop/ontology.ttl (OWL 2 QL)</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "10px 14px", fontWeight: 600 }}>SQL SELECT</td>
                    <td style={{ padding: "10px 14px", color: "var(--accent-rose)" }}>SPARQL SELECT</td>
                    <td style={{ padding: "10px 14px", fontFamily: "var(--font-mono)" }}>SELECT ?title ?rating WHERE &#123; ... &#125;</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Synthetic IRI Join Mechanism */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
              The Secret Sauce: Synthetic IRI Joins
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
              How foreign keys automatically synthesize graph connections at query compilation time without physical RDF pointers.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
              <div style={{ background: "var(--bg-code)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--accent-cyan)", fontWeight: 700, marginBottom: "6px" }}>
                  Rule 1 in mapping.obda (Movies)
                </div>
                <pre style={{ margin: 0, fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
{`target  :movie/{object_id} 
           :hasGenreClass :class/{class} .
source  SELECT object_id, "class" FROM public.object`}
                </pre>
              </div>

              <div style={{ background: "var(--bg-code)", padding: "14px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--accent-purple)", fontWeight: 700, marginBottom: "6px" }}>
                  Rule 2 in mapping.obda (Genres)
                </div>
                <pre style={{ margin: 0, fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
{`target  :class/{metaid} a :MovieClass ;
           :name {name}^^xsd:string .
source  SELECT metaid, name FROM public.class`}
                </pre>
              </div>
            </div>

            <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginTop: "12px", lineHeight: "1.5" }}>
              Because both rules share the template <code style={{ color: "var(--accent-cyan)" }}>:class/&#123;...&#125;</code>, Ontop recognizes at compile time that <code style={{ color: "var(--accent-cyan)" }}>object.class</code> foreign keys into <code style={{ color: "var(--accent-cyan)" }}>class.metaid</code>. Ontop automatically compiles the graph edge into an <code style={{ color: "var(--accent-emerald)" }}>INNER JOIN public.class ON (object.class = class.metaid)</code>!
            </p>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: COMPONENTS DEEP DIVE */}
      {/* =================================================================== */}
      {subTab === "components" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {COMPONENTS_LIST.map((comp, idx) => {
              const Icon = comp.icon;
              return (
                <div
                  key={idx}
                  className="glass-panel"
                  style={{
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderTop: `3px solid ${comp.color}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: `${comp.color}20`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: comp.color,
                        }}
                      >
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{comp.title}</h4>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-muted)" }}>{comp.role}</div>
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--bg-subtle)",
                        border: "1px solid var(--border-color)",
                        color: comp.color,
                        fontWeight: 600,
                      }}
                    >
                      {comp.port}
                    </span>
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.45", margin: 0 }}>
                    {comp.description}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      fontSize: "0.75rem",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--border-color)",
                      marginTop: "auto",
                    }}
                  >
                    <span style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>{comp.tech}</span>
                    <span style={{ color: comp.color, fontWeight: 600 }}>{comp.highlight}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 4: WORK PROCESS & SPARQL-TO-SQL TRANSLATION */}
      {/* =================================================================== */}
      {subTab === "workprocess" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Work Process Stepper */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700, marginBottom: "8px" }}>
              End-to-End Query Lifecycle: From Plain English to PostgreSQL
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "20px" }}>
              Step-by-step pipeline executed when a user asks a question in the AI Assistant.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {WORK_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.step}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "14px",
                      padding: "14px 18px",
                      background: "var(--bg-subtle)",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-color)",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: `${step.color}20`,
                        border: `1px solid ${step.color}`,
                        color: step.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {step.step}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <h4 style={{ fontSize: "0.92rem", fontWeight: 700 }}>{step.name}</h4>
                        <Icon size={15} color={step.color} />
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Under the Hood: SPARQL-to-SQL Translation */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Code2 size={20} color="var(--accent-rose)" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Under the Hood: How Ontop Rewrites SPARQL into SQL</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "18px" }}>
              Ontop uses <strong>Self-Join Elimination</strong> and <strong>Projection Pruning</strong> so queries run at native relational speed.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
              {/* Input SPARQL */}
              <div style={{ background: "var(--bg-code)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-cyan)" }}>Input SPARQL 1.1 Query</span>
                  <button
                    onClick={() => copyToClipboard(`PREFIX : <https://example.org/movie-vkg/>\nSELECT ?title ?rating WHERE {\n  ?m a :Movie ;\n     :title ?title ;\n     :rating ?rating ;\n     :hasGenreClass ?c .\n  ?c :name "Sci-Fi" .\n} LIMIT 5`, "sparql_ex")}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    {copiedSnippet === "sparql_ex" ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre style={{ margin: 0, fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
{`PREFIX : <https://example.org/movie-vkg/>

SELECT ?title ?rating WHERE {
  ?m a :Movie ;
     :title ?title ;
     :rating ?rating ;
     :hasGenreClass ?c .
  ?c :name "Sci-Fi" .
}
LIMIT 5`}
                </pre>
              </div>

              {/* Output SQL */}
              <div style={{ background: "var(--bg-code)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--accent-emerald)" }}>Compiled SQL Executed on PostgreSQL</span>
                  <button
                    onClick={() => copyToClipboard(`SELECT t1.title AS "title", t1.rating AS "rating"\nFROM "public"."object" t1\nINNER JOIN "public"."class" t2 ON t1."class" = t2.metaid\nWHERE t2.name = 'Sci-Fi'\nLIMIT 5;`, "sql_ex")}
                    style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    {copiedSnippet === "sql_ex" ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
                  </button>
                </div>
                <pre style={{ margin: 0, fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-primary)", whiteSpace: "pre-wrap" }}>
{`SELECT 
    t1.title AS "title",
    t1.rating AS "rating"
FROM "public"."object" t1
INNER JOIN "public"."class" t2 
    ON t1."class" = t2.metaid
WHERE t2.name = 'Sci-Fi'
LIMIT 5;`}
                </pre>
              </div>
            </div>

            <div
              style={{
                marginTop: "16px",
                padding: "14px",
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid var(--border-highlight)",
                borderRadius: "var(--radius-md)",
                fontSize: "0.82rem",
                color: "var(--text-secondary)",
                lineHeight: "1.5",
              }}
            >
              <strong style={{ color: "var(--accent-indigo)" }}>Why this runs in ~2.8 ms:</strong> A naive translator would produce 4 separate table scans with 3 self-joins. Ontop observes that <code style={{ color: "var(--text-primary)" }}>:title</code>, <code style={{ color: "var(--text-primary)" }}>:rating</code>, and <code style={{ color: "var(--text-primary)" }}>:hasGenreClass</code> reside on the same row in <code style={{ color: "var(--text-primary)" }}>public.object</code>. It collapses them into <strong>1 single scan</strong> and leverages PostgreSQL's index on <code style={{ color: "var(--text-primary)" }}>idx_object_class</code>!
            </div>
          </div>

          {/* OmniRoute Models & Alphigma Smart Routing Aliases Table */}
          <div className="glass-panel" style={{ padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <Cpu size={20} color="var(--accent-indigo)" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>
                OmniRoute Model Routing & Smart Routing Aliases (omniroute.alphigma.com)
              </h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.88rem", marginBottom: "16px" }}>
              The system integrates with OmniRoute as an OpenAI-compatible gateway, providing both dedicated model routing (Claude 3.5 Sonnet) and Alphigma smart routing aliases for different quantitative and reasoning workloads:
            </p>

            <div style={{ overflowX: "auto" }}>
              <table className="vkg-table">
                <thead>
                  <tr>
                    <th>Model / Alias</th>
                    <th>Routing Category</th>
                    <th>Best Use in Alphigma</th>
                    <th>Badge</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code className="model-code-val">claude-sonnet</code></td>
                    <td>Direct Dedicated</td>
                    <td>Default high-precision model pipeline & grounded SPARQL translation</td>
                    <td><span className="badge badge-indigo">Claude 3.5</span></td>
                  </tr>
                  <tr>
                    <td><code className="model-code-val">auto</code></td>
                    <td>Smart Routing</td>
                    <td>General-purpose, balanced model selection</td>
                    <td><span className="badge badge-cyan">Balanced</span></td>
                  </tr>
                  <tr>
                    <td><code className="model-code-val">auto/smart</code></td>
                    <td>Smart Routing</td>
                    <td>Complex quantitative research and difficult reasoning</td>
                    <td><span className="badge badge-purple">Smart</span></td>
                  </tr>
                  <tr>
                    <td><code className="model-code-val">auto/coding</code></td>
                    <td>Smart Routing</td>
                    <td>Writing Python, debugging, and code generation</td>
                    <td><span className="badge badge-emerald">Coding</span></td>
                  </tr>
                  <tr>
                    <td><code className="model-code-val">auto/fast</code></td>
                    <td>Smart Routing</td>
                    <td>Interactive tools and low-latency tasks</td>
                    <td><span className="badge badge-amber">Fast</span></td>
                  </tr>
                  <tr>
                    <td><code className="model-code-val">auto/cheap</code></td>
                    <td>Smart Routing</td>
                    <td>Bulk ingestion, simple summaries, and routine processing</td>
                    <td><span className="badge badge-emerald">Economy</span></td>
                  </tr>
                  <tr>
                    <td><code className="model-code-val">auto/offline</code></td>
                    <td>Smart Routing</td>
                    <td>Local model providers, where supported</td>
                    <td><span className="badge badge-rose">Offline</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}


      {/* =================================================================== */}
      {/* SUB-TAB 5: DIFFERENT SECTIONS GUIDE (APP TOUR) */}
      {/* =================================================================== */}
      {subTab === "sections" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {SECTIONS_TOUR.map((sec) => {
              const Icon = sec.icon;
              return (
                <div
                  key={sec.id}
                  className="glass-panel"
                  style={{
                    padding: "22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderLeft: `4px solid ${sec.color}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: `${sec.color}20`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: sec.color,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: "1.05rem", fontWeight: 700 }}>{sec.title}</h4>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{sec.summary}</div>
                    </div>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "4px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {sec.features.map((feat, fIdx) => (
                      <li
                        key={fIdx}
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--text-secondary)",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "8px",
                          lineHeight: "1.4",
                        }}
                      >
                        <Check size={14} color={sec.color} style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <div
                    style={{
                      background: "var(--bg-subtle)",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-color)",
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                      marginTop: "auto",
                    }}
                  >
                    <strong style={{ color: sec.color }}>Pro Tip: </strong> {sec.tips}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // If rendered as a Modal overlay
  if (isModal) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.75)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
        onClick={onClose}
      >
        <div
          style={{
            background: "var(--bg-primary)",
            border: "1px solid var(--border-highlight)",
            borderRadius: "var(--radius-lg)",
            width: "100%",
            maxWidth: "1280px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "28px",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.6)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {content}
        </div>
      </div>
    );
  }

  // If rendered inline in a tab
  return content;
}

function ActivityIcon(props) {
  return (
    <svg
      {...props}
      width={props.size || 24}
      height={props.size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
