function logout() {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  localStorage.removeItem('uid'); // Eliminar el uid del localStorage
  window.location.href = '/';
}