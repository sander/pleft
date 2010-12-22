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

# General utilities for Pleft.

import re

from django.template.defaultfilters import escape
from django.template.loader import render_to_string
from django.utils.text import wrap

def get_cache_key(data_type, **kwargs):
    def _get(arg):
        if arg in kwargs:
            return str(kwargs[arg])
        else:
            return None
    key = data_type + '_' + (_get('appointment') or _get('invitee'))
    if _get('appointment') and _get('invitee'):
        key += '_' + _get('invitee')
    return key

def get_menu_cache_key(user):
    return 'menu_%s' % user.id

def clear_menu_cache(user):
    from django.core.cache import cache
    cache.delete(get_menu_cache_key(user))

def send_mail(subject, template, address, name, title, url, initiator=''):
    """Send an appointment email"""
    from django.conf import settings

    content = prepare_mail(template, name, title, url, initiator)

    params = {'sender': settings.MAIL_SENDER,
              'to': '%s <%s>' % (name, address),
              'subject': subject,
              'body': content['body'],
              'html': content['html']}

    from django.core import mail

    msg = mail.EmailMultiAlternatives(params['subject'],
                                      params['body'],
                                      params['sender'],
                                      [params['to']])
    msg.attach_alternative(params['html'], 'text/html')
    msg.send()

def prepare_mail(template, name, title, url, initiator):
    from django.conf import settings

    abuse = settings.ABUSE_EMAIL
    site = settings.SITE_DOMAIN

    # Plain text email
    body_params = { 'name': name,
               'title_and_link': '{{ title_and_link }}',
               'abuse_address': abuse,
               'site_name': settings.SITE_NAME,
               'site_link': settings.SITE_BASE + '/',
               'initiator': initiator }
    body = render_to_string(template, body_params)
    body = re.sub('\n(\n)+', '\n\n', body)
    body = wrap(body.strip(), 74) + '\n'
    body = body.replace('{{ title_and_link }}',
                        '    %s\n    %s' % (title, url))

    # HTML email
    name = escape(name)
    title = escape(title)
    initiator = escape(initiator)
    html_params = { 'name': name,
                    'title_and_link': '&nbsp; &nbsp; <a href="%s" style="color:blue"><b>%s</b></a>' % (url, title),
                    'abuse_address': '<a href="mailto:%s" style="color:blue">%s</a>' % (abuse, abuse),
                    'site_name': settings.SITE_NAME,
                    'site_link': '<a href="%s/" style="color:blue">%s</a>' % (settings.SITE_BASE, settings.SITE_DOMAIN),
                    'initiator': initiator }
    html = render_to_string(template, html_params)
    html = re.sub('\n(\n)+', '\n\n', html.strip())
    html = html.replace('\n\n', '<p>').replace('\n', '<br>')
    html = '<div style="font:14px Arial,sans-serif;color:#000;background:#fff;max-width:420px"><p><img src="%s" alt="%s"><p>%s</div>\n' % (settings.EMAIL_LOGO, settings.SITE_NAME, html)

    return {'body': body, 'html': html}
