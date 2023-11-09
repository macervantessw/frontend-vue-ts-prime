import { IChartApi, ISeriesApi, LineData, Time } from "lightweight-charts";
import { Event } from "../interfaces";
import { Box } from "../components/Charts/plugins/box";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function showRespiratoryEvents(chart: IChartApi | null, serie: ISeriesApi<"Line">, data: LineData[], events: Event[]) {
  if (!events || !chart || !serie) return;

  events.forEach((event) => {
    let color = "hsla(207, 73.00%, 39.20%, 0.2)";
    if (event.eventType === 2) color = "hsla(53, 85%, 52%, 0.1)";
    else if (event.eventType === 103) color = "hsla(286, 45%, 36%, 0.2)";
    if (chart) {
      const from = event.startTime * 1000;
      const to = event.endTime * 1000;
      const box = new Box(chart, serie, data, from as Time, to as Time, {
        showLabel: false,
        color: color,
        width: 40,
      });
      serie.attachPrimitive(box);
    }
  });
}
