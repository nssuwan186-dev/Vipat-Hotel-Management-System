import type { Page } from './types';
import { DashboardIcon, BookingsIcon, FinanceIcon, DataManagementIcon, ReportsIcon, TasksIcon } from './components/icons/Icons';

export const NAV_ITEMS: { name: Page; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'ภาพรวม', icon: DashboardIcon },
  { name: 'การจอง', icon: BookingsIcon },
  { name: 'การเงิน', icon: FinanceIcon },
  { name: 'จัดการข้อมูล', icon: DataManagementIcon },
  { name: 'เอกสารและรายงาน', icon: ReportsIcon },
  { name: 'การจัดการงาน', icon: TasksIcon },
];