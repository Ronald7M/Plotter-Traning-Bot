import React, { useState, useEffect, useMemo } from "react";
import MyChart from "./MyChart";
import axios from "axios";
import { calculateAll } from "./utils/mathIndicators";
import * as str1 from "./utils/mainStrategy.js";

const BYBIT_API = "https://api.bybit.com/v5/market/kline";

export async function fetchCandles(symbol, interval, limit = 1000) {
  if (limit > 1000) limit = 1000;
  const res = await axios.get(BYBIT_API, {
    params: { category: "spot", symbol, interval, limit },
  });
  const rawData = res.data.result?.list || [];
  return rawData.reverse();
}

function App() {
  const [candles, setCandles] = useState([]);
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("240");
  const [limit, setLimit] = useState(1000);
  const [hover, setHover] = useState(1000);
  const [indicators, setIndicators] = useState({});
  const [randerIndicators, setRanderIndicators] = useState({});

  // --- Fetch candles ---
  const loadCandles = async () => {
    try {
      const rawData = await fetchCandles(symbol, interval, limit);
      const formatted = rawData.map((item) => ({
        time: Math.floor(item[0] / 1000),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        turnover: parseFloat(item[6]),
      }));
      setCandles(formatted);
    } catch (err) {
      console.error("Eroare la fetch:", err);
      setCandles([]);
    }
  };

  useEffect(() => {
    loadCandles();
  }, []);

 function dbWraprt(fn) {
  // start time
  const start = typeof performance !== 'undefined' ? performance.now() : Date.now();

  // memory before (Node only)
  const memBefore = typeof process !== 'undefined' && process.memoryUsage
    ? process.memoryUsage().heapUsed
    : undefined;

  // apelăm funcția
  const result = fn();

  // end time
  const end = typeof performance !== 'undefined' ? performance.now() : Date.now();

  // memory after (Node only)
  const memAfter = typeof process !== 'undefined' && process.memoryUsage
    ? process.memoryUsage().heapUsed
    : undefined;

  // logs
  console.log(`⏱️ Duration: ${(end - start).toFixed(3)} ms`);
  if (memBefore !== undefined && memAfter !== undefined) {
    console.log(`💾 Memory change: ${((memAfter - memBefore) / 1024).toFixed(2)} KB` );
    console.log("")
  }

  return result;
}

  // --- Calculează indicatorii folosind calculateAll ---
  const { series } = useMemo(() => {
    const allIndicators = dbWraprt(()=>calculateAll(candles, str1));
    const wt00 = allIndicators?.WT2?.map(c => ({ time: c.time, value: 0 }));
    const series = [

      [
        { id: "EMA9", label: "EMA9", color: "blue", data: allIndicators.EMA9 },
        { id: "SMMA200", label: "SMMA200", color: "red", data: allIndicators.SMMA200 },
        { id: "MACD-histo", label: "MACD-histo", color: "green", priceScaleId: "left", data: allIndicators.MACD ,show:false},
        { id: " WT2_S0_LC", label: " WT2_S0_LC", color: "#0199adff", priceScaleId: "right", data: allIndicators.WT2_S0_LC, show: false },
        { id: " PREV_WT2_S0_LC", label: " PREV_WT2_S0_LC", color: "#0011ffff", priceScaleId: "right", data: allIndicators.PREV_WT2_S0_LC, show: false },

        { id: " WT2_S0_LL", label: " WT2_S0_LL", color: "#af0092ff", priceScaleId: "right", data: allIndicators.WT2_S0_LL, show: false },
        { id: " PREV_WT2_S0_LL", label: " PREV_WT2_S0_LL", color: "#0011ffff", priceScaleId: "right", data: allIndicators.PREV_WT2_S0_LL, show: false },
        { id: "step1_value", label: "step1_value", color: "#3700ffff", priceScaleId: "right", data: allIndicators.s1_value,show:false },


      ],

      [
        { id: "step1", label: "step1", color: "#000000ff", priceScaleId: "left", data: allIndicators.s1 },
        { id: "step2", label: "step2", color: "#f50606ff", priceScaleId: "left", data: allIndicators.s2 },
        { id: "stepfinal", label: "stepFinal", color: "#3501f1ff", priceScaleId: "left", data: allIndicators.s },

        { id: "debug", label: "debug", color: "#5ab902ff", priceScaleId: "right", data: allIndicators.debug ,show:false},
      ],
      [
        { id: "WT1", label: "WT1", color: "#4B0082", priceScaleId: "right", data: allIndicators.WT1 },
        { id: "WT2", label: "WT2", color: "#0d0e0d9f", priceScaleId: "right", data: allIndicators.WT2 },
        { id: "WT20", label: "WT20", color: "#0d0e0d9f", priceScaleId: "right", data: wt00 },
        { id: "Vwap", label: "Vwap", color: "#820000ff", priceScaleId: "right", data: allIndicators.WTVwap },
        { id: "SMA11", label: "SMA11", color: "#2600ffff", priceScaleId: "left", data: allIndicators.SMA11 },
        { id: "SMA100", label: "SMA100", color: "#e914bbff", priceScaleId: "left", data: allIndicators.SMA100 },
      ],
    ];

    return { series };
  }, [candles, str1]);

  //--- Indicatori afișați pe hover ---
  useEffect(() => {
    if (!indicators || !hover) return;

    const display = Object.entries(indicators)
      .map(([name, indicator]) => {
        if (!indicator?.data?.length) return null;
        const point = indicator.data.find((p) => p.time === hover);
        return point
          ? { name, value: point.value, color: indicator.color }
          : { name, value: null, color: indicator.color };
      })
      .filter(Boolean);

    setRanderIndicators(display);
  }, [indicators, hover]);

  // --- Chart syncing ---
  const chartRefs = { current: [] };
  const syncingFlags = new WeakMap();

  const handleChartReady = (chart) => {
    chartRefs.current.push(chart);
    syncingFlags.set(chart, false);

    chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
      if (!range) return;
      if (syncingFlags.get(chart)) return;

      try {
        chartRefs.current.forEach((c) => syncingFlags.set(c, true));
        chartRefs.current.forEach((c) => {
          if (c !== chart) {
            c.timeScale().setVisibleRange(range);
          }
        });
      } finally {
        chartRefs.current.forEach((c) => syncingFlags.set(c, false));
      }
    });
  };

  const renderIndicators = (indicatorsArray) => {
    if (!indicatorsArray || !indicatorsArray.length) return null;
    return (
      <div style={{
        position: "fixed",
        top: "8px",
        right: "8px",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        padding: "8px",
        backgroundColor: "rgba(255,255,255,0.8)",
        borderRadius: "6px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}>
        {indicatorsArray.map((ind) => (
          <div key={ind.name} style={{
            color: ind.color,
            fontWeight: "bold",
            fontSize: "14px",
            backgroundColor: "#f5f5f5",
            padding: "2px 6px",
            borderRadius: "4px",
            display: "inline-block",
            minWidth: "80px",
          }}>
            {ind.name}: {ind.value !== null ? ind.value?.toFixed(2) : "--"}
          </div>
        ))}
        <label>Time: {new Date(hover * 1000).toLocaleString()}</label>
         <label>Time: {hover}</label>
      </div>
    );
  };

  return (
    <div className="p-4">
      {renderIndicators(randerIndicators)}
      <h1 className="text-xl font-bold mb-4">Chart sincronizat</h1>

      {/* Interfață setare simbol, interval și limit */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          placeholder="Symbol (ex: BTCUSDT)"
          className="border p-2 rounded"
        />

        <select
          value={interval}
          onChange={(e) => setInterval(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="1">1m</option>
          <option value="5">5m</option>
          <option value="15">15m</option>
          <option value="60">1h</option>
          <option value="240">4h</option>
          <option value="D">1d</option>
          <option value="W">1w</option>
        </select>

        <input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="border p-2 rounded"
          min={1}
          max={1000}
        />

        <button onClick={loadCandles} className="bg-blue-500 text-white px-4 py-2 rounded">
          Fetch
        </button>
      </div>

      {/* Chart-uri sincronizate */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "flex-start",
      }}>
        <MyChart
          hoverTime={hover}
          setIndicators={setIndicators}
          candleData={candles}
          candels={true}
          onChartReady={handleChartReady}
          SERIES={series[0]}
          onHoverTime={setHover}
        />
        <MyChart
          hoverTime={hover}
          setIndicators={setIndicators}
          candleData={candles}
          candels={false}
          onChartReady={handleChartReady}
          SERIES={series[1]}
          onHoverTime={setHover}
        />
        <MyChart
          hoverTime={hover}
          setIndicators={setIndicators}
          candleData={candles}
          candels={false}
          onChartReady={handleChartReady}
          SERIES={series[2]}
          onHoverTime={setHover}
        />
      </div>

      <MyChart
        hoverTime={hover}
        setIndicators={setIndicators}
        candleData={candles}
        candels={false}
        onChartReady={handleChartReady}
        SERIES={series[3]}
        onHoverTime={setHover}
      />
    </div>
  );
}

export default App;
