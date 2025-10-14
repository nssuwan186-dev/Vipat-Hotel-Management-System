// FIX: Import React to provide types for React.FC and React.SVGProps.
import React from 'react';
import type { Page } from './types';
import { DashboardIcon, BookingsIcon, FinanceIcon, ReportsIcon, DataManagementIcon, UserIcon, MicrophoneIcon } from './components/icons/Icons';

export const NAV_ITEMS: { name: Page; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'ภาพรวม', icon: DashboardIcon },
  { name: 'การดำเนินงาน', icon: BookingsIcon },
  { name: 'การเงิน', icon: FinanceIcon },
  { name: 'ลูกค้า', icon: UserIcon },
  { name: 'Live Chat', icon: MicrophoneIcon },
  { name: 'เอกสารและรายงาน', icon: ReportsIcon },
  { name: 'การจัดการข้อมูล', icon: DataManagementIcon },
];