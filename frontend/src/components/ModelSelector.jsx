import React, { useState, useRef, useEffect } from "react";
import { Cpu, ChevronDown, Check, Sparkles, Zap, Code, Shield, Compass } from "lucide-react";

export const AVAILABLE_MODELS = [
  {
    id: "claude-sonnet",
    name: "OmniRoute: claude-sonnet",
    shortName: "claude-sonnet",
    category: "Direct Dedicated",
    badge: "Claude 3.5",
    badgeClass: "badge-indigo",
    bestUse: "Default direct high-precision model pipeline & grounded SPARQL translation",
    description: "Direct Claude 3.5 Sonnet route on OmniRoute (omniroute.alphigma.com)",
    icon: Cpu,
  },
  {
    id: "auto",
    name: "auto",
    shortName: "auto",
    category: "Smart Routing",
    badge: "Balanced",
    badgeClass: "badge-cyan",
    bestUse: "General-purpose, balanced model selection",
    description: "General-purpose, balanced model selection",
    icon: Compass,
  },
  {
    id: "auto/smart",
    name: "auto/smart",
    shortName: "auto/smart",
    category: "Smart Routing",
    badge: "Smart",
    badgeClass: "badge-purple",
    bestUse: "Complex quantitative research and difficult reasoning",
    description: "Complex quantitative research and difficult reasoning",
    icon: Sparkles,
  },
  {
    id: "auto/coding",
    name: "auto/coding",
    shortName: "auto/coding",
    category: "Smart Routing",
    badge: "Coding",
    badgeClass: "badge-emerald",
    bestUse: "Writing Python, debugging, and code generation",
    description: "Writing Python, debugging, and code generation",
    icon: Code,
  },
  {
    id: "auto/fast",
    name: "auto/fast",
    shortName: "auto/fast",
    category: "Smart Routing",
    badge: "Fast",
    badgeClass: "badge-amber",
    bestUse: "Interactive tools and low-latency tasks",
    description: "Interactive tools and low-latency tasks",
    icon: Zap,
  },
  {
    id: "auto/cheap",
    name: "auto/cheap",
    shortName: "auto/cheap",
    category: "Smart Routing",
    badge: "Economy",
    badgeClass: "badge-emerald",
    bestUse: "Bulk ingestion, simple summaries, and routine processing",
    description: "Bulk ingestion, simple summaries, and routine processing",
    icon: Shield,
  },
  {
    id: "auto/offline",
    name: "auto/offline",
    shortName: "auto/offline",
    category: "Smart Routing",
    badge: "Offline",
    badgeClass: "badge-rose",
    bestUse: "Local model providers, where supported",
    description: "Local model providers, where supported",
    icon: Cpu,
  },
];

export default function ModelSelector({
  selectedModel = "claude-sonnet",
  onSelectModel,
  align = "right",
  variant = "header", // "header" | "inline"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModel) || AVAILABLE_MODELS[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (modelId) => {
    onSelectModel(modelId);
    setIsOpen(false);
  };

  const directModels = AVAILABLE_MODELS.filter((m) => m.category === "Direct Dedicated");
  const smartRoutingModels = AVAILABLE_MODELS.filter((m) => m.category === "Smart Routing");

  return (
    <div
      ref={dropdownRef}
      className="model-selector-wrapper"
      style={{
        position: "relative",
        display: "inline-block",
      }}
    >
      {/* Trigger Button */}
      {variant === "header" ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`model-selector-btn ${isOpen ? "open" : ""}`}
          aria-haspopup="true"
          aria-expanded={isOpen}
          title="Select OmniRoute Model or Smart Routing Alias (omniroute.alphigma.com)"
        >
          <div className="model-selector-btn-content">
            <Cpu size={14} className="model-icon-pulse" color="var(--accent-indigo)" />
            <span className="model-selector-name">
              {activeModel.id === "claude-sonnet"
                ? "OmniRoute: claude-sonnet"
                : `OmniRoute: ${activeModel.shortName}`}
            </span>
            <span className={`badge ${activeModel.badgeClass} model-pill-mini`}>
              {activeModel.badge}
            </span>
            <ChevronDown
              size={13}
              className={`model-chevron ${isOpen ? "rotate" : ""}`}
            />
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`model-selector-inline-btn ${isOpen ? "open" : ""}`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={16} color="var(--accent-cyan)" />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                OmniRoute Model Routing
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, fontSize: "0.88rem", color: "var(--text-primary)" }}>
                <span>{activeModel.name}</span>
                <span className={`badge ${activeModel.badgeClass}`} style={{ fontSize: "0.68rem", padding: "1px 6px" }}>
                  {activeModel.badge}
                </span>
              </div>
            </div>
          </div>
          <ChevronDown
            size={16}
            className={`model-chevron ${isOpen ? "rotate" : ""}`}
            style={{ color: "var(--text-secondary)" }}
          />
        </button>
      )}

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className={`model-dropdown-menu ${align === "right" ? "align-right" : "align-left"}`}
          role="menu"
        >
          {/* Header */}
          <div className="model-dropdown-header">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span className="model-dropdown-title">OmniRoute AI Gateway</span>
              <span className="badge badge-indigo" style={{ fontSize: "0.65rem" }}>
                omniroute.alphigma.com
              </span>
            </div>
            <p className="model-dropdown-subtitle">
              Select available direct model or intelligent smart routing alias
            </p>
          </div>

          <div className="model-dropdown-list">
            {/* Direct Model Section */}
            <div className="model-category-header">Direct Model Pipeline</div>
            {directModels.map((m) => {
              const isSelected = selectedModel === m.id;
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={`model-dropdown-item ${isSelected ? "selected" : ""}`}
                  role="menuitem"
                >
                  <div className="model-item-left">
                    <div className={`model-item-icon-box ${isSelected ? "selected" : ""}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="model-item-title-row">
                        <span className="model-item-title">{m.name}</span>
                        <span className={`badge ${m.badgeClass} model-pill-mini`}>
                          {m.badge}
                        </span>
                      </div>
                      <div className="model-item-best-use">{m.bestUse}</div>
                    </div>
                  </div>
                  <div className="model-item-right">
                    {isSelected && <Check size={16} color="var(--accent-indigo)" />}
                  </div>
                </div>
              );
            })}

            {/* Smart Routing Section */}
            <div className="model-category-header" style={{ marginTop: "8px" }}>
              OmniRoute Smart Routing Aliases
            </div>
            {smartRoutingModels.map((m) => {
              const isSelected = selectedModel === m.id;
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={`model-dropdown-item ${isSelected ? "selected" : ""}`}
                  role="menuitem"
                >
                  <div className="model-item-left">
                    <div className={`model-item-icon-box ${isSelected ? "selected" : ""}`}>
                      <Icon size={14} />
                    </div>
                    <div>
                      <div className="model-item-title-row">
                        <code className="model-code-val">{m.id}</code>
                        <span className={`badge ${m.badgeClass} model-pill-mini`}>
                          {m.badge}
                        </span>
                      </div>
                      <div className="model-item-best-use">{m.bestUse}</div>
                    </div>
                  </div>
                  <div className="model-item-right">
                    {isSelected && <Check size={16} color="var(--accent-cyan)" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Callout */}
          <div className="model-dropdown-footer">
            <span style={{ color: "var(--text-muted)" }}>Current selection:</span>{" "}
            <strong>{activeModel.id}</strong> — {activeModel.bestUse}
          </div>
        </div>
      )}
    </div>
  );
}
