# Google Sheets Database

This file contains the details of the Google Sheet used as the database for the Hotel Management System.

**Google Sheet URL:** `https://docs.google.com/spreadsheets/d/1-aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJkLmNoPq/edit?usp=sharing` (This is a placeholder URL)

## Sheet Structure

The Google Sheet contains the following sheets, with the specified columns:

### Rooms
- `id` (string)
- `number` (string)
- `type` (string: 'Single', 'Double', 'Suite')
- `price` (number)
- `status` (string: 'Available', 'Occupied', 'Under Maintenance', 'Monthly Rental')

### Guests
- `id` (string)
- `name` (string)
- `phone` (string)
- `history` (string: comma-separated list of booking IDs)

### Bookings
- `id` (string)
- `guestId` (string)
- `roomId` (string)
- `checkInDate` (date)
- `checkOutDate` (date)
- `status` (string: 'Confirmed', 'Check-In', 'Check-Out', 'Cancelled')
- `totalPrice` (number)

### Expenses
- `id` (string)
- `date` (date)
- `category` (string: 'Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Marketing', 'Other')
- `description` (string)
- `amount` (number)

### Employees
- `id` (string)
- `name` (string)
- `position` (string: 'Manager', 'Receptionist', 'Housekeeping', 'Maintenance')
- `hireDate` (date)
- `status` (string: 'Active', 'Inactive')
- `salaryType` (string: 'Monthly', 'Daily')
- `salaryRate` (number)
- `terminationDate` (date, optional)

### Attendance
- `id` (string)
- `employeeId` (string)
- `date` (date)
- `status` (string: 'Present', 'Absent', 'Leave')

### Tenants
- `id` (string)
- `name` (string)
- `phone` (string)
- `roomId` (string)
- `contractStartDate` (date)
- `contractEndDate` (date)
- `monthlyRent` (number)

### Invoices
- `id` (string)
- `tenantId` (string)
- `issueDate` (date)
- `dueDate` (date)
- `period` (string)
- `amount` (number)
- `status` (string: 'Unpaid', 'Paid')

### Tasks
- `id` (string)
- `description` (string)
- `status` (string: 'To Do', 'In Progress', 'Done')
- `assignedTo` (string, employeeId)
- `relatedTo` (string, e.g., roomId or bookingId)
- `createdAt` (date)
- `dueDate` (date, optional)
