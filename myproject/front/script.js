document.addEventListener('DOMContentLoaded', function() {
    // Load filters
    loadFilterCategories();
    loadFilterTags();

    // Load samples
    loadSamples();

    // Handle upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            event.preventDefault();
            uploadSample();
        });
    }

    // Search
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => loadSamples();
    }

    // File input handling
    const sampleFile = document.getElementById('sample-file');
    if (sampleFile) {
        sampleFile.onchange = function() {
            const fileChosen = document.getElementById('file-chosen');
            if (fileChosen) {
                fileChosen.textContent = this.files[0] ? this.files[0].name : 'No file chosen';
            }
        };
    }

    // Check authentication on load
    if (localStorage.getItem('token') && localStorage.getItem('username')) {
        setUser(localStorage.getItem('username'));
    } else {
        clearUser();
    }

    // Категории
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', loadSamples);
    }

    // Login form handler
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;
            
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
                    loadSamples();
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    // Register form handler
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
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
                    loadSamples();
                } else {
                    alert(data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('Registration failed. Please try again.');
            }
        });
    }
});

let selectedFilterTags = [];
function loadFilterCategories() {
    fetch('/api/categories/')
        .then(r => r.json())
        .then(data => {
            data.sort((a, b) => a.name.localeCompare(b.name));
            const select = document.getElementById('category');
            if (!select) return;
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
    if (!container) return;
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

let likedSampleIds = [];

async function fetchLikedSamples() {
    if (!localStorage.getItem('token')) return [];
    const res = await fetch('/api/samples/liked/', {
        headers: { 'Authorization': 'Token ' + localStorage.getItem('token') }
    });
    if (!res.ok) {
        // Если не JSON, возвращаем пустой массив
        return [];
    }
    try {
        const data = await res.json();
        likedSampleIds = data.map(s => s.id);
        return data;
    } catch {
        likedSampleIds = [];
        return [];
    }
}

async function fetchUploadedSamples() {
    if (!localStorage.getItem('token')) return [];
    const res = await fetch('/api/my-samples/', {
        headers: { 'Authorization': 'Token ' + localStorage.getItem('token') }
    });
    return await res.json();
}

function renderSampleCard(sample, showLike = true) {
    let tagsHtml = '';
    if (sample.tags && sample.tags.length) {
        tagsHtml = `<div class="tags">` +
            sample.tags.map(tag => `<span class="tag">${tag.name}</span>`).join(' ') +
            `</div>`;
    }
    let categoryHtml = '';
    if (sample.category && sample.category.name) {
        categoryHtml = `<div class="category"><b>Category:</b> ${sample.category.name}</div>`;
    }
    let likeBtn = '';
    if (showLike && localStorage.getItem('token')) {
        const liked = likedSampleIds.includes(sample.id);
        likeBtn = `<button class="like-btn${liked ? ' liked' : ''}" data-id="${sample.id}" title="Like/Unlike">
            <i class="fa${liked ? 's' : 'r'} fa-heart"></i>
        </button>`;
    }
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
    return `
        <div class="sample-card">
            <div style="display:flex;align-items:center;gap:4px;">
                ${likeBtn}
                <h3 style="margin:0;">${sample.name}</h3>
            </div>
            <p>${sample.description}</p>
            ${categoryHtml}
            ${tagsHtml}
            ${audioHtml}
            <div class="actions">
                ${downloadBtn}
            </div>
        </div>
    `;
}

// --- Закрытие модалки с сэмплами ---
const mySampleClose = document.getElementById('my-sample-close');
if (mySampleClose) {
    mySampleClose.onclick = function() {
        document.getElementById('my-sample-modal').style.display = 'none';
    };
}
window.onclick = (e) => {
    const modal = document.getElementById('my-sample-modal');
    if (e.target === modal) modal.style.display = 'none';
    ['upload-modal','login-modal','register-modal'].forEach(id => {
        if (e.target === document.getElementById(id)) hideModal(id);
    });
};
// --- Пагинация для сэмплов ---
const PAGE_SIZE = 5;
let currentPage = 1;
function renderSamples(samples) {
    const start = (currentPage - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const pageSamples = samples.slice(start, end);
    const content = document.getElementById('my-sample-content');
    content.innerHTML = pageSamples.map(sample => `
        <div class="sample-card">
            <h3>${sample.name}</h3>
            <p>${sample.description}</p>
        </div>
    `).join('');
    renderPagination(samples.length);
}
function renderPagination(total) {
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const controls = document.createElement('div');
    controls.className = 'pagination-controls';
    controls.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Назад</button>
        <span>Страница ${currentPage} из ${totalPages}</span>
        <button onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Вперёд</button>
    `;
    document.getElementById('my-sample-content').appendChild(controls);
}
function changePage(newPage) {
    if (newPage < 1 || newPage > Math.ceil(samples.length / PAGE_SIZE)) return;
    currentPage = newPage;
    renderSamples(samples);
}
// --- Инициализация ---
document.addEventListener('DOMContentLoaded', () => {
    renderSamples(samples);
});

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
            const tagsContainer = document.getElementById('sample-tags');
            if (!tagsContainer) return;
            tagsContainer.innerHTML = '';
            data.forEach(tag => {
                const div = document.createElement('div');
                div.className = 'tag-option';
                div.textContent = tag.name;
                div.dataset.tag = tag.id;
                div.onclick = () => div.classList.toggle('selected');
                tagsContainer.appendChild(div);
            });
        });
}

// --- Загрузка категорий (оставь как было) ---
function loadUploadCategories() {
    fetch('/api/categories/')
        .then(r => r.json())
        .then(data => {
            const select = document.getElementById('sample-category');
            if (!select) return;
            select.innerHTML = '<option value="">Select category</option>';
            data.forEach(cat => {
                select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
            });
        });
}

function showUploadResult(success, message) {
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

function uploadSample() {
    const formData = new FormData();
    formData.append('name', document.getElementById('sample-name').value);
    formData.append('description', document.getElementById('sample-description').value);
    formData.append('file', document.getElementById('sample-file').files[0]);
    formData.append('category_id', document.getElementById('sample-category').value);
    formData.append('bpm', document.getElementById('sample-bpm').value);
    
    // Get selected tags
    const selectedTagElements = document.querySelectorAll('#sample-tags .tag-option.selected');
    selectedTagElements.forEach(tagElement => {
        formData.append('tag_ids', tagElement.dataset.tag);
    });

    fetch('/api/samples/', {
        method: 'POST',
        body: formData,
        headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            closeModal('upload-modal');
            showUploadResult(true, 'Sample uploaded successfully!');
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

function setUser(username) {
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
function clearUser() {
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
function logout() {
    fetch('/api/logout/', {
        method: 'POST',
        headers: {
            'Authorization': 'Token ' + localStorage.getItem('token')
        }
    })
    .then(() => {
        clearUser();
        loadSamples();
    })
    .catch(error => {
        console.error('Logout error:', error);
        clearUser();
    });
}

// --- Глобальные переменные ---
let token = localStorage.getItem('token') || null;

// --- Универсальные функции для модалок ---
function showLoginModal() {
    document.getElementById('login-modal').style.display = 'flex';
}
function showRegisterModal() {
    document.getElementById('register-modal').style.display = 'flex';
}
function showUploadModal() {
    document.getElementById('upload-modal').style.display = 'flex';
    loadUploadCategories();
    loadUploadTags();
}
function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// --- Получение категорий и тегов из API ---
async function fetchCategories() {
    const res = await fetch('/api/categories/');
    return await res.json();
}
async function fetchTags() {
    const res = await fetch('/api/tags/');
    return await res.json();
}

// --- Рендер фильтров (только для samples.html) ---
async function renderFilters() {
    const categorySelect = document.getElementById('category-filter');
    const tagsContainer = document.getElementById('tags-filter-multiselect');
    if (!categorySelect || !tagsContainer) return;

    // Категории
    categorySelect.innerHTML = '<option value="">All Categories</option>';
    const categories = await fetchCategories();
    categories.forEach(cat => {
        categorySelect.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });

    // Теги
    tagsContainer.innerHTML = '';
    const tags = await fetchTags();
    tags.forEach(tag => {
        const div = document.createElement('div');
        div.className = 'tag-option';
        div.textContent = tag.name;
        div.dataset.tag = tag.name;
        div.onclick = () => div.classList.toggle('selected');
        tagsContainer.appendChild(div);
    });
}

// --- Получение и рендер сэмплов ---
async function fetchSamples(params = {}) {
    let url = '/api/samples/';
    const query = [];
    if (params.category) query.push(`category=${encodeURIComponent(params.category)}`);
    if (params.bpm) query.push(`bpm=${encodeURIComponent(params.bpm)}`);
    if (params.tags && params.tags.length) query.push(`tags=${params.tags.join(',')}`);
    if (params.limit) query.push(`limit=${params.limit}`);
    if (params.search) query.push(`search=${encodeURIComponent(params.search)}`);
    if (query.length) url += '?' + query.join('&');
    const res = await fetch(url);
    return await res.json();
}

function renderSamples(samples) {
    const container = document.getElementById('samples-container');
    if (!container) return;
    if (!samples.length) {
        container.innerHTML = '<p>No samples found.</p>';
        return;
    }
    container.innerHTML = '';
    samples.forEach(sample => {
        const tags = (sample.tags || []).map(t => `<span class="tag">${t.name}</span>`).join(' ');
        container.innerHTML += `
            <div class="sample-card">
                <h3>${sample.name}</h3>
                <p>${sample.description || ''}</p>
                <div><b>Category:</b> ${sample.category?.name || ''}</div>
                <div><b>BPM:</b> ${sample.bpm || ''}</div>
                <div class="tags">${tags}</div>
                <audio controls src="${sample.file_url}"></audio>
            </div>
        `;
    });
}

// --- Главная страница: показываем только последние сэмплы ---
async function loadLatestSamples() {
    const samples = await fetchSamples({ limit: 8 });
    renderSamples(samples);
}

// --- Страница с фильтрами ---
async function loadFilteredSamples() {
    const category = document.getElementById('category-filter')?.value || '';
    const bpm = document.getElementById('bpm-filter')?.value || '';
    const tags = Array.from(document.querySelectorAll('#tags-filter-multiselect .tag-option.selected')).map(el => el.dataset.tag);
    const samples = await fetchSamples({ category, bpm, tags });
    renderSamples(samples);
}

// --- События для фильтров ---
function setupFilterEvents() {
    const btn = document.getElementById('apply-filters-btn');
    if (btn) btn.onclick = loadFilteredSamples;
}

// --- Инициализация страницы ---
window.addEventListener('DOMContentLoaded', async () => {
    // Для samples.html
    if (document.getElementById('category-filter')) {
        await renderFilters();
        setupFilterEvents();
        loadFilteredSamples();
    }
    // Для index.html
    if (document.getElementById('samples-container') && !document.getElementById('category-filter')) {
        loadLatestSamples();
    }
    // Для формы загрузки — динамически подгружаем категории и теги
    if (document.getElementById('sample-category')) {
        const categories = await fetchCategories();
        const select = document.getElementById('sample-category');
        select.innerHTML = '';
        categories.forEach(cat => {
            select.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    }
    if (document.getElementById('sample-tags')) {
        const tags = await fetchTags();
        const tagsContainer = document.getElementById('sample-tags');
        tagsContainer.innerHTML = '';
        tags.forEach(tag => {
            const div = document.createElement('div');
            div.className = 'tag-option';
            div.textContent = tag.name;
            div.dataset.tag = tag.id;
            div.onclick = () => div.classList.toggle('selected');
            tagsContainer.appendChild(div);
        });
    }
});

// --- ГЛОБАЛЬНАЯ ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ СЭМПЛОВ ---
window.loadSamples = async function loadSamples() {
    const categoryEl = document.getElementById('category');
    const searchEl = document.getElementById('search-input');
    const container = document.getElementById('samples-container');
    if (!container) return;
    const category = categoryEl ? categoryEl.value : '';
    const tags = selectedFilterTags.join(',');
    const search = searchEl ? searchEl.value : '';
    let url = '/api/samples/?';
    if (category) url += `category=${category}&`;
    if (tags) url += `tags=${tags}&`;
    if (search) url += `search=${encodeURIComponent(search)}`;
    await fetchLikedSamples();
    fetch(url, {
        headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
    })
    .then(r => r.json())
    .then(data => {
        container.innerHTML = '';
        data.forEach(sample => {
            container.innerHTML += renderSampleCard(sample, true);
        });
        // Навешиваем обработчики на лайки
        container.querySelectorAll('.like-btn').forEach(btn => {
            btn.onclick = async function() {
                const id = this.getAttribute('data-id');
                if (likedSampleIds.includes(Number(id))) {
                    await fetch(`/api/samples/${id}/unlike/`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Token ' + localStorage.getItem('token') }
                    });
                } else {
                    await fetch(`/api/samples/${id}/like/`, {
                        method: 'POST',
                        headers: { 'Authorization': 'Token ' + localStorage.getItem('token') }
                    });
                }
                await fetchLikedSamples();
                loadSamples();
            };
        });
    });
}
