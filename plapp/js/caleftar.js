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
 * @fileoverview Caleftar, a widget for multiple date/time entry.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

// Ideas:
// - Use -webkit-transition for animations when available. This might make it
//   work well on the iPhone too. (Requires re-implementing some goog.fx.)
// - Use Closure Templates to simplify code.
// - Make Caleftar a proper Closure control.

goog.provide('pleft.caleftar.Caleftar');

goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.fx.easing');
goog.require('goog.ui.CustomButton');
goog.require('pleft.fx.Margin');
goog.require('pleft.ui.TimeEntry');

/**
 * A widget for multiple date/time entry.
 *
 * @constructor
 */
pleft.caleftar.Caleftar = function() {
  // For ease of programming, we sometimes accept 2009/12 as a month, which is
  // interpreted as 2010/0 (January 2010). In cases where we do not allow for
  // this, we call values normalized.

  // Note that Monday is 0 here (Sunday is 0 in Date()).
  this.Months = gettext(
      'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec').split('|');
  this.Days = gettext('Mon|Tue|Wed|Thu|Fri|Sat|Sun').split('|');

  // this.months[year][month] is a <div> containing day boxes.
  this.months = {};

  // The added times (seconds since 1970-01-01 0:00 UTC).
  this.times = [];

  // The currently shown day pop-up.
  this.popUp = null;

  // The currently shown year and month. These get updated by Caleftar.show_().
  this.year = this.month = -1;

  // The most recent year and month that are added to this.months.
  this.lastYear = this.lastMonth = -1;

  // Automatically fill in the last used time.
  this.lastTime = new Date(0, 0, 1, 12);
};

/**
 * Serializes the input.
 *
 * @return {string} String containing all dates/times separated by newlines.
 */
pleft.caleftar.Caleftar.prototype.getDatesString = function() {
  var s = '';

  for (var i = 0; i < this.times.length; i++) {
    var time = new Date(this.times[i]);
    var month = time.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }
    var day = time.getDate();
    if (day < 10) {
      day = '0' + day;
    }
    var hours = time.getHours();
    if (hours < 10) {
      hours = '0' + hours;
    }
    var minutes = time.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    s += time.getFullYear() + '-' + month + '-' + day + 'T' + hours +
        ':' + minutes + ':' + '00\n';
  }

  return s.slice(0, -1);
};

/**
 * Creates the Caleftar tree and puts it in the DOM.
 *
 * @param {HTMLDivElement} el The element to append the Caleftar to.
 */
pleft.caleftar.Caleftar.prototype.create = function(el) {
  this.el = el;

  goog.dom.classes.add(el, 'dp-picker');

  el.innerHTML = '<div class="dp-week-days"></div><div class="dp-container">' +
      '<div class="dp-label"><a class="dp-choose .dp-up" style="visibility: ' +
      'hidden">▲</a><span class="dp-month-label"></span><a class="dp-choose ' +
      '.dp-down">▼</a></div><div class="dp-days"></div></div><div class="dp-' +
      'selected-container"><p class="dp-selected-header">' +
      gettext('Selected times:') + '</p><div class="dp-selected-times">' +
      ' </div></div>';

  this.selected = goog.dom.$$('div', 'dp-selected-times', el)[0];

  // Add Mon/Tue/Wed/etc.
  var weekDays = goog.dom.$$('div', 'dp-week-days', el)[0];
  for (var i = 0; i < this.Days.length; i++)
    weekDays.appendChild(goog.dom.createDom('span', null, this.Days[i]));

  // Month selector.
  this.up = goog.dom.$$('a', 'dp-choose', el)[0];
  goog.events.listen(this.up, goog.events.EventType.CLICK, function() {
    this.show_(this.year, this.month - 1);
  }, false, this);

  var down = goog.dom.$$('a', 'dp-choose', el)[1];
  goog.events.listen(down, goog.events.EventType.CLICK, function() {
    this.show_(this.year, this.month + 1);
  }, false, this);

  // Month name.
  this.monthLabel = goog.dom.$$('span', 'dp-month-label', el)[0];

  // Contain the day boxes.
  this.days = goog.dom.$$('div', 'dp-days', el)[0];

  // We initially show the month containing today. It might be better to let
  // the API user specify an initial day, in case older dates should be shown.
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth();

  // Add the last few days of the previous month.
  this.addPreviousMonth_(year, month);

  // Is the month added next even or odd? (Used for the background color.)
  this.even = true;

  // Show (and add) the current month.
  this.show_(year, month);

  this.updateSelected_();
};

/**
 * Makes sure that a certain month is available for showing. Assumes that the
 * arguments are normalized.
 *
 * @private
 * @param {number} year The year of the date to make available.
 * @param {number} month The month of the date to make available.
 */
pleft.caleftar.Caleftar.prototype.makeAvailable_ = function(year, month) {
  // Add months until the specified month is added.
  while (this.lastYear < year ||
      (this.lastYear == year && this.lastMonth <= month))
    this.addMonth_(this.lastYear, this.lastMonth + 1);
};

/**
 * Shows a certain month. Makes it available if needed.
 *
 * @private
 * @param {number} year The year to show.
 * @param {number} month The month to show.
 */
pleft.caleftar.Caleftar.prototype.show_ = function(year, month) {
  // Normalize the arguments.
  var normal = new Date(year, month);
  year = normal.getFullYear();
  month = normal.getMonth();

  // Close any pop-up.
  if (this.popUp)
    this.popUp.close_();

  this.makeAvailable_(year, month);

  var monthElt = goog.dom.$$('div', 'dp-day',
      this.months[normal.getFullYear()][normal.getMonth()])[0];
  var calElt = goog.dom.getAncestorByTagNameAndClass(this.days, 'DIV',
                                                     'dp-picker');
  var orig = parseInt(this.days.style.marginTop.replace('px', ''), 10);
  if (!orig)
    orig = 0;

  function findTop(obj) {
    var cur = 0;
    if (obj.offsetParent) {
      do {
        cur += obj.offsetTop;
      } while (obj = obj.offsetParent);
    }
    return cur;
  }
  var pos = findTop(monthElt) - findTop(this.days);

  var anim = new pleft.fx.Margin(this.days, [0, orig], [0, -pos],
      300, goog.fx.easing.inAndOut);
  anim.play();

  this.monthLabel.innerHTML = [this.Months[normal.getMonth()], ' ',
                               normal.getFullYear()].join('');

  goog.dom.classes.add(this.months[year][month], 'dp-selected');
  if (this.year != -1)
    goog.dom.classes.remove(this.months[this.year][this.month], 'dp-selected');

  this.year = year;
  this.month = month;

  // Hide the 'up' button iff today is shown.
  if (year == new Date().getFullYear() && month == new Date().getMonth())
    this.up.style.visibility = 'hidden';
  else this.up.style.visibility = 'visible';
};

/**
 * Add the specified month.
 *
 * @private
 * @param {number} year The year of the month to add.
 * @param {number} month The month to add.
 */
pleft.caleftar.Caleftar.prototype.addMonth_ = function(year, month) {
  // Normalize the arguments.
  var normal = new Date(year, month);
  year = normal.getFullYear();
  month = normal.getMonth();

  var nDays = new Date(year, month + 1, 0).getDate();

  // First week day.
  var first = (new Date(year, month, 1).getDay() + 6) % 7;

  // Contains the day boxes.
  var div = goog.dom.createDom('div', 'dp-month');
  this.days.appendChild(div);
  div.appendChild(goog.dom.createDom('span', 'dp-which-year', year + ''));
  div.appendChild(goog.dom.createDom('span', 'dp-which-month', month + ''));
  for (var i = 0; i < nDays; i++) {
    var day = this.addDay_(year, month, i + 1);
    goog.dom.classes.add(day, this.even ? 'dp-even' : 'dp-odd');
    div.appendChild(day);
  }

  // Add to this.months if needed.
  if (!this.months[year])
    this.months[year] = {};
  this.months[year][month] = div;

  this.lastYear = year;
  this.lastMonth = month;

  this.even = !this.even;
};

/**
 * Adds those days of the last month that appear in the first week of the
 * current month.
 *
 * @private
 * @param {number} year The year of the current month.
 * @param {number} month The current month.
 */
pleft.caleftar.Caleftar.prototype.addPreviousMonth_ = function(year, month) {
  var previous = new Date(year, month, 0);

  // First weekday of the current month.
  var firstCurrent = (new Date(year, month, 1).getDay() + 6) % 7;

  // Last day of the previous month.
  var lastPrevious = previous.getDate();

  var div = goog.dom.createDom('div', 'dp-month');
  this.days.appendChild(div);
  for (var i = firstCurrent - 1; i >= 0; i--) {
    var day = this.addDay_(previous.getFullYear(), previous.getMonth(),
        lastPrevious - i);
    goog.dom.classes.add(day, 'dp-odd');
    div.appendChild(day);
  }

  this.lastYear = previous.getFullYear();
  this.lastMonth = previous.getMonth();
};

/**
 * Opens the popup for a day given by element. Closes other popups if needed.
 *
 * @private
 * @param {HTMLDivElement} element The element of the day within Caleftar.
 */
pleft.caleftar.Caleftar.prototype.openDay_ = function(element) {
  if (this.popUp)
    this.popUp.close_();
  this.popUp = new pleft.caleftar.DayPopUp(this, element);
};

/**
 * Add a day to Caleftar.
 *
 * @private
 * @param {number} year The year of the day.
 * @param {number} month The month of the day.
 * @param {number} day The day.
 * @return {HTMLDivElement} The element representing the day.
 */
pleft.caleftar.Caleftar.prototype.addDay_ = function(year, month, day) {
  var elt = goog.dom.createDom('div', 'dp-day');

  function onDayClick() {
    this.openDay_(elt);
  }

  var past = false;

  var box = goog.dom.createDom('div', 'dp-box');
  elt.appendChild(box);

  var content = goog.dom.createDom('div', 'dp-c');
  box.appendChild(content);

  var today = new Date();
  if (today.getFullYear() == year &&
      today.getMonth() == month &&
      today.getDate() == day) {
    goog.dom.classes.add(elt, 'dp-today');
    var text = gettext('today');
    var indicator = goog.dom.createDom('div', 'dp-today-indicator', text);
    if (text == '⬅') {
      goog.dom.classes.add(indicator, 'dp-today-big');
    }
    content.appendChild(indicator);
  } else if (today.getTime() > new Date(year, month, day).getTime())
    past = true;

  var dayElt = goog.dom.createDom('div', 'dp-day-label', day + '');
  content.appendChild(dayElt);

  var times = goog.dom.createDom('div', 'dp-times');
  content.appendChild(times);

  if (past) {
    goog.dom.classes.add(elt, 'dp-past');
  } else {
    goog.events.listen(box, goog.events.EventType.CLICK, onDayClick,
        false, this);
  }

  return elt;
};

/**
 * Deletes a time.
 *
 * @private
 * @param {number} time The number of seconds since the Unix epoch.
 */
pleft.caleftar.Caleftar.prototype.deleteTime_ = function(time) {
  for (var i = 0; i < this.times.length; i++) {
    if (this.times[i] == time) {
      this.times.splice(i, 1);
      break;
    }
  }
  this.updateSelected_();
};

/**
 * Updates the selected times on a specific date.
 *
 * @private
 * @param {number} year The year of the date.
 * @param {number} month The month of the date.
 * @param {number} day The day of the date.
 */
pleft.caleftar.Caleftar.prototype.updateDay_ = function(year, month, day) {
  var elt = goog.dom.$$('div', 'dp-times',
      this.months[year][month].childNodes.item(day + 1))[0];
  elt.innerHTML = '';

  var begin = new Date(year, month, day).getTime();
  var end = new Date(year, month, day + 1).getTime();
  var n = 0;
  for (var i = 0; i < this.times.length; i++) {
    if (this.times[i] < begin || this.times[i] > end)
      continue;

    n++;
    if (n > 2)
      break;

    elt.innerHTML += this.formatTime_(new Date(this.times[i])) + '<br>';
  }
  if (n > 2)
    elt.innerHTML += '…';
};

/**
 * Updates the overview of the selected dates/times.
 *
 * @private
 */
pleft.caleftar.Caleftar.prototype.updateSelected_ = function() {
  this.selected.innerHTML = '';

  if (this.times.length == 0) {
    this.selected.innerHTML = gettext('No times are selected yet.');
  }

  for (var i = 0; i < this.times.length; i++) {
    var elt = goog.dom.createDom('div', 'dp-date');
    this.selected.appendChild(elt);
    elt.appendChild(goog.dom.createDom('span', 'dp-which-time',
                                       this.times[i] + ''));

    var span = goog.dom.createDom('span', null,
                                  this.formatDate_(this.times[i]));
    elt.appendChild(span);
    goog.events.listen(span, goog.events.EventType.CLICK, function(event) {
      var time = goog.dom.$$('span', 'dp-which-time',
                             event.target.parentNode)[0].innerHTML;
      var date = new Date(parseInt(time));

      var timeout = 0;

      if (!(this.year == date.getFullYear() &&
          this.month == date.getMonth())) {
        timeout = 300;
        this.show_(date.getFullYear(), date.getMonth());
      }

      window.setTimeout((function(dp, date) {
        return function() {
          var year = date.getFullYear();
          var month = date.getMonth();
          var dayIndex = date.getDate() - 1;
          var box = goog.dom.$$('div', 'dp-box', dp.months[year][month][dayIndex]);
          dp.openDay_(box.parentNode);
        };
      })(this, date), timeout);
    }, false, this);

    var button = goog.dom.createDom('a', 'dp-date-delete', '×');
    elt.appendChild(button);
    goog.events.listen(button, goog.events.EventType.CLICK, function(event) {
      var time = goog.dom.$$('span', 'dp-which-time',
          event.target.parentNode)[0].innerHTML;
      this.deleteTime_(time);
      var date = new Date(parseInt(time));
      this.updateDay_(date.getFullYear(), date.getMonth(), date.getDate());
      if (this.popUp)
        this.popUp.updateTimes_();
    }, false, this);
  }
};

/**
 * A popup for a specific day that allows the user to (de)select times.
 *
 * @constructor
 * @param {pleft.caleftar.Caleftar} dp The Caleftar that the popup belongs to.
 * @param {HTMLDivElement} elt The element representing the specific day.
 */
pleft.caleftar.DayPopUp = function(dp, elt) {
  this.dp = dp;

  function findTop(obj) {
    var cur = 0;
    if (obj.offsetParent) {
      do {
        cur += obj.offsetTop;
      } while (obj = obj.offsetParent);
    }
    return cur;
  }

  var pos = { left: elt.offsetLeft,
              top: findTop(elt) + elt.clientHeight };

  // Find the date.
  var monthElt = elt.parentNode;
  this.day = parseInt(goog.dom.$$('div', 'dp-day-label', elt)[0].innerHTML);
  this.month = parseInt(goog.dom.$$('span', 'dp-which-month',
      monthElt)[0].innerHTML);
  this.year = parseInt(goog.dom.$$('span', 'dp-which-year',
      monthElt)[0].innerHTML);

  this.popUp = goog.dom.createDom('div', 'dp-popup');
  this.popUp.style.position = 'absolute';
  this.popUp.style.top = pos.top + 'px';
  this.popUp.style.overflow = 'hidden';
  elt.appendChild(this.popUp);

  this.popUp.style.width = this.popUp.style.height = '128px';
  this.popUp.style.overflow = 'visible';
  this.popUp.style.marginLeft = '-32px';
  this.popUp.style.marginTop = '-96px';

  // TODO: make the transition smoother before re-applying it.
  /*
  var anim = new goog.fx.dom.Resize(this.popUp,
                                    [64, 64], [128, 128],
                                    200, goog.fx.easing.easeOut);
  // TODO: make the close button appear more nicely.
  goog.events.listen(anim, goog.fx.Animation.EventType.END, function() {
    this.popUp.style.overflow = 'visible';
  }, false, this);
  anim.play();

  anim = new pleft.fx.Margin(this.popUp, [0, -64], [-32, -96],
                             200, goog.fx.easing.easeOut);
  anim.play();
  */

  var content = goog.dom.createDom('div', 'dp-content');
  this.popUp.appendChild(content);

  var title = goog.dom.createDom('div', 'dp-title');
  title.innerHTML = '<b>' + this.day + '</b> ' + this.dp.Months[this.month];
  content.appendChild(title);

  this.times = goog.dom.createDom('div', 'dp-popup-times');
  content.appendChild(this.times);

  content.appendChild(goog.dom.createDom('div', 'dp-entry-label',
                                         gettext('Add a time:')));

  var entryDiv = goog.dom.createDom('div', 'dp-entry');
  content.appendChild(entryDiv);

  var settings = {
    defaultTime: this.dp.lastTime,
    show24Hours: true
  };
  this.timeEntry = new pleft.ui.TimeEntry(settings);
  this.timeEntry.create(entryDiv);

  this.entry = entryDiv.getElementsByTagName('input').item(0);
  this.entry.focus();

  goog.events.listen(this.entry, goog.events.EventType.KEYDOWN,
      function(event) {
        if (event.keyCode == 13) { // Enter
          this.add_();
        } else if (event.keyCode == 27) { // Escape
          this.close_();
        }
      }, false, this);

  var button = goog.dom.createDom('a', 'dp-enter');
  content.appendChild(button);
  goog.events.listen(button, goog.events.EventType.CLICK, function(event) {
    event.preventDefault();
    this.add_();
    return false;
  }, false, this);

  var close = goog.dom.createDom('span', 'dp-close');
  this.popUp.appendChild(close);
  goog.events.listen(close, goog.events.EventType.CLICK, function() {
    this.close_();
  }, false, this);

  this.updateTimes_();
};

/**
 * Formats the date/time to a human-readable string.
 *
 * @private
 * @param {number} time The date/time in seconds since the Unix epoch.
 * @return {string} The human-readable formatted string.
 */
pleft.caleftar.Caleftar.prototype.formatDate_ = function(time) {
  var date = new Date(time);

  var s = this.Days[(date.getDay() + 6) % 7] + ' ' + date.getDate() + ' ' +
      this.Months[date.getMonth()];
  if (date.getFullYear() > new Date().getFullYear()) {
    s += ' ' + date.getFullYear();
  }
  s += ', ' + this.formatTime_(date);

  return s;
};

/**
 * Formats the time to a human-readable string.
 *
 * @private
 * @param {Date} time The time to be formatted.
 * @return {string} The formatted time string.
 */
pleft.caleftar.Caleftar.prototype.formatTime_ = function(time) {
  return time.getHours() + ':' + ((time.getMinutes() < 10) ? '0' : '') +
      time.getMinutes();
};

/**
 * Selects the selected time of the day.
 *
 * @private
 */
pleft.caleftar.DayPopUp.prototype.add_ = function() {
  this.entry.focus();
  this.dp.days.parentNode.scrollTop = 0;

  var time = this.timeEntry.getTime();

  if (!time)
    return;

  var full = new Date(this.year, this.month, this.day,
                      time.getHours(), time.getMinutes()).getTime();
  for (var i = 0; i < this.dp.times.length; i++) {
    if (this.dp.times[i] == full)
      return;
  }

  this.dp.times.push(full);
  this.dp.times.sort();

  this.updateTimes_();

  this.dp.updateDay_(this.year, this.month, this.day);
  this.dp.updateSelected_();
};

/**
 * Updates the shown times in the popup.
 *
 * @private
 */
pleft.caleftar.DayPopUp.prototype.updateTimes_ = function() {
  this.times.innerHTML = '';

  var begin = new Date(this.year, this.month, this.day).getTime();
  var end = new Date(this.year, this.month, this.day + 1).getTime();
  for (var i = 0; i < this.dp.times.length; i++) {
    if (this.dp.times[i] < begin || this.dp.times[i] > end)
      continue;

    var timeBox = goog.dom.createDom('span', 'dp-time-box',
                                     this.dp.formatTime_(new Date(
                                         this.dp.times[i])));
    this.times.appendChild(timeBox);
    timeBox.appendChild(goog.dom.createDom('span', 'dp-which-time',
        new Date(this.dp.times[i]).getTime() + ''));

    var deleteButton = goog.dom.createDom('a', 'dp-time-delete', '×');
    timeBox.appendChild(deleteButton);
    goog.events.listen(deleteButton, goog.events.EventType.CLICK, function() {
      this.dp.deleteTime_(goog.dom.$$('span', 'dp-which-time',
          deleteButton.parentNode)[0].innerHTML);
      this.updateTimes_();
      this.dp.updateDay_(this.year, this.month, this.day);

      return;
    }, false, this);
  }
};

/**
 * Closes the day popup.
 *
 * @private
 */
pleft.caleftar.DayPopUp.prototype.close_ = function() {
  goog.dom.removeNode(this.popUp);
  this.dp.popUp = null;
  this.dp.lastTime = this.timeEntry.getTime();
};
