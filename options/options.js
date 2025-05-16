// Options script for Cloudflow Chrome Extension

// Default settings
const defaultSettings = {
    enabled: true,
    theme: 'light',
    notifications: true,
    dataRetention: 30,
};

// Get DOM elements
const enabledToggle = document.getElementById('enabled');
const themeSelect = document.getElementById('theme');
const notificationsToggle = document.getElementById('notifications');
const dataRetentionInput = document.getElementById('dataRetention');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const statusEl = document.getElementById('status');

// Load settings when options page is opened
document.addEventListener('DOMContentLoaded', loadSettings);

// Event listeners
saveBtn.addEventListener('click', saveSettings);
resetBtn.addEventListener('click', resetSettings);

// Load current settings from storage
function loadSettings() {
    chrome.storage.sync.get(['settings'], (result) => {
        const settings = result.settings || defaultSettings;

        // Update UI with current settings
        enabledToggle.checked = settings.enabled ?? defaultSettings.enabled;
        themeSelect.value = settings.theme || defaultSettings.theme;
        notificationsToggle.checked = settings.notifications ?? defaultSettings.notifications;
        dataRetentionInput.value = settings.dataRetention || defaultSettings.dataRetention;
    });
}

// Save settings to storage
function saveSettings() {
    const settings = {
        enabled: enabledToggle.checked,
        theme: themeSelect.value,
        notifications: notificationsToggle.checked,
        dataRetention: parseInt(dataRetentionInput.value, 10),
    };

    chrome.storage.sync.set({ settings }, () => {
        // Show success message
        statusEl.textContent = 'Settings saved successfully';
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);

        // Notify the extension that settings have changed
        chrome.runtime.sendMessage({ action: 'settingsUpdated', settings });
    });
}

// Reset to default settings
function resetSettings() {
    // Update UI with default values
    enabledToggle.checked = defaultSettings.enabled;
    themeSelect.value = defaultSettings.theme;
    notificationsToggle.checked = defaultSettings.notifications;
    dataRetentionInput.value = defaultSettings.dataRetention;

    // Save default settings to storage
    chrome.storage.sync.set({ settings: defaultSettings }, () => {
        statusEl.textContent = 'Settings reset to default';
        setTimeout(() => {
            statusEl.textContent = '';
        }, 3000);

        // Notify the extension that settings have changed
        chrome.runtime.sendMessage({ action: 'settingsUpdated', settings: defaultSettings });
    });
}
