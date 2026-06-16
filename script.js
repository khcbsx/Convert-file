// =====================================================================
// 1. KHO API KEY & TRẠM QUẢN LÝ SỨC KHỎE (TỐI ƯU 100% QUOTA)
// =====================================================================
const PREDEFINED_KEYS = [
    "AQ." + "Ab8RN6Ixv7w35Mma" + "fHrBeEgwW3ni0Vpyw6teNU0SAcv1AWq-jw",
    "AQ.A" + "b8RN6KcKrHH9cpQ" + "jjii_QUdnQDmtw6C8jmHSSnuZRgMXrba4g",
    "AQ.Ab" + "8RN6JvXayxgCr_1" + "C66LQL-tBqQxJ5Ydn8v6NNxJaP7_WUQWA",
    "AQ.Ab8" + "RN6KjzHGky7R85L" + "azd6WK2XdaYkhvQwDM0sh-YYna4cE4Jw",
    "AQ.Ab8R" + "N6LOtYa561irvzt" + "PFBYFnmbks7n6UupZrK7sk9Tf8qdDFQ"
];

let GLOBAL_KEYS_DB = [];

window.onload = () => {
    // Nạp Key vào DB, MẶC ĐỊNH MÀU XANH TẤT CẢ (Sẵn sàng) để tiết kiệm lượt gọi
    PREDEFINED_KEYS.forEach((k, index) => {
        if(k && k.length > 10) GLOBAL_KEYS_DB.push({ id: index + 1, key: k, source: "Cố định", status: "good" });
    });
    updateKeyBadge();
    renderKeyDashboard();
};

function updateKeyBadge() {
    const badge = document.getElementById('keyCounterBadge');
    const goodCount = GLOBAL_KEYS_DB.filter(k => k.status === 'good').length;
    
    if (goodCount > 0) {
        badge.textContent = `TỔNG: ${GLOBAL_KEYS_DB.length} KEY (${goodCount} SẴN SÀNG)`;
        badge.className = "text-[10px] cursor-pointer hover:bg-emerald-800/40 transition-colors font-mono bg-emerald-900/20 text-emerald-400 px-3 py-1.5 rounded-md border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    } else {
        badge.textContent = `TỔNG: ${GLOBAL_KEYS_DB.length} KEY (CHẾT HẾT)`;
        badge.className = "text-[10px] cursor-pointer hover:bg-red-800/40 transition-colors font-mono bg-red-900/20 text-red-400 px-3 py-1.5 rounded-md border border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]";
    }
}

// HÀM TEST KHI NGƯỜI DÙNG CHỦ ĐỘNG BẤM NÚT
async function pingGeminiKey(keyObj) {
    keyObj.status = 'testing';
    renderKeyDashboard();
    
    const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let isAlive = false;

    for (let model of modelsToTry) {
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyObj.key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: "1" }] }], generationConfig: { maxOutputTokens: 1 } })
            });
            
            if (res.ok || res.status === 429 || res.status >= 500) {
                isAlive = true; break; 
            }
        } catch (e) { }
    }
    
    keyObj.status = isAlive ? 'good' : 'error';
    updateKeyBadge();
    renderKeyDashboard();
}

async function testAllKeys() {
    const btn = document.getElementById('btnTestAll');
    btn.disabled = true; btn.innerHTML = 'ĐANG QUÉT...';
    
    // Test tuần tự thủ công
    for (let k of GLOBAL_KEYS_DB) {
        await pingGeminiKey(k);
        await new Promise(resolve => setTimeout(resolve, 800)); 
    }
    
    btn.disabled = false; btn.innerHTML = 'KIỂM TRA ĐỒNG LOẠT';
}

function renderKeyDashboard() {
    const container = document.getElementById('keyStatusContainer');
    container.innerHTML = '';
    
    GLOBAL_KEYS_DB.forEach(k => {
        let statusUI = '';
        if (k.status === 'testing') statusUI = `<span class="flex items-center gap-1.5 text-blue-400"><svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Đang dò...</span>`;
        else if (k.status === 'good') statusUI = `<span class="flex items-center gap-1.5 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.3)]"><div class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div> Hoạt động / Sẵn sàng</span>`;
        else statusUI = `<span class="flex items-center gap-1.5 text-red-400 font-bold"><div class="w-2 h-2 rounded-full bg-red-500"></div> Hết Quota / Lỗi</span>`;

        const maskedKey = k.key.substring(0, 8) + '••••••••' + k.key.substring(k.key.length - 4);

        container.insertAdjacentHTML('beforeend', `
            <div class="flex items-center justify-between p-3 rounded-xl border border-gray-700/50 bg-[#161224]/80">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold text-gray-300 w-12">Key ${k.id}</span>
                    <span class="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400">${k.source}</span>
                    <span class="text-xs font-mono text-gray-500">${maskedKey}</span>
                </div>
                <div class="text-xs flex items-center gap-4">
                    ${statusUI}
                    <button onclick="pingGeminiKey(GLOBAL_KEYS_DB.find(x => x.id === ${k.id}))" class="text-gray-500 hover:text-white p-1" title="Test lại Key này"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg></button>
                </div>
            </div>
        `);
    });
}

function saveApiKeys() {
    const rawText = document.getElementById('apiKeysInput').value;
    const keys = rawText.split(/[\n,\s]+/).map(k => k.trim()).filter(k => k.length > 10);
    
    if (keys.length === 0) return;

    let startId = GLOBAL_KEYS_DB.length + 1;
    keys.forEach(k => {
        const newKeyObj = { id: startId++, key: k, source: "Mới nạp", status: "good" };
        GLOBAL_KEYS_DB.push(newKeyObj);
    });

    document.getElementById('apiKeysInput').value = '';
    updateKeyBadge();
    renderKeyDashboard();
}

function toggleModal(show) {
    const modal = document.getElementById('apiModal');
    const content = document.getElementById('apiModalContent');
    if (show) {
        modal.classList.remove('hidden');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    } else {
        modal.classList.add('opacity-0'); content.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); }, 300);
    }
}

function showErrorToast() {
    const toast = document.getElementById('errorToast');
    toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-10');
    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-10');
    }, 6000);
}

// --- 2. QUẢN LÝ TRẠNG THÁI HỆ THỐNG ---
let fileQueue = []; 
let selectedFormat = 'excel';
let isProcessing = false;
let currentKeyIndex = 0; 

const formats = [
    { id: 'excel', name: 'Microsoft Excel', desc: 'EXTRACT DATA', color: 'text-emerald-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm0 16H8v-2h6v2zm2-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'word', name: 'Microsoft Word', desc: 'PRESERVE TABLES', color: 'text-blue-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'ppt', name: 'PowerPoint', desc: 'GENERATE SLIDES', color: 'text-orange-400', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-3 5-3v6zm7 0l-5-3 5-3v6z"/>' },
    { id: 'pdf', name: 'PDF Document', desc: 'CONVERT TO PDF', color: 'text-red-400', icon: '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11h1V8.5h-1V11z"/>' }
];

// Khởi tạo mảng lưu các định dạng được phép hiển thị
let allowedFormats = ['excel', 'word', 'ppt', 'pdf'];

// HÀM MỚI: BỘ LỌC GIAO DIỆN ĐỘNG
function checkFileTypeAndUpdateUI() {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
        // Nếu không có file nào đang chờ, hiện lại tất cả các nút
        allowedFormats = ['excel', 'word', 'ppt', 'pdf']; 
    } else {
        // Lấy file đầu tiên trong hàng đợi làm chuẩn để thiết lập UI
        const firstFileName = pendingFiles[0].file.name.toLowerCase();
        
        if (firstFileName.endsWith('.pdf') || firstFileName.match(/\.(jpg|jpeg|png)$/)) {
            allowedFormats = ['word', 'excel'];
            if (!allowedFormats.includes(selectedFormat)) selectedFormat = 'excel';
        } 
        else if (firstFileName.endsWith('.docx') || firstFileName.endsWith('.doc')) {
            allowedFormats = ['excel'];
            selectedFormat = 'excel'; // Ép người dùng chỉ được chọn Excel
        } 
        else if (firstFileName.endsWith('.xlsx') || firstFileName.endsWith('.xls') || firstFileName.endsWith('.csv')) {
            allowedFormats = ['word'];
            selectedFormat = 'word'; // Ép người dùng chỉ được chọn Word
        }
    }
    renderFormats();
}

const formatContainer = document.getElementById('formatContainer');
function renderFormats() {
    formatContainer.innerHTML = '';
    formats.forEach(format => {
        // CHỈ RENDER các nút nằm trong danh sách cho phép
        if (allowedFormats.includes(format.id)) {
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
        }
    });
}

function selectFormat(id) { 
    // Chặn người dùng cố tình click vào định dạng không được phép
    if(!isProcessing && allowedFormats.includes(id)) { 
        selectedFormat = id; 
        renderFormats(); 
    } 
}
renderFormats();

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
dropZone.addEventListener('click', () => { if(!isProcessing) fileInput.click(); });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-active'); if (!isProcessing && e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files); });
fileInput.addEventListener('change', (e) => { if (!isProcessing && e.target.files.length > 0) handleFiles(e.target.files); fileInput.value = ''; });

function handleFiles(files) {
    Array.from(files).forEach(f => fileQueue.push({ id: Date.now() + Math.random(), file: f, status: 'pending', formatTarget: null }));
    checkFileTypeAndUpdateUI(); // Tự động quét đuôi file và kích hoạt Bộ lọc Giao diện
    renderQueue();
}

const pendingList = document.getElementById('pendingList');
const completedList = document.getElementById('completedList');
const processBtn = document.getElementById('processBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
if(clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => { fileQueue = fileQueue.filter(i => i.status !== 'done'); renderQueue(); });

function renderQueue() {
    let pCount = 0, cCount = 0, pHTML = '', cHTML = '';
    fileQueue.forEach(item => {
        if (item.status === 'pending' || item.status === 'processing' || item.status === 'delaying') {
            pCount++;
            const isRun = item.status === 'processing';
            const isDelay = item.status === 'delaying';
            
            let statusText = '';
            if (isRun) statusText = '<span class="text-[9px] text-blue-400">Đang phân tích...</span>';
            else if (isDelay) statusText = '<span class="text-[9px] text-yellow-400">Đang chờ...</span>';
            else statusText = `<button onclick="removeFile('${item.id}')" class="text-gray-500 hover:text-red-400">✕</button>`;

            pHTML += `<div class="flex items-center justify-between p-2.5 rounded-lg bg-black/20 border ${isRun||isDelay ? 'border-blue-500/40 shadow-inner' : 'border-gray-700/30'}"><div class="flex-1 min-w-0 pr-2"><div class="text-[13px] font-medium text-gray-200 truncate">${item.file.name}</div><div class="text-[9px] text-gray-500">${(item.file.size/1024).toFixed(1)} KB</div></div>${statusText}</div>`;
        } else {
            cCount++;
            cHTML += `<div class="flex items-center justify-between p-2.5 rounded-lg bg-emerald-900/10 border border-emerald-800/30"><div class="flex-1 min-w-0 pr-2"><div class="text-[13px] font-medium text-emerald-100 truncate line-through opacity-70">${item.file.name}</div><div class="text-[9px] text-emerald-400/70">Đã chuyển sang ${item.formatTarget.toUpperCase()}</div></div><span class="text-emerald-400">✅</span></div>`;
        }
    });

    document.getElementById('pendingCounter').textContent = pCount;
    pendingList.innerHTML = pCount ? pHTML : `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-xs">Trống</div>`;
    document.getElementById('completedCounter').textContent = cCount;
    completedList.innerHTML = cCount ? cHTML : `<div class="h-full flex flex-col items-center justify-center text-gray-500 text-[11px]">Chưa có file nào hoàn thành</div>`;
    
    if(clearHistoryBtn) clearHistoryBtn.classList.toggle('hidden', cCount === 0);

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
function removeFile(id) { 
    fileQueue = fileQueue.filter(item => item.id != id); 
    checkFileTypeAndUpdateUI(); // Nếu người dùng xóa file, phải check lại xem cần mở khóa giao diện không
    renderQueue(); 
}

// =====================================================================
// 6A. LOGIC AI - ĐƯỜNG RAY EXCEL (BẢO TOÀN 100% NGUYÊN BẢN & FIX LỖI UI)
// =====================================================================
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function callGeminiAPI_Excel(file) {
    const base64Data = await fileToBase64(file);
    const promptInstruction = `Bạn là chuyên gia trích xuất dữ liệu từ PDF/Hình ảnh sang CSV.
YÊU CẦU:
1. CHỈ TRẢ VỀ CSV thô, ngăn cách bằng dấu phẩy (,). KHÔNG giải thích.
2. LOẠI BỎ toàn bộ ký hiệu tiền tệ ('$', 'VND').
3. Bất kỳ giá trị nào chứa dấu phẩy phải bọc trong ngoặc kép ("").
4. XUẤT NGÀY THÁNG BÌNH THƯỜNG.

CẤU TRÚC CSV BẮT BUỘC:
PHẦN 1: THÔNG TIN CHUNG
Trường thông tin,Giá trị
[Trích xuất TẤT CẢ các trường thông tin chung ở đầu tài liệu thành 2 cột]

[Sau khi hết Phần 1, BẮT BUỘC thêm đúng 1 dòng có chứa chữ "---SPLIT---" để làm điểm cắt]
---SPLIT---

PHẦN 2: BẢNG DỮ LIỆU CHI TIẾT
- BẮT BUỘC CÓ CHÍNH XÁC 11 CỘT:
Ln #,Item No,Description,Ref. Order #,Confirmed Del. Date,Req. Due Date,Delivery Terms,Price,Quantity,U/M,Sub Total
- Điền đầy đủ các dòng. Nếu cột nào trống (ví dụ: Confirmed Del. Date), hãy để trống giữa 2 dấu phẩy. Dữ liệu ngày tháng phải cho vào đúng cột "Req. Due Date".
- DÒNG TỔNG CỘNG: Ở dưới cùng, dùng 9 dấu phẩy ở trước để chữ Total Amount rơi vào cột J:
,,,,,,,,,Total Amount,[Số tiền tổng]`;

    let activeKeys = GLOBAL_KEYS_DB.filter(k => k.status !== 'error');
    if(activeKeys.length === 0) throw new Error("ALL_DEAD");

    let attempts = 0;
    while (attempts < activeKeys.length) {
        activeKeys = GLOBAL_KEYS_DB.filter(k => k.status !== 'error');
        if(activeKeys.length === 0) break;

        const currentKeyObj = activeKeys[currentKeyIndex % activeKeys.length];
        const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        
        let isKeyDead = true; // MẶC ĐỊNH: Nghi ngờ Key này đã chết

        for (let model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKeyObj.key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptInstruction }, { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    let rawText = data.candidates[0].content.parts[0].text;
                    currentKeyObj.status = 'good'; // Thành công -> Xóa án
                    updateKeyBadge(); renderKeyDashboard();
                    return rawText.replace(/```csv\n/g, "").replace(/```/g, "").trim(); 
                } 
                else if (response.status === 429 || response.status >= 500) {
                    // CHỈ tha bổng nếu Google báo quá tải (429) hoặc sập server (500)
                    isKeyDead = false; 
                    break; // Thoát vòng lặp model, nhường việc cho Key tiếp theo
                }
                // Các lỗi như 404, 400, 403 đi qua đây, isKeyDead vẫn là TRUE
            } catch (e) {
                // Lỗi ERR_FAILED chui vào đây. isKeyDead vẫn giữ nguyên là TRUE
            } 
        }
        
        // KIỂM TRA LẠI: Nếu vẫn mang án tử -> Gạch đỏ ngay lập tức!
        if (isKeyDead) {
            currentKeyObj.status = 'error';
        }
        
        updateKeyBadge(); 
        renderKeyDashboard();
        
        currentKeyIndex++; 
        attempts++;
    }
    throw new Error("Quá tải hoặc tất cả API Key đều đã hỏng!");
}

// =====================================================================
// 6B. LOGIC AI - ĐƯỜNG RAY WORD (MỚI & ĐỘC LẬP HOÀN TOÀN)
// =====================================================================
async function callGeminiAPI_Word(file) {
    const base64Data = await fileToBase64(file);
    const promptInstruction = `Bạn là chuyên gia số hóa tài liệu siêu việt.
YÊU CẦU TỐI THƯỢNG:
1. Đọc và trích xuất TOÀN BỘ nội dung văn bản từ PDF/Hình ảnh này.
2. Giữ nguyên tối đa cấu trúc, bố cục, các thẻ tiêu đề (Heading), đoạn văn, danh sách và bảng biểu.
3. TRẢ VỀ DƯỚI DẠNG MÃ HTML THUẦN TÚY (Chỉ dùng các thẻ cơ bản như <h1>, <h2>, <p>, <ul>, <li>, <table>, <tr>, <td>...).
4. Đảm bảo bảng <table> có thuộc tính border="1" style="border-collapse: collapse; width: 100%;".
5. TUYỆT ĐỐI KHÔNG bọc trong markdown (không dùng \`\`\`html), KHÔNG giải thích, CHỈ XUẤT RA mã HTML.`;

    let activeKeys = GLOBAL_KEYS_DB.filter(k => k.status !== 'error');
    if(activeKeys.length === 0) throw new Error("ALL_DEAD");

    let attempts = 0;
    while (attempts < activeKeys.length) {
        activeKeys = GLOBAL_KEYS_DB.filter(k => k.status !== 'error');
        if(activeKeys.length === 0) break;

        const currentKeyObj = activeKeys[currentKeyIndex % activeKeys.length];
        const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];
        
        let isKeyDead = true; 

        for (let model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKeyObj.key}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptInstruction }, { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    let rawText = data.candidates[0].content.parts[0].text;
                    currentKeyObj.status = 'good'; 
                    updateKeyBadge(); renderKeyDashboard();
                    return rawText.replace(/```html\n/g, "").replace(/```/g, "").trim(); 
                } 
                else if (response.status === 429 || response.status >= 500) {
                    isKeyDead = false; 
                    break;
                }
            } catch (e) {
            } 
        }
        
        if (isKeyDead) {
            currentKeyObj.status = 'error';
        }
        
        updateKeyBadge(); 
        renderKeyDashboard();
        
        currentKeyIndex++; 
        attempts++;
    }
    throw new Error("Quá tải hoặc tất cả API Key đều đã hỏng!");
}

// =====================================================================
// 7. NGƯỜI GÁC CỔNG: BỘ ĐIỀU PHỐI VÀ CHIA MẺ 5 FILE
// =====================================================================
processBtn.addEventListener('click', async () => {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    isProcessing = true;
    processBtn.disabled = true;
    
    const targetFormat = selectedFormat;
    let filesProcessedInCurrentBatch = 0; 

    for (let i = 0; i < fileQueue.length; i++) {
        if (fileQueue[i].status !== 'pending') continue;

        fileQueue[i].status = 'processing';
        
        processBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> ĐANG XỬ LÝ (${filesProcessedInCurrentBatch + 1}/5 CỦA MẺ)...</span>`;
        renderQueue();

        try {
            let aiGeneratedText = "";
            
            // BẺ GHI LUỒNG CHẠY (Phân phối công việc)
            if (targetFormat === 'excel') {
                aiGeneratedText = await callGeminiAPI_Excel(fileQueue[i].file);
                fileQueue[i].formatTarget = targetFormat;
                fileQueue[i].status = 'done';
                renderQueue();
                triggerAutoDownload_Excel(fileQueue[i].file.name, aiGeneratedText);
            } 
            else if (targetFormat === 'word') {
                aiGeneratedText = await callGeminiAPI_Word(fileQueue[i].file);
                fileQueue[i].formatTarget = targetFormat;
                fileQueue[i].status = 'done';
                renderQueue();
                triggerAutoDownload_Word(fileQueue[i].file.name, aiGeneratedText);
            }
            
            filesProcessedInCurrentBatch++; 

            const remainingFiles = fileQueue.filter(f => f.status === 'pending').length;
            if (remainingFiles > 0) {
                const nextPendingFileIndex = fileQueue.findIndex(f => f.status === 'pending');
                if (nextPendingFileIndex !== -1) {
                    if (filesProcessedInCurrentBatch >= 5) {
                        fileQueue[nextPendingFileIndex].status = 'delaying';
                        processBtn.innerHTML = `<span class="flex items-center justify-center gap-2 text-yellow-400"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> NGHỈ 60S ĐỂ RESET BĂNG THÔNG API...</span>`;
                        renderQueue();
                        await new Promise(resolve => setTimeout(resolve, 60000)); 
                        filesProcessedInCurrentBatch = 0; 
                        fileQueue[nextPendingFileIndex].status = 'pending';
                    } else {
                        fileQueue[nextPendingFileIndex].status = 'delaying';
                        renderQueue();
                        await new Promise(resolve => setTimeout(resolve, 3000)); 
                        fileQueue[nextPendingFileIndex].status = 'pending'; 
                    }
                }
            }
        } catch (error) {
            fileQueue[i].status = 'pending'; 
            renderQueue();
            if(error.message === "ALL_DEAD") {
                showErrorToast();
                toggleModal(true); 
            } else {
                alert(error.message);
            }
            break; 
        }
    }

    isProcessing = false;
    processBtn.disabled = false;
    renderQueue();
});

// =====================================================================
// 8A. ĐÓNG GÓI EXCEL (BẢO TOÀN 100% NGUYÊN BẢN)
// =====================================================================
function triggerAutoDownload_Excel(originalName, fileContent) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    try {
        const tempWb = XLSX.read(fileContent, { type: "string", raw: true });
        const tempWs = tempWb.Sheets[tempWb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(tempWs, {header: 1});

        let splitIndex = -1;
        for (let i = 0; i < aoa.length; i++) {
            if (aoa[i][0] && aoa[i][0].toString().includes("---SPLIT---")) { splitIndex = i; break; }
        }

        let metadataAoA = [], tableAoA = [];
        if (splitIndex !== -1) {
            metadataAoA = aoa.slice(0, splitIndex).filter(row => row.length > 0 && row.some(c => c !== ""));
            tableAoA = aoa.slice(splitIndex + 1).filter(row => row.length > 0 && row.some(c => c !== ""));
        } else metadataAoA = aoa; 

        for (let i = 0; i < tableAoA.length; i++) {
            [7, 8, 10].forEach(colIdx => {
                if (tableAoA[i][colIdx] !== undefined && tableAoA[i][colIdx] !== "") {
                    let val = tableAoA[i][colIdx].toString().trim();
                    if (!isNaN(parseFloat(val)) && !val.includes("/")) { 
                        tableAoA[i][colIdx] = parseFloat(val);
                    }
                }
            });
        }

        const finalAoA = [];
        const maxRows = Math.max(metadataAoA.length, tableAoA.length);
        for (let i = 0; i < maxRows; i++) {
            const row = [];
            if (i < metadataAoA.length) { row.push(metadataAoA[i][0] || ""); row.push(metadataAoA[i][1] || ""); } else row.push("", "");
            row.push("");
            if (i < tableAoA.length) row.push(...tableAoA[i]);
            finalAoA.push(row);
        }

        const finalWs = XLSX.utils.aoa_to_sheet(finalAoA);
        finalWs['!cols'] = [{wch: 22}, {wch: 35}, {wch: 2}, {wch: 8}, {wch: 15}, {wch: 40}, {wch: 12}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 10}, {wch: 10}, {wch: 8}, {wch: 15}]; 

        const maxMetadataRow = metadataAoA.length - 1;
        const maxTableRow = tableAoA.length - 1;
        const range = XLSX.utils.decode_range(finalWs['!ref']);

        for(let R = range.s.r; R <= range.e.r; ++R) {
            for(let C = range.s.c; C <= range.e.c; ++C) {
                const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                let needBorder = false;
                let isHeader = false; 

                if ((C === 0 || C === 1) && R <= maxMetadataRow) {
                    needBorder = true;
                    if (C === 0) isHeader = true; 
                } else if (C >= 3 && C <= 13 && R <= maxTableRow) {
                    needBorder = true;
                    if (R === 0) isHeader = true; 
                }

                if (needBorder) {
                    if (!finalWs[cell_ref]) finalWs[cell_ref] = { t: 's', v: '' }; 
                    let cellStyle = {
                        border: { top: {style: "thin", color: {rgb: "000000"}}, bottom: {style: "thin", color: {rgb: "000000"}}, left: {style: "thin", color: {rgb: "000000"}}, right: {style: "thin", color: {rgb: "000000"}} },
                        alignment: { vertical: "center", wrapText: true }
                    };
                    if (C === 10 || C === 11 || C === 13) {
                        cellStyle.alignment.horizontal = "right";
                    }
                    
                    if (isHeader) {
                        cellStyle.fill = { fgColor: { rgb: "B4C6E7" } };
                        cellStyle.font = { bold: true, color: { rgb: "000000" } };
                        cellStyle.alignment.horizontal = "center"; 
                    }
                    finalWs[cell_ref].s = cellStyle;
                }
            }
        }

        const newWb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(newWb, finalWs, "Data");
        XLSX.writeFile(newWb, `${baseName}_converted.xlsx`);

    } catch (error) {
        console.error(error); alert("Đã xảy ra lỗi đóng gói Excel.");
    }
}

// =====================================================================
// 8B. ĐÓNG GÓI WORD (MỚI & ĐỘC LẬP HOÀN TOÀN)
// =====================================================================
function triggerAutoDownload_Word(originalName, fileContent) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    try {
        const wordHeaders = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'><title>Export HTML to Word</title>
        <style>
            body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
            h1, h2, h3 { color: #2c3e50; }
            table { border-collapse: collapse; width: 100%; margin-top: 15px; margin-bottom: 15px; }
            th, td { border: 1px solid #000000; padding: 8px; text-align: left; vertical-align: middle; }
            th { background-color: #e2e8f0; font-weight: bold; }
            ul, ol { margin-top: 5px; margin-bottom: 5px; }
        </style>
        </head><body>`;
        const wordFooters = "</body></html>";
        
        const fullWordContent = wordHeaders + fileContent + wordFooters;

        const blob = new Blob(['\ufeff', fullWordContent], { type: 'application/msword' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_converted.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error(error); alert("Đã xảy ra lỗi đóng gói Word.");
    }
}
