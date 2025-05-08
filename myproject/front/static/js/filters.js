// --- Работа с фильтрами ---
export let selectedFilterTags = [];

export function loadFilterCategories() {
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

export function loadFilterTags() {
    fetch('/api/tags/')
        .then(r => r.json())
        .then(data => {
            data.sort((a, b) => a.name.localeCompare(b.name));
            renderTagsFilterMultiselect(data);
        });
}

export function renderTagsFilterMultiselect(tags) {
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
            window.loadSamples();
        };
        container.appendChild(tagDiv);
    });
}

// --- Загрузка тегов для мультивыбора ---
export function loadUploadTags() {
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
                div.onclick = () => {
                    const selected = tagsContainer.querySelectorAll('.tag-option.selected').length;
                    if (div.classList.contains('selected')) {
                        div.classList.remove('selected');
                    } else if (selected < 4) {
                        div.classList.add('selected');
                    }
                    // После выбора/снятия выделения обновляем доступность остальных
                    updateTagAvailability();
                };
                tagsContainer.appendChild(div);
            });
            function updateTagAvailability() {
                const selected = tagsContainer.querySelectorAll('.tag-option.selected').length;
                tagsContainer.querySelectorAll('.tag-option').forEach(el => {
                    if (!el.classList.contains('selected')) {
                        el.style.pointerEvents = selected >= 4 ? 'none' : 'auto';
                        el.style.opacity = selected >= 4 ? '0.5' : '1';
                    } else {
                        el.style.pointerEvents = 'auto';
                        el.style.opacity = '1';
                    }
                });
            }
        });
}

// --- Загрузка категорий ---
export function loadUploadCategories() {
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

// --- Инициализация фильтров ---
export function setupFilters() {
    const categorySelect = document.getElementById('category');
    if (categorySelect) {
        categorySelect.addEventListener('change', window.loadSamples);
    }

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.onclick = () => window.loadSamples();
    }

    const bpmInput = document.getElementById('bpm-filter');
    if (bpmInput) {
        bpmInput.addEventListener('input', window.loadSamples);
    }
} 