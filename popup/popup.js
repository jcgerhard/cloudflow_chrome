// Popup script for Cloudflow Chrome Extension

document.addEventListener('DOMContentLoaded', () => {
    // Get UI elements
    const statusIndicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('status-text');
    const toggleBtn = document.getElementById('toggle-btn');
    const optionsBtn = document.getElementById('options-btn');
    const currentSite = document.getElementById('current-site');

    // Get messages from localization
    const statusEnabledText = chrome.i18n.getMessage('statusEnabled');
    const statusDisabledText = chrome.i18n.getMessage('statusDisabled');
    const btnEnableText = chrome.i18n.getMessage('btnEnable');
    const btnDisableText = chrome.i18n.getMessage('btnDisable');

    // Get current settings from storage
    chrome.storage.sync.get(['settings'], (result) => {
        const settings = result.settings || { enabled: true };
        updateUI(settings.enabled);
    });

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

    // Toggle button click handler
    toggleBtn.addEventListener('click', () => {
        chrome.storage.sync.get(['settings'], (result) => {
            const settings = result.settings || { enabled: true };
            const newEnabled = !settings.enabled;

            // Update settings
            chrome.storage.sync.set(
                {
                    settings: {
                        ...settings,
                        enabled: newEnabled,
                    },
                },
                () => {
                    updateUI(newEnabled);
                },
            );

            // Notify content script of the change
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'toggleStatus',
                        enabled: newEnabled,
                    });
                }
            });
        });
    });

    // Options button click handler
    optionsBtn.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
    });

    // Helper to update UI based on enabled status
    function updateUI(enabled) {
        if (enabled) {
            statusIndicator.classList.remove('disabled');
            statusText.textContent = statusEnabledText;
            toggleBtn.textContent = btnDisableText;
        } else {
            statusIndicator.classList.add('disabled');
            statusText.textContent = statusDisabledText;
            toggleBtn.textContent = btnEnableText;
        }
    }
});
