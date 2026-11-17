function executeLogout() {
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem("selectedCartones");
  }
  window.location.href = "/";
}

function logout() {
  if (typeof Swal !== "undefined") {
    Swal.fire({
      title: "¿Cerrar sesión?",
      text: "¿Estás seguro de que deseas salir?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      background: "#1c1f2e",
      color: "#ffffff"
    }).then((result) => {
      if (result.isConfirmed) {
        executeLogout();
      }
    });
  } else {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      executeLogout();
    }
  }
}
