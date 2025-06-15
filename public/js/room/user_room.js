import getCookieValue from '/js/util/get_cookie.js';
import API_BASE_URL from '/js/util/base_url.js';

let socket;

const btnAbandonar = document.getElementById('btn-abandonar-sala');

btnAbandonar.addEventListener('click', () => {
    abandonarSala();
});

async function unirseSala(){
    const token = getCookieValue("token");
    if(!token){
        alert("Error inesperado, no posees un usuario valido.");
        return;
    }
    socket = io({auth: {token}});

    const idRoom = document.getElementById('idRoom');
    const sala = await getSala(idRoom.textContent);

    if(!sala){
        console.error("No se pudo obtener la sala");
        return;
    }
    else if(sala.estado !== 0){
        alert("La sala ya ha comenzado o ya finalizo.");
        //Redireccionar a la pagina de inicio o a otra pagina
        return;
    }

    const usuario = await getUsuario();
    const registro = await registrarseSala(idRoom.textContent);

    if(!registro){
        console.error("Error al registrarse en la sala");
        return;
    }

    socket.emit('unirseSala', idRoom.textContent);

    if(registro.registrado){
        socket.emit('nuevoUsuario',{
            id_room: idRoom.textContent,
            username: usuario.username,
            img_id: usuario.img_id,
        });
    }

    socket.on('nuevoUsuario', (data) => {
        renderUsuariosEnSala(idRoom.textContent);
    });

    socket.on('usuarioAbandono', () => {
        renderUsuariosEnSala(idRoom.textContent);
    });

    renderUsuariosEnSala(idRoom.textContent);
}

async function getUsuario(){
    const response = await fetch(`${API_BASE_URL}/api/usuarios/actual`);

    if (!response.ok) {
        console.log("Error al obtener el usuario actual");
        return null;
    }

    return await response.json();
}

async function getSala(id_room){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}`);

    if (!response.ok) {
        console.error("Error al obtener la sala");
        return null;
    }

    return await response.json();
}

async function registrarseSala(id_room){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}/registrarse`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        console.error("Error al registrarse en la sala");
        return;
    }

    return await response.json();
}

async function getUsuariosEnSala(id_room){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}/usuarios`);
    if (!response.ok) {
        console.error("Error al obtener los usuarios en la sala");
        return null;
    }
    return await response.json();
}

async function renderUsuariosEnSala(id_room){
    const usuarios = await getUsuariosEnSala(id_room);
    if (!usuarios) {
        console.error("No se pudieron obtener los usuarios en la sala");
        return;
    }
    
    const jugadores = document.getElementById('jugadores');
    jugadores.innerHTML = ''; // Limpiar la lista antes de renderizar

    usuarios.forEach(usuario => {
        const li = document.createElement('li');
        const div = document.createElement('div');
        const img = document.createElement('img');
        const p = document.createElement('p');

        img.src = `https://bingo-api.mixg-studio.workers.dev/api/profile/${usuario.img_id}`;
        img.width = '50';
        img.height = '50';
        p.textContent = usuario.username;
        div.appendChild(img);
        div.appendChild(p);
        li.appendChild(div);
        jugadores.appendChild(li);
    });
}

async function abandonarSala() {
    const idRoom = document.getElementById('idRoom');
    const response = await fetch(`${API_BASE_URL}/api/partidas/${idRoom.textContent}/abandonar`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        console.error("Error al abandonar la sala");
        return;
    }

    const result = await response.json();
    if (result.success) {
        socket.emit('abandonarSala', idRoom.textContent);
        socket.disconnect(); // Desconectar el socket
        alert("Has abandonado la sala.");
        window.location.href = '/index'; // Redirigir a la página de inicio
    } else {
        console.error("No se pudo abandonar la sala");
    }
}

unirseSala();