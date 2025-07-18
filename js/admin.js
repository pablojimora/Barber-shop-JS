// Lógica de login y visualización de citas

document.addEventListener('DOMContentLoaded', function() {
    // Mostrar modal al hacer click en el botón
    document.getElementById('adminLoginBtn').onclick = function(event) {
        event.preventDefault();
        const modal = new bootstrap.Modal(document.getElementById('loginModal'));
        modal.show();
    };

    // Login simple
    document.getElementById('loginForm').onsubmit = function(e){
        e.preventDefault();
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        if(user === "admin" && pass === "1234"){
            bootstrap.Modal.getInstance(document.getElementById('loginModal')).hide();
            mostrarCitas();
        }else{
            document.getElementById('loginError').innerText = "Usuario o contraseña incorrectos";
        }
    };

    // Cerrar sesión
    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.onclick = function() {
            // Quita esta línea para no borrar las citas:
            // localStorage.removeItem('citas');
            document.getElementById('adminCitas').style.display = 'none';
        };
    }

    // Mostrar modal de días disponibles
    document.getElementById('btnDiasDisponibles').onclick = function() {
        actualizarListaDias();
        const modal = new bootstrap.Modal(document.getElementById('diasDisponiblesModal'));
        modal.show();
    };

    // Agregar día a la lista
    document.getElementById('agregarDia').onclick = function() {
        const nuevoDia = document.getElementById('nuevoDia').value;
        if (nuevoDia) {
            let dias = JSON.parse(localStorage.getItem('diasDisponibles')) || [];
            if (!dias.includes(nuevoDia)) {
                dias.push(nuevoDia);
                localStorage.setItem('diasDisponibles', JSON.stringify(dias));
                actualizarListaDias();
            }
        }
    };

    // Guardar días disponibles
    document.getElementById('diasDisponiblesForm').onsubmit = function(e) {
        e.preventDefault();
        bootstrap.Modal.getInstance(document.getElementById('diasDisponiblesModal')).hide();
    };
});

function mostrarDiasDisponiblesBtn() {
    // Solo muestra el botón si el admin está logueado
    document.getElementById('btnDiasDisponibles').style.display = 'block';
}

function mostrarCitas(){
    document.getElementById('adminCitas').style.display = 'block';
    mostrarDiasDisponiblesBtn();

    const container = document.getElementById('citasCardsContainer');
    container.innerHTML = "";

    const citas = obtenerCitas();
    if (!citas || citas.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay citas agendadas.</div>';
        return;
    }

    // Agrupa las citas por fecha
    const citasPorDia = {};
    citas.forEach(cita => {
        if (!citasPorDia[cita.fecha]) {
            citasPorDia[cita.fecha] = [];
        }
        citasPorDia[cita.fecha].push(cita);
    });

    function fechaLabel(fechaStr) {
        const hoy = new Date();
        const fecha = new Date(fechaStr);
        hoy.setHours(0,0,0,0);
        fecha.setHours(0,0,0,0);

        const diff = (fecha - hoy) / (1000 * 60 * 60 * 24);
        if (diff === 0) return "Hoy";
        if (diff === 1) return "Mañana";
        return fechaStr;
    }

    const row = document.createElement('div');
    row.className = 'row';

    Object.keys(citasPorDia).sort().forEach(fecha => {
        const card = document.createElement('div');
        card.className = 'col-md-6 mb-4';

        card.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <strong>${fechaLabel(fecha)}</strong>
                </div>
                <div class="card-body p-0">
                    <table class="table mb-0">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Celular</th>
                                <th>Hora</th>
                                <th>Servicio</th>
                                <th>Acción</th> <!-- Agrega esta columna -->
                            </tr>
                        </thead>
                        <tbody>
                            ${citasPorDia[fecha].map((cita, idx) => `
                                <tr>
                                    <td>${cita.nombre}</td>
                                    <td>${cita.celular}</td>
                                    <td>${cita.hora}</td>
                                    <td>${cita.servicio}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success finalizar-cita-btn" data-fecha="${fecha}" data-idx="${idx}">Finalizar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        row.appendChild(card);
    });

    container.appendChild(row);

    container.querySelectorAll('.finalizar-cita-btn').forEach(btn => {
        btn.onclick = function() {
            const fecha = btn.getAttribute('data-fecha');
            const idx = parseInt(btn.getAttribute('data-idx'));
            let citas = obtenerCitas();
            const citaFinalizada = citasPorDia[fecha][idx];

            // Guarda la cita finalizada
            let finalizadas = JSON.parse(localStorage.getItem('citasFinalizadas')) || [];
            finalizadas.push(citaFinalizada);
            localStorage.setItem('citasFinalizadas', JSON.stringify(finalizadas));

            // Elimina la cita de agendadas
            citas = citas.filter(c => !(c.fecha === fecha && c.nombre === citaFinalizada.nombre && c.celular === citaFinalizada.celular && c.hora === citaFinalizada.hora));
            localStorage.setItem('citas', JSON.stringify(citas));
            mostrarCitas();
            mostrarGraficaFinalizadas(); // <-- asegúrate de llamar aquí también
        };
    });
}

function actualizarListaDias() {
    let dias = JSON.parse(localStorage.getItem('diasDisponibles')) || [];
    const lista = document.getElementById('listaDias');
    lista.innerHTML = '';
    dias.forEach(dia => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.textContent = dia;
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-danger';
        btn.textContent = 'Eliminar';
        btn.onclick = function() {
            dias = dias.filter(d => d !== dia);
            localStorage.setItem('diasDisponibles', JSON.stringify(dias));
            actualizarListaDias();
        };
        li.appendChild(btn);
        lista.appendChild(li);
    });
}

function mostrarGraficaFinalizadas() {
    const canvas = document.getElementById('graficaFinalizadas');
    if (!canvas) return; // Si no existe el canvas, no hace nada
    const ctx = canvas.getContext('2d');
    let finalizadas = JSON.parse(localStorage.getItem('citasFinalizadas')) || [];
    // Agrupa por fecha
    const conteoPorFecha = {};
    finalizadas.forEach(cita => {
        conteoPorFecha[cita.fecha] = (conteoPorFecha[cita.fecha] || 0) + 1;
    });
    const labels = Object.keys(conteoPorFecha).sort();
    const data = labels.map(fecha => conteoPorFecha[fecha]);

    // Destruye gráfica anterior si existe
    if (window.graficaFinalizadasInstance) {
        window.graficaFinalizadasInstance.destroy();
    }

    window.graficaFinalizadasInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Citas Finalizadas',
                data: data,
                backgroundColor: 'rgba(40, 167, 69, 0.6)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// Llama a mostrarGraficaFinalizadas cuando se muestra la vista admin
function mostrarCitas(){
    document.getElementById('adminCitas').style.display = 'block';
    mostrarDiasDisponiblesBtn();

    const container = document.getElementById('citasCardsContainer');
    container.innerHTML = "";

    const citas = obtenerCitas();
    if (!citas || citas.length === 0) {
        container.innerHTML = '<div class="alert alert-info">No hay citas agendadas.</div>';
        return;
    }

    // Agrupa las citas por fecha
    const citasPorDia = {};
    citas.forEach(cita => {
        if (!citasPorDia[cita.fecha]) {
            citasPorDia[cita.fecha] = [];
        }
        citasPorDia[cita.fecha].push(cita);
    });

    function fechaLabel(fechaStr) {
        const hoy = new Date();
        const fecha = new Date(fechaStr);
        hoy.setHours(0,0,0,0);
        fecha.setHours(0,0,0,0);

        const diff = (fecha - hoy) / (1000 * 60 * 60 * 24);
        if (diff === 0) return "Hoy";
        if (diff === 1) return "Mañana";
        return fechaStr;
    }

    const row = document.createElement('div');
    row.className = 'row';

    Object.keys(citasPorDia).sort().forEach(fecha => {
        const card = document.createElement('div');
        card.className = 'col-md-6 mb-4';

        card.innerHTML = `
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <strong>${fechaLabel(fecha)}</strong>
                </div>
                <div class="card-body p-0">
                    <table class="table mb-0">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Celular</th>
                                <th>Hora</th>
                                <th>Servicio</th>
                                <th>Acción</th> <!-- Agrega esta columna -->
                            </tr>
                        </thead>
                        <tbody>
                            ${citasPorDia[fecha].map((cita, idx) => `
                                <tr>
                                    <td>${cita.nombre}</td>
                                    <td>${cita.celular}</td>
                                    <td>${cita.hora}</td>
                                    <td>${cita.servicio}</td>
                                    <td>
                                        <button class="btn btn-sm btn-success finalizar-cita-btn" data-fecha="${fecha}" data-idx="${idx}">Finalizar</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        row.appendChild(card);
    });

    container.appendChild(row);
    mostrarGraficaFinalizadas();
}