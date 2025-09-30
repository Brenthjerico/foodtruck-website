// Data (Loaded from localStorage)
let sheets = JSON.parse(localStorage.getItem('sheets')) || [
    { name: 'Drinks', icon: 'fa-coffee', entries: [] },
    { name: 'Food', icon: 'fa-utensils', entries: [] }
    
];
// ADDED: For Category Filtering in Portrait Layout
let currentCategoryFilter = 'all';

function filterByCategory(category) {
    currentCategoryFilter = category;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Hide/show categories
    document.querySelectorAll('.category').forEach(cat => {
        if (category === 'all' || cat.dataset.category === category) {
            cat.style.display = 'block';
        } else {
            cat.style.display = 'none';
        }
    });
    
    // Re-run search if active
    filterMenuItems();
}

// EDITED: Update your existing filterMenuItems() to combine with category filter
function filterMenuItems() {
    const searchTerm = document.getElementById('menuSearchBar').value.toLowerCase();
    let visibleCount = 0;
    
    document.querySelectorAll('.menu-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        const category = item.closest('.category');
        
        // Check category filter first
        let categoryMatch = true;
        if (currentCategoryFilter !== 'all' && category.dataset.category !== currentCategoryFilter) {
            categoryMatch = false;
        }
        
        // Then search within visible categories
        if (categoryMatch && text.includes(searchTerm)) {
            item.style.display = 'block';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });
    
    // Show/hide no results
    const noResults = document.getElementById('noResults');
    if (visibleCount === 0) {
        noResults.style.display = 'block';
    } else {
        noResults.style.display = 'none';
    }
}



// Save to localStorage
function saveData() {
    localStorage.setItem('sheets', JSON.stringify(sheets));
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('savedOrders', JSON.stringify(savedOrders));
}

// Initialize App
function init() {
    renderSheets();
    updateTotals();
    renderHistory();
    renderSavedOrders();
    document.getElementById('datetime').value = new Date().toISOString().slice(0, 16);
    populateSheetSelect();
    document.getElementById('dropdown').style.display = 'none';
    document.getElementById('orderBtn').style.display = 'block';
    document.getElementById('plusBtn').style.display = 'none';
    filterContent(); // Initial filter if search has value
}

// Fixed: Proper Toggle for Order Modal (Replaces both duplicates)
function toggleOrderModal() {
    const modal = document.getElementById('orderModal');
    const overlay = document.getElementById('overlay');
    const isCurrentlyOpen = modal.style.display === 'flex' || modal.style.display === 'block'; // Detect open state (handles both 'flex' and 'block')

    if (isCurrentlyOpen) {
        // If already open, just close it (no clearing on reclick)
        modal.style.display = 'none';
        overlay.style.display = 'none';
        document.body.classList.remove('modal-open');
    } else {
        // If closed, open it and reset for a new order (clear cart/calculator)
        modal.style.display = 'flex';  // Use 'flex' to match CSS layout
        overlay.style.display = 'block';
        document.body.classList.add('modal-open');
        
        // Reset for new order (only happens when opening)
        cart = {};
        orderTotal = 0;
        clientMoney = 0;
        document.getElementById('clientMoney').value = '';
        document.getElementById('menuSearchBar').value = ''; // Clear search
        currentCategoryFilter = 'all'; // Reset category filter
        filterByCategory('all'); // Show all categories (from your first function)
        filterMenuItems(); // Show all menu items
        updateCartSummary(); // Update cart display
        calculateChange(); // Reset calculator to initial state ("0 (Add items first)")
        
        // Optional: If you want to preserve cart on re-open (e.g., for editing previous order), comment out the cart/orderTotal/clientMoney resets above
    }
}

// Render Sheets (Supports Search Filter)
function renderSheets(filtered = sheets) {
    const container = document.getElementById('sheets');
    container.innerHTML = filtered.map((sheet, localIndex) => {
        const globalIndex = sheets.indexOf(sheet);
        return `
            <div class="sheet ${currentSheet === globalIndex ? 'selected' : ''}" onclick="selectSheet(${globalIndex})">
                <i class="fas ${sheet.icon} sheet-icon"></i>
                <h4>${sheet.name}</h4>
                <div class="sheet-options">
                    <button onclick="editSheet(${globalIndex}); event.stopPropagation();"><i class="fas fa-edit"></i></button>
                    <button onclick="deleteSheet(${globalIndex}); event.stopPropagation();"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
    }).join('');
}

// Select Sheet (Shows Plus Button)
function selectSheet(index) {
    currentSheet = index;
    renderSheets();
    document.getElementById('plusBtn').style.display = 'block';
}

// New Sheet (From 3-Dot Dropdown)
function newSheet() {
    const name = prompt('Sheet name:');
    const icon = prompt('Icon (e.g., fa-coffee):') || 'fa-circle';
    if (name) {
        sheets.push({ name: name, icon: icon, entries: [] });
        saveData();
        renderSheets();
        closeDropdown();
    }
}

// Edit Sheet Name
function editSheet(index) {
    const name = prompt('New name:', sheets[index].name);
    if (name) {
        sheets[index].name = name;
        saveData();
        renderSheets();
        renderHistory(); // Update history display
    }
}

// Delete Sheet (Confirmation)
function deleteSheet(index) {
    if (confirm('Delete this sheet and its entries?')) {
        sheets.splice(index, 1);
        if (currentSheet === index) {
            currentSheet = null;
            document.getElementById('plusBtn').style.display = 'none';
        }
        saveData();
        renderSheets();
        renderHistory();
    }
}

// Toggle Add Entry Modal (Plus Button)
function toggleAddModal() {
    if (!currentSheet && sheets.length > 0) {
        alert('Please select a sheet first!');
        return;
    }
    if (sheets.length === 0) {
        alert('Create a sheet first via the menu!');
        return;
    }
    document.getElementById('addModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    populateSheetSelect(); // Refresh options
}

// Handle Add Entry Form Submit
document.addEventListener('DOMContentLoaded', function() {
    const addForm = document.getElementById('addForm');
    if (addForm) {
        addForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const amount = parseFloat(document.getElementById('amount').value);
            const type = document.getElementById('type').value;
            const sheetIndex = parseInt(document.getElementById('sheetSelect').value);
            const datetime = document.getElementById('datetime').value;

            if (isNaN(amount) || amount <= 0) {
                alert('Please enter a valid amount!');
                return;
            }

            sheets[sheetIndex].entries.push({ amount, type, datetime });
            history.push({ 
                sheet: sheets[sheetIndex].name, 
                amount, 
                type, 
                datetime 
            });
            saveData();
            updateTotals();
            renderHistory();
            closeModals();
            this.reset();
            document.getElementById('datetime').value = new Date().toISOString().slice(0, 16);
        });
    }
});

// Update Income/Expense Totals
function updateTotals() {
    let income = 0, expense = 0;
    sheets.forEach(sheet => {
        sheet.entries.forEach(entry => {
            if (entry.type === 'income') income += entry.amount;
            else expense += entry.amount;
        });
    });
    document.getElementById('totalIncome').textContent = income.toFixed(2);
    document.getElementById('totalExpense').textContent = expense.toFixed(2);
}

// Render Transaction History
function renderHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = history.map(item => `
        <div class="history-item">
            <strong>${item.sheet}:</strong> ${item.type === 'income' ? '+' : '-' } PHP ${item.amount.toFixed(2)} 
            <small>(${new Date(item.datetime).toLocaleString()})</small>
        </div>
    `).join('');
    if (history.length === 0) {
        container.innerHTML = '<p>No transactions yet.</p>';
    }
}

// Populate Sheet Dropdown in Add Modal
function populateSheetSelect() {
    const select = document.getElementById('sheetSelect');
    if (select) {
        select.innerHTML = sheets.map((sheet, index) => 
            `<option value="${index}" ${currentSheet === index ? 'selected' : ''}>${sheet.name}</option>`
        ).join('');
    }
}


  

// Add Item to Cart
function addToOrder(item, price) {
    if (!cart[item]) {
        cart[item] = { price: price, qty: 0 };
    }
    cart[item].qty += 1;
    orderTotal += price;
    updateCartSummary();
}

// Update Cart Summary Display (Auto-Triggers Change Calc)
function updateCartSummary() {
    const cartList = document.getElementById('cartList');
    const totalSpan = document.getElementById('orderTotal');
    cartList.innerHTML = Object.keys(cart).map(item => {
        const data = cart[item];
        return `<li>${item} x${data.qty} - PHP ${(data.price * data.qty).toFixed(2)}</li>`;
    }).join('');
    if (Object.keys(cart).length === 0) {
        cartList.innerHTML = '<li>Cart empty</li>';
    }
    totalSpan.textContent = orderTotal.toFixed(2);
    calculateChange(); // Auto-update change when cart changes
}

// Automatic Change Calculation (Updates Span with Value on Typing/Button Click)
function calculateChange() {
    const clientInput = document.getElementById('clientMoney');
    clientMoney = parseFloat(clientInput.value) || 0;
    const change = clientMoney - orderTotal;
    const changeSpan = document.getElementById('change');
    const changeDisplay = document.getElementById('changeDisplay');

    if (!changeSpan || !changeDisplay) return; // Safety check

    if (orderTotal === 0) {
        changeSpan.textContent = '0 (Add items first)';
        changeDisplay.className = '';
        return;
    }
    

    let changeText = '';
    changeDisplay.className = '';

    if (change > 0) {
        changeText = change.toFixed(2);
        changeDisplay.className = 'positive';
    } else if (change === 0) {
        changeText = '0 (Exact)';
        changeDisplay.className = 'exact';
    } else {
        changeText = change.toFixed(2); // Negative value like -20.00
        changeDisplay.className = 'negative';
    }

    changeSpan.textContent = changeText;
}

// Clear Cart (Resets cart, total, and change)
function clearCart() {
    cart = {};
    orderTotal = 0;
    clientMoney = 0;
    document.getElementById('clientMoney').value = '';
    updateCartSummary();
    calculateChange();
}

// Close Order Modal
function closeOrderModal() {
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Close All Modals (Used for overlay click)
function closeModals() {
    document.getElementById('addModal').style.display = 'none';
    document.getElementById('orderModal').style.display = 'none';
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Place Order (Auto-Adds to History as Income, No Change in Alert)
function placeOrder() {
    if (Object.keys(cart).length === 0) {
        alert('Add items to your order first!');
        return;
    }
    if (clientMoney < orderTotal) {
        alert(`Insufficient! Total: PHP ${orderTotal.toFixed(2)} - Client Paid: PHP ${clientMoney.toFixed(2)} = Need PHP ${(orderTotal - clientMoney).toFixed(2)} more.`);
        return;
    }
    const change = clientMoney - orderTotal;
    const order = {
        id: Date.now(),
        items: cart,
        total: orderTotal,
        clientPaid: clientMoney,
        change: change,
        date: new Date().toLocaleString()
    };
    savedOrders.unshift(order);

    // Auto-add order total as income to selected sheet (or default to first sheet)
    const sheetIndex = currentSheet !== null ? currentSheet : 0; // Default to 'Drinks' if none selected
    const datetime = new Date().toISOString().slice(0, 16);
    sheets[sheetIndex].entries.push({ amount: orderTotal, type: 'income', datetime });
    history.push({ 
        sheet: sheets[sheetIndex].name, 
        amount: orderTotal, 
        type: 'income', 
        datetime 
    });

    saveData();
    updateTotals();
    renderHistory();
    renderSavedOrders();
    clearCart(); // Clear after placing order
    closeOrderModal(); // Close modal after success
    alert(`Order placed! Change: PHP ${change.toFixed(2)}`);
}

// Render Saved Orders
function renderSavedOrders() {
    const container = document.getElementById('ordersList');
    container.innerHTML = savedOrders.map(order => `
        <div class="saved-order">
            <strong>Order #${order.id}</strong> - Total: PHP ${order.total.toFixed(2)} | Paid: PHP ${order.clientPaid.toFixed(2)} | Change: PHP ${order.change.toFixed(2)}<br>
            <small>${new Date(order.date).toLocaleString()}</small><br>
            Items: ${Object.keys(order.items).join(', ')}
        </div>
    `).join('');
    if (savedOrders.length === 0) {
        container.innerHTML = '<p>No saved orders yet.</p>';
    }
}

// Toggle 3-Dot Dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown');
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
}

// Close Dropdown
function closeDropdown() {
    document.getElementById('dropdown').style.display = 'none';
}

// Clear History
function clearHistory() {
    if (confirm('Clear all history and reset totals?')) {
        history = [];
        sheets.forEach(sheet => sheet.entries = []);
        saveData();
        updateTotals();
        renderHistory();
        renderSavedOrders();
    }
}

// Toggle Settings Modal
function toggleSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
    closeDropdown();
}

// Close Settings Modal
function closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Switch Theme
function switchTheme(theme) {
    document.body.className = theme + '-theme';
    closeSettings();
    localStorage.setItem('theme', theme);
}

// Load Theme on Init
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'outside';
    switchTheme(savedTheme);
}

// Filter Content (Sheets and Menu Items by Search Bar)
function filterContent() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase();
    
    // Filter Sheets
    const filteredSheets = sheets.filter(sheet => sheet.name.toLowerCase().includes(searchTerm));
    renderSheets(filteredSheets);
    
    // Filter Menu Items (Hide non-matching)
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        const text = item.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
    
    // If no search, show all
    if (!searchTerm) {
        menuItems.forEach(item => item.style.display = 'block');
    }
}

// Initialize on Page Load
document.addEventListener('DOMContentLoaded', init);
loadTheme(); // Load saved theme


// Filter Menu Items by Flavor/Name in Order Modal
function filterMenuItems() {
    const searchTerm = document.getElementById('menuSearchBar').value.toLowerCase().trim();
    const menuItems = document.querySelectorAll('#orderModal .menu-item'); // Only modal items
    let visibleCount = 0;

    menuItems.forEach(item => {
        const text = item.textContent.toLowerCase(); // Matches name, size (M/L), price
        if (searchTerm === '' || text.includes(searchTerm)) {
            item.style.display = 'block';
            item.classList.remove('hidden');
            visibleCount++;
        } else {
            item.style.display = 'none';
            item.classList.add('hidden');
        }
    });

    // Handle "No Results" message (if you added the HTML div)
    const noResultsDiv = document.getElementById('noResults');
    if (noResultsDiv) {
        noResultsDiv.style.display = (visibleCount === 0 && searchTerm !== '') ? 'block' : 'none';
    }
}