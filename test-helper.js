// Basic script to help with testing our Chrome extension
console.log('Cloudflow Chrome Extension Test Script');

// Function to create a simple test UI
function createTestUI() {
    const container = document.createElement('div');
    container.id = 'cloudflow-test';
    container.style.cssText =
        'position: fixed; top: 20px; right: 20px; width: 300px; background: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; padding: 16px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); z-index: 9999;';

    const title = document.createElement('h3');
    title.textContent = 'Cloudflow Test Panel';
    title.style.cssText = 'margin-top: 0; margin-bottom: 16px; color: #4285F4;';

    const description = document.createElement('p');
    description.textContent = 'This panel helps you test the Cloudflow Chrome extension functionality.';
    description.style.cssText = 'margin-bottom: 16px; font-size: 14px;';

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'display: flex; gap: 8px;';

    const testButton = document.createElement('button');
    testButton.textContent = 'Test Communication';
    testButton.style.cssText =
        'background: #4285F4; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;';
    testButton.onclick = () => {
        // Send a test message to the extension
        chrome.runtime.sendMessage({ action: 'testCommunication' }, (response) => {
            if (response && response.success) {
                console.log('Communication test successful:', response);
                statusElement.textContent = 'Communication successful!';
                statusElement.style.color = '#4CAF50';
            } else {
                console.error('Communication test failed');
                statusElement.textContent = 'Communication failed!';
                statusElement.style.color = '#F44336';
            }
        });
    };

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close';
    closeButton.style.cssText =
        'background: #f1f3f4; color: #202124; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;';
    closeButton.onclick = () => {
        document.body.removeChild(container);
    };

    buttonContainer.appendChild(testButton);
    buttonContainer.appendChild(closeButton);

    const statusElement = document.createElement('p');
    statusElement.textContent = 'Status: Ready';
    statusElement.style.cssText = 'margin-top: 16px; font-size: 14px; font-weight: bold;';

    container.appendChild(title);
    container.appendChild(description);
    container.appendChild(buttonContainer);
    container.appendChild(statusElement);

    document.body.appendChild(container);
}

// Add a listener for extension messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Test page received message:', message);
    if (message.action === 'ping') {
        sendResponse({ success: true, message: 'Test page received ping!' });
    }
    return true;
});

// Run the test UI creation
setTimeout(createTestUI, 1000);
