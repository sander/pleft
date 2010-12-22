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

import datetime

from django.core.exceptions import ObjectDoesNotExist
from django.db import models

import plauth

class User(models.Model):
    "A Pleft user."
    email = models.EmailField(blank=True, null=True, max_length=255)
    password = models.CharField(blank=True, null=True, max_length=255)

    # Date/time when the user was last signed in.
    last_signed_in = models.DateTimeField(blank=True, null=True)

    def __unicode__(self):
        return u'%s' % self.email
 
    def email_name(self):
        """
        Get the part of the email address before the @ sign.

        >>> user = User.create('info@pleft.com')
        >>> user.email_name()
        u'info'
        """
        return self.email.split('@')[0]

    def sign_in(self, request):
        request.session['user'] = self

        self.last_signed_in = datetime.datetime.now()
        self.save()

    @staticmethod
    def sign_out(request):
        if 'user' in request.session:
            del request.session['user']

    @classmethod
    def create(cls, email):
        """
        Create a user for the given email address.

        >>> user = User.create('info@pleft.com')
        >>> not user.password
        False
        """

        user = cls()
        user.email = email
        user.password = plauth.make_random_password()
        user.save()

        return user

    @classmethod
    def get_or_create(cls, email):
        """
        Returns a User instance with the specified email address.

        >>> user1 = User.get_or_create('info@pleft.com')
        >>> user2 = User.get_or_create('info@pleft.com')
        >>> user1.get_id() == user2.get_id()
        True
        """
        try:
            user = cls.objects.all().get(email=email)
        except ObjectDoesNotExist:
            user = cls.create(email)
        return user

    @classmethod
    def get_signed_in(cls, request):
        if 'user' in request.session:
            return request.session['user']
        else:
            return None
