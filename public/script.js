const API = '/api/opportunities';

// ---------- helper functions ----------

function showMessage(text, type) {
  const box = document.getElementById('message');
  box.innerHTML = '<div class="alert alert-' + type + '">' + text + '</div>';
  setTimeout(function () { box.innerHTML = ''; }, 4000);
}

// makes text safe to put inside HTML
function safe(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function resetForm() {
  document.getElementById('opportunityForm').reset();
  document.getElementById('editId').value = '';
  document.getElementById('formTitle').textContent = 'Add New Opportunity';
  document.getElementById('statusGroup').style.display = 'none';
  document.getElementById('cancelButton').style.display = 'none';
}

// ---------- 1. show all opportunities ----------

async function loadOpportunities() {
  try {
    const response = await fetch(API);
    const data = await response.json();

    const body = document.getElementById('tableBody');
    body.innerHTML = '';

    if (data.length === 0) {
      body.innerHTML = '<tr><td colspan="8" class="text-center">No opportunities yet</td></tr>';
      return;
    }

    for (const item of data) {
      let badgeColor = 'secondary';
      if (item.status === 'Open') {
        badgeColor = 'success';
      }

      let closeButton = '';
      if (item.status === 'Open') {
        closeButton = '<button class="btn btn-sm btn-warning" onclick="closeOpportunity(' + item.id + ')">Close</button> ';
      }

      body.innerHTML +=
        '<tr>' +
          '<td>' + item.id + '</td>' +
          '<td>' + safe(item.title) + '</td>' +
          '<td>' + safe(item.research_area) + '</td>' +
          '<td>' + safe(item.faculty_name) + '</td>' +
          '<td>' + item.positions + '</td>' +
          '<td>' + item.deadline + '</td>' +
          '<td><span class="badge bg-' + badgeColor + '">' + item.status + '</span></td>' +
          '<td>' +
            '<button class="btn btn-sm btn-info" onclick="viewOpportunity(' + item.id + ')">View</button> ' +
            '<button class="btn btn-sm btn-primary" onclick="editOpportunity(' + item.id + ')">Edit</button> ' +
            closeButton +
            '<button class="btn btn-sm btn-danger" onclick="deleteOpportunity(' + item.id + ')">Delete</button>' +
          '</td>' +
        '</tr>';
    }
  } catch (error) {
    showMessage('Could not connect to the server', 'danger');
  }
}

// ---------- 2. show details of one ----------

async function viewOpportunity(id) {
  try {
    const response = await fetch(API + '/' + id);
    const item = await response.json();

    if (!response.ok) {
      showMessage(item.error, 'danger');
      return;
    }

    document.getElementById('details').innerHTML =
      '<div class="card mb-4 border-info"><div class="card-body">' +
        '<h4>' + safe(item.title) + '</h4>' +
        '<p>' + safe(item.description) + '</p>' +
        '<p><b>Area:</b> ' + safe(item.research_area) + '<br>' +
        '<b>Faculty:</b> ' + safe(item.faculty_name) + '<br>' +
        '<b>Department:</b> ' + safe(item.department) + '<br>' +
        '<b>Skills:</b> ' + safe(item.required_skills) + '<br>' +
        '<b>Positions:</b> ' + item.positions + '<br>' +
        '<b>Deadline:</b> ' + item.deadline + '<br>' +
        '<b>Status:</b> ' + item.status + '</p>' +
        '<button class="btn btn-sm btn-secondary" onclick="hideDetails()">Hide</button>' +
      '</div></div>';
  } catch (error) {
    showMessage('Could not connect to the server', 'danger');
  }
}

function hideDetails() {
  document.getElementById('details').innerHTML = '';
}

// ---------- 3 and 4. create or update (same form) ----------

async function saveOpportunity(event) {
  event.preventDefault();   // stops the page from reloading

  const body = {
    title: document.getElementById('title').value.trim(),
    description: document.getElementById('description').value.trim(),
    research_area: document.getElementById('research_area').value.trim(),
    faculty_name: document.getElementById('faculty_name').value.trim(),
    department: document.getElementById('department').value.trim(),
    required_skills: document.getElementById('required_skills').value.trim(),
    positions: document.getElementById('positions').value,
    deadline: document.getElementById('deadline').value
  };

  // basic validation: nothing may be empty
  for (const key in body) {
    if (body[key] === '') {
      showMessage('Please fill in all fields (' + key.replace('_', ' ') + ' is empty)', 'danger');
      return;
    }
  }

  const id = document.getElementById('editId').value;
  let url = API;
  let method = 'POST';

  if (id !== '') {            // we are editing, not creating
    url = API + '/' + id;
    method = 'PUT';
    body.status = document.getElementById('status').value;
  }

  try {
    const response = await fetch(url, {
      method: method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json();

    if (response.ok) {
      showMessage(method === 'POST' ? 'Opportunity created successfully' : 'Opportunity updated successfully', 'success');
      resetForm();
      loadOpportunities();
    } else {
      showMessage(data.error, 'danger');
    }
  } catch (error) {
    showMessage('Could not connect to the server', 'danger');
  }
}

// ---------- fill the form for editing ----------

async function editOpportunity(id) {
  try {
    const response = await fetch(API + '/' + id);
    const item = await response.json();

    if (!response.ok) {
      showMessage(item.error, 'danger');
      return;
    }

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
    document.getElementById('statusGroup').style.display = 'block';
    document.getElementById('cancelButton').style.display = 'inline-block';
    window.scrollTo(0, 0);
  } catch (error) {
    showMessage('Could not connect to the server', 'danger');
  }
}

// ---------- 5. close an opportunity ----------

async function closeOpportunity(id) {
  try {
    const response = await fetch(API + '/' + id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Closed' })
    });
    const data = await response.json();

    if (response.ok) {
      showMessage('Opportunity closed', 'success');
      loadOpportunities();
    } else {
      showMessage(data.error, 'danger');
    }
  } catch (error) {
    showMessage('Could not connect to the server', 'danger');
  }
}

// ---------- 6. delete an opportunity ----------

async function deleteOpportunity(id) {
  if (!confirm('Are you sure you want to delete this opportunity?')) {
    return;
  }

  try {
    const response = await fetch(API + '/' + id, { method: 'DELETE' });
    const data = await response.json();

    if (response.ok) {
      showMessage('Opportunity deleted', 'success');
      hideDetails();
      loadOpportunities();
    } else {
      showMessage(data.error, 'danger');
    }
  } catch (error) {
    showMessage('Could not connect to the server', 'danger');
  }
}

// ---------- start ----------

document.getElementById('opportunityForm').addEventListener('submit', saveOpportunity);
document.getElementById('cancelButton').addEventListener('click', resetForm);
loadOpportunities();   // runs when the page opens