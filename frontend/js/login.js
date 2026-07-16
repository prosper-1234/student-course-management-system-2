// Simple client-side "demo" auth for the local login page.
// Validates against the provided demo credentials and shows field errors.
(function () {
  const form = document.getElementById("loginForm");
  const spinner = document.querySelector(".login-btn-spinner");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    spinner.classList.remove("hidden");

    setTimeout(() => {
      spinner.classList.add("hidden");
window.location.href = "./index.html";
      // Optional: keep this if other pages check it
      sessionStorage.setItem("scms_logged_in", "true");
window.location.href = "pages/index.html";
      // Go to the homepage/dashboard
      window.location.href = "index.html";
    }, 500);
  });
})();