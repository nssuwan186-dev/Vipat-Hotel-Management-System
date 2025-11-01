import type { GasApiResponse } from './gasService';
import { callGasApi } from './gasService';
import type { SheetData } from '../types';

interface ExportParams {
    spreadsheetName: string;
    sheets: SheetData[];
}

export interface ExportResult {
    sheetUrl: string;
}

export const exportToGoogleSheets = async (params: ExportParams): Promise<GasApiResponse<ExportResult>> => {
    // Serialize Dates to ISO strings before sending to the backend.
    const serializableParams = {
        ...params,
        sheets: params.sheets.map(sheet => ({
            ...sheet,
            data: sheet.data.map(row => row.map(cell => (cell instanceof Date ? cell.toISOString().split('T')[0] : cell)))
        }))
    };
    return await callGasApi('exportDataToNewSheet', serializableParams);
};
