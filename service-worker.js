// Service worker for Cloudflow Chrome Extension
console.log('Service worker initialized');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('Extension installed:', details.reason);

    // Initialize default settings
    chrome.storage.sync.get(['settings'], (result) => {
        if (!result.settings) {
            chrome.storage.sync.set({
                settings: {
                    enabled: true,
                    theme: 'light',
                },
            });
        }
    });
});

// Example of message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received:', message);

    if (message.action === 'getData') {
        // Example of async response
        sendResponse({ success: true, data: 'Example data' });
    }

    // Handle test communication from our test helper
    if (message.action === 'testCommunication') {
        console.log('Test communication received from:', sender);
        sendResponse({
            success: true,
            message: 'Communication successful from service worker!',
            timestamp: new Date().toISOString(),
        });
    }

    // Return true for async response
    return true;
});
