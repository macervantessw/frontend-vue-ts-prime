import { CanvasRenderingTarget2D } from "fancy-canvas";
import {
  Coordinate,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitiveAxisView,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  LineData,
  SeriesOptionsMap,
  SeriesType,
  Time,
} from "lightweight-charts";
import { positionsBox } from "./helpers/position";
import { findNearestTime } from "./helpers/nearest";

class BoxPaneRenderer implements ISeriesPrimitivePaneRenderer {
  _x: Coordinate | null = null;
  _end: Coordinate | null = null;
  _options: BoxOptions;
  constructor(x: Coordinate | null, end: Coordinate | null, options: BoxOptions) {
    this._x = x;
    this._end = end;
    this._options = options;
  }
  draw(target: CanvasRenderingTarget2D) {
    target.useBitmapCoordinateSpace((scope) => {
      if (this._x === null || this._end === null) return;
      const ctx = scope.context;
      const position = positionsBox(this._x, this._end, scope.horizontalPixelRatio);
      // positionsLine(this._x, scope.horizontalPixelRatio, this._options.width);
      ctx.fillStyle = this._options.color;
      ctx.fillRect(position.position, 0, position.length, scope.bitmapSize.height);
    });
  }
}

class BoxPaneView implements ISeriesPrimitivePaneView {
  _source: Box;
  _x: Coordinate | null = null;
  _end: Coordinate | null = null;
  _data: LineData[];
  _options: BoxOptions;

  constructor(source: Box, options: BoxOptions, data: LineData[]) {
    this._source = source;
    this._options = options;
    this._data = data;
  }
  update() {
    const timeScale = this._source._chart.timeScale();
    this._x = timeScale.timeToCoordinate(this._source._time);
    if (this._x === null) {
      const nearest = findNearestTime(this._source._time, this._data);
      this._x = timeScale.timeToCoordinate(nearest as Time);
    }
    this._end = timeScale.timeToCoordinate(this._source._end);
    if (this._end === null) {
      const nearest = findNearestTime(this._source._end, this._data);
      this._end = timeScale.timeToCoordinate(nearest as Time);
    }
  }
  renderer() {
    return new BoxPaneRenderer(this._x, this._end, this._options);
  }
}

class BoxTimeAxisView implements ISeriesPrimitiveAxisView {
  _source: Box;
  _x: Coordinate | null = null;
  _end: Coordinate | null = null;
  _data: LineData[];
  _options: BoxOptions;

  constructor(source: Box, options: BoxOptions, data: LineData[]) {
    this._source = source;
    this._options = options;
    this._data = data;
  }
  update() {
    const timeScale = this._source._chart.timeScale();
    this._x = timeScale.timeToCoordinate(this._source._time);
    if (this._x === null) {
      const nearest = findNearestTime(this._source._time, this._data);
      this._x = timeScale.timeToCoordinate(nearest as Time);
    }
    this._end = timeScale.timeToCoordinate(this._source._end);
    if (this._end === null) {
      const nearest = findNearestTime(this._source._end, this._data);
      this._end = timeScale.timeToCoordinate(nearest as Time);
    }
  }
  visible() {
    return this._options.showLabel;
  }
  tickVisible() {
    return this._options.showLabel;
  }
  coordinate() {
    return this._x ?? 0;
  }
  text() {
    return this._options.labelText;
  }
  textColor() {
    return this._options.labelTextColor;
  }
  backColor() {
    return this._options.labelBackgroundColor;
  }
}

export interface BoxOptions {
  color: string;
  labelText: string;
  width: number;
  labelBackgroundColor: string;
  labelTextColor: string;
  showLabel: boolean;
}

const defaultOptions: BoxOptions = {
  color: "green",
  labelText: "",
  width: 3,
  labelBackgroundColor: "green",
  labelTextColor: "white",
  showLabel: false,
};

export class Box implements ISeriesPrimitive<Time> {
  _chart: IChartApi;
  _data: LineData[];
  _series: ISeriesApi<keyof SeriesOptionsMap>;
  _time: Time;
  _end: Time;
  _paneViews: BoxPaneView[];
  _timeAxisViews: BoxTimeAxisView[];

  constructor(chart: IChartApi, series: ISeriesApi<SeriesType>, data: LineData[], time: Time, end: Time, options?: Partial<BoxOptions>) {
    const boxOptions: BoxOptions = {
      ...defaultOptions,
      ...options,
    };
    this._data = data;
    this._chart = chart;
    this._series = series;
    this._time = time;
    this._end = end;
    this._paneViews = [new BoxPaneView(this, boxOptions, data)];
    this._timeAxisViews = [new BoxTimeAxisView(this, boxOptions, data)];
  }
  updateAllViews() {
    this._paneViews.forEach((pw) => pw.update());
    this._timeAxisViews.forEach((tw) => tw.update());
  }
  timeAxisViews() {
    return this._timeAxisViews;
  }
  paneViews() {
    return this._paneViews;
  }
}
