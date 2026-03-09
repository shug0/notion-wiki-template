"use client";

import { IconTypography } from "@tabler/icons-react";
import { useCallback, useRef, useState } from "react";

const SLIDERS = [
  {
    label: "Body size",
    var: "--font-size-body",
    min: 14,
    max: 24,
    step: 0.5,
    default: 18,
    unit: "rem",
    base: 16,
  },
  {
    label: "Line height",
    var: "--line-height-body",
    min: 1.2,
    max: 2.0,
    step: 0.05,
    default: 1.5,
  },
  { sep: true },
  {
    label: "H1 size",
    var: "--font-size-h1",
    min: 1.4,
    max: 3.0,
    step: 0.1,
    default: 2.0,
    unit: "rem",
  },
  {
    label: "H2 size",
    var: "--font-size-h2",
    min: 1.2,
    max: 2.5,
    step: 0.1,
    default: 1.6,
    unit: "rem",
  },
  {
    label: "H3 size",
    var: "--font-size-h3",
    min: 1.0,
    max: 2.0,
    step: 0.1,
    default: 1.3,
    unit: "rem",
  },
  {
    label: "H4 size",
    var: "--font-size-h4",
    min: 0.9,
    max: 1.5,
    step: 0.05,
    default: 1.1,
    unit: "rem",
  },
  {
    label: "Heading LH",
    var: "--line-height-heading",
    min: 1.0,
    max: 1.6,
    step: 0.05,
    default: 1.2,
  },
  { sep: true },
  {
    label: "Space scale",
    var: "--space-scale",
    min: 0.5,
    max: 2.0,
    step: 0.1,
    default: 1.0,
  },
  {
    label: "Block gap",
    var: "--space-block",
    min: 0.125,
    max: 1.5,
    step: 0.0625,
    default: 0.375,
    unit: "rem",
    direct: true,
  },
  {
    label: "Block gap lg",
    var: "--space-block-lg",
    min: 0.25,
    max: 2.5,
    step: 0.125,
    default: 0.75,
    unit: "rem",
    direct: true,
  },
  {
    label: "Before h2",
    var: "--space-before-h2",
    min: 1.0,
    max: 5.0,
    step: 0.25,
    default: 3.0,
    unit: "rem",
    direct: true,
  },
  {
    label: "Before h3",
    var: "--space-before-h3",
    min: 0.5,
    max: 4.0,
    step: 0.25,
    default: 2.25,
    unit: "rem",
    direct: true,
  },
  {
    label: "Before h4",
    var: "--space-before-h4",
    min: 0.5,
    max: 3.0,
    step: 0.25,
    default: 1.5,
    unit: "rem",
    direct: true,
  },
  {
    label: "Heading sub",
    var: "--space-heading-sub",
    min: 0.125,
    max: 1.5,
    step: 0.125,
    default: 0.5,
    unit: "rem",
    direct: true,
  },
  { sep: true },
  {
    label: "Container",
    min: 50,
    max: 85,
    step: 1,
    default: 65,
    container: true,
  },
] as const;

type SliderDef = (typeof SLIDERS)[number];

function formatValue(s: SliderDef, val: number): string {
  if ("sep" in s) return "";
  if ("container" in s && s.container) return `${val}ch`;
  if ("base" in s && s.base)
    return `${(val / s.base).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}rem (${val}px)`;
  if ("unit" in s && s.unit) return `${val}${s.unit}`;
  return String(val);
}

function cssValue(s: SliderDef, val: number): string {
  if ("sep" in s) return "";
  if ("base" in s && s.base)
    return `${(val / s.base).toFixed(4).replace(/0+$/, "").replace(/\.$/, "")}rem`;
  if ("unit" in s && s.unit) return `${val}${s.unit}`;
  return String(val);
}

function applyValue(s: SliderDef, val: number) {
  if ("sep" in s) return;
  if ("container" in s && s.container) {
    document
      .querySelectorAll<HTMLElement>('[class*="max-w-"]')
      .forEach((el) => {
        el.style.maxWidth = `${val}ch`;
      });
    return;
  }
  if ("var" in s && s.var) {
    document.documentElement.style.setProperty(s.var, cssValue(s, val));
  }
}

function clearOverrides() {
  SLIDERS.forEach((s) => {
    if ("sep" in s) return;
    if ("var" in s && s.var) {
      document.documentElement.style.removeProperty(s.var);
    }
    if ("container" in s && s.container) {
      document
        .querySelectorAll<HTMLElement>('[class*="max-w-"]')
        .forEach((el) => {
          el.style.maxWidth = "";
        });
    }
  });
}

export function TypoDebug() {
  const [minimized, setMinimized] = useState(true);
  const [copied, setCopied] = useState(false);
  const defaults = useRef(
    Object.fromEntries(
      SLIDERS.filter(
        (s): s is Exclude<SliderDef, { sep: true }> => !("sep" in s),
      ).map((s) => [("var" in s && s.var) || "container", s.default]),
    ),
  );
  const [values, setValues] = useState<Record<string, number>>({
    ...defaults.current,
  });

  const handleChange = useCallback((s: SliderDef, val: number) => {
    const key = ("var" in s && s.var) || "container";
    setValues((prev) => ({ ...prev, [key]: val }));
    applyValue(s, val);
  }, []);

  const handleReset = useCallback(() => {
    setValues({ ...defaults.current });
    clearOverrides();
  }, []);

  const handleCopy = useCallback(() => {
    const lines = SLIDERS.filter(
      (s): s is Exclude<SliderDef, { sep: true }> => !("sep" in s),
    ).map((s) => {
      const key = ("var" in s && s.var) || "container";
      const val = values[key] ?? s.default;
      if ("container" in s && s.container) return `container: ${val}ch`;
      return `${("var" in s && s.var) || ""}: ${cssValue(s, val)};`;
    });
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [values]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 99999,
        background: "rgba(0,0,0,0.92)",
        color: "#eee",
        borderRadius: minimized ? "50%" : 12,
        font: "13px/1.4 system-ui",
        width: minimized ? 36 : 290,
        height: minimized ? 36 : "auto",
        padding: minimized ? 0 : 16,
        backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        transition: "all 0.15s ease",
        overflow: "hidden",
      }}
    >
      {minimized ? (
        <button
          onClick={() => setMinimized(false)}
          style={{
            width: "100%",
            height: "100%",
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
          title="Typo Debug"
        >
          <IconTypography size={18} color="#eee" />
        </button>
      ) : (
        <>
          <span
            onClick={() => setMinimized((m) => !m)}
            style={{
              position: "absolute",
              top: 8,
              right: 12,
              cursor: "pointer",
              color: "#888",
              fontSize: 16,
            }}
          >
            −
          </span>
          <div
            style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "#fff" }}
          >
            Typo Debug
          </div>
          {
            <div style={{ marginTop: 12 }}>
              {SLIDERS.map((s, i) => {
                if ("sep" in s) {
                  return (
                    <hr
                      key={i}
                      style={{
                        border: "none",
                        borderTop: "1px solid rgba(255,255,255,0.1)",
                        margin: "10px 0",
                      }}
                    />
                  );
                }
                const key = ("var" in s && s.var) || "container";
                const val = values[key] ?? s.default;
                return (
                  <label
                    key={key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      margin: "6px 0",
                      fontSize: 12,
                      color: "#aaa",
                    }}
                  >
                    {s.label}
                    <input
                      type="range"
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={val}
                      onChange={(e) =>
                        handleChange(s, parseFloat(e.target.value))
                      }
                      style={{ width: 110, accentColor: "#7c6ef6" }}
                    />
                    <span
                      style={{
                        fontVariantNumeric: "tabular-nums",
                        color: "#fff",
                        minWidth: 60,
                        textAlign: "right",
                        fontSize: 12,
                      }}
                    >
                      {formatValue(s, val)}
                    </span>
                  </label>
                );
              })}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    background: copied ? "#2d5a2d" : "#333",
                    color: "#eee",
                    border: `1px solid ${copied ? "#4a8" : "#555"}`,
                    borderRadius: 6,
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {copied ? "Copied!" : "Copy values"}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  style={{
                    background: "#333",
                    color: "#eee",
                    border: "1px solid #555",
                    borderRadius: 6,
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Reset all
                </button>
              </div>
            </div>
          }
        </>
      )}
    </div>
  );
}
