# Cloudflow Chrome Extension

A Chrome extension for enhancing your cloud workflow management and productivity.

## Features

- **Cloud Service Integration**: Quick access to your favorite cloud services and platforms
- **Status Monitoring**: Monitor the status of your cloud resources and services
- **Customizable Interface**: Configure the extension to match your workflow needs
- **Cross-Platform Synchronization**: Sync your settings across different devices
- **Theme Support**: Choose between light, dark, and system default themes

## Installation

### From Chrome Web Store

1. Visit the Chrome Web Store (link to be added when published)
2. Click "Add to Chrome"
3. Confirm the installation when prompted
4. The extension will be available in your browser toolbar

### Manual Installation (Development)

1. Clone this repository or download the source code

   ```bash
   git clone https://github.com/yourusername/cloudflow_chrome.git
   ```

2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Click "Load unpacked" and select the extension directory
5. The extension should now be installed and visible in your browser toolbar

## Usage

### Basic Usage

1. Click the Cloudflow icon in your browser toolbar to open the popup
2. Use the toggle switch to enable/disable the extension
3. Click the "Options" button to access more configuration settings

### Options Page

Access the options page to configure:

- Theme preferences
- Notification settings
- Data retention policies
- Other advanced settings

## Development

### Project Structure

```bash
cloudflow_chrome/
├── manifest.json           # Extension configuration
├── service-worker.js       # Background service worker
├── content_scripts/
│   └── content.js          # Content script injected into web pages
├── popup/
│   ├── popup.html          # Popup UI structure
│   ├── popup.js            # Popup functionality
│   └── popup.css           # Popup styling
├── options/
│   ├── options.html        # Options page structure
│   ├── options.js          # Options page functionality
│   └── options.css         # Options page styling
├── images/                 # Extension icons
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-128.png
│   └── icon.svg
├── _locales/               # Internationalization
│   └── en/
│       └── messages.json
├── test-page.html          # HTML page for testing the extension
└── test-helper.js          # Helper script for extension testing
```

### Building for Production

1. Make your changes to the source code
2. Test thoroughly using the test-page.html or by loading as an unpacked extension
3. Create a production build by zipping the extension directory:

   ```bash
   cd /path/to/cloudflow_chrome
   zip -r cloudflow.zip . -x "*.git*" -x "temp/*"
   ```

4. Submit the zip file to the Chrome Web Store Developer Dashboard

### Testing

You can use the included test page to verify functionality:

1. Open the `test-page.html` file in Chrome with the extension loaded
2. Use the test panel to check communication between the page and the extension
3. Verify that all features are working as expected

### Internationalization

The extension supports multiple languages through Chrome's i18n API. To add a new language:

1. Create a new directory under `_locales` with the appropriate language code
2. Copy the `messages.json` file from the `en` directory
3. Translate the message strings to the target language
4. The extension will automatically use the appropriate language based on the user's browser settings

## Troubleshooting

- **Extension not appearing in toolbar**: Make sure it's enabled in `chrome://extensions/`
- **Features not working**: Check the browser console for error messages
- **Settings not saving**: Verify that the storage permission is granted

## License

[MIT License](LICENSE)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

© 2025 Cloudflow. All rights reserved.
