const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

function resetMessage(element) {
  setTimeout(() => {
    element.classList.add('hidden');
    setTimeout(() => {
      element.textContent = '';
      element.classList.remove('hidden');
    }, 1000);
  }, 3000);
}

function clearFields(form) {
  form.querySelectorAll('input').forEach(input => {
    if (input.type !== 'submit') {
      input.value = '';
    }
  });
}

// Detectar si estamos en local o en producción
const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000'
    : 'https://bingo-ivxo.onrender.com';

document.getElementById('sign-in-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const password = e.target.password.value;

  const response = await fetch(`/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  const messageElement = document.getElementById('sign-in-message');
  messageElement.textContent = '';
  if (data.token) {
    const date = new Date();
    date.setTime(date.getTime() + (1 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `token=${data.token}; ${expires} path=/;`; // Almacenar la cookie con el token
    messageElement.textContent = 'Inicio de sesion Exitoso!';
    messageElement.style.color = 'green';
    window.location.href = '/index'; // redirigir a la pagina principal con la sesion iniciada 
  } else {
    messageElement.textContent = 'Correo o contraseña Incorrectos.';
    messageElement.style.color = 'red';
  }
  resetMessage(messageElement);
});

//validar en tiempo real

const form = document.getElementById('sign-up-form');

const inputs = {
  username: form.username,
  email: form.email,
  password: form.password,
  passwordConfirm: form.passwordConfirm,
};

// Validación individual en tiempo real
Object.entries(inputs).forEach(([key, input]) => {
  input.addEventListener('input', () => {
    validarCampo(key);
  });
});

function validarCampo(id) {
  const valor = inputs[id].value.trim();
  const error = document.getElementById(`error-${id}`);
  error.textContent = '';

  if (id === 'username' && valor === '') {
    error.textContent = 'El nombre de usuario es obligatorio.';
  }

  if (id === 'email') {
    if (valor === '') {
      error.textContent = 'El correo es obligatorio.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) {
      error.textContent = 'El correo no tiene un formato válido.';
    }
  }
  const pass = document.getElementById('password');
  const errorPassword = document.getElementById('error-password');
  if (id === 'password' && valor === '') {
    
    pass.removeAttribute('oninput');
    error.classList.add('invalid');
    error.textContent = 'La contraseña es obligatoria.';
  }else{
    //errorPassword.textContent = 'La contraseña debe tener al menos 5 caracteres, una mayúscula, un número y un carácter especial.';
    pass.setAttribute("oninput", "validarPassword2(this)");
  }

  if (id === 'passwordConfirm') {
    if (valor === '') {
      error.textContent = 'Confirma tu contraseña.';
    }
  }
}

// Validación completa al enviar
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = e.target.username.value.trim();
  const email = e.target.email.value.trim();
  const password = e.target.password.value.trim();
  const passwordConfirm = e.target.passwordConfirm.value.trim();
  const message = document.getElementById("error-passwordConfirm");

  let hayErrores = false;

  Object.keys(inputs).forEach((id) => {
    validarCampo(id);
    if (document.getElementById(`error-${id}`).textContent !== '') {
      hayErrores = true;
    }
  });

  if (!hayErrores) {


    if (password === passwordConfirm) {
      //alert('✅ Formulario válido. Enviando...');

      const messageElement = document.getElementById('sign-up-message');
      messageElement.textContent = '';
      //mandar los datos
      const response = await fetch(`/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (data.success) {

        Swal.fire({
          title: 'Su perfil ha sido creado exitosamente!',
          html: `
      <br>
      <p>🃏 ¡Bienvenido a la mesa, jugador!
         Donde el azar se mezcla con la estrategia… 
         y la casa aún no sabe con quién se mete.</p>
      `,
          icon: 'success',
          confirmButtonText: 'Aceptar'
        }).then((e) => {
          container.classList.remove("sign-up-mode"); // Regresa al panel de iniciar sesion 
          clearFields(document.getElementById('sign-up-form')); // Limpia todos los imputs siempre que se llame
        });

        messageElement.textContent = 'Registro Exitoso';
        messageElement.style.color = 'green';

      } else {

        messageElement.textContent = 'No se pudo realizar el registro verifique los campos de registro.';
        messageElement.style.color = 'red';
      }
      messageElement.textContent = '';

      
    } else {
      message.textContent = 'Las contraseñas no coinciden';
    }

  } else {
    document.getElementById('sign-up-message').textContent = '';
  }
});

//Funcion para solo escribir letras en los inputs

function soloLetras(e) {
  const char = String.fromCharCode(e.keyCode || e.which);
  const letras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
  if (!letras.test(char)) {
    e.preventDefault();
    return false;
  }
  return true;
}

//funciones para validar contraseña



function validarPassword2(input) {
  const valor = input.value;
  const mensaje = document.getElementById('error-password');
  const confirm = document.getElementById('password-Confirm');

  const regex = /^(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{5,}$/;

  if (!regex.test(valor)) {
    confirm.disabled = true;
    confirm.value = '';
    mensaje.textContent = 'La contraseña debe tener al menos 5 caracteres, una mayúscula, un número y un carácter especial.';
    mensaje.classList.add('invalid');
    mensaje.classList.remove('valid');
  } else {
    mensaje.classList.add('valid');
    mensaje.classList.remove('invalid');
    confirm.disabled = false;
  }
}



