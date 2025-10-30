import React from 'react';
import type { Page } from './types';
import { DashboardIcon, BookingsIcon, FinanceIcon, ReportsIcon, UserIcon } from './components/icons/Icons';

export const NAV_ITEMS: { name: Page; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'ภาพรวม', icon: DashboardIcon },
  { name: 'การดำเนินงาน', icon: BookingsIcon },
  { name: 'การเงิน', icon: FinanceIcon },
  { name: 'ข้อมูลบุคคล', icon: UserIcon },
  { name: 'เอกสารและส่งออก', icon: ReportsIcon },
];
