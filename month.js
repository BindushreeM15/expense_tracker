document.addEventListener("DOMContentLoaded", async function () {
    const dbUrl = "http://localhost:3000/month"; // JSON Server endpoint

    // 🎯 Select DOM elements
    const monthSelect = document.getElementById("monthSelect");
    const initialAmountInput = document.getElementById("initialAmount");
    const setInitialButton = document.getElementById("setInitialAmount");
    const expenseTable = document.getElementById("expenseTable").querySelector("tbody");
    const donutChartCanvas = document.getElementById("donutChart");
    const lineChartCanvas = document.getElementById("lineChart");
    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.querySelector(".sidebar");

    let selectedMonth = "January";
    let initialAmount = 0;
    let remainingAmount = 0;
    let dailyExpenses = new Array(31).fill(0);
    let monthId = null; // Store month ID to update JSON Server
    
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        container.classList.toggle("open");
    });

    async function fetchMonths() {
        try {
            const response = await fetch(dbUrl);
            const data = await response.json();
            
            if (Array.isArray(data) && data.length > 0) {
                // Prevent duplicate months
                let uniqueMonths = [...new Map(data.map(month => [month.name, month])).values()];
                monthSelect.innerHTML = uniqueMonths.map(month => 
                    `<option value="${month.name}">${month.name} 📅</option>`
                ).join("");
    
                selectedMonth = monthSelect.value;
                fetchData();
            }
    
            // 🔥 Call the analysis function after fetching months
            analyzeSpendingAndSavings();  
    
        } catch (error) {
            console.error("Error fetching months:", error);
        }
    }
    
    

    monthSelect.addEventListener("change", function () {
        selectedMonth = this.value;
        fetchData();
    });

    async function fetchData() {
        try {
            const response = await fetch(`${dbUrl}?name=${selectedMonth}`);
            const data = await response.json();
            if (data.length > 0) {
                monthId = data[0].id;
                initialAmount = data[0].initialAmount || 0;
                dailyExpenses = data[0].expenses || new Array(31).fill(0);
                remainingAmount = initialAmount - dailyExpenses.reduce((a, b) => a + b, 0);
                updateTable();
                drawCharts();
            } else {
                monthId = null;
                initialAmount = 0;
                remainingAmount = 0;
                dailyExpenses = new Array(31).fill(0);
                updateTable();
                drawCharts();
            }        analyzeSpendingAndSavings();

        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }

    setInitialButton.addEventListener("click", async function () {
        initialAmount = parseFloat(initialAmountInput.value) || 0;
        remainingAmount = initialAmount;
        dailyExpenses = new Array(31).fill(0);
        await saveData();
        updateTable();
        drawCharts();
        analyzeSpendingAndSavings();

    });

    async function analyzeSpendingAndSavings() {
        try {
            const response = await fetch(dbUrl);
            const monthsData = await response.json();
    
            if (!monthsData.length) return; // No data available
    
            let spendingAnalysis = [];
            
            monthsData.forEach(month => {
                let totalSpent = month.expenses.reduce((sum, value) => sum + value, 0);
                let savings = month.initialAmount - totalSpent;
                
                spendingAnalysis.push({
                    name: month.name,
                    totalSpent,
                    savings
                });
            });
    
            // ✅ Find the month with the highest spending
            let maxSpentMonth = spendingAnalysis.reduce((max, month) => 
                month.totalSpent > max.totalSpent ? month : max, spendingAnalysis[0]);
    
            // ✅ Find the month with the highest savings
            let maxSavedMonth = spendingAnalysis.reduce((max, month) => 
                month.savings > max.savings ? month : max, spendingAnalysis[0]);
    
            // ✅ Display the results
            document.getElementById("highestSpent").textContent = 
                `📉 Highest Spending Month: ${maxSpentMonth.name} (${maxSpentMonth.totalSpent.toFixed(2)} 💰)`;
    
            document.getElementById("highestSaved").textContent = 
                `📈 Highest Savings Month: ${maxSavedMonth.name} (${maxSavedMonth.savings.toFixed(2)} 💰)`;
    
        } catch (error) {
            console.error("Error analyzing spending and savings:", error);
        }
    }
    
    async function saveData() {
        try {
            if (monthId) {
                await fetch(`${dbUrl}/${monthId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: selectedMonth, initialAmount, expenses: dailyExpenses })
                });
            } else {
                const response = await fetch(dbUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: selectedMonth, initialAmount, expenses: dailyExpenses })
                });
                const newData = await response.json();
                monthId = newData.id;
            }
        } catch (error) {
            console.error("Error saving data:", error);
        }
    }

    function updateTable() {
        expenseTable.innerHTML = "";
        let tempRemaining = initialAmount;
        for (let day = 1; day <= 31; day++) {
            let row = document.createElement("tr");

            let dayCell = document.createElement("td");
            dayCell.textContent = `Day ${day} 📅`;

            let spentCell = document.createElement("td");
            let spentInput = document.createElement("input");
            spentInput.type = "number";
            spentInput.value = dailyExpenses[day - 1];
            spentInput.addEventListener("change", async function () {
                let spent = parseFloat(spentInput.value) || 0;
                let previousSpent = dailyExpenses[day - 1];

                dailyExpenses[day - 1] = spent;
                remainingAmount += (previousSpent - spent);
                await saveData();
                updateTable();
                drawCharts();
            });
            spentCell.appendChild(spentInput);

            let remainingCell = document.createElement("td");
            tempRemaining -= dailyExpenses[day - 1];
            remainingCell.textContent = tempRemaining.toFixed(2) + " 💰";

            row.appendChild(dayCell);
            row.appendChild(spentCell);
            row.appendChild(remainingCell);
            expenseTable.appendChild(row);
        }
    }

    function drawCharts() {
        drawDonutChart(dailyExpenses);
        drawLineChart(dailyExpenses);
    }

    function drawDonutChart(data) {
        let ctx = donutChartCanvas.getContext("2d");
        ctx.clearRect(0, 0, donutChartCanvas.width, donutChartCanvas.height);

        let total = data.reduce((acc, val) => acc + val, 0);
        let startAngle = 0;
        let colors = ["#FF6B6B", "#54A0FF", "#FEC657", "#2ED573", "#FF9FF3"];

        data.forEach((value, index) => {
            if (value > 0) {
                let sliceAngle = (value / total) * 2 * Math.PI;
                ctx.fillStyle = colors[index % colors.length];
                ctx.beginPath();
                ctx.moveTo(75, 75);
                ctx.arc(75, 75, 75, startAngle, startAngle + sliceAngle);
                ctx.closePath();
                ctx.fill();
                startAngle += sliceAngle;
            }
        });

        // 🏷️ Add Labels
        ctx.fillStyle = "#000";
        ctx.font = "9px Arial";
        ctx.textAlign = "center"; // Align text to the center
        ctx.fillText("Expenses 💸", 80, 9); // Centered below donut chart
    }

    function drawLineChart(data) {
        let ctx = lineChartCanvas.getContext("2d");
        ctx.clearRect(0, 0, lineChartCanvas.width, lineChartCanvas.height);

        ctx.beginPath();
        ctx.strokeStyle = "#2ED573";
        ctx.lineWidth = 2;
        ctx.moveTo(0, 150 - (data[0] / initialAmount) * 150);

        data.forEach((value, index) => {
            ctx.lineTo(index * (300 / 31), 150 - (value / initialAmount) * 150);
        });

        ctx.stroke();

// ✅ Draw X and Y Axes
ctx.strokeStyle = "#000";
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(0, 150);
ctx.lineTo(300, 150); // X-axis
ctx.moveTo(0, 0);
ctx.lineTo(0, 150); // Y-axis (shifted for visibility)
ctx.stroke();

// ✅ Adjusted labels for proper alignment
ctx.fillStyle = "#000";
ctx.font = "10px Arial";
ctx.textAlign = "center";

// Centered at the bottom of the X-axis
ctx.fillText("Days 📅", 280, 147);

// Left of Y-axis, properly visible
ctx.textAlign = "right";
ctx.fillText("Spent 💸", 50, 12);
}
    await fetchMonths();
});
