document.addEventListener("DOMContentLoaded", async function () {
    const amountInput = document.getElementById("amount");
    const fromCurrency = document.getElementById("fromCurrency");
    const toCurrency = document.getElementById("toCurrency");
    const swapButton = document.getElementById("swap");
    const convertedAmount = document.getElementById("convertedAmount");
    const saveConversionButton = document.getElementById("saveConversion");
    const conversionHistory = document.getElementById("conversionHistory");
    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.querySelector(".sidebar");

    const exchangeApiUrl = "https://api.exchangerate-api.com/v4/latest/USD";
    const dbUrl = "http://localhost:3000/currencyConversions";

    let exchangeRates = {};
    menuBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        container.classList.toggle("open");
    });
    
    // Fetch exchange rates
    async function fetchRates() {
        try {
            const response = await fetch(exchangeApiUrl);
            const data = await response.json();
            exchangeRates = data.rates;
            populateDropdowns();
        } catch (error) {
            console.error("Error fetching exchange rates:", error);
        }
    }

    // Populate currency dropdowns
    function populateDropdowns() {
        const currencies = Object.keys(exchangeRates);
        fromCurrency.innerHTML = toCurrency.innerHTML = currencies
            .map(currency => `<option value="${currency}">${currency}</option>`)
            .join("");

        fromCurrency.value = "USD";
        toCurrency.value = "INR";
    }

    // Convert currency
    function convertCurrency() {
        const amount = parseFloat(amountInput.value);
        if (!amount || amount <= 0) {
            convertedAmount.textContent = "Converted Amount: --";
            return null;
        }

        const from = fromCurrency.value;
        const to = toCurrency.value;
        const result = (amount * exchangeRates[to]) / exchangeRates[from];

        convertedAmount.textContent = `Converted Amount: ${result.toFixed(2)} ${to}`;
        return result.toFixed(2);
    }

    // Swap currencies
    swapButton.addEventListener("click", function () {
        [fromCurrency.value, toCurrency.value] = [toCurrency.value, fromCurrency.value];
        convertCurrency();
    });

    // Save conversion to JSON Server
    saveConversionButton.addEventListener("click", async function () {
        const amount = parseFloat(amountInput.value);
        if (!amount || amount <= 0) {
            alert("Enter a valid amount!");
            return;
        }

        const from = fromCurrency.value;
        const to = toCurrency.value;
        const converted = convertCurrency();
        if (!converted) return;

        const timestamp = new Date().toISOString();

        // Fetch full currency names
        const namesApiUrl = "https://open.er-api.com/v6/latest/USD"; // Example API for currency names
        let fromName = from, toName = to;

        try {
            const response = await fetch(namesApiUrl);
            const data = await response.json();
            const currencyNames = data.names;
            fromName = currencyNames[from] || from;
            toName = currencyNames[to] || to;
        } catch (error) {
            console.warn("Could not fetch currency names, using codes instead.");
        }

        const conversionData = { amount, fromCurrency: from, toCurrency: to, fromName, toName, convertedAmount: converted, timestamp };

        try {
            const res = await fetch(dbUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(conversionData)
            });

            if (!res.ok) throw new Error("Failed to save conversion");

            alert("Conversion saved! ✅");
            fetchConversionHistory();
        } catch (error) {
            console.error("Error saving conversion:", error);
        }
    });

    // Fetch conversion history
    async function fetchConversionHistory() {
        try {
            const response = await fetch(dbUrl);
            const data = await response.json();

            conversionHistory.innerHTML = "";
            data.forEach(entry => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `
                    ${entry.amount} ${entry.fromCurrency} (${entry.fromName}) 
                    ➝ ${entry.convertedAmount} ${entry.toCurrency} (${entry.toName}) 
                    <br> <small>${new Date(entry.timestamp).toLocaleString()}</small>
                    <button class="delete-btn" data-id="${entry.id}">🗑️ Delete</button>
                `;
                conversionHistory.appendChild(listItem);
            });

            // Attach delete event listeners
            document.querySelectorAll(".delete-btn").forEach(button => {
                button.addEventListener("click", deleteConversion);
            });

        } catch (error) {
            console.error("Error fetching conversion history:", error);
        }
    }

    // Delete a conversion from history
    async function deleteConversion(event) {
        const conversionId = event.target.dataset.id;
        if (!conversionId) return;

        if (!confirm("Are you sure you want to delete this conversion?")) return;

        try {
            const res = await fetch(`${dbUrl}/${conversionId}`, { method: "DELETE" });

            if (!res.ok) throw new Error("Failed to delete conversion");

            alert("Conversion deleted! 🗑️");
            fetchConversionHistory();
        } catch (error) {
            console.error("Error deleting conversion:", error);
        }
    }

    amountInput.addEventListener("input", convertCurrency);
    fromCurrency.addEventListener("change", convertCurrency);
    toCurrency.addEventListener("change", convertCurrency);

    await fetchRates();
    fetchConversionHistory();
});
