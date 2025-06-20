document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.querySelector(".sidebar");
    const container = document.querySelector(".container");
    const expenseForm = document.getElementById("expense-form");
    const expenseList = document.getElementById("expense-list");
    const expenseChartCanvas = document.getElementById("expenseChart").getContext("2d");

    let expenseChart = null; // Store the chart instance globally
    let expenses = []; // ✅ Define globally before use

    // Toggle Sidebar
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        container.classList.toggle("open");
    });

    // Add Expense
    expenseForm.addEventListener("submit", (e) => {
        e.preventDefault();
    
        const name = document.getElementById("expense-name").value;
        const amount = parseFloat(document.getElementById("expense-amount").value);
        const category = document.getElementById("expense-category").value;
        
        if (!name || !amount || isNaN(amount)) {
            alert("Please enter valid expense details!");
            return;
        }
    
        const expense = { name, amount, category, date: new Date().toISOString().split("T")[0] // ✅ Save as YYYY-MM-DD
        };
    
        // Save to JSON Server
        fetch("http://localhost:3000/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(expense)
        }).then(res => res.json())
        .then(() => {
            displayExpenses();
            generateExpenseChart();
            expenseForm.reset();
        })
        .catch(error => console.error("Error:", error));
    });
    

    // Display Expenses in List
    function displayExpenses() {
        fetch("http://localhost:3000/expenses")
            .then(res => res.json())
            .then(data => {
                expenses = data;
                expenseList.innerHTML = "";
                expenses.forEach((expense, index) => {
                    const li = document.createElement("li");
                    li.innerHTML = `${expense.date} - <strong>${expense.name}</strong>: $${expense.amount} (${expense.category}) 
                    <button onclick="deleteExpense(${expense.id})">❌</button>`;
                    expenseList.appendChild(li);
                });
    
                generateExpenseChart();
                updateSpendingSummary(); // ✅ Update after expenses load

            })
            .catch(error => console.error("Error fetching expenses:", error));
    }
    
    function updateSpendingSummary() {
        if (!expenses.length) {
            console.log("No expenses found.");
            return;
        }

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of the week (Sunday)

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1); // First day of the month

        let weeklyTotal = 0;
        let monthlyTotal = 0;

        expenses.forEach(expense => {
            let expenseDate = new Date(expense.date); // ✅ Parses YYYY-MM-DD correctly

            if (isNaN(expenseDate)) {
                console.warn(`Invalid date format: ${expense.date}`);
                return;
            }

            if (expenseDate >= startOfWeek) {
                weeklyTotal += expense.amount;
            }

            if (expenseDate >= startOfMonth) {
                monthlyTotal += expense.amount;
            }
        });

        document.getElementById("weekly-total").textContent = weeklyTotal.toFixed(2);
        document.getElementById("monthly-total").textContent = monthlyTotal.toFixed(2);

        console.log(`✅ Weekly Total: $${weeklyTotal}, Monthly Total: $${monthlyTotal}`);
    }    
    // Delete Expense
    window.deleteExpense = function (id) {
        fetch(`http://localhost:3000/expenses/${id}`, {
            method: "DELETE"
        })
        .then(() => {
            displayExpenses();
            generateExpenseChart();
        })
        .catch(error => console.error("Error deleting expense:", error));
    };
    

    // Generate Expense Chart

    function generateExpenseChart() {
        const categories = ["Food", "Transport", "Shopping", "Other"];
        const categoryTotals = categories.map(cat =>
            expenses.filter(exp => exp.category === cat).reduce((sum, exp) => sum + exp.amount, 0)
        );
    
        // Destroy the previous chart if it exists
        if (expenseChart) {
            expenseChart.destroy();
        }
    
        // Create a new chart
        expenseChart = new Chart(expenseChartCanvas, {
            type: "bar",
            data: {
                labels: categories,
                datasets: [{
                    label: "Expenses by Category",
                    data: categoryTotals,
                    backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4CAF50"]
                }]
            }
        });
    }
    

    // Load Initial Data
    displayExpenses();
    generateExpenseChart();
});
        
