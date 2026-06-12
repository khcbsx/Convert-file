// --- 1. QUẢN LÝ TRẠNG THÁI (STATE) ---
let fileQueue = []; 
let selectedFormat = 'excel';
let isProcessing = false;

const formats = [
    { id: 'word', name: 'Microsoft Word', desc: 'PRESERVE TABLES', color: 'text-blue-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'excel', name: 'Microsoft Excel', desc: 'EXTRACT DATA', color: 'text-emerald-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm0 16H8v-2h6v2zm2-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'ppt', name: 'PowerPoint', desc: 'GENERATE SLIDES', color: 'text-orange-400', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-3 5-3v6zm7 0l-5-3 5-3v6z"/>' },
    { id: 'pdf', name: 'PDF Document', desc: 'CONVERT TO PDF', color: 'text-red-400', icon: '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11h1V8.5h-1V11z"/>' }
];

// --- 2. ẨN/HIỆN API KEY ---
function toggleKeyVisibility() {
    const keyInput = document.getElementById('geminiApiKey');
    if (keyInput.type === 'password') {
        keyInput.type = 'text';
    } else {
        keyInput.type = 'password';
    }
}

// --- 3. RENDER ĐỊNH DẠNG (Cột 2) ---
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
    if(isProcessing) return;
    selectedFormat = id;
    renderFormats();
}
renderFormats();

// --- 4. KÉO THẢ MULTIPLE FILES (Cột 1) ---
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
    fileInput.value = '';
});

function handleFiles(files) {
    Array.from(files).forEach(file => {
        fileQueue.push({ id: Date.now() + Math.random(), file: file, status: 'pending', formatTarget: null });
    });
    renderQueue();
}

// --- 5. RENDER DANH SÁCH & NÚT XỬ LÝ ---
const pendingList = document.getElementById('pendingList');
const completedList = document.getElementById('completedList');
const pendingCounter = document.getElementById('pendingCounter');
const completedCounter = document.getElementById('completedCounter');
const processBtn = document.getElementById('processBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

clearHistoryBtn.addEventListener('click', () => {
    fileQueue = fileQueue.filter(item => item.status !== 'done');
    renderQueue();
});

function renderQueue() {
    let pendingHTML = '';
    let completedHTML = '';
    let pCount = 0;
    let cCount = 0;

    fileQueue.forEach((item) => {
        const sizeKB = (item.file.size / 1024).toFixed(1);
        
        if (item.status === 'pending' || item.status === 'processing') {
            pCount++;
            const isRunning = item.status === 'processing';
            const statusBadge = isRunning
                ? `<span class="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/30 flex items-center gap-1 animate-pulse">Đang chạy...</span>`
                : `<button onclick="removeFile('${item.id}')" class="text-gray-500 hover:text-red-400 p-1">✕</button>`;

            pendingHTML += `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border ${isRunning ? 'border-blue-500/40 shadow-inner' : 'border-gray-700/30'}">
                    <div class="flex-1 min-w-0 pr-2">
                        <div class="text-[13px] font-medium text-gray-200 truncate">${item.file.name}</div>
                        <div class="text-[9px] text-gray-500">${sizeKB} KB</div>
                    </div>
                    ${statusBadge}
                </div>
            `;
        } else if (item.status === 'done') {
            cCount++;
            completedHTML += `
                <div class="flex items-center justify-between p-2.5 rounded-lg bg-emerald-900/10 border border-emerald-800/30">
                    <div class="flex-1 min-w-0 pr-2">
                        <div class="text-[13px] font-medium text-emerald-100 truncate line-through opacity-70">${item.file.name}</div>
                        <div class="text-[9px] text-emerald-400/70">Đã chuyển sang ${item.formatTarget.toUpperCase()}</div>
                    </div>
                    <span class="text-emerald-400">✅</span>
                </div>
            `;
        }
    });

    pendingCounter.textContent = pCount;
    if (pCount === 0) {
        pendingList.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-xs text-center"><svg class="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>Trống</div>`;
    } else {
        pendingList.innerHTML = pendingHTML;
    }

    completedCounter.textContent = cCount;
    if (cCount === 0) {
        completedList.innerHTML = `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-[11px] text-center"><svg class="w-8 h-8 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>Chưa có file nào hoàn thành</div>`;
        clearHistoryBtn.classList.add('hidden');
    } else {
        completedList.innerHTML = completedHTML;
        clearHistoryBtn.classList.remove('hidden');
    }

    if (!isProcessing) {
        if (pCount > 0) {
            processBtn.classList.add('bg-purple-600', 'text-white', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', 'hover:bg-purple-500', 'border-purple-500');
            processBtn.classList.remove('bg-[#1f192e]', 'text-gray-400', 'border-gray-700/50');
            processBtn.textContent = `XỬ LÝ ${pCount} FILE NGAY`;
        } else {
            processBtn.classList.remove('bg-purple-600', 'text-white', 'shadow-[0_0_20px_rgba(168,85,247,0.4)]', 'hover:bg-purple-500', 'border-purple-500');
            processBtn.classList.add('bg-[#1f192e]', 'text-gray-400', 'border-gray-700/50');
            processBtn.textContent = 'BẮT ĐẦU XỬ LÝ';
        }
    }
}

function removeFile(id) {
    fileQueue = fileQueue.filter(item => item.id != id);
    renderQueue();
}

// --- 6. KẾT NỐI API GEMINI & CHUYỂN ĐỔI ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Cắt bỏ phần header data:image/pdf...
        reader.onerror = error => reject(error);
    });
}

async function callGeminiAPI(file, targetFormat, apiKey) {
    const base64Data = await fileToBase64(file);
    
    // Viết Prompt (Câu lệnh) để ra lệnh cho AI
    let promptInstruction = "Hãy trích xuất văn bản từ tài liệu này.";
    if (targetFormat === 'excel') {
        promptInstruction = "Trích xuất toàn bộ bảng biểu và dữ liệu từ tài liệu này. Định dạng đầu ra bắt buộc là CSV chuẩn, phân cách bằng dấu phẩy (,). Không thêm bất kỳ văn bản giải thích hay markdown code block nào, chỉ trả về đúng dữ liệu CSV.";
    } else if (targetFormat === 'word') {
        promptInstruction = "Trích xuất toàn bộ văn bản, giữ nguyên cấu trúc đoạn văn, tiêu đề. Trình bày rõ ràng. Không sử dụng markdown code block.";
    }

    // Gọi lên máy chủ Google (Sử dụng model gemini-1.5-flash)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [
                    { text: promptInstruction },
                    {
                        inlineData: {
                            mimeType: file.type || "application/pdf",
                            data: base64Data
                        }
                    }
                ]
            }]
        })
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "Lỗi khi kết nối với Gemini API");
    }

    const result = await response.json();
    return result.candidates[0].content.parts[0].text;
}

processBtn.addEventListener('click', async () => {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    // Kiểm tra đã nhập Key chưa
    const apiKey = document.getElementById('geminiApiKey').value.trim();
    if (!apiKey) {
        alert("Vui lòng dán Gemini API Key vào ô ở góc trên bên phải để bắt đầu!");
        document.getElementById('geminiApiKey').focus();
        return;
    }

    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> AI ĐANG XỬ LÝ...</span>`;
    processBtn.classList.remove('hover:bg-purple-500');

    const targetFormat = selectedFormat;

    for (let i = 0; i < fileQueue.length; i++) {
        if (fileQueue[i].status !== 'pending') continue;

        fileQueue[i].status = 'processing';
        renderQueue();

        try {
            // Gửi cho AI và chờ kết quả
            const aiGeneratedText = await callGeminiAPI(fileQueue[i].file, targetFormat, apiKey);
            
            fileQueue[i].formatTarget = targetFormat;
            fileQueue[i].status = 'done';
            
            renderQueue();
            
            // Tải kết quả thật về máy
            triggerAutoDownload(fileQueue[i].file.name, targetFormat, aiGeneratedText);

        } catch (error) {
            console.error("Lỗi:", error);
            alert(`Lỗi xử lý file ${fileQueue[i].file.name}: ${error.message}`);
            fileQueue[i].status = 'pending'; // Reset lại để chạy lại sau
            renderQueue();
        }
    }

    isProcessing = false;
    processBtn.disabled = false;
    renderQueue();
});

function triggerAutoDownload(originalName, format, fileContent) {
    // Nếu chọn Excel, lưu đuôi .csv để mở được thành bảng. Nếu chọn Word, lưu .doc
    const extensionMap = { 'excel': '.csv', 'word': '.doc', 'ppt': '.txt', 'pdf': '_extracted.txt' };
    const newExt = extensionMap[format] || '.txt';
    
    // Thêm BOM vào đầu file CSV để Excel hỗ trợ hiển thị tiếng Việt UTF-8 chuẩn xác
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, fileContent], { type: "text/plain;charset=utf-8" });
    
    const url = window.URL.createObjectURL(blob);
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const finalFileName = `${baseName}_converted${newExt}`;

    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
