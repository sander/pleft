// Copyright 2009, 2010, 2011 Sander Dijkhuis <sander.dijkhuis@gmail.com>
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

// The menu bar at the top of pages of Pleft.

$(function() {
  'use strict';

  function toggleParentMenuOf(element) {
    return $(element).parents('.menu').toggleClass('open');
  }

  // Handle opening and closing.
  $('.menu-bar h1').click(function() {
    var menu = toggleParentMenuOf(this);
    if (menu.hasClass('open')) {
      // Catch clicks outside of the menu.
      // A timeout is used because the current click shouldn't be catched.
      setTimeout(function() {
        $('body').one('click', function(event) {
          if (event.target == menu.get(0) || $(event.target).parents(menu)) {
            if (menu.hasClass('open')) menu.removeClass('open');
          }
        });
      }, 0);
    }
  });

  // Make links that get the user out of the app open in a new window.
  $('.menu-bar .external').click(function() {
    open(this.href);
    toggleParentMenuOf(this);
    return false;
  });

  // Change the language when an option is clicked.
  $('.menu-bar [data-language]').click(function() {
    var language = $(this).attr('data-language');
    $.post('/i18n/setlang/', 'language=' + language, function() {
      location.reload();
    });
    $('body').toggleClass('progress', true);
  });

  // Hide or format the Chrome app link.
  if (!window.chrome || !chrome.app) $('.menu-bar .chrome-only').remove();
  else if (chrome.app.isInstalled)
    $('.menu-bar .chrome-only .app-link').text(gettext('Write a review'));
});
