// ===============================
// Función para cargar datos del perfil desde la API
// ===============================
async function cargarPerfil() {
    try {
        // Realiza una petición GET a la API para obtener los datos del usuario con ID 1
        const userId = localStorage.getItem('uid');
        const res = await fetch(`http://localhost:3000/api/usuarios/${userId}`);
        const data = await res.json();

        // Asigna los datos recibidos a los elementos del DOM
        document.getElementById('username').textContent = '@' + data.username;
        document.getElementById('email').textContent = data.email;
        document.getElementById('creditos').textContent = data.creditos;

        // Carga la imagen del perfil desde un API externa usando el img_id
        document.getElementById('mainProfileImg').src = 
            data.img_id 
                ? `https://bingo-api.mixg-studio.workers.dev/api/profile/${data.img_id}` 
                : 'default.jpg';

        // Aplicar clase "a" condicionalmente si img_id es '11'
        if (data.img_id === '11') {
            document.getElementById('botonCerrar').classList.add("a");
        } else {
            document.getElementById('botonCerrar').classList.remove("a");
        }

    } catch (error) {
        console.error('Error al cargar el perfil:', error);
    }
}

// ===============================
// Función para guardar los cambios del perfil
// ===============================
async function guardarPerfil() {
    const id = localStorage.getItem('uid'); // ID fijo o dinámico si implementas autenticación

    // Obtener elementos del DOM
    const usernameElem = document.getElementById('username');
    const emailElem = document.getElementById('email');
    const img = document.getElementById('mainProfileImg2');

    // Limpiar y preparar los valores a enviar
    const username = usernameElem.textContent.replace(/^@/, '').trim(); // Elimina el '@'
    const email = emailElem.textContent.trim();
    const img_id = img?.alt?.trim() || ''; // El alt contiene el ID de la imagen seleccionada

    // Validaciones básicas antes de enviar
    if (username === '' || email === '') {
        alert('Por favor completa todos los campos.');
        return;
    }

    if (!validarEmail(email)) {
        alert('El email no tiene un formato válido.');
        return;
    }

    try {
        console.log('Enviando datos:', { username, email, img_id });
        // Enviar una petición PUT para actualizar el perfil
        const response = await fetch(`http://localhost:3000/api/usuarios/perfil/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, img_id }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Error al actualizar perfil');
        }

        alert('¡Perfil actualizado correctamente!');
    } catch (error) {
        console.error('Error al actualizar el perfil:', error.message, error.stack);
    }
}

// Ejecutar al cargar la página
cargarPerfil();