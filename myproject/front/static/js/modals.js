import { loadUploadCategories, loadUploadTags } from './filters.js';

// --- Управление модальными окнами ---
export function showModal(id) { 
    document.getElementById(id).style.display = 'flex'; 
}

export function hideModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

export function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

export function showLoginModal() {
    showModal('login-modal');
}

export function showRegisterModal() {
    showModal('register-modal');
}

export function showUploadModal() {
    showModal('upload-modal');
    loadUploadCategories();
    loadUploadTags();
}

export function showUploadResult(success, message) {
    const modal = document.getElementById('upload-result-modal');
    const msg = document.getElementById('upload-result-message');
    if (msg) {
        msg.textContent = message;
        msg.style.color = success ? "#00b894" : "#ff6b6b";
    }
    if (modal) {
        modal.style.display = 'flex';
    } else {
        alert(message);
    }
}

// --- Инициализация обработчиков модалок ---
export function setupModalHandlers() {
    // Закрытие по клику вне модалки
    window.onclick = (e) => {
        const modal = document.getElementById('my-sample-modal');
        if (e.target === modal) modal.style.display = 'none';
        ['upload-modal','login-modal','register-modal'].forEach(id => {
            if (e.target === document.getElementById(id)) hideModal(id);
        });
    };

    // Закрытие по крестику
    const mySampleClose = document.getElementById('my-sample-close');
    if (mySampleClose) {
        mySampleClose.onclick = function() {
            document.getElementById('my-sample-modal').style.display = 'none';
        };
    }
} 