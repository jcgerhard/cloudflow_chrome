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

    // Initialize action buttons
    initActionButtons();
});

// Function to initialize dropdowns
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
        const selectedDisplay = dropdown.querySelector('.dropdown-selected');

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

        // Add click handlers to all dropdown items
        items.forEach((item) => {
            item.addEventListener('click', function (e) {
                e.preventDefault();

                // Close the dropdown when item is clicked
                dropdown.classList.remove('active');

                // Update the selected item display
                if (selectedDisplay) {
                    selectedDisplay.textContent = this.textContent;
                    // Save the selection in localStorage for persistence
                    const dropdownId = dropdown.id;
                    if (dropdownId) {
                        localStorage.setItem(`${dropdownId}-selection`, this.textContent);
                    }
                }

                // Here you can add any additional functionality when an item is clicked
                // For example: Update the dropdown button text
                // toggle.textContent = this.textContent;

                // Or navigate to the item's href if needed
                // const href = this.getAttribute('href');
                // if (href && href !== '#') {
                //     window.location.href = href;
                // }
            });
        });

        // Restore saved selection from localStorage
        if (selectedDisplay && dropdown.id) {
            const savedSelection = localStorage.getItem(`${dropdown.id}-selection`);
            if (savedSelection) {
                selectedDisplay.textContent = `${savedSelection}`;
            }
        }
    });

    // Double-check that all dropdowns are closed by default
    setTimeout(() => {
        document.querySelectorAll('.dropdown').forEach((dropdown) => {
            dropdown.classList.remove('active');
        });
    }, 0);
}

// Function to initialize action buttons
function initActionButtons() {
    const actionButtons = document.querySelectorAll('.action-button');

    actionButtons.forEach((button, index) => {
        button.addEventListener('click', function () {
            if (index === 0) {
                // Button 1 - Copy Variables
                // First, check if we're on a Cloudflow page
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs[0]) {
                        const url = tabs[0].url;
                        if (url.includes('/appnavigator/index.html') || url.includes('/portal.cgi?quantum')) {
                            // Send message to content script to copy variables
                            chrome.tabs.sendMessage(tabs[0].id, { action: 'copyVariables' }, (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error('Error sending message:', chrome.runtime.lastError);
                                    // Show error message
                                    button.textContent = 'Error!';
                                    button.style.backgroundColor = '#f44336';
                                    setTimeout(() => {
                                        button.textContent = 'Copy Variables';
                                        button.style.backgroundColor = '';
                                    }, 1500);
                                    return;
                                }

                                if (response && response.success) {
                                    // Show success message in the popup
                                    button.textContent = 'Copied!';
                                    button.style.fontFamily = 'Montserrat, sans-serif';
                                    button.style.backgroundColor = '#4caf50';

                                    // Reset after 1.5 seconds
                                    setTimeout(() => {
                                        button.textContent = 'Copy Variables';
                                        button.style.backgroundColor = '';
                                    }, 1500);
                                } else {
                                    // Show error message
                                    button.textContent = 'Failed!';
                                    button.style.backgroundColor = '#f44336';

                                    // Reset after 1.5 seconds
                                    setTimeout(() => {
                                        button.textContent = 'Copy Variables';
                                        button.style.backgroundColor = '';
                                    }, 1500);
                                }
                            });
                        } else {
                            // Not on a Cloudflow page
                            button.textContent = 'Not on Cloudflow!';
                            button.style.backgroundColor = '#ff9800';

                            // Reset after 1.5 seconds
                            setTimeout(() => {
                                button.textContent = 'Copy Variables';
                                button.style.backgroundColor = '';
                            }, 1500);
                        }
                    }
                });
            } else if (index === 1) {
                // Button 2 functionality
                console.log('Button 2 clicked');
                // Add functionality for button 2 here
            }
        });
    });

    // Set button labels
    if (actionButtons.length > 0) {
        actionButtons[0].textContent = 'Copy Variables';
    }
    if (actionButtons.length > 1) {
        actionButtons[1].textContent = 'Action 2';
    }
}
