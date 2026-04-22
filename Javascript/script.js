const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const recordBtn = document.getElementById('recordBtn');
const fpsSelect = document.getElementById('fpsSelect');
const streamKey = document.getElementById('streamKey');

let sources = [];
let mediaRecorder;
let recordedChunks = [];

// UI制御だみょん
document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');

// ソース追加
async function addCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        registerSource(stream, "📷 カメラ");
        document.getElementById('addMenu').classList.add('hidden');
    } catch(e) { alert("カメラの起動に失敗したみょん！"); }
}

async function addScreen() {
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        registerSource(stream, "🖥️ 画面共有");
        document.getElementById('addMenu').classList.add('hidden');
    } catch(e) { alert("画面共有がキャンセルされたみょん！"); }
}

function registerSource(stream, label) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.muted = true; // ハウリング防止
    video.play();
    sources.push({ video, label });
    
    const div = document.createElement('div');
    div.style.padding = "5px";
    div.style.borderBottom = "1px solid #333";
    div.textContent = label;
    sourceList.appendChild(div);
}

// 🔴 録画ロジック（FPS指定・メモリ保存）
recordBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const targetFPS = parseInt(fpsSelect.value);
        recordedChunks = [];
        
        // 指定されたFPSでキャンバスからキャプチャ！
        const stream = canvas.captureStream(targetFPS);
        
        if (streamKey.value) {
            console.log("ストリームキーを確認したみょん！配信準備OK🌸");
        }

        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm; codecs=vp9',
            videoBitsPerSecond: 8000000 // 8Mbps
        });

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shuroru-obs-${targetFPS}fps.webm`;
            a.click();
            window.URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        recordBtn.textContent = `⏹️ 録画停止 (${targetFPS}FPS)`;
        recordBtn.classList.add('record-active');
    } else {
        mediaRecorder.stop();
        recordBtn.textContent = "🔴 録画開始";
        recordBtn.classList.remove('record-active');
    }
};

// 描画ループ
function update() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sources.forEach(src => {
        ctx.drawImage(src.video, 0, 0, canvas.width, canvas.height);
    });
    requestAnimationFrame(update);
}

canvas.width = 1280; canvas.height = 720;
update();