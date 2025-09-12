import * as vec from "./vectors"
import { calculateEMA, calculateSMMA, calculateMACD, calculateWaveTrend, calculateRSI, calculateRSIwithSMA } from "./mathIndicators";
import * as mi from "./mathIndicators"


export function step1(candels, indicators) {
    if (candels === null) {
        return []
    }


    const src = candels.map((c) => ({ time: c.time, value: c.close }))
    const srcH = candels.map((c) => ({ time: c.time, value: c.high }))
    const crossesUp = vec.findCrosses(indicators.EMA9, indicators.SMMA200, "up", 1);
    const crossesDown = vec.findCrosses(indicators.EMA9, indicators.SMMA200, "down", 0);
    const crosses = vec.sortAndMerge(crossesUp, crossesDown)
    const completeCrosses = vec.fillMissingPoints(src, crosses)

    const intervalCrosses = vec.findIntervals(completeCrosses, 0, v => v === 1);
    const value = mi.calculateHH(srcH, intervalCrosses)

    return { logic: completeCrosses, value }

}


export function step2(candels, s1l, indicators, p1 = 69.94) {
    if (candels === null) {
        return []
    }


    const s1intervals = vec.findIntervals(s1l, 0, (v) => v === 1)
    const result =vec.mapIntervals(s1intervals,int=>{
        var decision=0;
        const res=int.map(i=>{
            var index=vec.findIndex(indicators.SMA11,i.time)
            if(indicators.SMA11[index].value>p1){
                decision=1;
            }
            return {...i,value:decision}
        })
        return res
    })
     

    return vec.fillMissingPoints(candels, result.flat(), 0)

}



export function strategy(candles, indicators) {
    const s1 = step1(candles, indicators)
    const s2 = step2(candles, s1.logic, indicators, 69.94)
    const currentStep = vec.combine(s1.logic, s2, (a, b) => {
        return a !== 0 && b !== 0 ? 1 : 0;
    });


    return {
        s1: s1.logic,
        s1_value: s1.value,
        s2,
        s:currentStep
    }

}