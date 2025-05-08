document.addEventListener('DOMContentLoaded', function() {
    // Загрузка фильтров
    loadFilterCategories();
    loadFilterTags();

    // Загрузка семплов
    loadSamples();

    // Обработка формы загрузки
    document.getElementById('upload-sample-form').addEventListener('submit', function(event) {
        event.preventDefault();
        uploadSample();
    });

    // Поиск
    document.getElementById('search-btn').onclick = () => loadSamples();

    // Категории
    document.getElementById('category').addEventListener('change', loadSamples);

    // Модальные окна
    document.getElementById('upload-link').onclick = () => {
        showModal('upload-modal');
        loadUploadCategories();
        loadUploadTags();
        selectedTags = [];
    };
    document.getElementById('close-modal').onclick = () => hideModal('upload-modal');
    document.getElementById('login-btn').onclick = () => showModal('login-modal');
    document.getElementById('close-login-modal').onclick = () => hideModal('login-modal');
    document.getElementById('register-btn').onclick = () => showModal('register-modal');
    document.getElementById('close-register-modal').onclick = () => hideModal('register-modal');
    document.getElementById('logout-btn').onclick = logout;

    // Проверка авторизации при загрузке
    if (localStorage.getItem('token') && localStorage.getItem('username')) {
        setUser(localStorage.getItem('username'));
    } else {
        clearUser();
    }

    // --- Красивый выбор файла ---
    document.getElementById('file').onchange = function() {
        document.getElementById('file-chosen').textContent = this.files[0] ? this.files[0].name : 'Choose file...';
    };
});

let selectedFilterTags = [];
function loadFilterCategories() {
    fetch('/api/categories/')
        .then(r => r.json())
        .then(data => {
            data.sort((a, b) => a.name.localeCompare(b.name));
            const select = document.getElementById('category');
            select.innerHTML = '<option value="">All Categories</option>';
            data.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        });
}
function loadFilterTags() {
    fetch('/api/tags/')
        .then(r => r.json())
        .then(data => {
            data.sort((a, b) => a.name.localeCompare(b.name));
            renderTagsFilterMultiselect(data);
        });
}
function renderTagsFilterMultiselect(tags) {
    const container = document.getElementById('tags-filter-multiselect');
    container.innerHTML = '';
    tags.forEach(tag => {
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-option' + (selectedFilterTags.includes(tag.id) ? ' selected' : '');
        tagDiv.textContent = tag.name;
        const plus = document.createElement('span');
        plus.className = 'plus';
        plus.innerHTML = '+';
        tagDiv.appendChild(plus);
        tagDiv.onclick = () => {
            if (selectedFilterTags.includes(tag.id)) {
                selectedFilterTags = selectedFilterTags.filter(id => id !== tag.id);
            } else {
                selectedFilterTags.push(tag.id);
            }
            renderTagsFilterMultiselect(tags);
            loadSamples();
        };
        container.appendChild(tagDiv);
    });
}
function loadSamples() {
    const category = document.getElementById('category').value;
    const tags = selectedFilterTags.join(',');
    const search = document.getElementById('search').value;
    let url = '/api/samples/?';
    if (category) url += `category=${category}&`;
    if (tags) url += `tags=${tags}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;

    fetch(url, {
        headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
    })
    .then(r => r.json())
    .then(data => {
        const grid = document.getElementById('samples-grid');
        grid.innerHTML = '';
        data.forEach(sample => {
            const card = document.createElement('div');
            card.className = 'sample-card';
            // Формируем теги
            let tagsHtml = '';
            if (sample.tags && sample.tags.length) {
                tagsHtml = `<div class="tags">` +
                    sample.tags.map(tag => `<span class="tag">${tag.name}</span>`).join(' ') +
                    `</div>`;
            }
            // Кнопка скачать только для залогиненных
            let downloadBtn = '';
            if (localStorage.getItem('token')) {
                downloadBtn = `
                    <a href="${sample.file_url}" download>
                        <button><i class="fas fa-download"></i> Download</button>
                    </a>
                `;
            } else {
                downloadBtn = `<button disabled title="Login to download"><i class="fas fa-download"></i> Download</button>`;
            }
            let audioHtml = '';
            if (sample.file_url) {
                audioHtml = `<audio controls src="${sample.file_url}" style="width:100%;margin:10px 0;"></audio>`;
            }
            card.innerHTML = `
                <h3>${sample.name}</h3>
                <p>${sample.description}</p>
                ${tagsHtml}
                ${audioHtml}
                <div class="actions">
                    ${downloadBtn}
                </div>
            `;
            grid.appendChild(card);
        });
    });
}

// --- Мультивыбор тегов ---
let selectedTags = [];
function renderTagsMultiselect(tags) {
    const container = document.getElementById('tags-multiselect');
    container.innerHTML = '';
    tags.forEach(tag => {
        const tagDiv = document.createElement('div');
        tagDiv.className = 'tag-option' + (selectedTags.includes(tag.id) ? ' selected' : '');
        tagDiv.textContent = tag.name;
        // Плюсик всегда на месте
        const plus = document.createElement('span');
        plus.className = 'plus';
        plus.innerHTML = '+';
        tagDiv.appendChild(plus);
        tagDiv.onclick = () => {
            if (selectedTags.includes(tag.id)) {
                selectedTags = selectedTags.filter(id => id !== tag.id);
            } else {
                selectedTags.push(tag.id);
            }
            renderTagsMultiselect(tags);
        };
        container.appendChild(tagDiv);
    });
}

// --- Загрузка тегов для мультивыбора ---
function loadUploadTags() {
    fetch('/api/tags/')
        .then(r => r.json())
        .then(data => {
            renderTagsMultiselect(data);
        });
}

// --- Загрузка категорий (оставь как было) ---
function loadUploadCategories() {
    fetch('/api/categories/')
        .then(r => r.json())
        .then(data => {
            const select = document.getElementById('category_id');
            select.innerHTML = '<option value="">Select category</option>';
            data.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        });
}

function uploadSample() {
    const formData = new FormData();
    formData.append('name', document.getElementById('name').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('file', document.getElementById('file').files[0]);
    formData.append('category_id', document.getElementById('category_id').value);
    selectedTags.forEach(tagId => formData.append('tag_ids', tagId));

    fetch('/api/samples/', {
        method: 'POST',
        body: formData,
        headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            showUploadResult(true, 'Sample uploaded successfully!');
            hideModal('upload-modal');
            loadSamples();
        } else {
            showUploadResult(false, data.error || 'Error uploading sample.');
        }
    })
    .catch(error => {
        showUploadResult(false, 'Error uploading sample.');
    });
}

function playSample(url) {
    const audio = new Audio(url);
    audio.play();
}

function downloadSample(id) {
    fetch(`/api/samples/${id}/`, {
        method: 'POST',
        headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
    })
    .then(response => response.json())
    .then(data => {
        alert('Download recorded!');
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showModal(id) { document.getElementById(id).style.display = 'flex'; }
function hideModal(id) { document.getElementById(id).style.display = 'none'; }
window.onclick = (e) => {
    ['upload-modal','login-modal','register-modal'].forEach(id => {
        if (e.target === document.getElementById(id)) hideModal(id);
    });
};

function setUser(username) {
    document.getElementById('user-info').textContent = username;
    document.getElementById('user-info').style.display = '';
    document.getElementById('logout-btn').style.display = '';
    document.getElementById('login-btn').style.display = 'none';
    document.getElementById('register-btn').style.display = 'none';
}
function clearUser() {
    document.getElementById('user-info').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    document.getElementById('login-btn').style.display = '';
    document.getElementById('register-btn').style.display = '';
}
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    clearUser();
    loadSamples();
}

document.getElementById('register-form').onsubmit = function(e) {
    e.preventDefault();
    fetch('/api/register/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: document.getElementById('register-username').value,
            email: document.getElementById('register-email').value,
            password: document.getElementById('register-password').value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', document.getElementById('register-username').value);
            setUser(document.getElementById('register-username').value);
            hideModal('register-modal');
            loadSamples();
        } else {
            alert(data.error || 'Registration failed');
        }
    });
};

document.getElementById('login-form').onsubmit = function(e) {
    e.preventDefault();
    fetch('/api/login/', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            username: document.getElementById('login-username').value,
            password: document.getElementById('login-password').value
        })
    })
    .then(r => r.json())
    .then(data => {
        if (data.token) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('username', document.getElementById('login-username').value);
            setUser(document.getElementById('login-username').value);
            hideModal('login-modal');
            loadSamples();
        } else {
            alert(data.error || 'Login failed');
        }
    });
};

function showUploadResult(success, message) {
    const modal = document.getElementById('upload-result-modal');
    const msg = document.getElementById('upload-result-message');
    msg.textContent = message;
    msg.style.color = success ? "#00ffae" : "#ff6b6b";
    modal.style.display = 'flex';
}
document.getElementById('close-upload-result').onclick = function() {
    document.getElementById('upload-result-modal').style.display = 'none';
};
