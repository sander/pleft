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
 * @fileoverview The language select tool for Pleft.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.languageSelect');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.ui.Component.EventType');

/**
 * Initializes the language select tool on the current page.
 */
pleft.languageSelect.init = function() {
  var elt = goog.dom.getElement('language-select');

  goog.events.listen(elt, goog.ui.Component.EventType.CHANGE, function() {
    goog.dom.getElement('language-next').value = window.location.href;
    goog.dom.getElement('language-form').submit();
  });
};
