// Configuración de la API
const API_BASE_URL = 'http://localhost:8080/user';

// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const acceptBtn = document.getElementById('acceptBtn');
const cancelBtn = document.getElementById('cancelBtn');
const loading = document.getElementById('loading');
const message = document.getElementById('message');

// Event listeners
registerForm.addEventListener('submit', handleRegister);
cancelBtn.addEventListener('click', clearForm);

// Validación en tiempo real de la contraseña
document.getElementById('password').addEventListener('input', validatePassword);

// Manejar el registro
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(registerForm);
    const registerData = {
        name: formData.get('name').trim(),
        email: formData.get('email').trim(),
        password: formData.get('password'),
        type: formData.get('type')
    };

    // Validaciones
    if (!validateForm(registerData)) {
        return;
    }

    try {
        showLoading(true);
        
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData)
        });

        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('El email ya está registrado');
            } else if (response.status === 400) {
                throw new Error('Datos inválidos. Verifique la información ingresada');
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        }

        const userData = await response.json();
        
        // Registro exitoso
        showMessage('¡Cuenta creada exitosamente! Redirigiendo al login...', 'success');
        
        // Redirigir al login después de 2 segundos
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);

    } catch (error) {
        console.error('Error en registro:', error);
        showMessage(error.message || 'Error al crear la cuenta', 'error');
    } finally {
        showLoading(false);
    }
}

// Validar formulario
function validateForm(data) {
    // Validar nombre
    if (!data.name || data.name.length < 2) {
        showMessage('El nombre debe tener al menos 2 caracteres', 'error');
        return false;
    }

    // Validar email
    if (!data.email || !isValidEmail(data.email)) {
        showMessage('Por favor, ingrese un email válido', 'error');
        return false;
    }

    // Validar contraseña
    if (!data.password || !isValidPassword(data.password)) {
        showMessage('La contraseña debe tener al menos 6 caracteres, incluir mayúsculas, números y símbolos', 'error');
        return false;
    }

    // Validar tipo
    if (!data.type) {
        showMessage('Por favor, seleccione un tipo de usuario', 'error');
        return false;
    }

    return true;
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar contraseña
function isValidPassword(password) {
    // Al menos 6 caracteres, una mayúscula, un número y un símbolo
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
    return passwordRegex.test(password);
}

// Validación en tiempo real de contraseña
function validatePassword() {
    const password = document.getElementById('password').value;
    const requirements = document.querySelector('.password-requirements');
    
    if (password.length === 0) {
        requirements.style.color = 'rgba(255, 255, 255, 0.8)';
        return;
    }
    
    if (isValidPassword(password)) {
        requirements.style.color = '#4CAF50';
        requirements.textContent = '✓ Contraseña válida';
    } else {
        requirements.style.color = '#f44336';
        requirements.textContent = 'Mínimo 6 caracteres, incluye mayúsculas, números y símbolos';
    }
}

// Limpiar formulario
function clearForm() {
    registerForm.reset();
    hideMessage();
    document.querySelector('.password-requirements').style.color = 'rgba(255, 255, 255, 0.8)';
    document.querySelector('.password-requirements').textContent = 'Mínimo 6 caracteres, incluye mayúsculas, números y símbolos';
}

// Mostrar/ocultar loading
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    acceptBtn.disabled = show;
    
    if (show) {
        acceptBtn.textContent = 'Creating...';
    } else {
        acceptBtn.textContent = 'Accept';
    }
}

// Mostrar mensaje
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    // Auto-ocultar después de 8 segundos si es de error
    if (type === 'error') {
        setTimeout(hideMessage, 8000);
    }
}

// Ocultar mensaje
function hideMessage() {
    message.style.display = 'none';
}

// Efectos adicionales para los inputs
document.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Efecto de partículas en el fondo
function createParticle() {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '4px';
    particle.style.height = '4px';
    particle.style.background = 'rgba(255, 255, 255, 0.5)';
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = window.innerHeight + 'px';
    particle.style.zIndex = '1';
    
    document.body.appendChild(particle);
    
    let yPos = window.innerHeight;
    const xPos = parseFloat(particle.style.left);
    const speed = Math.random() * 3 + 1;
    
    const animateParticle = () => {
        yPos -= speed;
        particle.style.top = yPos + 'px';
        
        if (yPos < -10) {
            particle.remove();
        } else {
            requestAnimationFrame(animateParticle);
        }
    };
    
    animateParticle();
}

// Crear partículas ocasionalmente
setInterval(createParticle, 2000);

// Prevenir envío de formulario con Enter en campos específicos
document.querySelectorAll('.form-input, .form-select').forEach(input => {
    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && this.type !== 'submit') {
            e.preventDefault();
            // Mover al siguiente campo
            const inputs = Array.from(document.querySelectorAll('.form-input, .form-select'));
            const currentIndex = inputs.indexOf(this);
            if (currentIndex < inputs.length - 1) {
                inputs[currentIndex + 1].focus();
            }
        }
    });
});