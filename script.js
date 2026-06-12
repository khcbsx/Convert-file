// --- 1. STATE MANAGEMENT ---
let fileQueue = []; // Mảng chứa danh sách các file
let selectedFormat = 'excel';
let isProcessing = false;

const formats = [
    { id: 'word', name: 'Microsoft Word', desc: 'PRESERVE TABLES', color: 'text-blue-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'excel', name: 'Microsoft Excel', desc: 'EXTRACT DATA', color: 'text-emerald-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm0 16H8v-2h6v2zm2-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'ppt', name: 'PowerPoint', desc: 'GENERATE SLIDES', color: 'text-orange-400', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-3 5-3v6zm7 0l-5-3 5-3v6z"/>' },
    { id: 'pdf', name: 'PDF Document', desc: 'CONVERT TO PDF', color: 'text-red-400', icon: '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11h1V8.5h-1V11z"/>' }
];

// --- 2. RENDER FORMATS ---
const formatContainer = document.getElementById('formatContainer');
function renderFormats() {
    formatContainer.innerHTML = '';
    formats.forEach(format => {
        const isSelected = selectedFormat === format.id;
        const baseClass = isSelected 
            ? 'flex items-center justify-between p-3 text-left rounded-xl bg-white text-black shadow-lg cursor-pointer transition-transform scale-[1.02]'
            : 'flex items-center gap-3 p-3 text-left rounded-xl border border-gray-700/50 bg-[#161224]/80 hover:bg-[#201a33] cursor-pointer text-gray-300';
        const iconBgClass = isSelected ? 'bg-[#213547] text-white' : `bg-white/5 ${format.color}`;
        
        const btnHTML = `
            <div class="${baseClass}" onclick="selectFormat('${format.id}')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">${format.icon}</svg>
                    </div>
                    <div>
                        <div class="${isSelected ? 'font-bold' : 'font-semibold'} text-sm">${format.name}</div>
                        <div class="text-[9px] text-gray-500 tracking-widest mt-0.5">${format.desc}</div>
                    </div>
                </div>
                ${isSelected ? '<svg class="w-5 h-5 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
            </div>
        `;
        formatContainer.insertAdjacentHTML('beforeend', btnHTML);
    });
}

function selectFormat(id) {
    if(isProcessing) return; // Khóa chọn khi đang chạy
    selectedFormat = id;
    renderFormats();
}
renderFormats();

// --- 3. DRAG & DROP MULTIPLE FILES ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');

dropZone.addEventListener('click', () => { if(!isProcessing) fileInput.click(); });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-active');
    if (!isProcessing && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', (e) => {
    if (!isProcessing && e.target.files.length > 0) handleFiles(e.target.files);
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        // Thêm file vào mảng với trạng thái mặc định là 'pending'
        fileQueue.push({
            id: Date.now() + Math.random(),
            file: file,
            status: 'pending' // pending | processing | done
        });
    });
    renderQueue();
}

// --- 4. QUẢN LÝ DANH SÁCH & TRẠNG THÁI (QUEUE) ---
const queueList = document.getElementById('queueList');
const queueCounter = document.getElementById('queueCounter');
const processBtn = document.getElementById('processBtn');

function renderQueue() {
    queueCounter.textContent = `${fileQueue.length} file`;
    
    if (fileQueue.length === 0) {
        queueList.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center px-4"><svg class="w-10 h-10 mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>Danh sách trống.<br>Hãy thêm file để bắt đầu.</div>`;
        processBtn.classList.remove('bg-purple-600', 'text-white', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', 'hover:bg-purple-500');
        processBtn.classList.add('bg-[#1f192e]', 'text-gray-400');
        processBtn.textContent = 'BẮT ĐẦU XỬ LÝ';
        return;
    }

    queueList.innerHTML = '';
    fileQueue.forEach((item, index) => {
        const sizeKB = (item.file.size / 1024).toFixed(1);
        let statusBadge = '';
        
        if (item.status === 'pending') {
            statusBadge = `<span class="text-[10px] bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded border border-gray-600">⏳ Chờ xử lý</span>
                           ${!isProcessing ? `<button onclick="removeFile('${item.id}')" class="ml-2 text-red-400 hover:text-red-300 text-xs">✕</button>` : ''}`;
        } else if (item.status === 'processing') {
            statusBadge = `<span class="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1"><svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang chạy...</span>`;
        } else if (item.status === 'done') {
            statusBadge = `<span class="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">✅ Hoàn thành</span>`;
        }

        const html = `
            <div class="flex items-center justify-between p-3 rounded-xl bg-black/20 border ${item.status === 'processing' ? 'border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-gray-700/30'}">
                <div class="flex-1 min-w-0 pr-3">
                    <div class="text-sm font-semibold text-gray-200 truncate" title="${item.file.name}">${index + 1}. ${item.file.name}</div>
                    <div class="text-[10px] text-gray-500">${sizeKB} KB</div>
                </div>
                <div class="flex items-center flex-shrink-0">
                    ${statusBadge}
                </div>
            </div>
        `;
        queueList.insertAdjacentHTML('beforeend', html);
    });

    if(!isProcessing) {
        processBtn.classList.add('bg-purple-600', 'text-white', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', 'hover:bg-purple-500');
        processBtn.classList.remove('bg-[#1f192e]', 'text-gray-400');
        processBtn.textContent = `XỬ LÝ ${fileQueue.length} FILE NGAY`;
    }
}

function removeFile(id) {
    fileQueue = fileQueue.filter(item => item.id != id);
    renderQueue();
}

// --- 5. LOGIC XỬ LÝ TUẦN TỰ & TẢI XUỐNG ---
processBtn.addEventListener('click', async () => {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ĐANG CHẠY HỆ THỐNG...</span>`;
    processBtn.classList.remove('hover:bg-purple-500');

    // Chạy vòng lặp từng file một (Tuần tự)
    for (let i = 0; i < fileQueue.length; i++) {
        if (fileQueue[i].status !== 'pending') continue;

        // 1. Cập nhật trạng thái thành 'đang xử lý'
        fileQueue[i].status = 'processing';
        renderQueue();

        // 2. GỌI API THỰC TẾ Ở ĐÂY (Hiện tại đang mô phỏng bằng setTimeout)
        await new Promise(resolve => setTimeout(resolve, 2500)); // Giả lập thời gian Gemini xử lý mất 2.5s mỗi file

        // 3. Xử lý xong, cập nhật trạng thái 'Hoàn thành'
        fileQueue[i].status = 'done';
        renderQueue();

        // 4. Tự động kích hoạt tải xuống file đó ngay lập tức
        triggerAutoDownload(fileQueue[i].file.name, selectedFormat);
    }

    // Hoàn tất toàn bộ lô
    isProcessing = false;
    processBtn.disabled = false;
    processBtn.classList.add('bg-emerald-600', 'hover:bg-emerald-500', 'shadow-[0_0_20px_rgba(16,185,129,0.4)]');
    processBtn.classList.remove('bg-purple-600', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]');
    processBtn.textContent = '✅ ĐÃ HOÀN TẤT TOÀN BỘ';
    
    // Reset lại nút sau 4 giây
    setTimeout(() => {
        fileQueue = []; // Xóa danh sách để sẵn sàng đợt mới
        renderQueue();
    }, 4000);
});

// Hàm mô phỏng việc tạo file và ép trình duyệt tải về
function triggerAutoDownload(originalName, format) {
    const extensionMap = { 'excel': '.xlsx', 'word': '.docx', 'ppt': '.pptx', 'pdf': '_new.pdf' };
    const newExt = extensionMap[format] || '.txt';
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const finalFileName = `${baseName}_converted${newExt}`;

    // Tạo một file ảo chứa dữ liệu text (sau này bạn sẽ nhét dữ liệu từ API Gemini vào đây)
    const blob = new Blob(["Dữ liệu mô phỏng được trả về từ AI cho file " + originalName], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    
    // Tạo thẻ <a> ẩn để click tải về
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    
    // Dọn dẹp bộ nhớ
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
