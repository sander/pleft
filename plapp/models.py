# Copyright 2009, 2010 Sander Dijkhuis <sander.dijkhuis@gmail.com>
#
# This file is part of Pleft.
#
# Pleft is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Pleft is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Pleft. If not, see <http://www.gnu.org/licenses/>.

from django.db import models
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.template.context import RequestContext
from django.template.loader import render_to_string
from django.utils import simplejson
from django.utils.translation import ugettext as _

import plauth.models

import plapp

class Appointment(models.Model):
    """
    An appointment.
    """
    created = models.DateTimeField(blank=True, null=True, auto_now_add=True)
    initiator = models.ForeignKey(plauth.models.User, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    propose_more = models.BooleanField(default=False)
    visible = models.BooleanField(default=False)

    def get_metadata(self):
        metadata = {
            'initiator': self.initiator.id,
            'title': self.get_title(),
            'description': self.get_html_desc(),
            'proposeMore': self.propose_more,
            }
        return metadata

    def get_title(self):
        """
        Returns the title derived from the description.

        >>> appointment = Appointment()
        >>> appointment.description = 'Hello World!'
        >>> appointment.get_title()
        u'Hello World'
        >>> appointment.description = 'Hello! World!'
        >>> appointment.get_title()
        u'Hello'
        >>> appointment.description = 'Hello. World!'
        >>> appointment.get_title()
        u'Hello'
        >>> appointment.description = 'Hello\\nWorld!'
        >>> appointment.get_title()
        u'Hello'
        """
        title = self.description.split('\n')[0].split('.')[0].split('!')[0]
        title = title.replace('\r', '')

        return title or _('(no title)')

    def get_html_desc(self):
        # TODO(sander) Do this in JS.
        if not self.description:
            return u'<b>%s</b>' % _('(no title)')

        desc = self.description.replace('<', '&lt;')
        desc = desc.replace('>', '&gt;').replace('\r', '') + '\n'
        dot_index = desc.find('.') + 1
        exc_index = desc.find('!') + 1
        if exc_index > 0 and exc_index < dot_index:
            dot_index = exc_index
        if dot_index < 1:
            dot_index = 99999
        newline_index = desc.find('\n')
        if newline_index < 1:
            newline_index = 99999
        index = min(dot_index, newline_index)
        desc = u'<b>%s</b>%s' % (desc[:index], desc[index:])
        desc = desc.replace('\n', '<br>')

        return desc

    def __str__(self):
        return '%s' % self.description

    def __unicode__(self):
        return self.description

    def get_url(self, user=None, password=None, verify=False):
        url = settings.SITE_BASE
        if verify:
            url += '/verify'
        else:
            url += '/a'
        url += '?id=%s' % self.id
        if user and password:
            url += '&u=%s&p=%s' % (user.replace('+', '%2B'), password)

        return url

    def send_overview_mail(self, request):
        plapp.clear_menu_cache(self.initiator)

        invitee = Invitee.objects.all().get(user=self.initiator, appointment=self)

        plapp.send_mail(
            subject='%s: %s' % (_('Overview'), self.get_title()),
            template='plapp/mail/overview.txt',
            address=self.initiator.email,
            name=invitee.get_name(),
            title=self.get_title(),
            url=self.get_url(self.initiator.email,
                             self.initiator.password))

    def send_invitation(self, invitee, initiator, request):
        plapp.clear_menu_cache(invitee.user)

        plapp.send_mail(
            subject='%s: %s' % (_('Invitation'), self.get_title()),
            template='plapp/mail/invited.txt',
            address=invitee.user.email,
            name=invitee.get_name(),
            title=self.get_title(),
            url=self.get_url(invitee.user.email,
                             invitee.user.password),
            initiator=initiator.get_name())

    def send_invitations(self, request):
        # TODO(sander) Use Django's send_mass_mail when possible.
        initiator = Invitee.objects.all().get(user=self.initiator, appointment=self)

        for invitee in self.invitee_set.all():
            if invitee.user.id != self.initiator.id:
                self.send_invitation(invitee, initiator, request)

    def get_ordered_dates(self):
        return Date.objects.filter(appointment=self).order_by('date_time')

    @classmethod
    def get_unarchived_for_user(cls, user):
        invitees = Invitee.objects.all().filter(user=user,
                                                archived=False,
                                                appointment__visible=True)
        return [i.appointment for i in invitees]

class Invitee(models.Model):
    added = models.DateTimeField(blank=True, null=True, auto_now_add=True)
    user = models.ForeignKey(plauth.models.User, blank=True, null=True)
    appointment = models.ForeignKey(Appointment, blank=True, null=True)
    name = models.CharField(blank=True, null=True, max_length=255)
    archived = models.BooleanField(default=False)

    def get_name(self):
        if self.name:
            return self.name
        else:
            return self.user.email.split('@')[0]

    @classmethod
    def get_or_create(cls, user, appointment):
        """
        Returns an Invitee instance with the specified email address.
        """
        try:
            invitee = cls.objects.all().get(user=user, appointment=appointment)
        except ObjectDoesNotExist:
            invitee = cls(user=user, appointment=appointment)
            invitee.save()
        return invitee 

class Date(models.Model):
    created = models.DateTimeField(blank=True, null=True, auto_now_add=True)
    appointment = models.ForeignKey(Appointment, blank=True, null=True)
    date_time = models.DateTimeField(blank=True, null=True)
    invitee = models.ForeignKey(Invitee, blank=True, null=True)

class Availability(models.Model):
    date = models.ForeignKey(Date, blank=True, null=True)
    invitee = models.ForeignKey(Invitee, blank=True, null=True)
    possible = models.SmallIntegerField(default=0, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
