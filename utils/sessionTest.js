// Test session utility for testing cookie retrieval and session ID generation
import { getSessionIdFromCookie } from './cookieUtils.js';

/**
 * A utility function to test cookie access and session ID generation
 * This can be called directly from the console or other parts of the extension
 *
 * @param {string} url - The URL of the Cloudflow instance to check cookies for
 * @returns {Promise<string>} - The generated session ID
 */
async function testSessionId(url) {
    console.log('Testing session ID generation for URL:', url);

    try {
        // Get and return the session ID
        const sessionId = await getSessionIdFromCookie(url);
        console.log('Test completed successfully. Session ID:', sessionId);
        return sessionId;
    } catch (error) {
        console.error('Test failed with error:', error);
        return '';
    }
}

// Export the test function
export { testSessionId };
