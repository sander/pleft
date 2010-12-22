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

from django import http
from django.core.exceptions import ObjectDoesNotExist
from django.shortcuts import render_to_response
from django.template.context import RequestContext

import plauth
import plauth.models as models

class SignInMiddleware(object):
    "Sign in the user if there are 'u' and 'p' request args."
    def process_request(self, request):
        if not 'u' in request.GET or not 'p' in request.GET:
            return None

        # If the user is already signed in, don't bother about the password.
        signed_in = models.User.get_signed_in(request)
        if signed_in and signed_in.email == request.GET['u']:
            # Strip u and p from the request query.
            url = '%s?%s' % (request.path,
                             '&'.join(['%s=%s' % (k, v)
                                       for k, v in request.GET.items()
                                       if k not in ('u', 'p')]))
            return http.HttpResponseRedirect(url)
        else:
            models.User.sign_out(request)

        # Sign in if the email and password are correct.
        try:
            user = models.User.objects.all().get(email=request.GET['u'],
                                                 password=request.GET['p'])
        except ObjectDoesNotExist:
            # Wrong email/password. Don't tell which one is wrong, so that
            # people cannot see who is using Pleft.
            return render_to_response('plauth/wrong-email-pass.html', {},
                                      context_instance=RequestContext(request))

        user.sign_in(request)

        # Strip u and p from the request query.
        url = '%s?%s' % (request.path,
                         '&'.join(['%s=%s' % (k, v)
                                   for k, v in request.GET.items()
                                   if k not in ('u', 'p')]))
        # Is there a better method to avoid the current page from
        # appearing in the browser history? The URL has the user password
        # in it! location.replace() in JS isn't sufficient.
        return http.HttpResponseRedirect(url)
