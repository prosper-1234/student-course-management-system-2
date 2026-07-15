// auth.js — lightweight sign-out handler for the frontend demo

(function () {
  function signOut() {
    // Clear any demo session (localStorage/sessionStorage) if used
    try { sessionStorage.clear(); localStorage.removeItem('scms_session'); } catch (e) {}

    // Show a friendly toast then redirect to login
    if (window.Toast && typeof window.Toast.show === 'function') {
      Toast.show('Signed out successfully.', 'success');
    }

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 600);
  }

  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('logoutBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      const ok = window.confirm('Sign out from the portal?');
      if (ok) signOut();
    });
  });
})();
