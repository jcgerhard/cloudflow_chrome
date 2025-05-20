// Service worker for Cloudflow Chrome Extension
import { getSessionIdFromCookie } from './utils/cookieUtils.js';
import { testSessionId } from './utils/sessionTest.js';

console.log('Service worker initialized');

// Make the test function available globally for debugging from console
self.testSessionId = testSessionId;

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

    if (message.action === 'getSessionId') {
        if (message.url) {
            // Use async/await in an IIFE to handle the Promise
            (async () => {
                try {
                    const sessionId = await getSessionIdFromCookie(message.url);
                    sendResponse({ success: true, sessionId });
                } catch (error) {
                    console.error('Error getting session ID:', error);
                    sendResponse({ success: false, error: error.message });
                }
            })();
            // Return true to indicate that sendResponse will be called asynchronously
            return true;
        } else {
            sendResponse({ success: false, error: 'No URL provided' });
        }
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
