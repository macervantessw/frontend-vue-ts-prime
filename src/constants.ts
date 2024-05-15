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

export const STATES = {
  AWAKE: 0,
  SLEEPING: 1,
  UNKNOWN: 2,
  MICROAWAKE: 3,
};

export const DOWNSAMPLE_RATIO = 5;
export const VISIBLE_MINUTES = 10;
export const VISIBLE_HALF = VISIBLE_MINUTES / 2;

export const RESPIRATORY_EVENTS = {
  EVENT_TYPE_APNEA: 0,
  EVENT_TYPE_HYPOAPNEA: 1,
  EVENT_TYPE_CENTRAL_APNEA: 2,
  EVENT_TYPE_NATURAL_MOVEMENT: 3,
  EVENT_SUDDENT_SHORT_MOVEMENT: 4,
  EVENT_TYPE_RAMP_UP: 5,
  EVENT_TYPE_RAMP_DOWN: 6,
  EVENT_TYPE_OXIMETRY: 7,
  EVENT_TYPE_LEGS_MOVEMENT: 8,
  EVENT_TYPE_NATURAL_MOVEMENT_2: 9,
  EVENT_TYPE_AUDIO_EVENT: 10,
  EVENT_MOVMENT_FROM_SIGNAL: 11,
  EVENT_RBDMOVMENT_FROM_SIGNAL: 12,
  EVENT_TYPE_REMSTAGE: 13,
  EVENT_TYPE_SHORT_NATURAL_MOVEMENT: 14,
  EVENT_TYPE_NO_SIGNAL: 15,
  EVENT_HIGH_RESPIRATORY_FREQUENCE: 16,
  DISCARDABLE_AWAKE: 100, // a partir de aqui descartados irecuperables
  DISCARDABLE_RD_RATIO: 101,
  DISCARDABLE_RU_RATIO: 102,
  DISCARDABLE_ISOLATED: 103, // estos son descartados susceptibles de ser salvados
  DISCARDABLE_EVENTDURATION: 104,
  DISCARDABLE_RD_DURATION: 105,
  DISCARDABLE_RU_DURATION: 106,
  DISCARDABLE_LOWMOVEMENT: 107,
  DISCARDABLE_HIGHREP: 108,
  DISCARDABLE_RD_RATIO_AV_MIN: 109,
  DISCARDABLE_EXITVALUE: 110,
  DISCARDABLE_NOT_ENOUGH_ATT: 111,
  DISCARDABLE_NEARSHORTMOVEMENT: 112,
  DISCARDABLE_NOT_ENOUGH_SIGNAL: 113,
};

export const CHART_OPTIONS: DeepPartial<TimeChartOptions> = {
  layout: {
    background: { color: "#ffffff00" },
  },
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
    pressedMouseMove: true,
    mouseWheel: true,
  },
  handleScale: {
    axisPressedMouseMove: true,
    mouseWheel: false,
  },
  kineticScroll: {
    mouse: true,
  },
  localization: {
    timeFormatter: (time: number) => {
      // return dayjs(time).format("HH:mm:ss");
      return Math.floor(time / 1000);
    },
  },

  timeScale: {
    fixLeftEdge: true,
    fixRightEdge: true,
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
