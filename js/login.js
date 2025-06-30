// Configuración de la API
const API_BASE_URL = "https://ultranet-2ei6.onrender.com/user"

// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const acceptBtn = document.getElementById('acceptBtn');
const cancelBtn = document.getElementById('cancelBtn');
const loading = document.getElementById('loading');
const message = document.getElementById('message');

// Event listeners
loginForm.addEventListener('submit', handleLogin);
cancelBtn.addEventListener('click', clearForm);

// Manejar el login
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(loginForm);
    const loginData = {
        emailUser: formData.get('email'),
        passwordUser: formData.get('password')
    };

    // Validar campos
    if (!loginData.emailUser || !loginData.passwordUser) {
        showMessage('Por favor, complete todos los campos', 'error');
        return;
    }

    if (!isValidEmail(loginData.emailUser)) {
        showMessage('Por favor, ingrese un email válido', 'error');
        return;
    }

    try {
        showLoading(true);
        
        // Verificar conectividad primero
        console.log('Intentando conectar a:', `${API_BASE_URL}/login`);
        
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        console.log('Respuesta recibida:', response.status, response.statusText);

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Credenciales incorrectas');
            } else if (response.status === 404) {
                throw new Error('Usuario no encontrado');
            } else if (response.status === 400) {
                throw new Error('Datos de solicitud inválidos');
            } else {
                throw new Error(`Error del servidor: ${response.status}`);
            }
        }

        const userData = await response.json();
        
        // Login exitoso
        showMessage('¡Login exitoso! Redirigiendo...', 'success');
        
        // Guardar datos del usuario en memoria (no localStorage por restricciones)
        window.currentUser = userData;
        
        // Redirigir a shopping.html después del login exitoso
        setTimeout(() => {
            window.location.href = 'shopping.html';
        }, 1500);

    } catch (error) {
        console.error('Error completo en login:', error);
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            showMessage('No se puede conectar al servidor. Verifique que esté ejecutándose en localhost:8080', 'error');
        } else {
            showMessage(error.message || 'Error al iniciar sesión', 'error');
        }
    } finally {
        showLoading(false);
    }
}

// Limpiar formulario
function clearForm() {
    loginForm.reset();
    hideMessage();
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar/ocultar loading
function showLoading(show) {
    loading.style.display = show ? 'block' : 'none';
    acceptBtn.disabled = show;
    
    if (show) {
        acceptBtn.textContent = 'Authenticating...';
    } else {
        acceptBtn.textContent = 'Accept';
    }
}

// Mostrar mensaje
function showMessage(text, type) {
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = 'block';
    
    // Auto-ocultar después de 5 segundos si es de éxito
    if (type === 'success') {
        setTimeout(hideMessage, 5000);
    }
}

// Ocultar mensaje
function hideMessage() {
    message.style.display = 'none';
}

// Efectos adicionales para los inputs
document.querySelectorAll('.form-input').forEach(input => {
    input.addEventListener('focus', function() {
        this.parentElement.style.transform = 'scale(1.02)';
    });
    
    input.addEventListener('blur', function() {
        this.parentElement.style.transform = 'scale(1)';
    });
});

// Efecto de partículas en el fondo (opcional)
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