import React, { useEffect, useState, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries } from "lightweight-charts";
import { calculateEMA, calculateSMMA, calculateMACD, calculateWaveTrend } from "./mathIndicators";
import "./index.css";
import VerticalLineOverlay from "./VerticalLineOverlay";

export default function MyChart({ hoverTime, setIndicators, candleData, candels = false, onChartReady, SERIES, onHoverTime, }) {
  const containerRef = useRef(null);
  const [chart, setChart] = useState(null);
  const [candleSeries, setCandleSeries] = useState(null);
  const [seriesList, setSeriesList] = useState([]);






  
  useEffect(() => {
    if (!containerRef.current) return;

    const chartInstance = createChart(containerRef.current, {
      width: 1200,
      height: 400,
      layout: { background: { color: "#fff" }, textColor: "#333" },
      rightPriceScale: { visible: true },
      leftPriceScale: { visible: true },
      timeScale: { borderVisible: true },
    });

    const candle = chartInstance.addSeries(CandlestickSeries, { priceScaleId: "right" });
    setChart(chartInstance);
    setCandleSeries(candle);
    candle.applyOptions({ visible: candels });


    
    const crosshairHandler = (param) => {
      if (!param || !param.time) {
        if (onHoverTime) onHoverTime(null);
        return;
      }
      if (onHoverTime) onHoverTime(param.time);
    };

    chartInstance.subscribeCrosshairMove(crosshairHandler);

    return () => {
      chartInstance.unsubscribeCrosshairMove(crosshairHandler);
      chartInstance.remove();
    };
  }, []);

 
  useEffect(() => {
    if (chart && candleSeries && candleData?.length) {
      candleSeries.setData(candleData);

      
      if (onChartReady) onChartReady(chart);
    }
  }, [chart, candleSeries, candleData]);

  
  const addSeries = ({ id, label, type = "line", color = "blue", priceScaleId = "right", calculateFn, data }) => {
    if (!chart) return;

    setSeriesList((prev) => {
      if (prev.find((s) => s.id === id)) return prev;

      const seriesInstance = type === "line" ? chart.addSeries(LineSeries, { color, lineWidth: 2, priceScaleId }) : null;
      if (seriesInstance && calculateFn) {
        const res = calculateFn(candleData);
        seriesInstance.setData(res);

      }

      return [...prev, { id, label, type, color, priceScaleId, seriesInstance, show: true, calculateFn }];
    });
  };

  useEffect(() => {
    if (candels === true) {
      setIndicators(prev => ({
        ...prev,
        O: { data: candleData.map(c => ({ time: c.time, value: c.open })), color: "#000000ff" },
        H: { data: candleData.map(c => ({ time: c.time, value: c.high })), color: "#000000ff" },
        L: { data: candleData.map(c => ({ time: c.time, value: c.low })), color: "#000000ff" },
        C: { data: candleData.map(c => ({ time: c.time, value: c.close })), color: "#000000ff" },
        V: { data: candleData.map(c => ({ time: c.time, value: c.volume })), color: "#8a8a8aff" },
        TV: { data: candleData.map(c => ({ time: c.time, value: c.turnover })), color: "#8a8a8aff" },
      }));
    }

    seriesList.forEach((s) => {
      if (!s.show || !s.calculateFn) return;

      const res = s.calculateFn(candleData);
      s.seriesInstance.setData(res);

      if (setIndicators) {
        setIndicators(prev => ({
          ...prev,
          [s.label]: {
            data: res,       
            color: s.color      
          }
        }));
      }
    });
  }, [seriesList, candleData]);

  
  const toggleSeries = (id) => {
    if (!chart) return;

    setSeriesList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;

        if (s.seriesInstance) {
          s.seriesInstance.applyOptions({ visible: !s.show });
        }

        return { ...s, show: !s.show };
      })
    );
  };


  useEffect(() => {
    seriesList.forEach((s) => {
      if (s.show && s.seriesInstance && s.calculateFn) {
        s.seriesInstance.setData(s.calculateFn(candleData));
      }
    });
  }, [candleData, seriesList]);

  
  useEffect(() => {
    if (!chart) return;

    if (SERIES instanceof Array) {
      SERIES.forEach(i => {
        addSeries({ ...i })
      })
    }

  }, [chart]);




  return (
    <div
  className="chart-container"
  style={{
    display: "flex",      // pentru layout pe orizontală
    alignItems: "flex-start",
    gap: "24px",          // spațiu între checkbox-uri și chart
  }}
>
  {/* Checkbox-uri pe verticală */}
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: "12px",
      minWidth: "150px", // lățime fixă sau adaptabilă
    }}
  >
    {seriesList.map((s) => (
      <label
        key={s.id}
        style={{ color: s.color }}
        className="flex items-center gap-2"
      >
        <input
          type="checkbox"
          checked={s.show}
          onChange={() => toggleSeries(s.id)}
        />
        {s.label}
      </label>
    ))}
  </div>

  {/* Chart-ul */}
  <div
    ref={containerRef}
    style={{
      position: "relative",
      width: "100%",    // ocupă restul spațiului
      height: "400px",
    }}
  >
    <VerticalLineOverlay
      chart={chart}
      hoverTime={hoverTime}
      candleData={candleData}
      ref={containerRef}
    />
  </div>
</div>
  );
}
