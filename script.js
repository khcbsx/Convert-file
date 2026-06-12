// --- 1. QUẢN LÝ TRẠNG THÁI (STATE) ---
let fileQueue = []; 
let selectedFormat = 'excel';
let isProcessing = false;

// Hệ thống quản lý Key mới
let apiKeysData = [{ id: 1, key: '', status: 'untested', model: null }]; 
let activeKeysConfig = []; // Danh sách các key đã pass kiểm tra (Sẵn sàng chạy)

const formats = [
    { id: 'word', name: 'Microsoft Word', desc: 'PRESERVE TABLES', color: 'text-blue-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'excel', name: 'Microsoft Excel', desc: 'EXTRACT DATA', color: 'text-emerald-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm0 16H8v-2h6v2zm2-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'ppt', name: 'PowerPoint', desc: 'GENERATE SLIDES', color: 'text-orange-400', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-3 5-3v6zm7 0l-5-3 5-3v6z"/>' },
    { id: 'pdf', name: 'PDF Document', desc: 'CONVERT TO PDF', color: 'text-red-400', icon: '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11h1V8.5h-1V11z"/>' }
];

// --- 2. RENDER ĐỊNH DẠNG ---
const formatContainer = document.getElementById('formatContainer');
function renderFormats() {
    formatContainer.innerHTML = '';
    formats.forEach(format => {
        const isSelected = selectedFormat === format.id;
        const baseClass = isSelected ? 'flex items-center justify-between p-3 text-left rounded-xl bg-white text-black shadow-lg cursor-pointer transition-transform scale-[1.02]' : 'flex items-center gap-3 p-3 text-left rounded-xl border border-gray-700/50 bg-[#161224]/80 hover:bg-[#201a33] cursor-pointer text-gray-300';
        const iconBgClass = isSelected ? 'bg-[#213547] text-white' : `bg-white/5 ${format.color}`;
        formatContainer.insertAdjacentHTML('beforeend', `
            <div class="${baseClass}" onclick="selectFormat('${format.id}')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center ${iconBgClass}"><svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">${format.icon}</svg></div>
                    <div><div class="${isSelected ? 'font-bold' : 'font-semibold'} text-sm">${format.name}</div><div class="text-[9px] text-gray-500 tracking-widest mt-0.5">${format.desc}</div></div>
                </div>
                ${isSelected ? '<svg class="w-5 h-5 text-emerald-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>' : ''}
            </div>
        `);
    });
}
function selectFormat(id) { if(!isProcessing) { selectedFormat = id; renderFormats(); } }
renderFormats();

// --- 3. KÉO THẢ FILES ---
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
dropZone.addEventListener('click', () => { if(!isProcessing) fileInput.click(); });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-active'); if (!isProcessing && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', (e) => { if (!isProcessing && e.target.files.length > 0) handleFiles(e.target.files); fileInput.value = ''; });

function handleFiles(files) {
    Array.from(files).forEach(f => fileQueue.push({ id: Date.now() + Math.random(), file: f, status: 'pending', formatTarget: null }));
    renderQueue();
}

// --- 4. RENDER DANH SÁCH FILE ---
const pendingList = document.getElementById('pendingList');
const completedList = document.getElementById('completedList');
const processBtn = document.getElementById('processBtn');

document.getElementById('clearHistoryBtn').addEventListener('click', () => { fileQueue = fileQueue.filter(i => i.status !== 'done'); renderQueue(); });

function renderQueue() {
    let pCount = 0, cCount = 0, pHTML = '', cHTML = '';
    fileQueue.forEach(item => {
        if (item.status === 'pending' || item.status === 'processing') {
            pCount++;
            const isRun = item.status === 'processing';
            pHTML += `<div class="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border ${isRun ? 'border-blue-500/40 shadow-inner' : 'border-gray-700/30'}"><div class="flex-1 min-w-0 pr-2"><div class="text-[13px] font-medium text-gray-200 truncate">${item.file.name}</div><div class="text-[9px] text-gray-500">${(item.file.size/1024).toFixed(1)} KB</div></div>${isRun ? '<span class="text-[9px] text-blue-400">Đang chạy...</span>' : `<button onclick="removeFile('${item.id}')" class="text-gray-500 hover:text-red-400">✕</button>`}</div>`;
        } else {
            cCount++;
            cHTML += `<div class="flex items-center justify-between p-2.5 rounded-lg bg-emerald-900/10 border border-emerald-800/30"><div class="flex-1 min-w-0 pr-2"><div class="text-[13px] font-medium text-emerald-100 truncate line-through opacity-70">${item.file.name}</div><div class="text-[9px] text-emerald-400/70">Đã chuyển sang ${item.formatTarget.toUpperCase()}</div></div><span class="text-emerald-400">✅</span></div>`;
        }
    });

    document.getElementById('pendingCounter').textContent = pCount;
    pendingList.innerHTML = pCount ? pHTML : `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-xs">Trống</div>`;
    
    document.getElementById('completedCounter').textContent = cCount;
    completedList.innerHTML = cCount ? cHTML : `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-[11px]">Chưa có file nào hoàn thành</div>`;
    document.getElementById('clearHistoryBtn').classList.toggle('hidden', cCount === 0);

    if (!isProcessing) {
        if (pCount > 0) {
            processBtn.className = "w-full shrink-0 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all bg-purple-600 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:bg-purple-500 border border-purple-500";
            processBtn.textContent = `XỬ LÝ ${pCount} FILE NGAY`;
        } else {
            processBtn.className = "w-full shrink-0 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-[#1f192e] text-gray-400 border border-gray-700/50";
            processBtn.textContent = 'BẮT ĐẦU XỬ LÝ';
        }
    }
}
function removeFile(id) { fileQueue = fileQueue.filter(item => item.id != id); renderQueue(); }

// --- 5. LOGIC POPUP & HEALTH CHECK KEY ---
const modal = document.getElementById('apiSettingsModal');
const keyListContainer = document.getElementById('keyListContainer');
const indicator = document.getElementById('activeKeyIndicator');

function toggleModal(show) {
    if (show) {
        modal.classList.remove('modal-hidden');
        modal.classList.add('modal-visible');
        renderKeyRows();
    } else {
        modal.classList.remove('modal-visible');
        modal.classList.add('modal-hidden');
        updateIndicator();
    }
}

function updateIndicator() {
    if (activeKeysConfig.length > 0) {
        indicator.className = "ml-2 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]";
    } else {
        indicator.className = "ml-2 w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    }
}

function renderKeyRows() {
    keyListContainer.innerHTML = '';
    apiKeysData.forEach((item, index) => {
        let statusBadge = '';
        if (item.status === 'good') statusBadge = '<span class="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" title="Key hoạt động tốt"></span>';
        else if (item.status === 'limited') statusBadge = '<span class="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" title="Quá tải/Giới hạn Rate Limit"></span>';
        else if (item.status === 'error') statusBadge = '<span class="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" title="Lỗi/Chết"></span>';
        else statusBadge = '<span class="w-3 h-3 rounded-full bg-gray-600" title="Chưa kiểm tra"></span>';

        let modelText = item.model ? `<span class="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded ml-2 border border-purple-500/30">${item.model}</span>` : '';

        keyListContainer.insertAdjacentHTML('beforeend', `
            <div class="flex items-center gap-3 bg-[#130f1c] p-3 rounded-xl border border-gray-700/50 relative group">
                <div class="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-gray-800 text-xs font-bold text-gray-400">${index + 1}</div>
                <div class="flex-1 flex flex-col gap-1">
                    <input type="password" value="${item.key}" oninput="updateKeyValue(${item.id}, this.value)" placeholder="Nhập Gemini API Key (Bắt đầu bằng AIza...)" class="bg-transparent border-b border-gray-600 focus:border-purple-400 outline-none text-sm text-gray-200 w-full font-mono py-1 transition-colors">
                    <div class="flex items-center h-4">${modelText}</div>
                </div>
                <div class="shrink-0 flex items-center gap-3 pl-2 border-l border-gray-700">
                    ${statusBadge}
                    <button onclick="removeKeyRow(${item.id})" class="text-gray-500 hover:text-red-400 p-1 transition-colors"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                </div>
            </div>
        `);
    });
}

function updateKeyValue(id, val) {
    const k = apiKeysData.find(i => i.id === id);
    if(k) { k.key = val.trim(); k.status = 'untested'; k.model = null; }
    renderKeyRows(); // Refresh badge
}

function addNewKeyRow() {
    apiKeysData.push({ id: Date.now(), key: '', status: 'untested', model: null });
    renderKeyRows();
}

function removeKeyRow(id) {
    if (apiKeysData.length <= 1) return; // Luôn giữ lại 1 dòng
    apiKeysData = apiKeysData.filter(i => i.id !== id);
    renderKeyRows();
}

// Hàm Ping để đo tình trạng sức khỏe của Key
document.getElementById('checkAllKeysBtn').addEventListener('click', async () => {
    const btn = document.getElementById('checkAllKeysBtn');
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ĐANG QUÉT...`;

    activeKeysConfig = []; // Reset list key hợp lệ
    const modelsToTest = ['gemini-1.5-flash','gemini-1.5-pro'];

    for (let i = 0; i < apiKeysData.length; i++) {
        let item = apiKeysData[i];
        if (!item.key || item.key.length < 10) {
            item.status = 'error';
            continue;
        }

        item.status = 'error'; // Mặc định là lỗi, nếu pass sẽ đổi
        item.model = null;

        for (let model of modelsToTest) {
            try {
                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${item.key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: "ping" }] }] })
                });

                if (res.ok) {
                    item.status = 'good';
                    item.model = model;
                    activeKeysConfig.push({ key: item.key, model: model });
                    break; // Đã tìm thấy model tương thích, chuyển sang key tiếp theo
                } else if (res.status === 429) {
                    item.status = 'limited'; // Quá tải RPM/TPM
                    break; // Không test model khác nữa vì lỗi do rate limit của tài khoản
                }
            } catch (e) {
                // Ignore network error
            }
        }
        renderKeyRows(); // Cập nhật giao diện từng bước
    }

    btn.disabled = false;
    btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> KIỂM TRA XONG`;
    setTimeout(() => { btn.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> KIỂM TRA & LƯU`; }, 2000);
    
    updateIndicator();
});

// --- 6. KẾT NỐI API GEMINI & CHUYỂN ĐỔI ---
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function callGeminiAPI(file, targetFormat, config) {
    const base64Data = await fileToBase64(file);
    let promptInstruction = "Hãy trích xuất văn bản từ tài liệu này.";
    if (targetFormat === 'excel') promptInstruction = "Trích xuất toàn bộ bảng biểu và dữ liệu từ tài liệu này. Định dạng đầu ra bắt buộc là CSV chuẩn, phân cách bằng dấu phẩy (,). Không thêm bất kỳ văn bản giải thích hay markdown code block nào, chỉ trả về đúng dữ liệu CSV.";
    else if (targetFormat === 'word') promptInstruction = "Trích xuất toàn bộ văn bản, giữ nguyên cấu trúc đoạn văn, tiêu đề. Trình bày rõ ràng. Không sử dụng markdown code block.";

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptInstruction }, { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } }] }] })
    });

    if (!response.ok) throw new Error((await response.json()).error?.message || "Lỗi API");
    return (await response.json()).candidates[0].content.parts[0].text;
}

processBtn.addEventListener('click', async () => {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    if (activeKeysConfig.length === 0) {
        alert("Chưa có API Key nào hoạt động! Vui lòng bấm vào [CẤU HÌNH API], nhập Key và bấm KIỂM TRA.");
        toggleModal(true);
        return;
    }

    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> AI ĐANG XỬ LÝ...</span>`;

    const targetFormat = selectedFormat;
    let currentKeyIndex = 0; // Để xoay vòng Key nếu có nhiều Key

    for (let i = 0; i < fileQueue.length; i++) {
        if (fileQueue[i].status !== 'pending') continue;

        fileQueue[i].status = 'processing';
        renderQueue();

        try {
            // Lấy Key theo vòng lặp (Round Robin)
            const config = activeKeysConfig[currentKeyIndex % activeKeysConfig.length];
            
            const aiGeneratedText = await callGeminiAPI(fileQueue[i].file, targetFormat, config);
            
            fileQueue[i].formatTarget = targetFormat;
            fileQueue[i].status = 'done';
            
            renderQueue();
            triggerAutoDownload(fileQueue[i].file.name, targetFormat, aiGeneratedText);
            
            currentKeyIndex++; // Chuyển sang key tiếp theo cho file sau

        } catch (error) {
            console.error("Lỗi:", error);
            fileQueue[i].status = 'pending'; 
            alert(`Lỗi khi xử lý ${fileQueue[i].file.name}. Có thể do Key quá tải. Hãy kiểm tra lại cấu hình API.`);
            renderQueue();
            break; 
        }
    }

    isProcessing = false;
    processBtn.disabled = false;
    renderQueue();
});

function triggerAutoDownload(originalName, format, fileContent) {
    const newExt = { 'excel': '.csv', 'word': '.doc', 'ppt': '.txt', 'pdf': '_extracted.txt' }[format] || '.txt';
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, fileContent], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${originalName.substring(0, originalName.lastIndexOf('.')) || originalName}_converted${newExt}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
