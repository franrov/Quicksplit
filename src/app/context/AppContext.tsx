import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
export type SplitStatus = 'pending' | 'settled' | 'paid';

export interface Participant {
  id: string;
  name: string;
  status: SplitStatus;
  amount: number;
}

export interface Split {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  status: SplitStatus;
  participants: Participant[];
  payerId: string;
  payerName: string;
  pendingCount: number;
}

export interface HouseholdExpense {
  id: string;
  title: string;
  amount: number;
  status: SplitStatus;
  paidBy?: string;
}

interface AppContextType {
  balances: {
    youOwe: number;
    youAreOwed: number;
  };
  recentSplits: Split[];
  householdExpenses: HouseholdExpense[];
  householdBalances: { name: string; amount: number; isOwed: boolean }[];
  contacts: { id: string; name: string }[];
  
  // App state for the "New Split" flow
  newSplitDraft: Partial<Split>;
  setNewSplitDraft: React.Dispatch<React.SetStateAction<Partial<Split>>>;
  addSplit: (split: Omit<Split, 'id'>) => void;
  markSplitSettled: (id: string) => void;
  sendReminder: (splitId: string, participantId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [balances, setBalances] = useState({
    youOwe: 24.50,
    youAreOwed: 68.25
  });

  const [recentSplits, setRecentSplits] = useState<Split[]>([
    {
      id: '1',
      title: 'Dinner at Mayagüez',
      amount: 84.75,
      category: 'Food',
      date: 'Today',
      status: 'pending',
      payerId: 'user',
      payerName: 'Francisco',
      pendingCount: 2,
      participants: [
        { id: 'user', name: 'Francisco', status: 'paid', amount: 28.25 },
        { id: 'c1', name: 'Gabriel', status: 'pending', amount: 28.25 },
        { id: 'c2', name: 'Edward', status: 'pending', amount: 28.25 }
      ]
    },
    {
      id: '2',
      title: 'Apartment WiFi',
      amount: 60.00,
      category: 'Utilities',
      date: 'Yesterday',
      status: 'pending',
      payerId: 'c3',
      payerName: 'Ariana',
      pendingCount: 1,
      participants: [
        { id: 'c3', name: 'Ariana', status: 'paid', amount: 30.00 },
        { id: 'user', name: 'Francisco', status: 'pending', amount: 30.00 }
      ]
    },
    {
      id: '3',
      title: 'Groceries',
      amount: 42.60,
      category: 'Groceries',
      date: 'Mar 10',
      status: 'settled',
      payerId: 'user',
      payerName: 'Francisco',
      pendingCount: 0,
      participants: [
        { id: 'user', name: 'Francisco', status: 'paid', amount: 21.30 },
        { id: 'c4', name: 'Ignacio', status: 'paid', amount: 21.30 }
      ]
    }
  ]);

  const householdExpenses: HouseholdExpense[] = [
    { id: 'h1', title: 'Rent', amount: 1200, status: 'paid', paidBy: 'Ariana' },
    { id: 'h2', title: 'WiFi', amount: 60, status: 'pending' },
    { id: 'h3', title: 'Electricity', amount: 135, status: 'pending' },
    { id: 'h4', title: 'Groceries', amount: 72.40, status: 'settled' },
  ];

  const householdBalances = [
    { name: 'Ariana', amount: 96.35, isOwed: true },
    { name: 'Gabriel', amount: 32.10, isOwed: false },
    { name: 'Edward', amount: 32.10, isOwed: false },
    { name: 'Ignacio', amount: 32.15, isOwed: false },
  ];

  const contacts = [
    { id: 'c1', name: 'Gabriel' },
    { id: 'c2', name: 'Edward' },
    { id: 'c4', name: 'Ignacio' },
    { id: 'c5', name: 'Andrea' },
    { id: 'c3', name: 'Ariana' }
  ];

  const [newSplitDraft, setNewSplitDraft] = useState<Partial<Split>>({
    title: '',
    amount: 0,
    category: '',
    participants: []
  });

  const addSplit = (splitDraft: Omit<Split, 'id'>) => {
    const newSplit: Split = {
      ...splitDraft,
      id: Math.random().toString(36).substr(2, 9),
    };
    setRecentSplits([newSplit, ...recentSplits]);
    setBalances(prev => ({
      ...prev,
      youAreOwed: prev.youAreOwed + (newSplit.amount - (newSplit.participants.find(p => p.id === 'user')?.amount || 0))
    }));
    setNewSplitDraft({ title: '', amount: 0, category: '', participants: [] });
  };

  const markSplitSettled = (id: string) => {
    setRecentSplits(splits => 
      splits.map(s => 
        s.id === id 
          ? { ...s, status: 'settled', pendingCount: 0, participants: s.participants.map(p => ({ ...p, status: 'paid' as SplitStatus })) } 
          : s
      )
    );
  };

  const sendReminder = (splitId: string, participantId: string) => {
    // Just a placeholder for the context, UI will show a toast/alert
    console.log(`Reminder sent for split ${splitId} to ${participantId}`);
  };

  return (
    <AppContext.Provider value={{
      balances,
      recentSplits,
      householdExpenses,
      householdBalances,
      contacts,
      newSplitDraft,
      setNewSplitDraft,
      addSplit,
      markSplitSettled,
      sendReminder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
