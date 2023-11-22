import dayjs from "dayjs";
import { DeepPartial, LineSeriesPartialOptions, TimeChartOptions } from "lightweight-charts";

export const SIGNALS = {
  BASETIME: "SM_BASETIME.dat",
  BREATH_RATE: "RA_BreathRateSignal.dat",
  AIR_FLOW: "RA_AirFlowSignal.dat",
  BASAL_AIR_FLOW: "RA_BasalAirFlowSignal.dat",
  MOVEMENT: "RA_MovementSignal.dat",
  HR: "OA_HRSignal.dat",
  BASAL_OXIMETRY: "OA_OximetryBasalSignal.dat",
  OXIMETRY: "OA_OximetrySignal.dat",
  STATE: "STATE",
  AUDIO: "AA_AudioSignal.dat",
};

export const VISIBLE_MINUTES = 10;
export const VISIBLE_HALF = VISIBLE_MINUTES / 2;

export const CHART_OPTIONS: DeepPartial<TimeChartOptions> = {
  autoSize: true,
  leftPriceScale: {
    visible: false,
    autoScale: false,
  },

  grid: {
    vertLines: {
      visible: false,
    },
    horzLines: {
      visible: false,
    },
  },
  rightPriceScale: {
    visible: false,
    autoScale: false,
    scaleMargins: {
      top: 0,
      bottom: 0,
    },
  },

  handleScroll: {
    mouseWheel: true,
    vertTouchDrag: true,
    pressedMouseMove: false,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: false,
    pinch: true,
    axisDoubleClickReset: false,
  },
  kineticScroll: {
    mouse: true,
  },
  localization: {
    timeFormatter: (time: number) => {
      return dayjs(time).format("HH:mm:ss");
    },
  },

  timeScale: {
    fixLeftEdge: true,
    lockVisibleTimeRangeOnResize: true,
    borderVisible: false,
    uniformDistribution: true,
    minBarSpacing: 0.05,
    tickMarkFormatter: (time: number) => {
      return dayjs(time).format("HH:mm:ss");
    },
  },
};

export const LINE_OPTIONS: LineSeriesPartialOptions = {
  lineWidth: 2,
  priceLineSource: 1,
  lineType: 0,
  lastValueVisible: false,
  priceLineVisible: false,
};
