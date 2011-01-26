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
goog.require('goog.object');
goog.require('goog.string');
goog.require('goog.string.StringBuffer');
goog.require('goog.ui.CheckBoxMenuItem');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.FlatMenuButtonRenderer');
goog.require('goog.ui.Menu');
goog.require('goog.ui.MenuButton');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.MenuSeparator');
goog.require('goog.Uri');

/**
 * Initializes the Account Bar on the current page.
 */
pleft.accountBar.init = function() {
  var bar;

  // Base
  (function() {
    var base = new goog.string.StringBuffer();
    base.append('<div id=ab-bar>');
    if (window['signedIn'])
      base.append('<a id=ab-signout href=\'/signout\'>', gettext('Sign out'),
                  '</a><span id=ab-email>',
                  goog.string.htmlEscape(window['email']),
                  '</span>');
    base.append('</div>');

    bar = /** @type {Element } */ (
        goog.dom.htmlToDocumentFragment(base.toString()));
    document.body.insertBefore(bar, document.body.firstChild);
  })();

  // Main menu
  (function() {
    var menu = new goog.ui.Menu();

    menu.addItem(new goog.ui.MenuItem(gettext('New appointment'), '/'));
    menu.addItem(new goog.ui.MenuSeparator());
    menu.addItem(new goog.ui.MenuItem(gettext('About Pleft'), '/about'));

    // Add a link to Chrome Web Store if it's installed.
    if (window['chrome'] && window['chrome']['app']) {
      if (window['chrome']['app']['isInstalled'])
        var text = gettext('Write a review');
      else
        var text = gettext('Install Pleft in Chrome');
      menu.addItem(new goog.ui.MenuItem(text,
          'https://chrome.google.com/webstore/detail/' +
          'gaplcjgcfjoianghpkfkbgggdidedcid'));
    }

    menu.addItem(new goog.ui.MenuSeparator());

    var item = new goog.ui.MenuItem(gettext('Language'));
    item.setEnabled(false);
    menu.addItem(item);

    goog.object.every(window['languages'], function(name, id, object) {
      var item = new goog.ui.CheckBoxMenuItem(name, id);
      if (window['language'] == id)
        item.setChecked(true);
      menu.addItem(item);

      return true;
    });

    menu.addEventListener(goog.ui.Component.EventType.ACTION, function(e) {
      var value = e.target.getModel();
      if (!value) return;
      if (value == '/about' || value.indexOf('//') != -1)
        window.open(e.target.getModel());
      else if (value.substr(0, 1) == '/') window.location = e.target.getModel();
      else {
        var request = new goog.net.XhrIo();
        request.addEventListener(goog.net.EventType.COMPLETE, function(e) {
          window.location = window.location.href.replace('/a#', '/a?');
        });
        request.send('/i18n/setlang/', 'POST', 'language=' + value);

        document.body.style.cursor = 'wait';
      }
    });

    new goog.ui.MenuButton(goog.dom.htmlToDocumentFragment('<b>Pleft</b> ' +
                           gettext('the appointment planner')),
                           menu,
                           new goog.ui.FlatMenuButtonRenderer()).render(bar);
  })();

  // My appointments menu
  if (window['signedIn']) {
    (function() {
      var menu = new goog.ui.Menu();

      var isLoading = true;
      var loading = new goog.ui.MenuItem(gettext('Loading…'));
      loading.setEnabled(false);
      menu.addItem(loading);
      menu.addItem(new goog.ui.MenuSeparator());
      menu.addItem(new goog.ui.MenuItem(gettext('All appointments'),
                                        '/appointments'));
      menu.addEventListener(goog.ui.Component.EventType.ACTION, function(e) {
          window.location = e.target.getModel();
      });
      menu.addEventListener(goog.ui.Component.EventType.SHOW,
          function(e) {
            if (!isLoading) return;
 
            goog.net.XhrIo.send('/menu', function(event) {
                if (event.target.getStatus() == 200) {
                  var data = event.target.getResponseJson()['a'];
                  for (var i = 0; i < data.length; i++)
                    menu.addItemAt(new goog.ui.MenuItem(data[i][1],
                                                    '/a#id=' + data[i][0]), 0);
                } else {
                  var fail = new goog.ui.MenuItem(
                      gettext('Menu temporarily unavailaible.'));
                  fail.setEnabled(false);
                  menu.addItemAt(fail, 0);
                }

                menu.removeItem(loading);
                isLoading = false;
              });
          });

      new goog.ui.MenuButton(gettext('My appointments'), menu,
                             new goog.ui.FlatMenuButtonRenderer()).render(bar);
    })();
  }
};
