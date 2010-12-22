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

import datetime
import email.utils

from django.core.cache import cache
from django.core import exceptions
from django import http
from django.shortcuts import render_to_response
from django.template.context import RequestContext
from django.template.loader import render_to_string
from django.utils import dateformat
from django.utils import html
from django.utils import simplejson
from django.utils.translation import ugettext as _

import plauth
import plauth.models

import plapp
from plapp import forms
from plapp import models

def _get_appointment_or_404(request):
    if request.method == 'POST':
        params = request.POST
    else:
        params = request.GET

    if not 'id' in params:
        raise http.Http404

    appointment = models.Appointment.objects.all().get(id=int(params['id']))
    if not appointment or not appointment.visible:
        raise http.Http404

    user = plauth.models.User.get_signed_in(request)
    if not user:
        raise exceptions.PermissionDenied

    invitee = models.Invitee.objects.all().get(appointment=appointment, user=user)
    if not invitee:
        raise http.Http404

    return (appointment, user, invitee)

def create(request):
    form = forms.AppointmentForm(request.POST)
    if form.is_valid():
        # Create the appointment

        user = plauth.models.User.get_or_create(form.cleaned_data['email'])

        appointment = models.Appointment(initiator=user)
        appointment.description = form.cleaned_data['description']
        appointment.propose_more = form.cleaned_data['propose_more']
        signed_in = plauth.models.User.get_signed_in(request)
        if signed_in:
            if signed_in == user:
                validate = False
                appointment.visible = True
            else:
                plauth.models.User.sign_out(request)
                validate = True
                appointment.visible = False
        else:
            validate = True
            appointment.visible = False
        appointment.save()

        owner = models.Invitee(user=user, appointment=appointment)
        owner.name = form.cleaned_data['name']
        owner.save()

        for invitee in form.cleaned_data['invitees']:
            iuser = plauth.models.User.get_or_create(invitee[1])

            inv = models.Invitee.get_or_create(iuser, appointment)
            inv.name = invitee[0]
            inv.save()

        if form.cleaned_data['dates'][0] != '':
            for input in form.cleaned_data['dates']:
                date = models.Date(appointment=appointment)
                date.date_time = datetime.datetime.strptime(input,
                                                            '%Y-%m-%dT%H:%M:%S')
                date.invitee = owner
                date.save()

                avail = models.Availability()
                avail.date = date
                avail.invitee = owner
                avail.possible = 1 
                avail.save()

        if validate == True:
            plapp.send_mail(
                subject='%s: %s' % (_('Verification'), appointment.get_title()),
                template='plapp/mail/verification.txt',
                address=user.email,
                name=owner.get_name(),
                title=appointment.get_title(),
                url=appointment.get_url(user.email, user.password, True))
        else:
            appointment.send_overview_mail(request)
            appointment.send_invitations(request)
            return http.HttpResponse(appointment.get_url())

        return http.HttpResponse()
    else:
        raise http.Http404

def appointment(request):
    if 'id' in request.GET:
        return http.HttpResponsePermanentRedirect('/a#id=%s'
                                                  % request.GET['id'])

    user = plauth.models.User.get_signed_in(request)
    if not user:
        return render_to_response('plauth/not-signed-in.html',
                                  context_instance=RequestContext(request))

    return render_to_response('plapp/appointment.html',
                              context_instance=RequestContext(request))

def appointment_data(request):
    appointment, user, invitee = _get_appointment_or_404(request)

    user_id = user.id
    invitee_id = invitee.id
    appt_id = appointment.id

    data = {'user': user_id, 'invitee': invitee_id}

    metadata_key = plapp.get_cache_key('metadata', appointment=appt_id)
    metadata = cache.get(metadata_key)
    if not metadata:
        appt = appointment
        metadata = appt.get_metadata()
        cache.set(metadata_key, metadata)
    data['meta'] = metadata

    invitees_key = plapp.get_cache_key('invitees', appointment=appt_id)
    invitees = cache.get(invitees_key)
    if not invitees:
        instances = appointment.invitee_set.all()
        invitees = [{'name': i.get_name(), 'id': i.id}
                    for i in instances]
        cache.set(invitees_key, invitees)
    data['people'] = invitees

    if metadata['initiator'] == user_id:
        addresses_key = plapp.get_cache_key('addresses', appointment=appt_id)
        addresses = cache.get(addresses_key)
        if not addresses:
            instances = appointment.invitee_set.all()
            addresses = {}
            for i in instances:
                if i.user.id == user_id:
                    continue
                addresses[i.id] = i.user.email
                cache.set(addresses_key, addresses)
        data['addresses'] = addresses

    dates_key = plapp.get_cache_key('dates', appointment=appt_id)
    dates = cache.get(dates_key)
    if not dates:
        def _local_short_date(date):
            return dateformat.format(date, _('D M d, G:i'))
        instances = appointment.date_set.order_by('date_time').all()
        dates = []
        for d in instances:
            dates.append({'id': d.id, 's': _local_short_date(d.date_time), 'd': d.date_time.strftime('%Y-%m-%dT%H:%M:%S')})
        cache.set(dates_key, dates)
    data['dates'] = dates

    availability = {}
    for invitee in invitees:
        avail_key = plapp.get_cache_key('availability', appointment=appt_id,
                                        invitee=invitee['id'])
        avail = cache.get(avail_key)
        if not avail:
            invitee_instance = plapp.models.Invitee.objects.all().get(id=int(invitee['id']))
            instances = invitee_instance.availability_set.all()
            avail = {}
            for a in instances:
                avail[a.date.id] = [a.possible, a.comment]
            cache.set(avail_key, avail)
        availability[invitee['id']] = avail
    data['availability'] = availability

    s = simplejson.dumps(data, separators=(',', ':'))
    return http.HttpResponse(s, mimetype='application/javascript')

def appointment_list(request):
    user = plauth.models.User.get_signed_in(request)
    inviteeships = models.Invitee.objects.all(). \
        filter(user=user, appointment__visible=True).order_by('-id')
    return render_to_response('plapp/list.html',
                              { 'inviteeships': inviteeships, },
                              context_instance=RequestContext(request))

def appointment_menu(request):
    user = plauth.models.User.get_signed_in(request)
    if not user:
        raise exceptions.PermissionDenied

    memkey = plapp.get_menu_cache_key(user)
    data = cache.get(memkey)
    if not data:
        appts = plapp.models.Appointment.get_unarchived_for_user(user)
        data = ','.join(['[%s,"%s"]' % (app.id, html.escape(app.get_title()))
                         for app in appts])
        data = '[%s]' % data
        cache.set(memkey, data, 60*60*24*7)

    return http.HttpResponse('{"a":%s}' % data, mimetype='application/javascript')

def archive(request):
    appointment, user, invitee = _get_appointment_or_404(request)

    invitee.archived = not 'undo' in request.GET
    invitee.save()

    plapp.clear_menu_cache(user)

    return http.HttpResponseRedirect('/appointments')

def verify(request):
    import logging
    if not 'id' in request.GET:
        raise http.Http404

    appointment = models.Appointment.objects.all().get(id=int(request.GET['id']))
    if not appointment:
        raise http.Http404

    user = plauth.models.User.get_signed_in(request)
    if not user:
        raise http.Http404

    if appointment.initiator != user:
        return http.Http404

    if not appointment.visible:
        appointment.visible = True
        appointment.save()

        appointment.send_overview_mail(request)
        appointment.send_invitations(request)

    return http.HttpResponseRedirect(appointment.get_url())

def resend_invitation(request):
    appointment = models.Appointment.objects.all().get(id=int(request.POST['id']))
    user = plauth.models.User.get_signed_in(request)
    if (not user or
        not appointment or
        not appointment.visible or
        appointment.initiator != user):
        raise http.Http404

    invitee = models.Invitee.objects.all().get(id=int(request.POST['invitee']))
    if invitee.appointment != appointment:
        raise http.Http404

    initiator = models.Invitee.objects.all().get(user=user,
                                                 appointment=appointment)
    appointment.send_invitation(invitee, initiator, request)

    return http.HttpResponse()

def add_invitees(request):
    appointment = models.Appointment.objects.all().get(id=int(request.POST['id']))
    user = plauth.models.User.get_signed_in(request)
    if (not user or
        not appointment or
        not appointment.visible or
        appointment.initiator != user):
        raise http.Http404

    name, address = email.utils.getaddresses([request.POST['a']])[0]

    iuser = plauth.models.User.get_or_create(address)
    inv = models.Invitee.get_or_create(iuser, appointment)
    inv.name = name
    inv.save()

    initiator = models.Invitee.objects.all().get(user=appointment.initiator,
                                           appointment=appointment)
    appointment.send_invitation(inv, initiator, request)

    invitees_key = plapp.get_cache_key('invitees', appointment=appointment.id)
    invitees = cache.get(invitees_key)
    if invitees:
        cache.delete(invitees_key)
    """
        invitees.append({'name': inv.get_name(), 'id': inv.id})
        cache.set(invitees_key, invitees)
    """

    addresses_key = plapp.get_cache_key('addresses', appointment=appointment.id)
    addresses = cache.get(addresses_key)
    if addresses:
        cache.delete(addresses_key)
    """
        addresses[inv.id] = inv.user.email
        cache.set(addresses_key, addresses)
    """

    return http.HttpResponse()

def add_dates(request):
    appointment, user, invitee = _get_appointment_or_404(request)

    if (appointment.initiator != user and
        not appointment.propose_more):
        raise http.Http404

    date = models.Date(appointment=appointment)
    date.date_time = datetime.datetime.strptime(request.POST['d'],
                                                '%Y-%m-%dT%H:%M:%S')
    date.invitee = invitee
    date.save()

    avail = models.Availability()
    avail.date = date
    avail.invitee = invitee 
    avail.possible = 1 
    avail.save()

    # Remove dates from cache. Would be nicer to add the current date, but that would need re-ordering.
    dates_key = plapp.get_cache_key('dates', appointment=appointment.id)
    cache.set(dates_key, None)

    availability_key = plapp.get_cache_key('availability', appointment=appointment.id, invitee=invitee.id)
    availability = cache.get(availability_key)
    if availability:
        availability[date.id] = [1, '']
        cache.set(availability_key, availability)

    return http.HttpResponse()

def set_availability(request):
    appointment, user, invitee = _get_appointment_or_404(request)

    key = plapp.get_cache_key('availability', appointment=appointment.id, invitee=invitee.id)
    cached = cache.get(key)

    i = 0
    for line in request.POST['a'].splitlines():
        [datestring, possible, comment] = line.split(':', 2)
        date = models.Date.objects.all().get(id=int(datestring))
        i += 1

        try:
            avail = models.Availability.objects.all().get(date=date, invitee=invitee)
        except exceptions.ObjectDoesNotExist:
            avail = models.Availability(date=date, invitee=invitee)

        avail.possible = int(possible)
        avail.comment = comment
        avail.save()

        if cached:
            cached[date.id] = [int(possible), comment]

    if cached:
        cache.set(key, cached)

    return http.HttpResponse()
