import React, { useState, useRef, useEffect } from "react";
import MyChart from "./MyChart";
import axios from "axios";
import { calculateEMA, calculateSMMA, calculateMACD, calculateWaveTrend, calculateRSI } from "./mathIndicators";
import { VerticalLineOnCursor } from "./VerticalLineOnCursor";

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

  const series1 = [
    {
      id: "EMA9",
      label: "EMA9",
      color: "blue",
      calculateFn: (data) => calculateEMA(data.map((c) => ({ time: c.time, value: c.close })), 9),

    },
    {
      id: "SMMA200",
      label: "SMMA200",
      color: "red",
      calculateFn: (data) => calculateSMMA(data.map((c) => ({ time: c.time, value: c.close })), 200),

    },
    {
      id: "MACD",
      label: "MACD",
      color: "green",
      priceScaleId: "left",
      calculateFn: (data) => calculateMACD(data.map((c) => ({ time: c.time, value: c.close }))),

    },
  ];

  const series2 = [
    {
      id: "WT1",
      label: "WT1",
      color: "#4B0082",
      priceScaleId: "right",
      calculateFn: (data) =>
        calculateWaveTrend(data.map((c) => ({ time: c.time, value: (c.high + c.low + c.close) / 3 })), "wt1"),
    },


    {
      id: "WT2",
      label: "WT2",
      color: "#2bff009f",
      priceScaleId: "right",
      calculateFn: (data) =>
        calculateWaveTrend(data.map((c) => ({ time: c.time, value: (c.high + c.low + c.close) / 3 })), "wt2"),
    },
    {
      id: "wtVwap",
      label: "wtVwap",
      color: "#820000ff",
      priceScaleId: "right",
      calculateFn: (data) =>
        calculateWaveTrend(data.map((c) => ({ time: c.time, value: (c.high + c.low + c.close) / 3 })), "wtVwap"),
    }
  ];

  const series3 = [
    {
      id: "RSI14",
      label: "RSI14",
      color: "#df1212ff",
      priceScaleId: "left",
      calculateFn: (data) => calculateRSI(data.map((c) => ({ time: c.time, value: c.close })), 14),
    },

  ];




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


  useEffect(() => {
    if (!indicators || !hover) return;


    const display = Object.entries(indicators).map(([name, indicator]) => {

      if (!indicator?.data?.length) return null;

      const point = indicator.data.find(p => p.time === hover);
      return point
        ? { name, value: point.value, color: indicator.color }
        : { name, value: null, color: indicator.color };
    }).filter(Boolean);
    setRanderIndicators(display)
  }, [indicators, hover]);


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




  function renderIndicators(indicatorsArray) {
    if (!indicatorsArray || !indicatorsArray.length) return null;

    return (
      <div
        style={{
          position: "fixed",
          top: "8px",
          right: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          padding: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          borderRadius: "6px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
          zIndex: 1000
        }}
      >
        {indicatorsArray.map((ind) => (
          <div
            key={ind.name}
            style={{
              color: ind.color,
              fontWeight: "bold",
              fontSize: "14px",
              backgroundColor: "#f5f5f5",
              padding: "2px 6px",
              borderRadius: "4px",
              display: "inline-block",
              minWidth: "80px"
            }}
          >
            {ind.name}: {ind.value !== null ? ind.value?.toFixed(2) : "--"}
          </div>
        ))}
        <label>Time:{convertiTime(hover)}</label>
        <label>Time:**{hover}**</label>
      </div>
    );
  }

  function convertiTime(number) {
    return new Date(number * 1000).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

  }

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

        <select value={interval} onChange={(e) => setInterval(e.target.value)} className="border p-2 rounded">
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <MyChart
          hoverTime={hover}
          setIndicators={setIndicators}
          candleData={candles}
          candels={true}
          onChartReady={handleChartReady}
          SERIES={series1}
          onHoverTime={(time) => setHover(time)}
        />
        <MyChart
          hoverTime={hover}
          setIndicators={setIndicators}
          candleData={candles}
          candels={false}
          onChartReady={handleChartReady}
          SERIES={series2}
          onHoverTime={(time) => setHover(time)}
        />
        <MyChart
          hoverTime={hover}
          setIndicators={setIndicators}
          candleData={candles}
          candels={false}
          onChartReady={handleChartReady}
          SERIES={series3}
          onHoverTime={(time) => setHover(time)}
        />
      </div>
      {/* <VerticalLineOnCursor color="blue" width={1} /> */}
    </div>
  );
}

export default App;
