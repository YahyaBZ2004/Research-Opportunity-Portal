const API = '/api/opportunities';

let allOpportunities = [];   // data loaded from the server
let currentFilter = 'all';   // 'all', 'Open' or 'Closed'

const statusNames = {
  200: 'OK',
  201: 'Created',
  400: 'Bad Request',
  404: 'Not Found',
  500: 'Internal Server Error'
};

// ---------- small helpers ----------

// makes text safe to put inside HTML
function safe(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ---------- popup messages (toasts) ----------

function removeToast(toast) {
  if (toast.parentNode) {
    toast.parentNode.removeChild(toast);
  }
}

function showToast(title, message, type, detail) {
  const box = document.getElementById('toastBox');

  // keep at most 4 popups on screen
  while (box.children.length >= 4) {
    box.removeChild(box.firstChild);
  }

  const toast = document.createElement('div');
  toast.className = 'toast ' + type;
  toast.innerHTML = `
    <div class="toast-title">${safe(title)}</div>
    <div>${safe(message)}</div>
    <div class="toast-detail">${safe(detail)}</div>
    <button class="toast-close" aria-label="Close">✕</button>
    <div class="toast-timer"></div>
  `;

  // the X button closes it
  toast.querySelector('.toast-close').addEventListener('click', function () {
    removeToast(toast);
  });

  box.appendChild(toast);

  // it closes by itself after 5 seconds
  setTimeout(function () {
    removeToast(toast);
  }, 5000);
}

// ---------- ONE function that talks to the API ----------
// Every button uses this, so every request shows a status code popup.

async function callApi(method, url, body, successText) {
  const label = method + ' ' + url;

  try {
    const options = { method: method };
    if (body) {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    let data = {};
    try {
      data = await response.json();
    } catch (e) {
      data = {};
    }

    const code = response.status;
    const title = code + ' ' + (statusNames[code] || '');

    if (response.ok) {
      const message = successText || data.message || 'Request successful';
      showToast(title, message, 'success', label);
    } else {
      const message = data.error || 'Something went wrong';
      showToast(title, message, 'error', label);
    }

    return { ok: response.ok, status: code, data: data };

  } catch (error) {
    showToast('Network Error', 'Could not reach the server. Is it running?', 'error', label);
    return { ok: false, status: 0, data: null };
  }
}

// ---------- side menu ----------

function openMenu() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('overlay').classList.add('show');
}

function closeMenu() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

function setActiveMenu(name) {
  const items = document.querySelectorAll('.menu-item');
  for (const item of items) {
    item.classList.remove('active');
  }

  const ids = {
    all: 'menuAll',
    Open: 'menuOpen',
    Closed: 'menuClosed',
    add: 'menuAdd'
  };
  document.getElementById(ids[name]).classList.add('active');
}

// ---------- switching between the two screens ----------

function showList(filter) {
  currentFilter = filter;

  const titles = {
    all: 'All Opportunities',
    Open: 'Open Opportunities',
    Closed: 'Closed Opportunities'
  };
  document.getElementById('listTitle').textContent = titles[filter];

  document.getElementById('listView').classList.remove('hidden');
  document.getElementById('formView').classList.add('hidden');

  setActiveMenu(filter);
  renderCards();
  closeMenu();
}

function openAddForm() {
  resetForm();
  document.getElementById('listView').classList.add('hidden');
  document.getElementById('formView').classList.remove('hidden');
  setActiveMenu('add');
  closeMenu();
}

// ---------- 1. show all opportunities ----------

function updateCounts() {
  let open = 0;
  let closed = 0;

  for (const item of allOpportunities) {
    if (item.status === 'Open') {
      open = open + 1;
    } else {
      closed = closed + 1;
    }
  }

  const total = allOpportunities.length;

  document.getElementById('statTotal').textContent = total;
  document.getElementById('statOpen').textContent = open;
  document.getElementById('statClosed').textContent = closed;

  document.getElementById('countAll').textContent = total;
  document.getElementById('countOpen').textContent = open;
  document.getElementById('countClosed').textContent = closed;
}

function renderCards() {
  const box = document.getElementById('cards');

  // pick which items to show
  let items = [];
  for (const item of allOpportunities) {
    if (currentFilter === 'all' || item.status === currentFilter) {
      items.push(item);
    }
  }

  if (items.length === 0) {
    box.innerHTML = '<div class="empty">No opportunities to show here yet.</div>';
    return;
  }

  let html = '';

  for (const item of items) {
    let badgeClass = 'closed';
    if (item.status === 'Open') {
      badgeClass = 'open';
    }

    let closeButton = '';
    if (item.status === 'Open') {
      closeButton = `<button class="btn warn" onclick="closeOpportunity(${item.id})">Close</button>`;
    }

    html += `
      <div class="card">
        <div class="card-top">
          <span class="badge ${badgeClass}">${item.status}</span>
          <span class="card-id">#${item.id}</span>
        </div>
        <h3>${safe(item.title)}</h3>
        <div class="card-area">${safe(item.research_area)}</div>
        <div class="card-info">
          👤 ${safe(item.faculty_name)}<br>
          🏛️ ${safe(item.department)}<br>
          👥 ${item.positions} position(s)<br>
          📅 Deadline: ${item.deadline}
        </div>
        <div class="card-buttons">
          <button class="btn info" onclick="viewOpportunity(${item.id})">View</button>
          <button class="btn primary" onclick="editOpportunity(${item.id})">Edit</button>
          ${closeButton}
          <button class="btn danger" onclick="deleteOpportunity(${item.id})">Delete</button>
        </div>
      </div>
    `;
  }

  box.innerHTML = html;
}

async function loadOpportunities() {
  const result = await callApi('GET', API, null, 'Opportunities loaded');

  if (result.ok) {
    allOpportunities = result.data;
    updateCounts();
    renderCards();
  } else {
    document.getElementById('cards').innerHTML =
      '<div class="empty">Could not load opportunities.</div>';
  }
}

// ---------- 2. show details of one ----------

function detailRow(label, value) {
  return `<div class="detail-row"><span>${label}</span><strong>${value}</strong></div>`;
}

async function viewOpportunity(id) {
  const result = await callApi('GET', API + '/' + id, null, 'Opportunity details loaded');

  if (!result.ok) {
    return;
  }

  const item = result.data;

  let badgeClass = 'closed';
  if (item.status === 'Open') {
    badgeClass = 'open';
  }

  document.getElementById('detailsBody').innerHTML = `
    <h3>${safe(item.title)}</h3>
    <span class="badge ${badgeClass}">${item.status}</span>
    <p class="detail-description">${safe(item.description)}</p>
    ${detailRow('ID', item.id)}
    ${detailRow('Research Area', safe(item.research_area))}
    ${detailRow('Faculty Member', safe(item.faculty_name))}
    ${detailRow('Department', safe(item.department))}
    ${detailRow('Required Skills', safe(item.required_skills))}
    ${detailRow('Positions', item.positions)}
    ${detailRow('Deadline', item.deadline)}
  `;

  document.getElementById('detailsModal').classList.remove('hidden');
}

function closeDetails() {
  document.getElementById('detailsModal').classList.add('hidden');
}

// ---------- form: validation ----------

const fieldLabels = {
  title: 'Title',
  research_area: 'Research Area',
  description: 'Description',
  faculty_name: 'Faculty Member',
  department: 'Department',
  required_skills: 'Required Skills',
  positions: 'Positions',
  deadline: 'Deadline'
};

function validateForm() {
  const problems = [];
  let firstBadField = null;

  for (const id in fieldLabels) {
    const input = document.getElementById(id);
    input.classList.remove('invalid');

    let bad = false;

    if (input.value.trim() === '') {
      bad = true;
    }
    if (id === 'positions' && input.value !== '' && Number(input.value) < 1) {
      bad = true;
    }

    if (bad) {
      input.classList.add('invalid');
      problems.push(fieldLabels[id]);
      if (firstBadField === null) {
        firstBadField = input;
      }
    }
  }

  if (problems.length > 0) {
    showToast(
      'Validation Error',
      'Please check: ' + problems.join(', '),
      'warning',
      'Checked in the browser (no request sent)'
    );
    firstBadField.focus();
    return false;
  }

  return true;
}

// ---------- form: reset ----------

function resetForm() {
  document.getElementById('opportunityForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = 'Add New Opportunity';
  document.getElementById('statusGroup').classList.add('hidden');

  for (const id in fieldLabels) {
    document.getElementById(id).classList.remove('invalid');
  }
}

// ---------- 3 and 4. create or update (same form) ----------

async function saveOpportunity(event) {
  event.preventDefault();   // stops the page from reloading

  if (!validateForm()) {
    return;
  }

  const body = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    research_area: document.getElementById('research_area').value.trim(),
    faculty_name: document.getElementById('faculty_name').value.trim(),
    department: document.getElementById('department').value.trim(),
    required_skills: document.getElementById('required_skills').value.trim(),
    positions: Number(document.getElementById('positions').value),
    deadline: document.getElementById('deadline').value
  };

  const id = document.getElementById('editId').value;
  let result;

  if (id === '') {
    // no id means we are creating
    result = await callApi('POST', API, body, 'Opportunity created successfully');
  } else {
    // an id means we are editing
    body.status = document.getElementById('status').value;
    result = await callApi('PUT', API + '/' + id, body, 'Opportunity updated successfully');
  }

  if (result.ok) {
    await loadOpportunities();
    showList(currentFilter);
  }
}

// ---------- fill the form for editing ----------

async function editOpportunity(id) {
  const result = await callApi('GET', API + '/' + id, null, 'Opportunity loaded for editing');

  if (!result.ok) {
    return;
  }

  const item = result.data;

  resetForm();

  document.getElementById('editId').value = item.id;
  document.getElementById('title').value = item.title;
  document.getElementById('description').value = item.description;
  document.getElementById('research_area').value = item.research_area;
  document.getElementById('faculty_name').value = item.faculty_name;
  document.getElementById('department').value = item.department;
  document.getElementById('required_skills').value = item.required_skills;
  document.getElementById('positions').value = item.positions;
  document.getElementById('deadline').value = item.deadline;
  document.getElementById('status').value = item.status;

  document.getElementById('formTitle').textContent = 'Edit Opportunity #' + item.id;
  document.getElementById('statusGroup').classList.remove('hidden');

  document.getElementById('listView').classList.add('hidden');
  document.getElementById('formView').classList.remove('hidden');
  document.getElementById('menuAdd').classList.remove('active');
  window.scrollTo(0, 0);
}

// ---------- 5. close an opportunity ----------

async function closeOpportunity(id) {
  const result = await callApi('PUT', API + '/' + id, { status: 'Closed' }, 'Opportunity closed');

  if (result.ok) {
    loadOpportunities();
  }
}

// ---------- 6. delete an opportunity ----------

async function deleteOpportunity(id) {
  if (!confirm('Are you sure you want to delete this opportunity?')) {
    return;
  }

  const result = await callApi('DELETE', API + '/' + id, null, 'Opportunity deleted');

  if (result.ok) {
    loadOpportunities();
  }
}

// ---------- start everything ----------

document.getElementById('menuButton').addEventListener('click', openMenu);
document.getElementById('closeMenuButton').addEventListener('click', closeMenu);
document.getElementById('overlay').addEventListener('click', closeMenu);
document.getElementById('opportunityForm').addEventListener('submit', saveOpportunity);

// a red field turns normal again as soon as the user types in it
document.getElementById('opportunityForm').addEventListener('input', function (event) {
  event.target.classList.remove('invalid');
});

// clicking the dark area around the details window closes it
document.getElementById('detailsModal').addEventListener('click', function (event) {
  if (event.target.id === 'detailsModal') {
    closeDetails();
  }
});

// the Escape key closes the menu and the details window
document.addEventListener('keydown', function (event) {
  if (event.key === 'Escape') {
    closeMenu();
    closeDetails();
  }
});

setActiveMenu('all');
loadOpportunities();   // runs when the page opens