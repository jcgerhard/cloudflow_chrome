// Popup script for Cloudflow Chrome Extension

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

    // Call this function when the popup is loaded
    updateAppInfo();

    // Settings icon click handler
    const settingsIcon = document.getElementById('settings-icon');
    if (settingsIcon) {
        settingsIcon.addEventListener('click', function (e) {
            e.preventDefault();
            // Open options page
            chrome.runtime.openOptionsPage();
        });
    }

    // Initialize dropdown functionality
    initDropdowns();
});

function initDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');

    // Ensure all dropdowns start collapsed
    dropdowns.forEach((dropdown) => dropdown.classList.remove('active'));

    // Handle outside clicks
    document.addEventListener('click', function (e) {
        // Only close dropdowns if clicking outside them
        if (!e.target.closest('.dropdown-toggle') && !e.target.closest('.dropdown-menu')) {
            dropdowns.forEach((dropdown) => dropdown.classList.remove('active'));
        }
    });

    // Set up each dropdown
    dropdowns.forEach((dropdown) => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        const searchInput = dropdown.querySelector('.dropdown-search-input');
        const items = dropdown.querySelectorAll('.dropdown-item');

        // Toggle dropdown open/closed
        toggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const isCurrentlyActive = dropdown.classList.contains('active');

            // Close all dropdowns
            dropdowns.forEach((d) => d.classList.remove('active'));

            // Open this one if it was closed
            if (!isCurrentlyActive) {
                dropdown.classList.add('active');
                if (searchInput) searchInput.focus();
            }
        });

        // Handle search filtering
        if (searchInput) {
            // Stop propagation on search input clicks
            searchInput.addEventListener('click', (e) => e.stopPropagation());

            // Filter items based on input
            searchInput.addEventListener('input', () => {
                const filter = searchInput.value.toLowerCase();
                items.forEach((item) => {
                    item.style.display = item.textContent.toLowerCase().includes(filter) ? '' : 'none';
                });
            });
        }
    });

    // Double-check that all dropdowns are closed by default
    setTimeout(() => {
        document.querySelectorAll('.dropdown').forEach((dropdown) => {
            dropdown.classList.remove('active');
        });
    }, 0);
}
