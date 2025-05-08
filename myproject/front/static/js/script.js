import { setUser, clearUser, logout, setupAuthForms } from './auth.js';
import { loadSamples, uploadSample, fetchLikedSamples, fetchUploadedSamples, renderSampleCard } from './samples.js';
import { setupModalHandlers, showLoginModal, showRegisterModal, showUploadModal } from './modals.js';
import { loadFilterCategories, loadFilterTags, setupFilters } from './filters.js';
import { setupUI } from './ui.js';

// --- Инициализация приложения ---
document.addEventListener('DOMContentLoaded', function() {
    loadFilterCategories();
    loadFilterTags();
    setupFilters();
    loadSamples();
    setupAuthForms();
    setupModalHandlers();
    setupUI();

    if (localStorage.getItem('token') && localStorage.getItem('username')) {
        setUser(localStorage.getItem('username'));
    } else {
        clearUser();
    }

    const mySampleLink = document.getElementById('my-sample-link');
    if (mySampleLink) {
        mySampleLink.onclick = function() {
            document.getElementById('my-sample-modal').style.display = 'flex';
            loadMySampleTab('liked');
        };
    }
    const tabLiked = document.getElementById('tab-liked');
    const tabUploaded = document.getElementById('tab-uploaded');
    if (tabLiked && tabUploaded) {
        tabLiked.onclick = () => loadMySampleTab('liked');
        tabUploaded.onclick = () => loadMySampleTab('uploaded');
    }
});

const SAMPLES_PER_PAGE = 3;
let likedPage = 1;
let uploadedPage = 1;

async function loadMySampleTab(tab, page = 1) {
    const content = document.getElementById('my-sample-content');
    if (!content) return;
    content.innerHTML = 'Loading...';
    let samples = [];
    if (tab === 'liked') {
        samples = await fetchLikedSamples();
        likedPage = page;
    } else {
        samples = await fetchUploadedSamples();
        uploadedPage = page;
    }
    const totalPages = Math.ceil(samples.length / SAMPLES_PER_PAGE) || 1;
    const currentPage = tab === 'liked' ? likedPage : uploadedPage;
    const start = (currentPage - 1) * SAMPLES_PER_PAGE;
    const end = start + SAMPLES_PER_PAGE;
    const pageSamples = samples.slice(start, end);
    content.innerHTML = pageSamples.length
        ? pageSamples.map(s => renderSampleCard(s, false)).join('')
        : (tab === 'liked' ? 'No liked samples.' : 'No uploaded samples.');
    // Пагинация
    if (totalPages > 1) {
        const pagDiv = document.createElement('div');
        pagDiv.className = 'pagination';
        pagDiv.innerHTML = `
            <button class="pag-btn" ${currentPage === 1 ? 'disabled' : ''} id="prev-page">&larr; Prev</button>
            <span class="pag-info">Page ${currentPage} of ${totalPages}</span>
            <button class="pag-btn" ${currentPage === totalPages ? 'disabled' : ''} id="next-page">Next &rarr;</button>
        `;
        content.appendChild(pagDiv);
        document.getElementById('prev-page').onclick = () => loadMySampleTab(tab, currentPage - 1);
        document.getElementById('next-page').onclick = () => loadMySampleTab(tab, currentPage + 1);
    }
    document.getElementById('tab-liked').classList.toggle('active', tab === 'liked');
    document.getElementById('tab-uploaded').classList.toggle('active', tab === 'uploaded');
}

// --- Глобальные функции для доступа из HTML ---
window.loadSamples = loadSamples;
window.uploadSample = uploadSample;
window.showLoginModal = showLoginModal;
window.showRegisterModal = showRegisterModal;
window.showUploadModal = showUploadModal;
window.logout = logout;
