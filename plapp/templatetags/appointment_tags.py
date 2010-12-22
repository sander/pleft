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

from django import template
from django.utils.html import escape
from django.utils.translation import ugettext as _

import plapp.models

register = template.Library()

@register.simple_tag
def get_availability(invitee, date):
    availability = plapp.models.Availability.get(invitee=invitee, date=date)

    if not availability:
        return '[]'

    comment = availability.comment
    if not comment:
        comment = ''

    comment = comment.replace('&', '&amp;').replace('<', '&gt;')
    comment = comment.replace('"', '&quot;')

    return '[%d, "%s"]' % (availability.possible, comment)

@register.simple_tag
def get_initiator_name(appointment, user):
    """
    Returns the name of the appointment's initiator or "me."

    >>> from plapp.models import Appointment, Invitee
    >>> from plauth.models import User
    >>> john = User()
    >>> john.save()
    >>> jane = User()
    >>> jane.save()
    >>> appointment = Appointment(initiator=john)
    >>> appointment.save()
    >>> Invitee(user=john, appointment=appointment, name='John').save()
    >>> Invitee(user=jane, appointment=appointment, name='Jane').save()
    >>> get_initiator_name(appointment, john)
    u'me'
    >>> get_initiator_name(appointment, jane)
    u'John'
    """
    if appointment.initiator == user:
        return _('me')

    return escape(plapp.models.Invitee.objects.all().get(user=appointment.initiator,
        appointment=appointment).get_name())
