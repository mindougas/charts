"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

import { scaleOrdinal, schemeCategory10 } from "d3-scale";
import { bisector } from "d3-array";
import noop from "./noop";

export { default as zipper } from "./zipper";
export { default as merge } from "./merge";
export { default as slidingWindow } from "./slidingWindow";
export { default as identity } from "./identity";
export { default as noop } from "./noop";
export { default as shallowEqual } from "./shallowEqual";
export { default as mappedSlidingWindow } from "./mappedSlidingWindow";
export { default as accumulatingWindow } from "./accumulatingWindow";
export { default as PureComponent } from "./PureComponent";

export * from "./barWidth";
export * from "./strokeDasharray";

export function getLogger(prefix) {
	var logger = noop;
	if (process.env.NODE_ENV !== "production") {
		logger = require("debug")("react-stockcharts:" + prefix);
	}
	return logger;
}

export function path() {
	var loc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

	var key = Array.isArray(loc) ? loc : [loc];
	var length = key.length;

	return function (obj, defaultValue) {
		if (length === 0) return isDefined(obj) ? obj : defaultValue;

		var index = 0;
		while (obj != null && index < length) {
			obj = obj[key[index++]];
		}
		return index === length ? obj : defaultValue;
	};
}

export function functor(v) {
	return typeof v === "function" ? v : function () {
		return v;
	};
}

export function getClosestItemIndexes2(array, value, accessor) {
	var left = bisector(accessor).left(array, value);
	left = Math.max(left - 1, 0);
	var right = Math.min(left + 1, array.length - 1);

	var item = accessor(array[left]);
	if (item >= value && item <= value) right = left;

	return { left: left, right: right };
}

export function degrees(radians) {
	return radians * 180 / Math.PI;
}

export function radians(degrees) {
	return degrees * Math.PI / 180;
}

export function getClosestValue(inputValue, currentValue) {
	var values = isArray(inputValue) ? inputValue : [inputValue];

	var diff = values.map(function (each) {
		return each - currentValue;
	}).reduce(function (diff1, diff2) {
		return Math.abs(diff1) < Math.abs(diff2) ? diff1 : diff2;
	});
	return currentValue + diff;
}

export function d3Window(node) {
	var d3win = node && (node.ownerDocument && node.ownerDocument.defaultView || node.document && node || node.defaultView);
	return d3win;
}

export var MOUSEENTER = "mouseenter.interaction";
export var MOUSELEAVE = "mouseleave.interaction";
export var MOUSEMOVE = "mousemove.pan";
export var MOUSEUP = "mouseup.pan";
export var TOUCHMOVE = "touchmove.pan";
export var TOUCHEND = "touchend.pan touchcancel.pan";

export function getTouchProps(touch) {
	if (!touch) return {};
	return {
		pageX: touch.pageX,
		pageY: touch.pageY,
		clientX: touch.clientX,
		clientY: touch.clientY
	};
}

export function getClosestItemIndexes(array, value, accessor, log) {
	var lo = 0,
	    hi = array.length - 1;
	while (hi - lo > 1) {
		var mid = Math.round((lo + hi) / 2);
		if (accessor(array[mid]) <= value) {
			lo = mid;
		} else {
			hi = mid;
		}
	}
	// for Date object === does not work, so using the <= in combination with >=
	// the same code works for both dates and numbers
	if (accessor(array[lo]).valueOf() === value.valueOf()) hi = lo;
	if (accessor(array[hi]).valueOf() === value.valueOf()) lo = hi;

	if (accessor(array[lo]) < value && accessor(array[hi]) < value) lo = hi;
	if (accessor(array[lo]) > value && accessor(array[hi]) > value) hi = lo;

	if (log) {}
	// console.log(lo, accessor(array[lo]), value, accessor(array[hi]), hi);
	// console.log(accessor(array[lo]), lo, value, accessor(array[lo]) >= value);
	// console.log(value, hi, accessor(array[hi]), accessor(array[lo]) <= value);

	// var left = value > accessor(array[lo]) ? lo : lo;
	// var right = gte(value, accessor(array[hi])) ? Math.min(hi + 1, array.length - 1) : hi;

	// console.log(value, accessor(array[left]), accessor(array[right]));
	return { left: lo, right: hi };
}

export function getClosestItem(array, value, accessor, log) {
	var _getClosestItemIndexe = getClosestItemIndexes(array, value, accessor, log),
	    left = _getClosestItemIndexe.left,
	    right = _getClosestItemIndexe.right;

	if (left === right) {
		return array[left];
	}

	var closest = Math.abs(accessor(array[left]) - value) < Math.abs(accessor(array[right]) - value) ? array[left] : array[right];
	if (log) {
		console.log(array[left], array[right], closest, left, right);
	}
	return closest;
}

export var overlayColors = scaleOrdinal(schemeCategory10);

export function head(array, accessor) {
	if (accessor && array) {
		var value = void 0;
		for (var i = 0; i < array.length; i++) {
			value = array[i];
			if (isDefined(accessor(value))) return value;
		}
		return undefined;
	}
	return array ? array[0] : undefined;
}

export function tail(array, accessor) {
	if (accessor && array) {
		return array.map(accessor).slice(1);
	}
	return array ? array.slice(1) : undefined;
}

export var first = head;

export function last(array, accessor) {
	if (accessor && array) {
		var value = void 0;
		for (var i = array.length - 1; i >= 0; i--) {
			value = array[i];
			if (isDefined(accessor(value))) return value;
		}
		return undefined;
	}
	var length = array ? array.length : 0;
	return length ? array[length - 1] : undefined;
}

export function isDefined(d) {
	return d !== null && typeof d != "undefined";
}

export function isNotDefined(d) {
	return !isDefined(d);
}

export function isObject(d) {
	return isDefined(d) && (typeof d === "undefined" ? "undefined" : _typeof(d)) === "object" && !Array.isArray(d);
}

export var isArray = Array.isArray;

export function touchPosition(touch, e) {
	var container = e.target,
	    rect = container.getBoundingClientRect(),
	    x = touch.clientX - rect.left - container.clientLeft,
	    y = touch.clientY - rect.top - container.clientTop,
	    xy = [Math.round(x), Math.round(y)];
	return xy;
}

export function mousePosition(e, defaultRect) {
	var container = e.currentTarget;
	var rect = defaultRect || container.getBoundingClientRect(),
	    x = e.clientX - rect.left - container.clientLeft,
	    y = e.clientY - rect.top - container.clientTop,
	    xy = [Math.round(x), Math.round(y)];
	return xy;
}

export function clearCanvas(canvasList, ratio) {
	canvasList.forEach(function (each) {
		each.setTransform(1, 0, 0, 1, 0, 0);
		each.clearRect(-1, -1, each.canvas.width + 2, each.canvas.height + 2);
		each.scale(ratio, ratio);
	});
}

export function capitalizeFirst(str) {
	return str.charAt(0).toUpperCase() + str.substring(1);
}

export function hexToRGBA(inputHex, opacity) {
	var hex = inputHex.replace("#", "");
	if (inputHex.indexOf("#") > -1 && (hex.length === 3 || hex.length === 6)) {

		var multiplier = hex.length === 3 ? 1 : 2;

		var r = parseInt(hex.substring(0, 1 * multiplier), 16);
		var g = parseInt(hex.substring(1 * multiplier, 2 * multiplier), 16);
		var b = parseInt(hex.substring(2 * multiplier, 3 * multiplier), 16);

		var result = "rgba(" + r + ", " + g + ", " + b + ", " + opacity + ")";

		return result;
	}
	return inputHex;
}