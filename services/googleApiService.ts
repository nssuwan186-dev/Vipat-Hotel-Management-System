// Fix: Replaced server-side Google Apps Script code with a client-side fetch implementation.
// This resolves module import errors and type-checking failures by making this file a valid TypeScript module.
import type { MultiSheetExportPayload } from '../types';
import { GOOGLE_APPS_SCRIPT_URL } from './googleApiCredentials';

interface GoogleApiResult {
    success: boolean;
    message: string;
    sheetUrl?: string;
}

/**
 * Sends data to a Google Apps Script web app to create a Google Sheet.
 * @param payload The data to be exported, containing one or more sheets.
 * @returns A promise that resolves to a result object from the API.
 */
export const exportToGoogleSheets = async (payload: MultiSheetExportPayload): Promise<GoogleApiResult> => {
    // Fix: Removed check against a placeholder URL. The comparison always evaluates to false
    // because GOOGLE_APPS_SCRIPT_URL is a constant with a specific, non-placeholder value,
    // which causes a TypeScript type error.
    if (!GOOGLE_APPS_SCRIPT_URL) {
        const errorMessage = "Google Apps Script URL is not configured. Please update it in services/googleApiCredentials.ts";
        console.error(errorMessage);
        return {
            success: false,
            message: errorMessage
        };
    }

    try {
        // Google Apps Script doPost(e) expects parameters in e.parameter.
        // For a POST request, this is typically from a URL-encoded form body.
        const body = new URLSearchParams();
        body.append('payload', JSON.stringify(payload));

        // Note: Google Apps Script web apps can be tricky with CORS and redirects.
        // This implementation assumes the script is deployed to be accessible by "Anyone"
        // and correctly returns a JSON response without redirects for POST requests.
        const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            body: body,
        });

        if (!response.ok) {
            // Try to get more specific error text from the response body if available
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const result: GoogleApiResult = await response.json();
        return result;

    } catch (error: any) {
        console.error("Error exporting to Google Sheets:", error);
        return {
            success: false,
            message: error.message || "An unknown error occurred during the export process."
        };
    }
};
