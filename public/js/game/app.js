const btnNewNumber = document.getElementById("newNumber");
import { iniciarRuletazo } from "./game.js";
// Iniciar ruletazo con el boton
btnNewNumber.addEventListener("click", async (e) => {
  e.preventDefault();
  btnNewNumber.disabled = true;
  await iniciarRuletazo();
  btnNewNumber.disabled = false;
});









