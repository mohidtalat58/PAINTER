import React, { useRef, useState } from "react";

function CanvasBoard({ tool, color }) {
  const boardRef = useRef(null);
  const [shapes, setShapes] = useState([]);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentShape, setCurrentShape] = useState(null);

  const shapeTools = ["rectangle", "circle", "triangle"];

  const handleMouseDown = (e) => {
    if (!shapeTools.includes(tool)) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setDrawing(true);
    setStartPos({ x, y });

    setCurrentShape({
      type: tool,
      x,
      y,
      width: 0,
      height: 0,
      color,
    });
  };

  const handleMouseMove = (e) => {
    if (!drawing || !currentShape) return;

    const rect = boardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCurrentShape({
      ...currentShape,
      width: x - startPos.x,
      height: y - startPos.y,
    });
  };

  const handleMouseUp = () => {
    if (!currentShape) return;

    setShapes((prev) => [...prev, currentShape]);
    setCurrentShape(null);
    setDrawing(false);
  };

  const renderShape = (shape, index) => {
    const commonStyle = {
      position: "absolute",
      left: shape.x,
      top: shape.y,
      width: Math.abs(shape.width),
      height: Math.abs(shape.height),
      border: `2px solid ${shape.color}`,
      background: "transparent",
      pointerEvents: "auto",
    };

    if (shape.width < 0) {
      commonStyle.left = shape.x + shape.width;
    }
    if (shape.height < 0) {
      commonStyle.top = shape.y + shape.height;
    }

    switch (shape.type) {
      case "rectangle":
        return <div key={index} style={commonStyle} />;
      case "circle":
        return <div key={index} style={{ ...commonStyle, borderRadius: "50%" }} />;
      case "triangle":
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: commonStyle.left,
              top: commonStyle.top,
              width: 0,
              height: 0,
              borderLeft: `${Math.abs(shape.width) / 2}px solid transparent`,
              borderRight: `${Math.abs(shape.width) / 2}px solid transparent`,
              borderBottom: `${Math.abs(shape.height)}px solid ${shape.color}`,
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={boardRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        background: "white",
        overflow: "hidden",
      }}
    >
      {shapes.map((shape, index) => renderShape(shape, index))}
      {currentShape && renderShape(currentShape, "preview")}
    </div>
  );
}

export default CanvasBoard;