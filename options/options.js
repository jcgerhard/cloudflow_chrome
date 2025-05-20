// Options script for Cloudflow Chrome Extension

// Default settings
const defaultSettings = {
    cloudflowInstances: [],
};

// Cloudflow Instances elements
const instancesList = document.getElementById('instances-list');
const instanceNameInput = document.getElementById('instance-name');
const instanceUrlInput = document.getElementById('instance-url');
const addInstanceButton = document.getElementById('add-instance');
const updateInstanceButton = document.getElementById('update-instance');
const cancelEditButton = document.getElementById('cancel-edit');
const formTitle = document.getElementById('form-title');
const statusEl = document.getElementById('status');

// Store the current instances
let cloudflowInstances = [];
let editingIndex = -1;

// Load settings when options page is opened
document.addEventListener('DOMContentLoaded', loadSettings);

// Event listeners
addInstanceButton.addEventListener('click', addInstance);
updateInstanceButton.addEventListener('click', updateInstance);
cancelEditButton.addEventListener('click', cancelEdit);

// Load current settings from storage
function loadSettings() {
    chrome.storage.sync.get(['cloudflowInstances'], (result) => {
        // Load instances
        cloudflowInstances = result.cloudflowInstances || [];
        renderInstancesList();
    });
}

// Save instances to storage
function saveInstances() {
    chrome.storage.sync.set(
        {
            cloudflowInstances: cloudflowInstances,
        },
        () => {
            // Show success message
            showStatus('Instances saved successfully');

            // Notify the extension that settings have changed
            chrome.runtime.sendMessage({
                action: 'instancesUpdated',
                cloudflowInstances: cloudflowInstances,
            });
        },
    );
}

// Show status message
function showStatus(message) {
    statusEl.textContent = message;
    statusEl.classList.add('active');
    setTimeout(() => {
        statusEl.classList.remove('active');
        statusEl.textContent = '';
    }, 3000);
}

// Render the instances list
function renderInstancesList() {
    instancesList.innerHTML = '';

    if (cloudflowInstances.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = 'No Cloudflow instances added yet.';
        instancesList.appendChild(emptyMessage);
        return;
    }

    cloudflowInstances.forEach((instance, index) => {
        const instanceItem = document.createElement('div');
        instanceItem.className = 'instance-item';

        const instanceInfo = document.createElement('div');
        instanceInfo.className = 'instance-info';

        const instanceName = document.createElement('h4');
        instanceName.textContent = instance.name;

        const instanceUrl = document.createElement('p');
        instanceUrl.textContent = instance.url;

        instanceInfo.appendChild(instanceName);
        instanceInfo.appendChild(instanceUrl);

        const instanceActions = document.createElement('div');
        instanceActions.className = 'instance-actions';

        const editButton = document.createElement('button');
        editButton.className = 'btn secondary small';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => editInstance(index));

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn secondary small danger';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteInstance(index));

        instanceActions.appendChild(editButton);
        instanceActions.appendChild(deleteButton);

        instanceItem.appendChild(instanceInfo);
        instanceItem.appendChild(instanceActions);

        instancesList.appendChild(instanceItem);
    });
}

// Add a new instance
function addInstance() {
    const name = instanceNameInput.value.trim();
    const url = instanceUrlInput.value.trim();

    if (!name || !url) {
        showStatus('Please enter both name and URL.');
        return;
    }

    if (!isValidUrl(url)) {
        showStatus('Please enter a valid URL.');
        return;
    }

    cloudflowInstances.push({ name, url });
    renderInstancesList();
    clearInstanceForm();
    saveInstances(); // Save automatically after adding
    showStatus('Instance added successfully!');
}

// Edit an instance
function editInstance(index) {
    const instance = cloudflowInstances[index];
    instanceNameInput.value = instance.name;
    instanceUrlInput.value = instance.url;

    formTitle.textContent = 'Edit Instance';
    addInstanceButton.style.display = 'none';
    updateInstanceButton.style.display = 'inline-block';
    cancelEditButton.style.display = 'inline-block';

    editingIndex = index;
}

// Update an instance
function updateInstance() {
    const name = instanceNameInput.value.trim();
    const url = instanceUrlInput.value.trim();

    if (!name || !url) {
        showStatus('Please enter both name and URL.');
        return;
    }

    if (!isValidUrl(url)) {
        showStatus('Please enter a valid URL.');
        return;
    }

    cloudflowInstances[editingIndex] = { name, url };
    renderInstancesList();
    resetInstanceForm();
    saveInstances(); // Save automatically after updating
    showStatus('Instance updated successfully!');
}

// Delete an instance
function deleteInstance(index) {
    if (confirm('Are you sure you want to delete this instance?')) {
        cloudflowInstances.splice(index, 1);
        renderInstancesList();
        saveInstances(); // Save automatically after deleting
        showStatus('Instance deleted successfully!');
    }
}

// Cancel edit mode
function cancelEdit() {
    resetInstanceForm();
}

// Clear the instance form
function clearInstanceForm() {
    instanceNameInput.value = '';
    instanceUrlInput.value = '';
}

// Reset instance form to add mode
function resetInstanceForm() {
    clearInstanceForm();
    formTitle.textContent = 'Add New Instance';
    addInstanceButton.style.display = 'inline-block';
    updateInstanceButton.style.display = 'none';
    cancelEditButton.style.display = 'none';
    editingIndex = -1;
}

// Validate URL format
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (e) {
        return false;
    }
}
