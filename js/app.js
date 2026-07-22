/**
 * UI Coordination and Event Handling for Flatmates Finance System
 */

document.addEventListener("DOMContentLoaded", () => {
  // Initialize State
  FinanceState.init();

  // Cache DOM Elements
  const navButtons = document.querySelectorAll(".nav-menu .nav-btn");
  const sections = document.querySelectorAll(".content-section");
  const sectionTitle = document.getElementById("section-title");
  const currentDateStr = document.getElementById("current-date-str");
  const headerAlert = document.getElementById("header-alert");

  // Modals System Elements
  const backdrop = document.getElementById("modal-backdrop");
  const allModals = document.querySelectorAll(".modal-bauhaus");
  const modalCloseButtons = document.querySelectorAll(".modal-close");

  // Modals Toggle Buttons
  const openExpenseBtn = document.getElementById("open-add-expense-modal");
  const openSettlementBtn = document.getElementById("open-record-settlement-modal");
  const openBillBtn = document.getElementById("open-add-bill-modal");

  // Forms
  const addExpenseForm = document.getElementById("add-expense-form");
  const recordSettlementForm = document.getElementById("record-settlement-form");
  const addBillForm = document.getElementById("add-bill-form");
  const payBillForm = document.getElementById("pay-bill-form");
  const addFlatmateForm = document.getElementById("add-flatmate-form");

  // Dynamic Content Containers
  const debtSimplificationList = document.getElementById("debt-simplification-list");
  const expenseHistoryTable = document.getElementById("expense-history-table");
  const settlementDirectList = document.getElementById("settlement-direct-list");
  const settlementHistoryTable = document.getElementById("settlement-history-table");
  const billsListGrid = document.getElementById("bills-list-grid");
  const flatmatesGridContainer = document.getElementById("flatmates-grid-container");

  // Filters
  const expenseFilterMember = document.getElementById("expense-filter-member");
  const expenseFilterCategory = document.getElementById("expense-filter-category");

  // Form Inputs specific logic
  const splitTypeRadios = document.querySelectorAll('input[name="split-type"]');
  const customSplitCheckboxes = document.getElementById("custom-split-checkboxes");
  const splitCheckboxesGrid = document.getElementById("split-checkboxes-grid");
  const billSplittersGrid = document.getElementById("bill-splitters-grid");

  // Set Current Date on Header
  const setHeaderDate = () => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateStr.textContent = new Date().toLocaleDateString('en-IN', options).toUpperCase();
  };
  setHeaderDate();

  // ==============================================
  // NAVIGATION CONTROLLER
  // ==============================================
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      // Toggle nav button active class
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Toggle sections
      const target = btn.getAttribute("data-target");
      sections.forEach(sec => sec.classList.remove("active"));
      
      const targetSec = document.getElementById(target);
      if (targetSec) targetSec.classList.add("active");

      // Update Section Header Title
      sectionTitle.textContent = target;

      // Render the targeted section view
      renderSection(target);
    });
  });

  // ==============================================
  // MODALS CONTROLLER
  // ==============================================
  const openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    backdrop.classList.add("show");
    modal.classList.add("show");
    
    // Automatically set default date to today for date fields
    const dateInput = modal.querySelector('input[type="date"]');
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().split('T')[0];
    }
  };

  const closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove("show");
    
    // Check if any other modal is still open before removing backdrop
    const anyOpen = Array.from(allModals).some(m => m.classList.contains("show"));
    if (!anyOpen) {
      backdrop.classList.remove("show");
    }
  };

  const closeAllModals = () => {
    allModals.forEach(modal => modal.classList.remove("show"));
    backdrop.classList.remove("show");
  };

  // Bind close triggers
  modalCloseButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      closeModal(modalId);
    });
  });

  backdrop.addEventListener("click", closeAllModals);

  // Bind open triggers
  openExpenseBtn.addEventListener("click", () => {
    addExpenseForm.reset();
    toggleCustomSplitView(false);
    openModal("add-expense-modal");
  });

  openSettlementBtn.addEventListener("click", () => {
    recordSettlementForm.reset();
    openModal("record-settlement-modal");
  });

  openBillBtn.addEventListener("click", () => {
    addBillForm.reset();
    populateBillSplittersGrid();
    openModal("add-bill-modal");
  });

  // Toggle Custom Split Checklist View based on split method selection
  splitTypeRadios.forEach(radio => {
    radio.addEventListener("change", (e) => {
      toggleCustomSplitView(e.target.value === "custom");
    });
  });

  function toggleCustomSplitView(show) {
    if (show) {
      customSplitCheckboxes.classList.remove("hide");
      populateSplitCheckboxes();
    } else {
      customSplitCheckboxes.classList.add("hide");
    }
  }

  // ==============================================
  // RENDER DYNAMIC DROPDOWNS & LISTS
  // ==============================================

  // Populate Dropdown Selection Menus
  const populateDropdowns = () => {
    const memberSelects = [
      document.getElementById("exp-paid-by"),
      document.getElementById("set-sender"),
      document.getElementById("set-receiver"),
      document.getElementById("pay-bill-payer")
    ];

    memberSelects.forEach(select => {
      if (!select) return;
      const currentValue = select.value;
      select.innerHTML = "";
      
      // Add empty or instruction option if needed, else populate flatmates
      FinanceState.flatmates.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name.toUpperCase();
        select.appendChild(option);
      });

      // Restore previously selected value if it still exists
      if (FinanceState.flatmates.includes(currentValue)) {
        select.value = currentValue;
      }
    });

    // Populate Expense Filter member selector
    if (expenseFilterMember) {
      const currentFilter = expenseFilterMember.value;
      expenseFilterMember.innerHTML = '<option value="all">ALL MEMBERS</option>';
      FinanceState.flatmates.forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name.toUpperCase();
        expenseFilterMember.appendChild(option);
      });
      expenseFilterMember.value = currentFilter || "all";
    }
  };

  // Populate split checkbox list inside Add Expense Modal
  const populateSplitCheckboxes = () => {
    splitCheckboxesGrid.innerHTML = "";
    FinanceState.flatmates.forEach(name => {
      const label = document.createElement("label");
      label.className = "checkbox-label";
      
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = name;
      input.checked = true; // default select all
      
      label.appendChild(input);
      label.appendChild(document.createTextNode(name));
      splitCheckboxesGrid.appendChild(label);
    });
  };

  // Populate split checkbox list inside Add Bill Modal
  const populateBillSplittersGrid = () => {
    billSplittersGrid.innerHTML = "";
    FinanceState.flatmates.forEach(name => {
      const label = document.createElement("label");
      label.className = "checkbox-label";
      
      const input = document.createElement("input");
      input.type = "checkbox";
      input.value = name;
      input.checked = true; // default select all
      
      label.appendChild(input);
      label.appendChild(document.createTextNode(name));
      billSplittersGrid.appendChild(label);
    });
  };

  // ==============================================
  // SECTION VIEWS RENDERING
  // ==============================================

  const renderSection = (sectionName) => {
    populateDropdowns();
    updateAlertBanner();

    switch (sectionName) {
      case "dashboard":
        renderDashboard();
        break;
      case "expenses":
        renderExpenses();
        break;
      case "settlements":
        renderSettlements();
        break;
      case "bills":
        renderBills();
        break;
      case "flatmates":
        renderFlatmates();
        break;
    }
  };

  // Update header notification banner with latest debts
  const updateAlertBanner = () => {
    const simplified = FinanceState.getSimplifiedDebts();
    if (simplified.length === 0) {
      headerAlert.innerHTML = `<span>■ ALL BALANCES ARE FULLY SETTLED</span>`;
      headerAlert.style.backgroundColor = "var(--bh-yellow)";
      headerAlert.style.color = "var(--bh-black)";
    } else {
      const primaryDebt = simplified[0];
      headerAlert.innerHTML = `<span>⚠️ ${primaryDebt.from.toUpperCase()} OWES ${primaryDebt.to.toUpperCase()} ₹${primaryDebt.amount.toFixed(2)}</span>`;
      headerAlert.style.backgroundColor = "var(--bh-red)";
      headerAlert.style.color = "var(--bh-white)";
    }
  };

  // 1. Dashboard Renderer
  const renderDashboard = () => {
    // Top Stats
    const totalSpent = FinanceState.getTotalSpent();
    const avgShare = FinanceState.flatmates.length > 0 ? totalSpent / FinanceState.flatmates.length : 0;
    
    document.getElementById("dash-total-spent").textContent = `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
    document.getElementById("dash-avg-share").textContent = `₹${avgShare.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

    // Standing status banner inside card
    const balances = FinanceState.getBalances();
    const netStatusCardValue = document.getElementById("dash-net-status");
    
    // Sort balances to show standing
    const simplified = FinanceState.getSimplifiedDebts();
    if (simplified.length === 0) {
      netStatusCardValue.textContent = "ALL SETTLED";
      netStatusCardValue.className = "card-value balance-zero";
    } else {
      // Show summary of status
      const debtorsCount = simplified.length;
      netStatusCardValue.textContent = `${debtorsCount} ACTIVE DEBT${debtorsCount > 1 ? 'S' : ''}`;
      netStatusCardValue.className = "card-value balance-negative";
    }

    // Render Debt Simplification list
    debtSimplificationList.innerHTML = "";
    if (simplified.length === 0) {
      debtSimplificationList.innerHTML = `<div class="empty-state">EVERYONE IS EVEN // ALL SETTLED</div>`;
    } else {
      simplified.forEach(debt => {
        const item = document.createElement("div");
        item.className = "debt-item";
        
        // Initial letter for visual avatar
        const initFrom = debt.from.charAt(0).toUpperCase();

        item.innerHTML = `
          <div class="debt-details">
            <div class="debt-avatar bg-red text-white">${initFrom}</div>
            <div class="debt-text">
              <strong>${debt.from}</strong> owes <strong>${debt.to}</strong>
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <span class="debt-amount">₹${debt.amount.toFixed(2)}</span>
            <button class="btn btn-small btn-black debt-settle-btn" data-from="${debt.from}" data-to="${debt.to}" data-amount="${debt.amount.toFixed(2)}">
              SETTLE
            </button>
          </div>
        `;
        debtSimplificationList.appendChild(item);
      });

      // Bind Quick Settle buttons
      debtSimplificationList.querySelectorAll(".debt-settle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const from = btn.getAttribute("data-from");
          const to = btn.getAttribute("data-to");
          const amount = btn.getAttribute("data-amount");
          
          // Prefill record settlement form
          openQuickSettlement(from, to, amount);
        });
      });
    }

    // Render Charts
    const categoryData = FinanceState.getCategoryBreakdown();
    const memberData = FinanceState.getMemberExpensesPaid();
    
    BauhausCharts.renderCategoryChart("category-chart-container", categoryData);
    BauhausCharts.renderMemberChart("member-chart-container", memberData);
  };

  // Helper to pre-populate settlement modal and open it
  const openQuickSettlement = (from, to, amount) => {
    recordSettlementForm.reset();
    document.getElementById("set-sender").value = from;
    document.getElementById("set-receiver").value = to;
    document.getElementById("set-amount").value = amount;
    openModal("record-settlement-modal");
  };

  // 2. Expenses Section Renderer
  const renderExpenses = () => {
    const tableBody = document.getElementById("expense-history-table");
    tableBody.innerHTML = "";

    const selectedMember = expenseFilterMember.value || "all";
    const selectedCategory = expenseFilterCategory.value || "all";

    // Filter list
    const filteredExpenses = FinanceState.expenses.filter(exp => {
      const matchMember = (selectedMember === "all" || exp.payer === selectedMember || exp.splitters.includes(selectedMember));
      const matchCategory = (selectedCategory === "all" || exp.category === selectedCategory);
      return matchMember && matchCategory;
    });

    // Sort descending by date, then ID
    filteredExpenses.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    if (filteredExpenses.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2rem; font-weight: 700; opacity: 0.5;">
            NO EXPENSES MATCHING FILTER SETTINGS
          </td>
        </tr>`;
      return;
    }

    filteredExpenses.forEach(exp => {
      const row = document.createElement("tr");
      
      // Format Date
      const dateObj = new Date(exp.date);
      const formattedDate = isNaN(dateObj) ? exp.date : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();
      
      // Shorten splits text
      let splitStr = "";
      if (exp.splitters.length === FinanceState.flatmates.length) {
        splitStr = "EQUALLY (ALL)";
      } else {
        splitStr = exp.splitters.map(s => s.split(" ")[0]).join(", "); // First names
      }

      // Select badge type based on category
      let badgeClass = "badge-sand";
      if (exp.category === "Groceries") badgeClass = "badge-red";
      else if (exp.category === "Security Deposit") badgeClass = "badge-blue";
      else if (exp.category === "Rent") badgeClass = "badge-yellow";
      else if (exp.category === "Internet") badgeClass = "badge-black";

      row.innerHTML = `
        <td>${formattedDate}</td>
        <td><strong>${exp.description.toUpperCase()}</strong></td>
        <td><span class="badge ${badgeClass}">${exp.category.toUpperCase()}</span></td>
        <td>${exp.payer}</td>
        <td style="font-size: 0.8rem; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${exp.splitters.join(', ')}">${splitStr}</td>
        <td style="font-weight: 700;">₹${exp.amount.toFixed(2)}</td>
        <td>
          <button class="btn btn-small btn-red delete-expense-btn" data-id="${exp.id}">DELETE</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Bind delete clicks
    tableBody.querySelectorAll(".delete-expense-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this expense? It will re-calculate all balances.")) {
          FinanceState.deleteExpense(id);
          renderSection("expenses");
        }
      });
    });
  };

  // Bind filter triggers
  expenseFilterMember.addEventListener("change", () => renderSection("expenses"));
  expenseFilterCategory.addEventListener("change", () => renderSection("expenses"));

  // 3. Settlements Section Renderer
  const renderSettlements = () => {
    // Left: Settle up suggestions
    settlementDirectList.innerHTML = "";
    const simplified = FinanceState.getSimplifiedDebts();

    if (simplified.length === 0) {
      settlementDirectList.innerHTML = `
        <div class="empty-state">
          ALL BALANCES BALANCED OUT<br>
          <span style="font-size: 0.8rem; font-weight: normal;">No outstanding balances. Splendid!</span>
        </div>`;
    } else {
      simplified.forEach(debt => {
        const div = document.createElement("div");
        div.className = "debt-item";
        const letter = debt.from.charAt(0).toUpperCase();
        div.innerHTML = `
          <div class="debt-details">
            <div class="debt-avatar bg-yellow text-black">${letter}</div>
            <div class="debt-text">
              <strong>${debt.from}</strong> owes <strong>${debt.to}</strong>
            </div>
          </div>
          <div style="display: flex; align-items: center;">
            <span class="debt-amount">₹${debt.amount.toFixed(2)}</span>
            <button class="btn btn-small btn-yellow debt-direct-settle-btn" data-from="${debt.from}" data-to="${debt.to}" data-amount="${debt.amount.toFixed(2)}">
              PAY DEBT
            </button>
          </div>
        `;
        settlementDirectList.appendChild(div);
      });

      // Bind Pay Debt buttons
      settlementDirectList.querySelectorAll(".debt-direct-settle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          const from = btn.getAttribute("data-from");
          const to = btn.getAttribute("data-to");
          const amount = btn.getAttribute("data-amount");
          openQuickSettlement(from, to, amount);
        });
      });
    }

    // Right: Settlement Log
    settlementHistoryTable.innerHTML = "";
    const settlementsList = [...FinanceState.settlements];
    // Sort descending by date
    settlementsList.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

    if (settlementsList.length === 0) {
      settlementHistoryTable.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; font-weight: 700; opacity: 0.5;">
            NO RECORDED SETTLEMENT PAYMENTS IN LEDGER
          </td>
        </tr>`;
      return;
    }

    settlementsList.forEach(set => {
      const row = document.createElement("tr");
      
      const dateObj = new Date(set.date);
      const formattedDate = isNaN(dateObj) ? set.date : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }).toUpperCase();

      row.innerHTML = `
        <td>${formattedDate}</td>
        <td><strong>${set.sender.toUpperCase()}</strong></td>
        <td><strong>${set.receiver.toUpperCase()}</strong></td>
        <td style="font-weight: 700; color: var(--bh-blue);">₹${set.amount.toFixed(2)}</td>
        <td>
          <button class="btn btn-small btn-red delete-settlement-btn" data-id="${set.id}">DELETE</button>
        </td>
      `;
      settlementHistoryTable.appendChild(row);
    });

    // Bind delete clicks
    settlementHistoryTable.querySelectorAll(".delete-settlement-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this payment record? Balance will adjust.")) {
          FinanceState.deleteSettlement(id);
          renderSection("settlements");
        }
      });
    });
  };

  // 4. Bills Section Renderer
  const renderBills = () => {
    billsListGrid.innerHTML = "";
    
    if (FinanceState.bills.length === 0) {
      billsListGrid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; width: 100%;">
          NO DEFINE HOUSEHOLD BILLS FOUND<br>
          <span style="font-size: 0.8rem; font-weight: normal;">Click the button above to register an upcoming flat bill.</span>
        </div>`;
      return;
    }

    const billsList = [...FinanceState.bills];
    // Sort unpaid first, then by due date
    billsList.sort((a, b) => {
      if (a.status === b.status) {
        return a.dueDate.localeCompare(b.dueDate);
      }
      return a.status === "Unpaid" ? -1 : 1;
    });

    billsList.forEach(bill => {
      const card = document.createElement("div");
      card.className = "bill-card";
      
      const dateObj = new Date(bill.dueDate);
      const formattedDueDate = isNaN(dateObj) ? bill.dueDate : dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
      
      const isPaid = bill.status === "Paid";
      const badgeType = isPaid ? "badge-yellow" : "badge-red";
      
      let billPaidDetails = "";
      if (isPaid) {
        const payDate = new Date(bill.paidDate);
        const formattedPaidDate = isNaN(payDate) ? bill.paidDate : payDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).toUpperCase();
        billPaidDetails = `
          <div class="bill-meta-row">
            <span>PAID BY</span>
            <span>${bill.paidBy}</span>
          </div>
          <div class="bill-meta-row">
            <span>DATE PAID</span>
            <span>${formattedPaidDate}</span>
          </div>
        `;
      }

      let splitStr = "";
      if (bill.splitters.length === FinanceState.flatmates.length) {
        splitStr = "Split equally among all members";
      } else {
        splitStr = `Split among: ${bill.splitters.map(s => s.split(" ")[0]).join(", ")}`;
      }

      card.innerHTML = `
        <div class="bill-header bg-black text-white">
          <span class="bill-title">${bill.name}</span>
          <span class="badge ${badgeType}">${bill.status.toUpperCase()}</span>
        </div>
        <div class="bill-body">
          <div>
            <div class="bill-amount-label">AMOUNT</div>
            <div class="bill-amount-val">₹${bill.amount.toFixed(2)}</div>
            
            <div class="bill-meta-row">
              <span>DUE DATE</span>
              <span style="${!isPaid ? 'color: var(--bh-red)' : ''}">${formattedDueDate}</span>
            </div>
            ${billPaidDetails}
          </div>

          <div>
            <p class="bill-splitters-list">${splitStr}</p>
            <div style="display: flex; gap: 8px;">
              ${!isPaid ? `
                <button class="btn btn-yellow btn-block bill-pay-action-btn" data-id="${bill.id}" data-amount="${bill.amount}" data-name="${bill.name}">
                  MARK AS PAID
                </button>` : ''
              }
              <button class="btn btn-red btn-small delete-bill-btn" data-id="${bill.id}" style="${isPaid ? 'width: 100%;' : ''}">
                DELETE
              </button>
            </div>
          </div>
        </div>
      `;
      billsListGrid.appendChild(card);
    });

    // Bind Mark as Paid click
    billsListGrid.querySelectorAll(".bill-pay-action-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const billId = btn.getAttribute("data-id");
        const billName = btn.getAttribute("data-name");
        const billAmount = parseFloat(btn.getAttribute("data-amount"));

        // Setup Pay Bill Modal
        document.getElementById("pay-bill-id").value = billId;
        document.getElementById("pay-bill-summary").innerHTML = `You are marking <strong>${billName}</strong> (₹${billAmount.toFixed(2)}) as PAID. This will automatically split the expense in the ledger.`;
        
        openModal("pay-bill-modal");
      });
    });

    // Bind Delete Click
    billsListGrid.querySelectorAll(".delete-bill-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const billId = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this bill record? (Does not delete associated expense if already paid).")) {
          FinanceState.deleteBill(billId);
          renderSection("bills");
        }
      });
    });
  };

  // 5. Flatmates Section Renderer
  const renderFlatmates = () => {
    flatmatesGridContainer.innerHTML = "";
    const balances = FinanceState.getBalances();

    FinanceState.flatmates.forEach(name => {
      const card = document.createElement("div");
      card.className = "flatmate-card";
      
      const balance = balances[name] || 0;
      const initial = name.charAt(0).toUpperCase();

      // Color coding for balance text
      let balClass = "balance-zero";
      let balanceSignStr = "₹0.00";
      
      if (balance > 0.01) {
        balClass = "balance-positive";
        balanceSignStr = `+₹${balance.toFixed(2)}`;
      } else if (balance < -0.01) {
        balClass = "balance-negative";
        balanceSignStr = `-₹${Math.abs(balance).toFixed(2)}`;
      }

      // Calculate lifetime spent
      const lifetimePaid = FinanceState.expenses
        .filter(exp => exp.payer === name)
        .reduce((sum, exp) => sum + exp.amount, 0);

      // Disable remove button if balance is non-zero
      const canRemove = Math.abs(balance) <= 0.01;
      const tooltipTitle = canRemove 
        ? "Remove flatmate from system" 
        : "Cannot remove: outstanding balance must be ₹0.00";

      // We set background of avatar based on color coding cycle
      const colors = ["bg-red", "bg-blue", "bg-yellow", "bg-black"];
      const charCode = name.charCodeAt(0) + name.charCodeAt(name.length-1);
      const colorClass = colors[charCode % colors.length];
      const avatarTextClass = colorClass === "bg-yellow" ? "text-black" : "text-white";

      card.innerHTML = `
        <button class="flatmate-remove-btn" data-name="${name}" title="${tooltipTitle}" ${!canRemove ? 'disabled' : ''}>×</button>
        <div class="flatmate-avatar ${colorClass} ${avatarTextClass}">${initial}</div>
        <div class="flatmate-name">${name.toUpperCase()}</div>
        <div class="flatmate-stats">
          <div class="stat-row">
            <span>STANDING:</span>
            <span class="${balClass}">${balanceSignStr}</span>
          </div>
          <div class="stat-row">
            <span>TOTAL SPENT:</span>
            <span>₹${lifetimePaid.toFixed(2)}</span>
          </div>
        </div>
      `;
      flatmatesGridContainer.appendChild(card);
    });

    // Bind delete clicks
    flatmatesGridContainer.querySelectorAll(".flatmate-remove-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const name = btn.getAttribute("data-name");
        if (confirm(`Are you sure you want to remove flatmate ${name}?`)) {
          const result = FinanceState.removeFlatmate(name);
          if (result.success) {
            renderSection("flatmates");
          } else {
            alert(result.error);
          }
        }
      });
    });
  };

  // ==============================================
  // FORMS SUBMISSION LISTENERS
  // ==============================================

  // 1. Add Expense
  addExpenseForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const desc = document.getElementById("exp-description").value;
    const cat = document.getElementById("exp-category").value;
    const amount = document.getElementById("exp-amount").value;
    const payer = document.getElementById("exp-paid-by").value;
    const date = document.getElementById("exp-date").value;
    const splitType = document.querySelector('input[name="split-type"]:checked').value;

    let splitters = [];
    if (splitType === "custom") {
      const checkedBoxes = splitCheckboxesGrid.querySelectorAll("input[type='checkbox']:checked");
      splitters = Array.from(checkedBoxes).map(box => box.value);
      
      if (splitters.length === 0) {
        alert("Please select at least one flatmate to split with.");
        return;
      }
    } else {
      splitters = [...FinanceState.flatmates];
    }

    const result = FinanceState.addExpense(desc, cat, amount, payer, date, splitters);
    if (result.success) {
      closeModal("add-expense-modal");
      addExpenseForm.reset();
      renderSection("expenses");
    } else {
      alert("Error: " + result.error);
    }
  });

  // 2. Record Settlement
  recordSettlementForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const sender = document.getElementById("set-sender").value;
    const receiver = document.getElementById("set-receiver").value;
    const amount = document.getElementById("set-amount").value;
    const date = document.getElementById("set-date").value;

    if (sender === receiver) {
      alert("A flatmate cannot pay themselves. Please select different names.");
      return;
    }

    const result = FinanceState.addSettlement(sender, receiver, amount, date);
    if (result.success) {
      closeModal("record-settlement-modal");
      recordSettlementForm.reset();
      
      // If we are currently in Dashboard or Settlements, refresh that view
      const activeBtn = document.querySelector(".nav-menu .nav-btn.active");
      const currentTab = activeBtn ? activeBtn.getAttribute("data-target") : "dashboard";
      renderSection(currentTab);
    } else {
      alert("Error: " + result.error);
    }
  });

  // 3. Add Bill
  addBillForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("bill-name").value;
    const amount = document.getElementById("bill-amount").value;
    const dueDate = document.getElementById("bill-due-date").value;

    const checkedBoxes = billSplittersGrid.querySelectorAll("input[type='checkbox']:checked");
    const splitters = Array.from(checkedBoxes).map(box => box.value);

    if (splitters.length === 0) {
      alert("Please select at least one flatmate responsible for this bill.");
      return;
    }

    const result = FinanceState.addBill(name, amount, dueDate, splitters);
    if (result.success) {
      closeModal("add-bill-modal");
      addBillForm.reset();
      renderSection("bills");
    } else {
      alert("Error: " + result.error);
    }
  });

  // 4. Pay Bill Action Confirm
  payBillForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const billId = document.getElementById("pay-bill-id").value;
    const payer = document.getElementById("pay-bill-payer").value;
    const date = document.getElementById("pay-bill-date").value;

    const result = FinanceState.payBill(billId, payer, date);
    if (result.success) {
      closeModal("pay-bill-modal");
      renderSection("bills");
    } else {
      alert("Error: " + result.error);
    }
  });

  // 5. Add Flatmate
  addFlatmateForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nameInput = document.getElementById("flatmate-name-input");
    const name = nameInput.value;

    const result = FinanceState.addFlatmate(name);
    if (result.success) {
      nameInput.value = "";
      renderSection("flatmates");
    } else {
      alert("Error: " + result.error);
    }
  });

  // ==============================================
  // INITIAL PAGE RENDERING RUN
  // ==============================================
  renderSection("dashboard");
});
