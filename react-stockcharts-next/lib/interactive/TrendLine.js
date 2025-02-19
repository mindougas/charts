"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require("react");

var _react2 = _interopRequireDefault(_react);

var _propTypes = require("prop-types");

var _propTypes2 = _interopRequireDefault(_propTypes);

var _utils = require("../utils");

var _utils2 = require("./utils");

var _EachTrendLine = require("./hoc/EachTrendLine");

var _EachTrendLine2 = _interopRequireDefault(_EachTrendLine);

var _StraightLine = require("./components/StraightLine");

var _StraightLine2 = _interopRequireDefault(_StraightLine);

var _MouseLocationIndicator = require("./components/MouseLocationIndicator");

var _MouseLocationIndicator2 = _interopRequireDefault(_MouseLocationIndicator);

var _HoverTextNearMouse = require("./components/HoverTextNearMouse");

var _HoverTextNearMouse2 = _interopRequireDefault(_HoverTextNearMouse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var TrendLine = function (_Component) {
	_inherits(TrendLine, _Component);

	function TrendLine(props) {
		_classCallCheck(this, TrendLine);

		var _this = _possibleConstructorReturn(this, (TrendLine.__proto__ || Object.getPrototypeOf(TrendLine)).call(this, props));

		_this.handleStartAndEnd = _this.handleStartAndEnd.bind(_this);
		_this.handleDrawLine = _this.handleDrawLine.bind(_this);
		_this.handleDragLine = _this.handleDragLine.bind(_this);
		_this.handleDragLineComplete = _this.handleDragLineComplete.bind(_this);

		_this.state = {};
		return _this;
	}

	_createClass(TrendLine, [{
		key: "terminate",
		value: function terminate() {
			this.setState({
				current: null,
				override: null
			});
		}
	}, {
		key: "handleDragLine",
		value: function handleDragLine(index, newXYValue) {
			this.setState({
				override: _extends({
					index: index
				}, newXYValue)
			});
		}
	}, {
		key: "handleDragLineComplete",
		value: function handleDragLineComplete() {
			var _this2 = this;

			var override = this.state.override;

			if ((0, _utils.isDefined)(override)) {
				var trends = this.props.trends;

				var newTrends = trends.map(function (each, idx) {
					return idx === override.index ? {
						start: [override.x1Value, override.y1Value],
						end: [override.x2Value, override.y2Value]
					} : each;
				});
				this.setState({
					override: null
				}, function () {
					_this2.props.onComplete(newTrends);
				});
			}
		}
	}, {
		key: "handleDrawLine",
		value: function handleDrawLine(xyValue) {
			var current = this.state.current;


			if ((0, _utils.isDefined)(current) && (0, _utils.isDefined)(current.start)) {
				this.setState({
					current: {
						start: current.start,
						end: xyValue
					}
				});
			}
		}
	}, {
		key: "handleStartAndEnd",
		value: function handleStartAndEnd(xyValue) {
			var _this3 = this;

			var current = this.state.current;
			var trends = this.props.trends;


			if ((0, _utils.isNotDefined)(current) || (0, _utils.isNotDefined)(current.start)) {
				this.setState({
					current: {
						start: xyValue,
						end: null
					}
				}, function () {
					_this3.props.onStart();
				});
			} else {
				this.setState({
					current: null
				}, function () {
					var newTrends = trends.concat({ start: current.start, end: xyValue });
					_this3.props.onComplete(newTrends);
				});
			}
		}
	}, {
		key: "render",
		value: function render() {
			var _this4 = this;

			var _props = this.props,
			    stroke = _props.stroke,
			    opacity = _props.opacity,
			    strokeWidth = _props.strokeWidth,
			    trends = _props.trends;
			var _props2 = this.props,
			    enabled = _props2.enabled,
			    snap = _props2.snap,
			    shouldDisableSnap = _props2.shouldDisableSnap,
			    snapTo = _props2.snapTo,
			    type = _props2.type;
			var _props3 = this.props,
			    currentPositionRadius = _props3.currentPositionRadius,
			    currentPositionStroke = _props3.currentPositionStroke;
			var _props4 = this.props,
			    currentPositionOpacity = _props4.currentPositionOpacity,
			    currentPositionStrokeWidth = _props4.currentPositionStrokeWidth;
			var hoverText = this.props.hoverText;
			var _state = this.state,
			    current = _state.current,
			    override = _state.override;


			var tempLine = (0, _utils.isDefined)(current) && (0, _utils.isDefined)(current.end) ? _react2.default.createElement(_StraightLine2.default, { type: type,
				noHover: true,
				x1Value: current.start[0],
				y1Value: current.start[1],
				x2Value: current.end[0],
				y2Value: current.end[1],
				stroke: stroke,
				strokeWidth: strokeWidth,
				opacity: opacity }) : null;

			return _react2.default.createElement(
				"g",
				null,
				trends.map(function (each, idx) {
					return _react2.default.createElement(_EachTrendLine2.default, {
						key: idx,
						index: idx,
						type: type,
						x1Value: (0, _utils2.getValueFromOverride)(override, idx, "x1Value", each.start[0]),
						y1Value: (0, _utils2.getValueFromOverride)(override, idx, "y1Value", each.start[1]),
						x2Value: (0, _utils2.getValueFromOverride)(override, idx, "x2Value", each.end[0]),
						y2Value: (0, _utils2.getValueFromOverride)(override, idx, "y2Value", each.end[1]),
						stroke: stroke,
						strokeWidth: strokeWidth,
						opacity: opacity,
						hoverText: hoverText,
						onDrag: _this4.handleDragLine,
						onDragComplete: _this4.handleDragLineComplete,
						edgeInteractiveCursor: "react-stockcharts-move-cursor",
						lineInteractiveCursor: "react-stockcharts-move-cursor"
					});
				}),
				tempLine,
				_react2.default.createElement(_MouseLocationIndicator2.default, {
					enabled: enabled,
					snap: snap,
					shouldDisableSnap: shouldDisableSnap,
					snapTo: snapTo,
					r: currentPositionRadius,
					stroke: currentPositionStroke,
					opacity: currentPositionOpacity,
					strokeWidth: currentPositionStrokeWidth,
					onMouseDown: this.handleStartAndEnd,
					onMouseMove: this.handleDrawLine })
			);
		}
	}]);

	return TrendLine;
}(_react.Component);

TrendLine.propTypes = {
	snap: _propTypes2.default.bool.isRequired,
	enabled: _propTypes2.default.bool.isRequired,
	snapTo: _propTypes2.default.func.isRequired,
	shouldDisableSnap: _propTypes2.default.func.isRequired,
	onStart: _propTypes2.default.func.isRequired,
	onComplete: _propTypes2.default.func.isRequired,
	strokeWidth: _propTypes2.default.number.isRequired,
	currentPositionStroke: _propTypes2.default.string,
	currentPositionStrokeWidth: _propTypes2.default.number,
	currentPositionOpacity: _propTypes2.default.number,
	currentPositionRadius: _propTypes2.default.number,
	stroke: _propTypes2.default.string,
	opacity: _propTypes2.default.number,
	type: _propTypes2.default.oneOf(["XLINE", // extends from -Infinity to +Infinity
	"RAY", // extends to +/-Infinity in one direction
	"LINE"]),
	hoverText: _propTypes2.default.object.isRequired,

	endPointCircleFill: _propTypes2.default.string,
	endPointCircleRadius: _propTypes2.default.number,
	trends: _propTypes2.default.array.isRequired
};

TrendLine.defaultProps = {
	stroke: "#000000",
	type: "XLINE",
	opacity: 0.7,
	strokeWidth: 1,
	onStart: _utils.noop,
	onComplete: _utils.noop,
	shouldDisableSnap: function shouldDisableSnap(e) {
		return e.button === 2 || e.shiftKey;
	},
	currentPositionStroke: "#000000",
	currentPositionOpacity: 1,
	currentPositionStrokeWidth: 3,
	currentPositionRadius: 4,
	endPointCircleFill: "#000000",
	endPointCircleRadius: 5,
	trends: [],
	hoverText: _extends({}, _HoverTextNearMouse2.default.defaultProps, {
		enable: true,
		bgHeight: 18,
		bgWidth: 120,
		text: "Click to select object"
	})
};

exports.default = TrendLine;