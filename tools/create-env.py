#!/usr/bin/env python

import virtualenv

output = virtualenv.create_bootstrap_script('''
import os
import subprocess

def adjust_options(options, args):
    options.no_site_packages = True

def after_install(options, home_dir):
    subprocess.call([join(home_dir, 'bin', 'pip'),
                     'install', '--requirement=tools/requirements.txt'])
''')
f = open('tools/pleft-bootstrap.py', 'w').write(output)
