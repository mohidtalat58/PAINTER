import React from "react";

const ToolbarPanel = ({ tool, setTool, color, setColor, size, setSize, undo, redo, saveImage }) => {
  const tools = [
    { id: "brush", label: "🖌️ Brush" },
    { id: "select", label: "🔍 Select/Resize" },
    { id: "text", label: "🔤 Text" },
    { id: "rectangle", label: "⬜ Rectangle" },
    { id: "circle", label: "⭕ Circle" },
    { id: "ellipse", label: "🥚 Ellipse" },
    { id: "triangle", label: "🔺 Triangle" },
    { id: "diamond", label: "💎 Diamond" },
    { id: "line", label: "📏 Line" }
  ];

  return (
    <div style={styles.toolbar}>
      {/* Tools Section */}
      <div style={styles.section}>
        <span style={styles.label}>Tools</span>
        <div style={styles.grid}>
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              style={tool === t.id ? styles.activeBtn : styles.btn}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Configurations Section */}
      <div style={styles.section}>
        <span style={styles.label}>Size & Colors</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <input
            type="range"
            min="1"
            max="20"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            style={{ cursor: "pointer", accentColor: "#2563eb" }}
          />
          <span style={{ fontSize: "12px", width: "30px" }}>{size}px</span>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={styles.colorPicker}
          />
        </div>
      </div>

      {/* Actions Section */}
      <div style={styles.section}>
        <span style={styles.label}>Actions</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button style={styles.actionBtn} onClick={undo}>↩️ Undo</button>
          <button style={styles.actionBtn} onClick={redo}>↪️ Redo</button>
          <button style={{ ...styles.actionBtn, background: "#16a34a", color: "white" }} onClick={saveImage}>💾 Save Export</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  toolbar: {
    display: "flex",
    background: "white",
    borderBottom: "1px solid #e2e8f0",
    padding: "10px 20px",
    gap: "30px",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  label: {
    fontSize: "11px",
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase"
  },
  grid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px"
  },
  btn: {
    padding: "6px 12px",
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    color: "#334155"
  },
  activeBtn: {
    padding: "6px 12px",
    background: "#2563eb",
    color: "white",
    border: "1px solid #2563eb",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600"
  },
  colorPicker: {
    width: "35px",
    height: "30px",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    cursor: "pointer"
  },
  actionBtn: {
    padding: "6px 12px",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "13px"
  }
};

export default ToolbarPanel;