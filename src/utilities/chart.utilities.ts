/* eslint-disable @typescript-eslint/no-explicit-any */
import { IChartApi, ISeriesApi, LineData, MouseEventParams, SeriesOptionsMap, Time } from "lightweight-charts";
import { Data, Event, Serie } from "../interfaces";
import { Box } from "../components/Charts/plugins/box";
import { STATES, RESPIRATORY_EVENTS } from "../constants";
// import { useChartsStore } from "../store";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function showRespiratoryEvents(
  chart: IChartApi | null,
  serie: ISeriesApi<"Line">,
  data: LineData[],
  events: Event[] | undefined,
  vertOffset = 0,
  height?: number,
  showDiscarded = true,
  solidColor = false,
) {
  if (!events || !chart || !serie) return;
  const boxes: Box[] = [];

  for (const event of events) {
    const types = showDiscarded ? [0, 2, 103] : [0];
    if (chart && types.includes(event.eventType)) {
      let color = `hsla(207, 73%, 39%, ${solidColor ? 1 : 0.2})`;
      if (event.eventType === RESPIRATORY_EVENTS.EVENT_TYPE_CENTRAL_APNEA) color = `hsla(24, 76%, 51%,  ${solidColor ? 1 : 0.2})`;
      else if (event.eventType === RESPIRATORY_EVENTS.DISCARDABLE_ISOLATED) color = `hsla(54, 97.30%, 56.50%,  ${solidColor ? 1 : 0.2})`;
      const from = event.startTime * 1000;
      const to = event.endTime * 1000;
      const box = new Box(chart, serie, data, from as Time, to as Time, vertOffset, height, {
        showLabel: false,
        color: color,
        width: 40,
      });
      serie.attachPrimitive(box);
      boxes.push(box);
    }
  }
  return boxes;
}

export function showMovementEvents(
  chart: IChartApi | null,
  serie: ISeriesApi<"Line">,
  data: LineData[],
  events: Event[] | undefined,
  showTypes = [17, 11],
  vertOffset = 0,
  height?: number,
  solidColor = false,
) {
  if (!events || !chart || !serie) return;
  const opacity = solidColor ? 1 : 0.2;
  events.forEach((event) => {
    if (showTypes.includes(event.eventType)) {
      let color = `hsla(278, 87%, 64%, ${opacity})`;
      if (event.eventType === 11) {
        color = `hsla(0, 0%, 45%, ${opacity})`;
      }
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
export function showStateEvents(chart: IChartApi | null, serie: ISeriesApi<"Line">, data: LineData[], events: Event[] | undefined, vertOffset = 0, height?: number) {
  if (!events || !chart || !serie) return;
  const boxes = [] as Box[];
  events.forEach((event) => {
    const box = drawStateEvent(event, chart, serie, vertOffset, height);
    if (box) {
      boxes.push(box);
      serie.attachPrimitive(box);
    }
  });
  return boxes;
}

export function drawStateEvent(event: Event, chart: IChartApi, serie: ISeriesApi<"Line">, vertOffset = 0, height?: number) {
  let offset = vertOffset;
  let h = height;
  let color = "hsla(232, 87%, 64%,0.5)";
  if (event.eventType === STATES.SLEEPING) {
    color = "hsla(172, 31%, 55%, 0.5)";
    offset = vertOffset + (height ?? 0);
  } else if (event.eventType === STATES.UNKNOWN) {
    color = "hsla(30, 87%, 65%, 0.5)";
    offset = vertOffset;
    h = height ? height * 2 : undefined;
  } else if (event.eventType === STATES.MICROAWAKE) {
    color = "hsla(197, 54%, 52%)";
    offset = vertOffset + (height ?? 0);
  }
  const from = (event.startTime * 1000) as Time;
  const to = (event.endTime * 1000) as Time;
  const box = drawBox(chart, from, to, serie, color, "", offset, h);
  return box;
}

export function showOxymetryEvents(
  chart: IChartApi | null,
  serie: ISeriesApi<"Line"> | undefined,
  data: LineData[],
  events: Event[] | undefined,
  oldBoxes: Box[] = [],
  vertOffset = 0,
  height?: number,
  color = "hsla(30, 87%, 65%, 0.243)",
) {
  if (!events || !chart || !serie) return;
  for (const box of oldBoxes) {
    serie.detachPrimitive(box);
  }

  const boxes = [] as Box[];

  events.forEach((event) => {
    const box = new Box(chart, serie, data, event.startTime as Time, event.endTime as Time, vertOffset, height, {
      showLabel: false,
      color: color,
      width: 40,
    });
    boxes.push(box);
    serie.attachPrimitive(box);
  });
  serie.setMarkers([{ time: 0 as Time, position: "aboveBar", color: "rgba(0, 0, 0, 0.0)", shape: "arrowUp", id: "marker" }]);
  return boxes;
}
export function drawBox(chart: IChartApi | null, from: Time, to: Time, serie: ISeriesApi<"Line">, color: string, text = "", verticalOffset = 0, height?: number) {
  if (!chart) return;
  const data = Array.from(serie.data()) as LineData<Time>[];
  const box = new Box(chart, serie, data, from, to, verticalOffset, height, {
    showLabel: false,
    color: color,
    width: 40,
  });
  serie.attachPrimitive(box);
  serie.setMarkers([
    {
      time: to,
      position: "aboveBar",
      shape: "circle",
      color: "",
      size: 0,
      text: text,
      id: "selectionTime",
    },
  ]);
  box.updateAllViews();
  return box;
}

export function removeBox(box: Box | undefined, serie: ISeriesApi<"Line">) {
  if (!box || !serie) return;
  serie.detachPrimitive(box);
  serie.setMarkers([{ time: 0 as Time, position: "aboveBar", color: "rgba(0, 0, 0, 0.0)", shape: "circle", id: "marker" }]);
  box.updateAllViews();
}

export function showSnoringEvents(
  chart: IChartApi | null,
  serie: ISeriesApi<keyof SeriesOptionsMap> | undefined,
  data: LineData[],
  events: Event[] | undefined,
  offset = 0,
  height?: number,
) {
  if (!events || !chart || !serie) return;
  events = events.filter((event) => event.eventType === 10);
  events.forEach((event) => {
    const color = "rgba(49, 63, 71, 0.188)";
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
  // const chartsStore = useChartsStore();
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
    // chartsStore.setCurrentTime(dataPoint?.time as number);
  });
  chart2.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries2, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
    syncCrosshair(chart3, mainSeries3, dataPoint);
    syncCrosshair(chart4, mainSeries4, dataPoint);
    // chartsStore.setCurrentTime(dataPoint?.time as number);
  });

  chart3.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries3, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
    syncCrosshair(chart2, mainSeries2, dataPoint);
    syncCrosshair(chart4, mainSeries4, dataPoint);
    // chartsStore.setCurrentTime(dataPoint?.time as number);
  });

  chart4?.subscribeCrosshairMove((param) => {
    checkSeries();
    if (!mainSeries1 || !mainSeries2 || !mainSeries3 || !mainSeries4) return;

    const dataPoint = getCrosshairDataPoint(mainSeries4, param);
    syncCrosshair(chart1, mainSeries1, dataPoint);
    syncCrosshair(chart2, mainSeries2, dataPoint);
    syncCrosshair(chart3, mainSeries3, dataPoint);
    // chartsStore.setCurrentTime(dataPoint?.time as number);
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
  if (!chart) return;
  if (dataPoint) {
    chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
    return;
  }
  chart.clearCrosshairPosition();
}

export function calculateOxymetryEvents(basalOxymetryData: readonly Data[], oxymetryData: readonly Data[], percentage = 3): Event[] {
  const events = basalOxymetryData.reduce((acc: Event[], curr, index) => {
    const value = oxymetryData[index].value;
    if (value < curr.value * (1 - percentage / 100)) {
      if (acc[acc.length - 1]?.endTime !== 0) acc.push({ startTime: curr.time, endTime: 0, eventType: 44 });
    } else {
      if (acc[acc.length - 1]?.endTime === 0) {
        acc[acc.length - 1].endTime = curr.time;
      }
    }
    return acc;
  }, []);

  return events;
}
