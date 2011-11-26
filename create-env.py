import virtualenv

output = virtualenv.create_bootstrap_script('''
import os
import subprocess

def after_install(options, home_dir):
    subprocess.call([join(home_dir, 'bin', 'pip'),
                     'install', 'django==1.3'])
''')
f = open('pleft-bootstrap.py', 'w').write(output)
