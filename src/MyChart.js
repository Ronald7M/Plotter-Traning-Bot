import React, { useEffect, useState, useRef } from "react";
import { createChart, CandlestickSeries, LineSeries } from "lightweight-charts";
import "./index.css";
import VerticalLineOverlay from "./VerticalLineOverlay";

export default function MyChart({
  hoverTime,
  setIndicators,
  candleData,
  candels = false,
  onChartReady,
  SERIES,
  onHoverTime,
}) {
  const containerRef = useRef(null);
  const [chart, setChart] = useState(null);
  const [candleSeries, setCandleSeries] = useState(null);
  const [seriesList, setSeriesList] = useState([]);

  // --- Inițializare chart ---
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

    const candle = chartInstance.addSeries(CandlestickSeries, {
      priceScaleId: "right",
    });
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

  // --- Date candlestick ---
  useEffect(() => {
    if (chart && candleSeries && candleData?.length) {
      candleSeries.setData(candleData);
      if (onChartReady) onChartReady(chart);
    }
  }, [chart, candleSeries, candleData]);

  // --- Adaugare serie ---
  const addSeries = ({ id, label, type = "line", color = "blue", priceScaleId = "right", data = [], show = true }) => {
    if (!chart) return;

    setSeriesList((prev) => {
      if (prev.find((s) => s.id === id)) return prev;

      const seriesInstance = type === "line"
        ? chart.addSeries(LineSeries, { color, lineWidth: 2, priceScaleId })
        : null;

      if (seriesInstance && data?.length) {
        seriesInstance.setData(data);
      }

      seriesInstance?.applyOptions({ visible: show });

      return [...prev, { id, label, type, color, priceScaleId, seriesInstance, show, data }];
    });
  };

  // --- Toggle vizibilitate serie ---
  const toggleSeries = (id) => {
    if (!chart) return;

    setSeriesList((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        s.seriesInstance?.applyOptions({ visible: !s.show });
        return { ...s, show: !s.show };
      })
    );
  };

  // --- Actualizare indicators și date existente ---
  useEffect(() => {
    if (candels === true) {
      setIndicators?.((prev) => ({
        ...prev,
        O: { data: candleData.map((c) => ({ time: c.time, value: c.open })), color: "#000000ff" },
        H: { data: candleData.map((c) => ({ time: c.time, value: c.high })), color: "#000000ff" },
        L: { data: candleData.map((c) => ({ time: c.time, value: c.low })), color: "#000000ff" },
        C: { data: candleData.map((c) => ({ time: c.time, value: c.close })), color: "#000000ff" },
        V: { data: candleData.map((c) => ({ time: c.time, value: c.volume })), color: "#8a8a8aff" },
        TV: { data: candleData.map((c) => ({ time: c.time, value: c.turnover })), color: "#8a8a8aff" },
      }));
    }

    seriesList.forEach((s) => {
      if (!s.show || !s.data) return;
      s.seriesInstance.setData(s.data);

      setIndicators?.((prev) => ({
        ...prev,
        [s.label]: { data: s.data, color: s.color },
      }));
    });
  }, [seriesList, candleData, candels, setIndicators]);

  // --- Sincronizare prop SERIES ---
  useEffect(() => {
    if (!chart || !(SERIES instanceof Array)) return;

    SERIES.forEach((serie) => {
      const existing = seriesList.find((s) => s.id === serie.id);

      if (existing) {
        // actualizează datele doar
        if (serie.data?.length) existing.seriesInstance.setData(serie.data);
      } else {
        addSeries({ ...serie, show: serie.show ?? true });
      }

      setIndicators?.((prev) => ({
        ...prev,
        [serie.label]: { data: serie.data, color: serie.color },
      }));
    });
  }, [SERIES, chart, seriesList, setIndicators]);

  return (
    <div
      className="chart-container"
      style={{ display: "flex", alignItems: "flex-start", gap: "24px" }}
    >
      {/* Checkbox-uri */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", minWidth: "150px" }}>
        {seriesList.map((s) => (
          <label key={s.id} style={{ color: s.color }} className="flex items-center gap-2">
            <input type="checkbox" checked={s.show} onChange={() => toggleSeries(s.id)} />
            {s.label}
          </label>
        ))}
      </div>

      {/* Chart */}
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: "400px" }}>
        <VerticalLineOverlay chart={chart} hoverTime={hoverTime} candleData={candleData} ref={containerRef} />
      </div>
    </div>
  );
}
