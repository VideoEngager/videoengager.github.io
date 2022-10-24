/* eslint-disable no-console */
/* globals $ console jQuery localStorage FullCalendar */
let calendar, scheduleStart, scheduleEnd, callDuration, auth, activeStart, activeEnd, fetchStart, fetchEnd;

function isDebug () {
  const url = new URL(window.location.href);
  if (url.searchParams.get('debug') === 'true') {
    return true;
  }
  return false;
}
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('env') || 'dev';

const myJSObject = {
  staging: {
    pak: 'b7abeb05-f821-cff8-0b27-77232116bf1d',
    externalId: '639292ca-14a2-400b-8670-1f545d8aa860',
    email: 'slav@videoengager.com',
    organizationId: '639292ca-14a2-400b-8670-1f545d8aa860',
    deploymentId: '1b4b1124-b51c-4c38-899f-3a90066c76cf',
    videoengagerUrl: 'https://staging.leadsecure.com',
    serverUrl: 'https://staging.leadsecure.com',
    tennantId: 'oIiTR2XQIkb7p0ub',
    environment: 'https://api.mypurecloud.de',
    queue: 'Support'
  },
  dev: {
    pak: 'DEV2',
    externalId: 'videoEngager',
    email: '327d10eb-0826-42cd-89b1-353ec67d33f8mustafa@videoengager.com',
    customerName: 'Slav Hadjidimitrov',
    customerEmail: 'mustafa@videoengager.com',
    serverUrl: 'https://dev.videoengager.com',
    videoengagerUrl: 'https://dev.videoengager.com',
    firstName: 'agent-2',
    division: 'Home',
    source: 'mypurecloud.com.au',
    organizationId: '327d10eb-0826-42cd-89b1-353ec67d33f8',
    contactEmail: 'mustafa@videoengager.com',
    tennantId: 'test_tenant'
  },
  prod: {
    serverUrl: 'https://videome.leadsecure.com',
    organizationId: 'c4b553c3-ee42-4846-aeb1-f0da3d85058e',
    deploymentId: '973f8326-c601-40c6-82ce-b87e6dafef1c',
    videoengagerUrl: 'https://videome.leadsecure.com',
    tennantId: '3X0eK2gclYkIML92',
    environment: 'https://api.mypurecloud.com',
    queue: 'TestQueue',
    pak: '9be78bc5-a721-9a9b-81a5-87858ddd0bb4',
    externalId: 'Home',
    email: 'c4b553c3-ee42-4846-aeb1-f0da3d85058eslav@videoengager.com'
  }
};

// Get token from API
const getToken = function (callback) {
  $.ajax({
    url: myJSObject[debugMode].serverUrl + '/api/partners/impersonate/' + myJSObject[debugMode].pak + '/' + myJSObject[debugMode].externalId + '/' + myJSObject[debugMode].email,
    type: 'GET',
    complete: callback,
    error: function (err) {
      console.log('error', err);
    }
  });
};

// Fetch schedules with from and to parameters.
const fetchSchedules = function (successCallback, failureCallback) {
  $.ajax({
    url: myJSObject[debugMode].serverUrl + '/api/schedules/tenant/' + fetchStart.getTime() + '/' + fetchEnd.getTime(),
    type: 'GET',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', auth);
    },
    success: function (result) {
      result = result.filter((item) => {
        if (item.active) {
          return item;
        }
        return null;
      });
      result = result.map(function (item) {
        return {
          title: 'Video Interview',
          start: new Date(item.date),
          end: new Date(item.date + item.duration * 60000),
          id: item._id,
          visitor: item.visitor,
          editable: true
        };
      });
      successCallback(result);
    },
    error: function (err) {
      failureCallback(err);
    }
  });
};

// Fetch schedule by id from server
const fetchSchedule = function (id, callback) {
  $.ajax({
    url: myJSObject[debugMode].serverUrl + '/api/schedules/my/' + id,
    type: 'GET',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', auth);
    },
    success: function (result) {
      callback(result);
    },
    error: function (err) {
      callback(null, err);
    }
  });
};

const verifyScheduleByCode = function (code) {
  $.ajax({
    url: myJSObject[debugMode].serverUrl + '/api/schedules/create/' + myJSObject[debugMode].tennantId + '/' + code,
    type: 'GET',
    contentType: 'application/json',
    dataType: 'json',
    error: function (err) {
      console.error(err);
      modalConfirm('Code and your mail do not match.', function () {
        $('#confirmModal').modal('hide');
      });
    },
    success: function (res) {
      console.log(res);
      $('#verifyModal').modal('hide');
      $('#customerNameDetail').val(res.name);
      $('#customerEmailDetail').val(res.email);
      $('#customerPhoneDetail').val(res.phone);
      $('#scheduleStartDetail').html(new Date(res.date).toString());
      $('#meetingLinkGroup').hide();
      $('#agentMeetingLinkGroupDetail').hide();
      $('#meetingLinkDetail').html(res.meetingUrl);
      $('#agentMeetingLinkDetail').html(res.agentUrl);
      $('#eventIdDetail').val('');
      $('#modalTitleDetail').text('Schedule a video call for ' + res.name);
      $('#detailsModal').modal();
      calendar.refetchEvents();
    }
  });
};

// Create schedule api
const createSchedule = function (postData, callback) {
  const url = myJSObject[debugMode].serverUrl + '/api/schedules/create/' + myJSObject[debugMode].tennantId;
  $.ajax({
    url: url,
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(postData),
    success: callback,
    error: function (err) {
      if (err.status === 401) {
        $('#verifyModal').modal('hide');
        $('#calendarModal').modal('hide');
        jQuery('#verifyEmail').html(err.responseJSON.email);
        $('#verifycancelBtn').unbind().on('click', async function () {
          $('#verifyModal').modal('hide');
        });
        $('#verifyconfirmBtn').unbind().on('click', async function () {
          verifyScheduleByCode(jQuery('#verifyCode').val());
        });
        $('#verifyCode').val('');
        $('#verifyModal').modal({
          backdrop: 'static',
          keyboard: false,
          show: true
        });
      } else {
        console.error(err);
        modalConfirm('Server response in an undefined error. Status Code: ' + err.status, function () {
          $('#confirmModal').modal('hide');
        });
      }
    }
  });
};

// Update schedule api
const updateSchedule = function (postData, callback) {
  const url = myJSObject[debugMode].serverUrl + '/api/schedules/my/' + postData._id;
  $.ajax({
    url: url,
    type: 'PUT',
    contentType: 'application/json',
    dataType: 'json',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', auth);
    },
    data: JSON.stringify(postData),
    success: callback,
    error: function (err) {
      console.error(err);
    }
  });
};

// Remove schedule from server
const removeSchedule = function (eventId, callback) {
  const url = myJSObject[debugMode].serverUrl + '/api/schedules/my/' + eventId + '?sendNotificationEmail';
  $.ajax({
    url: url,
    type: 'DELETE',
    beforeSend: function (xhr) {
      xhr.setRequestHeader('Authorization', auth);
    },
    success: function (result) {
      callback(result);
    },
    error: function (err) {
      callback(null, err);
    }
  });
};
// Initialize fullcalendar
const initializeCalendar = function () {
  const calendarEl = document.getElementById('calendar');
  calendar = new FullCalendar.Calendar(calendarEl, {
    themeSystem: 'bootstrap',
    initialView: 'timeGridWeek',
    validRange: {
      start: new Date()
    },
    allDaySlot: false,
    slotEventOverlap: false,
    selectable: true,
    viewDidMount: function (info) {
      activeStart = info.view.activeStart;
      activeEnd = info.view.activeEnd;
    },
    events: function (info, successCallback, failureCallback) {
      fetchStart = info.start;
      fetchEnd = info.end;
      fetchSchedules(successCallback, failureCallback);
    },
    select: function (info) {
      // Trigger when user select time to create a event.
      console.log(info);
      if (!auth) {
        window.alert('Please click connect button first.');
        return;
      }
      scheduleStart = info.start;
      scheduleEnd = info.end;
      callDuration = (scheduleEnd.getTime() - scheduleStart.getTime()) / 60000;
      $('#agentMeetingLinkGroup').hide();
      $('#customerName').val();
      $('#customerEmail').val();
      $('#customerPhone').val();
      $('#scheduleStart').html(scheduleStart.toString());
      $('#scheduleEnd').html(scheduleEnd.toString());
      $('#callDuration').html(callDuration + ' minutes');
      $('#meetingLinkGroup').hide();
      $('#eventId').val('');
      $('#modalTitle').text('Schedule a video call');
      $('#calendarModal').modal();
    },
    eventDidMount: function (info) {
      let clickCnt = 0;
      let oneClickTimer;
      $(info.el).append('<i class="fa fa-trash remove-item" style="position: absolute; right: 5px; top: 4px; color: white; z-index: 9;"></i>').on('click', function (ev) {
        console.log(info);
        if ($(ev.target).hasClass('remove-item')) {
          modalConfirm('Are you sure to remove this schedule?', function (confirmed) {
            if (confirmed) {
              const eventId = info.event.id;
              removeSchedule(eventId, function (result, err) {
                info.event.remove();
              });
            }
          });
        } else {
          clickCnt++;
          if (clickCnt === 1) {
            oneClickTimer = setTimeout(function () {
              clickCnt = 0;
            }, 400);
          } else if (clickCnt === 2) {
            clearTimeout(oneClickTimer);
            clickCnt = 0;
            editSchedule(info);
          }
        }
      });
    },
    eventDrop: function (info) {
      // Trigger when event is drag & drop
      console.log(info);
      modalConfirm('Are you sure to update this schedule?', function (confirmed) {
        if (confirmed) {
          updateScheduleDateAndDuration(info.event);
        } else {
          info.revert();
        }
      });
    },
    eventResize: function (info) {
      // Trigger when event is resized
      console.log(info);
      modalConfirm('Are you sure to update this schedule?', function (confirmed) {
        if (confirmed) {
          updateScheduleDateAndDuration(info.event);
        } else {
          info.revert();
        }
      });
    }
  });
  calendar.render();
};

// Edit schedule
const editSchedule = function (info) {
  const eventId = info.event.id;
  fetchSchedule(eventId, function (event, err) {
    if (event) {
      const editName = event.visitor.name;
      const editEmail = event.visitor.email;
      const editPhone = event.visitor.phone;
      const meetingLink = event.visitor.meetingUrl;
      callDuration = event.duration;
      const agentMeetingLink = event.agent.meetingUrl;
      const eventStartDate = new Date(event.date);
      const eventEndDate = new Date(event.date + callDuration * 60000);
      const autoAnswer = event.visitor.autoAnswer;
      $('#scheduleStart').html(eventStartDate.toString());
      $('#scheduleEnd').html(eventEndDate);

      $('#callDuration').html(callDuration + ' minutes');

      $('#customerName').val(editName);
      $('#customerEmail').val(editEmail);
      $('#customerPhone').val(editPhone);
      $('#meetingLink').attr('href', meetingLink).text(meetingLink);
      $('#agentMeetingLink').attr('href', agentMeetingLink).text(agentMeetingLink);
      $('#eventId').val(eventId);
      $('#meetingLinkGroup').show();
      $('#modalTitle').text('Schedule a video call for ' + editName);
      $('#autoAnswer').prop('checked', autoAnswer);
      $('#calendarModal').modal();
    }
  });
};

// Update schedule data
const updateScheduleDataFromModal = function (visitor, eventId) {
  fetchSchedule(eventId, function (event, err) {
    event.visitor.name = visitor.name;
    event.visitor.email = visitor.email;
    event.visitor.phone = visitor.phone;
    if (isDebug()) {
      event.visitor.autoAnswer = visitor.autoAnswer;
    }
    updateSchedule(event, function (dataSchedule) {
      console.log('updateSchedule', dataSchedule);
      $('#calendarModal').modal('hide');
    });
  });
};

const updateScheduleDateAndDuration = function (event) {
  const eventId = event.id;
  const startDate = event.start.getTime();
  const duration = (event.end.getTime() - startDate) / 60000;
  fetchSchedule(eventId, function (event, err) {
    if (event) {
      event.date = startDate;
      event.duration = duration;
      updateSchedule(true, event, function (dataSchedule) {
        console.log('updateSchedule', dataSchedule);
      });
    }
  });
};

// Create schedule data
const generateScheduleData = function (visitor) {
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  const postDataSchedule = {
    pin: pin,
    date: scheduleStart.getTime(),
    duration: callDuration,
    pak: pak,
    visitor: visitor
  };
  createSchedule(postDataSchedule, function (dataSchedule) {
    console.log('createSchedule', dataSchedule);
    calendar.refetchEvents();
    $('#calendarModal').modal('hide');
  });
};

const modalConfirm = function (message, callback) {
  $('#confirmModalBody').text(message);
  $('#confirmModal').modal({
    backdrop: 'static',
    keyboard: false,
    show: true
  });

  $('#confirmBtn').unbind().on('click', function () {
    callback(true);
    $('#confirmModal').modal('hide');
  });

  $('#cancelBtn').unbind().on('click', function () {
    callback(false);
    $('#confirmModal').modal('hide');
  });
};

$(document).ready(function () {
  if (isDebug()) {
    $('#debug-editor').show();
    $('.show-in-debug').show();
  } else {
    $('#debug-editor').hide();
    $('.show-in-debug').hide();
  }

  getToken(function (data) {
    const rsp = data.responseJSON;
    if (data.status === 200) {
      const token = rsp.token;
      localStorage.setItem('token', token);
      auth = 'Bearer ' + token;
      initializeCalendar();
    }
  });
});

$('#connectButton').on('click', function () {
  getToken(function (data) {
    const rsp = data.responseJSON;
    if (data.status === 200) {
      const token = rsp.token;
      localStorage.setItem('token', token);
      auth = 'Bearer ' + token;
      initializeCalendar();
    }
  });
});

$('#saveBtn').on('click', function (e) {
  const visitor = {
    name: $('#customerName').val(),
    email: $('#customerEmail').val(),
    phone: $('#customerPhone').val()
  };
  if ($('#eventId').val()) {
    const eventId = $('#eventId').val();
    updateScheduleDataFromModal(visitor, eventId);
  } else {
    generateScheduleData(visitor);
  }
});
