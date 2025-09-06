import React, { useEffect, useRef } from "react";

export default function VerticalLineOverlay({ chart, hoverTime }) {
    const lineRef = useRef(null);

    useEffect(() => {
        if (!chart || !lineRef.current) return;

        const updateLine = () => {
            if (hoverTime == null) {
                lineRef.current.style.display = "none";
                return;
            }
            const x = chart.timeScale().timeToCoordinate(hoverTime);
            if (x === undefined) {
                lineRef.current.style.display = "none";
                return;
            }

            lineRef.current.style.display = "block";
            lineRef.current.style.left = `${x+64}px`;
        };

        // actualizăm linia la fiecare mișcare a crosshair-ului
        const unsub = chart.subscribeCrosshairMove(updateLine);

        // de asemenea, actualizează linia când se schimbă hoverTime
        updateLine();

        return () => chart.unsubscribeCrosshairMove(updateLine);
    }, [chart, hoverTime]);

    return (
        <div
            ref={lineRef}
            style={{
                position: "absolute",
                top: 0,
                width: "2px",
                height: "100%",
                borderLeft: "2px dashed black", // linie punctată
                display: "none",
                zIndex: 10,
            }}
        />
    );
}
