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
// Based on jquery.timeentry by Keith Wood <kbwood{at}iinet.com.au> 2007.
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

/**
 * @fileoverview A widget for entering times.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

// TODO(sander) Needs better documentation, and doesn't pass gjslint yet.

goog.provide('pleft.ui.TimeEntry');

goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.events.PasteHandler');

/**
 * Creates a TimeEntry widget.
 *
 * @constructor
 * @param {Object} settings Settings for the TimeEntry. See the source code.
 */
pleft.ui.TimeEntry = function(settings) {
  settings = settings || {};

  this.settings = {
    show24Hours: settings.show24Hours || false, // Use am/pm if false.
    separator: settings.separator || ':', // Between time fields.
    ampmPrefix: settings.ampmPrefix || ' ', // The separator before am/pm.
    ampmNames: settings.ampmNames || ['AM', 'PM'], // Names of am/pm.
    showSeconds: settings.showSeconds || false, // Otherwise, hours/minutes.
    timeSteps: settings.timeSteps || [1, 1, 1], // For incrementing h/m/s.
    initialField: settings.initialField || 0, // Initially highlighted.
    minTime: settings.minTime || null, // Earliest selectable time.
    maxTime: settings.maxTime || null, // Latest selectable time.
    spinnerRepeat: settings.spinnerRepeat || [500, 250], // Initial, subsequent.
    defaultTime: settings.defaultTime || new Date(0, 0, 1, 12)
  };
};

/*
 * Attach the TimeEntry to an input field.
 */
pleft.ui.TimeEntry.prototype.create = function(target) {
  this.el = target;

  goog.dom.classes.add(this.el, 'te-entry');

  this.selectedHour = 0; // The currently selected hour
  this.selectedMinute = 0; // The currently selected minute
  this.selectedSecond = 0; // The currently selected second

  this.field = 0; // The selected subfield.

  this.input = goog.dom.createDom('input');
  this.el.appendChild(this.input);
  this.setTime(this.settings.defaultTime);

  var up = goog.dom.createDom('span', 'te-up');
  this.el.appendChild(up);

  var down = goog.dom.createDom('span', 'te-down');
  this.el.appendChild(down);

  goog.events.listen(this.input, goog.events.EventType.FOCUS,
                     this.onFocus, false, this);
  goog.events.listen(this.input, goog.events.EventType.CLICK,
                     this.onClick, false, this);
  goog.events.listen(this.input, goog.events.EventType.KEYDOWN,
                     this.onKeyDown, false, this);
  goog.events.listen(this.input, goog.events.EventType.KEYPRESS,
                     this.onKeyPress, false, this);

  var handler = new goog.events.PasteHandler(this.input);
  handler.addEventListener(goog.events.PasteHandler.EventType.PASTE,
                           this.parseTime, false, this);

  goog.events.listen(up, goog.events.EventType.MOUSEDOWN,
                     this.handleSpinnerUp, false, this);
  goog.events.listen(down, goog.events.EventType.MOUSEDOWN,
                     this.handleSpinnerDown, false, this);

  goog.events.listen(up, goog.events.EventType.MOUSEUP,
                     this.endSpinnerUp, false, this);
  goog.events.listen(down, goog.events.EventType.MOUSEUP,
                     this.endSpinnerDown, false, this);

  this.parseTime();
  this.onFocus();
};

/*
 * Retrieve the current time for a TimeEntry input field.
 */
pleft.ui.TimeEntry.prototype.getTime = function() {
  var currentTime = this.extractTime();
  return (!currentTime? null :
    new Date(0, 0, 0, currentTime[0], currentTime[1], currentTime[2]));
};

/*
 * Initialise the time entry.
 */
pleft.ui.TimeEntry.prototype.onFocus = function() {
  this.focussed = true;

  // TODO: parse time here?

  this.showField();
};

/*
 * Select appropriate field portion on click, if already in the field.
 */
pleft.ui.TimeEntry.prototype.onClick = function(event) {
  var fieldSize = this.settings.separator.length + 2;

  this.field = 0;

  if (this.input.selectionStart != null) { // Use input select range
    for (var field = 0; field <= Math.max(1, this.secondField, this.ampmField);
         field++) {
      var end = (field != this.ampmField ? (field * fieldSize) + 2 :
                 (this.ampmField * fieldSize) +
                 this.settings.ampmPrefix.length +
                 this.settings.ampmNames[0].length);
      this.field = field;
      if (this.input.selectionStart < end) {
        break;
      }
    }
  } else if (this.input.createTextRange) { // Check against bounding boxes
    var range = this.input.createTextRange();
    var convert = function(value) {
      return { thin: 2, medium: 4, thick: 6 }[value] || value || 0;
    };
    var offsetX = event.clientX + window.document.documentElement.scrollLeft -
      (this.input.offsetLeft
       + parseInt(convert(this.input.style.borderLeftWidth), 10)) -
      range.offsetLeft; // Position - left edge - alignment
    for (var field = 0; field <= Math.max(1, this.secondField,
                                          this.ampmField); field++) {
      var end = (field != this.ampmField ? (field * fieldSize) + 2 :
        this.ampmField * fieldSize + this.settings.ampmPrefix.length +
        this.settings.ampmNames[0].length);
      range.collapse();
      range.moveEnd('character', end);
      this.field = field;
      if (offsetX < range.boundingWidth) { // And compare
        break;
      }
    }
  }

  this.showField();
  this.focussed = false;
};

/*
 * Handle keystrokes in the filed.
 */
pleft.ui.TimeEntry.prototype.onKeyDown = function(event) {
  if (event.keyCode >= 48) { // >= '0'
    return true;
  }

  switch (event.keyCode) {
    case 9:
      return (event.shiftKey ? this.changeField(-1, true)
                             : this.changeField(+1, true));
    case 35: // Clear time on ctrl+end.
      if (event.ctrlKey) {
        this.setValue('');
      } else { // Last field on end.
        this.field = Math.max(1, this.secondField, this.ampmField);
        this.adjustField(0);
      }
      break;
    case 36:
      if (event.ctrlKey) { // Current time on ctrl+home.
        this.setTime();
      } else { // First field on home.
        this.field = 0;
        this.adjustField(0);
      }
      break;
    case 37: // Left.
      this.changeField(-1, false);
      break;
    case 38: // Up.
      this.adjustField(+1);
      break;
    case 39: // Right.
      this.changeField(+1, false);
      break;
    case 40: // Down.
      this.adjustField(-1);
      break;
    case 46: // Delete
      this.setValue('');
      break;
  }

  event.preventDefault();

  return false;
};

/*
 * Disallow unwanted character.
 */
pleft.ui.TimeEntry.prototype.onKeyPress = function(event) {
  event.preventDefault();
  var chr = String.fromCharCode((event.charCode == undefined) ?
                                event.keyCode : event.charCode);
  if (chr < ' ') {
    return true;
  }

  this.handleKeyPress(chr);
  return false;
};

pleft.ui.TimeEntry.prototype.handleSpinnerUp = function(event) {
  event.preventDefault();

  this.handleSpinner(true, event.target);
};

pleft.ui.TimeEntry.prototype.handleSpinnerDown = function(event) {
  event.preventDefault();

  this.handleSpinner(false, event.target);
};

pleft.ui.TimeEntry.prototype.endSpinnerUp = function(event) {
  event.preventDefault();

  this.endSpinner(true, event.target);
};

pleft.ui.TimeEntry.prototype.endSpinnerDown = function(event) {
  event.preventDefault();

  this.endSpinner(false, event.target);
};

/*
 * Handle a click on the spinner.
 */
pleft.ui.TimeEntry.prototype.handleSpinner = function(up, spinner) {
  if (this.handlingSpinner) {
    return;
  }
  this.handlingSpinner = true;
  var region = up ? +1 : -1;
  this.actionSpinner(region);
  this.timer = null;
  var spinnerRepeat = this.settings.spinnerRepeat;
  if (spinnerRepeat[0]) {
    var me = this;
    this.timer = window.setTimeout(function() {
      me.repeatSpinner(region);
    }, spinnerRepeat[0]);
    goog.events.listenOnce(spinner, goog.events.EventType.MOUSEOUT,
                           this.releaseSpinner, false, this);
    goog.events.listenOnce(spinner, goog.events.EventType.MOUSEUP,
                           this.releaseSpinner, false, this);
  }
};

/*
 * Action a click on the spinner.
 */
pleft.ui.TimeEntry.prototype.actionSpinner = function(direction) {
  if (!this.input.value) {
    this.parseTime();
  }
  this.adjustField(direction);
};

/*
 * Repeat a click on the spinner.
 */
pleft.ui.TimeEntry.prototype.repeatSpinner = function(region) {
  if (!this.timer) {
    return;
  }
  this.actionSpinner(region);
  var me = this;
  this.timer = window.setTimeout(function() {
    me.repeatSpinner(region);
  }, this.settings.spinnerRepeat[1]);
};

/*
 * Stop a spinner repeat.
 */
pleft.ui.TimeEntry.prototype.releaseSpinner = function() {
  window.clearTimeout(this.timer);
  this.timer = null;
};

/*
 * Tidy up after a spinner click.
 */
pleft.ui.TimeEntry.prototype.endSpinner = function(region, spinner) {
  window.clearTimeout(this.timer);
  this.timer = null;

  if (this.handlingSpinner) {
    this.showField();
  }
  this.handlingSpinner = false;
};

/*
 * Extract the time value from the input field, or default to now.
 */
pleft.ui.TimeEntry.prototype.parseTime = function() {
  if (this.focused)
    return;

  var currentTime = this.extractTime();
  var showSeconds = this.settings.showSeconds;

  if (currentTime) {
    this.selectedHour = currentTime[0];
    this.selectedMinute = currentTime[1];
    this.selectedSecond = currentTime[2];
  } else {
    var now = this.constrainTime();
    this.selectedHour = now[0];
    this.selectedMinute = now[1];
    this.selectedSecond = (showSeconds ? now[2] : 0);
  }

  this.secondField = (showSeconds ? 2 : -1);
  this.ampmField = this.settings.show24Hours ? -1 : (showSeconds ? 3 : 2);
  this.lastChr = '';
  this.field = Math.max(0, Math.min(Math.max(1, this.secondField,
                                             this.ampmField),
                                    this.settings.initialField));

  if (this.input.value != '') {
    this.showTime();
  };
};

/*
 * Extract the time value from the input field as an array of values, or
 * default to null.
 */
pleft.ui.TimeEntry.prototype.extractTime = function() {
  var value = this.input.value;
  var separator = this.settings.separator;
  var currentTime = value.split(separator);
  if (separator == '' && value != '') {
    currentTime[0] = value.substring(0, 2);
    currentTime[1] = value.substring(2, 4);
    currentTime[2] = value.substring(4, 6);
  }
  var ampmNames = this.settings.ampmNames;
  var show24Hours = this.settings.show24Hours;
  if (currentTime.length >= 2) {
    var isAM = !show24Hours && (value.indexOf(ampmNames[0]) > -1);
    var isPM = !show24Hours && (value.indexOf(ampmNames[1]) > -1);
    var hour = parseInt(currentTime[0], 10);
    hour = (isNaN(hour) ? 0 : hour);
    hour = ((isAM || isPM) && hour == 12 ? 0 : hour) + (isPM ? 12 : 0);
    var minute = parseInt(currentTime[1], 10);
    minute = (isNaN(minute) ? 0 : minute);
    var second = (currentTime.length >= 3 ?
      parseInt(currentTime[2], 10) : 0);
    second = (isNaN(second) || !this.settings.showSeconds ? 0 : second);
    return this.constrainTime([hour, minute, second]);
  } 
  return null;
};

/*
 * Constrain the given/current time to the time steps.
 */
pleft.ui.TimeEntry.prototype.constrainTime = function(fields) {
  if (fields == null) {
    var now = this.determineTime(this.settings.defaultTime) || new Date();
    fields = [now.getHours(), now.getMinutes(), now.getSeconds()];
  }

  var reset = false;
  var timeSteps = this.settings.timeSteps;

  for (var i = 0; i < timeSteps.length; i++) {
    if (reset) {
      fields[i] = 0;
    } else if (timeSteps[i] > 1) {
      fields[i] = Math.round(fields[i] / timeSteps[i]) * timeSteps[i];
      reset = true;
    }
  }

  return fields;
};

/*
 * Set the selected time into the input field.
 */
pleft.ui.TimeEntry.prototype.showTime = function() {
  var show24Hours = this.settings.show24Hours;
  var separator = this.settings.separator;
  var currentTime = (this.formatNumber(show24Hours ? this.selectedHour :
      ((this.selectedHour + 11) % 12) + 1) + separator +
      this.formatNumber(this.selectedMinute) +
      (this.settings.showSeconds ? separator +
      this.formatNumber(this.selectedSecond) : '') +
      (show24Hours ?  '' : this.settings.ampmPrefix +
      this.settings.ampmNames[(this.selectedHour < 12 ? 0 : 1)]));
  this.setValue(currentTime);
  this.showField();
};

/*
 * Highlight the current time field.
 */
pleft.ui.TimeEntry.prototype.showField = function() {
  var fieldSize = this.settings.separator.length + 2;
  var start = (this.field != this.ampmField ? (this.field * fieldSize) :
              (this.ampmField * fieldSize) - this.settings.separator.length +
              this.settings.ampmPrefix.length);
  var end = start + (this.field != this.ampmField ? 2 :
                     this.settings.ampmNames[0].length);

  if (this.input.setSelectionRange) { // Mozilla
    this.input.setSelectionRange(start, end);
  } else if (this.input.createTextRange) { // IE
    var range = this.input.createTextRange();
    range.moveStart('character', start);
    range.moveEnd('character', end - this.input.value.length);
    range.select();
  }

  this.input.focus();
};

/*
 * Ensure displayed single number has a leading zero.
 */
pleft.ui.TimeEntry.prototype.formatNumber = function(value) {
  return (value < 10 ? '0' : '') + value;
};

/*
 * Update the input field and notify listeners.
 */
pleft.ui.TimeEntry.prototype.setValue = function(value) {
  if (value != this.input.value) {
    this.input.value = value;
    // Might want to fire the change event here.
  }
};

/*
 * Move to previous/next field, or out of field altogether if appropriate.
 */
pleft.ui.TimeEntry.prototype.changeField = function(offset, moveOut) {
  var atFirstLast = (this.input.value == '' || this.field ==
      (offset == -1 ? 0 : Math.max(1, this.secondField, this.ampmField)));
  if (!atFirstLast) {
    this.field += offset;
  }

  this.showField();
  this.lastChr = '';

  return (atFirstLast && moveOut);
};

/*
 * Update the current field in the direction indicated.
 */
pleft.ui.TimeEntry.prototype.adjustField = function(offset) {
  if (this.input.value == '') {
    offset = 0;
  }

  var steps = this.settings.timeSteps;
  this.setTime(new Date(0, 0, 0,
    this.selectedHour + (this.field == 0 ? offset * steps[0] : 0) +
        (this.field == this.ampmField ? offset * 12 : 0),
        this.selectedMinute + (this.field == 1 ? offset * steps[1] : 0),
        this.selectedSecond + (this.field == this.secondField ?
                               offset * steps[2] : 0)));
};

/*
 * Check against minimum/maximum and display time.
 */
pleft.ui.TimeEntry.prototype.setTime = function(time) {
  time = this.determineTime(time);
  var fields = this.constrainTime(time ?
      [time.getHours(), time.getMinutes(), time.getSeconds()] : null);
  time = new Date(0, 0, 0, fields[0], fields[1], fields[2]);

  // Normalise to base date.
  var time = this.normaliseTime(time);
  var minTime = this.normaliseTime(this.determineTime(this.settings.minTime));
  var maxTime = this.normaliseTime(this.determineTime(this.settings.maxTime));

  // Ensure it is within the bounds set.
  time = (minTime && time < minTime ? minTime :
          (maxTime && time > maxTime ? maxTime : time));

  this.selectedHour = time.getHours();
  this.selectedMinute = time.getMinutes();
  this.selectedSecond = time.getSeconds();

  this.showTime();
};

/*
 * A time may be specified as an exact value or a relative one.
 * @ param  setting  (Date) an actual time or
 *                   (number) offset in seconds from now or
 *                   (string) unites and periods of offsets from now.
 */
pleft.ui.TimeEntry.prototype.determineTime = function(setting) {
  var offsetNumeric = function(offset) { // E.g. +300, -2
    var time = new Date();
    time.setTime(time.getTime() + offset * 1000);
    return time;
  };
  var offsetString = function(offset) { // E.g. '+2m', '-4h', '+3h +30m'
    var time = new Date();
    var hour = time.getHours();
    var minute = time.getMinutes();
    var second = time.getSeconds();
    var pattern = /([+-]?[0-9]+)\s*(s|S|m|M|h|H)?/g;
    var matches = pattern.exec(offset);
    while (matches) {
      switch (matches[2] || 's') {
        case 's' : case 'S' :
          second += parseInt(matches[1], 10); break;
        case 'm' : case 'M' :
          minute += parseInt(matches[1], 10); break;
        case 'h' : case 'H' :
          hour += parseInt(matches[1], 10); break;
      }
      matches = pattern.exec(offset);
    }
    time = new Date(0, 0, 10, hour, minute, second, 0);
    if (/^!/.test(offset)) { // No wrapping
      if (time.getDate() > 10) {
        time = new Date(0, 0, 10, 23, 59, 59);
      }
      else if (time.getDate() < 10) {
        time = new Date(0, 0, 10, 0, 0, 0);
      }
    }
    return time;
  };
  return (setting ? (typeof setting == 'string' ? offsetString(setting) :
    (typeof setting == 'number' ? offsetNumeric(setting) : setting)) : null);
};

/*
 * Normalise time object to a common date.
 */
pleft.ui.TimeEntry.prototype.normaliseTime = function(time) {
  if (!time) {
    return null;
  }

  time.setFullYear(1900);
  time.setMonth(0);
  time.setDate(0);

  return time;
};

/*
 * Update time based on keystroke entered.
 */
pleft.ui.TimeEntry.prototype.handleKeyPress = function(chr) {
  if (chr == this.settings.separator) {
    this.changeField(+1, false);
  } else if (chr >= '0' && chr <= '9') {
    var key = parseInt(chr, 10);
    var value = parseInt(this.lastChr + chr, 10);
    var show24Hours = this.settings.show24Hours;
    var hour = (this.field != 0 ? this.selectedHour :
        (show24Hours ? (value < 24 ? value : key) :
        (value >= 1 && value <= 12 ? value :
        (key > 0 ? key : this.selectedHour)) % 12 +
        (this.selectedHour >= 12 ? 12 : 0)));
    var minute = (this.field != 1 ? this.selectedMinute :
        (value < 60 ? value : key));
    var second = (this.field != this.secondField ? this.selectedSecond :
        (value < 60 ? value : key));
    var fields = this.constrainTime([hour, minute, second]);
    this.setTime(new Date(0, 0, 0, fields[0], fields[1], fields[2]));
    this.lastChr = chr;
  } else if (!this.settings.show24Hours) { // Set am/pm based on first char.
    var ampmNames = this.settings.ampmNames;
    if ((chr == ampmNames[0].substring(0, 1).toLowerCase() &&
        this.selectedHour >= 12) ||
        (chr == ampmNames[1].substring(0, 1).toLowerCase() &&
        this.selectedHour < 12)) {
      var saveField = this.field;
      this.field = this.ampmField;
      this.adjustField(+1);
      this.field = saveField;
      this.showField();
    }
  }
};
