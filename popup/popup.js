// Popup script for Cloudflow Chrome Extension

// DOM elements
const instanceDropdown = document.getElementById('instance-dropdown');
const instanceToggle = document.getElementById('instance-toggle');
const instanceSelected = document.querySelector('#instance-dropdown .dropdown-selected');
const instanceContent = document.querySelector('#instance-dropdown .dropdown-content');

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const currentSite = document.getElementById('current-site');

    // Get current tab info
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            try {
                const url = new URL(tabs[0].url);
                currentSite.textContent = url.hostname;
            } catch (e) {
                currentSite.textContent = 'Unknown';
            }
        }
    });

    // Update app info in the popup
    updateAppInfo();

    // Initialize dropdowns
    initializeDropdowns();

    // Load instances from storage
    loadCloudflowInstances();

    // Load previously selected instance from session storage
    loadSelectedInstance();

    // Settings icon click handler
    const settingsIcon = document.getElementById('settings-icon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function (e) {
            e.preventDefault();
            chrome.runtime.openOptionsPage();
        });
    }
});

// Update app information
function updateAppInfo() {
    const manifest = chrome.runtime.getManifest();
    const versionElement = document.getElementById('version-info');
    if (versionElement) {
        versionElement.textContent = `Release v${manifest.version}`;
    }
    const appNameElement = document.getElementById('app-name');
    if (appNameElement) {
        appNameElement.textContent = `${manifest.name}`;
    }
}

// Initialize all dropdowns with toggle behavior
function initializeDropdowns() {
    console.log('Initializing dropdowns...');
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach((dropdown, index) => {
        console.log(`Setting up dropdown #${index}`);
        const toggle = dropdown.querySelector('.dropdown-toggle');

        if (toggle) {
            // Toggle dropdown menu
            toggle.addEventListener('click', function (e) {
                console.log(`Toggle clicked for dropdown #${index}`);
                e.preventDefault();
                e.stopPropagation();

                // Toggle current dropdown
                dropdown.classList.toggle('open');
                console.log(`Dropdown open state: ${dropdown.classList.contains('open')}`);

                // Close all other open dropdowns
                dropdowns.forEach((d, i) => {
                    if (i !== index && d.classList.contains('open')) {
                        d.classList.remove('open');
                    }
                });

                // Focus search input if dropdown is opened
                if (dropdown.classList.contains('open')) {
                    const searchInput = dropdown.querySelector('.dropdown-search-input');
                    if (searchInput) {
                        setTimeout(() => searchInput.focus(), 100);
                    }
                }
            });
        }

        // Handle search functionality
        const searchInput = dropdown.querySelector('.dropdown-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', function () {
                const searchTerm = this.value.toLowerCase();
                const items = dropdown.querySelectorAll('.dropdown-item');

                items.forEach((item) => {
                    const text = item.textContent.toLowerCase();
                    if (text.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });

            // Prevent dropdown from closing when clicking in the search field
            searchInput.addEventListener('click', function (e) {
                e.stopPropagation();
            });
        }
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.dropdown')) {
            dropdowns.forEach((dropdown) => {
                dropdown.classList.remove('open');
            });
        }
    });
}

// Load Cloudflow instances from storage
function loadCloudflowInstances() {
    chrome.storage.sync.get(['cloudflowInstances'], function (result) {
        console.log('Loaded instances:', result.cloudflowInstances);
        const instances = result.cloudflowInstances || [];
        populateInstancesDropdown(instances);
    });
}

// Populate the instances dropdown
function populateInstancesDropdown(instances) {
    console.log('Populating instances dropdown...');
    // Clear existing items
    if (instanceContent) {
        instanceContent.innerHTML = '';

        if (instances.length === 0) {
            // No instances found - add a message
            const noInstancesMsg = document.createElement('div');
            noInstancesMsg.className = 'dropdown-message';
            noInstancesMsg.textContent = 'No Cloudflow instances available. Add instances in the settings.';
            instanceContent.appendChild(noInstancesMsg);
        } else {
            // Add each instance to the dropdown
            instances.forEach((instance) => {
                const instanceItem = document.createElement('a');
                instanceItem.href = '#';
                instanceItem.className = 'dropdown-item';
                instanceItem.textContent = instance.name;
                instanceItem.dataset.url = instance.url;

                // Handle instance selection
                instanceItem.addEventListener('click', function (e) {
                    e.preventDefault();
                    selectInstance(instance);
                    instanceDropdown.classList.remove('open');
                });

                instanceContent.appendChild(instanceItem);
            });
        }
    } else {
        console.error('Could not find instanceContent element');
    }
}

// Select an instance
function selectInstance(instance) {
    console.log('Instance selected:', instance);
    if (instanceSelected) {
        // Update the dropdown text
        instanceSelected.textContent = instance.name;
        instanceSelected.dataset.url = instance.url;

        // Save the selection to session storage
        sessionStorage.setItem('selectedCloudflowInstance', JSON.stringify(instance));
    }
}

// Load previously selected instance from session storage
function loadSelectedInstance() {
    if (instanceSelected) {
        const selectedInstance = sessionStorage.getItem('selectedCloudflowInstance');

        if (selectedInstance) {
            try {
                const instance = JSON.parse(selectedInstance);
                instanceSelected.textContent = instance.name;
                instanceSelected.dataset.url = instance.url;
                console.log('Loaded selected instance:', instance);
            } catch (e) {
                console.error('Error parsing selected instance:', e);
            }
        }
    }
}

// Console log for debugging
console.log('Popup script loaded');
