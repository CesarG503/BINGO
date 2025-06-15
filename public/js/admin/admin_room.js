import getCookieValue from '/js/util/get_cookie.js';
import API_BASE_URL from '/js/util/base_url.js';

const idRoom = document.getElementById('id-room');
const btnNuevo = document.getElementById('btn-new-number');
const numeroActual = document.getElementById('numero-actual');
const numerosLlamados = document.getElementById('numeros-llamados');
const jugadores = document.getElementById('jugadores');

/*socket.on('nuevoNumero', (data) => {
    console.log(data["extraido"]);
    numeroActual.textContent = data["extraido"];
    const p = document.createElement('p');
    p.textContent = data["extraido"];
    numerosLlamados.appendChild(p);
});*/

btnNuevo.addEventListener('click', () => {
    socket.emit('getNuevoNumero');
});

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
    else if(sala.estado !== 0){
        alert("La sala ya ha comenzado o ya finalizo.");
        //Redireccionar a la pagina de inicio o a otra pagina
        return;
    }
    else if(sala.host !== usuario.id_usuario){
        alert("No tienes permiso para administrar esta sala.");
        //Redireccionar a la pagina de inicio o a otra pagina
        return;
    }
    
    renderUsuariosEnSala();

    const token = getCookieValue("token");
    if(!token){
        alert("Error inesperado, no posees un usuario valido.");
    }
    const socket = io({auth: {token}});

    socket.emit('unirseSala', idRoom.textContent);

    socket.on('nuevoUsuario', (data) => {
        renderUsuariosEnSala();
    });

    socket.on('usuarioAbandono', () => {
        renderUsuariosEnSala(idRoom.textContent);
    });

}

inicializar();