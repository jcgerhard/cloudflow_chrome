// Content script for Cloudflow Chrome Extension
console.log('Cloudflow content script loaded');

// Example of DOM manipulation
function injectUI() {
    // Check if our element already exists
    if (document.getElementById('cloudflow-container')) {
        return;
    }

    // Create and inject elements
    const container = document.createElement('div');
    container.id = 'cloudflow-container';
    container.style.cssText = 'position: fixed; bottom: 20px; right: 20px; z-index: 9999;';

    // Example button
    const button = document.createElement('button');
    button.textContent = 'Cloudflow';
    button.style.cssText =
        'background: #4285f4; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;';

    button.addEventListener('click', () => {
        // Example of sending a message to the extension
        chrome.runtime.sendMessage({ action: 'buttonClicked' });
    });

    container.appendChild(button);
    document.body.appendChild(container);
}

// Example of listening for messages from extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'performAction') {
        console.log('Performing action in content script');
        sendResponse({ status: 'success' });
    }
    return true;
});

// Wait for page to be fully loaded
window.addEventListener('load', () => {
    // Uncomment to inject UI elements
    // injectUI();
});
