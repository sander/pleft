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

from django.core.management.base import NoArgsCommand, CommandError

class Command(NoArgsCommand):
    help = 'Make MO files for Pleft'

    def handle_noargs(self, **options):
        import os

        packages = [s for s in os.listdir('.') if os.path.isdir(s)
                    and os.path.exists(s + '/locale')]

        for pkg in packages:
            print 'Making MO files for package \'%s\'...' % pkg

            os.system('cd %s && ../pleft/manage.py compilemessages ' % pkg)

            print 'Done.'
