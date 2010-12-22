// Copyright 2009, 2010 Sander Dijkhuis <sander.dijkhuis@gmail.com>
//
// This file is part of Pleft.
//
// Pleft is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Pleft is distributed in the hope that it will be useful, but
// WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Pleft. If not, see <http://www.gnu.org/licenses/>.

/**
 * @fileoverview Custom DOM effects. At the moment only a margin animation is
 * available.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

// Idea: Use CSS animations in WebKit:
//       http://ejohn.org/blog/css-animations-and-javascript/

goog.provide('pleft.fx.Margin');

goog.require('goog.fx.dom.PredefinedEffect');

/**
 * Creates an animation object that will change the top and left margin of an
 * element.
 *
 * @constructor
 * @param {Element} element DOM node to be animate.
 * @param {Array.<number>} start 2D array for start coordinates (top, left).
 * @param {Array.<number>} end 2D array for end coordinates (top, left).
 * @param {number} time Length of the animation in milliseconds.
 * @param {Function=} opt_acc Acceleration function, returns 0-1 for inputs 0-1.
 */
pleft.fx.Margin = function(element, start, end, time, opt_acc) {
  if (start.length != 2 || end.length != 2) {
    throw Error('Start and end points must be 2D');
  }
  goog.fx.dom.PredefinedEffect.apply(this, arguments);
};
goog.inherits(pleft.fx.Margin, goog.fx.dom.PredefinedEffect);

/** @inheritDoc */
pleft.fx.Margin.prototype.updateStyle = function() {
  this.element.style.marginLeft = Math.round(this.coords[0]) + 'px';
  this.element.style.marginTop = Math.round(this.coords[1]) + 'px';
};
