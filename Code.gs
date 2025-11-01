const APP_NAME = "ระบบจัดการโรงแรม Vipat";

function doGet(e) {
  // Serve the HTML file from another file in the project.
  // The 'index.html' file will be created in a later step and will contain the inlined React app.
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle(APP_NAME)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function doPost(e) {
    try {
        if (!e.parameter || !e.parameter.payload) {
            throw new Error("Invalid request: 'payload' parameter is missing.");
        }

        const payload = JSON.parse(e.parameter.payload);

        if (!payload || !payload.sheets || !Array.isArray(payload.sheets) || payload.sheets.length === 0) {
            throw new Error("Invalid payload: 'sheets' array is missing or empty.");
        }

        const spreadsheet = SpreadsheetApp.create(`${APP_NAME} - Export (${new Date().toLocaleString()})`);

        // Remove the default "Sheet1"
        const defaultSheet = spreadsheet.getSheetByName('Sheet1');
        if (defaultSheet) {
            spreadsheet.deleteSheet(defaultSheet);
        }

        payload.sheets.forEach(sheetData => {
            if (!sheetData.sheetTitle || !sheetData.headers || !sheetData.rows) {
                // Skip invalid sheet data, or handle error more gracefully
                console.warn("Skipping invalid sheet data:", sheetData);
                return;
            }

            const sheet = spreadsheet.insertSheet(sheetData.sheetTitle);

            // Add headers
            sheet.getRange(1, 1, 1, sheetData.headers.length).setValues([sheetData.headers]);

            // Add data rows if any exist
            if (sheetData.rows.length > 0) {
                sheet.getRange(2, 1, sheetData.rows.length, sheetData.rows[0].length).setValues(sheetData.rows);
            }

            // Auto-resize columns for better readability
            sheet.autoResizeColumns(1, sheetData.headers.length);
        });

        const response = {
            success: true,
            message: "Export successful!",
            sheetUrl: spreadsheet.getUrl()
        };

        return ContentService.createTextOutput(JSON.stringify(response))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        console.error("Error in doPost:", error);

        const errorResponse = {
            success: false,
            message: error.message || "An unknown error occurred on the server."
        };

        return ContentService.createTextOutput(JSON.stringify(errorResponse))
            .setMimeType(ContentService.MimeType.JSON);
    }
}
