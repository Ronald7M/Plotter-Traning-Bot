export function combine(v1, v2, op) {
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

  return result;
}

/**
 * Detects cross-up or cross-down points between two series.
 *
 * @param {Array<{time:number,value:number}>} vec1 - first data series
 * @param {Array<{time:number,value:number}>} vec2 - second data series
 * @param {"up"|"down"} type - type of cross: "up" or "down"
 * @param {number} replace - value to assign at cross points
 * @returns {Array<{time:number,value:number}>} - points where crosses occur
 */
export function findCrosses(vec1, vec2, type = "up", replace = 1) {
  if(!Array.isArray(vec2)){
    const constantValue = vec2;
     vec2 = vec1.map(p => ({ time:p.time, value: constantValue }));
  }
  const crosses = [];
  const map2 = new Map(vec2.map((p) => [p.time, p.value]));

  for (let i = 1; i < vec1.length; i++) {
    const tPrev = vec1[i - 1].time;
    const tCurr = vec1[i].time;

    if (!map2.has(tPrev) || !map2.has(tCurr)) continue;

    const v1Prev = vec1[i - 1].value;
    const v1Curr = vec1[i].value;
    const v2Prev = map2.get(tPrev);
    const v2Curr = map2.get(tCurr);

    if (type === "up" && v1Prev <= v2Prev && v1Curr > v2Curr) {
      crosses.push({ time: tCurr, value: replace ,index:i});
    }

    if (type === "down" && v1Prev >= v2Prev && v1Curr < v2Curr) {
      crosses.push({ time: tCurr, value: replace,index:i });
    }
  }

  return crosses;
}



/**
 * Combines two arrays of points and sorts them by time.
 * If time duplicates exist, the value from arr2 overwrites arr1.
 *
 * @param {Array<{time:number,value:number}>} arr1
 * @param {Array<{time:number,value:number}>} arr2
 * @returns {Array<{time:number,value:number}>} - merged and sorted array
 */
export function sortAndMerge(arr1, arr2) {
  const map = new Map();

  arr1.forEach((p) => map.set(p.time, p.value));
  arr2.forEach((p) => map.set(p.time, p.value));

  return Array.from(map.entries())
    .map(([time, value]) => ({ time, value }))
    .sort((a, b) => a.time - b.time);
}

/**
 * Fills missing points in target array based on source times.
 * - Missing points take defaultValue if provided.
 * - Otherwise, missing points take last known value from target.
 * - Always returns numeric values.
 *
 * @param {Array<{time: number, value: number}>} source
 * @param {Array<{time: number, value: number}>} target
 * @param {number} [defaultValue] - Optional default value for missing points
 * @returns {Array<{time: number, value: number}>}
 */
/**
 * Fills missing points in target array based on source times.
 * - Missing points take defaultValue if it is not null/undefined.
 * - Otherwise, missing points take last known value from target.
 * - Always returns numeric values.
 *
 * @param {Array<{time: number, value: number}>} source
 * @param {Array<{time: number, value: number}>} target
 * @param {number|null} [defaultValue] - Optional default value for missing points
 * @returns {Array<{time: number, value: number}>}
 */
export function fillMissingPoints(source, target, defaultValue = null) {
  const targetMap = new Map(target.map((p) => [p.time, p.value]));
  const filled = [];
  let lastValue = undefined;

  source.forEach((p) => {
    if (targetMap.has(p.time)) {
      lastValue = targetMap.get(p.time);
      filled.push({ time: p.time, value: lastValue });
    } else {
      const valueToUse = defaultValue !== null && defaultValue !== undefined 
                         ? defaultValue 
                         : lastValue !== undefined 
                           ? lastValue 
                           : 0;
      filled.push({ time: p.time, value: valueToUse });
      lastValue = valueToUse;
    }
  });

  return filled;

}


/**
 * Returnează intervale consecutive cu puncte care respectă condiția,
 * adăugând un offset la stânga
 * @param {Array} vec - array de obiecte {time, value}
 * @param {Function} condition - funcție care primește value și returnează true/false
 * @param {number} offset - câte puncte să adaugi la stânga fiecărui interval
 * @returns {Array} - array de intervale, fiecare interval fiind un array de puncte
 */
export function findIntervals(vec,offset = 0 ,condition, ) {
  const intervals = [];
  let currentInterval = [];
  let startIndex = null;

  for (let i = 0; i < vec.length; i++) {
    const point = vec[i];
    if (condition(point.value)) {
      if (currentInterval.length === 0) {
        startIndex = i; // salvăm indexul de început al intervalului
      }
      currentInterval.push(point);
    } else {
      if (currentInterval.length > 0) {
        // adăugăm offset la stânga
        const from = Math.max(0, startIndex - offset);
        const intervalWithOffset = vec.slice(from, i); 
        intervals.push(intervalWithOffset);
        currentInterval = [];
        startIndex = null;
      }
    }
  }

  // adaugă ultimul interval dacă e deschis
  if (currentInterval.length > 0) {
    const from = Math.max(0, startIndex - offset);
    const intervalWithOffset = vec.slice(from);
    intervals.push(intervalWithOffset);
  }

  return intervals;
}

/**
 * Map values from array2 based on times in array1
 * @param {Array} arr1 - array cu {time,...}
 * @param {Array} arr2 - array cu {time,value,...}
 * @param {any} defaultValue - valoarea returnata daca nu gaseste time in arr2
 * @returns Array de obiecte {time, value}
 */
export function moveValue(arr1, arr2, defaultValue = null) {
  // creeaza Map pentru acces rapid
  const map2 = new Map(arr2.map(p => [p.time, p.value]));

  return arr1.map(p => ({
    time: p.time,
    value: map2.has(p.time) ? map2.get(p.time) : defaultValue
  }));
}





export function findIndex(arr, targetTime) {
  if (!Array.isArray(arr) || arr.length === 0) return -1;

  return arr.findIndex(point => point.time === targetTime);
}


/**
 * Aplica o functie pe fiecare sub-array, cu acces si la sub-array-ul precedent
 * @param {Array<Array<{time:number,value:number}>>} arrOfArr - array de arrays
 * @param {Function} fn - functia ce se aplica pe fiecare sub-array
 *                       (subArr, index, prevSubArr, all) => any
 * @returns {Array} rezultatul functiei pentru fiecare sub-array
 */
export function mapIntervals(arrOfArr, fn) {
  if (!Array.isArray(arrOfArr)) return [];
  return arrOfArr.map((subArr, i) => {
    const prev = i > 0 ? arrOfArr[i - 1] : null;
    return fn(subArr, i, prev, arrOfArr);
  });
}