import React, { useEffect, useState } from "react";

export default function VerticalLineOverlay({ chart, hoverTime }) {
  const [x, setX] = useState(null);
  const [offset,setOffset] = useState(64)

  useEffect(() => {
    if (!chart) return;

    const updateLine = () => {
      if (hoverTime == null) {
        setX(null);
        return;
      }
      const coord = chart.timeScale().timeToCoordinate(hoverTime);
      setX(coord ?? null);
    };

   
    updateLine();

    
  }, [chart, hoverTime]);



  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: `${x + offset}px`,
        width: "2px",
        height: "100%",
        borderLeft: "3px dashed black",
        zIndex: 10,
      }}
    />
  );
}
