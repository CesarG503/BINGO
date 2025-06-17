import getCookieValue from '/js/util/get_cookie.js';
import API_BASE_URL from '/js/util/base_url.js';

const btnAbandonar = document.getElementById('btn-abandonar-sala');
const espera = document.getElementById('espera');
const tablero = document.getElementById('tablero');
const numerosLlamados = document.getElementById('numeros-llamados');
const numeroActual = document.getElementById('numero-actual');

let socket;

btnAbandonar.addEventListener('click', () => {
    abandonarSala();
});

document.addEventListener("DOMContentLoaded", async (event) => {
    const sala = await getSala(idRoom.textContent);
    if(!sala){
        console.error("No se pudo obtener la salaaaaa");
        window.location.href = '/';
        return;
    }
});

async function unirseSala(){
    const idRoom = document.getElementById('idRoom');
    const token = getCookieValue("token");
    if(!token){
        alert("Error inesperado, no posees un usuario valido.");
        return;
    }
    //Validaciones del usuario
    const usuario = await getUsuario();
    if(!usuario){
        console.error("No se pudo obtener el usuario actual");
        return;
    }

    //Validaciones de la sala
    const sala = await getSala(idRoom.textContent);

    if(!sala){
        console.error("No se pudo obtener la sala");
        window.location.href = '/';
        return;
    }

    //Validacion si el usuario es el host
    if(sala.host == usuario.id_usuario){
        window.location.href = `/room/host/${sala.id_partida}`;
        return;
    }

    const registrado = await usuarioRegistrado(sala.id_partida);

    //Validacion del estado de la sala
    if(sala.estado === 1 && registrado){
        activarControles(sala.id_partida);
    }
    else if(sala.estado !== 0){
        alert("La sala ya ha comenzado o ya finalizo.");
        window.location.href = '/';
        return;
    }

    //Registrando al usuario en la sala si no está registrado
    const registro = await registrarseSala(sala.id_partida);

    if(!registro){
        console.error("Error al registrarse en la sala");
        return;
    }

    socket = io({auth: {token}});
    socket.emit('unirseSala', sala.id_partida);

    if(registro.registrado){
        socket.emit('nuevoUsuario',{
            id_room: sala.id_partida,
            username: usuario.username,
            img_id: usuario.img_id,
        });
    }

    socket.on('salaEliminada', (err) => {
        alert("La sala ha sido cerrada por el administrador.");
        socket.disconnect();
        window.location.href = '/';
    });

    socket.on('nuevoUsuario', (data) => {
        renderUsuariosEnSala(sala.id_partida);
    });

    socket.on('usuarioAbandono', () => {
        renderUsuariosEnSala(sala.id_partida);
    });

    socket.on('inicioSala', () => {
        activarControles(sala.id_partida);
    });

    socket.on('nuevoNumero',(numero) =>{
        renderNuevoNumero(numero);
    });

    renderUsuariosEnSala(sala.id_partida);
}

async function getUsuario(){
    const response = await fetch(`${API_BASE_URL}/api/usuarios/actual`);

    if (!response.ok) {
        console.log("Error al obtener el usuario actual");
        return;
    }

    return await response.json();
}

async function getSala(id_room){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}`);

    if (!response.ok) {
        console.error("Error al obtener la sala");
        return;
    }

    return await response.json();
}

//Valida que el usuario esté registrado en la sala
async function usuarioRegistrado(id_room){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}/registrado`);

    if (!response.ok) {
        console.error("Error al verificar si el usuario es miembro de la sala");
        return false;
    }

    const data = await response.json();
    return data.registrado;
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

async function renderNumerosLlamados(id_room) {
    const response = await fetch(`https://bingo-api.mixg-studio.workers.dev/api/partida/${id_room}`);
    if (!response.ok) {
        console.error("Error al obtener los números llamados");
        return;
    }
    const data = await response.json();
    numerosLlamados.innerHTML = ''; // Limpiar la lista antes de renderizar
    data.partida.numbers.forEach(numero => {
        const p = document.createElement('span');
        p.textContent = numero+" ";
        numerosLlamados.appendChild(p);
    });
}

async function renderNuevoNumero(numero) {
    numeroActual.textContent = numero;

    // Agregar el nuevo número a la lista de números llamados
    const p = document.createElement('span');
    p.textContent = numero+" ";
    numerosLlamados.appendChild(p);
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

async function activarControles(id_partida) {
    espera.setAttribute('hidden', '');
    tablero.removeAttribute('hidden');

    renderNumerosLlamados(id_partida);
}

unirseSala();