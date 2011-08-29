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

// Caleftar, a widget for multiple date/time entry.

$(function() {
  'use strict';

  // Note that Monday is 0 here (Sunday is 0 in Date()).
  var MONTHS = gettext('Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec')
    .split('|');
  var DAYS = gettext('Mon|Tue|Wed|Thu|Fri|Sat|Sun').split('|');

  $('.date-time-picker').each(function() {
    // For ease of programming, we sometimes accept 2009/12 as a month, which
    // is interpreted as 2010/0 (January 2010). In cases where we do not allow
    // for this, we call values normalized.

    var me = this;

    // Automatically fill in the last used time.
    var lastTime = new Date(0, 0, 1, 12);

    // Add Mon/Tue/Wed/etc.
    $(DAYS).each(function() {
      $('<span>').text(this).appendTo($(me).find('.week-days'));
    });

    // Month selector.
    $(this).find('.choose').click(function() {
      var year = parseInt($(me).find('.month.selected .which-year').text());
      var month = parseInt($(me).find('.month.selected .which-month').text());

      show(year, month + ($(this).hasClass('up') ? -1 : 1));
    });

    // We initially show the month containing today. It might be better to let
    // the API user specify an initial day, in case older dates should be
    // shown.
    (function(date) {
      var currentYear = date.getFullYear();
      var currentMonth = date.getMonth();

      addPreviousMonth(currentYear, currentMonth);
      show(currentYear, currentMonth);
    })(new Date());

    updateSelected();

    // Serialize the input to a string with dates/times separated by newlines.
    this.getDatesString = function getDatesString() {
      function twoDigits(n) { return ((n < 10) ? '0' : '') + n; }

      var s = [];

      $(me).find('.selected-times .date .which-time').each(function() {
        var time = new Date(parseInt($(this).text()));
        s.push([
          time.getFullYear(), '-',
          twoDigits(time.getMonth() + 1), '-',
          twoDigits(time.getDate()), 'T',
          twoDigits(time.getHours()), ':',
          twoDigits(time.getMinutes()), ':00'
        ].join(''));
      });

      return s.join('\n');
    }

    // Makes sure that a certain month is available for showing. Assumes that
    // the arguments are normalized.
    function makeAvailable(year, month) {
      // Add months until the specified month is added.
      var lastElt = $($(me).find('.month').get(-1));
      var lastYear = parseInt(lastElt.find('.which-year').text());
      var lastMonth = parseInt(lastElt.find('.which-month').text());

      while (lastYear < year || (lastYear == year && lastMonth <= month)) {
        var lastElt = addMonth(lastYear, lastMonth + 1);
        lastYear = parseInt(lastElt.find('.which-year').text());
        lastMonth = parseInt(lastElt.find('.which-month').text());
      }
    }

    // Shows a certain month. Makes it available if needed.
    function show(newYear, newMonth) {
      // Normalize the arguments.
      var normal = new Date(newYear, newMonth);
      newYear = normal.getFullYear();
      newMonth = normal.getMonth();

      var year = parseInt($(me).find('.month.selected .which-year').text());
      var month = parseInt($(me).find('.month.selected .which-month').text());

      $(me).find('.popup').each(function() { closePopup(); });

      makeAvailable(newYear, newMonth);

      $(me).find('.days').animate({
        marginTop: $(me).find('.days').offset().top -
          $(me).find('.year-' + newYear + '.month-' + newMonth + ' .day-1')
            .offset().top
      }, 300);

      $(me).find('.month-label').text(
        [MONTHS[newMonth], ' ', newYear].join(''));

      $(me).find('.year-' + year + '.month-' + month).removeClass('selected');
      $(me).find('.year-' + newYear + '.month-' + newMonth)
        .addClass('selected');

      // Hide the 'up' button iff today is shown.
      var todayShown = (newYear == new Date().getFullYear() &&
        newMonth == new Date().getMonth())
      $(me).find('.up').css('visibility', todayShown ? 'hidden' : 'visible');
    }

    // Adds the specified month.
    function addMonth(year, month) {
      // Normalize the arguments.
      var normal = new Date(year, month);
      year = normal.getFullYear();
      month = normal.getMonth();

      var nDays = new Date(year, month + 1, 0).getDate();

      // Contains the day boxes.
      var even = !$($(me).find('.month').get(-1)).find('.day')
        .hasClass('even');
      var div = $('<div class=month>').appendTo($(me).find('.days'))
        .addClass('year-' + year).addClass('month-' + month);
      $('<span class=which-year>').text(year).appendTo(div);
      $('<span class=which-month>').text(month).appendTo(div);
      for (var i = 0; i < nDays; i++)
        addDay(year, month, i + 1).addClass(even ? 'even' : 'odd')
          .appendTo(div);

      return div;
    }

    // Adds those days of the last month that appear in the first week of the
    // current month.
    function addPreviousMonth(currentYear, currentMonth) {
      var previous = new Date(currentYear, currentMonth, 0);

      // First weekday of the current month.
      var firstCurrent =
        (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7;

      // Last day of the previous month.
      var lastPrevious = previous.getDate();

      var div = $('<div class=month>').appendTo($(me).find('.days'))
        .addClass('year-' + previous.getFullYear())
        .addClass('month-' + previous.getMonth());
      $('<span class=which-year>').text(previous.getFullYear()).appendTo(div);
      $('<span class=which-month>').text(previous.getMonth()).appendTo(div);
      for (var i = firstCurrent - 1; i >= 0; i--)
        addDay(previous.getFullYear(), previous.getMonth(),
          lastPrevious - i).addClass('odd').appendTo(div);
    }

    // Opens the popup for a day given by element. Closes other popups if
    // needed.
    function openDay(element) {
      $(me).find('.popup').each(function() { closePopup(); });
      popup(element);
    }

    // Adds a day to Caleftar.
    function addDay(year, month, day) {
      var elt = $('<div class=day>').addClass('day-' + day);
      var content =
        $('<div class=c>').appendTo($('<div class=box>').appendTo(elt));

      var today = new Date();
      if (today.getFullYear() == year &&
          today.getMonth() == month &&
          today.getDate() == day) {
        $(elt).addClass('today');
        var indicator = $('<div class=today-indicator>').text(gettext('today'))
          .appendTo(content);
        if (indicator.text() == '⬅') indicator.addClass('today-big');
      } else if (today.getTime() > new Date(year, month, day).getTime())
        $(elt).addClass('past');

      $('<div class=day-label>').text(day).appendTo(content);
      $('<div class=times>').appendTo(content);

      if (!elt.hasClass('past')) $(elt).click(function() { openDay(this); });

      return elt;
    }

    // Deletes a time.
    function deleteTime(time) {
      $(me).find('.selected-times .time-' + time).remove();
      updateSelected();
    }

    // Updates the selected times on a specific date.
    function updateDay(year, month, day) {
      var elt = $(me).find('.year-' + year + '.month-' + month +
        ' .day-' + day + ' .times').empty();

      var begin = new Date(year, month, day).getTime();
      var end = new Date(year, month, day + 1).getTime();
      var n = 0;
      $(me).find('.selected-times .date .which-time').each(function() {
        var time = parseInt($(this).text());
        if (time < begin || time > end) return;
        if (++n > 2) return false;
        elt.get(0).innerHTML += formatTime(new Date(time)) + '<br>';
      });
      if (n > 2) elt.get(0).innerHTML += '…';
    }

    // Updates the overview of the selected dates/times.
    function updateSelected() {
      var dates = $(me).find('.selected-times .date');
      dates.sort(function(a, b) {
        var x = parseInt($(a).find('.which-time').text());
        var y = parseInt($(b).find('.which-time').text());
        if (x > y) return 1;
        else if (x < y) return -1;
        else return 0;
      });
      $(me).find('.selected-times').empty().append(dates);
      attachSelectedListeners($(me).find('.selected-times .date'));

      if (!dates.length) $(me).find('.selected-times')
        .text(gettext('No times are selected yet.'));
    }

    // Formats the date/time to a human-readable string.
    function formatDate(date) {
      return [
        DAYS[(date.getDay() + 6) % 7], ' ',
        date.getDate(), ' ',
        MONTHS[date.getMonth()],
        (date.getFullYear() > new Date().getFullYear()) ?
          ' ' + date.getFullYear() : '',
        ', ', formatTime(date)
      ].join('');
    }

    // Formats the time to a human-readable string.
    function formatTime(time, withTrailingZero) {
      return [
        ((withTrailingZero && time.getHours() < 10) ? '0' : ''),
        time.getHours(), ':',
        ((time.getMinutes() < 10) ? '0' : ''),
        time.getMinutes()
      ].join('');
    }

    function preventScroll() {
      $(me).find('.days').parent().get(0).scrollTop = 0;
    }

    // Adds event handlers to selected dates.
    function attachSelectedListeners(elts) {
      $(elts).find('.readable').click(function() {
        var date = new Date(parseInt(
          $(this).parent().find('.which-time').text()));
        var year = parseInt(
          $(me).find('.month.selected .which-year').text());
        var month = parseInt(
          $(me).find('.month.selected .which-month').text());
        var timeout = 0;

        if (!(year == date.getFullYear() && month == date.getMonth())) {
          timeout = 300;
          show(date.getFullYear(), date.getMonth());
        }

        setTimeout(function() {
          openDay($(me).find('.year-' + date.getFullYear() + '.month-' +
            date.getMonth() + ' .box:nth(' + (date.getDate() - 1) + ')')
            .parent().get(0));
        }, timeout);
      });
      $(elts).find('.date-delete').click(function() {
        var date = new Date(
          parseInt($(this).parent().find('.which-time').text()));
        deleteTime(date.getTime());
        updateDay(date.getFullYear(), date.getMonth(), date.getDate());
        $('.selected-times').change();
      });
    }

    // A popup for a specific day that allows the user to (de)select times.
    function popup(elt) {
      function findTop(obj) {
        var cur = 0;
        if (obj.offsetParent)
          do cur += obj.offsetTop; while (obj = obj.offsetParent);
        return cur;
      }

      var pos = { left: elt.offsetLeft,
                  top: findTop(elt) + elt.clientHeight };

      // Find the date.
      var day = parseInt($(elt).find('.day-label').text());
      var month = parseInt($(elt).parent().find('.which-month').text());
      var year = parseInt($(elt).parent().find('.which-year').text());

      var content = $('<div class=content>').appendTo(
        $('<div class=popup>').css({
          position: 'absolute',
          top: pos.top,
          width: 128,
          height: 128,
          marginLeft: -32,
          marginTop: -96
        }).appendTo(elt).click(function() { return false; }));

      $('<div class=title>').html(['<b>', day, '</b>', ' ', MONTHS[month]]
        .join('')).appendTo(content);

      $('<div class=popup-times>').appendTo(content);

      $('<div class=entry-label>').text(gettext('Add a time:'))
        .appendTo(content);

      var entry = $('<div class=entry>').appendTo(content);
      var input = $('<input>').val(formatTime(lastTime, true)).timePicker({
        show24Hours: true
      }).appendTo(entry).keydown(function(event) {
        // Not so nice: the widget scrolls on each keystroke.
        setTimeout(preventScroll, 0);

        if (event.keyCode == 13) add(); // Enter
        else if (event.keyCode == 27) closePopup(); // Escape
      });

      updateTimes();

      if (!(content).find('.time-box').length) input.focus();

      $('.time-picker').click(preventScroll);

      $('<a class=enter>').appendTo(content).click(add);
      $('<span class=close>').appendTo($(me).find('.popup')).click(function() {
        closePopup();
        return false;
      });

      $(me).find('.selected-times').change(updateTimes);

      preventScroll();

      // Selects the selected time of the day.
      function add() {
        var time = $.timePicker($(me).find('.popup input').focus()).getTime();

        preventScroll();

        if (!time) return;

        var date = new Date(year, month, day, time.getHours(),
          time.getMinutes());
        var full = date.getTime();
        var times = $(me).find('.selected-times .date .which-time');
        for (var i = 0; i < times.length; i++){
          if ($(times[i]).text() == full) return;
        }

        var elt = $('<div class=date>').addClass('time-' + full)
          .appendTo($(me).find('.selected-times'));
        $('<span class=which-time>').text(full).appendTo(elt);
        $('<span class=readable>').text(formatDate(date)).appendTo(elt);
        $('<a class=date-delete>').text('×').appendTo(elt);

        updateTimes();
        updateDay(year, month, day);
        updateSelected();
      }

      // Updates the shown times in the popup.
      function updateTimes() {
        $(me).find('.popup-times').empty();

        var begin = new Date(year, month, day).getTime();
        var end = new Date(year, month, day + 1).getTime();
        $(me).find('.selected-times .date .which-time').each(function() {
          var time = parseInt($(this).text());
          if (time < begin || time > end) return;

          var box = $('<span class=time-box>').text(formatTime(new Date(time)))
            .appendTo($(me).find('.popup-times'));
          $('<span class=which-time>').text(new Date(time).getTime())
            .appendTo(box);

          $('<a class=time-delete>').text('×').appendTo(box).click(function() {
            deleteTime(time);
            updateTimes();
            updateDay(year, month, day);
          });
        });
      }
    }

    // Closes the day popup.
    function closePopup() {
      lastTime = $.timePicker($(me).find('.popup input')).getTime();

      $(me).find('.popup').remove();
      $('.time-picker').remove();
    }
  });
});
