"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import React, { Component } from "react";
import PropTypes from "prop-types";
import { extent as d3Extent, min, max } from "d3-array";

import { first, last, isDefined, isNotDefined, clearCanvas, shallowEqual, identity, noop, functor, getLogger } from "./utils";

import { getNewChartConfig, getChartConfigWithUpdatedYScales, getCurrentCharts, getCurrentItem } from "./utils/ChartDataUtil";

import EventCapture from "./EventCapture";

import CanvasContainer from "./CanvasContainer";
import evaluator from "./scale/evaluator";

var log = getLogger("ChartCanvas");

var CANDIDATES_FOR_RESET = ["seriesName"];

function shouldResetChart(thisProps, nextProps) {
	return !CANDIDATES_FOR_RESET.every(function (key) {
		var result = shallowEqual(thisProps[key], nextProps[key]);
		// console.log(key, result);
		return result;
	});
}

function getCursorStyle(useCrossHairStyleCursor) {
	var style = "\n\t.react-stockcharts-grabbing-cursor {\n\t\tpointer-events: all;\n\t\tcursor: -moz-grabbing;\n\t\tcursor: -webkit-grabbing;\n\t\tcursor: grabbing;\n\t}\n\t.react-stockcharts-crosshair-cursor {\n\t\tpointer-events: all;\n\t\tcursor: crosshair;\n\t}\n\t.react-stockcharts-tooltip-hover {\n\t\tpointer-events: all;\n\t\tcursor: pointer;\n\t}";
	var tooltipStyle = "\n\t.react-stockcharts-avoid-interaction {\n\t\tpointer-events: none;\n\t}\n\t.react-stockcharts-enable-interaction {\n\t\tpointer-events: all;\n\t}\n\t.react-stockcharts-tooltip {\n\t\tpointer-events: all;\n\t\tcursor: pointer;\n\t}\n\t.react-stockcharts-default-cursor {\n\t\tcursor: default;\n\t}\n\t.react-stockcharts-move-cursor {\n\t\tcursor: move;\n\t}\n\t.react-stockcharts-pointer-cursor {\n\t\tcursor: pointer;\n\t}\n\t.react-stockcharts-ns-resize-cursor {\n\t\tcursor: ns-resize;\n\t}\n\t.react-stockcharts-ew-resize-cursor {\n\t\tcursor: ew-resize;\n\t}";
	return React.createElement(
		"style",
		{ type: "text/css" },
		useCrossHairStyleCursor ? style + tooltipStyle : tooltipStyle
	);
}

function getDimensions(props) {
	return {
		height: props.height - props.margin.top - props.margin.bottom,
		width: props.width - props.margin.left - props.margin.right
	};
}

function getXScaleDirection(flipXScale) {
	return flipXScale ? -1 : 1;
}

function calculateFullData(props) {
	var fullData = props.data,
	    plotFull = props.plotFull,
	    xScale = props.xScale,
	    clamp = props.clamp,
	    pointsPerPxThreshold = props.pointsPerPxThreshold;
	var xAccessor = props.xAccessor,
	    displayXAccessor = props.displayXAccessor;


	var useWholeData = isDefined(plotFull) ? plotFull : xAccessor === identity;

	var filterData = evaluator({
		xAccessor: xAccessor,
		xScale: xScale,
		useWholeData: useWholeData,
		clamp: clamp,
		pointsPerPxThreshold: pointsPerPxThreshold
	});

	return {
		xAccessor: xAccessor,
		displayXAccessor: displayXAccessor || xAccessor,
		xScale: xScale,
		fullData: fullData,
		filterData: filterData
	};
}
function resetChart(props) {
	var firstCalculation = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

	if (process.env.NODE_ENV !== "production") {
		if (!firstCalculation) log("CHART RESET");
	}

	var state = calculateState(props);
	var xAccessor = state.xAccessor,
	    displayXAccessor = state.displayXAccessor,
	    fullData = state.fullData;
	var initialPlotData = state.plotData,
	    xScale = state.xScale;
	var postCalculator = props.postCalculator,
	    children = props.children;


	var plotData = postCalculator(initialPlotData);

	var dimensions = getDimensions(props);
	var chartConfig = getChartConfigWithUpdatedYScales(getNewChartConfig(dimensions, children), { plotData: plotData, xAccessor: xAccessor, displayXAccessor: displayXAccessor, fullData: fullData }, xScale.domain());

	return _extends({}, state, {
		xScale: xScale,
		plotData: plotData,
		chartConfig: chartConfig
	});
}

function updateChart(newState, initialXScale, props, lastItemWasVisible) {
	var fullData = newState.fullData,
	    xScale = newState.xScale,
	    xAccessor = newState.xAccessor,
	    displayXAccessor = newState.displayXAccessor,
	    filterData = newState.filterData;


	var lastItem = last(fullData);

	var _initialXScale$domain = initialXScale.domain(),
	    _initialXScale$domain2 = _slicedToArray(_initialXScale$domain, 2),
	    start = _initialXScale$domain2[0],
	    end = _initialXScale$domain2[1];

	if (process.env.NODE_ENV !== "production") {
		log("TRIVIAL CHANGE");
	}

	var postCalculator = props.postCalculator,
	    children = props.children,
	    padding = props.padding,
	    flipXScale = props.flipXScale;

	var direction = getXScaleDirection(flipXScale);
	var dimensions = getDimensions(props);

	var updatedXScale = setXRange(xScale, dimensions, padding, direction);

	var initialPlotData = void 0;
	if (!lastItemWasVisible || end >= xAccessor(lastItem)) {
		// get plotData between [start, end] and do not change the domain
		initialPlotData = filterData(fullData, [start, end], xAccessor, updatedXScale).plotData;
		updatedXScale.domain([start, end]);
		// console.log("HERE!!!!!", start, end);
	} else if (lastItemWasVisible && end < xAccessor(lastItem)) {

		// get plotData between [xAccessor(l) - (end - start), xAccessor(l)] and DO change the domain
		var dx = initialXScale(xAccessor(lastItem)) - initialXScale.range()[1];

		var _initialXScale$range$ = initialXScale.range().map(function (x) {
			return x + dx;
		}).map(initialXScale.invert),
		    _initialXScale$range$2 = _slicedToArray(_initialXScale$range$, 2),
		    newStart = _initialXScale$range$2[0],
		    newEnd = _initialXScale$range$2[1];

		initialPlotData = filterData(fullData, [newStart, newEnd], xAccessor, updatedXScale).plotData;
		updatedXScale.domain([newStart, newEnd]);
		// if last item was visible, then shift
	}
	// plotData = getDataOfLength(fullData, showingInterval, plotData.length)
	var plotData = postCalculator(initialPlotData);
	var chartConfig = getChartConfigWithUpdatedYScales(getNewChartConfig(dimensions, children), { plotData: plotData, xAccessor: xAccessor, displayXAccessor: displayXAccessor, fullData: fullData }, updatedXScale.domain());

	return {
		xScale: updatedXScale,
		xAccessor: xAccessor,
		chartConfig: chartConfig,
		plotData: plotData,
		fullData: fullData,
		filterData: filterData
	};
}

function calculateState(props) {
	var inputXAccesor = props.xAccessor,
	    xExtentsProp = props.xExtents,
	    data = props.data,
	    padding = props.padding,
	    flipXScale = props.flipXScale;


	if (process.env.NODE_ENV !== "production" && isDefined(props.xScale.invert)) {
		for (var i = 1; i < data.length; i++) {
			var prev = data[i - 1];
			var curr = data[i];
			if (inputXAccesor(prev) > inputXAccesor(curr)) {
				throw new Error("'data' is not sorted on 'xAccessor', send 'data' sorted in assending order of 'xAccessor'");
			}
		}
	}

	var direction = getXScaleDirection(flipXScale);
	var dimensions = getDimensions(props);

	var extent = typeof xExtentsProp === "function" ? xExtentsProp(data) : d3Extent(xExtentsProp.map(function (d) {
		return functor(d);
	}).map(function (each) {
		return each(data, inputXAccesor);
	}));

	var _calculateFullData = calculateFullData(props),
	    xAccessor = _calculateFullData.xAccessor,
	    displayXAccessor = _calculateFullData.displayXAccessor,
	    xScale = _calculateFullData.xScale,
	    fullData = _calculateFullData.fullData,
	    filterData = _calculateFullData.filterData;

	var updatedXScale = setXRange(xScale, dimensions, padding, direction);

	var _filterData = filterData(fullData, extent, inputXAccesor, updatedXScale),
	    plotData = _filterData.plotData,
	    domain = _filterData.domain;

	if (process.env.NODE_ENV !== "production" && plotData.length <= 1) {
		throw new Error("Showing " + plotData.length + " datapoints, review the 'xExtents' prop of ChartCanvas");
	}
	return {
		plotData: plotData,
		xScale: updatedXScale.domain(domain),
		xAccessor: xAccessor,
		displayXAccessor: displayXAccessor,
		fullData: fullData,
		filterData: filterData
	};
}

function setXRange(xScale, dimensions, padding) {
	var direction = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;

	if (xScale.rangeRoundPoints) {
		if (isNaN(padding)) throw new Error("padding has to be a number for ordinal scale");
		xScale.rangeRoundPoints([0, dimensions.width], padding);
	} else if (xScale.padding) {
		if (isNaN(padding)) throw new Error("padding has to be a number for ordinal scale");
		xScale.range([0, dimensions.width]);
		xScale.padding(padding / 2);
	} else {
		var _ref = isNaN(padding) ? padding : { left: padding, right: padding },
		    left = _ref.left,
		    right = _ref.right;

		if (direction > 0) {
			xScale.range([left, dimensions.width - right]);
		} else {
			xScale.range([dimensions.width - right, left]);
		}
	}
	return xScale;
}

function pinchCoordinates(pinch) {
	var touch1Pos = pinch.touch1Pos,
	    touch2Pos = pinch.touch2Pos;


	return {
		topLeft: [Math.min(touch1Pos[0], touch2Pos[0]), Math.min(touch1Pos[1], touch2Pos[1])],
		bottomRight: [Math.max(touch1Pos[0], touch2Pos[0]), Math.max(touch1Pos[1], touch2Pos[1])]
	};
}

var ChartCanvas = function (_Component) {
	_inherits(ChartCanvas, _Component);

	function ChartCanvas() {
		_classCallCheck(this, ChartCanvas);

		var _this = _possibleConstructorReturn(this, (ChartCanvas.__proto__ || Object.getPrototypeOf(ChartCanvas)).call(this));

		_this.getDataInfo = _this.getDataInfo.bind(_this);
		_this.getCanvasContexts = _this.getCanvasContexts.bind(_this);

		_this.handleMouseMove = _this.handleMouseMove.bind(_this);
		_this.handleMouseEnter = _this.handleMouseEnter.bind(_this);
		_this.handleMouseLeave = _this.handleMouseLeave.bind(_this);
		_this.handleZoom = _this.handleZoom.bind(_this);
		_this.handlePinchZoom = _this.handlePinchZoom.bind(_this);
		_this.handlePinchZoomEnd = _this.handlePinchZoomEnd.bind(_this);
		_this.handlePan = _this.handlePan.bind(_this);
		_this.handlePanEnd = _this.handlePanEnd.bind(_this);
		_this.handleClick = _this.handleClick.bind(_this);
		_this.handleMouseDown = _this.handleMouseDown.bind(_this);
		_this.handleDoubleClick = _this.handleDoubleClick.bind(_this);
		_this.handleContextMenu = _this.handleContextMenu.bind(_this);
		_this.handleDragStart = _this.handleDragStart.bind(_this);
		_this.handleDrag = _this.handleDrag.bind(_this);
		_this.handleDragEnd = _this.handleDragEnd.bind(_this);

		_this.panHelper = _this.panHelper.bind(_this);
		_this.pinchZoomHelper = _this.pinchZoomHelper.bind(_this);
		_this.xAxisZoom = _this.xAxisZoom.bind(_this);
		_this.yAxisZoom = _this.yAxisZoom.bind(_this);
		_this.resetYDomain = _this.resetYDomain.bind(_this);
		_this.calculateStateForDomain = _this.calculateStateForDomain.bind(_this);
		_this.generateSubscriptionId = _this.generateSubscriptionId.bind(_this);
		_this.draw = _this.draw.bind(_this);
		_this.redraw = _this.redraw.bind(_this);
		_this.isSomethingSelectedAndHovering = _this.isSomethingSelectedAndHovering.bind(_this);

		_this.subscriptions = [];
		_this.subscribe = _this.subscribe.bind(_this);
		_this.unsubscribe = _this.unsubscribe.bind(_this);
		_this.amIOnTop = _this.amIOnTop.bind(_this);
		_this.saveEventCaptureNode = _this.saveEventCaptureNode.bind(_this);
		_this.saveCanvasContainerNode = _this.saveCanvasContainerNode.bind(_this);
		_this.setCursorClass = _this.setCursorClass.bind(_this);
		_this.getMutableState = _this.getMutableState.bind(_this);
		// this.canvasDrawCallbackList = [];
		_this.interactiveState = [];
		_this.panInProgress = false;

		_this.state = {};
		_this.mutableState = {};
		_this.lastSubscriptionId = 0;
		return _this;
	}

	_createClass(ChartCanvas, [{
		key: "saveEventCaptureNode",
		value: function saveEventCaptureNode(node) {
			this.eventCaptureNode = node;
		}
	}, {
		key: "saveCanvasContainerNode",
		value: function saveCanvasContainerNode(node) {
			this.canvasContainerNode = node;
		}
	}, {
		key: "getMutableState",
		value: function getMutableState() {
			return this.mutableState;
		}
	}, {
		key: "getDataInfo",
		value: function getDataInfo() {
			return _extends({}, this.state, {
				fullData: this.fullData
			});
		}
	}, {
		key: "getCanvasContexts",
		value: function getCanvasContexts() {
			if (this.canvasContainerNode) {
				return this.canvasContainerNode.getCanvasContexts();
			}
		}
	}, {
		key: "generateSubscriptionId",
		value: function generateSubscriptionId() {
			this.lastSubscriptionId++;
			return this.lastSubscriptionId;
		}
	}, {
		key: "clearBothCanvas",
		value: function clearBothCanvas() {
			var canvases = this.getCanvasContexts();
			if (canvases && canvases.axes) {
				clearCanvas([canvases.axes,
				// canvases.hover,
				canvases.mouseCoord], this.props.ratio);
			}
		}
	}, {
		key: "clearMouseCanvas",
		value: function clearMouseCanvas() {
			var canvases = this.getCanvasContexts();
			if (canvases && canvases.mouseCoord) {
				clearCanvas([canvases.mouseCoord], this.props.ratio);
			}
		}
	}, {
		key: "clearThreeCanvas",
		value: function clearThreeCanvas() {
			var canvases = this.getCanvasContexts();
			if (canvases && canvases.axes) {
				clearCanvas([canvases.axes,
				// canvases.hover,
				canvases.mouseCoord, canvases.bg], this.props.ratio);
			}
		}
	}, {
		key: "subscribe",
		value: function subscribe(id, rest) {
			var _rest$isDraggable = rest.isDraggable,
			    isDraggable = _rest$isDraggable === undefined ? functor(false) : _rest$isDraggable;

			this.subscriptions = this.subscriptions.concat(_extends({
				id: id
			}, rest, {
				isDraggable: isDraggable
			}));
		}
	}, {
		key: "unsubscribe",
		value: function unsubscribe(id) {
			this.subscriptions = this.subscriptions.filter(function (each) {
				return each.id !== id;
			});
		}
	}, {
		key: "isSomethingSelectedAndHovering",
		value: function isSomethingSelectedAndHovering() {
			return this.subscriptions.filter(function (each) {
				return each.isDraggable();
			}).length > 0;
		}
	}, {
		key: "setCursorClass",
		value: function setCursorClass(className) {
			this.eventCaptureNode.setCursorClass(className);
		}
	}, {
		key: "amIOnTop",
		value: function amIOnTop(id) {
			var dragableComponents = this.subscriptions.filter(function (each) {
				return each.isDraggable();
			});

			return dragableComponents.length > 0 && last(dragableComponents).id === id;
		}
	}, {
		key: "handleContextMenu",
		value: function handleContextMenu(mouseXY, e) {
			var _state = this.state,
			    xAccessor = _state.xAccessor,
			    chartConfig = _state.chartConfig,
			    plotData = _state.plotData,
			    xScale = _state.xScale;


			var currentCharts = getCurrentCharts(chartConfig, mouseXY);
			var currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);

			this.triggerEvent("contextmenu", {
				mouseXY: mouseXY,
				currentItem: currentItem,
				currentCharts: currentCharts
			}, e);
		}
	}, {
		key: "calculateStateForDomain",
		value: function calculateStateForDomain(newDomain) {
			var _state2 = this.state,
			    xAccessor = _state2.xAccessor,
			    displayXAccessor = _state2.displayXAccessor,
			    initialXScale = _state2.xScale,
			    initialChartConfig = _state2.chartConfig,
			    initialPlotData = _state2.plotData;
			var filterData = this.state.filterData;
			var fullData = this.fullData;
			var postCalculator = this.props.postCalculator;

			var _filterData2 = filterData(fullData, newDomain, xAccessor, initialXScale, initialPlotData, initialXScale.domain()),
			    beforePlotData = _filterData2.plotData,
			    domain = _filterData2.domain;

			var plotData = postCalculator(beforePlotData);
			var updatedScale = initialXScale.copy().domain(domain);
			var chartConfig = getChartConfigWithUpdatedYScales(initialChartConfig, { plotData: plotData, xAccessor: xAccessor, displayXAccessor: displayXAccessor, fullData: fullData }, updatedScale.domain());

			return {
				xScale: updatedScale,
				plotData: plotData,
				chartConfig: chartConfig
			};
		}
	}, {
		key: "pinchZoomHelper",
		value: function pinchZoomHelper(initialPinch, finalPinch) {
			var initialPinchXScale = initialPinch.xScale;
			var _state3 = this.state,
			    initialXScale = _state3.xScale,
			    initialChartConfig = _state3.chartConfig,
			    initialPlotData = _state3.plotData,
			    xAccessor = _state3.xAccessor,
			    displayXAccessor = _state3.displayXAccessor;
			var filterData = this.state.filterData;
			var fullData = this.fullData;
			var postCalculator = this.props.postCalculator;

			var _pinchCoordinates = pinchCoordinates(initialPinch),
			    iTL = _pinchCoordinates.topLeft,
			    iBR = _pinchCoordinates.bottomRight;

			var _pinchCoordinates2 = pinchCoordinates(finalPinch),
			    fTL = _pinchCoordinates2.topLeft,
			    fBR = _pinchCoordinates2.bottomRight;

			var e = initialPinchXScale.range()[1];

			var xDash = Math.round(-(iBR[0] * fTL[0] - iTL[0] * fBR[0]) / (iTL[0] - iBR[0]));
			var yDash = Math.round(e + ((e - iBR[0]) * (e - fTL[0]) - (e - iTL[0]) * (e - fBR[0])) / (e - iTL[0] - (e - iBR[0])));

			var x = Math.round(-xDash * iTL[0] / (-xDash + fTL[0]));
			var y = Math.round(e - (yDash - e) * (e - iTL[0]) / (yDash + (e - fTL[0])));

			var newDomain = [x, y].map(initialPinchXScale.invert);
			// var domainR = initial.right + right;

			var _filterData3 = filterData(fullData, newDomain, xAccessor, initialPinchXScale, initialPlotData, initialXScale.domain()),
			    beforePlotData = _filterData3.plotData,
			    domain = _filterData3.domain;

			var plotData = postCalculator(beforePlotData);
			var updatedScale = initialXScale.copy().domain(domain);

			var mouseXY = finalPinch.touch1Pos;
			var chartConfig = getChartConfigWithUpdatedYScales(initialChartConfig, { plotData: plotData, xAccessor: xAccessor, displayXAccessor: displayXAccessor, fullData: fullData }, updatedScale.domain());
			var currentItem = getCurrentItem(updatedScale, xAccessor, mouseXY, plotData);

			return {
				chartConfig: chartConfig,
				xScale: updatedScale,
				plotData: plotData,
				mouseXY: mouseXY,
				currentItem: currentItem
			};
		}
	}, {
		key: "handlePinchZoom",
		value: function handlePinchZoom(initialPinch, finalPinch, e) {
			var _this2 = this;

			if (!this.waitingForAnimationFrame) {
				this.waitingForAnimationFrame = true;
				var state = this.pinchZoomHelper(initialPinch, finalPinch);

				this.triggerEvent("pinchzoom", state, e);

				this.finalPinch = finalPinch;

				requestAnimationFrame(function () {
					_this2.clearBothCanvas();
					_this2.draw({ trigger: "pinchzoom" });
					_this2.waitingForAnimationFrame = false;
				});
			}
		}
	}, {
		key: "handlePinchZoomEnd",
		value: function handlePinchZoomEnd(initialPinch, e) {
			var xAccessor = this.state.xAccessor;


			if (this.finalPinch) {
				var state = this.pinchZoomHelper(initialPinch, this.finalPinch);
				var xScale = state.xScale;

				this.triggerEvent("pinchzoom", state, e);

				this.finalPinch = null;

				this.clearThreeCanvas();

				var fullData = this.fullData;

				var firstItem = first(fullData);

				var start = first(xScale.domain());
				var end = xAccessor(firstItem);
				var onLoadMore = this.props.onLoadMore;


				this.setState(state, function () {
					if (start < end) {
						onLoadMore(start, end);
					}
				});
			}
		}
	}, {
		key: "handleZoom",
		value: function handleZoom(zoomDirection, mouseXY, e) {
			// console.log("zoomDirection ", zoomDirection, " mouseXY ", mouseXY);
			var _state4 = this.state,
			    xAccessor = _state4.xAccessor,
			    initialXScale = _state4.xScale,
			    initialPlotData = _state4.plotData;
			var zoomMultiplier = this.props.zoomMultiplier;


			var item = getCurrentItem(initialXScale, xAccessor, mouseXY, initialPlotData),
			    cx = initialXScale(xAccessor(item)),
			    c = zoomDirection > 0 ? 1 * zoomMultiplier : 1 / zoomMultiplier,
			    newDomain = initialXScale.range().map(function (x) {
				return cx + (x - cx) * c;
			}).map(initialXScale.invert);

			var _calculateStateForDom = this.calculateStateForDomain(newDomain),
			    xScale = _calculateStateForDom.xScale,
			    plotData = _calculateStateForDom.plotData,
			    chartConfig = _calculateStateForDom.chartConfig;

			var currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
			var currentCharts = getCurrentCharts(chartConfig, mouseXY);

			this.clearThreeCanvas();

			var fullData = this.fullData;

			var firstItem = first(fullData);

			var start = first(xScale.domain());
			var end = xAccessor(firstItem);
			var onLoadMore = this.props.onLoadMore;


			this.triggerEvent("zoom", {
				show: true,
				mouseXY: mouseXY,
				currentCharts: currentCharts,
				currentItem: currentItem
			}, e);

			this.setState({
				xScale: xScale,
				plotData: plotData,
				chartConfig: chartConfig
			}, function () {
				if (start < end) {
					onLoadMore(start, end);
				}
			});
		}
	}, {
		key: "xAxisZoom",
		value: function xAxisZoom(newDomain) {
			var _calculateStateForDom2 = this.calculateStateForDomain(newDomain),
			    xScale = _calculateStateForDom2.xScale,
			    plotData = _calculateStateForDom2.plotData,
			    chartConfig = _calculateStateForDom2.chartConfig;

			this.clearThreeCanvas();

			var xAccessor = this.state.xAccessor;
			var fullData = this.fullData;

			var firstItem = first(fullData);
			var start = first(xScale.domain());
			var end = xAccessor(firstItem);
			var onLoadMore = this.props.onLoadMore;


			this.setState({
				xScale: xScale,
				plotData: plotData,
				chartConfig: chartConfig
			}, function () {
				if (start < end) onLoadMore(start, end);
			});
		}
	}, {
		key: "yAxisZoom",
		value: function yAxisZoom(chartId, newDomain) {
			this.clearThreeCanvas();
			var initialChartConfig = this.state.chartConfig;

			var chartConfig = initialChartConfig.map(function (each) {
				if (each.id === chartId) {
					var yScale = each.yScale;

					return _extends({}, each, {
						yScale: yScale.copy().domain(newDomain),
						yPanEnabled: true
					});
				} else {
					return each;
				}
			});

			this.setState({
				chartConfig: chartConfig
			});
		}
	}, {
		key: "triggerEvent",
		value: function triggerEvent(type, props, e) {
			var _this3 = this;

			// console.log("triggering ->", type);

			this.subscriptions.forEach(function (each) {
				var state = _extends({}, _this3.state, {
					fullData: _this3.fullData,
					subscriptions: _this3.subscriptions
				});
				each.listener(type, props, state, e);
			});
		}
	}, {
		key: "draw",
		value: function draw(props) {
			this.subscriptions.forEach(function (each) {
				if (isDefined(each.draw)) each.draw(props);
			});
		}
	}, {
		key: "redraw",
		value: function redraw() {
			this.clearThreeCanvas();
			this.draw({ force: true });
		}
	}, {
		key: "panHelper",
		value: function panHelper(mouseXY, initialXScale, panOrigin, chartsToPan) {
			var _state5 = this.state,
			    xAccessor = _state5.xAccessor,
			    displayXAccessor = _state5.displayXAccessor,
			    initialChartConfig = _state5.chartConfig;
			var filterData = this.state.filterData;
			var fullData = this.fullData;
			var postCalculator = this.props.postCalculator;


			var dx = mouseXY[0] - panOrigin[0];
			var dy = mouseXY[1] - panOrigin[1];

			if (isNotDefined(initialXScale.invert)) throw new Error("xScale provided does not have an invert() method." + "You are likely using an ordinal scale. This scale does not support zoom, pan");

			var newDomain = initialXScale.range().map(function (x) {
				return x - dx;
			}).map(initialXScale.invert);

			var _filterData4 = filterData(fullData, newDomain, xAccessor, initialXScale, this.hackyWayToStopPanBeyondBounds__plotData, this.hackyWayToStopPanBeyondBounds__domain),
			    beforePlotData = _filterData4.plotData,
			    domain = _filterData4.domain;

			var updatedScale = initialXScale.copy().domain(domain);
			var plotData = postCalculator(beforePlotData);
			// console.log(last(plotData));

			var currentItem = getCurrentItem(updatedScale, xAccessor, mouseXY, plotData);
			var chartConfig = getChartConfigWithUpdatedYScales(initialChartConfig, { plotData: plotData, xAccessor: xAccessor, displayXAccessor: displayXAccessor, fullData: fullData }, updatedScale.domain(), dy, chartsToPan);
			var currentCharts = getCurrentCharts(chartConfig, mouseXY);

			// console.log(initialXScale.domain(), newDomain, updatedScale.domain());
			return {
				xScale: updatedScale,
				plotData: plotData,
				chartConfig: chartConfig,
				mouseXY: mouseXY,
				currentCharts: currentCharts,
				currentItem: currentItem
			};
		}
	}, {
		key: "handlePan",
		value: function handlePan(mousePosition, panStartXScale, panOrigin, chartsToPan, e) {
			var _this4 = this;

			if (!this.waitingForPanAnimationFrame) {
				this.waitingForPanAnimationFrame = true;

				this.hackyWayToStopPanBeyondBounds__plotData = this.hackyWayToStopPanBeyondBounds__plotData || this.state.plotData;
				this.hackyWayToStopPanBeyondBounds__domain = this.hackyWayToStopPanBeyondBounds__domain || this.state.xScale.domain();

				var state = this.panHelper(mousePosition, panStartXScale, panOrigin, chartsToPan);

				this.hackyWayToStopPanBeyondBounds__plotData = state.plotData;
				this.hackyWayToStopPanBeyondBounds__domain = state.xScale.domain();

				this.panInProgress = true;
				// console.log(panStartXScale.domain(), state.xScale.domain())

				this.triggerEvent("pan", state, e);

				this.mutableState = {
					mouseXY: state.mouseXY,
					currentItem: state.currentItem,
					currentCharts: state.currentCharts
				};
				requestAnimationFrame(function () {

					_this4.waitingForPanAnimationFrame = false;
					_this4.clearBothCanvas();
					_this4.draw({ trigger: "pan" });
				});
			}
		}
	}, {
		key: "handleMouseDown",
		value: function handleMouseDown(mousePosition, currentCharts, e) {
			this.triggerEvent("mousedown", null, e);
		}
	}, {
		key: "handleMouseEnter",
		value: function handleMouseEnter(e) {
			this.triggerEvent("mouseenter", {
				show: true
			}, e);
		}
	}, {
		key: "handleMouseMove",
		value: function handleMouseMove(mouseXY, inputType, e) {
			var _this5 = this;

			if (!this.waitingForAnimationFrame) {
				this.waitingForAnimationFrame = true;

				var _state6 = this.state,
				    chartConfig = _state6.chartConfig,
				    plotData = _state6.plotData,
				    xScale = _state6.xScale,
				    xAccessor = _state6.xAccessor;

				var currentCharts = getCurrentCharts(chartConfig, mouseXY);
				var currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);
				this.triggerEvent("mousemove", {
					show: true,
					mouseXY: mouseXY,
					// prevMouseXY is used in interactive components
					prevMouseXY: this.prevMouseXY,
					currentItem: currentItem,
					currentCharts: currentCharts
				}, e);

				this.prevMouseXY = mouseXY;
				this.mutableState = {
					mouseXY: mouseXY,
					currentItem: currentItem,
					currentCharts: currentCharts
				};

				requestAnimationFrame(function () {
					_this5.clearMouseCanvas();
					_this5.draw({ trigger: "mousemove" });
					_this5.waitingForAnimationFrame = false;
				});
			}
		}
	}, {
		key: "handleMouseLeave",
		value: function handleMouseLeave(e) {
			this.triggerEvent("mouseleave", { show: false }, e);
			this.clearMouseCanvas();
			this.draw({ trigger: "mouseleave" });
		}
	}, {
		key: "handleDragStart",
		value: function handleDragStart(mousePosition, e) {
			this.triggerEvent("dragstart", { mousePosition: mousePosition }, e);
		}
	}, {
		key: "handleDrag",
		value: function handleDrag(_ref2, e) {
			var _this6 = this;

			var startPos = _ref2.startPos,
			    mouseXY = _ref2.mouseXY;
			var _state7 = this.state,
			    chartConfig = _state7.chartConfig,
			    plotData = _state7.plotData,
			    xScale = _state7.xScale,
			    xAccessor = _state7.xAccessor;

			var currentCharts = getCurrentCharts(chartConfig, mouseXY);
			var currentItem = getCurrentItem(xScale, xAccessor, mouseXY, plotData);

			this.triggerEvent("drag", {
				startPos: startPos,
				mouseXY: mouseXY,
				currentItem: currentItem,
				currentCharts: currentCharts
			}, e);

			requestAnimationFrame(function () {
				_this6.clearMouseCanvas();
				_this6.draw({ trigger: "drag" });
			});
		}
	}, {
		key: "handleDragEnd",
		value: function handleDragEnd(mousePosition, e) {
			var _this7 = this;

			this.triggerEvent("dragend", { mousePosition: mousePosition }, e);

			requestAnimationFrame(function () {
				_this7.clearMouseCanvas();
				_this7.draw({ trigger: "dragend" });
			});
		}
	}, {
		key: "handleClick",
		value: function handleClick(mousePosition, e) {
			var _this8 = this;

			this.triggerEvent("click", {}, e);

			requestAnimationFrame(function () {
				_this8.clearMouseCanvas();
				_this8.draw({ trigger: "click" });
			});
		}
	}, {
		key: "handleDoubleClick",
		value: function handleDoubleClick(mousePosition, e) {
			this.triggerEvent("dblclick", {}, e);
		}
	}, {
		key: "handlePanEnd",
		value: function handlePanEnd(mousePosition, panStartXScale, panOrigin, chartsToPan, e) {
			var _this9 = this;

			var state = this.panHelper(mousePosition, panStartXScale, panOrigin, chartsToPan);
			// console.log(this.canvasDrawCallbackList.map(d => d.type));
			this.hackyWayToStopPanBeyondBounds__plotData = null;
			this.hackyWayToStopPanBeyondBounds__domain = null;

			this.panInProgress = false;

			// console.log("PANEND", panEnd++);
			var xScale = state.xScale,
			    plotData = state.plotData,
			    chartConfig = state.chartConfig;


			this.triggerEvent("panend", state, e);

			requestAnimationFrame(function () {
				var xAccessor = _this9.state.xAccessor;
				var fullData = _this9.fullData;


				var firstItem = first(fullData);
				var start = first(xScale.domain());
				var end = xAccessor(firstItem);
				// console.log(start, end, start < end ? "Load more" : "I have it");

				var onLoadMore = _this9.props.onLoadMore;


				_this9.clearThreeCanvas();

				_this9.setState({
					xScale: xScale,
					plotData: plotData,
					chartConfig: chartConfig
				}, function () {
					if (start < end) onLoadMore(start, end);
				});
			});
		}
	}, {
		key: "getChildContext",
		value: function getChildContext() {
			var dimensions = getDimensions(this.props);
			return {
				fullData: this.fullData,
				plotData: this.state.plotData,
				width: dimensions.width,
				height: dimensions.height,
				chartConfig: this.state.chartConfig,
				xScale: this.state.xScale,
				xAccessor: this.state.xAccessor,
				displayXAccessor: this.state.displayXAccessor,
				chartCanvasType: this.props.type,
				margin: this.props.margin,
				ratio: this.props.ratio,
				xAxisZoom: this.xAxisZoom,
				yAxisZoom: this.yAxisZoom,
				getCanvasContexts: this.getCanvasContexts,
				redraw: this.redraw,
				subscribe: this.subscribe,
				unsubscribe: this.unsubscribe,
				generateSubscriptionId: this.generateSubscriptionId,
				getMutableState: this.getMutableState,
				amIOnTop: this.amIOnTop,
				setCursorClass: this.setCursorClass
			};
		}
	}, {
		key: "componentWillMount",
		value: function componentWillMount() {
			var _resetChart = resetChart(this.props, true),
			    fullData = _resetChart.fullData,
			    state = _objectWithoutProperties(_resetChart, ["fullData"]);

			this.setState(state);
			this.fullData = fullData;
		}
	}, {
		key: "componentWillReceiveProps",
		value: function componentWillReceiveProps(nextProps) {
			var reset = shouldResetChart(this.props, nextProps);

			var interaction = isInteractionEnabled(this.state.xScale, this.state.xAccessor, this.state.plotData);

			var newState = void 0;
			if (!interaction || reset || !shallowEqual(this.props.xExtents, nextProps.xExtents)) {
				if (process.env.NODE_ENV !== "production") {
					if (!interaction) log("RESET CHART, changes to a non interactive chart");else if (reset) log("RESET CHART, one or more of these props changed", CANDIDATES_FOR_RESET);else log("xExtents changed");
				}
				// do reset
				newState = resetChart(nextProps);
			} else {
				var _state$xScale$domain = this.state.xScale.domain(),
				    _state$xScale$domain2 = _slicedToArray(_state$xScale$domain, 2),
				    start = _state$xScale$domain2[0],
				    end = _state$xScale$domain2[1];

				var prevLastItem = last(this.fullData);

				var calculatedState = calculateFullData(nextProps);
				var xAccessor = calculatedState.xAccessor;

				var lastItemWasVisible = xAccessor(prevLastItem) <= end && xAccessor(prevLastItem) >= start;

				if (process.env.NODE_ENV !== "production") {
					if (this.props.data !== nextProps.data) log("data is changed but seriesName did not, change the seriesName if you wish to reset the chart and lastItemWasVisible = ", lastItemWasVisible);else log("Trivial change, may be width/height or type changed, but that does not matter");
				}
				newState = updateChart(calculatedState, this.state.xScale, nextProps, lastItemWasVisible);
			}

			var _newState = newState,
			    fullData = _newState.fullData,
			    state = _objectWithoutProperties(_newState, ["fullData"]);

			var initialChartConfig = this.state.chartConfig;


			if (this.panInProgress) {
				if (process.env.NODE_ENV !== "production") {
					log("Pan is in progress");
				}
			} else {
				if (!reset) {
					state.chartConfig.forEach(function (each) {
						var sourceChartConfig = initialChartConfig.filter(function (d) {
							return d.id === each.id;
						});
						if (sourceChartConfig.length > 0 && sourceChartConfig[0].yPanEnabled) {
							each.yScale.domain(sourceChartConfig[0].yScale.domain());
							each.yPanEnabled = sourceChartConfig[0].yPanEnabled;
						}
					});
				}
				this.clearThreeCanvas();

				this.setState(state);
			}
			this.fullData = fullData;
		}
	}, {
		key: "resetYDomain",
		value: function resetYDomain(chartId) {
			var chartConfig = this.state.chartConfig;

			var changed = false;
			var newChartConfig = chartConfig.map(function (each) {
				if ((isNotDefined(chartId) || each.id === chartId) && !shallowEqual(each.yScale.domain(), each.realYDomain)) {
					changed = true;
					return _extends({}, each, {
						yScale: each.yScale.domain(each.realYDomain),
						yPanEnabled: false
					});
				}
				return each;
			});

			if (changed) {
				this.clearThreeCanvas();
				this.setState({
					chartConfig: newChartConfig
				});
			}
		}
	}, {
		key: "shouldComponentUpdate",
		value: function shouldComponentUpdate() {
			return !this.panInProgress;
		}
	}, {
		key: "render",
		value: function render() {
			var _props = this.props,
			    type = _props.type,
			    height = _props.height,
			    width = _props.width,
			    margin = _props.margin,
			    className = _props.className,
			    zIndex = _props.zIndex,
			    defaultFocus = _props.defaultFocus,
			    ratio = _props.ratio,
			    mouseMoveEvent = _props.mouseMoveEvent,
			    panEvent = _props.panEvent,
			    zoomEvent = _props.zoomEvent;
			var _props2 = this.props,
			    useCrossHairStyleCursor = _props2.useCrossHairStyleCursor,
			    drawMode = _props2.drawMode,
			    onSelect = _props2.onSelect;
			var _state8 = this.state,
			    plotData = _state8.plotData,
			    xScale = _state8.xScale,
			    xAccessor = _state8.xAccessor,
			    chartConfig = _state8.chartConfig;

			var dimensions = getDimensions(this.props);

			var interaction = isInteractionEnabled(xScale, xAccessor, plotData);

			var cursor = getCursorStyle(useCrossHairStyleCursor && interaction);
			return React.createElement(
				"div",
				{ style: { position: "relative", width: width, height: height }, className: className, onClick: onSelect },
				React.createElement(CanvasContainer, { ref: this.saveCanvasContainerNode,
					type: type,
					ratio: ratio,
					width: width, height: height, zIndex: zIndex }),
				React.createElement(
					"svg",
					{ className: className, width: width, height: height, style: { position: "absolute", zIndex: zIndex + 5 } },
					cursor,
					React.createElement(
						"defs",
						null,
						React.createElement(
							"clipPath",
							{ id: "chart-area-clip" },
							React.createElement("rect", { x: "0", y: "0", width: dimensions.width, height: dimensions.height })
						),
						chartConfig.map(function (each, idx) {
							return React.createElement(
								"clipPath",
								{ key: idx, id: "chart-area-clip-" + each.id },
								React.createElement("rect", { x: "0", y: "0", width: each.width, height: each.height })
							);
						})
					),
					React.createElement(
						"g",
						{ transform: "translate(" + (margin.left + 0.5) + ", " + (margin.top + 0.5) + ")" },
						React.createElement(EventCapture, {
							ref: this.saveEventCaptureNode,
							mouseMove: mouseMoveEvent && interaction,
							zoom: zoomEvent && interaction,
							pan: panEvent && interaction && !drawMode,

							width: dimensions.width,
							height: dimensions.height,
							chartConfig: chartConfig,
							xScale: xScale,
							xAccessor: xAccessor,
							focus: defaultFocus,

							isSomethingSelectedAndHovering: this.isSomethingSelectedAndHovering,
							onContextMenu: this.handleContextMenu,
							onClick: this.handleClick,
							onDoubleClick: this.handleDoubleClick,
							onMouseDown: this.handleMouseDown,
							onMouseMove: this.handleMouseMove,
							onMouseEnter: this.handleMouseEnter,
							onMouseLeave: this.handleMouseLeave,

							onDragStart: this.handleDragStart,
							onDrag: this.handleDrag,
							onDragComplete: this.handleDragEnd,

							onZoom: this.handleZoom,
							onPinchZoom: this.handlePinchZoom,
							onPinchZoomEnd: this.handlePinchZoomEnd,
							onPan: this.handlePan,
							onPanEnd: this.handlePanEnd
						}),
						React.createElement(
							"g",
							{ className: "react-stockcharts-avoid-interaction" },
							this.props.children
						)
					)
				)
			);
		}
	}]);

	return ChartCanvas;
}(Component);

function isInteractionEnabled(xScale, xAccessor, data) {
	var interaction = !isNaN(xScale(xAccessor(first(data)))) && isDefined(xScale.invert);
	return interaction;
}

ChartCanvas.propTypes = {
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	margin: PropTypes.object,
	ratio: PropTypes.number.isRequired,
	// interval: PropTypes.oneOf(["D", "W", "M"]), // ,"m1", "m5", "m15", "W", "M"
	type: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
	pointsPerPxThreshold: PropTypes.number,
	data: PropTypes.array.isRequired,
	// initialDisplay: PropTypes.number,
	xAccessor: PropTypes.func,
	xExtents: PropTypes.oneOfType([PropTypes.array, PropTypes.func]).isRequired,
	// xScale: PropTypes.func.isRequired,
	className: PropTypes.string,
	seriesName: PropTypes.string.isRequired,
	zIndex: PropTypes.number,
	children: PropTypes.node.isRequired,
	xScale: PropTypes.func.isRequired,
	postCalculator: PropTypes.func.isRequired,
	flipXScale: PropTypes.bool.isRequired,
	useCrossHairStyleCursor: PropTypes.bool.isRequired,
	drawMode: PropTypes.bool.isRequired,
	padding: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
		left: PropTypes.number,
		right: PropTypes.number
	})]).isRequired,
	defaultFocus: PropTypes.bool,
	zoomMultiplier: PropTypes.number.isRequired,
	onLoadMore: PropTypes.func,
	displayXAccessor: function displayXAccessor(props, propName /* , componentName */) {
		if (isNotDefined(props[propName])) {
			console.warn("`displayXAccessor` is not defined," + " will use the value from `xAccessor` as `displayXAccessor`." + " This might be ok if you do not use a discontinuous scale" + " but if you do, provide a `displayXAccessor` prop to `ChartCanvas`");
		} else if (typeof props[propName] !== "function") {
			return new Error("displayXAccessor has to be a function");
		}
	},
	mouseMoveEvent: PropTypes.bool.isRequired,
	panEvent: PropTypes.bool.isRequired,
	clamp: PropTypes.bool.isRequired,
	zoomEvent: PropTypes.bool.isRequired,
	onSelect: PropTypes.func
};

ChartCanvas.defaultProps = {
	margin: { top: 20, right: 30, bottom: 30, left: 80 },
	type: "hybrid",
	pointsPerPxThreshold: 2,
	className: "react-stockchart",
	zIndex: 1,
	xExtents: [min, max],
	postCalculator: identity,
	padding: 0,
	xAccessor: identity,
	flipXScale: false,
	useCrossHairStyleCursor: true,
	drawMode: false,
	defaultFocus: true,
	onLoadMore: noop,
	onSelect: noop,
	mouseMoveEvent: true,
	panEvent: true,
	zoomEvent: true,
	zoomMultiplier: 1.1,
	clamp: false
	// ratio: 2,
};

ChartCanvas.childContextTypes = {
	plotData: PropTypes.array,
	fullData: PropTypes.array,
	chartConfig: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.number.isRequired,
		origin: PropTypes.arrayOf(PropTypes.number).isRequired,
		padding: PropTypes.oneOfType([PropTypes.number, PropTypes.shape({
			top: PropTypes.number,
			bottom: PropTypes.number
		})]),
		yExtents: PropTypes.arrayOf(PropTypes.func),
		yExtentsProvider: PropTypes.func,
		yScale: PropTypes.func.isRequired,
		mouseCoordinates: PropTypes.shape({
			at: PropTypes.string,
			format: PropTypes.func
		}),
		width: PropTypes.number.isRequired,
		height: PropTypes.number.isRequired
	})).isRequired,
	xScale: PropTypes.func.isRequired,
	xAccessor: PropTypes.func.isRequired,
	displayXAccessor: PropTypes.func.isRequired,
	width: PropTypes.number.isRequired,
	height: PropTypes.number.isRequired,
	chartCanvasType: PropTypes.oneOf(["svg", "hybrid"]).isRequired,
	margin: PropTypes.object.isRequired,
	ratio: PropTypes.number.isRequired,
	getCanvasContexts: PropTypes.func,
	xAxisZoom: PropTypes.func,
	yAxisZoom: PropTypes.func,
	amIOnTop: PropTypes.func,
	redraw: PropTypes.func,
	subscribe: PropTypes.func,
	unsubscribe: PropTypes.func,
	setCursorClass: PropTypes.func,
	generateSubscriptionId: PropTypes.func,
	getMutableState: PropTypes.func
};

ChartCanvas.ohlcv = function (d) {
	return { date: d.date, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume };
};

export default ChartCanvas;