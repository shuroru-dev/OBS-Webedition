const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const recordBtn = document.getElementById('recordBtn');
const resSelect = document.getElementById('resSelect');
const micMeter = document.getElementById('micMeter');

let sources = [], mediaRecorder, recordedChunks = [];
let audioCtx, analyser;

// 解像度更新
function updateResolution() {
    if (resSelect.value === 'portrait') {
        canvas.width = 1080; canvas.height = 1920;
    } else {
        canvas.width = 1920; canvas.height = 1080;
    }
}
resSelect.onchange = updateResolution;

// タブ切り替え
window.showTab = (name) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
}

// UI制御
document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');
document.getElementById('saveSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');

// マイク追加
async function addMic() {
    const s = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioCtx = new AudioContext();
    analyser = audioCtx.createAnalyser();
    audioCtx.createMediaStreamSource(s).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const update = () => {
        analyser.getByteFrequencyData(data);
        let avg = data.reduce((a, b) => a + b) / data.length;
        micMeter.style.width = Math.min(avg * 2, 100) + "%";
        requestAnimationFrame(update);
    };
    update();
    const d = document.createElement('div'); d.textContent = "🎤 マイク補助";
    sourceList.appendChild(d);
}

async function addCamera() { const s = await navigator.mediaDevices.getUserMedia({ video: true }); register(s, "📷 カメラ"); }
async function addScreen() { const s = await navigator.mediaDevices.getDisplayMedia({ video: true }); register(s, "🖥️ 画面共有"); }

function register(s, label) {
    const v = document.createElement('video'); v.srcObject = s; v.play();
    sources.push({ video: v, label });
    const d = document.createElement('div'); d.textContent = label;
    sourceList.appendChild(d);
    document.getElementById('addMenu').classList.add('hidden');
}

// 録画（H.264/AVC1 優先）
recordBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const fps = parseInt(document.getElementById('fpsSelect').value);
        const mime = 'video/webm; codecs=avc1.4d401e'; // H.264
        const type = MediaRecorder.isTypeSupported(mime) ? mime : 'video/webm';
        
        mediaRecorder = new MediaRecorder(canvas.captureStream(fps), { mimeType: type });
        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(recordedChunks));
            a.download = `shuroru_rec_${resSelect.value}.webm`; a.click();
        };
        recordedChunks = []; mediaRecorder.start();
        recordBtn.textContent = "録画停止"; recordBtn.classList.add('btn-active');
    } else {
        mediaRecorder.stop(); recordBtn.textContent = "録画開始"; recordBtn.classList.remove('btn-active');
    }
};

function render() {
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    sources.forEach(s => ctx.drawImage(s.video, 0, 0, canvas.width, canvas.height));
    requestAnimationFrame(render);
}
updateResolution(); render();