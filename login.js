document.addEventListener("DOMContentLoaded", function () {
    const registerBtn = document.getElementById("register");
    const loginBtn = document.getElementById("login");
    const container = document.getElementById("container");

    // Toggle Between Sign Up & Sign In Forms
    registerBtn.addEventListener("click", () => {
        container.classList.add("active");
    });

    loginBtn.addEventListener("click", () => {
        container.classList.remove("active");
    });

    // Sign Up Functionality (Save User in `db.json`)
    document.querySelector(".sign-up form").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form submission

        let name = this.querySelector("input[type='text']").value;
        let email = this.querySelector("input[type='email']").value;
        let password = this.querySelector("input[type='password']").value;

        if (name && email && password) {
            // Check if user already exists in `db.json`
            fetch("http://localhost:3000/users")
                .then(response => response.json())
                .then(users => {
                    if (users.some(user => user.email === email)) {
                        alert("User already exists! Please sign in.");
                        return;
                    }

                    // Store new user in `db.json`
                    fetch("http://localhost:3000/users", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ name, email, password, lastLogin: null })
                    })
                    .then(() => {
                        alert("Account created successfully! Please sign in.");
                        container.classList.remove("active"); // Switch to login form
                    });
                });
        } else {
            alert("Please fill in all fields.");
        }
    });

    // Sign In Functionality (Check User in `db.json`)
    document.querySelector(".sign-in form").addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent form submission

        let email = this.querySelector("input[type='email']").value;
        let password = this.querySelector("input[type='password']").value;

        fetch("http://localhost:3000/users")
            .then(response => response.json())
            .then(users => {
                let user = users.find(user => user.email === email && user.password === password);

                if (user) {
                    // Update last login time in `db.json`
                    fetch(`http://localhost:3000/users/${user.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ lastLogin: new Date().toISOString() })
                    })
                    .then(() => {
                        sessionStorage.setItem("loggedInUser", JSON.stringify(user));
                        alert("Login successful! Redirecting...");
                        window.location.href = "home.html"; // Redirect to home page
                    });
                } else {
                    alert("Invalid email or password.");
                }
            });
    });
});
