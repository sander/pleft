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

from django import forms
from django.utils.translation import ugettext as _

import fields
import models

class AppointmentForm(forms.Form):
    description = fields.TextField(max_length=1000, required=False,
        help_text=_('What, where, how?'))
    invitees = fields.EmailListField(max_length=2000, required=False,
        help_text=
            _('Example: john.doe@example.com, Jane Doe <jane@example.net>'))
    dates = fields.DateTimeListField(required=False, label=_('Proposed dates'))
    propose_more = forms.BooleanField(required=False,
        label=_('Invitees may propose more dates'), initial=True)
    name = forms.CharField(max_length=100, required=False,
        label=_('Your name'))
    email = forms.EmailField(required=True, label=_('Email address'))

    class Media:
        css = { 'all': ('style/form.css',) }
        js = ('script/form.js',)

class ResendInvitationForm(forms.Form):
    id = forms.ModelChoiceField(
        queryset=models.Appointment.objects.filter(visible=True),
        widget=forms.HiddenInput)
    invitee = forms.IntegerField(widget=forms.Select)

class InviteParticipantForm(forms.Form):
    id = forms.ModelChoiceField(
        queryset=models.Appointment.objects.filter(visible=True),
        widget=forms.HiddenInput)
    name = forms.CharField(max_length=100)
    email = forms.EmailField()
