// --- Общие UI компоненты и утилиты ---
export function debounce(func, wait) {
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

export function playSample(url) {
    const audio = new Audio(url);
    audio.play();
}

export function downloadSample(id) {
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

// --- Инициализация UI ---
export function setupUI() {
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

    // Upload form
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(event) {
            event.preventDefault();
            window.uploadSample();
        });
    }
} 