const query = new URLSearchParams(window.location.search);

const conf = query.get('env') || 'dev';
const local = query.get('local') || false;
let calenderAPI;
let currentCreationDate = new Date();

/**
 * @type {import('./apiSdk/javascript/callback-sdk')}
 */
const SmartVideoSdk = window.SmartVideoSdk;
const callbacksSdk = SmartVideoSdk.smartvideoClient.callbacks;
const environments = {
  dev: {
    pak: 'DEV2',
    base: 'https://dev.videoengager.com',
    externalId: local ? 'videoEngager' : 'Home',
    email: 't@t',
    tennantId: 'test_tenant'
  },
  staging: {
    pak: '72884930-79d1-3221-166d-58b3a9894e16',
    externalId: 'Home',
    base: 'https://staging.leadsecure.com',
    email: '639292ca-14a2-400b-8670-1f545d8aa860slav@videoengager.com',
    tennantId: 'oIiTR2XQIkb7p0ub'
  }
};
const config = environments[conf];
window.config = config;
SmartVideoSdk.setConfiguration(config);
const initializer = SmartVideoSdk.initializeSmartvideo();

let currentData = {
  data: [],
  count: 0,
  page: 1,
  pageSize: 500,
  orderBy: 'date',
  asc: 1
};

function updateCalender () {
  const events = currentData.data.map(item => {
    return {
      title: item.videoengager.subject + ' - ' + item.videoengager.name,
      start: new Date(item.videoengager.date),
      end: new Date(item.videoengager.date + item.videoengager.duration * 1000),
      id: item.videoengager.scheduleId
    };
  });
  calenderAPI.removeAllEvents();
  calenderAPI.addEventSource(events);
}
async function getList ({ start, end }) {
  if (!start || !end) return;
  const data = await callbacksSdk.getApiGenesysCallbackListTenant(config.tennantId, start, end, undefined, undefined, undefined, 500);
  currentData = data;
  updateCalender();
}

const dateRange = {
  internalDateRange: { start: 0, end: 0 },
  set range (value) {
    if (value === this.internalDateRange) {
      return;
    }
    if (value.start === this.internalDateRange.start && value.end === this.internalDateRange.end) {
      return;
    }
    this.internalDateRange = value;
    getList(value);
  },
  get range () {
    return this.internalDateRange;
  }
};
setTimeout(getList, 30000, dateRange.range);
window.currentViewData = {};
function viewCalender () {
  const modal = document.getElementById('detailsModal');

  const name = document.getElementById('ve_name');
  const date = document.getElementById('ve_date');
  const duration = document.getElementById('ve_duration');
  name.innerHTML = window.currentViewData.videoengager.name;
  date.innerHTML = new Date(window.currentViewData.videoengager.date).toLocaleString();
  duration.innerHTML = window.currentViewData.videoengager.duration + ' minutes';
  modal.style.display = 'flex';
  modal.addEventListener('click', function (e) {
    if (e.target.id === 'detailsModal') {
      modal.style.display = 'none';
    }
  }
  );
}
document.addEventListener('DOMContentLoaded', async function () {
  await initializer;
  const calendarEl = document.getElementById('calendar');

  calenderAPI = new window.FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth2',
    schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth2,timeListMonth'
    },
    duration: { months: 1 },
    views: {
      timeListMonth: {
        type: 'list',
        duration: { months: 1 },

        buttonText: 'List'
      },
      dayGridMonth2: {
        type: 'dayGridMonth',
        duration: { months: 1 },
        buttonText: 'Calender'
      }
    },
    events: [],
    eventClick: function (e) {
      console.log('an event has been clicked!', e);
      const id = e.event.id;
      const data = currentData.data.find(item => item.videoengager.scheduleId === id);
      console.log(data);
      window.currentViewData = data;
      viewCalender();
    },
    dateClick: function (e) {
      console.log('a date has been clicked!', e);
      currentCreationDate = e.date;
      openCreateDialog();
    },
    datesSet: function (dateInfo) {
      dateRange.range = { start: dateInfo.view.activeStart.getTime(), end: dateInfo.view.activeEnd.getTime() };
    }
  });
  calenderAPI.render();
  window.calenderAPI = calenderAPI;
});
function openCreateDialog () {
  const dialog = document.getElementById('createModal');
  dialog.style.display = 'flex';
  dialog.addEventListener('click', function (e) {
    if (e.target.id === 'createModal') {
      dialog.style.display = 'none';
    }
  }
  );
}
async function formCreateSubmit (e) {
  e.preventDefault();
  const { firstname, lastname, customer_email: customerEmail, _customer_number: customerNumber, veSubject } = e.target.elements;
  console.log(e.target.elements);
  const data = {
    firstname: firstname.value,
    lastname: lastname.value,
    customer_email: customerEmail.value,
    creator: 'agent',
    _customer_number: customerNumber.value,
    _desired_time: currentCreationDate.toISOString(),
    veSubject: veSubject.value,
    customer_subject: veSubject.value
  };
  const response = await callbacksSdk.postApiGenesysCallbackTenant(config.tennantId, data);
  currentData.data.push(response);
  updateCalender();
  const dialog = document.getElementById('createModal');
  dialog.style.display = 'none';
}
window.formCreateSubmit = formCreateSubmit;
async function deleteCallback () {
  await callbacksSdk.deleteApiGenesysCallbackByScheduleIdTenant(config.tennantId, window.currentViewData.videoengager.scheduleId);
  currentData.data = currentData.data.filter(item => item.videoengager.scheduleId !== window.currentViewData.videoengager.scheduleId);
  updateCalender();
  const modal = document.getElementById('detailsModal');
  modal.style.display = 'none';
}
window.deleteCallback = deleteCallback;
