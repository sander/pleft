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
 * @fileoverview The Pleft appointment overview.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

// TODO(sander) Needs better documentation, and doesn't pass gjslint yet.

goog.provide('pleft.overview');

goog.require('goog.debug.ErrorHandler');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.History');
goog.require('goog.i18n.DateTimeFormat');
goog.require('goog.i18n.DateTimeParse');
goog.require('goog.json');
goog.require('goog.object');
goog.require('goog.ui.Button');
goog.require('goog.ui.Component');
goog.require('goog.ui.CharCounter');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.ui.Dialog.ButtonSet');
goog.require('goog.ui.InputDatePicker');
goog.require('goog.ui.LabelInput');
goog.require('goog.ui.MenuItem');
goog.require('goog.ui.Option');
goog.require('goog.ui.Select');
goog.require('goog.ui.ToggleButton');
goog.require('goog.net.XmlHttp');
goog.require('goog.net.XhrIo');
goog.require('goog.Uri');
goog.require('pleft.main');
goog.require('pleft.ui.SelectMenu');
goog.require('pleft.ui.TimeEntry');

pleft.overview.init = function() {
  pleft.main.init();

  var overview;

  function idChange() {
    if (overview && overview.saveTimeoutId) {
      overview.save(false);
    }

    var i;
    var id = null;
    var params = new goog.Uri(window.location).getFragment().split('&');
    for (i = 0; i < params.length; i++) {
      var keyval = params[i].split('=');
      if (keyval[0] == 'id') {
        id = parseInt(keyval[1], 10);
        break;
      }
    }
    overview = new pleft.overview.Overview(id);

    var languages = goog.dom.getElement('languages');
    var links = goog.dom.getElementsByTagNameAndClass('a', null, languages);
    for (i = 0; i < links.length; i++) {
      links[i].href = '?lang=' + links[i].lang + '#id=' + id;
    }
  }

  var h = new goog.History();
  goog.events.listen(h, goog.History.EventType.NAVIGATE, idChange);
  h.setEnabled(true);
};

/**
 * @constructor
 */
pleft.overview.Overview = function(id) {
  this.init(id);
};

pleft.overview.Overview.prototype.init = function(id) {
  this.id = id;

  this.data = null;

  this.container = goog.dom.getElement('overview-content');

  this.load();

  goog.events.listen(window, 'beforeunload', function() {
    if (this.saveTimeoutId) {
      this.save(false);
    }
  }, false, this);
};

pleft.overview.Overview.prototype.key = undefined;

pleft.overview.Overview.prototype.saveTimeoutId = undefined;

pleft.overview.Overview.prototype.data = null;

pleft.overview.Overview.prototype.dataText = null;

pleft.overview.Overview.prototype.load = function() {
  if (window['testAppData']) {
    var text = window['testAppData'];
    this.data = goog.json.parse(text);
    this.dataText = text;
    this.show();
    return;
  }

  var me = this;

  function complete(event) {
    if (event.target.isSuccess()) {
      if (event.target.getResponseText() != me.dataText) {
        me.data = event.target.getResponseJson();
        me.dataText = event.target.getResponseText();
        me.show();
      } else {
        me.refreshButton.setEnabled(true);
      }
    } else {
      me.container.innerHTML = '<p>'
          + gettext('This appointment could not be found or is not meant to be seen by you. We apologize for the inconvenience.');
      me.data = {};
    }
  }

  goog.net.XhrIo.send('/data?id=' + this.id, complete);
};

pleft.overview.Overview.prototype.me = -1;

pleft.overview.Overview.prototype.dateKeys = null;

pleft.overview.Overview.prototype.refreshButton = null;

pleft.overview.Overview.prototype.refresh = function() {
  this.refreshButton.setEnabled(false);
  if (this.saveTimeoutId) {
    this.save(false);
  }
  this.load();
};

pleft.overview.Overview.prototype.show = function() {
  this.container.innerHTML = '<div class=side-help><p>'
      + gettext('Use the Yes/Maybe/No buttons to indicate when you’re available. You can also enter comments.')
      + '<p>'
      + gettext('View the other participants’ availability by clicking on their names or on the dates at the left side.')
      + '</div><div class=appointment><div id=refresh></div><h2>'
      + gettext('Appointment')
      + '</h2><div id=app-description></div><table><thead><tr><th>'
      + gettext('Proposed dates')
      + '<th><th>'
      + gettext('Participants')
      + '<tbody><tr><td id=dates><td id=availability><td id=people></table><p id=save><span id=save-button></span><span id=status></span></p><div id=tools><div id=propose-dates></div><div id=resend-invitations></div><div id=invite-participants></div><div id=email-addresses></div></div></div>';

  this.saveButton = new goog.ui.CustomButton(gettext('Done'));
  this.saveButton.render(goog.dom.getElement('save-button'));
  this.saveButton.setEnabled(false);
  goog.events.listen(this.saveButton, goog.ui.Component.EventType.ACTION,
      this.save, false, this);

  this.refreshButton = new goog.ui.CustomButton(gettext('Refresh'));
  this.refreshButton.render(goog.dom.getElement('refresh'));
  goog.events.listen(this.refreshButton, goog.ui.Component.EventType.ACTION,
      this.refresh, false, this);

  goog.dom.getElement('app-description').innerHTML = this.data['meta']['description'];

  window.document.title = 'Pleft · ' + this.data['meta']['title'];

  if (this.data['meta']['initiator'] == this.data['user'] ||
      this.data['meta']['proposeMore']) {
    this.addProposeTool();
  }
  if (this.data['meta']['initiator'] == this.data['user']) {
    this.addResendTool();
    this.addInviteTool();
    this.addMailTool();
  }

  var i;

  // These are actually id's.
  //this.dateKeys = goog.object.getKeys(this.data['dates']);
  this.dateKeys = [];
  for (i = 0; i < this.data['dates'].length; i++) {
    this.dateKeys.push(this.data['dates'][i]['id']);
  }

  function addPersonBalloon(overview) {
    var display = goog.dom.getElement('availability');
    display.innerHTML = '';

    var balloon = new pleft.overview.PersonBalloon(overview,
        overview.peopleSelect.getSelectedIndex());
    balloon.appendTo(display);
  }

  var meIndex = -1;

  this.peopleSelect = new pleft.ui.SelectMenu();
  for (i = 0; i < goog.object.getCount(this.data['people']); i++) {
    var name = this.data['people'][i]['name'];
    var MAX_LENGTH = 19;
    if (name.length > MAX_LENGTH) {
      name = name.substr(0, MAX_LENGTH - 2) + '…';
    }

    var availability = this.data['availability'][this.data['people'][i]['id']];
    var availArray = [];
    for (var j = 0; j < this.dateKeys.length; j++) {
      var a = availability[this.dateKeys[j]];
      if (!a)
        a = [];
      availArray[j] = a;
    }
    availability = availArray;
    var isMe = this.data['people'][i]['id'] == this.data['invitee'];
    var person = new pleft.overview.Person(name, availability, isMe);
    var item = new goog.ui.MenuItem(name);
    item.setValue(person);
    this.peopleSelect.addItem(item);

    if (this.data['people'][i]['id'] == this.data['invitee']) {
      meIndex = i;
      this.me = person;
    }
  }
  this.peopleSelect.render(goog.dom.getElement('people'));

  goog.events.listen(this.peopleSelect, 'change', function(event) {
    this.dateSelect.setSelectedIndex(-1);

    addPersonBalloon(this);
  }, false, this);

  this.dateSelect = new pleft.ui.SelectMenu();
  for (i = 0; i < this.dateKeys.length; i++) {
    var str = this.data['dates'][i]['s'];
    var dateTime = new pleft.overview.DateTime(str);

    var bar = goog.dom.createDom('span', 'bar');
    var content = goog.dom.createDom('span', null, [str, bar]);

    var item = new goog.ui.MenuItem(content);
    item.setValue(dateTime);
    this.dateSelect.addItem(item);

    this.peopleSelect.forEachChild(function(child, index) {
      var av = child.getValue().availability[i];
      if (av.length == 0)
        return;
      switch (av[0]) {
        case 1:
          dateTime.yes++;
          break;
        case -1:
          dateTime.no++;
      }
    }, this);

    this.updateBar(item);
  }
  this.dateSelect.render(goog.dom.getElement('dates'));

  goog.events.listen(this.dateSelect, 'change', function(event) {
    this.peopleSelect.setSelectedIndex(-1);

    var display = goog.dom.getElement('availability');
    display.innerHTML = '';

    this.peopleSelect.forEachChild(function(child, index) { 
      var balloon = new pleft.overview.DateBalloon(this, index,
          this.dateSelect.getSelectedIndex());
      balloon.appendTo(display);
    }, this);
  }, false, this);

  this.peopleSelect.setSelectedIndex(meIndex);
  addPersonBalloon(this);
};

pleft.overview.Overview.prototype.dateSelect = null;

pleft.overview.Overview.prototype.peopleSelect = null;

pleft.overview.Overview.prototype.updateBar = function(item) {
  var bar = goog.dom.getElementsByTagNameAndClass('span', 'bar',
                                                  item.getContent())[0];

  var dateTime = item.getValue();
  var total = 105;  // TODO: use bar.clientWidth once placed in DOM
  var left = (dateTime.yes / this.peopleSelect.getItemCount()) * total;
  var right = (dateTime.no / this.peopleSelect.getItemCount()) * total;
  var middle = total - left - right;
  if (middle < 0 || middle > total)
    return;
  bar.style.borderLeftWidth = left + 'px';
  bar.style.borderRightWidth = right + 'px';
  bar.style.width = middle + 'px';
};

pleft.overview.Overview.prototype.planSave = function() {
  if (this.saveTimeoutId)
    return;

  var me = this;
  this.saveTimeoutId = setTimeout(function() { me.save(); }, 5000);

  this.saveButton.setEnabled(true);
};

pleft.overview.Overview.prototype.save = function(async) {
  var me = this;

  function saved(event) {
    if (event.target.getStatus() == 200) {
      var now = new Date();
      goog.dom.getElement('status').innerHTML = gettext('Automatically saved on ')
          + now.getHours() + ':' + ((now.getMinutes() < 10)? '0' : '')
          + now.getMinutes() + ':' + ((now.getSeconds() < 10)? '0' : '')
          + now.getSeconds() + '.';

      me.saveButton.setEnabled(false);
    } else {
      goog.dom.getElement('status').innerHTML = gettext('Sorry, your availability could not be saved.') + ' ' + gettext('Please try again.');
    }
  }

  if (async !== true && async !== false)
    async = true;

  var avail = this.me.availability;

  var data = 'id=' + this.id + '&a=';
  this.saveTimeoutId = undefined;
  var i;
  for (i = 0; i < avail.length; i++) {
    data += encodeURIComponent(this.dateKeys[i] + ':' + avail[i][0] + ':'
                               + (avail[i][1] || '') + '\n');
  }

  if (async) {
    goog.net.XhrIo.send('/set-availability', saved, 'POST', data);
  } else {
    var xhr = new goog.net.XmlHttp();
    xhr.open('POST', '/set-availability', false);
    xhr.send(data);
  }
};

pleft.overview.Overview.prototype.addMailTool = function() {
  goog.dom.getElement('email-addresses').innerHTML +=
      '<h3>' + gettext('Email addresses of the invitees (only visible to you)')
      + '</h3><p><textarea readonly>'
  + goog.object.getValues(this.data['addresses']).join(', ').replace('&', '&amp;').replace('<', '&lt;')
      + '</textarea></p>';
};

pleft.overview.Overview.prototype.addInviteTool = function() {
  goog.dom.getElement('invite-participants').innerHTML +=
      '<h3>' + gettext('Invite another participant') + '</h3>'
      + '<div id=invite-form></div><div id=invite-error></div>';

  var input = new goog.ui.LabelInput(gettext('Name <email@address.example>'));
  input.render(goog.dom.getElement('invite-form'));

  var button = new goog.ui.CustomButton(gettext('Send invitation'));
  button.render(goog.dom.getElement('invite-form'));
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, function() {
    button.setEnabled(false);

    goog.dom.getElement('invite-error').innerHTML = '';

    var regex = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
    // Source: http://www.regular-expressions.info/email.html

    var address = input.getValue();
    if (!regex.test(address)) {
      if (!address) {
        goog.dom.getElement('invite-error').innerHTML =
            gettext('Please enter an address.');
      } else {
        goog.dom.getElement('invite-error').innerHTML =
            gettext('This email address does not seem to be correct.');
      }

      button.setEnabled(true);
    } else {
      button.setContent(gettext('Sending…'));

      var params = 'id=' + this.id + '&a=' + encodeURIComponent(address);

      var me = this;
      function complete() {
        me.refresh();
        button.setEnabled(true);
        button.setContent(gettext('Send invitation'));
      }

      goog.net.XhrIo.send('/add-invitees', complete, 'POST', params);
    }
  }, false, this);
};

pleft.overview.Overview.prototype.addResendTool = function() {
  goog.dom.getElement('resend-invitations').innerHTML +=
      '<h3>' + gettext('Resend invitations') + '</h3>'
      + '<div id=resend-form><label id=invitee-input> </label></div>';

  var select = new goog.ui.Select();
  select.setDefaultCaption(gettext('Select an invitee'));
  select.render(goog.dom.getElement('invitee-input'));

  for (var i = 0; i < goog.object.getCount(this.data['people']); i++) {
    var invitee = this.data['people'][i];
    if (invitee['id'] == this.data['invitee'])
      continue;
    select.addItem(new goog.ui.Option(invitee.name, invitee.id));
  }

  goog.events.listen(select, goog.ui.Component.EventType.ACTION, function() {
    button.setEnabled(true);
  });

  var button = new goog.ui.CustomButton(gettext('Send invitation again'));
  button.setEnabled(false);
  button.render(goog.dom.getElement('resend-form'));
  var me = this;
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, function() {
    button.setEnabled(false);
    button.setContent(gettext('Sending…'));

    var params = 'id=' + me.id + '&invitee=' + select.getSelectedItem().getValue();

    function complete() {
      button.setContent(gettext('Send invitation again'));
    }
    goog.net.XhrIo.send('/resend-invitation', complete, 'POST', params);
  });
};

pleft.overview.Overview.prototype.addProposeTool = function() {
  goog.dom.getElement('propose-dates').innerHTML +=
      '<h3>' + gettext('Propose another date') + '</h3>'
      + '<div id=propose-form><label id=date-input>' + gettext('Date:') + ' </label>'
      + '<label id=time-input>' + gettext('Time:') + ' </label></div>'
      + '<div id=propose-error></div>';

  var PATTERN = "yyyy'-'MM'-'dd";
  var formatter = new goog.i18n.DateTimeFormat(PATTERN);
  var parser = new goog.i18n.DateTimeParse(PATTERN);

  var dateInput = new goog.ui.LabelInput('yyyy-mm-dd');
  dateInput.render(goog.dom.getElement('date-input'));
  var datePicker = new goog.ui.InputDatePicker(formatter, parser);
  datePicker.setPopupParentElement(goog.dom.getElement('propose-form'));
  datePicker.decorate(dateInput.getElement());

  datePicker.getDatePicker().setShowFixedNumWeeks(true);
  datePicker.getDatePicker().setShowOtherMonths(true);
  datePicker.getDatePicker().setExtraWeekAtEnd(true);
  datePicker.getDatePicker().setShowWeekNum(false);
  datePicker.getDatePicker().setShowWeekdayNames(true);
  datePicker.getDatePicker().setAllowNone(false);
  datePicker.getDatePicker().setShowToday(false);
  datePicker.getDatePicker().setUseNarrowWeekdayNames(false);
  datePicker.getDatePicker().setUseSimpleNavigationMenu(true);

  var settings = {
    show24Hours: true 
  };
  var timeEntry = new pleft.ui.TimeEntry(settings);
  timeEntry.create(goog.dom.getElement('time-input'));

  var button = new goog.ui.CustomButton(gettext('Add date'));
  button.render(goog.dom.getElement('propose-form'));
  goog.events.listen(button, goog.ui.Component.EventType.ACTION, function() {
    button.setEnabled(false);

    goog.dom.getElement('propose-error').innerHTML = '';

    var inputDate = datePicker.getDate();
    if (!inputDate) {
      goog.dom.getElement('propose-error').innerHTML = gettext('This does not seem to be a valid date.');
      button.setEnabled(true);
      return;
    }

    var inputTime = timeEntry.getTime();
    if (!inputTime) {
      goog.dom.getElement('propose-error').innerHTML = gettext('This does not seem to be a valid time.');
      button.setEnabled(true);
      return;
    }

    var str = inputDate.toIsoString(true).substring(0, 10) + 'T'
        + ((inputTime.getHours() < 10)? '0' : '') + inputTime.getHours()
        + ':'
        + ((inputTime.getMinutes() < 10)? '0' : '') + inputTime.getMinutes()
        + ':00';

    var params = 'id=' + this.id + '&d=' + encodeURIComponent(str);

    var me = this;
    function complete() {
      me.refresh();
    }

    goog.net.XhrIo.send('/add-dates', complete, 'POST', params);
  }, false, this);
};

/**
 * @constructor
 */
pleft.overview.Balloon = function(overview) {
  this.init(overview);
};

pleft.overview.Balloon.prototype.init = function(overview) {
  this.overview = overview;

  this.element = goog.dom.createDom('div', 'balloon');

  this.arrow = goog.dom.createDom('div', 'arrow');
  goog.dom.appendChild(this.element, this.arrow);
};

pleft.overview.Balloon.prototype.overview = null;

pleft.overview.Balloon.prototype.element = null;

pleft.overview.Balloon.prototype.appendTo = function(node) {
  goog.dom.appendChild(node, this.element);
};

/**
 * @constructor
 */
pleft.overview.PersonBalloon = function(overview, personIndex) {
  pleft.overview.Balloon.call(this, overview);

  goog.dom.classes.add(this.element, 'person-balloon');

  this.arrow.style.marginTop = 5 + personIndex * 40 + 'px';
  this.element.style.minHeight = 5 + personIndex * 40 + 12 + 'px';

  var person = overview.peopleSelect.getItemAt(personIndex).getValue();

  overview.dateSelect.forEachChild(function(child, index) {
    var availability = new pleft.overview.Availability(overview, person,
        index);
    goog.dom.appendChild(this.element, availability.element);
  }, this);
};
goog.inherits(pleft.overview.PersonBalloon, pleft.overview.Balloon);

/**
 * @constructor
 */
pleft.overview.DateBalloon = function(overview, personIndex, dateIndex) {
  pleft.overview.Balloon.call(this, overview);

  goog.dom.classes.add(this.element, 'date-balloon');

  var person = overview.peopleSelect.getItemAt(personIndex).getValue();

  var availability = new pleft.overview.Availability(overview, person,
      dateIndex);
  goog.dom.appendChild(this.element, availability.element);
};
goog.inherits(pleft.overview.DateBalloon, pleft.overview.Balloon);

/**
 * @constructor
 */
pleft.overview.Availability = function(overview, person, i) {
  this.init(overview, person, i);
};

pleft.overview.Availability.prototype.init = function(overview, person, i) {
  this.element = goog.dom.createDom('div', 'availability');

  var a = person.availability[i];

  if (person.isMe) {
    goog.dom.classes.add(this.element, 'form');

    var choose = goog.dom.createDom('div', 'choose');
    goog.dom.appendChild(this.element, choose);

    var buttons = [new goog.ui.ToggleButton(gettext('Yes')),
                   new goog.ui.ToggleButton(gettext('Maybe')),
                   new goog.ui.ToggleButton(gettext('No'))];

    function onChange(event) {
      var m;
      for (m = 0; m < 3; m++) {
        buttons[m].setChecked(buttons[m] == event.target);
      }

      var prev = person.availability[i][0];
      person.availability[i][0] = event.target.getValue();
      if (person.availability[i][0] == prev)
        return;

      var dateItem = overview.dateSelect.getItemAt(i);

      var klass = '';
      switch (person.availability[i][0]) {
        case -1:
          klass = 'no';
          dateItem.getValue().no++;
          if (prev == 1)
            dateItem.getValue().yes--;
          break;
        case 0:
          klass = 'maybe';
          if (prev == -1)
            dateItem.getValue().no--;
          else if (prev == 1)
            dateItem.getValue().yes--;
          break;
        case 1:
          klass = 'yes';
          dateItem.getValue().yes++;
          if (prev == -1)
            dateItem.getValue().no--;
      }
      overview.updateBar(dateItem);

      goog.dom.classes.addRemove(this.element, ['yes', 'no', 'maybe'], klass);

      overview.planSave();
    }

    var k;
    for (k = 0; k < 3; k++) {
      buttons[k].setValue(1 - k);

      buttons[k].render(choose);

      goog.events.listen(buttons[k], goog.ui.Component.EventType.ACTION,
          onChange, false, this);
    }

    buttons[0].setCollapsed(goog.ui.Button.Side.END);
    buttons[1].setCollapsed(goog.ui.Button.Side.BOTH);
    buttons[2].setCollapsed(goog.ui.Button.Side.START);

    switch (a[0]) {
      case -1:
        goog.dom.classes.add(this.element, 'no');
        break;
      case 0:
        goog.dom.classes.add(this.element, 'maybe');
        break;
      case 1:
        goog.dom.classes.add(this.element, 'yes');
    }

    var selectedAny = false;
    var j;
    for (j = 0; j < 3; j++) {
      if (person.availability[i].length
          && person.availability[i][0] == 1 - j) {
        buttons[j].setChecked(true);
        selectedAny = true;
      }
    }
    if (!selectedAny) {
      buttons[1].setChecked(true);
      onChange.call(this, { target: buttons[1] });
    }

    var entry = goog.dom.createDom('textarea');
    var countDisplay = goog.dom.createDom('span');
    var counter = new goog.ui.CharCounter(entry, countDisplay, 500);
    goog.events.listen(entry, 'keydown', function(event) {
      if (event.keyCode == 13) {
        event.preventDefault();
      }
    }, false, this);
    goog.events.listen(entry, 'keyup', function(event) {
      person.availability[i][1] = event.target.value;
      overview.planSave();
    }, false, this);
    if (person.availability[i].length && person.availability[i][1])
      entry.value = person.availability[i][1];
    goog.dom.appendChild(this.element, entry);
  } else {
    var possible = goog.dom.createDom('div', 'possible');
    goog.dom.appendChild(this.element, possible);

    var comment = goog.dom.createDom('div', 'comment');
    goog.dom.appendChild(this.element, comment);

    goog.dom.classes.add(this.element, 'static');
    if (a.length) {
      switch (a[0]) {
        case -1:
          goog.dom.classes.add(this.element, 'no');
          possible.innerHTML = gettext('No');
          break;
        case 0:
          goog.dom.classes.add(this.element, 'maybe');
          possible.innerHTML = gettext('Maybe');
          break;
        case 1:
          goog.dom.classes.add(this.element, 'yes');
          possible.innerHTML = gettext('Yes');
      }

      var origText = (a[1] || '').replace(/ /g, '\u00a0');
      var length = 40;
      if (origText.length < length)
        comment.innerHTML = origText;
      else {
        comment.innerHTML = origText.substring(0, length - 2) + '\u2026';
        comment.title = origText;
        comment.style.cursor = 'help';
      }
    } else {
      goog.dom.classes.add(this.element, 'maybe');
      possible.innerHTML = gettext('Maybe');
      comment.innerHTML = '[' + gettext('Not filled in yet.') + ']';
    }
  } 
};

pleft.overview.Availability.prototype.element = null;

/**
 * @constructor
 */
pleft.overview.DateTime = function(content) {
  this.content = content;

  this.yes = 0;
  this.no = 0;
};

/**
 * @constructor
 */
pleft.overview.Person = function(name, availability, isMe) {
  this.name = name;
  this.availability = availability;
  this.isMe = isMe;
};

goog.exportSymbol('pleft.overview.init', pleft.overview.init);
