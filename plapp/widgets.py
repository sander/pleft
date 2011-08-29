# -*- coding: utf-8 -*-

# Copyright 2009, 2010, 2011 Sander Dijkhuis <sander.dijkhuis@gmail.com>
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

from django.forms import widgets
from django.forms.util import flatatt
from django.utils.safestring import mark_safe
from django.utils.translation import ugettext as _

class DateTimeListWidget(widgets.Widget):
    def __init__(self, attrs=None):
        default_attrs = {}
        super(DateTimeListWidget, self).__init__(default_attrs)

    def is_date_time_picker(self):
        return True

    def render(self, name, value, attrs=None):
        final_attrs = self.build_attrs(attrs, name=name)
        return mark_safe(u"""
<div class=date-time-picker%s>
  <div class=week-days>
  </div>
  <div class=container>
    <div class=label>
      <a class='choose up' style='visibility: hidden'>▲</a>
      <span class=month-label></span>
      <a class='choose down'>▼</a>
    </div>
    <div class=days></div>
  </div>
  <div class=selected-container>
    <p class=selected-header>%s
    <div class=selected-times></div>
  </div>
</div>
""" % (flatatt(final_attrs), _('Selected times:')))

    class Media:
        css = {
            'all': ('style/caleftar.css',)
        }
        js = ('script/caleftar.js', 'third-party/jquery.timePicker.js')

class ImprovedTextarea(widgets.Textarea):
    def __init__(self, attrs=None):
        # The 'rows' and 'cols' attributes are required for HTML correctness.
        default_attrs = {}
        if attrs:
            default_attrs.update(attrs)
        super(widgets.Textarea, self).__init__(default_attrs)

    class Media:
        js = ('script/textarea.js',)
