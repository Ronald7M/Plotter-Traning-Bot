import React, { useState, useEffect } from "react";

export function VerticalLineOnCursor({ color = "red", width = 1 }) {
  const [x, setX] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => setX(e.clientX);
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: x,
        width: width,
        height: "100vh",
        backgroundColor: color,
        zIndex: 9999,
        pointerEvents: "none",
        transition: "left 0.02s",
      }}
    />
  );
}
