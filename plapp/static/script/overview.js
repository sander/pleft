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

// The appointment overview.

$(function() {
  'use strict';

  var MAX_NAME_LENGTH = 19;
  var MAX_COMMENT_LENGTH = 500;

  // IDs of the dates in this appointment.
  var dateKeys;

  // When unloading, make sure that any scheduled save is performed.
  $(window).bind('beforeunload', function() { if (saveTimeout) save(false); });

  $('.save button').click(function() { save(true); });

  $('.overview > *').css('display', 'none');

  // Load the appointment data.
  $.ajax({
    type: 'GET',
    url: '/data?id=' + window.id,
    dataType: 'json',
    success: function(data) {
      show(data);
    },
    error: function() {
      $('.not-found').css('display', 'block');
      $('.side-help, .appointment').css('display', 'none');
    }
  });

  function show(data) {
    var meIndex = -1;

    // Select a date or a particiant.
    function select(item) {
      $('.appointment .select li').toggleClass('selected', false);
      $(item).addClass('selected');
      $('.appointment .availability').empty();
    }

    $('.side-help, .appointment').css('display', 'block');

    $('.appointment .description').html(data.meta.description);
    document.title = 'Pleft · ' + data.meta.title;

    setupTools(data);

    dateKeys = [];
    $(data.dates).each(function() {
      dateKeys.push(this.id);
    });

    // Populate Participants.
    $('.appointment .people .select').empty();
    $(data.people).each(function(i) {
      if (this.name.length > MAX_NAME_LENGTH)
        this.name = this.name.substr(0, MAX_NAME_LENGTH - 2) + '…';

      var availability = data.availability[this.id];
      var availArray = [];
      $(dateKeys).each(function(i) {
        availArray[i] = availability[this] || [];
      });
      availability = availArray;

      var person = {
        name: this.name,
        availability: availability,
        isMe: this.id == data.invitee
      };

      var item = $('<li>').text(this.name).data('person', person)
        .appendTo('.appointment .people .select');

      if (person.isMe) {
        item.addClass('me');
        meIndex = i;
      }
    });

    // Handle participant selection.
    $('.appointment .people .select li').click(function() {
      var me = this;

      select(this);

      var personIndex = 0;
      $('.appointment .people .select li').each(function(i) {
        if (this == me) personIndex = i;
      });

      var balloon = $('<div class="person balloon">')
        .appendTo('.appointment .availability');
      var arrow = $('<div class=arrow>').css('marginTop', 5 + personIndex * 40)
        .appendTo(balloon);
      balloon.css('minHeight', 5 + personIndex * 40 + 12);

      var person = $(this).data('person');

      $('.appointment .dates .select li').each(function(i) {
        createAvailability(person, i).appendTo(balloon);
      });
    });

    // Populate Proposed dates.
    $('.appointment .dates .select').empty();
    $(dateKeys).each(function(i) {
      var dateTime = {
        string: data.dates[i].s,
        yes: 0,
        no: 0
      };

      var content = $('<span>').text(dateTime.string);
      $('<span class=bar>').appendTo(content);

      var item = $('<li>').html(content).data('dateTime', dateTime)
        .appendTo('.appointment .dates .select');
      $('.appointment .people .select li').each(function() {
        var av = $(this).data('person').availability[i];
        if (av.length == 0) return;
        if (av[0] == 1) dateTime.yes++; else if (av[0] == -1) dateTime.no++;
      });

      updateBar(item);
    });

    // Handle date selection.
    $('.appointment .dates .select li').click(function() {
      var me = this;

      select(this);

      var dateIndex = 0;
      $('.appointment .dates .select li').each(function(i) {
        if (this == me) dateIndex = i;
      });

      $('.appointment .people .select li').each(function() {
        var balloon = $('<div class="date balloon">')
          .appendTo('.appointment td.availability');
        var arrow = $('<div class=arrow>').appendTo(balloon);
        var person = $(this).data('person');
        createAvailability(person, dateIndex).appendTo(balloon);
      });
    });

    $('.appointment .people .select li:nth(' + meIndex + ')').click();
  }

  // Save the user's availability. Use async == false to block an unload.
  function save(async) {
    saveTimeout = null;

    var avail = [];
    $($('.appointment .select .me').data('person').availability)
      .each(function(i) {
      avail = avail.concat([
        dateKeys[i], ':', (this[0] || 0), ':', this[1] || '', '\n']);
    });

    $.ajax({
      type: 'POST',
      url: '/set-availability',
      async: async,
      data: {
        id: window.id,
        a: avail.join('')
      },
      success: function() {
        var now = new Date();
        $('.appointment .status').text([
          gettext('Automatically saved on '),
          now.getHours(), ':',
          (now.getMinutes() < 10) ? '0' : '', now.getMinutes(), ':',
          (now.getSeconds() < 10) ? '0' : '', now.getSeconds(), '.'
        ].join(''));
        $('.appointment .save button').attr('disabled', true);
      },
      error: function() {
        $('.appointment .status').text([
          gettext('Sorry, your availability could not be saved.'),
          ' ', gettext('Please try again.')].join(''));
      }
    });
  }

  // Update the availability bar for the specified date.
  function updateBar(item) {
    var dt = $(item).data('dateTime');
    var total = 105;
    var n = $('.appointment .people .select li').length;
    var left = dt.yes / n * total;
    var right = dt.no / n * total;
    var middle = total - left - right;
    if (middle < 0 || middle > total) return;
    $(item).find('.bar').css({
      borderLeftWidth: left, borderRightWidth: right, width: middle });
  }

  // When called, a save is scheduled.
  var saveTimeout;
  function planSave() {
    if (saveTimeout) return;
    saveTimeout = setTimeout(function() { save(true); }, 5000);
    $('.save button').attr('disabled', false);
  }

  // Create a DOM node for viewing/editing availability.
  function createAvailability(person, dateIndex) {
    var classes = { '-1': 'no', '0': 'maybe', '1': 'yes' };
    function onChange(event) {
      element.find('.toggle').toggleClass('checked', false);
      $(this).addClass('checked');

      var prev = availability[0] || 0;
      availability[0] = $(this).data('value');
      if (availability[0] == prev) return;

      var dateItem = $('.appointment .dates li:nth(' + dateIndex + ')');
      var dateTime = dateItem.data('dateTime');
      if (availability[0] != 0) dateTime[classes[availability[0]]]++;
      if (prev == 1) dateTime.yes--;
      if (prev == -1) dateTime.no--;
      updateBar(dateItem);

      element.toggleClass(classes[prev], false);
      element.toggleClass(classes[availability[0]], true);

      planSave();
    }

    var element = $('<div class=availability>');
    var availability = person.availability[dateIndex];
    if (person.isMe) {
      element.addClass('form');

      var choose = $('<div class=choose>').appendTo(element);
      var buttons = [
        $('<div class="toggle label-yes">'),
        $('<div class="toggle label-maybe">'),
        $('<div class="toggle label-no">')
      ];

      $(buttons).each(function(i) {
        this.data('value', 1 - i).appendTo(choose).click(onChange);
      });

      element.addClass(classes['' + (availability[0] || 0)]);

      var selectedAny = false;
      for (var j = 0; j < 3; j++) {
        if (availability.length && availability[0] == 1 - j) {
          buttons[j].addClass('checked');
          selectedAny = true;
        }
      }
      if (!selectedAny) buttons[1].addClass('checked');

      var entry = $('<textarea>').keydown(function(event) {
        if (event.keyCode == 13) // enter
          event.preventDefault();
      }).keyup(function() {
        availability[1] = this.value;
        planSave();
      }).bind('keyup blur', function() {
        if (this.value.length > MAX_COMMENT_LENGTH) {
          this.value = this.value.substr(0, MAX_COMMENT_LENGTH);
          return false;
        }
      }).appendTo(element).val(availability[1] || '');
    } else {
      var possible = $('<div class=possible>').appendTo(element);
      var comment = $('<div class=comment>').appendTo(element);
      element.addClass('static');
      if (availability.length) {
        element.addClass(classes[availability[0]]);
        $('<div>').addClass('label-' + classes[availability[0]])
          .appendTo(possible);
        comment.text(availability[1] || '');
      } else {
        element.addClass('maybe');
        $('<div class=label-maybe>').appendTo(possible);
        comment.text('[' + gettext('Not filled in yet.') + ']');
      }
    }
    return element;
  }

  function setupTools(data) {
    if (data.meta.initiator == data.user || data.meta.proposeMore) {
      // Propose another date
      $('.propose-date input[name=id]').val(window.id);
    }

    if (data.meta.initiator == data.user) {
      // Resend invitations
      $('.resend-invitations input[name=id]').val(window.id);
      $.each(data.people, function() {
        if (this.id != data.invitee)
          $('<option>').val(this.id).text(this.name)
            .appendTo('.resend-invitations select[name=invitee]');
      });
      if (data.people.length == 1)
        $('.resend-invitations select, button').attr('disabled', true);

      // Invite another participant
      $('.invite-participant input[name=id]').val(window.id);

      // Email addresses of the invitees
      var s = [];
      $.each(data.addresses, function() { s.push(this); });
      $('.email-addresses textarea').val(s.join(', '));
      if (data.people.length == 1)
        $('.email-addresses textarea').attr('disabled', true);
    } else 
      $('.resend-invitations, .email-addresses, .invite-participant')
        .css('display', 'none');

    $('.tools form').submit(function() {
      var form = this;
      $(this).find('button').attr('disabled', true);
      $(this).find('.success, .error').text('');
      $.ajax({
        type: 'POST',
        url: this.action,
        data: $(this).serialize(),
        success: function() {
          $(form).find('.success').text(gettext('Done!'));
          $(form).find('button').attr('disabled', false);
          if ($(form).hasClass('invite-participant') ||
              $(form).hasClass('propose-date')) location.reload();
        },
        error: function() {
          $(form).find('.error').text(gettext('An error occurred.'));
          $(form).find('button').attr('disabled', false);
        }
      });
      return false;
    });
  }
});
