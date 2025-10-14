// This service sends data to a Google Apps Script web app for exporting to Google Sheets.
import type { MultiSheetExportPayload } from '../types';
import { GOOGLE_APPS_SCRIPT_URL } from './googleApiCredentials';

interface GoogleApiResult {
    success: boolean;
    message: string;
    sheetUrl?: string;
}

/**
 * A wrapper for fetch that includes a retry mechanism with exponential backoff.
 * @param url The URL to fetch.
 * @param options The fetch options.
 * @param retries The number of retry attempts.
 * @param initialDelay The initial delay between retries in milliseconds.
 * @returns A promise that resolves to the fetch Response.
 */
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3, initialDelay = 1000): Promise<Response> => {
    let delay = initialDelay;
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            // Only retry on transient server errors (5xx) or network failures.
            // Client errors (4xx) are unlikely to succeed on retry and should fail immediately.
            if (response.ok || response.status < 500) {
                return response;
            }
            console.warn(`Attempt ${i + 1} failed with status ${response.status}. Retrying in ${delay / 1000}s...`);
        } catch (error) {
            // This catches network errors like "Failed to fetch"
            if (i === retries - 1) throw error; // Rethrow the last error if all retries fail
            console.warn(`Attempt ${i + 1} failed with a network error. Retrying in ${delay / 1000}s...`);
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
    }
    // If all retries fail, throw a final, user-friendly error.
    throw new Error(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้หลังจากการพยายาม ${retries} ครั้ง`);
};

/**
 * Sends data to a Google Apps Script web app to create a Google Sheet.
 * @param payload The data to be exported, containing one or more sheets.
 * @returns A promise that resolves to a result object from the API.
 */
export const exportToGoogleSheets = async (payload: MultiSheetExportPayload): Promise<GoogleApiResult> => {
    if (!GOOGLE_APPS_SCRIPT_URL) {
        const errorMessage = "Google Apps Script URL is not configured. Please update it in services/googleApiCredentials.ts";
        console.error(errorMessage);
        return {
            success: false,
            message: errorMessage
        };
    }

    try {
        const response = await fetchWithRetry(GOOGLE_APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                // Sending as a raw JSON payload. The Apps Script backend is expected
                // to parse this from the `e.postData.contents` property of the event object.
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            redirect: 'follow', // This is often required for Apps Script web apps.
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = `HTTP error! Status: ${response.status}. Message: ${errorText || 'No details from server.'}`;
            if (response.status >= 500) {
                errorMessage = `เกิดข้อผิดพลาดบนเซิร์ฟเวอร์ (Status: ${response.status}). กรุณาลองอีกครั้งในภายหลัง`;
            } else if (response.status === 401 || response.status === 403) {
                errorMessage = `ไม่ได้รับอนุญาตให้เข้าถึงบริการส่งออกข้อมูล`;
            } else if (response.status >= 400) {
                errorMessage = `คำขอไม่ถูกต้อง (Status: ${response.status}). กรุณาตรวจสอบข้อมูลที่ส่ง`;
            }
            throw new Error(errorMessage);
        }

        const result: GoogleApiResult = await response.json();
        return result;

    } catch (error: any) {
        console.error("Error exporting to Google Sheets:", error);
        return {
            success: false,
            message: `เกิดข้อผิดพลาดในการส่งออก: ${error.message || "An unknown error occurred."}`
        };
    }
};