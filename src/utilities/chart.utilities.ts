import { IChartApi, ISeriesApi, LineData, MouseEventParams, Time } from "lightweight-charts";
import { Event, Serie } from "../interfaces";
import { Box } from "../components/Charts/plugins/box";
import { SIGNALS } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function showRespiratoryEvents(chart: IChartApi | null, serie: ISeriesApi<"Line">, data: LineData[], events: Event[], vertOffset = 0, height?: number) {
  if (!events || !chart || !serie) return;

  events.forEach((event) => {
    if (chart && [0, 2, 103].includes(event.eventType)) {
      let color = "hsla(207, 73.00%, 39.20%, 0.2)";
      if (event.eventType === 2) color = "hsla(53, 85%, 52%, 0.1)";
      else if (event.eventType === 103) color = "hsla(286, 45%, 36%, 0.2)";
      const from = event.startTime * 1000;
      const to = event.endTime * 1000;
      const box = new Box(chart, serie, data, from as Time, to as Time, vertOffset, height, {
        showLabel: false,
        color: color,
        width: 40,
      });
      serie.attachPrimitive(box);
    }
  });
}

export function showStateEvents(chart: IChartApi | null, serie: ISeriesApi<"Line">, data: LineData[], events: Event[], vertOffset = 0, height?: number) {
  if (!events || !chart || !serie) return;
  events.forEach((event) => {
    let offset = vertOffset;
    let color = "rgb(16, 22, 202)";
    if (event.eventType === 1) {
      color = "hsla(97, 85%, 52%, 1)";
      offset = vertOffset + (height ?? 0);
    } else if (event.eventType === 103) color = "hsla(286, 45%, 36%, 0.2)";
    const from = event.startTime * 1000;
    const to = event.endTime * 1000;
    const box = new Box(chart, serie, data, from as Time, to as Time, offset, height, {
      showLabel: false,
      color: color,
      width: 40,
    });
    serie.attachPrimitive(box);
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function syncronizeCrosshairs(chart1Ref: any, chart2Ref: any) {
  const chart1: IChartApi = chart1Ref?.getChart();
  const chart2: IChartApi = chart2Ref?.getChart();

  chart1.subscribeCrosshairMove((param) => {
    const series1 = chart1Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === SIGNALS.OXIMETRY);
    const series2 = chart2Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === SIGNALS.AIR_FLOW);
    if (!series1 || !series2) return;
    const mainSeries1 = series1.serie;
    const mainSeries2 = series2.serie;
    const dataPoint = getCrosshairDataPoint(mainSeries1, param);
    syncCrosshair(chart2, mainSeries2, dataPoint);
  });
  chart2.subscribeCrosshairMove((param) => {
    const series1 = chart1Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === SIGNALS.OXIMETRY);
    const series2 = chart2Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === SIGNALS.AIR_FLOW);
    if (!series1 || !series2) return;
    const mainSeries1 = series1.serie;
    const mainSeries2 = series2.serie;
    const dataPoint = getCrosshairDataPoint(mainSeries2, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
  });
}

function getCrosshairDataPoint(series: ISeriesApi<"Line">, param: MouseEventParams<Time>) {
  if (!param.time) {
    return null;
  }
  const dataPoint = param.seriesData.get(series);
  return dataPoint || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function syncCrosshair(chart: IChartApi, series: ISeriesApi<"Line">, dataPoint: any) {
  if (dataPoint) {
    chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
    return;
  }
  chart.clearCrosshairPosition();
}
