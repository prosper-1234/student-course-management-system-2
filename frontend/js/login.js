// Simple client-side demo auth for the local login page.
// Users can sign in directly without entering email or password.
(function () {
  const loginBtn = document.getElementById('loginBtn');
  const spinner = document.querySelector('.login-btn-spinner');

  if (!loginBtn) return;

  loginBtn.addEventListener('click', function () {
    spinner.classList.remove('hidden');
    loginBtn.disabled = true;

    setTimeout(() => {
      spinner.classList.add('hidden');
      sessionStorage.setItem('scms_logged_in', 'true');
      window.location.href = './index.html';
    }, 300);
  });
})();