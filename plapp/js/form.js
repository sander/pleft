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
 * @fileoverview The form for creating appointments.
 * @author sander.dijkhuis@gmail.com (Sander Dijkhuis)
 */

goog.provide('pleft.form');

goog.require('goog.debug.ErrorHandler');
goog.require('goog.dom');
goog.require('goog.dom.classes');
goog.require('goog.events');
goog.require('goog.net.EventType');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.CharCounter');
goog.require('goog.ui.Component');
goog.require('goog.ui.CustomButton');
goog.require('goog.ui.Dialog');
goog.require('goog.Uri');
goog.require('pleft.autoexpand');
goog.require('pleft.caleftar.Caleftar');
goog.require('pleft.main');

/**
 * Initializes the form. Requires a matching DOM representation being present.
 */
pleft.form.init = function() {
  pleft.main.init();

  // Create the button.
  var button = new goog.ui.CustomButton(gettext('Send invitations'));
  button.addClassName('default-button');
  button.render(document.getElementById('button'));

  // Create the calendar.
  var cal = new pleft.caleftar.Caleftar();
  cal.create(document.getElementById('dates'));

  // Make text fields expand automatically.
  pleft.autoexpand.install(document.getElementById('desc'));
  pleft.autoexpand.install(document.getElementById('invitees'));

  // Make text field have limited length.
  var dummy = document.createElement('span');
  new goog.ui.CharCounter(document.getElementById('desc'), dummy, 1000);
  new goog.ui.CharCounter(document.getElementById('invitees'), dummy, 2000);

  document.getElementById('status').style.display = 'none';

  var errors = {
    invitees: false,
    email: false
  };

  goog.events.listen(document.getElementById('create'),
                     goog.events.EventType.SUBMIT, function(event) {
                       event.preventDefault();
                     });

  var email = document.getElementById('field-email');
  var emailBlock = email.parentNode.parentNode.parentNode;
  function checkMail() {
    var e = null;
    if (!email.value) {
      e = gettext('Please enter your email address.');
    } else {
      var regexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,4})+$/;
      if (!regexp.test(email.value)) {
        e = gettext('This email address doesn‘t seem to be valid.');
      }
    }
    if (e) {
      errors.email = true;
      goog.dom.classes.add(emailBlock, 'with-error');
      goog.dom.$$('div', 'error', emailBlock)[0].innerHTML = e;
    }
  };
  goog.events.listen(email, goog.events.EventType.BLUR, checkMail, false);
  goog.events.listen(email, goog.events.EventType.FOCUS, function() {
    errors.email = false;
    goog.dom.classes.remove(emailBlock, 'with-error');
    goog.dom.$$('div', 'error', emailBlock)[0].innerHTML = '';
  }, false);

  var invitees = document.getElementById('invitees');
  var invBlock = invitees.parentNode.parentNode.parentNode;
  goog.events.listen(invitees, goog.events.EventType.BLUR, function() {
    if (invitees.value) {
      var regexp = new RegExp('(?:[a-z0-9!#$%&\'*+/=?^_`{|}~-]+(?:\\.[a-z0-9!' +
          '#$%&\'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-' +
          '\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?' +
          ':[a-z0-9-]*[a-z0-9])?\\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\\[(?:(?' +
          ':25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9' +
          ']|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-' +
          '\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\\])');
      // Source: http://www.regular-expressions.info/email.html
      var items = invitees.value.split(',').join('\n').split('\n');
      for (var i = 0; i < items.length; i++) {
        if (!(/^\s*$/.test(items[i])) && !regexp.test(items[i])) {
          errors.invitees = true;
          goog.dom.classes.add(invBlock, 'with-error');
          goog.dom.$$('div', 'error', invBlock)[0].innerHTML = gettext(
              'There seems to be an invalid email address in this list:') +
              ' ‘' +
              items[i].replace(/^\s+/, '').replace(/\s+$/, '') + '’';
          return;
        }
      }
    }
  }, false);
  goog.events.listen(invitees, goog.events.EventType.FOCUS, function() {
    errors.invitees = false;
    goog.dom.classes.remove(invBlock, 'with-error');
    goog.dom.$$('div', 'error', invBlock)[0].innerHTML = '';
  }, false);

  var block = document.getElementById('button-block');
  var span = goog.dom.$$('div', 'error', block)[0];
  button.setDispatchTransitionEvents(goog.ui.Component.State.ALL, true);
  button.addEventListener(goog.ui.Component.EventType.ACTION, function() {
    checkMail();
    if (errors.email || errors.invitees) {
      goog.dom.classes.add(block, 'with-error');
      span.innerHTML = gettext(
          'Sorry, I do not fully understand your input yet.') +
          gettext('Please check the form for any warnings.');
    } else {
      submit();
    }
  }, false);
  button.addEventListener(goog.ui.Component.EventType.BLUR, function() {
    goog.dom.classes.remove(block, 'with-error');
    span.innerHTML = '';
  }, false);

  function submit() {
    var data = '';

    var e = encodeURIComponent;

    data += 'description=' + e(document.getElementById('desc').value);
    data += '&name=' + e(document.getElementById('field-name').value);
    data += '&email=' + e(document.getElementById('field-email').value);
    data += '&invitees=' + e(document.getElementById('invitees').value);

    data += '&dates=' + e(cal.getDatesString());

    data += '&propose_more=';
    if (document.getElementById('inviteespropose').value == 'on') {
      data += '1';
    } else {
      data += '0';
    }

    var app = goog.dom.getElementsByTagNameAndClass('div', 'appointment')[0];
    var help = goog.dom.getElementsByTagNameAndClass('div', 'side-help')[0];
    var status = document.getElementById('status');

    status.innerHTML = '<p>' + gettext('Creating an appointment…') + '</p>';
    status.style.display = 'block';
    app.style.display = help.style.display = 'none';

    var xhr = new goog.net.XhrIo();

    goog.events.listen(xhr, goog.net.EventType.READY_STATE_CHANGE, function(e) {
        var xhr = e.target;

        if (xhr.isComplete()) {
          if (xhr.getStatus() == 200) {
            complete(e);
          } else {
            window['error'] = xhr.getResponseText();
            window['showError'] = function() {
              window.open().document.body.parentNode.innerHTML =
                  window['error'];
            };
            status.innerHTML = '<p>' + gettext('Sorry, something went wrong.') +
                ' ' + gettext('This should not happen.') +
                ' <a href="#" id="again">' +
                gettext('Click here to go back to the form.') + '</a></p>';
            document.getElementById('again').onclick = function() {
              app.style.display = help.style.display = 'block';
              status.style.display = 'none';
            };
          }
        }
      });

    xhr.send('/create', 'POST', data);

    function complete(event) {
      var data = event.target.getResponseText();

      if (data != '0') {
        if (window['_gaq']) {
          _gaq.push(['_trackEvent', 'Appointments', 'Create']);
        }
        if (window['signedIn']) {
          window['location'].href = data;
        } else {
          status.innerHTML = '<p>' + gettext('Created!') + ' ' +
              gettext('Please check your email.') + '</p>';
        }
      } else {
        status.innerHTML = '<p>' + gettext('Sorry, something went wrong.') +
            gettext('This should not happen.') + ' <a href="#" id="again">' +
            gettext('Click here to go back to the form.') + '</a></p>';
        document.getElementById('again').onclick = function() {
          app.style.display = help.style.display = 'block';
          status.style.display = 'none';
        };
      }
    }
  };

  goog.events.listen(goog.dom.getElement('presentation-button'),
                     goog.events.EventType.CLICK,
      function(event) {
        var dialog = new goog.ui.Dialog();
        dialog.setButtonSet(null);
        dialog.setTitle(gettext('Pleft: the presentation!'));
        dialog.setContent(
            '<object id="prezi_ypue_lepzywa" name="prezi_ypue_lepzywa" ' +
            'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="550"' +
            'height="400"><param name="movie" ' +
            'value="http://prezi.com/bin/preziloader.swf"/><param name=' +
            '"allowfullscreen" value="true"/><param name="allowscriptaccess" ' +
            'value="always"/><param name="bgcolor" value="#ffffff"/><param ' +
            'name="flashvars" value="prezi_id=ypue_lepzywa&lock_to_path=0&' +
            'color=ffffff&autoplay=autostart&autohide_ctrls=1"/><embed id=' +
            '"preziEmbed_ypue_lepzywa" name="preziEmbed_ypue_lepzywa" src=' +
            '"http://prezi.com/bin/preziloader.swf" type=' +
            '"application/x-shockwave-flash" allowfullscreen="true" ' +
            'allowscriptaccess="always" width="550" height="400" bgcolor=' +
            '"#ffffff" flashvars="prezi_id=ypue_lepzywa&lock_to_path=0&color=' +
            'ffffff&autoplay=autostart&autohide_ctrls=1"></embed></object>');
        dialog.setVisible(true);
      });

  goog.events.listen(goog.dom.getElement('mail-preview'),
                     goog.events.EventType.CLICK,
      function(event) {
        var dialog = new goog.ui.Dialog();
        dialog.setButtonSet(null);
        dialog.setTitle(gettext('Example invitation email'));
        dialog.setContent('<img src="/static/images/preview-mail.png" ' +
                          'style="width:430px;height:363px">');
        dialog.setVisible(true);
      });

  goog.events.listen(goog.dom.getElement('overview-preview'),
                     goog.events.EventType.CLICK,
      function(event) {
        var dialog = new goog.ui.Dialog();
        dialog.setButtonSet(null);
        dialog.setTitle(gettext('Example appointment overview'));
        dialog.setContent('<img src="/static/images/preview-overview.png" ' +
                          'style="width:844px;height:502px">');
        dialog.setVisible(true);
      });
};

goog.exportSymbol('pleft.form.init', pleft.form.init);
