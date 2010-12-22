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

from django.conf import settings
from django.core.cache import cache
from django import template
from django.template.defaultfilters import stringfilter
from django.utils.dateformat import format
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext as _

import plapp
import plapp.models
import plauth.models

register = template.Library()

@register.filter
@stringfilter
def json_escape(value):
    """
    Escapes a string for use within JSON by adding slashes.

    >>> s = '\\ "'
    >>> print s
    \ "
    >>> print json_escape(s)
    \\\\ \\\"
    """
    return mark_safe(value.replace('\\', '\\\\').replace('"', '\\"'))
json_escape.is_safe = True

@register.simple_tag
def local_short_date(date):
    return format(date, _('D M d, G:i'))

@register.simple_tag
def google_analytics_snippet(request):
    if not hasattr(settings, 'GOOGLE_ANALYTICS'):
	return ''

    if plauth.models.User.get_signed_in(request):
        signedin = 'true'
    else:
        signedin = 'false'

    return '''<script>
var _gaq = _gaq || [];
_gaq.push(
  ['_setAccount', '%(code)s'],
  ['_setCustomVar', 1, 'Language set', '%(lang)s', 1],
  ['_setCustomVar', 2, 'Signed in', '%(signedin)s', 2],
  ['_trackPageview']
);

var pressButt = document.getElementById('presentation-button');
if (pressButt) {
  pressButt.onclick = function() {
    _gaq.push(['_trackEvent', 'Promotion', 'Presentation']);
  };
}

(function() {
  var ga = document.createElement('script');
  ga.src = ('http://www.google-analytics.com/ga.js');
  ga.setAttribute('async', 'true');
  document.documentElement.firstChild.appendChild(ga);
})();
</script>''' % {'code': settings.GOOGLE_ANALYTICS, 'lang': request.LANGUAGE_CODE, 'signedin': signedin}

@register.simple_tag
def insert_script(filename):
    if settings.DEBUG:
        return "<script src='http://localhost:9810/compile?id=%s'></script>" \
	    % filename
    else:
        return "<script src='/static/scripts/%s.cjs'></script>" % filename
