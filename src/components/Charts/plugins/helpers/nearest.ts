import { LineData, Time } from "lightweight-charts";

export function findNearestTime(time: Time, data: LineData[]) {
  const value = Number(time);
  let left = 0;
  let right = data.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (Number(data[mid].time) === value) {
      return Number(data[mid].time);
    } else if (Number(data[mid].time) < value) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  if (right < 0) {
    return data[left].time;
  } else if (left >= data.length) {
    return data[right].time;
  } else {
    const leftDiff = value - Number(data[right].time);
    const rightDiff = Number(data[left].time) - value;
    return leftDiff < rightDiff ? data[right].time : data[left].time;
  }
}
