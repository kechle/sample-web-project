import { selectedFilterTags } from './filters.js';
import { showUploadResult, closeModal } from './modals.js';

// --- Работа с сэмплами ---
let likedSampleIds = [];
const SAMPLES_PER_PAGE_MAIN = 6;
let mainSamplesPage = 1;
let mainSamplesTotalPages = 1;

export async function fetchLikedSamples() {
    if (!localStorage.getItem('token')) return [];
    const res = await fetch('/api/samples/liked/', {
        headers: { 'Authorization': 'Token ' + localStorage.getItem('token') }
    });
    if (!res.ok) return [];
    try {
        const data = await res.json();
        likedSampleIds = data.map(s => s.id);
        return data;
    } catch {
        likedSampleIds = [];
        return [];
    }
}

export async function fetchUploadedSamples() {
    if (!localStorage.getItem('token')) return [];
    const res = await fetch('/api/my-samples/', {
        headers: { 'Authorization': 'Token ' + localStorage.getItem('token') }
    });
    return await res.json();
}

export function renderSampleCard(sample, showLike = true) {
    let tagsHtml = '';
    if (sample.tags && sample.tags.length) {
        const shownTags = sample.tags.slice(0, 4);
        tagsHtml = `<div class="tags">` +
            shownTags.map(tag => `<span class="tag">${tag.name}</span>`).join(' ') +
            `</div>`;
    }
    let categoryHtml = '';
    if (sample.category && sample.category.name) {
        categoryHtml = `<div class="category"><b>Category:</b> ${sample.category.name}</div>`;
    }
    let bpmHtml = '';
    if (sample.bpm) {
        bpmHtml = `<span class="bpm">BPM: ${sample.bpm}</span>`;
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
            ${bpmHtml}
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

export async function uploadSample() {
    const formData = new FormData();
    formData.append('name', document.getElementById('sample-name').value);
    formData.append('description', document.getElementById('sample-description').value);
    formData.append('file', document.getElementById('sample-file').files[0]);
    formData.append('category_id', document.getElementById('sample-category').value);
    let bpmValue = document.getElementById('sample-bpm').value;
    if (bpmValue > 999) bpmValue = 999;
    formData.append('bpm', bpmValue);
    
    const selectedTagElements = document.querySelectorAll('#sample-tags .tag-option.selected');
    selectedTagElements.forEach(tagElement => {
        formData.append('tag_ids', tagElement.dataset.tag);
    });

    try {
        const response = await fetch('/api/samples/', {
            method: 'POST',
            body: formData,
            headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
        });
        const data = await response.json();
        
        if (data.id) {
            closeModal('upload-modal');
            showUploadResult(true, 'Sample uploaded successfully!');
            window.loadSamples();
        } else {
            showUploadResult(false, data.error || 'Error uploading sample.');
        }
    } catch (error) {
        showUploadResult(false, 'Error uploading sample.');
    }
}

export async function loadSamples(page = 1) {
    const categoryEl = document.getElementById('category');
    const searchEl = document.getElementById('search-input');
    const bpmEl = document.getElementById('bpm-filter');
    const container = document.getElementById('samples-container');
    if (!container) return;
    
    const category = categoryEl ? categoryEl.value : '';
    const tags = selectedFilterTags.join(',');
    const search = searchEl ? searchEl.value : '';
    const bpm = bpmEl ? bpmEl.value : '';
    let url = `/api/samples/?page=${page}&page_size=${SAMPLES_PER_PAGE_MAIN}`;
    if (category) url += `&category=${category}`;
    if (tags) url += `&tags=${tags}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (bpm !== '' && bpm !== undefined) url += `&bpm=${bpm}`;
    
    await fetchLikedSamples();
    const response = await fetch(url, {
        headers: localStorage.getItem('token') ? {'Authorization': 'Token ' + localStorage.getItem('token')} : {}
    });
    const data = await response.json();
    
    mainSamplesPage = page;
    mainSamplesTotalPages = Math.ceil(data.count / SAMPLES_PER_PAGE_MAIN) || 1;
    const currentPage = mainSamplesPage;
    container.innerHTML = '';
    (data.results || []).forEach(sample => {
        container.innerHTML += renderSampleCard(sample, true);
    });
    
    // Пагинация
    if (mainSamplesTotalPages > 1) {
        const pagDiv = document.createElement('div');
        pagDiv.className = 'pagination';
        pagDiv.innerHTML = `
            <button class="pag-btn" ${currentPage === 1 ? 'disabled' : ''} id="main-prev-page">&larr; Prev</button>
            <span class="pag-info">Page ${currentPage} of ${mainSamplesTotalPages}</span>
            <button class="pag-btn" ${currentPage === mainSamplesTotalPages ? 'disabled' : ''} id="main-next-page">Next &rarr;</button>
        `;
        container.appendChild(pagDiv);
        document.getElementById('main-prev-page').onclick = () => loadSamples(currentPage - 1);
        document.getElementById('main-next-page').onclick = () => loadSamples(currentPage + 1);
    }
    
    setupLikeButtons(container);
}

function setupLikeButtons(container) {
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
} 