// Simple client-side "demo" auth for the local login page.
// Validates against the provided demo credentials and shows field errors.

(function () {
  const VALID = {
    email: 'v.baravil5683@miva.edu.ng',
    password: '2025/A/CYB/0176',
  };

  const form = document.getElementById('loginForm');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const emailError = document.getElementById('emailError');
  const passwordError = document.getElementById('passwordError');
  const spinner = document.querySelector('.login-btn-spinner');

  function clearErrors() {
    [emailInput, passwordInput].forEach((el) => el.classList.remove('invalid'));
    emailError.textContent = '';
    passwordError.textContent = '';
  }

  function init() {
    const email = new URLSearchParams(window.location.search).get('email');
    if (email) emailInput.value = email;
  }

  function showError(input, errorEl, message) {
    input.classList.add('invalid');
    errorEl.textContent = message;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearErrors();

    const email = (emailInput.value || '').trim();
    const password = (passwordInput.value || '').trim();

    // show spinner briefly to mimic processing
    spinner.classList.remove('hidden');

    setTimeout(() => {
      spinner.classList.add('hidden');

      if (email.toLowerCase() !== VALID.email.toLowerCase()) {
        showError(emailInput, emailError, 'Email not recognized.');
        emailInput.focus();
        return;
      }

      if (password !== VALID.password) {
        showError(passwordInput, passwordError, 'Incorrect password.');
        passwordInput.focus();
        return;
      }

      // Success: save authenticated flag and redirect to dashboard
      sessionStorage.setItem('scms_logged_in', 'true');
      window.location.href = 'index.html';
    }, 700);
  });

  init();
})();
