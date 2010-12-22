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
 * @fileoverview The Account Bar for Plapp.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.accountBar');

goog.require('goog.debug.ErrorHandler');
goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.positioning.Corner');
goog.require('goog.string');
goog.require('goog.string.StringBuffer');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuSeparator');
goog.require('goog.ui.PopupMenu');
goog.require('goog.Uri');

/**
 * Initializes the Account Bar on the current page.
 */
pleft.accountBar.init = function() {
  var container = document.body;

  if (window['signedIn'] === true) {
    var email = window['email'];
  } else {
    var email = null;
  }

  var bar = pleft.accountBar.render_(email);
  container.insertBefore(bar, container.firstChild);

  if (window['signedIn'] === true) {
    var menuButton = document.getElementById('ab-menu');

    var menu = new goog.ui.PopupMenu();

    var loading = new goog.ui.MenuItem(gettext('Loading…'));
    loading.setEnabled(false);
    menu.addItem(loading);

    var isLoading = true;
    goog.events.listen(menu, goog.ui.Component.EventType.BEFORE_SHOW, function(e) {
        if (!isLoading)
          return;
        
        goog.net.XhrIo.send('/menu', function(event) {
            if (event.target.getStatus() == 200) {
              var data = event.target.getResponseJson()['a'];
              for (var i = 0; i < data.length; i++) {
                var item = new goog.ui.MenuItem(data[i][1], '/a#id=' + data[i][0]);
                menu.addItemAt(item, 0);
                menu.hide();
                menu.setVisible(true);
              }
            } else {
              var fail = new goog.ui.MenuItem(gettext('Menu temporarily unavailaible.'));
              fail.setEnabled(false);
              menu.addItemAt(fail, 0);
            }
            if (isLoading) {
              menu.removeItem(loading);
              isLoading = false;
            }
          });
      });

    menu.addItem(new goog.ui.MenuSeparator());
    menu.addItem(new goog.ui.MenuItem(gettext('All appointments'),
                                      '/appointments'));
    menu.addItem(new goog.ui.MenuItem(gettext('New appointment'),
                                      '/'));

    menu.render(document.body);
    menu.attach(menuButton, goog.positioning.Corner.BOTTOM_RIGHT,
                goog.positioning.Corner.TOP_RIGHT);

    goog.events.listen(menu, goog.ui.Component.EventType.ACTION, function(e) {
        window.location = e.target.getModel();
    });
  } else {
    bar.style.display = 'none';
  }
};

/**
 * Creates and returns an Account Bar DOM element.
 * 
 * @param {string} email User’s email address.
 * @return {Node} Account Bar's DOM element.
 * @private
 */
pleft.accountBar.render_ = function(email) {
  var output = new goog.string.StringBuffer();
  output.append('<div id=ab-bar>');
  if (email) {
    output.append('<span id=ab-email>',
                  goog.string.htmlEscape(email),
                  '</span><a id=ab-menu href=\'javascript:void(0)\'>',
                  gettext('My appointments'),
                  '</a>');
    output.append('<a id=ab-signout href=\'/signout\'>',
                  gettext('Sign out'),
                  '</a>');
  }
  output.append('</div>');

  return goog.dom.htmlToDocumentFragment(output.toString());
};
