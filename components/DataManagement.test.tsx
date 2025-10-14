import { render, screen, fireEvent } from '@testing-library/react';
import DataManagement from './DataManagement';
import { vi } from 'vitest';

vi.mock('./DataFormModal', () => ({
  __esModule: true,
  default: ({ isOpen, title }: { isOpen: boolean; title: string }) =>
    isOpen ? <div>{title}</div> : null,
}));

vi.mock('./ConfirmationDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm }: { isOpen: boolean; onConfirm: () => void }) =>
    isOpen ? <button onClick={onConfirm}>Confirm Delete</button> : null,
}));

const mockGuests = [{ id: 'g1', name: 'John Doe', phone: '123', history: [] }];
const mockRooms = [{ id: 'r1', number: '101', type: 'Standard', price: 100, status: 'Available' }];

const mockProps = {
  guests: mockGuests,
  rooms: mockRooms,
  tenants: [],
  employees: [],
  bookings: [],
  addGuest: vi.fn(),
  updateGuest: vi.fn(),
  deleteGuest: vi.fn(),
  addRoom: vi.fn(),
  updateRoom: vi.fn(),
  deleteRoom: vi.fn(),
  addTenant: vi.fn(),
  updateTenant: vi.fn(),
  deleteTenant: vi.fn(),
  addEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  deleteEmployee: vi.fn(),
};

describe('DataManagement Component', () => {
  beforeEach(() => {
    render(<DataManagement {...mockProps} />);
  });

  it('should render the guest tab by default and display guest data', () => {
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should switch tabs when a tab is clicked', () => {
    fireEvent.click(screen.getByText('ข้อมูลห้องพัก'));
    expect(screen.getByText('101')).toBeInTheDocument();
  });

  it('should open the add modal when the add button is clicked', () => {
    fireEvent.click(screen.getByText('+ เพิ่มผู้เข้าพักใหม่'));
    expect(screen.getByText('เพิ่มผู้เข้าพักใหม่')).toBeInTheDocument();
  });

  it('should open the edit modal when the edit button is clicked', () => {
    fireEvent.click(screen.getByText('แก้ไข'));
    expect(screen.getByText('แก้ไขข้อมูลผู้เข้าพัก')).toBeInTheDocument();
  });

  it('should open the delete confirmation when the delete button is clicked', () => {
    fireEvent.click(screen.getAllByText('ลบ')[0]);
    expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
  });

  it('should call the delete function on confirmation', () => {
    fireEvent.click(screen.getAllByText('ลบ')[0]);
    fireEvent.click(screen.getByText('Confirm Delete'));
    expect(mockProps.deleteGuest).toHaveBeenCalledWith('g1');
  });
});
