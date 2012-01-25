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

// The appointment creation form.

$(function() {
  'use strict';

  var errors = { invitees: null, email: null };

  function removeError(field) {
    $(field).parents('.field').toggleClass('with-error', false)
      .find('.error').text();
  }

  $('#id_email').blur(function() {
    if (!this.value)
      errors.email = gettext('Please enter your email address.');
    else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/.test(this.value))
      errors.email = gettext('This email address doesn‘t seem to be valid.');
    else errors.email = null;
    if (errors.email)
      $(this).parents('.field').addClass('with-error')
        .find('.error').text(errors.email);
  }).focus(function() {
    errors.email = null;
    removeError(this);
  });

  $('#id_invitees').blur(function() {
    var field = this;
    if (this.value) {
      var regexp = new RegExp([
        '(?:[a-zA-Z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-zA-Z0-9!',
        '#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-',
        '\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?',
        ':[a-zA-Z0-9-]*[a-zA-Z0-9])?\\.)+[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9',
        '])?|\\[(?:(?',
        ':25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9',
        ']|[01]?[0-9][0-9]?|[a-z0-9-]*[a-zA-Z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-',
        '\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])'
      ].join(''));
      // Source: http://www.regular-expressions.info/email.html
      $(this.value.split(',').join('\n').split('\n')).each(function(i, item) {
        if ((/^\s*$/.test(item)) || regexp.test(item)) return;
        errors.invitees = [
          gettext('There seems to be an invalid email address in this list:'),
          ' ‘',
          item.replace(/^\s+/, '').replace(/\s+$/, ''),
          '’'
        ].join('');
        $(field).parents('.field').addClass('with-error')
          .find('.error').text(errors.invitees);
      });
    }
  }).focus(function() {
    errors.invitees = null;
    removeError(this);
  });

  $('#status').css('display', 'none');
  $('#create').submit(function() { return false; });
  $('#button-block button').click(function() {
    $('#id_email').blur();
    $('#id_invitees').blur();
    if (errors.email || errors.invitees)
      $('#button-block').addClass('with-error')
        .find('.error').text([
          gettext('Sorry, I do not fully understand your input yet.'),
          gettext('Please check the form for any warnings.')
        ].join(' '));
    else submit();
  }).blur(function() { removeError(this); });

  function submit() {
    $('.appointment, .side-help').css('display', 'none');
    $('#status').css('display', 'block')
      .find('p').text(gettext('Creating an appointment…'));

    function unknownError() {
      $('#status p').text([
        gettext('Sorry, something went wrong.'),
        gettext('This should not happen.'),
        ' '
      ].join(' '));
      $('<a href=#>').text(gettext('Click here to go back to the form.'))
        .appendTo('#status p').click(function() {
        $('.appointment, .side-help').css('display', 'block');
        $('#status').css('display', 'none');
      });
    }

    $.post('/create', {
      description: $('#id_description').val(),
      name: $('#id_name').val(),
      email: $('#id_email').val(),
      invitees: $('#id_invitees').val(),
      dates: $('#id_dates').get(0).getDatesString(),
      propose_more: $('#id_propose_more').attr('checked') ? 1 : 0
    }).success(function(data) {
      if (data == '0') return unknownError();
      if (window._gaq) _gaq.push(['_trackEvent', 'Appointments', 'Create']);
      if ($('.menu-bar .account .email').length) location.href = data;
      else $('#status p').text([
        gettext('Created!'),
        gettext('Please check your email.')
      ].join(' '));
    }).error(unknownError);
  }

  // Explanation popup buttons.
  $('.in-popup').click(function() {
    // Close any open menus.
    $('.menu').toggleClass('open', false);

    $('.popup').toggleClass('open', true);
    $('.popup h1').text(this.title);
    var ytPrefix = 'http://www.youtube.com/watch?v=';
    if (this.href.substr(0, ytPrefix.length) == ytPrefix) {
      var id = this.href.substr(ytPrefix.length);
      $('.popup > div').html($('<iframe>').attr({
        width: 480,
        height: 390,
        src: 'http://www.youtube.com/embed/' + id + '?rel=0&autoplay=1',
        frameborder: 0
      }));
      if (window._gaq) _gaq.push(['_trackEvent', 'Promotion', 'Presentation']);
    } else $('.popup > div').html($('<img>').attr('src', this.href));
    return false;
  });
  $('.popup > p a').click(function() {
    $('.popup').toggleClass('open', false);
    $('.popup > div').html('');
  });
});
