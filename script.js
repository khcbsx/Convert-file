// --- 1. QUẢN LÝ TRẠNG THÁI (STATE) ---
let currentFile = null;
let selectedFormat = 'excel'; // Mặc định chọn Excel

const formats = [
    { id: 'word', name: 'Microsoft Word', desc: 'PRESERVE TABLES & LAYOUT', color: 'text-blue-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'excel', name: 'Microsoft Excel', desc: 'EXTRACT DATA GRID', color: 'text-emerald-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm0 16H8v-2h6v2zm2-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'ppt', name: 'PowerPoint Outline', desc: 'GENERATE SLIDE DECK IDEAS', color: 'text-orange-400', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-3 5-3v6zm7 0l-5-3 5-3v6z"/>' },
    { id: 'pdf', name: 'PDF Document', desc: 'CONVERT & MERGE TO PDF', color: 'text-red-400', icon: '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11h1V8.5h-1V11z"/>' }
];

// --- 2. RENDER GIAO DIỆN CHỌN ĐỊNH DẠNG ---
const formatContainer = document.getElementById('formatContainer');

function renderFormats() {
    formatContainer.innerHTML = '';
    formats.forEach(format => {
        const isSelected = selectedFormat === format.id;
        
        const baseClass = isSelected 
            ? 'flex items-center justify-between p-4 text-left rounded-2xl border-none bg-[#f4f6f8] text-[#0f172a] shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] transition-transform cursor-pointer'
            : 'flex items-center gap-4 p-4 text-left rounded-2xl border border-gray-700/50 bg-[#161224]/80 hover:bg-[#201a33] transition-colors cursor-pointer';
        
        const iconBgClass = isSelected ? 'bg-[#213547] text-white' : `bg-white/5 ${format.color}`;
        const titleClass = isSelected ? 'font-extrabold' : 'font-bold';
        
        const btnHTML = `
            <div class="${baseClass}" onclick="selectFormat('${format.id}')">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center ${iconBgClass}">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">${format.icon}</svg>
                    </div>
                    <div>
                        <div class="${titleClass} text-[15px]">${format.name}</div>
                        <div class="text-[10px] text-gray-500 font-bold tracking-widest mt-0.5">${format.desc}</div>
                    </div>
                </div>
                ${isSelected ? '<svg class="w-6 h-6 text-emerald-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
            </div>
        `;
        formatContainer.insertAdjacentHTML('beforeend', btnHTML);
    });
}

function selectFormat(id) {
    selectedFormat = id;
    renderFormats();
}

renderFormats();

// --- 3. XỬ LÝ KÉO THẢ VÀ CHỌN FILE ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadIcon = document.getElementById('uploadIcon');
const uploadText = document.getElementById('uploadText');
const fileInfo = document.getElementById('fileInfo');
const fileNameDisplay = document.getElementById('fileName');
const fileSizeDisplay = document.getElementById('fileSize');
const removeFileBtn = document.getElementById('removeFileBtn');
const processBtn = document.getElementById('processBtn');

dropZone.addEventListener('click', (e) => {
    if (e.target !== removeFileBtn) {
        fileInput.click();
    }
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-active');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-active');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    
    if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
    }
});

function handleFile(file) {
    currentFile = file;
    uploadIcon.classList.add('hidden');
    uploadText.classList.add('hidden');
    fileInfo.classList.remove('hidden');
    fileNameDisplay.textContent = file.name;
    
    const sizeKB = (file.size / 1024).toFixed(2);
    const sizeMB = (sizeKB / 1024).toFixed(2);
    fileSizeDisplay.textContent = sizeMB >= 1 ? `${sizeMB} MB` : `${sizeKB} KB`;

    processBtn.classList.remove('text-gray-400', 'bg-[#1f192e]');
    processBtn.classList.add('text-white', 'bg-purple-600', 'hover:bg-purple-500', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]');
}

removeFileBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentFile = null;
    fileInput.value = '';
    
    fileInfo.classList.add('hidden');
    uploadIcon.classList.remove('hidden');
    uploadText.classList.remove('hidden');
    
    processBtn.classList.add('text-gray-400', 'bg-[#1f192e]');
    processBtn.classList.remove('text-white', 'bg-purple-600', 'hover:bg-purple-500', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]');
});

processBtn.addEventListener('click', () => {
    if (!currentFile) {
        alert('Vui lòng tải lên một tài liệu trước!');
        return;
    }
    console.log("File chuẩn bị xử lý:", currentFile.name);
    console.log("Định dạng đích:", selectedFormat);
    alert(`Sẵn sàng gửi file ${currentFile.name} qua Gemini API để chuyển thành ${selectedFormat.toUpperCase()}!`);
});
