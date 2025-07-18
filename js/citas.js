// Manejo de almacenamiento de citas en localStorage

function guardarCita(cita) {
    let citas = JSON.parse(localStorage.getItem('citas')) || [];
    // Verifica si ya existe una cita para ese nombre y fecha
    const existe = citas.some(c =>
        c.nombre.trim().toLowerCase() === cita.nombre.trim().toLowerCase() &&
        c.fecha === cita.fecha
    );
    if (existe) {
        alert('Ya tienes una cita agendada para ese día. Por favor selecciona otra fecha.');
        return false;
    }
    citas.push(cita);
    localStorage.setItem('citas', JSON.stringify(citas));
    return true;
}

function obtenerCitas() {
    return JSON.parse(localStorage.getItem('citas')) || [];
}

function cargarDiasDisponibles() {
    const select = document.getElementById('bb-date');
    if (select) {
        select.innerHTML = '<option value="">Selecciona un día disponible</option>';
        const dias = JSON.parse(localStorage.getItem('diasDisponibles')) || [];
        dias.forEach(dia => {
            const option = document.createElement('option');
            option.value = dia;
            option.textContent = dia;
            select.appendChild(option);
        });
    }
}

// Intercepta el formulario de agendar cita
document.addEventListener('DOMContentLoaded', function() {
    cargarDiasDisponibles();
    const form = document.getElementById('bb-booking-form');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const cita = {
                nombre: form['bb-name'].value, // Este debe ser el campo de "Nombre Completo"
                celular: form['bb-phone'].value,
                hora: form['bb-time'].value,
                servicio: form['bb-branch'].value,
                fecha: form['bb-date'].value,
                promo: form['bb-promo'] ? form['bb-promo'].value : ""
            };
            if (guardarCita(cita)) {
                alert('¡Cita agendada exitosamente!');
                form.reset();
            }
        });
    }
});