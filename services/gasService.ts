import { GOOGLE_APPS_SCRIPT_URL } from './googleApiCredentials';

export interface GasApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

/**
 * Calls a function in the Google Apps Script backend.
 * This version includes 'redirect: follow' to handle Google's 302 redirects,
 * which are a common cause of 'Failed to fetch' errors with Apps Script.
 * @param action The name of the function to call in the Apps Script.
 * @param params The parameters to pass to the function.
 * @returns A promise that resolves to the response from the Apps Script.
 */
export const callGasApi = async (action: string, params?: any): Promise<GasApiResponse> => {
    if (!GOOGLE_APPS_SCRIPT_URL) {
        const errorMessage = "Google Apps Script URL is not configured. Please check services/googleApiCredentials.ts";
        console.error(errorMessage);
        return { success: false, error: errorMessage };
    }

    try {
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            // Use 'text/plain' to avoid the CORS preflight 'OPTIONS' request.
            headers: {
                'Content-Type': 'text/plain;charset=utf-8',
            },
            body: JSON.stringify({ action, params }),
            // CRITICAL: Handle Google Apps Script's redirects. This is often the cause of "Failed to fetch".
            redirect: 'follow',
        });

        if (!response.ok) {
            const errorText = await response.text();
            let specificError = `HTTP error! Status: ${response.status}. Message: ${errorText}`;
            if (response.status === 401 || response.status === 403) {
                 specificError = "Authorization error. Please ensure your Google Apps Script is deployed with 'Who has access' set to 'Anyone'.";
            }
            throw new Error(specificError);
        }

        const result: GasApiResponse = await response.json();
        return result;

    } catch (error: any) {
        console.error(`Error calling Google Apps Script action "${action}":`, error);
        
        let errorMessage = `Failed to communicate with the server: ${error.message}`;
        if (error.message.includes('Failed to fetch')) {
             errorMessage = "Connection to the backend failed. This is often due to a network issue or incorrect Google Apps Script deployment permissions. Please verify your script is deployed for 'Anyone' to access.";
        }
        
        return { success: false, error: errorMessage };
    }
};