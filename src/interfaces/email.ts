export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export interface ExpenseNotificationData {
  expenseId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  actionDate: Date;
  expenseData: {
    id: string;
    amount: number;
    dateProduced: Date;
    categoryId: string;
    categoryName?: string;
    userId: string;
    companyId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  userEmail: string;
  companyName?: string;
}

export interface NotificationMessage {
  type: 'EXPENSE_NOTIFICATION';
  data: ExpenseNotificationData;
} 