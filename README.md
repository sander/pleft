Pleft
=====

This is the Pleft software that runs on [www.pleft.com](http://www.pleft.com/).


Installation
------------

1. Check out the source code (`git clone git://github.com/sander/pleft.git`).
2. Enter into the newly created pleft/ directory (`cd pleft/`).
3. Decide which directory to put Pleft's environment in (`export PLENV=~/env/pleft`).
4. Create a Pleft environment (`python tools/pleft-bootstrap.py $PLENV`).
5. Create a file `pleft/local_settings.py`, based on one of the examples in that directory. If you just want to test Pleft, copy `pleft/local_settings.py.debug` to `pleft/local_settings.py` to do that. You need to edit the file to modify some paths. Especially database information (i.e. `DATABASE_NAME`) and `SECRET_KEY` need to be changed. The SQLite database will be created automatically.
6. Activate the Pleft environment (`source $PLENV/bin/activate`).
7. Create the proper tables in the database (`python pleft/manage.py syncdb`).


Running
-------

Activate the Pleft environment:

    source $PLENV/bin/activate

Run the Pleft debug server:

    python pleft/manage.py runserver

In debug mode, emails are written to the console instead of being sent. If you need a link that was provided this way, note that characters like the = are escaped. So you might for example need to replace =3D with =.


Translations
------------

If you want to test or deploy translations, install gettext and run:

    python pleft/manage.py mo


Deployment
----------

See [Deploying Django](https://docs.djangoproject.com/en/dev/howto/deployment/).

If you are using MySQL, you need to make sure that the database is created using:

    CREATE DATABASE name CHARACTER SET utf8

Also, for the user system to work, the email address field must be made case sensitive, using:

    ALTER TABLE plauth_user MODIFY email VARCHAR(255) COLLATE utf8_bin


Publishing changes
------------------

Create commits for your changes. See [Making changes](http://schacon.github.com/git/gittutorial.html#_making_changes) for help.

There are two ways to publish changes to the code:

-   Create a fork of the repository and push your changes to it. See [Fork A Repo](http://help.github.com/fork-a-repo/). This makes it easy to review your code.
-   Create a patch file using the command `git format-patch origin/master --stdout > filename.patch`.


Contact
-------

Feel free to contact our [public mailing list](https://groups.google.com/forum/#!forum/pleft) at pleft@googlegroups.com if you are stuck. You can also contact [Sander Dijkhuis](mailto:sander.dijkhuis@gmail.com).
