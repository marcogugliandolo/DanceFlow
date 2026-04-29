export type ClassStatus = 'held' | 'cancelled_billed' | 'cancelled_unbilled';

export interface Activity {
  id: string;
  name: string; // e.g., 'Latinos'
  location: string; // e.g., 'Gimnasio Centro'
  pricePerClass: number; // e.g., 25.50
  paymentType?: 'fixed' | 'monthly';
  isRecurring?: boolean;
}

export interface ClassSession {
  id: string;
  activityId: string;
  date: string; // YYYY-MM-DD
  status: ClassStatus;
  justification?: string; // Reason for cancellation
  attendeesCount?: number; // Number of people who attended
}

export interface SummaryStats {
  totalHeld: number;
  totalCancelled: number;
  totalBilled: number; // held + cancelled_billed
  totalRevenue: number;
  totalAttendees: number;
  activities: Record<string, ActivityStats>;
}

export interface ActivityStats {
  heldCount: number;
  cancelledBilledCount: number;
  cancelledUnbilledCount: number;
  totalRevenue: number;
  totalAttendees: number;
  justifications: string[];
}
