async function cargarPerfil() {
    try {
        const res = await fetch('http://localhost:3000/api/usuario/1'); // cambia 1 por otro ID si hace falta
        const data = await res.json();

        document.getElementById('username').textContent = '@' + data.username;
        document.getElementById('email').textContent = data.email;
        document.getElementById('creditos').textContent = data.creditos;
        document.getElementById('mainProfileImg').src = `https://bingo-api.mixg-studio.workers.dev/api/profile/${data.img_id}` || 'default.jpg';

        if (data.img_id === '11') {
            document.getElementById('botonCerrar').classList.add("a");
        } else {
            document.getElementById('botonCerrar').classList.remove("a");
        }

    } catch (error) {
        console.error('Error al cargar el perfil:', error);
    }
}

window.onload = cargarPerfil;

async function guardarPerfil() {
    const id = 1; // O el ID dinámico del usuario
    const usernameElem = document.getElementById('username');
    const emailElem = document.getElementById('email');
    const img = document.getElementById('mainProfileImg2');

    const username = usernameElem.textContent.replace(/^@/, '').trim();
    const email = emailElem.textContent.trim();
    const img_id = img?.alt?.trim() || '';

    if (username === '' || email === '') {
        alert('Por favor completa todos los campos.');
        return;
    }

    if (!validarEmail(email)) {
        alert('El email no tiene un formato válido.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/usuario/1`, {
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
        // res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
}

