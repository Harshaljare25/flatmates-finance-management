/**
 * State Management and Calculation Logic for Flatmates Finance System
 */

// CHANGE THIS URL TO YOUR LIVE DEPLOYED RENDER BACKEND URL!
// e.g. const BACKEND_API_URL = "https://your-backend-app.onrender.com/api/state";
const BACKEND_API_URL = "https://flatmates-finance-management.onrender.com/api/state";

const FinanceState = {
  // --- Raw Data ---
  flatmates: [],
  expenses: [],
  bills: [],
  settlements: [],

  // --- Initializer ---
  init() {
    this.loadFromStorage();
  },

  // --- Storage Helper ---
  async loadFromStorage() {
    // 1. Instant load from local storage
    try {
      this.flatmates = JSON.parse(localStorage.getItem("faus_flatmates")) || [];
      this.expenses = JSON.parse(localStorage.getItem("faus_expenses")) || [];
      this.bills = JSON.parse(localStorage.getItem("faus_bills")) || [];
      this.settlements = JSON.parse(localStorage.getItem("faus_settlements")) || [];
    } catch (e) {
      this.flatmates = [];
      this.expenses = [];
      this.bills = [];
      this.settlements = [];
    }

    // Seed default flatmates if local storage was empty
    if (this.flatmates.length === 0) {
      this.flatmates = [
        "Harshal Jare",
        "Krushna Sakhare",
        "Shaswat Patil",
        "Vedant Bhusari",
        "Abhishek Jambhe"
      ];
      this.saveToStorage();
    }

    // 2. Try to sync with background FastAPI server
    try {
      const response = await fetch(BACKEND_API_URL);
      if (response.ok) {
        const data = await response.json();
        this.flatmates = data.flatmates || this.flatmates;
        this.expenses = data.expenses || this.expenses;
        this.bills = data.bills || this.bills;
        this.settlements = data.settlements || this.settlements;
        
        // Sync local storage
        localStorage.setItem("faus_flatmates", JSON.stringify(this.flatmates));
        localStorage.setItem("faus_expenses", JSON.stringify(this.expenses));
        localStorage.setItem("faus_bills", JSON.stringify(this.bills));
        localStorage.setItem("faus_settlements", JSON.stringify(this.settlements));
        
        // Dispatch event to trigger frontend re-render
        document.dispatchEvent(new CustomEvent("stateSynced"));
      }
    } catch (err) {
      console.log("Backend offline. Running in LocalStorage-only mode.");
    }
  },

  saveToStorage() {
    // Save locally
    localStorage.setItem("faus_flatmates", JSON.stringify(this.flatmates));
    localStorage.setItem("faus_expenses", JSON.stringify(this.expenses));
    localStorage.setItem("faus_bills", JSON.stringify(this.bills));
    localStorage.setItem("faus_settlements", JSON.stringify(this.settlements));

    // Save to backend API asynchronously
    const statePayload = {
      flatmates: this.flatmates,
      expenses: this.expenses,
      bills: this.bills,
      settlements: this.settlements
    };

    fetch(BACKEND_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statePayload)
    }).catch(err => {
      console.log("Backend offline. Saved to local storage only.");
    });
  },

  // --- Flatmate Operations ---
  addFlatmate(name) {
    name = name.trim();
    if (!name) return { success: false, error: "Name cannot be empty" };
    if (this.flatmates.some(f => f.toLowerCase() === name.toLowerCase())) {
      return { success: false, error: "Flatmate already exists" };
    }
    this.flatmates.push(name);
    this.saveToStorage();
    return { success: true, name };
  },

  removeFlatmate(name) {
    const balances = this.getBalances();
    const balance = balances[name] || 0;
    
    // Check if flatmate has outstanding balance (within 0.01 precision)
    if (Math.abs(balance) > 0.01) {
      return { 
        success: false, 
        error: `Cannot remove flatmate. ${name} has an outstanding balance of ₹${balance.toFixed(2)}.` 
      };
    }
    
    // Proceed to filter out the flatmate
    this.flatmates = this.flatmates.filter(f => f !== name);
    this.saveToStorage();
    return { success: true };
  },

  // --- Expense Operations ---
  addExpense(description, category, amount, payer, date, splitters) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: "Amount must be a positive number" };
    if (!description.trim()) return { success: false, error: "Description is required" };
    if (!this.flatmates.includes(payer)) return { success: false, error: "Invalid payer" };
    if (!splitters || splitters.length === 0) {
      splitters = [...this.flatmates]; // Split among all flatmates if none specified
    }
    
    // Ensure all splitters exist
    const invalidSplitters = splitters.filter(s => !this.flatmates.includes(s));
    if (invalidSplitters.length > 0) return { success: false, error: "Invalid splitters specified" };

    const expense = {
      id: "exp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      description: description.trim(),
      category,
      amount,
      payer,
      date: date || new Date().toISOString().split('T')[0],
      splitters
    };

    this.expenses.push(expense);
    this.saveToStorage();
    return { success: true, expense };
  },

  deleteExpense(id) {
    this.expenses = this.expenses.filter(e => e.id !== id);
    this.saveToStorage();
    return { success: true };
  },

  // --- Settlement Operations ---
  addSettlement(sender, receiver, amount, date) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: "Amount must be a positive number" };
    if (sender === receiver) return { success: false, error: "Sender and receiver cannot be the same person" };
    if (!this.flatmates.includes(sender) || !this.flatmates.includes(receiver)) {
      return { success: false, error: "Invalid sender or receiver" };
    }

    const settlement = {
      id: "set_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      sender,
      receiver,
      amount,
      date: date || new Date().toISOString().split('T')[0]
    };

    this.settlements.push(settlement);
    this.saveToStorage();
    return { success: true, settlement };
  },

  deleteSettlement(id) {
    this.settlements = this.settlements.filter(s => s.id !== id);
    this.saveToStorage();
    return { success: true };
  },

  // --- Bills Operations ---
  addBill(name, amount, dueDate, splitters) {
    amount = parseFloat(amount);
    if (isNaN(amount) || amount <= 0) return { success: false, error: "Amount must be a positive number" };
    if (!name.trim()) return { success: false, error: "Bill name is required" };
    if (!splitters || splitters.length === 0) {
      splitters = [...this.flatmates];
    }

    const bill = {
      id: "bill_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name: name.trim(),
      amount,
      dueDate,
      status: "Unpaid",
      paidBy: null,
      paidDate: null,
      splitters
    };

    this.bills.push(bill);
    this.saveToStorage();
    return { success: true, bill };
  },

  payBill(billId, payer, date) {
    const bill = this.bills.find(b => b.id === billId);
    if (!bill) return { success: false, error: "Bill not found" };
    if (bill.status === "Paid") return { success: false, error: "Bill is already paid" };
    if (!this.flatmates.includes(payer)) return { success: false, error: "Invalid payer" };

    bill.status = "Paid";
    bill.paidBy = payer;
    bill.paidDate = date || new Date().toISOString().split('T')[0];

    // Create an associated expense entry
    let billCategory = "Internet";
    const nameLower = bill.name.toLowerCase();
    if (nameLower.includes("rent")) {
      billCategory = "Rent";
    } else if (nameLower.includes("deposit")) {
      billCategory = "Security Deposit";
    } else if (nameLower.includes("grocery") || nameLower.includes("groceries")) {
      billCategory = "Groceries";
    }

    const expResult = this.addExpense(
      `Paid Bill: ${bill.name}`,
      billCategory,
      bill.amount,
      payer,
      bill.paidDate,
      bill.splitters
    );

    if (!expResult.success) {
      // Revert bill status if expense creation fails
      bill.status = "Unpaid";
      bill.paidBy = null;
      bill.paidDate = null;
      return expResult;
    }

    this.saveToStorage();
    return { success: true, bill, expense: expResult.expense };
  },

  deleteBill(id) {
    this.bills = this.bills.filter(b => b.id !== id);
    this.saveToStorage();
    return { success: true };
  },

  // --- Calculations ---

  /**
   * Calculates the net balance for all current flatmates.
   * Positive means they are owed money (creditor).
   * Negative means they owe money (debtor).
   */
  getBalances() {
    const balances = {};
    
    // Initialize
    this.flatmates.forEach(name => {
      balances[name] = 0;
    });

    // Process Expenses
    this.expenses.forEach(exp => {
      const amount = exp.amount;
      const payer = exp.payer;
      const splitters = exp.splitters;

      // Skip calculation if payer is no longer in active flatmates (edge case)
      if (!this.flatmates.includes(payer)) return;

      // Only count splitters that are currently in the flatmate list
      const activeSplitters = splitters.filter(s => this.flatmates.includes(s));
      if (activeSplitters.length === 0) return;

      const share = amount / activeSplitters.length;
      
      balances[payer] += amount;
      activeSplitters.forEach(s => {
        balances[s] -= share;
      });
    });

    // Process Settlements
    this.settlements.forEach(set => {
      const sender = set.sender;
      const receiver = set.receiver;
      const amount = set.amount;

      if (this.flatmates.includes(sender)) {
        balances[sender] += amount; // debtor paid, reducing negative balance
      }
      if (this.flatmates.includes(receiver)) {
        balances[receiver] -= amount; // creditor received, reducing positive balance
      }
    });

    return balances;
  },

  /**
   * Greedy Debt-Simplification Algorithm.
   * Resolves balances to find the minimum transaction paths.
   */
  getSimplifiedDebts() {
    const balances = this.getBalances();
    const debtors = [];
    const creditors = [];

    // Separate debtors and creditors
    Object.keys(balances).forEach(name => {
      const bal = balances[name];
      if (bal < -0.01) {
        debtors.push({ name, balance: -bal }); // positive debt amount
      } else if (bal > 0.01) {
        creditors.push({ name, balance: bal });
      }
    });

    // Sort descending by value to prioritize large offsets
    debtors.sort((a, b) => b.balance - a.balance);
    creditors.sort((a, b) => b.balance - a.balance);

    const transactions = [];
    let i = 0;
    let j = 0;

    // Greedy matching
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const settleAmount = Math.min(debtor.balance, creditor.balance);

      if (settleAmount > 0.01) {
        transactions.push({
          from: debtor.name,
          to: creditor.name,
          amount: settleAmount
        });
      }

      debtor.balance -= settleAmount;
      creditor.balance -= settleAmount;

      if (debtor.balance < 0.01) i++;
      if (creditor.balance < 0.01) j++;
    }

    return transactions;
  },

  /**
   * Helper statistics for member spending & category breakdowns
   */
  getCategoryBreakdown() {
    const categories = {
      Groceries: 0,
      "Security Deposit": 0,
      Rent: 0,
      Internet: 0,
      Other: 0
    };

    this.expenses.forEach(exp => {
      if (categories[exp.category] !== undefined) {
        categories[exp.category] += exp.amount;
      } else {
        categories.Other += exp.amount;
      }
    });

    return categories;
  },

  getMemberExpensesPaid() {
    const payments = {};
    this.flatmates.forEach(name => {
      payments[name] = 0;
    });

    this.expenses.forEach(exp => {
      if (payments[exp.payer] !== undefined) {
        payments[exp.payer] += exp.amount;
      }
    });

    return payments;
  },

  getTotalSpent() {
    return this.expenses.reduce((sum, e) => sum + e.amount, 0);
  }
};
