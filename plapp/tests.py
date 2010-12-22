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

import doctest
import unittest

import plapp.templatetags.appointment_tags
import plapp.templatetags.pleft_tags

def suite():
    suite = unittest.TestSuite()
    suite.addTest(doctest.DocTestSuite(plapp.templatetags.appointment_tags))
    suite.addTest(doctest.DocTestSuite(plapp.templatetags.pleft_tags))
    return suite
