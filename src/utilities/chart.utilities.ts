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
  const chart1: IChartApi | undefined = chart1Ref?.getChart?.();
  const chart2: IChartApi | undefined = chart2Ref?.getChart?.();
  const chart3: IChartApi | undefined = chart3Ref?.getChart?.();
  const chart4: IChartApi | undefined = chart4Ref?.getChart?.();

  // Busca (perezosamente) la serie principal de cada chart por id
  let series1: Serie<"Line"> | undefined;
  let series2: Serie<"Line"> | undefined;
  let series3: Serie<"Line"> | undefined;
  let series4: Serie<"Line"> | undefined;
  let series5: Serie<"Line"> | undefined;

  let main1: ISeriesApi<"Line"> | undefined;
  let main2: ISeriesApi<"Line"> | undefined;
  let main3: ISeriesApi<"Line"> | undefined;
  let main4: ISeriesApi<"Line"> | undefined;
  let main5: ISeriesApi<"Line"> | undefined;

  const ensureSeries = () => {
    if (!series1) {
      series1 = chart1Ref?.getSeries?.().find((s: Serie<"Line">) => s.id === mainSerie1Id);
      main1 = series1?.serie;
    }
    if (!series2) {
      series2 = chart2Ref?.getSeries?.().find((s: Serie<"Line">) => s.id === mainSerie2Id);
      main2 = series2?.serie;
    }
    if (!series3) {
      series3 = chart3Ref?.getSeries?.().find((s: Serie<"Line">) => s.id === mainSerie3Id);
      main3 = series3?.serie;
    }
    if (!series4) {
      series4 = chart4Ref?.getSeries?.().find((s: Serie<"Line">) => s.id === mainSerie4Id);
      main4 = series4?.serie;
    }
    /*if (!series5) {
      series5 = chart5Ref?.getSeries?.().find((s: Serie<"Line">) => s.id === mainSerie5Id);
      main5 = series5?.serie;
    }*/
  };

  // Helper para sincronizar a todos excepto el origen
  const syncAllExcept = (originChart?: IChartApi, dataPoint?: any) => {
    const pairs: Array<[IChartApi | undefined, ISeriesApi<"Line"> | undefined]> = [
      [chart1, main1],
      [chart2, main2],
      [chart3, main3],
      [chart4, main4],
    ];
    for (const [c, s] of pairs) {
      if (!c || !s || c === originChart) continue;
      syncCrosshair(c, s, dataPoint);
    }
  };

  const subscribe = (c?: IChartApi, s?: ISeriesApi<"Line">) => {
    if (!c || !s) return;
    c.subscribeCrosshairMove((param) => {
      ensureSeries();
      if (!main1 || !main2 || !main3 || !main4 || !main5) {
        // si aún faltan series, no sincronizamos
      }
      const dp = getCrosshairDataPoint(s, param);
      syncAllExcept(c, dp);
    });
  };

  ensureSeries();

  subscribe(chart1, main1);
  subscribe(chart2, main2);
  subscribe(chart3, main3);
  subscribe(chart4, main4);

}

// Igual que antes, pero robusto con value/close
function getCrosshairDataPoint(series: ISeriesApi<"Line">, param: MouseEventParams<Time>) {
  if (!param.time) return null;
  const sd: any = param.seriesData.get(series);
  if (!sd) return null;
  // para Line suele ser { time, value }, pero por si acaso:
  const value = sd.value !== undefined ? sd.value : sd.close;
  return value !== undefined ? { time: sd.time, value } : null;
}

function syncCrosshair(chart: IChartApi, series: ISeriesApi<"Line">, dataPoint: any) {
  if (!chart) return;
  if (dataPoint) {
    chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
  } else {
    chart.clearCrosshairPosition();
  }
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
