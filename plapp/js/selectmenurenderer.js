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
 * @fileoverview Default renderer for {@link pleft.ui.SelectMenu}s.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.ui.SelectMenuRenderer');

goog.require('goog.ui.MenuRenderer');

/**
 * Default renderer for {@link pleft.ui.SelectMenu}S.
 *
 * @constructor
 * @extends {goog.ui.MenuRenderer}
 */
pleft.ui.SelectMenuRenderer = function() {
  goog.ui.MenuRenderer.call(this);
};
goog.inherits(pleft.ui.SelectMenuRenderer, goog.ui.MenuRenderer);
goog.addSingletonGetter(pleft.ui.SelectMenuRenderer);

/**
 * Default CSS class to be applied to the root element of menus rendered by this
 * renderer.
 *
 * @type {string}
 */
pleft.ui.SelectMenuRenderer.CSS_CLASS = goog.getCssName('pleft-selectmenu');

/**
 * Returns the CSS class to be applied to the root element of menus rendered by
 * this renderer.
 *
 * @return {string} Renderer-specific CSS class.
 */
pleft.ui.SelectMenuRenderer.prototype.getCssClass = function() {
  return pleft.ui.SelectMenuRenderer.CSS_CLASS;
};
