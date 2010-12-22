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

from django.conf.urls.defaults import *

def tpl(urlpattern, template, mimetype='text/html; charset=utf-8'):
    return (urlpattern, 'django.views.generic.simple.direct_to_template',
            {'template': template, 'mimetype': mimetype})

js_info_dict = {
    'packages': ('plapp',),
}

urlpatterns = patterns(
    '',
    (r'^a$', 'plapp.views.appointment'),
    (r'^data$', 'plapp.views.appointment_data'),
    (r'^appointments$', 'plapp.views.appointment_list'),
    (r'^menu$', 'plapp.views.appointment_menu'),
    (r'^create$', 'plapp.views.create'),
    (r'^verify$', 'plapp.views.verify'),
    (r'^archive$', 'plapp.views.archive'),
    (r'^set-availability$', 'plapp.views.set_availability'),
    (r'^resend-invitation$', 'plapp.views.resend_invitation'),
    (r'^add-invitees$', 'plapp.views.add_invitees'),
    (r'^add-dates$', 'plapp.views.add_dates'),

    tpl(r'^$', 'plapp/home.html'),
    tpl(r'^legal-notices$', 'legal-notices.html'),

    (r'^signout$', 'plauth.views.sign_out'),

    (r'^i18n/', include('django.conf.urls.i18n')),
    (r'^jsi18n/$', 'django.views.i18n.javascript_catalog', js_info_dict),
)
