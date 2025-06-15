let usuarios = [];

function RenderizarUsuarios() {
    const tbody = document.getElementById('usuarioTableBody');
    tbody.innerHTML = '';
    usuarios.forEach((usuario, index) => {
        const row = `
            <tr>
                <td>${index + 1}</td>
                <td>${usuario.username}</td>
                <td>${usuario.email}</td>
                <td>${usuario.password}</td>
                <td>${usuario.rol}</td>
                <td>${usuario.creditos}</td>
                <td>${usuario.img_id || ''}</td>
                <td>
                    <button class="btn btn-warning btn-sm" onclick="EditarUsuarioModal(${index})">Editar</button>
                    <button class="btn btn-danger btn-sm" onclick="EliminarUsuario(${index})">Eliminar</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    console.log('Usuarios renderizados:', usuarios);
}

let urlUsuario = `/api/usuarios`;

function MostrarUsuarios() {
    fetch(urlUsuario)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        usuarios = data;
        RenderizarUsuarios();
    })
    .catch(error => {
        console.error('Error fetching usuarios:', error);
    });
}

function MostrarUsuario(userId) {
    fetch(`${urlUsuario}/${userId}`)
    .then(response => response.json())
    .then(data => {
        document.getElementById('username').textContent = data.username;
    })
    .catch(error => {
        console.error('Error fetching usuario:', error);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('uid');
    if (userId) {
        MostrarUsuario(userId);
    }
});
document.addEventListener('DOMContentLoaded', MostrarUsuarios);

function AgregarUsuarioModal() {
    Swal.fire({
        title: 'Agregar Usuario',
        html: `
            <input type="text" id="usuarioUsername" class="swal2-input" placeholder="Username">
            <input type="email" id="usuarioEmail" class="swal2-input" placeholder="Email">
            <input type="password" id="usuarioPassword" class="swal2-input" placeholder="Contraseña">
            <input type="number" id="usuarioRol" class="swal2-input" placeholder="Rol (0 o 1)">
            <input type="number" id="usuarioCreditos" class="swal2-input" placeholder="Créditos">
            <input type="text" id="usuarioImgId" class="swal2-input" placeholder="Img ID">
        `,
        confirmButtonText: 'Agregar',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const username = document.getElementById('usuarioUsername').value;
            const email = document.getElementById('usuarioEmail').value;
            const password = document.getElementById('usuarioPassword').value;
            const rol = document.getElementById('usuarioRol').value || 1;
            const creditos = document.getElementById('usuarioCreditos').value || 0;
            const img_id = document.getElementById('usuarioImgId').value;
            if (!username || !email || !password) {
                Swal.showValidationMessage('Por favor, completa los campos obligatorios');
                return false;
            }
            return { username, email, password, rol, creditos, img_id };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(urlUsuario, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(result.value)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    Swal.fire('Error', data.error, 'error');
                } else {
                    usuarios.push(data);
                    RenderizarUsuarios();
                    Swal.fire('Éxito', 'Usuario agregado correctamente', 'success');
                }
            })
            .catch(error => {
                Swal.fire('Error', 'No se pudo agregar el usuario', 'error');
            });
        }
    });
}

function EditarUsuarioModal(index) {
    const usuario = usuarios[index];
    Swal.fire({
        title: 'Editar Usuario',
        html: `
            <input type="text" id="usuarioUsername" class="swal2-input" placeholder="Username" value="${usuario.username}">
            <input type="email" id="usuarioEmail" class="swal2-input" placeholder="Email" value="${usuario.email}">
            <input type="password" id="usuarioPassword" class="swal2-input" placeholder="Contraseña">
            <input type="number" id="usuarioRol" class="swal2-input" placeholder="Rol (0 o 1)" value="${usuario.rol}">
            <input type="number" id="usuarioCreditos" class="swal2-input" placeholder="Créditos" value="${usuario.creditos}">
            <input type="text" id="usuarioImgId" class="swal2-input" placeholder="Img ID" value="${usuario.img_id || ''}">
        `,
        confirmButtonText: 'Guardar',
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        preConfirm: () => {
            const username = document.getElementById('usuarioUsername').value;
            const email = document.getElementById('usuarioEmail').value;
            const password = document.getElementById('usuarioPassword').value;
            const rol = document.getElementById('usuarioRol').value;
            const creditos = document.getElementById('usuarioCreditos').value;
            const img_id = document.getElementById('usuarioImgId').value;
            if (!username || !email) {
                Swal.showValidationMessage('Por favor, completa los campos obligatorios');
                return false;
            }
            return { username, email, password, rol, creditos, img_id };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${urlUsuario}/${usuario.id_usuario}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(result.value)
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    Swal.fire('Error', data.error, 'error');
                } else {
                    usuarios[index] = data;
                    RenderizarUsuarios();
                    Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
                }
            })
            .catch(error => {
                Swal.fire('Error', 'No se pudo actualizar el usuario', 'error');
            });
        }
    });
}

function EliminarUsuario(index) {
    const usuario = usuarios[index];
    Swal.fire({
        title: '¿Estás seguro?',
        text: "No puedes deshacer esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, borrarlo!'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${urlUsuario}/${usuario.id_usuario}`, {
                method: 'DELETE',
                headers: {
                }
            })
            .then(response => response.json())
            .then(data => {
                usuarios.splice(index, 1);
                RenderizarUsuarios();
                Swal.fire('Eliminado!', 'El usuario ha sido eliminado.', 'success');
            })
            .catch(error => {
                Swal.fire('Error', 'No se pudo eliminar el usuario', 'error');
            });
        }
    });
}