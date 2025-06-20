document.addEventListener("DOMContentLoaded", async function () {
    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.querySelector(".sidebar");
    const budgetForm = document.getElementById("budget-form");
    const budgetAlert = document.getElementById("budget-alert");
    const smartSavings = document.getElementById("smart-savings");
    const ctx = document.getElementById("budgetChart").getContext("2d");
    const forecastCtx = document.getElementById("forecastChart").getContext("2d");

    let userId = "8bb5"; // Replace with actual session user ID
    let budgetData = { userId, food: 0, transport: 0, shopping: 0 };
    let expenses = [];
    let budgetId = null; // Store the ID of the existing budget entry

    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
    });

    async function loadBudget() {
        const res = await fetch(`http://localhost:3000/budget?userId=${userId}`);
        const data = await res.json();

        if (data.length > 0) {
            budgetData = data[0];  // Store the user's budget
            budgetId = budgetData.id; // ✅ Store the budget ID for updates
        } else {
            // If no budget exists, create one
            await createBudgetEntry();
        }

        document.getElementById("budget-food").value = budgetData.food;
        document.getElementById("budget-transport").value = budgetData.transport;
        document.getElementById("budget-shopping").value = budgetData.shopping;
    }

    async function createBudgetEntry() {
        const res = await fetch("http://localhost:3000/budget", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(budgetData)
        });

        if (res.ok) {
            const newBudget = await res.json();
            budgetId = newBudget.id; // ✅ Save the new budget ID for future updates
            console.log("Budget entry created.");
        }
    }

    budgetForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        budgetData.food = Number(document.getElementById("budget-food").value) || 0;
        budgetData.transport = Number(document.getElementById("budget-transport").value) || 0;
        budgetData.shopping = Number(document.getElementById("budget-shopping").value) || 0;

        if (budgetId) {
            // ✅ Update the existing budget entry
            await fetch(`http://localhost:3000/budget/${budgetId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(budgetData)
            });

            alert("Budget limits updated! ✅");
        } else {
            // ✅ Create new budget if none exists
            await createBudgetEntry();
        }
    });

    async function loadExpenses() {
        const res = await fetch(`http://localhost:3000/expenses?userId=${userId}`);
        expenses = await res.json();

        updateChart();
        checkBudgetAlert();
        generateSavingsSuggestions();
    }

    function checkBudgetAlert() {
        let totalSpent = { food: 0, transport: 0, shopping: 0 };

        expenses.forEach(exp => {
            if (totalSpent[exp.category] !== undefined) {
                totalSpent[exp.category] += exp.amount;
            }
        });

        let alertMessage = "";
        for (let category in totalSpent) {
            if (totalSpent[category] > budgetData[category]) {
                alertMessage += `⚠️ You've exceeded the budget for ${category}! <br>`;
            }
        }
        budgetAlert.innerHTML = alertMessage;
    }

    function generateSavingsSuggestions() {
        let totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        if (totalSpent > 500) {
            smartSavings.innerText = "💡 Try limiting your non-essential purchases this month!";
        } else if (totalSpent > 300) {
            smartSavings.innerText = "🔄 Consider revising your budget for better savings.";
        } else {
            smartSavings.innerText = "🎯 You're on track with your spending!";
        }
    }

    function updateChart() {
        new Chart(ctx, {
            type: "doughnut",
            data: {
                labels: ["Food", "Transport", "Shopping"],
                datasets: [{
                    data: [budgetData.food, budgetData.transport, budgetData.shopping],
                    backgroundColor: ["#ff6b6b", "#54a0ff", "#feca57"]
                }]
            }
        });

        new Chart(forecastCtx, {
            type: "line",
            data: {
                labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
                datasets: [{
                    label: "Expected Expenses",
                    data: [120, 150, 130, 170],
                    borderColor: "#2ed573",
                    fill: false
                }]
            }
        });
    }

    await loadBudget();
    await loadExpenses();
});
