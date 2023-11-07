import { IChartApi, ISeriesApi, Time } from "lightweight-charts";
import { Event } from "../interfaces";
import { Box } from "../components/Charts/plugins/box";

export function showRespiratoryEvents(chart: IChartApi | null, serie: ISeriesApi<"Line">, events: Event[]) {
  if (!events || !chart || !serie) return;
  events.forEach((event) => {
    if (chart) {
      const from = event.startTime * 1000;
      const to = event.endTime * 1000;
      const box = new Box(chart, serie, from as Time, to as Time, {
        showLabel: false,
        color: "hsla(207, 73.00%, 39.20%, 0.2)",
        width: 40,
      });
      serie.attachPrimitive(box);
    }
  });
}
