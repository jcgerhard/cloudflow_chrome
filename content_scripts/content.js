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
    } else if (message.action === 'copyVariables') {
        // Handle the copy variables request from the popup
        copyVariablesToClipboard()
            .then((success) => {
                sendResponse({ success });
            })
            .catch((error) => {
                console.error('Error copying variables:', error);
                sendResponse({ success: false, error: error.message });
            });

        return true; // Indicate we'll send a response asynchronously
    }
    return true;
});

// Convert the variables object to a series of JavaScript constant declarations
function convertToJavaScriptConstants(variablesStr) {
    try {
        const variablesObj = JSON.parse(variablesStr);
        let result = '';

        for (const key in variablesObj) {
            if (Object.hasOwnProperty.call(variablesObj, key)) {
                const item = variablesObj[key];
                if (item && typeof item === 'object' && 'value' in item) {
                    const value = item.value;
                    // Format the value based on its type
                    let formattedValue;
                    if (typeof value === 'string') {
                        formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                    } else if (typeof value === 'boolean' || typeof value === 'number') {
                        formattedValue = value;
                    } else if (Array.isArray(value) || typeof value === 'object') {
                        formattedValue = JSON.stringify(value, null, 2);
                    } else {
                        formattedValue = value;
                    }

                    result += `const ${key} = ${formattedValue};\n`;
                }
            }
        }

        return result;
    } catch (error) {
        console.error('Error parsing variables:', error);
        return variablesStr; // Return original string on error
    }
}

// Enhance the existing copy feature on Cloudflow pages
function enhanceCopyFeature() {
    // Check if we're on the right page
    const url = window.location.href;
    if (!url.includes('/appnavigator/index.html') && !url.includes('/portal.cgi?quantum')) {
        return;
    }

    console.log('Cloudflow page detected, enhancing copy feature');

    // Add Montserrat font if not already loaded
    if (!document.getElementById('montserrat-font')) {
        const fontLink = document.createElement('link');
        fontLink.id = 'montserrat-font';
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600&display=swap';
        document.head.appendChild(fontLink);
    }

    // Function to enhance a copy button
    function enhanceCopyButton(variablesComponent, copyButton) {
        if (copyButton && !copyButton.dataset.enhancedCopy) {
            console.log('Enhancing copy button', copyButton);

            // Mark the button as enhanced
            copyButton.dataset.enhancedCopy = 'true';

            // Create a wrapper for the click event
            const wrapper = function (e) {
                // Prevent the default copy behavior
                e.preventDefault();
                e.stopPropagation();

                // Find the span with variables
                const copyVariablesSpan = variablesComponent.querySelector('span.copyVariables.copy-offscreen');

                if (copyVariablesSpan) {
                    // Get the original content
                    const originalContent = copyVariablesSpan.textContent || copyVariablesSpan.innerText;

                    // Convert to JavaScript constants
                    const jsConstants = convertToJavaScriptConstants(originalContent);

                    // Copy to clipboard
                    navigator.clipboard
                        .writeText(jsConstants)
                        .then(() => {
                            console.log('Variables copied as JS constants');

                            // Show visual feedback
                            const originalText = copyButton.textContent || copyButton.innerHTML;
                            const originalFont = copyButton.style.fontFamily;
                            const originalBg = copyButton.style.backgroundColor;

                            copyButton.textContent = '✓ Copied as JS';
                            copyButton.style.fontFamily = 'Montserrat, sans-serif';

                            setTimeout(() => {
                                if (originalText) {
                                    copyButton.textContent = originalText;
                                } else {
                                    copyButton.innerHTML = originalText;
                                }
                                copyButton.style.fontFamily = originalFont;
                                copyButton.style.backgroundColor = originalBg;
                            }, 1500);
                        })
                        .catch((err) => {
                            console.error('Failed to copy using Clipboard API:', err);
                            // Fallback copy mechanism
                            const textarea = document.createElement('textarea');
                            textarea.value = jsConstants;
                            textarea.style.position = 'fixed';
                            textarea.style.opacity = '0';
                            document.body.appendChild(textarea);
                            textarea.select();
                            const success = document.execCommand('copy');
                            document.body.removeChild(textarea);

                            if (success) {
                                console.log('Variables copied as JS constants (fallback)');

                                // Show visual feedback
                                const originalText = copyButton.textContent || copyButton.innerHTML;
                                const originalFont = copyButton.style.fontFamily;

                                copyButton.textContent = '✓ Copied as JS';
                                copyButton.style.fontFamily = 'Montserrat, sans-serif';

                                setTimeout(() => {
                                    if (originalText) {
                                        copyButton.textContent = originalText;
                                    } else {
                                        copyButton.innerHTML = originalText;
                                    }
                                    copyButton.style.fontFamily = originalFont;
                                }, 1500);
                            } else {
                                console.error('Failed to copy with execCommand');
                            }
                        });
                } else {
                    console.error('Copy variables span not found');
                }

                return false;
            };

            // Use the capture phase to intercept the click before the original handler
            copyButton.addEventListener('click', wrapper, true);
        }
    }

    // Watch for the variables component and copy button
    const observer = new MutationObserver((mutations) => {
        const variablesComponent = document.querySelector(
            '.workable_variables_component.debug_component.notranslate.nixps-quantum-DebugPanelVariables',
        );

        if (variablesComponent) {
            // Find the specific copy button with the class "debugpanel_CopyText fa fa-copy"
            const copyButton = variablesComponent.querySelector('.debugpanel_CopyText.fa.fa-copy');
            enhanceCopyButton(variablesComponent, copyButton);
        }
    });

    // Check immediately in case the elements are already in the DOM
    const variablesComponent = document.querySelector(
        '.workable_variables_component.debug_component.notranslate.nixps-quantum-DebugPanelVariables',
    );

    if (variablesComponent) {
        const copyButton = variablesComponent.querySelector('.debugpanel_CopyText.fa.fa-copy');
        enhanceCopyButton(variablesComponent, copyButton);
    }

    // Start observing the entire document for changes
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
    });
}

// Function to copy variables to clipboard when triggered by popup
function copyVariablesToClipboard() {
    return new Promise((resolve, reject) => {
        try {
            // Check if we're on the right page
            const url = window.location.href;
            if (!url.includes('/appnavigator/index.html') && !url.includes('/portal.cgi?quantum')) {
                reject(new Error('Not on a Cloudflow page'));
                return;
            }

            // Find the variables component
            const variablesComponent = document.querySelector(
                '.workable_variables_component.debug_component.notranslate.nixps-quantum-DebugPanelVariables',
            );

            if (!variablesComponent) {
                reject(new Error('Variables component not found'));
                return;
            }

            // Find the copyVariables span
            const copyVariablesSpan = variablesComponent.querySelector('span.copyVariables.copy-offscreen');

            if (!copyVariablesSpan) {
                reject(new Error('Copy variables span not found'));
                return;
            }

            // Get the content
            const originalContent = copyVariablesSpan.textContent || copyVariablesSpan.innerText;

            // Convert to JavaScript constants
            const jsConstants = convertToJavaScriptConstants(originalContent);

            // Copy to clipboard
            const clipboard = navigator.clipboard;
            if (clipboard) {
                clipboard
                    .writeText(jsConstants)
                    .then(() => {
                        console.log('Variables copied as JS constants');
                        resolve(true);
                    })
                    .catch((err) => {
                        console.error('Failed to copy using clipboard API: ', err);
                        // Try fallback
                        try {
                            const textarea = document.createElement('textarea');
                            textarea.value = jsConstants;
                            textarea.style.position = 'fixed';
                            textarea.style.opacity = '0';
                            document.body.appendChild(textarea);
                            textarea.select();
                            const success = document.execCommand('copy');
                            document.body.removeChild(textarea);

                            if (success) {
                                console.log('Variables copied as JS constants (fallback)');
                                resolve(true);
                            } else {
                                reject(new Error('Failed to copy using fallback method'));
                            }
                        } catch (fallbackError) {
                            reject(fallbackError);
                        }
                    });
            } else {
                // Fallback for older browsers
                try {
                    const textarea = document.createElement('textarea');
                    textarea.value = jsConstants;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textarea);

                    if (success) {
                        console.log('Variables copied as JS constants (fallback)');
                        resolve(true);
                    } else {
                        reject(new Error('Failed to copy using fallback method'));
                    }
                } catch (fallbackError) {
                    reject(fallbackError);
                }
            }
        } catch (error) {
            reject(error);
        }
    });
}

// Wait for page to be fully loaded
window.addEventListener('load', () => {
    // Uncomment to inject UI elements
    // injectUI();

    // Enhance the copy feature on Cloudflow pages
    enhanceCopyFeature();
});
