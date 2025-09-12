import { RSI, EMA, MACD, SMA } from "technicalindicators";
import * as vec from "./vectors"

export function calculateAll(candles, strategy) {
  if (!candles || candles.length === 0) return {};

  const closeSeries = candles.map((c) => ({ time: c.time, value: c.close }));
  const openSeries = candles.map((c) => ({ time: c.time, value: c.open }));
  const lowSeries = candles.map((c) => ({ time: c.time, value: c.low }));
  const hlc3Series = candles.map((c) => ({
    time: c.time,
    value: (c.high + c.low + c.close) / 3,
  }));


  const WT2 = calculateWaveTrend(hlc3Series, "wt2");
  const WT2_S0_LC = calculateWTS0CloseOpen(closeSeries, openSeries, WT2);
  const WT2_S0_LL = calculateWTS0(lowSeries, WT2);
  var indicators = {
    EMA9: calculateEMA(closeSeries, 9),
    SMMA200: calculateSMMA(closeSeries, 180),
    RSI14: calculateRSI(closeSeries, 14),
    MACD: calculateMACD(closeSeries, 5, 8, 7),
    WT1: calculateWaveTrend(hlc3Series, "wt1"),
    WT2: WT2,
    WTVwap: calculateWaveTrend(hlc3Series, "wtVwap"),
    SMA11: calculateRSIwithSMA(closeSeries, "sma"),
    SMA100: calculateRSIwithSMA(closeSeries, "sma", 100),
    WT2_S0_LC,
    PREV_WT2_S0_LC: calculateWTS0Prev(WT2_S0_LC),
    WT2_S0_LL,
    PREV_WT2_S0_LL: calculateWTS0Prev(WT2_S0_LL),

    WT2_S0_C1: calculateWTS0(openSeries, WT2),
    debug: calculateDebug(closeSeries, WT2)
  }

  const strategyResult = strategy ? strategy.strategy(candles, indicators,) : null;

  indicators = {
    ...indicators,

  }



  return {
    ...indicators,
    ...strategyResult,

  };
}




export function calculateEMA(data, period = 9) {
  if (!data || data.length < period) return [];

  const values = data.map(d => d.value);

  const emaValues = EMA.calculate({ values, period });

  const result = emaValues.map((val, i) => ({
    time: data[i + period - 1].time,
    value: val,
  }));
  return result;
}

export function calculateRSI(data, period = 14) {
  if (!data || data.length < period + 1) return [];

  const values = data.map(d => d.value);

  const deltas = [];
  for (let i = 1; i < values.length; i++) {
    deltas.push(values[i] - values[i - 1]);
  }

  const gains = deltas.map(d => (d > 0 ? d : 0));
  const losses = deltas.map(d => (d < 0 ? -d : 0));


  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsi = [];

  for (let i = period; i < gains.length; i++) {

    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiVal = 100 - 100 / (1 + rs);

    rsi.push({
      time: data[i + 1].time,
      value: rsiVal,
    });
  }

  return rsi;
}

export function calculateSMA(data, period = 9) {
  if (!data || data.length < period) return [];

  const values = data.map(d => d.value);

  const smaValues = [];


  for (let i = 0; i <= values.length - period; i++) {
    const window = values.slice(i, i + period);
    const sum = window.reduce((acc, v) => acc + v, 0);
    const avg = sum / period;
    smaValues.push(avg);
  }


  const result = smaValues.map((val, i) => ({
    time: data[i + period - 1].time,
    value: val,
  }));

  return result;
}






export function calculateSMMA(data, period = 200) {
  const closes = data.map(d => d.value);
  const smmaValues = [];
  let prevSmma = null;

  closes.forEach((close, i) => {
    if (i < period - 1) {
      smmaValues.push(null);
    } else if (i === period - 1) {
      const sum = closes.slice(0, period).reduce((a, b) => a + b, 0);
      prevSmma = sum / period;
      smmaValues.push(prevSmma);
    } else {
      prevSmma = (prevSmma * (period - 1) + close) / period;
      smmaValues.push(prevSmma);
    }
  });

  return smmaValues
    .map((val, i) =>
      val
        ? {
          time: data[i].time,
          value: val,
        }
        : null
    )
    .filter(Boolean);
}



export function calculateMACD(data, fastPeriod = 5, slowPeriod = 8, signalPeriod = 7) {
  if (!data || data.length < slowPeriod) return [];

  const closes = data.map(c => parseFloat(c.value));


  const macdValues = MACD.calculate({
    values: closes,
    fastPeriod,
    slowPeriod,
    signalPeriod,
    SimpleMAOscillator: false,
    SimpleMASignal: false,
  });

  const result = macdValues.map((val, i) => ({
    time: data[i + slowPeriod - 1].time,
    value: val.histogram,
  }));

  return result;
}

export function calculateVMC(data) {


}

export function calculateWaveTrend(src, type) {


  const esa = calculateEMA(src, 9)
  const de = calculateEMA(vec.combine(src, esa, (a, b) => Math.abs(a - b)))
  const ciI = vec.combine(src, esa, (a, b) => a - b);
  const ci = vec.combine(ciI, de, (a, b) => a / (0.015 * b));

  const wt1 = calculateEMA(ci, 12)
  const wt2 = calculateSMA(wt1, 3)
  const wtVwap = vec.combine(wt1, wt2, (a, b) => a - b)

  if (type === "wt1") {
    return wt1
  }
  if (type === "wt2") {
    return wt2
  }

  return wtVwap;
}



// Funcția principală
export function calculateRSIwithSMA(data, type, rsiLength = 9, maLength = 11) {
  if (!data || data.length <= rsiLength) return [];

  const values = data.map(d => d.value);

  // calculează schimbările
  const changes = values.map((v, i) => (i === 0 ? 0 : v - values[i - 1]));

  // gains și losses
  const gains = changes.map(ch => (ch > 0 ? ch : 0));
  const losses = changes.map(ch => (ch < 0 ? -ch : 0));

  // RMA pe gains și losses
  const avgGains = rma(gains, rsiLength);
  const avgLosses = rma(losses, rsiLength);

  // RSI clasic
  const rsi = avgGains.map((gain, i) => {
    const loss = avgLosses[i];
    if (i < rsiLength - 1) return null; // prea devreme
    if (loss === 0) return 100;
    if (gain === 0) return 0;
    return 100 - 100 / (1 + gain / loss);
  });

  // SMA peste RSI
  const rsiSma = sma(rsi.map(v => (v === null ? 0 : v)), maLength);

  // output {time, value}
  const output = data.map((d, i) => ({
    time: d.time,
    value: type === "rsi" ? rsi[i] : rsiSma[i]
  }));
  const cleaned = output.filter(a => a.value !== null);
  return cleaned;
}


function rma(values, length) {
  const result = [];
  let sum = 0;

  // calcul medie inițială simplă
  for (let i = 0; i < length; i++) {
    sum += values[i];
  }
  let prevRma = sum / length;
  result[length - 1] = prevRma;

  // aplica formula Wilder: rma = (prevRma * (len - 1) + value) / len
  for (let i = length; i < values.length; i++) {
    const rmaVal = (prevRma * (length - 1) + values[i]) / length;
    result[i] = rmaVal;
    prevRma = rmaVal;
  }

  return result;
}

// SMA clasic
function sma(values, length) {
  const result = [];
  for (let i = 0; i < values.length; i++) {
    if (i < length - 1) {
      result.push(null); // insuficiente valori
      continue;
    }
    const slice = values.slice(i - length + 1, i + 1);
    const avg = slice.reduce((a, b) => a + b, 0) / length;
    result.push(avg);
  }
  return result;
}


/////---

function calculateWTS0(src, wt2) {
  const offset = 5

  function getMin(arr, offset) {
    var minCurrent = arr[0].value;
    const result = [];
    for (let i = 0; i < arr.length; i++) {
      minCurrent = Math.min(minCurrent, arr[i].value);
      result.push({ ...arr[i], value: minCurrent });
    }

    return result.slice(offset);
  }
  var intervalsSRC = vec.findIntervals(wt2, offset, (v) => v < 0)
  intervalsSRC = intervalsSRC.map(i => {
    const res = vec.moveValue(i, src)
    return res
  })

  const intervalMin = intervalsSRC.map(i => getMin(i, offset)).flat()
  return vec.fillMissingPoints(src, intervalMin, 0)


}
function calculateWTS0CloseOpen(srcClose, srcOpen, wt2) {
  const s0close = calculateWTS0(srcClose, wt2)
  const s0open = calculateWTS0(srcOpen, wt2)

  const result = vec.combine(s0close, s0open, (a, b) => Math.min(a, b))
  return result

}


export function calculateHH(src, intervals) {
  const mapIntervals = vec.mapIntervals(intervals, (int) => {
    var max = 0;
    const result = int.map(i => {
      var index = vec.findIndex(src,i.time)
      if (src[index].value > max) {
        max = src[index].value
      }



      return { ...i, value: max }
    })
    return result
  })

  const res = vec.fillMissingPoints(src, mapIntervals.flat(), 0)
  return res

}


function calculateWTS0Prev(wt2S0) {
  const crosses = vec.findCrosses(wt2S0, 1, "down", 1);
  const result = [];

  for (let i = 0; i < crosses.length; i++) {
    const idx = crosses[i].index - 1;
    if (idx >= 0) {
      result.push({
        time: crosses[i].time,
        value: wt2S0[idx].value
      });
    }
  }


  return vec.fillMissingPoints(wt2S0, result);
}

export function calculateDebug(src, wt2) {
  const wt2DownCrosses = vec.findCrosses(wt2, 0, "up", -1)
  const wt2UPCrosses = vec.findCrosses(wt2, 0, "down", 1)
  const wt2joinCroses = vec.sortAndMerge(wt2DownCrosses, wt2UPCrosses)




  return vec.fillMissingPoints(src, wt2joinCroses)

}










