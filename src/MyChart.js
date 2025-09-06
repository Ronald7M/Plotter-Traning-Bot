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
    if (!candleSeries || hoverTime == null) return;

    candleSeries.applyOptions({
      markers: [
        {
          time: hoverTime,
          position: "aboveBar",
          color: "red",
          shape: "arrowUp",
          text: "",
        },
      ],
    });
  }, [hoverTime, candleSeries]);




  useEffect(() => {
    if (!candleSeries || hoverTime == null) return;

    // Adaugă marker programatic
    candleSeries.applyOptions({
      markers: [
        {
          time: hoverTime,       // timpul pe care vrei să-l marchezi
          position: 'aboveBar',  // 'aboveBar', 'belowBar', 'inBar'
          color: 'red',
          shape: 'arrowUp',      // forme disponibile: 'arrowUp', 'arrowDown', 'circle', 'square', 'flag'
          text: '',
        }
      ]
    });
  }, [candleSeries, hoverTime]);

  // Initializare chart
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


    // handler pentru crosshair
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

  // Setare candleData
  useEffect(() => {
    if (chart && candleSeries && candleData?.length) {
      candleSeries.setData(candleData);

      // trimite chart-ul la parent doar când are date
      if (onChartReady) onChartReady(chart);
    }
  }, [chart, candleSeries, candleData]);

  // Funcție generică de adăugat serie
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
        O: { data: candleData.map(c => ({ time: c.time, value: c.open })), color: "blue" },
        H: { data: candleData.map(c => ({ time: c.time, value: c.high })), color: "green" },
        L: { data: candleData.map(c => ({ time: c.time, value: c.low })), color: "red" },
        C: { data: candleData.map(c => ({ time: c.time, value: c.close })), color: "black" },
        V: { data: candleData.map(c => ({ time: c.time, value: c.volume })), color: "orange" },
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
            data: res,        // array-ul cu valori
            color: s.color      // orice parametru suplimentar
          }
        }));
      }
    });
  }, [seriesList, candleData]);

  // Toggle show/hide serie
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

  // Update seriile când candleData se schimbă
  useEffect(() => {
    seriesList.forEach((s) => {
      if (s.show && s.seriesInstance && s.calculateFn) {
        s.seriesInstance.setData(s.calculateFn(candleData));
      }
    });
  }, [candleData, seriesList]);

  // Adăugăm indicatorii la mount
  useEffect(() => {
    if (!chart) return;

    if (SERIES instanceof Array) {
      SERIES.forEach(i => {
        addSeries({ ...i })
      })
    }

  }, [chart]);




  return (
    <div className="chart-container" style={{ }}>
      {/* Checkbox-uri */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
        {seriesList.map((s) => (
          <label key={s.id} style={{ color: s.color }} className="flex items-center gap-2">
            <input type="checkbox" checked={s.show} onChange={() => toggleSeries(s.id)} />
            {s.label}
          </label>
        ))}
      </div>



      <div ref={containerRef} style={{   position: "relative" ,width: "100%", height: "400px" }} >
        <VerticalLineOverlay chart={chart} hoverTime={hoverTime} candleData={candleData} />
      </div>

    </div>
  );
}
