// =====================================================================
// 1. KHO DỰ TRỮ API KEY CỐ ĐỊNH (Giữ nguyên khi F5/Tắt trang)
// =====================================================================
const PREDEFINED_KEYS = [
    "AQ." + "Ab8RN6Ixv7w35Mma" + "fHrBeEgwW3ni0Vpyw6teNU0SAcv1AWq-jw",
    
    "AQ.A" + "b8RN6KcKrHH9cpQ" + "jjii_QUdnQDmtw6C8jmHSSnuZRgMXrba4g",
    
    "AQ.Ab" + "8RN6JvXayxgCr_1" + "C66LQL-tBqQxJ5Ydn8v6NNxJaP7_WUQWA",
    
    "AQ.Ab8" + "RN6KjzHGky7R85L" + "azd6WK2XdaYkhvQwDM0sh-YYna4cE4Jw",
    
    "AQ.Ab8R" + "N6LOtYa561irvzt" + "PFBYFnmbks7n6UupZrK7sk9Tf8qdDFQ"
];

// Mảng chứa các Key nhập từ giao diện (Chỉ lưu trong RAM, F5 sẽ BỊ XÓA TRẮNG)
let UI_API_KEYS = []; 

// --- 2. QUẢN LÝ TRẠNG THÁI HỆ THỐNG ---
let fileQueue = []; 
let selectedFormat = 'excel';
let isProcessing = false;
let currentKeyIndex = 0; 

const formats = [
    { id: 'word', name: 'Microsoft Word', desc: 'PRESERVE TABLES', color: 'text-blue-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm-2 16H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'excel', name: 'Microsoft Excel', desc: 'EXTRACT DATA', color: 'text-emerald-400', icon: '<path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm0 16H8v-2h6v2zm2-4H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>' },
    { id: 'ppt', name: 'PowerPoint', desc: 'GENERATE SLIDES', color: 'text-orange-400', icon: '<path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-3 5-3v6zm7 0l-5-3 5-3v6z"/>' },
    { id: 'pdf', name: 'PDF Document', desc: 'CONVERT TO PDF', color: 'text-red-400', icon: '<path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM14 11h1V8.5h-1V11z"/>' }
];

// Khởi chạy ngay khi tải trang
window.onload = () => {
    updateKeyBadge(); // Chỉ hiển thị số lượng key cố định có sẵn
};

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

// Xử lý lưu Key tạm thời từ Giao diện
function saveApiKeys() {
    const rawText = document.getElementById('apiKeysInput').value;
    const keys = rawText.split(/[\n,\s]+/).map(k => k.trim()).filter(k => k.length > 10);
    
    UI_API_KEYS = keys; 
    updateKeyBadge();
    toggleModal(false);
    alert(`Đã nạp tạm thời ${keys.length} Key từ giao diện. Các Key này sẽ TỰ HỦY khi bạn F5 hoặc đóng trang.`);
}

function updateKeyBadge() {
    const badge = document.getElementById('keyCounterBadge');
    const validPredefined = PREDEFINED_KEYS.filter(k => k && k.length > 10).length;
    const totalCount = validPredefined + UI_API_KEYS.length;
    
    badge.textContent = `Tổng hợp: ${totalCount} Key`;
    if (totalCount > 0) {
        badge.className = "text-[10px] font-mono bg-emerald-900/20 text-emerald-400 px-2 py-1 rounded-md border border-emerald-500/50";
    } else {
        badge.className = "text-[10px] text-gray-400 font-mono bg-gray-800/50 px-2 py-1 rounded-md border border-gray-700/50";
    }
}

// --- 3. RENDER GIAO DIỆN ĐỊNH DẠNG ---
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

// --- 4. KÉO THẢ FILES ---
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

// --- 5. RENDER DANH SÁCH FILE ---
const pendingList = document.getElementById('pendingList');
const completedList = document.getElementById('completedList');
const processBtn = document.getElementById('processBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
if(clearHistoryBtn) {
    clearHistoryBtn.addEventListener('click', () => { fileQueue = fileQueue.filter(i => i.status !== 'done'); renderQueue(); });
}

function renderQueue() {
    let pCount = 0, cCount = 0, pHTML = '', cHTML = '';
    fileQueue.forEach(item => {
        if (item.status === 'pending' || item.status === 'processing' || item.status === 'delaying') {
            pCount++;
            const isRun = item.status === 'processing';
            const isDelay = item.status === 'delaying';
            
            let statusText = '';
            if (isRun) statusText = '<span class="text-[9px] text-blue-400">Đang phân tích...</span>';
            else if (isDelay) statusText = '<span class="text-[9px] text-yellow-400">Đang chờ (chống Spam)...</span>';
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
function removeFile(id) { fileQueue = fileQueue.filter(item => item.id != id); renderQueue(); }

// =====================================================================
// 6. LOGIC AI - KHÓA CỨNG CẤU TRÚC BẢNG & NGÀY THÁNG
// =====================================================================

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function callGeminiAPI(file, targetFormat) {
    const base64Data = await fileToBase64(file);
    
    let promptInstruction = "";
    if (targetFormat === 'excel') {
        promptInstruction = `Bạn là chuyên gia trích xuất dữ liệu từ PDF/Hình ảnh sang CSV.

YÊU CẦU TỐI THƯỢNG:
1. CHỈ TRẢ VỀ CSV thô, ngăn cách bằng dấu phẩy (,). KHÔNG giải thích, KHÔNG bọc trong markdown.
2. LOẠI BỎ toàn bộ ký hiệu tiền tệ ('$', 'VND').
3. Bất kỳ giá trị nào chứa dấu phẩy phải bọc trong ngoặc kép ("").
4. ĐỊNH DẠNG NGÀY THÁNG: Thêm một CẢ KHOẢNG TRẮNG (Space) vào ngay trước các ngày tháng (Ví dụ: " 06/09/26", " 09/10/26") để ép Excel giữ nguyên nó là Text, không được tự động chuyển thành số serial.

CẤU TRÚC BẮT BUỘC (Phải tuân thủ 100%):

PHẦN 1: THÔNG TIN CHUNG
Trường thông tin,Giá trị
[Trích xuất TẤT CẢ các trường thông tin chung ở đầu tài liệu thành 2 cột]

[Sau khi hết Phần 1, thêm đúng 1 dòng trống: , ]

PHẦN 2: BẢNG DỮ LIỆU CHI TIẾT
- BẮT BUỘC XUẤT CHÍNH XÁC 11 CỘT SAU (kể cả khi trên PDF không có cột đó, vẫn phải để trống bằng dấu phẩy):
Ln #,Item No,Description,Ref. Order #,Confirmed Del. Date,Req. Due Date,Delivery Terms,Price,Quantity,U/M,Sub Total
- Dữ liệu ngày tháng (09/10/26) phải điền vào đúng cột "Req. Due Date". Cột "Confirmed Del. Date" hãy để trống (,).
- DÒNG TỔNG CỘNG: Đặt ở dòng cuối cùng. BẮT BUỘC dùng chính xác 9 dấu phẩy ở phía trước để đẩy chữ "Total Amount" vào cột J, và số tiền vào cột K, y hệt như sau:
,,,,,,,,,Total Amount,[Số tiền tổng]`;
    } else {
        promptInstruction = "Trích xuất văn bản, giữ nguyên cấu trúc. Không dùng thẻ code block.";
    }
    
    const activeKeysConfig = [...UI_API_KEYS, ...PREDEFINED_KEYS].filter(k => k && k.length > 10);
    if(activeKeysConfig.length === 0) throw new Error("Hệ thống trống Key! Hãy nạp Key vào.");

    let attempts = 0;
    while (attempts < activeKeysConfig.length) {
        const currentKey = activeKeysConfig[currentKeyIndex % activeKeysConfig.length];
        const modelsToTry = ['gemini-2.5-flash', 'gemini-3-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
        
        for (let model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptInstruction }, { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    let rawText = data.candidates[0].content.parts[0].text;
                    return rawText.replace(/```csv\n/g, "").replace(/```/g, "").trim(); 
                }
            } catch (e) {}
        }
        currentKeyIndex++; 
        attempts++;
    }
    throw new Error("TẤT CẢ CÁC KEY SẴN CÓ VÀ KEY VỪA NẠP ĐỀU BÁO LỖI HOẶC HẾT LƯỢT GỌI!");
}

// =====================================================================
// 7. VÒNG LẶP XỬ LÝ (CÓ DELAY 4S)
// =====================================================================
processBtn.addEventListener('click', async () => {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> HỆ THỐNG ĐANG CHẠY...</span>`;

    const targetFormat = selectedFormat;

    for (let i = 0; i < fileQueue.length; i++) {
        if (fileQueue[i].status !== 'pending') continue;

        fileQueue[i].status = 'processing';
        renderQueue();

        try {
            const aiGeneratedText = await callGeminiAPI(fileQueue[i].file, targetFormat);
            fileQueue[i].formatTarget = targetFormat;
            fileQueue[i].status = 'done';
            renderQueue();
            
            triggerAutoDownload(fileQueue[i].file.name, targetFormat, aiGeneratedText);

            const remainingFiles = fileQueue.filter(f => f.status === 'pending').length;
            if (remainingFiles > 0) {
                const nextPendingFileIndex = fileQueue.findIndex(f => f.status === 'pending');
                if (nextPendingFileIndex !== -1) {
                    fileQueue[nextPendingFileIndex].status = 'delaying';
                    renderQueue();
                    await new Promise(resolve => setTimeout(resolve, 4000));
                    fileQueue[nextPendingFileIndex].status = 'pending'; 
                }
            }

        } catch (error) {
            console.error(error);
            alert(error.message);
            fileQueue[i].status = 'pending'; 
            renderQueue();
            break; 
        }
    }

    isProcessing = false;
    processBtn.disabled = false;
    renderQueue();
});

// =====================================================================
// 8. ĐÓNG GÓI EXCEL & KẺ Ô CHUẨN
// =====================================================================
function triggerAutoDownload(originalName, format, fileContent) {
    const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

    if (format === 'excel') {
        try {
            // Lưu ý: Đọc dữ liệu thô, không tự động parse số liệu (raw: true) đối với một số cột
            const wb = XLSX.read(fileContent, { type: "string" });
            const wsName = wb.SheetNames[0];
            const ws = wb.Sheets[wsName];
            
            // Chia tỉ lệ 11 Cột chuẩn theo cấu trúc của Purchase Order
            const wscols = [
                {wch: 8},  // A: Ln #
                {wch: 15}, // B: Item No
                {wch: 40}, // C: Description
                {wch: 12}, // D: Ref. Order #
                {wch: 15}, // E: Confirmed Del. Date
                {wch: 15}, // F: Req. Due Date
                {wch: 15}, // G: Delivery Terms
                {wch: 10}, // H: Price
                {wch: 10}, // I: Quantity
                {wch: 8},  // J: U/M
                {wch: 18}  // K: Sub Total (Và chứa số Total Amount)
            ];
            ws['!cols'] = wscols; 

            const range = XLSX.utils.decode_range(ws['!ref']);
            for(let R = range.s.r; R <= range.e.r; ++R) {
                for(let C = range.s.c; C <= range.e.c; ++C) {
                    const cell_ref = XLSX.utils.encode_cell({c:C, r:R});
                    if(!ws[cell_ref]) continue;

                    ws[cell_ref].s = {
                        border: {
                            top: {style: "thin", color: {rgb: "000000"}},
                            bottom: {style: "thin", color: {rgb: "000000"}},
                            left: {style: "thin", color: {rgb: "000000"}},
                            right: {style: "thin", color: {rgb: "000000"}}
                        },
                        alignment: { vertical: "center", wrapText: true }
                    };
                }
            }

            XLSX.writeFile(wb, `${baseName}_converted.xlsx`);
        } catch (error) {
            console.error("Lỗi xuất Excel:", error);
            alert("Đã xảy ra lỗi trong quá trình đóng gói file Excel.");
        }
    } else {
        const newExt = format === 'word' ? '.doc' : '.txt';
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, fileContent], { type: "text/plain;charset=utf-8" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${baseName}_converted${newExt}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}
