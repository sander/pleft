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
//
//
// Uses code from Closure Library.
//
// Copyright 2007 Google Inc. All Rights Reserved.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview A class that supports single selection from a menu, with
 * semantics similar to the native HTML <code>&lt;select size&gt;</code>
 * element.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.ui.SelectMenu');

goog.require('goog.ui.Component');
goog.require('goog.ui.Menu');
goog.require('goog.ui.SelectionModel');
goog.require('pleft.ui.SelectMenuRenderer');

/**
 * A class that supports single selection from a menu.
 *
 * @param {goog.dom.DomHelper=} opt_domHelper Optional DOM helper.
 * @param {pleft.ui.SelectMenuRenderer=} opt_renderer Renderer used to render or
 *     decorate the container; defaults to {@link pleft.ui.SelectMenuRenderer}.
 * @constructor
 * @extends {goog.ui.Menu}
 */
pleft.ui.SelectMenu = function(opt_domHelper, opt_renderer) {
  goog.ui.Menu.call(this, opt_domHelper, opt_renderer ||
                    pleft.ui.SelectMenuRenderer.getInstance());

  this.selectionModel_ = new goog.ui.SelectionModel();

  var handler = this.getHandler();
  handler.listen(this, goog.ui.Component.EventType.ACTION,
      this.handleMenuAction);
};
goog.inherits(pleft.ui.SelectMenu, goog.ui.Menu);

/**
 * The selection model controlling the items in the menu.
 * @type {goog.ui.SelectionModel}
 * @private
 */
pleft.ui.SelectMenu.prototype.selectionModel_ = null;

/** @inheritDoc */
pleft.ui.SelectMenu.prototype.disposeInternal = function() {
  pleft.ui.SelectMenu.superClass_.disposeInternal.call(this);

  if (this.selectionModel_) {
    this.selectionModel_.dispose();
    this.selectionModel_ = null;
  }
};

/**
 * Handles {@link goog.ui.Component.EventType.ACTION} events dispatched by
 * the menu item clicked by the user.  Updates the selection model, stops
 * the propagation of the event, and dispatches an ACTION event on behalf
 * of the select control itself.
 * Overrides {@link goog.ui.MenuButton#handleMenuAction}.
 * @param {goog.events.Event} e Action event to handle.
 */
pleft.ui.SelectMenu.prototype.handleMenuAction = function(e) {
  this.setSelectedItem(/** @type {goog.ui.MenuItem} */ (e.target));
  e.stopPropagation();
  this.dispatchEvent('change');
};

/**
 * Adds a new menu item at the end of the menu and makes it selectable.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to
 *     the menu.
 * @deprecated Use {@link #addChild} instead.
 */
pleft.ui.SelectMenu.prototype.addItem = function(item) {
  pleft.ui.SelectMenu.superClass_.addItem.call(this, item);

  this.selectionModel_.addItem(item);

  item.setSelectable(true);
};

/**
 * Adds a new menu item at a specific index in the menu and makes it
 *     selectable.
 * @param {goog.ui.MenuItem|goog.ui.MenuSeparator} item Menu item to add to the
 *     menu.
 * @param {number} index Index at which to insert the menu item.
 */
pleft.ui.SelectMenu.prototype.addItemAt = function(item, index) {
  goog.ui.SelectMenu.superClass_.addItemAt.call(this, item, index);

  this.selectionModel_.addItemAt(item, index);

  item.setSelectable(true);
};

/**
 * Removes an item from the menu and disposes it.
 * @param {goog.ui.MenuItem} item The menu item to remove.
 */
pleft.ui.SelectMenu.prototype.removeItem = function(item) {
  pleft.ui.SelectMenu.superClass_.removeItem.call(this, item);
  this.selectionModel_.removeItem(item);
};

/**
 * Removes a menu item at a given index in the menu and disposes it.
 * @param {number} index Index of item.
 */
pleft.ui.SelectMenu.prototype.removeItemAt = function(index) {
  pleft.ui.SelectMenu.superClass_.removeItemAt.call(this, index);
  this.selectionModel_.removeItemAt(index);
};

/**
 * Selects the specified option (assumed to be in the select menu), and
 * deselects the previously selected option, if any.  A null argument clears
 * the selection.
 * @param {goog.ui.MenuItem} item Option to be selected (null to clear
 *     the selection).
 */
pleft.ui.SelectMenu.prototype.setSelectedItem = function(item) {
  this.selectionModel_.setSelectedItem(item);
};

/**
 * Selects the option at the specified index, or clears the selection if the
 * index is out of bounds.
 * @param {number} index Index of the option to be selected.
 */
pleft.ui.SelectMenu.prototype.setSelectedIndex = function(index) {
  this.setSelectedItem(
      /** @type {goog.ui.MenuItem} */ (this.selectionModel_.getItemAt(index)));
};

/**
 * Returns the currently selected option.
 * @return {goog.ui.MenuItem} The currently selected option (null if none).
 */
pleft.ui.SelectMenu.prototype.getSelectedItem = function() {
  return /** @type {goog.ui.MenuItem} */ (
      this.selectionModel_.getSelectedItem());
};

/**
 * Returns the index of the currently selected option.
 * @return {number} 0-based index of the currently selected option (-1 if none).
 */
pleft.ui.SelectMenu.prototype.getSelectedIndex = function() {
  return this.selectionModel_.getSelectedIndex();
};

/**
 * @return {goog.ui.SelectionModel} The selection model.
 * @protected
 */
pleft.ui.SelectMenu.prototype.getSelectionModel = function() {
  return this.selectionModel_;
};
