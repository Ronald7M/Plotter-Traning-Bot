import { RSI,EMA,SMA } from "technicalindicators";


export function calculateRSI(data, period = 14) {
  const closes = data.map(c => c.close);

  const rsiValues = RSI.calculate({ values: closes, period });

  // RSI va avea mai puține valori decât closes (primele 'period' sunt pierdute)
  return rsiValues.map((val, i) => ({
    time: data[i + period - 1].time, // deplasat cu offset
    value: val,
  }));
}



export function calculateSMA(data, period = 200) {
  const closes = data.map(c => c.close);
  const smaValues = SMA.calculate({ values: closes, period });

  return smaValues.map((val, i) => ({
    time: data[i + period - 1].time,
    value: val,
  }));
}