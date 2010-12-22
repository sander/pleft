# -*- coding: utf-8 -*-

# Copyright 2010 Sander Dijkhuis <sander.dijkhuis@gmail.com>
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

# Django settings for Pleft.

import os

from plapp.settings_common import *
from local_settings import *

TEMPLATE_DEBUG = DEBUG

SITE_NAME = 'Pleft'

ALPHA = False

ADMINS = (
    ('Sander Dijkhuis', 'sander@pleft.com'),
)

MANAGERS = ADMINS

SITE_BASE = 'http://' +  SITE_DOMAIN

LANGUAGE_CODE = 'en'
USE_I18N = True

LANGUAGES = (
    ('en', 'English'),
    ('fr', 'Français'),
    ('de', 'Deutsch'),
    ('it', 'Italiano'),
    ('nl', 'Nederlands'),
    ('ru', 'Русский'),
)

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = '/home/sander/git/pleft/static'

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/static/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
#ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'ci^zu4)gr=&!!%=sl+49(3l)a!t1-+15^(=+t5o5byzar5yten'

ROOT_URLCONF = 'pleft.urls'

ROOT_PATH = os.path.dirname(__file__)
TEMPLATE_DIRS = (
    ROOT_PATH + '/templates',
)

SESSION_ENGINE = 'django.contrib.sessions.backends.db'

ABUSE_EMAIL = 'abuse@pleft.com'
MAIL_SENDER = 'Pleft <noreply@pleft.com>'

EMAIL_LOGO = SITE_BASE + '/static/site/images/mail-logo.png'
EMAIL_INFO = 'info@pleft.com'

SCREENSHOT = SITE_BASE + '/static/images/thumbnail.png'
