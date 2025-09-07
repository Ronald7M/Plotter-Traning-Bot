import React, { useEffect, useState } from "react";

export default function VerticalLineOverlay({ chart, hoverTime,ref }) {
  const [x, setX] = useState(null);

  useEffect(() => {
    if (!chart) return;

    const updateLine = () => {
      if (hoverTime == null) {
        setX(null); 
        return;
      }
      const coord = chart.timeScale().timeToCoordinate(hoverTime);
      const offSet=getCanvasWidth(ref, 0, 0);
      setX(coord+offSet ?? null);
    };

    updateLine();
    console.log(getCanvasWidth(ref, 0, 0))

  }, [chart, hoverTime]);


  



  function getCanvasWidth(containerRef, tdIndex = 0, canvasIndex = 0) {
  if (!containerRef?.current) return 0;


  const tds = containerRef.current.querySelectorAll("td");
  const td = tds[tdIndex];
  if (!td) return 0;


  const canvases = td.querySelectorAll("canvas");
  const canvas = canvases[canvasIndex];
  if (!canvas) return 0;

  
  return canvas.width;
}

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: `${x }px`,
        width: "2px",
        height: "100%",
        borderLeft: "2px dashed black",
        zIndex: 10,
        pointerEvents: "none", 
      }}
    />
  );
}
