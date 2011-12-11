from fabric.api import *
from fabric.colors import *
from fabric.operations import *

env.hosts = ['tryout.pleft.com']

def install(package):
    with settings(hide('warnings', 'stderr'), warn_only=True):
        result = run('dpkg-query --show ' + package)
    if result.failed or result.find(' ') == -1:
        sudo('DEBIAN_FRONTEND=readline apt-get install -qy ' + package)
    else:
        print('Package %s is already installed.' % package)

def setup_dir():
    sudo('mkdir -p /opt/pleft-tryout')
    sudo('chmod 750 /opt/pleft-tryout')
    sudo('chown root:www-data /opt/pleft-tryout')
    with cd('/opt/pleft-tryout'):
        sudo('mkdir -p var/log var/run var/lib/pleft/static')
        sudo('chmod 775 var/log var/run')
        sudo('chown root:www-data var/log var/run var/lib/pleft/media')

def clone_repository():
    sudo('git clone git@github.com:sander/pleft.git /opt/pleft-tryout/deploy')
    with cd('/opt/pleft-tryout/deploy'):
        sudo('git checkout tryout')

def git_pull():
    with cd('/opt/pleft-tryout/deploy'):
        sudo('git pull')

def virtualenv(command):
    return sudo('source /opt/pleft-tryout/virtualenv/bin/activate && ' + command)

def setup_virtualenv():
    sudo('virtualenv /opt/pleft-tryout/virtualenv')
    virtualenv('pip install --requirement=/opt/pleft-tryout/deploy/tools/requirements.txt')

def upload_local_settings():
    put('local_settings.py', '/opt/pleft-tryout/deploy/pleft/local_settings.py', use_sudo=True)
    sudo('chown root:root /opt/pleft-tryout/deploy/pleft/local_settings.py')

def manage(command):
    with cd('/opt/pleft-tryout/deploy'):
        return virtualenv('python manage.py ' + command)

def setup_upstart():
    sudo('cp /opt/pleft-tryout/deploy/tools/upstart /etc/init/pleft-tryout')

def setup_nginx():
    name = '/etc/nginx/sites-available/pleft-tryout'
    sudo('cp /opt/pleft-tryout/deploy/tools/nginx ' + name)
    sudo('ln -s ' + name + ' /etc/nginx/sites-enabled/pleft-tryout')
    sudo('service nginx reload')

def start(service):
    sudo('service %s start' % service)

def setup():
    install('nginx')
    start('nginx')
    install('postfix')
    install('python-virtualenv')
    install('python-mysqldb')
    install('memcached')
    install('git')
    install('python-dev')
    setup_dir()
    clone_repository()
    upload_local_settings()
    setup_virtualenv()
    manage('collectstatic')
    setup_upstart()
    start('pleft-tryout')
    setup_nginx()
