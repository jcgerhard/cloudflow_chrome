// Cookie utility functions for Cloudflow Companion

/**
 * Reads the cookie from the selected Cloudflow instance and extracts session information
 *
 * @param {string} url - URL of the selected Cloudflow instance
 * @returns {Promise<string>} - Session ID created by concatenating user_id, user_hash, and expiration_date
 */
async function getSessionIdFromCookie(url) {
    try {
        // Parse the domain from the URL
        const domain = new URL(url).hostname;

        // Get all cookies for the domain
        const cookies = await chrome.cookies.getAll({ domain });

        console.log('Found cookies for domain:', domain, cookies);

        // Look for the relevant cookies
        // Common cookie name patterns for Cloudflow
        const userIdPatterns = ['user_id', 'cloudflow_user_id', 'cf_user_id'];
        const userHashPatterns = ['user_hash', 'cloudflow_hash', 'cf_hash'];
        const expirationPatterns = ['expiration_date', 'expires', 'cf_expiration'];

        let userId = '';
        let userHash = '';
        let expirationDate = '';

        // Extract data from cookies using patterns
        for (const cookie of cookies) {
            // Check for user ID
            if (userIdPatterns.some((pattern) => cookie.name.toLowerCase().includes(pattern))) {
                userId = cookie.value;
                console.log('Found user ID cookie:', cookie.name, userId);
            }
            // Check for user hash
            else if (userHashPatterns.some((pattern) => cookie.name.toLowerCase().includes(pattern))) {
                userHash = cookie.value;
                console.log('Found user hash cookie:', cookie.name, userHash);
            }
            // Check for expiration
            else if (expirationPatterns.some((pattern) => cookie.name.toLowerCase().includes(pattern))) {
                expirationDate = cookie.value;
                console.log('Found expiration cookie:', cookie.name, expirationDate);
            }
        }

        // If we couldn't find the cookies with patterns, try to use any that might contain relevant data
        if (!userId || !userHash || !expirationDate) {
            console.log('Could not find all required cookies using patterns, trying to make educated guesses...');

            // Log all cookies for debugging
            cookies.forEach((cookie) => {
                console.log(`Cookie: ${cookie.name} = ${cookie.value}`);
            });

            // If still no userId found, try to look for anything that might contain it
            if (!userId) {
                const possibleUserIdCookie = cookies.find(
                    (c) => c.name.toLowerCase().includes('user') || c.name.toLowerCase().includes('id'),
                );
                if (possibleUserIdCookie) {
                    userId = possibleUserIdCookie.value;
                    console.log('Used best guess for user ID:', possibleUserIdCookie.name, userId);
                }
            }

            // If still no userHash found, try to find something that looks like a hash
            if (!userHash) {
                const possibleHashCookie = cookies.find(
                    (c) =>
                        c.name.toLowerCase().includes('hash') ||
                        c.name.toLowerCase().includes('token') ||
                        c.name.toLowerCase().includes('auth'),
                );
                if (possibleHashCookie) {
                    userHash = possibleHashCookie.value;
                    console.log('Used best guess for user hash:', possibleHashCookie.name, userHash);
                }
            }

            // If still no expiration found, try to use the cookie's own expiration
            if (!expirationDate && cookies.length > 0) {
                const cookieWithExpiry = cookies.find((c) => c.expirationDate);
                if (cookieWithExpiry) {
                    expirationDate = cookieWithExpiry.expirationDate.toString();
                    console.log('Used cookie expiration date as fallback:', expirationDate);
                }
            }
        }

        // Create and return the session ID
        const sessionId = `${userId}${userHash}${expirationDate}`;
        console.log('Generated session ID:', sessionId);
        return sessionId;
    } catch (error) {
        console.error('Error getting session ID from cookie:', error);
        return '';
    }
}

// Export the function
export { getSessionIdFromCookie };
