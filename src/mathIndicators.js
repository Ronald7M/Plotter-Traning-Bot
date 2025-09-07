import { RSI,EMA,MACD,SMA } from "technicalindicators";


export function combineVectors(v1, v2, op) {
  let i = 0, j = 0;
  let result = [];

  while (i < v1.length && j < v2.length) {
    if (v1[i].time === v2[j].time) {
      result.push({
        time: v1[i].time,
        value: op(v1[i].value, v2[j].value)
      });
      i++;
      j++;
    } else if (v1[i].time < v2[j].time) {
      i++;
    } else {
      j++;
    }
  }

  return result;
}

export function calculateEMA(data, period = 9) {
  if (!data || data.length < period) return [];

  const values = data.map(d => d.value);

  const emaValues = EMA.calculate({ values, period });

  const result=emaValues.map((val, i) => ({
    time: data[i + period - 1].time, 
    value: val,
  }));
  return  result;
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

  // Calculul primelor avgGain și avgLoss (media simplă pe prima perioadă)
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  const rsi = [];

  for (let i = period; i < gains.length; i++) {
    // Wilder smoothing
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiVal = 100 - 100 / (1 + rs);

    rsi.push({
      time: data[i + 1].time, // +1 pentru că deltas începe de la index 1
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

  const result=macdValues.map((val, i) => ({
    time: data[i + slowPeriod - 1].time, 
    value: val.histogram,
  }));

  return result;
}

export function calculateVMC(data){
  

}

export function calculateWaveTrend(src,type) {

  
  const esa=calculateEMA(src,9)
 const de=calculateEMA(combineVectors(src,esa,(a,b)=>Math.abs(a-b)))
 const ciI=combineVectors(src,esa,(a,b)=>a-b);
 const ci=combineVectors(ciI,de,(a,b)=>a/(0.015*b));

 const wt1=calculateEMA(ci,12)
 const wt2=calculateSMA(wt1,3)
 const wtVwap=combineVectors(wt1,wt2,(a,b)=>a-b)

 if(type==="wt1"){
  return wt1
 }
  if(type==="wt2"){
  return wt2
 }

  return wtVwap;
}





