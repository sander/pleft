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
 * @fileoverview Makes an HTML textarea automatically vertically expandable.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.autoexpand');

goog.require('goog.events');

// TODO Create a proper Closure control for this.

/**
 * Makes the textarea automatically expandable.
 * 
 * @param {HTMLTextAreaElement} element Textarea to make expandable.
 */
pleft.autoexpand.install = function(element) {
  element.style.resize = 'none';
  element.style.overflow = 'hidden';

  var original = element.clientHeight;

  var test = document.createElement('div');
  test.innerHTML = 'a';
  test.style.position = 'absolute';
  test.style.left = '-99999px';
  test.style.top = '0px';
  document.body.appendChild(test);
  var lineHeight = test.clientHeight;
  document.body.removeChild(test);

  element.style.lineHeight = lineHeight + 'px';
  element.style.height = 2 * lineHeight + 'px';

  // Catch WebKit / Mozilla inconsistency with scrollHeight.
  var includePadding = element.scrollHeight == 2 * lineHeight;

  // TODO(sander) Use element.style.paddingTop and paddingBottom instead.
  if (!includePadding)
    var padding = 8;

  var data = {
    original: original,
    includePadding: includePadding,
    padding: padding
  };

  goog.events.listen(element, goog.events.EventType.KEYUP,
      pleft.autoexpand.handleKeyEvent_, false, data);
};

/**
 * Handles the KEYUP event on the textarea.
 * 
 * @param {goog.events.KeyEvent} e Key event to handle.
 * @return {boolean} Whether the key event was handled.
 * @this Object
 * @private
 */
pleft.autoexpand.handleKeyEvent_ = function(e) {
  var original = this.original;
  var includePadding = this.includePadding;
  var padding = this.padding;

  if (e.target.scrollHeight > original) {
    e.target.style.height = original + 'px';

    var height = e.target.scrollHeight;
    if (!includePadding)
      height -= padding;

    e.target.style.height = height + 'px';
  }

  return false;
};
