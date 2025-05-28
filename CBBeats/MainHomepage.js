document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.get-started-btn');
  btn.addEventListener('click', () => {
    // Redirect to customer login or menu page
    window.location.href = 'customerlogin.php';
  });
});
