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

from email.utils import getaddresses, formataddr

import django.forms
from django.utils.translation import ugettext_lazy as _

class DateTimeListField(django.forms.CharField):
    def clean(self, value):
        value = super(DateTimeListField, self).clean(value)

        datetimes = value.split('\n')

        # FIXME: check them using DateTimeField first.

        return datetimes

class EmailListField(django.forms.CharField):
    """
    A Django form field which validates a list of email addresses.

    Taken from http://www.djangosnippets.org/snippets/1677/
    and modified
    """
    default_error_messages = {
        'invalid': _('Please enter a valid list of email addresses.')
    }

    def clean(self, value):
        value = super(EmailListField, self).clean(value).strip() \
                .replace(';', ',')

        field = django.forms.EmailField()

        try:
            return getaddresses([', '.join([
                formataddr((name, field.clean(addr)))
            for name, addr in getaddresses([value])])])
        except django.forms.ValidationError:
            raise django.forms.ValidationError(self.error_messages['invalid'])
