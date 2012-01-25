// Copyright 2011 Sander Dijkhuis <sander.dijkhuis@gmail.com>
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

// Textarea improvements.

$(function() {
  'use strict';

  $('textarea').each(function() {
    // Add support for HTML5's maxlength if needed.
    if (document.createElement('textarea').maxLength == undefined) {
      $(this).keyup(function() {
        $(this).val($(this).val().substr(0, $(this).attr('maxlength')));
      });
    }

    // Make the height fit the content.
    var test = $('<div>').text('a').appendTo('body');
    var lineHeight = test.height();
    test.remove();

    var padding = $(this).outerHeight() - $(this).height();
    var minimum = 2 * lineHeight + padding;

    this.setHeight = function() {
      if (parseInt(this.scrollHeight) > minimum) {
        $(this).height(minimum);
        $(this).height(this.scrollHeight + padding);
      } else $(this).height(minimum);
    };

    $(this).css('lineHeight', lineHeight + 'px').height(minimum)
      .keyup(this.setHeight);

    this.setHeight();
  });
});
