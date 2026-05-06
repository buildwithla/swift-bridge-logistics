const apiBase = '/api';

function createElement(tag, props = {}, children = []) {
    const el = document.createElement(tag);
    Object.entries(props).forEach(([key, value]) => {
        if (key === 'className') el.className = value;
        else if (key === 'innerHTML') el.innerHTML = value;
        else el.setAttribute(key, value);
    });
    children.forEach(child => el.appendChild(child));
    return el;
}

function setLoginMessage(message, isError = false) {
    const msg = document.getElementById('loginMessage');
    if (!msg) return;
    msg.textContent = message;
    msg.style.color = isError ? '#d14343' : 'var(--accent)';
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, options);
    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Request failed');
    }
    return response.json();
}

function getToken() {
    return localStorage.getItem('swiftbridge_token');
}

function saveToken(token) {
    localStorage.setItem('swiftbridge_token', token);
}

function clearToken() {
    localStorage.removeItem('swiftbridge_token');
}

function redirectToLogin() {
    window.location.href = 'login.html';
}

function buildTimelineList(timeline = []) {
    const list = document.createElement('ul');
    list.className = 'timeline';
    timeline.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        list.appendChild(li);
    });
    return list;
}

function buildStatusChip(status) {
    const span = document.createElement('span');
    span.className = 'status-chip';
    span.textContent = status;
    return span;
}

function getTimelineByStatus(status) {
    const map = {
        'Package Received': ['Package Received'],
        'In Transit': ['Package Received', 'In Transit'],
        'Out for Delivery': ['Package Received', 'In Transit', 'Out for Delivery'],
        'Delivered': ['Package Received', 'In Transit', 'Out for Delivery', 'Delivered']
    };
    return map[status] || ['Package Received'];
}

function initTrackPage() {
    const form = document.getElementById('trackForm');
    const result = document.getElementById('trackResult');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const trackingNumber = document.getElementById('trackingNumber').value.trim().toUpperCase();
        if (!trackingNumber) return;
        result.innerHTML = '';
        result.classList.add('hidden');
        try {
            const shipment = await fetchJson(`${apiBase}/track/${trackingNumber}`);
            const content = document.createElement('div');
            content.innerHTML = `
        <h3>Tracking ${shipment.trackingNumber}</h3>
        <p><strong>From:</strong> ${shipment.from}</p>
        <p><strong>To:</strong> ${shipment.to}</p>
      `;
            const statusRow = document.createElement('div');
            statusRow.className = 'status-badge';
            statusRow.textContent = shipment.status;
            content.appendChild(statusRow);
            const location = document.createElement('p');
            location.innerHTML = `<strong>Current location:</strong> ${shipment.currentLocation}`;
            content.appendChild(location);
            content.appendChild(buildTimelineList(shipment.timeline));
            result.appendChild(content);
            result.classList.remove('hidden');
        } catch (error) {
            result.textContent = error.message;
            result.classList.remove('hidden');
        }
    });
}

function initLoginPage() {
    const form = document.getElementById('loginForm');
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!email || !password) {
            setLoginMessage('Please complete both fields.', true);
            return;
        }

        try {
            const response = await fetchJson(`${apiBase}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            saveToken(response.token);
            window.location.href = 'admin.html';
        } catch (error) {
            setLoginMessage(error.message, true);
        }
    });
}

function renderShipmentCard(shipment) {
    const card = document.createElement('div');
    card.className = 'shipment-card';

    const header = document.createElement('div');
    header.innerHTML = `
    <strong>${shipment.trackingNumber}</strong>
    <p>${shipment.from} → ${shipment.to}</p>
  `;
    card.appendChild(header);

    const meta = document.createElement('div');
    meta.className = 'shipment-meta';
    meta.innerHTML = `
    <div><span class="status-badge">${shipment.status}</span></div>
    <div><strong>Location</strong><p>${shipment.currentLocation}</p></div>
  `;
    card.appendChild(meta);

    const updateForm = document.createElement('form');
    updateForm.className = 'update-form';
    updateForm.innerHTML = `
    <label for="status-${shipment._id}">Status</label>
    <select id="status-${shipment._id}" name="status">
      <option ${shipment.status === 'Package Received' ? 'selected' : ''}>Package Received</option>
      <option ${shipment.status === 'In Transit' ? 'selected' : ''}>In Transit</option>
      <option ${shipment.status === 'Out for Delivery' ? 'selected' : ''}>Out for Delivery</option>
      <option ${shipment.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
    </select>
    <label for="location-${shipment._id}">Current location</label>
    <input id="location-${shipment._id}" name="currentLocation" value="${shipment.currentLocation}" />
  `;

    const actions = document.createElement('div');
    actions.className = 'shipment-actions';
    const updateButton = createElement('button', { className: 'btn btn-primary', type: 'button', innerHTML: 'Update' });
    const deleteButton = createElement('button', { className: 'btn btn-secondary', type: 'button', innerHTML: 'Delete' });

    updateButton.addEventListener('click', async () => {
        const status = document.getElementById(`status-${shipment._id}`).value;
        const currentLocation = document.getElementById(`location-${shipment._id}`).value.trim();
        try {
            await fetchJson(`${apiBase}/shipments/${shipment._id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ status, currentLocation, timeline: getTimelineByStatus(status) })
            });
            loadShipments();
        } catch (error) {
            if (error.message.includes('token')) redirectToLogin();
            alert(error.message);
        }
    });

    deleteButton.addEventListener('click', async () => {
        if (!confirm('Remove this shipment?')) return;
        try {
            await fetchJson(`${apiBase}/shipments/${shipment._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            loadShipments();
        } catch (error) {
            if (error.message.includes('token')) redirectToLogin();
            alert(error.message);
        }
    });

    actions.appendChild(updateButton);
    actions.appendChild(deleteButton);
    card.appendChild(updateForm);
    card.appendChild(actions);

    const timelineTitle = document.createElement('p');
    timelineTitle.innerHTML = '<strong>Timeline</strong>';
    card.appendChild(timelineTitle);
    card.appendChild(buildTimelineList(shipment.timeline));

    return card;
}

async function loadShipments() {
    const list = document.getElementById('shipmentsList');
    if (!list) return;
    list.innerHTML = '<p>Loading shipments...</p>';

    try {
        const shipments = await fetchJson(`${apiBase}/shipments`, {
            headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!shipments.length) {
            list.innerHTML = '<p>No shipments created yet.</p>';
            return;
        }
        list.innerHTML = '';
        shipments.forEach(shipment => list.appendChild(renderShipmentCard(shipment)));
    } catch (error) {
        redirectToLogin();
    }
}

function initAdminPage() {
    if (!getToken()) {
        redirectToLogin();
        return;
    }

    const createForm = document.getElementById('createShipmentForm');
    const updateForm = document.getElementById('updateStatusForm');
    const logoutButton = document.getElementById('logoutButton');
    const createMessage = document.getElementById('createMessage');
    const updateMessage = document.getElementById('updateMessage');

    logoutButton.addEventListener('click', () => {
        clearToken();
        redirectToLogin();
    });

    const showMessage = (element, message, isError = false) => {
        if (!element) return;
        element.textContent = message;
        element.style.color = isError ? '#d14343' : 'var(--accent)';
    };

    createForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const trackingNumber = document.getElementById('trackingNumber').value.trim();
        const from = document.getElementById('from').value.trim();
        const to = document.getElementById('to').value.trim();
        const status = document.getElementById('status').value;

        if (!from || !to) {
            showMessage(createMessage, 'Sender and destination are required.', true);
            return;
        }

        try {
            const shipment = await fetchJson(`${apiBase}/shipments/create-shipment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ trackingNumber, from, to, status })
            });
            createForm.reset();
            showMessage(createMessage, `Shipment ${shipment.trackingNumber} created successfully.`);
            loadShipments();
        } catch (error) {
            if (error.message.includes('token')) redirectToLogin();
            showMessage(createMessage, error.message, true);
        }
    });

    updateForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const trackingNumber = document.getElementById('updateTrackingNumber').value.trim();
        const status = document.getElementById('updateStatus').value;

        if (!trackingNumber) {
            showMessage(updateMessage, 'Tracking number is required to update status.', true);
            return;
        }

        try {
            const shipment = await fetchJson(`${apiBase}/shipments/update-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ trackingNumber, status })
            });
            updateForm.reset();
            showMessage(updateMessage, `Shipment ${shipment.trackingNumber} updated to ${shipment.status}.`);
            loadShipments();
        } catch (error) {
            if (error.message.includes('token')) redirectToLogin();
            showMessage(updateMessage, error.message, true);
        }
    });

    loadShipments();
}

function createHistoryTable(shipments) {
    const table = createElement('table', { className: 'history-table' });
    const header = createElement('thead');
    header.innerHTML = `
        <tr>
            <th>Tracking</th>
            <th>From</th>
            <th>To</th>
            <th>Status</th>
            <th>Current location</th>
            <th>Timeline</th>
        </tr>
    `;
    table.appendChild(header);

    const body = createElement('tbody');
    shipments.forEach((shipment) => {
        const row = createElement('tr');
        row.innerHTML = `
            <td>${shipment.trackingNumber}</td>
            <td>${shipment.from}</td>
            <td>${shipment.to}</td>
            <td><span class="status-badge">${shipment.status}</span></td>
            <td>${shipment.currentLocation}</td>
            <td>${shipment.timeline.join(' → ')}</td>
        `;
        body.appendChild(row);
    });
    table.appendChild(body);
    return table;
}

async function initHistoryPage() {
    const container = document.getElementById('historyContainer');
    if (!container) return;
    container.innerHTML = '<p>Loading shipment history...</p>';

    try {
        const shipments = await fetchJson(`${apiBase}/shipments/public`);
        if (!shipments.length) {
            container.innerHTML = '<p>No shipment history available yet.</p>';
            return;
        }
        container.innerHTML = '';
        container.appendChild(createHistoryTable(shipments));
    } catch (error) {
        container.innerHTML = `<p class="error-text">${error.message}</p>`;
    }
}

(function init() {
    const pageAttr = document.documentElement.dataset.page;
    if (pageAttr === 'track') initTrackPage();
    if (pageAttr === 'login') initLoginPage();
    if (pageAttr === 'admin') initAdminPage();
    if (pageAttr === 'history') initHistoryPage();
})();
