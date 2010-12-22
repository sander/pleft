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
 * @fileoverview Basic functionality for almost-static Pleft pages.
 * Drag-and-drop is disabled and the Account Bar is initialized.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.main');

goog.require('pleft.accountBar');
goog.require('pleft.languageSelect');

/**
 * Initializes the page scripts.
 */
pleft.main.init = function() {
  function prevent(event) {
    event.preventDefault();
  };
  goog.events.listen(document.body, goog.events.EventType.DRAGSTART, prevent);

  pleft.accountBar.init();
  pleft.languageSelect.init();
};

goog.exportSymbol('pleft.main.init', pleft.main.init);
