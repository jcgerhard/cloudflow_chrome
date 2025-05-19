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
    } else if (message.action === 'copyOutputVariables') {
        // Handle the copy output variables request from the popup
        copyOutputVariablesToClipboard()
            .then((success) => {
                sendResponse({ success });
            })
            .catch((error) => {
                console.error('Error copying output variables:', error);
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

// Convert the variables from output_component structure to JavaScript constants
function convertOutputVariablesToConstants(outputContent) {
    try {
        // Handle the special format with "output[...", ellipses, and "resolved output"
        // First, extract variables directly using regex since the JSON is malformed with ellipses
        const variablesRegex = /variables:\s*\{\s*(.*?)\}\}\s*\.\.\./gs;
        const match = variablesRegex.exec(outputContent);

        if (match && match[1]) {
            const variablesContent = match[1];

            // Parse the variables section by extracting key-value pairs
            const keyValuePairs = [];
            const keyValueRegex = /(\w+):\s*("[^"]*"|true|false|\d+|\[.*?\]|\{.*?\})/g;

            let keyValueMatch;
            while ((keyValueMatch = keyValueRegex.exec(variablesContent)) !== null) {
                const key = keyValueMatch[1];
                let value = keyValueMatch[2];

                // Convert values to proper JavaScript format
                if (value === 'true' || value === 'false') {
                    // Boolean values
                    keyValuePairs.push({ key, value: value === 'true' });
                } else if (/^\d+$/.test(value)) {
                    // Number values
                    keyValuePairs.push({ key, value: parseInt(value, 10) });
                } else if (value.startsWith('"') && value.endsWith('"')) {
                    // String values
                    keyValuePairs.push({ key, value: value.slice(1, -1) });
                } else if (value.startsWith('[') || value.startsWith('{')) {
                    // Array or object values - keep as string for now
                    keyValuePairs.push({ key, value });
                } else {
                    // Other values, treat as strings
                    keyValuePairs.push({ key, value: `"${value}"` });
                }
            }

            // Generate JavaScript constants
            let result = '';
            for (const pair of keyValuePairs) {
                // Format the value based on its type
                let formattedValue;
                if (typeof pair.value === 'string') {
                    if (pair.value.startsWith('[') || pair.value.startsWith('{')) {
                        // For arrays and objects, clean up any object wrapper pattern
                        const cleaned = cleanObjectValue(
                            pair.value
                                .replace(/\.\.\./g, '') // Remove ellipses
                                .replace(/,\s*\]/g, ']') // Fix trailing commas in arrays
                                .replace(/,\s*\}/g, '}'),
                        ); // Fix trailing commas in objects
                        formattedValue = cleaned;
                    } else {
                        formattedValue = `"${pair.value.replace(/"/g, '\\"')}"`;
                    }
                } else if (typeof pair.value === 'boolean' || typeof pair.value === 'number') {
                    formattedValue = pair.value;
                } else {
                    formattedValue = `"${pair.value}"`;
                }

                result += `const ${pair.key} = ${formattedValue};\n`;
            }

            return result;
        }

        // If regex approach fails, try manual extraction of variables
        if (outputContent.includes('variables:')) {
            // Try to find variables section and extract key-value pairs manually
            const variablesStartIndex = outputContent.indexOf('variables:');
            if (variablesStartIndex !== -1) {
                // Find the opening brace after "variables:"
                const openBraceIndex = outputContent.indexOf('{', variablesStartIndex);
                if (openBraceIndex !== -1) {
                    // Extract raw content between braces (may contain ellipses)
                    let depth = 1;
                    let endIndex = openBraceIndex + 1;

                    while (depth > 0 && endIndex < outputContent.length) {
                        if (outputContent[endIndex] === '{') {
                            depth++;
                        } else if (outputContent[endIndex] === '}') {
                            depth--;
                        }
                        endIndex++;
                    }

                    // Extract the variables content
                    const variablesRawContent = outputContent.substring(openBraceIndex + 1, endIndex - 1).trim();

                    // Split by commas, but be careful with nested objects and arrays
                    const entries = [];
                    let currentEntry = '';
                    let nestedLevel = 0;

                    for (let i = 0; i < variablesRawContent.length; i++) {
                        const char = variablesRawContent[i];

                        if (
                            (char === '{' || char === '[') &&
                            !currentEntry.includes('"') &&
                            !currentEntry.endsWith('\\')
                        ) {
                            nestedLevel++;
                        } else if (
                            (char === '}' || char === ']') &&
                            !currentEntry.includes('"') &&
                            !currentEntry.endsWith('\\')
                        ) {
                            nestedLevel--;
                        }

                        if (char === ',' && nestedLevel === 0) {
                            // End of an entry
                            if (currentEntry.trim()) {
                                entries.push(currentEntry.trim());
                            }
                            currentEntry = '';
                        } else {
                            currentEntry += char;
                        }
                    }

                    // Add the last entry
                    if (currentEntry.trim()) {
                        entries.push(currentEntry.trim());
                    }

                    // Process each entry to create constants
                    let result = '';
                    for (const entry of entries) {
                        // Skip entries with ellipses only
                        if (entry === '...' || entry === '... ...') {
                            continue;
                        }

                        // Find the key and value
                        const colonIndex = entry.indexOf(':');
                        if (colonIndex !== -1) {
                            const key = entry.substring(0, colonIndex).trim();
                            const value = entry.substring(colonIndex + 1).trim();

                            // Skip if key contains ellipses
                            if (key.includes('...')) {
                                continue;
                            }

                            // Format the value
                            let formattedValue;
                            if (value === 'true' || value === 'false') {
                                formattedValue = value; // Boolean
                            } else if (/^\d+$/.test(value)) {
                                formattedValue = value; // Number
                            } else if (value.startsWith('"') && value.endsWith('"')) {
                                formattedValue = value; // Already quoted string
                            } else if (value.startsWith('[') || value.startsWith('{')) {
                                // Clean up object format before displaying
                                const cleanedValue = cleanObjectValue(value);
                                formattedValue = cleanedValue;
                            } else {
                                // Unquoted string or unknown
                                formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                            }

                            result += `const ${key} = ${formattedValue};\n`;
                        }
                    }

                    if (result) {
                        return result;
                    }
                }
            }
        }

        // If all else fails, try the original method with modifications
        try {
            // Clean up the content more aggressively
            let cleanContent = outputContent
                .replace(/output\[/g, '[') // Remove "output" prefix
                .replace(/resolved\s+output\[/g, '[') // Remove "resolved output" prefix
                .replace(/\.\.\./g, '') // Remove all ellipses
                .replace(/\s+/g, ' ') // Normalize whitespace
                .replace(/,\s*[\]}]/g, '$&') // Remove trailing commas
                .replace(/(\w+):/g, '"$1":'); // Quote unquoted property names

            // Try to extract just a simple variable object
            const simpleVarMatch = /variables:\s*(\{[^}]+\})/.exec(cleanContent);
            if (simpleVarMatch && simpleVarMatch[1]) {
                cleanContent = simpleVarMatch[1];
            }

            // Try to parse as JSON
            const data = JSON.parse(cleanContent);

            // Extract variables
            let vars = null;
            if (Array.isArray(data)) {
                for (const item of data) {
                    if (item && item.variables) {
                        vars = item.variables;
                        break;
                    }
                }
            } else if (data && data.variables) {
                vars = data.variables;
            } else {
                vars = data; // Use the data directly as variables
            }

            if (!vars) {
                throw new Error('Could not extract variables');
            }

            // Generate constants
            let result = '';
            for (const key in vars) {
                if (Object.hasOwnProperty.call(vars, key)) {
                    let value = vars[key];

                    // Format value
                    let formattedValue;
                    if (typeof value === 'string') {
                        formattedValue = `"${value.replace(/"/g, '\\"')}"`;
                    } else if (typeof value === 'boolean' || typeof value === 'number') {
                        formattedValue = value;
                    } else if (value === null) {
                        formattedValue = 'null';
                    } else if (Array.isArray(value) || typeof value === 'object') {
                        formattedValue = JSON.stringify(value, null, 2);
                    } else {
                        formattedValue = `"${String(value).replace(/"/g, '\\"')}"`;
                    }

                    result += `const ${key} = ${formattedValue};\n`;
                }
            }

            if (result) {
                return result;
            }
        } catch (e) {
            console.error('Alternative parsing method failed:', e);
        }

        // Manual fallback - extract variable names and create placeholders
        const varMatches = outputContent.match(/(\w+):\s*("[^"]*"|true|false|\d+)/g);
        if (varMatches && varMatches.length > 0) {
            let result = '';
            for (const match of varMatches) {
                const parts = match.split(':');
                if (parts.length === 2) {
                    const key = parts[0].trim();
                    let value = parts[1].trim();

                    // Skip if key is not a valid variable name
                    if (!key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
                        continue;
                    }

                    result += `const ${key} = ${value};\n`;
                }
            }

            if (result) {
                return result;
            }
        }

        throw new Error('Could not extract variables in any supported format');
    } catch (error) {
        console.error('Error parsing output variables:', error);

        // Provide a fallback message with debugging info
        return (
            `// Error parsing output variables: ${error.message}\n// Original content:\n/*\n${outputContent}\n*/\n\n// Extracted manually from the content:\n` +
            extractSimpleKnownVariables(outputContent)
        );
    }
}

// Helper function to extract known variable patterns manually as a fallback
function extractSimpleKnownVariables(content) {
    let result = '';

    // Look for simple patterns like aString: "A simple string"
    const stringMatches = content.match(/(\w+):\s*"([^"]*)"/g);
    if (stringMatches) {
        for (const match of stringMatches) {
            const parts = match.split(/:\s*/);
            if (parts.length === 2) {
                const key = parts[0].trim();
                const value = parts[1].trim();

                // Skip if key doesn't look like a variable name
                if (!key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
                    continue;
                }

                result += `const ${key} = ${value};\n`;
            }
        }
    }

    // Look for boolean values like aBoolean: true
    const boolMatches = content.match(/(\w+):\s*(true|false)/g);
    if (boolMatches) {
        for (const match of boolMatches) {
            const parts = match.split(/:\s*/);
            if (parts.length === 2) {
                const key = parts[0].trim();
                const value = parts[1].trim();

                // Skip if key doesn't look like a variable name or is already added
                if (!key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) || result.includes(`const ${key} =`)) {
                    continue;
                }

                result += `const ${key} = ${value};\n`;
            }
        }
    }

    // Look for number values like aNumber: 123
    const numMatches = content.match(/(\w+):\s*(\d+)/g);
    if (numMatches) {
        for (const match of numMatches) {
            const parts = match.split(/:\s*/);
            if (parts.length === 2) {
                const key = parts[0].trim();
                const value = parts[1].trim();

                // Skip if key doesn't look like a variable name or is already added
                if (!key.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/) || result.includes(`const ${key} =`)) {
                    continue;
                }

                result += `const ${key} = ${value};\n`;
            }
        }
    }

    return result || '// Could not extract any variables from the content';
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

// Function to enhance the output component copy feature
function enhanceOutputCopyFeature() {
    // Check if we're on the right page
    const url = window.location.href;
    if (!url.includes('/appnavigator/index.html') && !url.includes('/portal.cgi?quantum')) {
        return;
    }

    console.log('Cloudflow page detected, enhancing output copy feature');

    // Function to enhance a copy button in the output component
    function enhanceOutputCopyButton(outputComponent, copyButton) {
        if (copyButton && !copyButton.dataset.enhancedOutputCopy) {
            console.log('Enhancing output copy button', copyButton);

            // Mark the button as enhanced
            copyButton.dataset.enhancedOutputCopy = 'true';

            // Create a wrapper for the click event
            const wrapper = function (e) {
                // Prevent the default copy behavior
                e.preventDefault();
                e.stopPropagation();

                // Find the content to copy
                // First, try to find a span with the copyVariables class
                let content = '';
                const copySpan = outputComponent.querySelector(
                    'span.copyVariables.copy-offscreen, span.copy-offscreen',
                );

                if (copySpan) {
                    content = copySpan.textContent || copySpan.innerText;
                } else {
                    // If no specific span is found, try to get content from the component itself
                    content = outputComponent.textContent || outputComponent.innerText;
                }

                if (content) {
                    // Convert to JavaScript constants
                    const jsConstants = convertOutputVariablesToConstants(content);

                    // Copy to clipboard
                    navigator.clipboard
                        .writeText(jsConstants)
                        .then(() => {
                            console.log('Output variables copied as JS constants');

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
                                console.log('Output variables copied as JS constants (fallback)');

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
                    console.error('Output component content not found');
                }

                return false;
            };

            // Use the capture phase to intercept the click before the original handler
            copyButton.addEventListener('click', wrapper, true);
        }
    }

    // Watch for the output component and copy button
    const observer = new MutationObserver((mutations) => {
        const outputComponent = document.querySelector('.output_component.debug_component.notranslate');

        if (outputComponent) {
            // Find the copy button (similar to the variables component)
            const copyButton = outputComponent.querySelector('.debugpanel_CopyText.fa.fa-copy');
            enhanceOutputCopyButton(outputComponent, copyButton);
        }
    });

    // Check immediately in case the elements are already in the DOM
    const outputComponent = document.querySelector('.output_component.debug_component.notranslate');

    if (outputComponent) {
        const copyButton = outputComponent.querySelector('.debugpanel_CopyText.fa.fa-copy');
        enhanceOutputCopyButton(outputComponent, copyButton);
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

// Function to copy output variables to clipboard when triggered by popup
function copyOutputVariablesToClipboard() {
    return new Promise((resolve, reject) => {
        try {
            // Check if we're on the right page
            const url = window.location.href;
            if (!url.includes('/appnavigator/index.html') && !url.includes('/portal.cgi?quantum')) {
                reject(new Error('Not on a Cloudflow page'));
                return;
            }

            // Find the output component
            const outputComponent = document.querySelector('.output_component.debug_component.notranslate');

            if (!outputComponent) {
                reject(new Error('Output component not found'));
                return;
            }

            // Find the content to copy
            let content = '';
            const copySpan = outputComponent.querySelector('span.copyVariables.copy-offscreen, span.copy-offscreen');

            if (copySpan) {
                content = copySpan.textContent || copySpan.innerText;
            } else {
                // If no specific span is found, try to get content from the component itself
                content = outputComponent.textContent || outputComponent.innerText;
            }

            if (!content) {
                reject(new Error('Output content not found'));
                return;
            }

            // Convert to JavaScript constants
            const jsConstants = convertOutputVariablesToConstants(content);

            // Copy to clipboard
            const clipboard = navigator.clipboard;
            if (clipboard) {
                clipboard
                    .writeText(jsConstants)
                    .then(() => {
                        console.log('Output variables copied as JS constants');
                        resolve(true);
                    })
                    .catch((err) => {
                        console.error('Failed to copy using Clipboard API:', err);
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
                                console.log('Output variables copied as JS constants (fallback)');
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
                        console.log('Output variables copied as JS constants (fallback)');
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

// Helper function to clean and format object values by removing extra object wrappers
function cleanObjectValue(value) {
    if (typeof value !== 'string') {
        return value;
    }

    // Remove "{ object: {" wrapper pattern and fix closing braces
    if (value.startsWith('{') && value.includes('object:')) {
        // Match the pattern { object: { ... } or { object: { ... }}
        const objectWrapperRegex = /^\{\s*object:\s*\{(.*?)(\}\}?|\})\s*$/s;
        const match = objectWrapperRegex.exec(value);

        if (match) {
            // Extract the inner object content and ensure it has proper closing brace
            let innerContent = match[1].trim();
            // Count opening and closing braces to ensure balance
            const openBraces = (innerContent.match(/\{/g) || []).length;
            const closeBraces = (innerContent.match(/\}/g) || []).length;

            if (openBraces > closeBraces) {
                // Add missing closing braces
                innerContent += '}';
            }

            return `{${innerContent}}`;
        }
    }

    // Check for cases where it's just {object: somethingelse}
    if (value.startsWith('{') && value.includes('object:')) {
        const simpleObjectRegex = /^\{\s*object:\s*([^{].*?)\}\s*$/s;
        const match = simpleObjectRegex.exec(value);

        if (match) {
            return match[1].trim();
        }
    }

    return value;
}

// Wait for page to be fully loaded
window.addEventListener('load', () => {
    // Uncomment to inject UI elements
    // injectUI();

    // Enhance the copy feature on Cloudflow pages
    enhanceCopyFeature();
    enhanceOutputCopyFeature();
});
