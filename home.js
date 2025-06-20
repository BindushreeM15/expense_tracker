document.addEventListener("DOMContentLoaded", function () {
    const menuBtn = document.querySelector(".menu-btn");
    const sidebar = document.querySelector(".sidebar");
    const logoutBtn = document.getElementById("logout");

    // Toggle Sidebar (Hamburger Menu)
    menuBtn.addEventListener("click", function () {
        sidebar.classList.toggle("active");
    });

    // Logout Functionality
    logoutBtn.addEventListener("click", function () {
        sessionStorage.removeItem("loggedInUser");
        alert("Logged out successfully!");
        window.location.href = "login.html"; // Redirect to login page
    });

    // Ensure user is logged in
    if (!sessionStorage.getItem("loggedInUser")) {
        window.location.href = "login.html";
    }
});
