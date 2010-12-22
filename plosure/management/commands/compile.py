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

from django.core.management.base import BaseCommand, CommandError

scripts = ['form', 'main', 'overview']

class Command(BaseCommand):
    args = '<script_name script_name ...>'
    help = 'Compile JavaScript code'

    def handle(self, *args, **options):
        import os

        if args:
            for script_name in args:
                if not script_name in scripts:
                    raise CommandError('Script not found in script list.')
                self.compile(script_name)
        else:
            for script in scripts:
                self.compile(script)

    def target_path(self, name):
        return 'static/scripts/%s.cjs' % name

    def compile(self, name):
        import os

        from django.conf import settings

        print 'Compiling %s.cjs...' % name

        f = open(self.target_path(name), 'w')
        f.write(settings.JS_HEADER)
        f.close()

        script = 'external/plovr.jar'
        os.system('java -jar %s build ' % script
                  + 'plapp/js/config-%s.json ' % name              
                  + '>> %s' % self.target_path(name))

        print 'Done.'
