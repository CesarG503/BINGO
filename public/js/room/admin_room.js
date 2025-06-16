import getCookieValue from '/js/util/get_cookie.js';
import API_BASE_URL from '/js/util/base_url.js';

const btnEliminar = document.getElementById('btn-eliminar-sala');
const btnIniciar = document.getElementById('btn-iniciar-sala');
const idRoom = document.getElementById('id-room');
const btnNuevo = document.getElementById('btn-new-number');
const numeroActual = document.getElementById('numero-actual');
const numerosLlamados = document.getElementById('numeros-llamados');
const jugadores = document.getElementById('jugadores');
const controles = document.getElementById('controles');
const lobby = document.getElementById('espera');

let socket;

/*socket.on('nuevoNumero', (data) => {
    console.log(data["extraido"]);
    numeroActual.textContent = data["extraido"];
    const p = document.createElement('p');
    p.textContent = data["extraido"];
    numerosLlamados.appendChild(p);
});*/

async function getSala(){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${idRoom.textContent}`);
    if (!response.ok) {
        console.error("Error al obtener la sala");
        return response;
    }
    return await response.json();
}

async function getUsuario(){
    const response = await fetch(`${API_BASE_URL}/api/usuarios/actual`);
    if (!response.ok) {
        console.log("Error al obtener el usuario actual");
        return null;
    }
    return await response.json();
}

async function getNuevoNumero(id_room, id_host) {
    const response = await fetch(`https://bingo-api.mixg-studio.workers.dev/api/partida/${id_room}/extraer`);
    if (!response.ok) {
        console.error("Error al obtener un nuevo número");
        return;
    }
    const data = await response.json();
    socket.emit('getNuevoNumero',{extraido: data.extraido, id_room: id_room, host: id_host});
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

function renderNuevoNumero(numero){
    numeroActual.textContent = numero;

    // Agregar el nuevo número a la lista de números llamados
    const p = document.createElement('span');
    p.textContent = numero+" ";
    numerosLlamados.appendChild(p);
}

async function renderUsuariosEnSala() {
    const usuarios = await usuariosEnSala();
    if (!usuarios) {
        console.error("No se pudieron obtener los usuarios en la sala");
        return;
    }
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

async function usuariosEnSala(){
    const response = await fetch(`${API_BASE_URL}/api/partidas/${idRoom.textContent}/usuarios`);
    if (!response.ok) {
        console.error("Error al obtener los usuarios en la sala");
        return;
    }
    return await response.json();
}

async function eliminarSala(id_room, id_usuario) {
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}`,{
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });
    
    if (!response.ok) {
        console.error("Error al eliminar la sala");
        alert("No se obtuvo una respuesta valida del servidor.");
        return;
    }

    const result = await response.json();
    if (result.success) {
        socket.emit('salaEliminada', {
            id_room: id_room,
            host: id_usuario
        });
        socket.disconnect();
        window.location.href = '/'; // Redireccionar a la página de inicio
    } else {
        alert("No se pudo eliminar la sala. Inteténtalo de nuevo más tarde.");
    }
}

async function iniciarSala(id_room, id_usuario) {
    const response = await fetch(`${API_BASE_URL}/api/partidas/${id_room}/estado`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: 1 }) // Cambiar el estado a 1 (iniciado)
    });

    if (!response.ok) {
        console.error("Error al iniciar la sala");
        alert("No se pudo iniciar la sala. Inténtalo de nuevo.");
        console.log(await response.text());
        return;
    }


    socket.emit('iniciarSala', { 
            id_room: id_room, 
            host: id_usuario 
    });
}

async function activarControles(id_room, id_host){
    controles.removeAttribute('hidden');
    lobby.setAttribute('hidden', '');

    renderNumerosLlamados(id_room);

    btnNuevo.addEventListener('click', () => {
        getNuevoNumero(id_room, id_host);
    });
}

async function inicializar(){
    const sala = await getSala();
    const usuario = await getUsuario();
    if (!usuario) {
        console.error("No se pudo obtener el usuario actual");
        return;
    }

    if(!sala){
        console.error("No se pudo obtener la sala");
        return;
    }

    //Validacion de host
    if(sala.host !== usuario.id_usuario){
        alert("No tienes permiso para administrar esta sala.");
        window.location.href = '/';
        return;
    }
    //Validacion de estado
    else if(sala.estado === 1){
        activarControles(sala.id_partida, usuario.id_usuario);
    }
    else if(sala.estado !== 0){
        alert("La sala ya finalizo.");
        window.location.href = '/';
        return;
    }
    
    renderUsuariosEnSala();

    const token = getCookieValue("token");
    if(!token){
        alert("Error inesperado, no posees un usuario valido.");
    }
    socket = io({auth: {token}});

    socket.emit('unirseSala', sala.id_partida);

    socket.on('nuevoUsuario', (data) => {
        renderUsuariosEnSala();
    });

    socket.on('usuarioAbandono', () => {
        renderUsuariosEnSala(sala.id_partida);
    });

    socket.on('inicioSala', () => {
        activarControles(sala.id_partida, usuario.id_usuario);
    });

    socket.on('nuevoNumero',(numero) =>{
        renderNuevoNumero(numero);
    });

    btnIniciar.addEventListener('click', () => {
        iniciarSala(sala.id_partida, usuario.id_usuario);
    });

    btnEliminar.addEventListener('click', async () => eliminarSala(sala.id_partida, usuario.id_usuario));


}

inicializar();