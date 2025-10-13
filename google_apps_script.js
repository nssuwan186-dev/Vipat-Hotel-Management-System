const SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1-aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPq/edit?usp=sharing";
const ss = SpreadsheetApp.openByUrl(SPREADSHEET_URL);

// Sheet Names
const ROOMS_SHEET = "Rooms";
const GUESTS_SHEET = "Guests";
const BOOKINGS_SHEET = "Bookings";
const EXPENSES_SHEET = "Expenses";
const EMPLOYEES_SHEET = "Employees";
const ATTENDANCE_SHEET = "Attendance";
const TENANTS_SHEET = "Tenants";
const INVOICES_SHEET = "Invoices";
const TASKS_SHEET = "Tasks";

// Main entry points for the web app
function doGet(e) {
  const action = e.parameter.action;
  let sheetName;

  switch (action) {
    case 'getRooms':
      sheetName = ROOMS_SHEET;
      break;
    case 'getGuests':
      sheetName = GUESTS_SHEET;
      break;
    case 'getBookings':
      sheetName = BOOKINGS_SHEET;
      break;
    case 'getExpenses':
      sheetName = EXPENSES_SHEET;
      break;
    case 'getEmployees':
        sheetName = EMPLOYEES_SHEET;
        break;
    case 'getAttendance':
        sheetName = ATTENDANCE_SHEET;
        break;
    case 'getTenants':
        sheetName = TENANTS_SHEET;
        break;
    case 'getInvoices':
        sheetName = INVOICES_SHEET;
        break;
    case 'getTasks':
        sheetName = TASKS_SHEET;
        break;
    default:
      return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Invalid action' })).setMimeType(ContentService.MimeType.JSON);
  }

  const data = getData(sheetName);
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action;
  const data = JSON.parse(e.postData.contents);
  let result;

  switch (action) {
    case 'addRoom':
      result = addData(ROOMS_SHEET, data);
      break;
    case 'updateRoom':
        result = updateData(ROOMS_SHEET, data);
        break;
    case 'deleteRoom':
        result = deleteData(ROOMS_SHEET, data.id);
        break;
    case 'addGuest':
        result = addData(GUESTS_SHEET, data);
        break;
    case 'updateGuest':
        result = updateData(GUESTS_SHEET, data);
        break;
    case 'deleteGuest':
        result = deleteData(GUESTS_SHEET, data.id);
        break;
    case 'addBooking':
        result = addData(BOOKINGS_SHEET, data);
        break;
    case 'updateBooking':
        result = updateData(BOOKINGS_SHEET, data);
        break;
    case 'deleteBooking':
        result = deleteData(BOOKINGS_SHEET, data.id);
        break;
    case 'addExpense':
        result = addData(EXPENSES_SHEET, data);
        break;
    case 'updateExpense':
        result = updateData(EXPENSES_SHEET, data);
        break;
    case 'deleteExpense':
        result = deleteData(EXPENSES_SHEET, data.id);
        break;
    case 'addEmployee':
        result = addData(EMPLOYEES_SHEET, data);
        break;
    case 'updateEmployee':
        result = updateData(EMPLOYEES_SHEET, data);
        break;
    case 'deleteEmployee':
        result = deleteData(EMPLOYEES_SHEET, data.id);
        break;
    case 'addTenant':
        result = addData(TENANTS_SHEET, data);
        break;
    case 'updateTenant':
        result = updateData(TENANTS_SHEET, data);
        break;
    case 'deleteTenant':
        result = deleteData(TENANTS_SHEET, data.id);
        break;
    case 'addInvoice':
        result = addData(INVOICES_SHEET, data);
        break;
    case 'updateInvoice':
        result = updateData(INVOICES_SHEET, data);
        break;
    case 'deleteInvoice':
        result = deleteData(INVOICES_SHEET, data.id);
        break;
    case 'addTask':
        result = addData(TASKS_SHEET, data);
        break;
    case 'updateTask':
        result = updateData(TASKS_SHEET, data);
        break;
    case 'deleteTask':
        result = deleteData(TASKS_SHEET, data.id);
        break;
    default:
      result = { success: false, message: 'Invalid action' };
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// Helper functions for CRUD operations
function getData(sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data.shift();
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });
}

function addData(sheetName, data) {
    try {
        const sheet = ss.getSheetByName(sheetName);
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const newRow = headers.map(header => data[header] || "");
        sheet.appendRow(newRow);
        return { success: true, message: 'Data added successfully' };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

function updateData(sheetName, data) {
    try {
        const sheet = ss.getSheetByName(sheetName);
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const idIndex = headers.indexOf('id');
        if (idIndex === -1) {
            return { success: false, message: 'Sheet must have an "id" column' };
        }

        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        const rowIndex = values.findIndex(row => row[idIndex] === data.id);

        if (rowIndex === -1) {
            return { success: false, message: 'Record not found' };
        }

        const newRow = headers.map(header => data[header] || values[rowIndex][headers.indexOf(header)]);
        sheet.getRange(rowIndex + 1, 1, 1, newRow.length).setValues([newRow]);

        return { success: true, message: 'Data updated successfully' };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

function deleteData(sheetName, id) {
    try {
        const sheet = ss.getSheetByName(sheetName);
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const idIndex = headers.indexOf('id');
        if (idIndex === -1) {
            return { success: false, message: 'Sheet must have an "id" column' };
        }

        const dataRange = sheet.getDataRange();
        const values = dataRange.getValues();
        const rowIndex = values.findIndex(row => row[idIndex] === id);

        if (rowIndex === -1) {
            return { success: false, message: 'Record not found' };
        }

        sheet.deleteRow(rowIndex + 1);
        return { success: true, message: 'Data deleted successfully' };
    } catch (e) {
        return { success: false, message: e.message };
    }
}
