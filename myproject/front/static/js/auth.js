import { closeModal } from './modals.js';

// --- Управление пользователем ---
export function setUser(username) {
    document.querySelector('.login-btn').style.display = 'none';
    document.querySelector('.register-btn').style.display = 'none';
    document.querySelector('.upload-btn').style.display = 'inline-block';
    document.querySelector('.logout-btn').style.display = 'inline-block';
    localStorage.setItem('username', username);
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.textContent = username;
        userInfo.style.display = 'inline-block';
    }
}

export function clearUser() {
    document.querySelector('.login-btn').style.display = 'inline-block';
    document.querySelector('.register-btn').style.display = 'inline-block';
    document.querySelector('.upload-btn').style.display = 'none';
    document.querySelector('.logout-btn').style.display = 'none';
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    const userInfo = document.querySelector('.user-info');
    if (userInfo) {
        userInfo.textContent = '';
        userInfo.style.display = 'none';
    }
}

export async function logout() {
    try {
        await fetch('/api/logout/', {
            method: 'POST',
            headers: {
                'Authorization': 'Token ' + localStorage.getItem('token')
            }
        });
        clearUser();
        window.loadSamples();
    } catch (error) {
        console.error('Logout error:', error);
        clearUser();
    }
}

// --- Обработчики форм авторизации ---
export function setupAuthForms() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    let errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.remove();
    try {
        const res = await fetch('/api/login/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', username);
            setUser(username);
            closeModal('login-modal');
            window.loadSamples();
        } else {
            showLoginError(data.error || 'Login failed');
        }
    } catch (error) {
        showLoginError('Login failed. Please try again.');
    }
}

function showLoginError(msg) {
    let form = document.getElementById('login-form');
    if (!form) return;
    let errorMsg = document.createElement('div');
    errorMsg.id = 'login-error-msg';
    errorMsg.style.color = '#ff6b6b';
    errorMsg.style.marginTop = '10px';
    errorMsg.style.textAlign = 'center';
    errorMsg.textContent = msg;
    form.appendChild(errorMsg);
}

document.getElementById('login-username').addEventListener('input', () => {
    let errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.remove();
});

document.getElementById('login-password').addEventListener('input', () => {
    let errorMsg = document.getElementById('login-error-msg');
    if (errorMsg) errorMsg.remove();
});

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const res = await fetch('/api/register/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        
        if (data.token) {
            localStorage.setItem('token', data.token);
            setUser(username);
            closeModal('register-modal');
            window.loadSamples();
        } else {
            alert(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        alert('Registration failed. Please try again.');
    }
} 