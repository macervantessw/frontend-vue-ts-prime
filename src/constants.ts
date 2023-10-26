import dayjs from "dayjs";
import { DeepPartial, LineStyleOptions, TimeChartOptions } from "lightweight-charts";

export const SIGNALS = {
  BASETIME: "SM_BASETIME.dat",
  BREATH_RATE: "RA_BreathRateSignal.dat",
  AIR_FLOW: "RA_AirFlowSignal.dat",
  BASAL_AIR_FLOW: "RA_BasalAirFlowSignal.dat",
  MOVEMENT: "RA_MovementSignal.dat",
  HR: "OA_HRSignal.dat",
  BASAL_OXIMETRY: "OA_OximetryBasalSignal.dat",
  OXIMETRY: "OA_OximetrySignal.dat",
};

export const MAX_SAMPLES = 3000;
export const CHART_MOVEMENT = 10000;

export const CHART_OPTIONS: DeepPartial<TimeChartOptions> = {
  autoSize: false,
  rightPriceScale: {
    visible: false,
  },
  handleScroll: {
    mouseWheel: true,
    pressedMouseMove: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: false,
    pinch: true,
    axisDoubleClickReset: true,
  },
  kineticScroll: {
    mouse: true,
  },
  timeScale: {
    timeVisible: true,
    secondsVisible: true,
    barSpacing: 0.2,
    minBarSpacing: 0.2,

    tickMarkFormatter: (time: number) => {
      return dayjs(time).format("HH:mm:ss");
    },
  },
};

export const LINE_OPTIONS: Partial<LineStyleOptions> = {
  lineWidth: 2,
};
