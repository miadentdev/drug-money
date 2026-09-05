export interface Budget {
  id: string;
  name: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetTransaction {
  id: string;
  budgetId: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  note?: string;
  createdAt: string;
}

export interface BudgetSummary extends Budget {
  transactionCount: number;
}
