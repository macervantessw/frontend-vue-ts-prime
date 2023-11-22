/* eslint-disable @typescript-eslint/no-explicit-any */
import { IChartApi, ISeriesApi, LineData, MouseEventParams, Time } from "lightweight-charts";
import { Event, Serie } from "../interfaces";
import { Box } from "../components/Charts/plugins/box";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function showRespiratoryEvents(
  chart: IChartApi | null,
  serie: ISeriesApi<"Line">,
  data: LineData[],
  events: Event[],
  vertOffset = 0,
  height?: number,
  showDiscarded = true,
) {
  if (!events || !chart || !serie) return;

  events.forEach((event) => {
    const types = showDiscarded ? [0, 2, 103] : [0];
    if (chart && types.includes(event.eventType)) {
      let color = "hsla(207, 73%, 39%, 0.2)";
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
    }
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

export function syncronizeCrosshairs(
  chart1Ref: any,
  chart2Ref: any,
  chart3Ref: any,
  chart4Ref: any,
  mainSerie1Id: string,
  mainSerie2Id: string,
  mainSerie3Id: string,
  mainSerie4Id: string,
) {
  const chart1: IChartApi = chart1Ref?.getChart();
  const chart2: IChartApi = chart2Ref?.getChart();
  const chart3: IChartApi = chart3Ref?.getChart();
  const chart4: IChartApi = chart4Ref?.getChart();

  let series1 = chart1Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie1Id);
  let series2 = chart2Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie2Id);
  let series3 = chart3Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie3Id);
  let series4 = chart4Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie4Id);

  let mainSeries1: ISeriesApi<"Line"> | undefined = undefined;
  let mainSeries2: ISeriesApi<"Line"> | undefined = undefined;
  let mainSeries3: ISeriesApi<"Line"> | undefined = undefined;
  let mainSeries4: ISeriesApi<"Line"> | undefined = undefined;

  const checkSeries = () => {
    if (!series1) {
      series1 = chart1Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie1Id);
      mainSeries1 = series1?.serie;
    }
    if (!series2) {
      series2 = chart2Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie2Id);
      mainSeries2 = series2?.serie;
    }
    if (!series3) {
      series3 = chart3Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie3Id);
      mainSeries3 = series3?.serie;
    }
    if (!series4) {
      series4 = chart4Ref?.getSeries().find((serie: Serie<"Line">) => serie.id === mainSerie4Id);
      mainSeries4 = series4?.serie;
    }
  };
  chart1.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries1, param);
    syncCrosshair(chart2, mainSeries2, dataPoint);
    syncCrosshair(chart3, mainSeries3, dataPoint);
    syncCrosshair(chart4, mainSeries4, dataPoint);
  });
  chart2.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries2, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
    syncCrosshair(chart3, mainSeries3, dataPoint);
    syncCrosshair(chart4, mainSeries4, dataPoint);
  });

  chart3.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries3, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
    syncCrosshair(chart2, mainSeries2, dataPoint);
    syncCrosshair(chart4, mainSeries4, dataPoint);
  });

  chart4.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries4, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
    syncCrosshair(chart2, mainSeries2, dataPoint);
    syncCrosshair(chart3, mainSeries3, dataPoint);
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
