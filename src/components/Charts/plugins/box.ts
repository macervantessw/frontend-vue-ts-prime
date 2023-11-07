import { CanvasRenderingTarget2D } from "fancy-canvas";
import {
  Coordinate,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  ISeriesPrimitiveAxisView,
  ISeriesPrimitivePaneRenderer,
  ISeriesPrimitivePaneView,
  SeriesOptionsMap,
  SeriesType,
  Time,
} from "lightweight-charts";
import { positionsBox } from "./helpers/position";

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
  _options: BoxOptions;

  constructor(source: Box, options: BoxOptions) {
    this._source = source;
    this._options = options;
  }
  update() {
    const timeScale = this._source._chart.timeScale();
    this._x = timeScale.timeToCoordinate(this._source._time);
    this._end = timeScale.timeToCoordinate(this._source._end);
  }
  renderer() {
    return new BoxPaneRenderer(this._x, this._end, this._options);
  }
}

class BoxTimeAxisView implements ISeriesPrimitiveAxisView {
  _source: Box;
  _x: Coordinate | null = null;
  _end: Coordinate | null = null;
  _options: BoxOptions;

  constructor(source: Box, options: BoxOptions) {
    this._source = source;
    this._options = options;
  }
  update() {
    const timeScale = this._source._chart.timeScale();
    this._x = timeScale.timeToCoordinate(this._source._time);
    this._end = timeScale.timeToCoordinate(this._source._end);
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
  _series: ISeriesApi<keyof SeriesOptionsMap>;
  _time: Time;
  _end: Time;
  _paneViews: BoxPaneView[];
  _timeAxisViews: BoxTimeAxisView[];

  constructor(chart: IChartApi, series: ISeriesApi<SeriesType>, time: Time, end: Time, options?: Partial<BoxOptions>) {
    const boxOptions: BoxOptions = {
      ...defaultOptions,
      ...options,
    };
    this._chart = chart;
    this._series = series;
    this._time = time;
    this._end = end;
    this._paneViews = [new BoxPaneView(this, boxOptions)];
    this._timeAxisViews = [new BoxTimeAxisView(this, boxOptions)];
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
