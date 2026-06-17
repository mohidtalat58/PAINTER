import React, { useRef, useState, useEffect } from "react";
import Navbar from "./components/Navbar.jsx";

function App() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const docEditableRef = useRef(null);

  // ==========================================
  // GLOBAL APPLICATION STATES
  // ==========================================
  const [appMode, setAppMode] = useState("draw"); // "draw" | "document"
  
  // Drawing Canvas Tool Configurations
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(6); 
  const [eraserSize, setEraserSize] = useState(24); 

  // Infinite Viewport Camera Matrices
  const [zoom, setZoom] = useState(1.0); 
  const [pan, setPan] = useState({ x: 80, y: 80 }); 
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  
  // Viewport Container Scale (Fills Browser Window Screen)
  const [viewportDimensions, setViewportDimensions] = useState({ width: 1200, height: 600 });
  
  // THE DRAWING BOARD SHEET SPECIFICATIONS (Position + Size)
  const [sheetPos, setSheetPos] = useState({ x: 0, y: 0 });
  const [sheetSize, setSheetSize] = useState({ width: 1000, height: 650 });
  const [isResizingSheet, setIsResizingSheet] = useState(null); // null | "tl" | "tr" | "bl" | "br"
  const [sheetAnchor, setSheetAnchor] = useState({ x: 0, y: 0 });

  const [objects, setObjects] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [drawing, setDrawing] = useState(false);
  
  // Shape/Object Transformations
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [copiedObject, setCopiedObject] = useState(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeCorner, setResizeCorner] = useState(null); 
  const [resizeFixedPoint, setResizeFixedPoint] = useState({ x: 0, y: 0 });
  const [isBending, setIsBending] = useState(false);

  // Responds to window browser resizes to keep workspace broad
  useEffect(() => {
    if (containerRef.current) {
      setViewportDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setViewportDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [appMode]);

  const clearWorkspace = () => {
    if (appMode === "draw") {
      setObjects([]);
      setRedoStack([]);
      setSelectedIndex(null);
      setSheetPos({ x: 0, y: 0 });
      setSheetSize({ width: 1000, height: 650 });
      setPan({ x: 80, y: 80 });
      setZoom(1.0);
    } else if (docEditableRef.current) {
      docEditableRef.current.innerHTML = "";
    }
  };

  // ==========================================
  // GRAPHICS CANVAS ENGINE RENDERER
  // ==========================================
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || appMode !== "draw") return;
    const ctx = canvas.getContext("2d");

    // 1. Reset Buffer Viewport & Fill Workspace Void
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#cbd5e1"; // Slate desk background
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Set Up Infinite Camera Matrix Position Lookups
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 3. Render the Stretchy White Drawing Sheet Layer
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = "rgba(15, 23, 42, 0.15)";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(sheetPos.x, sheetPos.y, sheetSize.width, sheetSize.height);
    ctx.restore();

    // Sheet Perimeter Wireframe
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sheetPos.x, sheetPos.y, sheetSize.width, sheetSize.height);

    // 4. Draw Vector Graphics Elements
    objects.forEach((obj, index) => {
      const rx = obj.width < 0 ? obj.x + obj.width : obj.x;
      const ry = obj.height < 0 ? obj.y + obj.height : obj.y;
      const rw = Math.abs(obj.width);
      const rh = Math.abs(obj.height);

      ctx.save();
      ctx.beginPath();
      
      ctx.strokeStyle = obj.type === "erase-path" ? "#ffffff" : obj.color;
      ctx.lineWidth = obj.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (obj.fillColor) ctx.fillStyle = obj.fillColor;

      if ((obj.type === "path" || obj.type === "erase-path") && obj.points) {
        obj.points.forEach((p, i) => {
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        if (obj.type === "path" && obj.fillColor) ctx.fill();
        ctx.stroke();
      }
      else if (obj.type === "plastic") {
        ctx.moveTo(obj.x, obj.y);
        ctx.quadraticCurveTo(obj.bx, obj.by, obj.x + obj.width, obj.y + obj.height);
        if (obj.fillColor) ctx.fill();
        ctx.stroke();
      }
      else if (obj.type === "rectangle") {
        if (obj.fillColor) ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      }
      else if (obj.type === "circle" || obj.type === "ellipse") {
        ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2 || 1, 0, 0, Math.PI * 2);
        if (obj.fillColor) ctx.fill();
        ctx.stroke();
      }
      else if (obj.type === "triangle") {
        ctx.moveTo(rx + rw / 2, ry);
        ctx.lineTo(rx, ry + rh);
        ctx.lineTo(rx + rw, ry + rh);
        ctx.closePath();
        if (obj.fillColor) ctx.fill();
        ctx.stroke();
      }
      else if (obj.type === "diamond") {
        ctx.moveTo(rx + rw / 2, ry);
        ctx.lineTo(rx + rw, ry + rh / 2);
        ctx.lineTo(rx + rw / 2, ry + rh);
        ctx.lineTo(rx, ry + rh / 2);
        ctx.closePath();
        if (obj.fillColor) ctx.fill();
        ctx.stroke();
      }
      else if (obj.type === "line") {
        ctx.moveTo(obj.x, obj.y);
        ctx.lineTo(obj.x + obj.width, obj.y + obj.height);
        ctx.stroke();
      }

      ctx.restore();

      // Shape Bounding Handles
      if (selectedIndex === index && obj.type !== "erase-path") {
        ctx.save();
        ctx.strokeStyle = "#2563eb";
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([4 / zoom, 4 / zoom]);
        
        if (obj.type === "path" && obj.points) {
          const xs = obj.points.map(p => p.x);
          const ys = obj.points.map(p => p.y);
          ctx.strokeRect(Math.min(...xs) - 4, Math.min(...ys) - 4, Math.max(...xs) - Math.min(...xs) + 8, Math.max(...ys) - Math.min(...ys) + 8);
        } else {
          ctx.strokeRect(rx - 4, ry - 4, rw + 8, rh + 8);
          ctx.fillStyle = "#2563eb";
          const nodeS = 10 / zoom;
          const offset = nodeS / 2;
          ctx.fillRect(rx - offset, ry - offset, nodeS, nodeS);          
          ctx.fillRect(rx + rw - offset, ry - offset, nodeS, nodeS);     
          ctx.fillRect(rx - offset, ry + rh - offset, nodeS, nodeS);     
          ctx.fillRect(rx + rw - offset, ry + rh - offset, nodeS, nodeS); 

          if (obj.type === "plastic") {
            ctx.fillStyle = "#ea580c";
            ctx.beginPath();
            ctx.arc(obj.bx, obj.by, 7 / zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    });

    // 5. RENDER ALL FOUR ACTIVE SHEET EXTENSION STRETCH HANDLES
    ctx.save();
    ctx.fillStyle = "#2563eb"; // Royal Blue stretch nodes
    const handleSize = 14 / zoom;
    const half = handleSize / 2;

    const xLeft = sheetPos.x;
    const xRight = sheetPos.x + sheetSize.width;
    const yTop = sheetPos.y;
    const yBottom = sheetPos.y + sheetSize.height;

    // Render 4 Handles at Sheet Extremities
    ctx.fillRect(xLeft - half, yTop - half, handleSize, handleSize);   // Top Left
    ctx.fillRect(xRight - half, yTop - half, handleSize, handleSize);  // Top Right
    ctx.fillRect(xLeft - half, yBottom - half, handleSize, handleSize); // Bottom Left
    ctx.fillRect(xRight - half, yBottom - half, handleSize, handleSize);// Bottom Right
    
    ctx.restore();
    ctx.restore();
  };

  useEffect(() => {
    draw();
  }, [objects, appMode, selectedIndex, pan, zoom, viewportDimensions, sheetSize, sheetPos]);

  // Transcribes viewport monitor pixels directly back into localized vector world metrics
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    return {
      x: (clickX - pan.x) / zoom,
      y: (clickY - pan.y) / zoom
    };
  };

  // ==========================================
  // INTUITIVE CANVAS CLICK HOOK INTERFACES
  // ==========================================
  const handleDown = (e) => {
    if (appMode !== "draw") return;

    // Viewport Desktop Panning
    if (tool === "pan") {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    const { x, y } = getCoordinates(e);
    const clickBuffer = 16 / zoom;

    const xl = sheetPos.x;
    const xr = sheetPos.x + sheetSize.width;
    const yt = sheetPos.y;
    const yb = sheetPos.y + sheetSize.height;

    // VERIFY IF ANY OF THE 4 CORNERS ARE BEING DRIVEN
    if (Math.hypot(x - xl, y - yt) < clickBuffer) {
      setIsResizingSheet("tl");
      setSheetAnchor({ x: xr, y: yb });
      return;
    }
    if (Math.hypot(x - xr, y - yt) < clickBuffer) {
      setIsResizingSheet("tr");
      setSheetAnchor({ x: xl, y: yb });
      return;
    }
    if (Math.hypot(x - xl, y - yb) < clickBuffer) {
      setIsResizingSheet("bl");
      setSheetAnchor({ x: xr, y: yt });
      return;
    }
    if (Math.hypot(x - xr, y - yb) < clickBuffer) {
      setIsResizingSheet("br");
      setSheetAnchor({ x: xl, y: yt });
      return;
    }

    // Individual Vector Transforms Grab Checkers
    if (selectedIndex !== null) {
      const obj = objects[selectedIndex];
      const rx = obj.width < 0 ? obj.x + obj.width : obj.x;
      const ry = obj.height < 0 ? obj.y + obj.height : obj.y;
      const rw = Math.abs(obj.width);
      const rh = Math.abs(obj.height);
      const hitRadius = 14 / zoom;
      
      if (obj.type === "plastic" && Math.hypot(x - obj.bx, y - obj.by) < hitRadius) {
        setIsBending(true);
        setDrawing(true);
        return;
      }
      
      if (obj.type !== "path" && obj.type !== "erase-path") {
        if (Math.hypot(x - rx, y - ry) < hitRadius) {
          setIsResizing(true); setResizeCorner("tl");
          setResizeFixedPoint({ x: obj.x + obj.width, y: obj.y + obj.height });
          return;
        }
        if (Math.hypot(x - (rx + rw), y - ry) < hitRadius) {
          setIsResizing(true); setResizeCorner("tr");
          setResizeFixedPoint({ x: obj.x, y: obj.y + obj.height });
          return;
        }
        if (Math.hypot(x - rx, y - (ry + rh)) < hitRadius) {
          setIsResizing(true); setResizeCorner("bl");
          setResizeFixedPoint({ x: obj.x + obj.width, y: obj.y });
          return;
        }
        if (Math.hypot(x - (rx + rw), y - (ry + rh)) < hitRadius) {
          setIsResizing(true); setResizeCorner("br");
          setResizeFixedPoint({ x: obj.x, y: obj.y });
          return;
        }
      }
      setSelectedIndex(null);
      return; 
    }

    // Paint Bucket Matrix Collision Locator
    if (tool === "bucket") {
      let matchedIndex = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      for (let i = objects.length - 1; i >= 0; i--) {
        const obj = objects[i];
        if (obj.type === "erase-path" || obj.type === "line") continue;

        const rx = obj.width < 0 ? obj.x + obj.width : obj.x;
        const ry = obj.height < 0 ? obj.y + obj.height : obj.y;
        const rw = Math.abs(obj.width);
        const rh = Math.abs(obj.height);

        ctx.beginPath();
        if (obj.type === "rectangle") ctx.rect(rx, ry, rw, rh);
        else if (obj.type === "circle" || obj.type === "ellipse") ctx.ellipse(rx + rw / 2, ry + rh / 2, rw / 2, rh / 2 || 1, 0, 0, Math.PI * 2);
        else if (obj.type === "triangle") { ctx.moveTo(rx + rw / 2, ry); ctx.lineTo(rx, ry + rh); ctx.lineTo(rx + rw, ry + rh); ctx.closePath(); }
        else if (obj.type === "diamond") { ctx.moveTo(rx + rw / 2, ry); ctx.lineTo(rx + rw, ry + rh / 2); ctx.lineTo(rx + rw / 2, ry + rh); ctx.lineTo(rx, ry + rh / 2); ctx.closePath(); }
        else if (obj.type === "plastic") { ctx.moveTo(obj.x, obj.y); ctx.quadraticCurveTo(obj.bx, obj.by, obj.x + obj.width, obj.y + obj.height); }
        else if (obj.type === "path" && obj.points) {
          obj.points.forEach((p, idx) => { if (idx === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
          ctx.closePath();
        }

        if (ctx.isPointInPath(x, y)) { matchedIndex = i; break; }
      }

      if (matchedIndex !== null) {
        setObjects((prev) => prev.map((obj, idx) => idx === matchedIndex ? { ...obj, fillColor: color } : obj));
      }
      return;
    }

    setDrawing(true);

    if (tool === "eraser") {
      setObjects((prev) => [...prev, { type: "erase-path", points: [{ x, y }], size: eraserSize }]);
    } else if (tool === "brush") {
      setObjects((prev) => [...prev, { type: "path", points: [{ x, y }], color, size: brushSize }]);
    } else if (tool === "plastic") {
      const newObj = { type: "plastic", x, y, width: 0, height: 0, bx: x, by: y, color, size: brushSize };
      setObjects((prev) => [...prev, newObj]);
      setSelectedIndex(objects.length);
    } else {
      if (["rectangle", "circle", "ellipse", "triangle", "diamond", "line"].includes(tool)) {
        const newObj = { type: tool, x, y, width: 0, height: 0, color, size: brushSize };
        setObjects((prev) => [...prev, newObj]);
        setSelectedIndex(objects.length); 
      }
    }
  };

  const handleMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    const { x, y } = getCoordinates(e);

    // FOUR CORNER EXTENSION RESOLVER LOGIC
    if (isResizingSheet) {
      const targetX = x;
      const targetY = y;

      const updatedX = Math.min(targetX, sheetAnchor.x);
      const updatedY = Math.min(targetY, sheetAnchor.y);
      const updatedWidth = Math.max(100, Math.abs(targetX - sheetAnchor.x));
      const updatedHeight = Math.max(100, Math.abs(targetY - sheetAnchor.y));

      setSheetPos({ x: updatedX, y: updatedY });
      setSheetSize({ width: updatedWidth, height: updatedHeight });
      return;
    }

    if (!drawing && !isResizing && !isBending) return;

    if (selectedIndex !== null && isResizing) {
      setObjects((old) => old.map((obj, idx) => {
        if (idx !== selectedIndex) return obj;
        if (resizeCorner === "br") return { ...obj, width: x - resizeFixedPoint.x, height: y - resizeFixedPoint.y };
        if (resizeCorner === "tl") return { ...obj, x, y, width: resizeFixedPoint.x - x, height: resizeFixedPoint.y - y };
        if (resizeCorner === "tr") return { ...obj, y, width: x - resizeFixedPoint.x, height: resizeFixedPoint.y - y };
        if (resizeCorner === "bl") return { ...obj, x, width: resizeFixedPoint.x - x, height: y - resizeFixedPoint.y };
        return obj;
      }));
      return;
    }

    if (selectedIndex !== null && isBending) {
      setObjects((old) => old.map((obj, idx) => idx === selectedIndex ? { ...obj, bx: x, by: y } : obj));
      return;
    }

    if (tool === "eraser" || tool === "brush") {
      setObjects((old) => old.map((obj, idx) => idx === old.length - 1 ? { ...obj, points: [...obj.points, { x, y }] } : obj));
      return;
    }

    if (tool === "plastic" || ["rectangle", "circle", "ellipse", "triangle", "diamond", "line"].includes(tool)) {
      setObjects((old) => old.map((obj, idx) => {
        if (idx === old.length - 1) {
          const w = x - obj.x;
          const h = y - obj.y;
          const initialBx = obj.type === "plastic" && !isBending ? obj.x + w / 2 : obj.bx;
          const initialBy = obj.type === "plastic" && !isBending ? obj.y + h / 2 : obj.by;
          return { ...obj, width: w, height: h, bx: initialBx, by: initialBy };
        }
        return obj;
      }));
    }
  };

  const handleUp = () => {
    setDrawing(false);
    setIsResizing(false);
    setIsBending(false);
    setIsPanning(false);
    setIsResizingSheet(null);
    setResizeCorner(null);
  };

  // ==========================================
  // OFFICE DOCUMENT UTILITY SYSTEM
  // ==========================================
  const executeDocStyle = (command, value = null) => {
    document.execCommand(command, false, value);
    if (docEditableRef.current) docEditableRef.current.focus();
  };

  const handleCut = () => {
    if (selectedIndex === null) return;
    setCopiedObject(objects[selectedIndex]);
    setObjects(objects.filter((_, i) => i !== selectedIndex));
    setSelectedIndex(null);
  };

  const handleCopy = () => {
    if (selectedIndex === null) return;
    setCopiedObject(objects[selectedIndex]);
  };

  const handlePaste = () => {
    if (!copiedObject) return;
    const clone = JSON.parse(JSON.stringify(copiedObject));
    clone.x += 30; clone.y += 30;
    if (clone.bx) { clone.bx += 30; clone.by += 30; }
    setObjects([...objects, clone]);
    setSelectedIndex(objects.length);
  };

  const undo = () => {
    if (!objects.length) return;
    const copy = [...objects];
    const removed = copy.pop();
    setObjects(copy);
    setRedoStack((r) => [...r, removed]);
    setSelectedIndex(null);
  };

  const redo = () => {
    if (!redoStack.length) return;
    const copy = [...redoStack];
    const item = copy.pop();
    setObjects((prev) => [...prev, item]);
    setRedoStack(copy);
  };

  const exportWorkspaceOut = () => {
    if (appMode === "draw") {
      const url = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "multidirectional-board.png";
      link.href = url;
      link.click();
    } else {
      const dataText = docEditableRef.current ? docEditableRef.current.innerHTML : "";
      const blob = new Blob([dataText], { type: "text/html;charset=utf-8" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "office-document.html";
      link.click();
    }
  };

  // Evaluates dynamic directional diagonal cursor arrows depending on hover location
  const getWorkspaceCursor = () => {
    if (tool === "pan") return isPanning ? "grabbing" : "grab";
    if (isResizingSheet === "tl" || isResizingSheet === "br") return "nwse-resize";
    if (isResizingSheet === "tr" || isResizingSheet === "bl") return "nesw-resize";
    return "default";
  };

  return (
    <div style={localStyles.viewportWrapper}>
      <Navbar 
        onClearCanvas={clearWorkspace} 
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        hasSelection={selectedIndex !== null}
        hasClipboard={!!copiedObject}
      />
      
      {/* ======================================================== */}
      {/* CONTROL DECK STRIP TOOLBAR PANEL                          */}
      {/* ======================================================== */}
      <div style={localStyles.horizontalToolbar}>
        
        {appMode === "draw" ? (
          <>
            <div style={localStyles.toolbarSection}>
              <span style={localStyles.areaLabel}>Control Deck</span>
              <div style={localStyles.cleanIconRow}>
                <button onClick={() => setTool("brush")} style={tool === "brush" ? localStyles.blackActiveSymbolBtn : localStyles.blackSymbolBtn} title="Paint Brush Vector">
                  🖌️
                </button>
                <button onClick={() => setTool("pan")} style={tool === "pan" ? localStyles.blackActiveSymbolBtn : localStyles.blackSymbolBtn} title="Hand Workspace Pan">
                  🖐️
                </button>
                <button onClick={() => setTool("eraser")} style={tool === "eraser" ? localStyles.blackActiveSymbolBtn : localStyles.blackSymbolBtn} title="Eraser Path">
                  🧽
                </button>
                <button onClick={() => setTool("bucket")} style={tool === "bucket" ? localStyles.blackActiveSymbolBtn : localStyles.blackSymbolBtn} title="Paint Bucket Fill">
                  🪣
                </button>
              </div>
            </div>

            <div style={localStyles.divider} />

            <div style={localStyles.toolbarSection}>
              <span style={localStyles.areaLabel}>Shapes Grid</span>
              <div style={localStyles.shapesVerticalGridBox}>
                <button onClick={() => setTool("rectangle")} style={tool === "rectangle" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" fill="none" stroke="currentColor" strokeWidth="3"/></svg>
                </button>
                <button onClick={() => setTool("circle")} style={tool === "circle" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="3"/></svg>
                </button>
                <button onClick={() => setTool("ellipse")} style={tool === "ellipse" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><ellipse cx="12" cy="12" rx="10" ry="6" fill="none" stroke="currentColor" strokeWidth="3"/></svg>
                </button>
                <button onClick={() => setTool("triangle")} style={tool === "triangle" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,2 22,21 2,21" fill="none" stroke="currentColor" strokeWidth="3"/></svg>
                </button>
                <button onClick={() => setTool("diamond")} style={tool === "diamond" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><polygon points="12,2 22,12 12,22 2,12" fill="none" stroke="currentColor" strokeWidth="3"/></svg>
                </button>
                <button onClick={() => setTool("line")} style={tool === "line" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <svg width="14" height="14" viewBox="0 0 24 24"><line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="3.5"/></svg>
                </button>
                <button onClick={() => setTool("plastic")} style={tool === "plastic" ? localStyles.activeShapeItem : localStyles.shapeItem}>
                  <span style={{ fontSize: "14px", fontWeight: "900" }}>~</span>
                </button>
              </div>
            </div>

            <div style={localStyles.divider} />

            <div style={localStyles.toolbarSection}>
              <span style={localStyles.areaLabel}>Ink Swatch</span>
              <div style={localStyles.rowLayout}>
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={localStyles.colorPickerSquare} />
                <div style={localStyles.badgeIndicator}>{tool === "eraser" ? `${eraserSize}px` : `${brushSize}px`}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={localStyles.toolbarSection}>
              <span style={localStyles.areaLabel}>Multi-Style Text Workspace Palette</span>
              <div style={localStyles.rowLayout}>
                <button onClick={() => executeDocStyle("formatBlock", "<h1>")} style={localStyles.docExecutiveBtn}><b>H1 Heading</b></button>
                <button onClick={() => executeDocStyle("formatBlock", "<h2>")} style={localStyles.docExecutiveBtn}><b>H2 Title</b></button>
                <button onClick={() => executeDocStyle("formatBlock", "<p>")} style={localStyles.docExecutiveBtn}>Paragraph Style</button>
                <button onClick={() => executeDocStyle("fontSize", "6")} style={localStyles.docExecutiveBtn}>Large Letters</button>
                <button onClick={() => executeDocStyle("fontSize", "2")} style={localStyles.docExecutiveBtn}>Small Letters</button>
                <button onClick={() => executeDocStyle("bold")} style={{ ...localStyles.docExecutiveBtn, fontWeight: "800" }}>B</button>
                <button onClick={() => executeDocStyle("italic")} style={{ ...localStyles.docExecutiveBtn, fontStyle: "italic" }}>I</button>
                <input type="color" onChange={(e) => executeDocStyle("foreColor", e.target.value)} style={localStyles.colorPickerSquare} />
              </div>
            </div>
          </>
        )}

        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={localStyles.toolbarSection}>
            <span style={localStyles.areaLabel}>Active Sheet Render Mode</span>
            <select value={appMode} onChange={(e) => setAppMode(e.target.value)} style={localStyles.workspaceSelector}>
              <option value="draw">🎨 Design Board Canvas</option>
              <option value="document">📝 Mixed Office Canvas Sheet Editor</option>
            </select>
          </div>
          
          <div style={localStyles.toolbarSection}>
            <span style={localStyles.areaLabel}>Action Matrix</span>
            <div style={localStyles.rowLayout}>
              <button style={localStyles.operationBtn} onClick={undo} disabled={appMode !== "draw"}>Undo</button>
              <button style={localStyles.operationBtn} onClick={redo} disabled={appMode !== "draw"}>Redo</button>
              <button style={{ ...localStyles.operationBtn, background: "#16a34a", color: "white", border: "none" }} onClick={exportWorkspaceOut}>Save File</button>
            </div>
          </div>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SCREEN FIELD CONTENT FRAME                               */}
      {/* ======================================================== */}
      <div style={localStyles.canvasMainContentWindow}>
        
        {appMode === "draw" && (
          <div style={localStyles.leftVerticalSliderContainer}>
            <div style={localStyles.sliderWrapperColumn}>
              <span style={localStyles.sliderLabel}>SIZE</span>
              <span style={localStyles.sliderSubLabel}>MAX</span>
              <input 
                type="range"
                min="2"
                max="100"
                value={tool === "eraser" ? eraserSize : brushSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (tool === "eraser") setEraserSize(val);
                  else setBrushSize(val);
                }}
                style={localStyles.verticalRangeInputSlider}
              />
              <span style={localStyles.sliderSubLabel}>MIN</span>
            </div>

            <div style={localStyles.sidebarDividerLine} />

            <div style={localStyles.sliderWrapperColumn}>
              <span style={localStyles.sliderLabel}>VIEW</span>
              <span style={localStyles.sliderSubLabel}>300%</span>
              <input 
                type="range"
                min="0.2"
                max="3.0"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                style={localStyles.verticalRangeInputSlider}
              />
              <span style={localStyles.sliderSubLabel}>20%</span>
              <span style={localStyles.zoomPercentageLabel}>{Math.round(zoom * 100)}%</span>
              <button style={localStyles.zoomResetBtn} onClick={() => { setZoom(1.0); setPan({ x: 80, y: 80 }); setSheetPos({ x: 0, y: 0 }); }}>Reset View</button>
            </div>
            
            <div style={localStyles.sidebarDividerLine} />
            
            {/* Realtime telemetry tracking of board dimensions */}
            <div style={localStyles.sheetSizeTelemetryBox}>
              <div>W: {Math.round(sheetSize.width)}px</div>
              <div>H: {Math.round(sheetSize.height)}px</div>
            </div>
          </div>
        )}

        <div 
          ref={containerRef}
          style={localStyles.canvasCenterWrapper}
          onMouseMove={handleMove}
          onMouseUp={handleUp}
          onMouseLeave={handleUp}
        >
          {appMode === "draw" ? (
            <canvas
              ref={canvasRef}
              width={viewportDimensions.width}
              height={viewportDimensions.height}
              onMouseDown={handleDown}
              style={{
                display: "block",
                cursor: getWorkspaceCursor()
              }}
            />
          ) : (
            <div style={localStyles.documentLetterSheet}>
              <div 
                ref={docEditableRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                placeholder="Start writing your executive document..."
                style={localStyles.canvasContinuousRichTextEditor}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ========================================================
// STYLES HOOK DICTIONARY                                   
// ========================================================
const localStyles = {
  viewportWrapper: {
    background: "#f1f5f9",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  },
  horizontalToolbar: {
    display: "flex",
    flexDirection: "row",
    background: "#ffffff",
    borderBottom: "1px solid #e2e8f0",
    padding: "0 24px",
    gap: "20px",
    alignItems: "center",
    marginTop: "65px", 
    height: "76px", 
    flexShrink: 0,
    boxShadow: "0 2px 4px rgba(0,0,0,0.01)",
    zIndex: 10
  },
  toolbarSection: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },
  areaLabel: {
    fontSize: "10px",
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  rowLayout: {
    display: "flex",
    flexDirection: "row",
    gap: "10px",
    alignItems: "center"
  },
  cleanIconRow: {
    display: "flex",
    background: "#f1f5f9",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    gap: "2px"
  },
  blackSymbolBtn: {
    width: "32px",
    height: "32px",
    fontSize: "16px",
    background: "transparent",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#000000",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  blackActiveSymbolBtn: {
    width: "32px",
    height: "32px",
    fontSize: "16px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#2563eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.08)"
  },
  divider: {
    width: "1px",
    height: "40px",
    background: "#cbd5e1"
  },
  shapesVerticalGridBox: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "5px",
    width: "105px", 
    height: "44px", 
    overflowY: "auto",
    paddingRight: "3px",
    background: "#f8fafc",
    padding: "4px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0"
  },
  shapeItem: {
    width: "26px",
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    border: "none",
    borderRadius: "4px",
    color: "#475569",
    cursor: "pointer"
  },
  activeShapeItem: {
    width: "26px",
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#2563eb",
    border: "none",
    borderRadius: "4px",
    color: "#ffffff",
    cursor: "pointer"
  },
  colorPickerSquare: {
    width: "34px",
    height: "34px",
    border: "2px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    padding: 0,
    background: "none"
  },
  docExecutiveBtn: {
    padding: "7px 12px",
    fontSize: "13px",
    borderRadius: "6px",
    border: "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#1e293b",
    fontWeight: "500",
    cursor: "pointer"
  },
  workspaceSelector: {
    padding: "8px 14px",
    fontSize: "13px",
    fontWeight: "700",
    borderRadius: "8px",
    border: "2px solid #2563eb",
    background: "#ffffff",
    color: "#2563eb",
    cursor: "pointer",
    outline: "none"
  },
  operationBtn: {
    padding: "7px 14px",
    background: "#ffffff",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: "600",
    color: "#334155",
    cursor: "pointer"
  },
  canvasMainContentWindow: {
    flex: 1,
    background: "#cbd5e1", 
    display: "flex",
    flexDirection: "row",
    overflow: "hidden"
  },
  leftVerticalSliderContainer: {
    width: "70px",
    background: "#ffffff",
    borderRight: "1px solid #cbd5e1",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "20px 0",
    flexShrink: 0,
    zIndex: 5
  },
  sliderWrapperColumn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px"
  },
  verticalRangeInputSlider: {
    WebkitAppearance: "slider-vertical",
    width: "10px",
    height: "140px",
    cursor: "pointer",
    accentColor: "#2563eb",
    margin: "4px 0"
  },
  sliderLabel: {
    fontSize: "11px",
    fontWeight: "900",
    color: "#1e293b",
    letterSpacing: "0.03em"
  },
  sliderSubLabel: {
    fontSize: "9px",
    fontWeight: "700",
    color: "#94a3b8"
  },
  zoomPercentageLabel: {
    fontSize: "11px",
    fontWeight: "800",
    color: "#2563eb",
    marginTop: "2px"
  },
  zoomResetBtn: {
    marginTop: "4px",
    padding: "2px 6px",
    fontSize: "10px",
    fontWeight: "700",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "4px",
    cursor: "pointer"
  },
  sidebarDividerLine: {
    width: "40px",
    height: "1px",
    background: "#e2e8f0",
    margin: "12px 0"
  },
  badgeIndicator: {
    padding: "6px 10px",
    background: "#f1f5f9",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "700",
    color: "#0f172a"
  },
  sheetSizeTelemetryBox: {
    fontSize: "9px",
    fontWeight: "800",
    color: "#64748b",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    background: "#f8fafc",
    padding: "4px 6px",
    borderRadius: "4px",
    border: "1px solid #e2e8f0"
  },
  canvasCenterWrapper: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
    background: "#cbd5e1"
  },
  documentLetterSheet: {
    width: "850px",
    height: "calc(100% - 80px)",
    background: "#ffffff",
    boxShadow: "0 10px 40px rgba(0,0,0,0.12)",
    borderRadius: "8px",
    margin: "40px auto",
    display: "flex",
    flexDirection: "column",
    padding: "50px",
    overflowY: "auto"
  },
  canvasContinuousRichTextEditor: {
    flex: 1,
    width: "100%",
    height: "100%",
    border: "none",
    outline: "none",
    lineHeight: "1.8",
    fontFamily: "inherit",
    fontSize: "16px",
    color: "#334155"
  }
};

export default App;