const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const recordBtn = document.getElementById('recordBtn');

let sources = [];
let mediaRecorder;
let recordedChunks = [];

// タブ切り替えシステムだみょん！
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    event.currentTarget.classList.add('active');
    document.getElementById('tabTitle').textContent = `設定 - ${event.currentTarget.textContent}`;
}

// UIイベント
document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');
document.getElementById('saveSettings').onclick = () => {
    alert("設定を適用したみょん！🚀");
    document.getElementById('settingsModal').classList.add('hidden');
};

async function addCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    registerSource(stream, "ウィンドゥキャプチャ 6");
    document.getElementById('addMenu').classList.add('hidden');
}

async function addScreen() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    registerSource(stream, "画面キャプチャ");
    document.getElementById('addMenu').classList.add('hidden');
}

function registerSource(stream, label) {
    const video = document.createElement('video');
    video.srcObject = stream; video.play();
    sources.push({ video, label });
    const div = document.createElement('div');
    div.textContent = label;
    div.className = "source-item"; // CSSで青くしてね！
    sourceList.appendChild(div);
}

// 録画機能（設定値を反映！）
recordBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const fps = parseInt(document.getElementById('fpsSelect').value);
        const bps = parseInt(document.getElementById('bitrate').value) * 1000;
        const stream = canvas.captureStream(fps);
        mediaRecorder = new MediaRecorder(stream, { 
            mimeType: 'video/webm; codecs=vp9',
            videoBitsPerSecond: bps 
        });
        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `shuroru-obs-${fps}fps.webm`;
            a.click();
        };
        recordedChunks = [];
        mediaRecorder.start();
        recordBtn.textContent = "録画停止";
    } else {
        mediaRecorder.stop();
        recordBtn.textContent = "録画開始";
    }
};

function render() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    sources.forEach(src => ctx.drawImage(src.video, 0, 0, canvas.width, canvas.height));
    requestAnimationFrame(render);
}

canvas.width = 1920; canvas.height = 1080;
render();