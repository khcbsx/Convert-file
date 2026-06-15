// =====================================================================
// 1. KHO DỰ TRỮ API KEY (Dán các Key của bạn vào đây)
// =====================================================================
const PREDEFINED_KEYS = [
    "AQ.Ab8RN6LwkpluunVR60KdIL-WJvQXZhsWBL9NZqSnvMOp769tYw", // Key mới
    "AIzaSyBNcK8CgY0dDI97u9g2Uj6UcG2rn0E43Lo", // Key cũ 1
    "AIzaSyDnQWNVyC8jBAOzkI53gpqOOIcl8G8zzwE", // Key cũ 2
    "AIzaSyCDZvvLfI3lNR62Xeo8kSaxX8ys42TABu8"  // Key cũ 3
];

// --- 2. QUẢN LÝ TRẠNG THÁI ---
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

function toggleModal() { alert("Bạn đang sử dụng chế độ nạp Key tự động. Vui lòng mở file script.js để thêm/sửa Key!"); }

// --- 3. RENDER ĐỊNH DẠNG ---
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
// ĐÃ SỬA LỖI SYNTAX Ở DÒNG NÀY:
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
// 6. LOGIC AI - CẬP NHẬT MODEL VÀ XOAY VÒNG KEY
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
    
    // BỘ NÃO ĐỘNG: TỰ ĐỘNG PHÁT HIỆN TRƯỜNG MỚI VÀ XẾP BẢNG LINH HOẠT
    let promptInstruction = "";
    if (targetFormat === 'excel') {
        promptInstruction = `Bạn là một cỗ máy trích xuất dữ liệu thông minh từ PDF/Hình ảnh sang CSV. Tài liệu có thể là Đơn đặt hàng (PO), Hóa đơn (Invoice), Phiếu thu... với cấu trúc thay đổi linh hoạt tùy theo file.

YÊU CẦU TỐI THƯỢNG:
1. CHỈ TRẢ VỀ dữ liệu CSV thô. TUYỆT ĐỐI KHÔNG có lời chào, KHÔNG giải thích, KHÔNG bọc trong thẻ markdown \`\`\`csv.
2. LOẠI BỎ toàn bộ ký tự '$', 'VND', hoặc ký hiệu tiền tệ ở tất cả các con số để giữ số thuần túy.
3. Bất kỳ giá trị nào có chứa dấu phẩy (như địa chỉ, mô tả hàng hóa) BẮT BUỘC phải bọc trong dấu ngoặc kép ("") để không làm vỡ cột CSV.

HÃY PHÂN TÍCH TÀI LIỆU VÀ TRÍCH XUẤT THEO CẤU TRÚC 2 PHẦN LINH HOẠT SAU:

PHẦN 1: THÔNG TIN CHUNG (Metadata ở đầu tài liệu)
- Xuất theo cấu trúc 2 cột: Trường thông tin,Giá trị
- Hãy TỰ ĐỘNG QUÉT và trích xuất TẤT CẢ các trường thông tin chung xuất hiện ở nửa trên tài liệu (Ví dụ: Số PO, Ngày lập, Nhà cung cấp, Địa chỉ, Nơi giao, Điều khoản, Người liên hệ, hoặc BẤT KỲ trường thông tin mới nào xuất hiện trong file mà không có trong danh sách này). Liệt kê đầy đủ không bỏ sót trường nào.

[Sau khi hết Phần 1, thêm một dòng trống bằng dấu phẩy: , ]

PHẦN 2: BẢNG DỮ LIỆU CHI TIẾT (Line Items)
- Hàng đầu tiên: Tự động trích xuất chính xác các Tiêu đề cột thực tế của bảng trong file (Ví dụ: Ln #, Item No, Description, Price, Quantity, Sub Total...).
- Các hàng tiếp theo: Liệt kê đầy đủ toàn bộ các dòng hàng hóa chi tiết tương ứng.
- Hàng cuối cùng (Hàng tổng): Hãy đếm số lượng cột của bảng dữ liệu đó. Đặt cụm từ "Tổng cộng (Total Amount)" ở ô áp chót (cột kế cuối), và con số tổng tiền phải nằm chính xác ở ô cuối cùng (để thẳng hàng với cột Thành tiền/Sub Total trên Excel).`;

    } else {
        promptInstruction = "Trích xuất toàn bộ văn bản, giữ nguyên cấu trúc đoạn văn, tiêu đề. Trình bày rõ ràng. KHÔNG sử dụng markdown code block, chỉ trả văn bản thuần.";
    }
    
    const validKeys = PREDEFINED_KEYS.filter(k => k && k.length > 10);
    if(validKeys.length === 0) throw new Error("Chưa có API Key! Hãy thêm Key vào file script.js.");

    let attempts = 0;
    
    while (attempts < validKeys.length) {
        const currentKey = validKeys[currentKeyIndex % validKeys.length];
        
        const modelsToTry = [
            'gemini-2.5-flash', 
            'gemini-3-flash', 
            'gemini-2.0-flash', 
            'gemini-1.5-flash', 
            'gemini-1.5-pro'
        ];
        
        for (let model of modelsToTry) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${currentKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptInstruction }, { inlineData: { mimeType: file.type || "application/pdf", data: base64Data } }] }] })
                });

                if (response.ok) {
                    const data = await response.json();
                    let cleanText = data.candidates[0].content.parts[0].text;
                    
                    // Xử lý dọn dẹp chuỗi dự phòng
                    cleanText = cleanText.replace(/```csv\n/g, "").replace(/```/g, "").trim();
                    
                    console.log(`Đã chạy thành công với Model: ${model} | Key: ...${currentKey.slice(-4)}`); 
                    return cleanText; 
                }
            } catch (e) {
                // Thử model tiếp theo
            }
        }
        
        console.warn(`Key đuôi ...${currentKey.slice(-4)} bị lỗi hoặc hết lượt. Đang đổi Key...`);
        currentKeyIndex++; 
        attempts++;
    }

    throw new Error("TẤT CẢ CÁC API KEY ĐỀU BỊ LỖI HOẶC ĐÃ HẾT LƯỢT GỌI! VUI LÒNG CẬP NHẬT KEY MỚI.");
}

// --- 7. NÚT CHẠY XỬ LÝ ---
processBtn.addEventListener('click', async () => {
    const pendingFiles = fileQueue.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) return;

    isProcessing = true;
    processBtn.disabled = true;
    processBtn.innerHTML = `<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> AI ĐANG XỬ LÝ...</span>`;

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

// --- 8. ĐÓNG GÓI TẢI XUỐNG ---
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
