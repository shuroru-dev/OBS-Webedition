const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const streamBtn = document.getElementById('streamBtn');
const recordBtn = document.getElementById('recordBtn');
const resSelect = document.getElementById('resSelect');
const micMeter = document.getElementById('micMeter');

let sources = [];
let mediaRecorder;
let recordedChunks = [];
let audioCtx;
let analyser;

/**
 * 1. 映像設定（縦・横・解像度）の反映
 */
function updateCanvasSize() {
    if (resSelect.value === 'portrait') {
        canvas.width = 1080;
        canvas.height = 1920;
    } else {
        canvas.width = 1920;
        canvas.height = 1080;
    }
}
resSelect.onchange = updateCanvasSize;

/**
 * 2. 設定モーダルの制御
 */
window.showTab = (name) => {
    // タブコンテンツの切り替え
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    
    // サイドバーの見た目切り替え
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tabBtn-${name}`).classList.add('active');
    
    // タイトルの更新
    const titleMap = { stream: '配信', output: '出力', video: '映像' };
    document.getElementById('tabTitle').textContent = `設定 - ${titleMap[name]}`;
};

document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');
document.getElementById('saveSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');

/**
 * 3. 各種ソース（カメラ・画面・マイク）の追加
 */
async function addMic() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function updateMeter() {
            analyser.getByteFrequencyData(dataArray);
            let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            micMeter.style.width = Math.min(avg * 2.5, 100) + "%"; // 感度調整
            requestAnimationFrame(updateMeter);
        }
        updateMeter();
        
        const div = document.createElement('div');
        div.className = "source-item";
        div.textContent = "🎤 マイク入力";
        sourceList.appendChild(div);
    } catch (e) { alert("マイクの起動に失敗したみょん！"); }
    document.getElementById('addMenu').classList.add('hidden');
}

async function addCamera() {
    const s = await navigator.mediaDevices.getUserMedia({ video: true });
    registerSource(s, "📷 映像キャプチャデバイス");
}

async function addScreen() {
    const s = await navigator.mediaDevices.getDisplayMedia({ video: true });
    registerSource(s, "🖥️ 画面キャプチャ");
}

function registerSource(stream, label) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    sources.push({ video, label });
    
    const div = document.createElement('div');
    div.className = "source-item";
    div.textContent = label;
    sourceList.appendChild(div);
    document.getElementById('addMenu').classList.add('hidden');
}

/**
 * 4. 配信・録画ロジック（H.264 & サーバーURL対応）
 */
streamBtn.onclick = () => {
    const url = document.getElementById('streamUrl').value;
    const key = document.getElementById('streamKey').value;

    if (streamBtn.textContent === "配信開始") {
        if (!key) { alert("ストリームキーを入れてほしいみょん！🔑"); return; }
        
        console.log(`接続先: ${url}/${key}`);
        streamBtn.textContent = "配信停止";
        streamBtn.classList.add('btn-active');
        // ※ 実際はここにWebRTC -> RTMP変換サーバーへの接続処理を書くみょん！
    } else {
        streamBtn.textContent = "配信開始";
        streamBtn.classList.remove('btn-active');
    }
};

recordBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        const fps = parseInt(document.getElementById('fpsSelect').value);
        const bps = parseInt(document.getElementById('bitrateInput').value) * 1000;
        const encoder = document.getElementById('encoderSelect').value;
        
        // H.264 (avc1) を優先的に試行するみょん！
        const mimeType = encoder === 'h264' ? 'video/webm; codecs=avc1.4d401e' : 'video/webm; codecs=vp9';
        const actualType = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm';

        mediaRecorder = new MediaRecorder(canvas.captureStream(fps), {
            mimeType: actualType,
            videoBitsPerSecond: bps
        });

        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: actualType });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `shuroru_stream_${resSelect.value}.webm`;
            a.click();
        };

        recordedChunks = [];
        mediaRecorder.start();
        recordBtn.textContent = "録画停止";
        recordBtn.classList.add('btn-active');
    } else {
        mediaRecorder.stop();
        recordBtn.textContent = "録画開始";
        recordBtn.classList.remove('btn-active');
    }
};

/**
 * 5. 描画ループ
 */
function render() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    sources.forEach(src => {
        ctx.drawImage(src.video, 0, 0, canvas.width, canvas.height);
    });
    
    requestAnimationFrame(render);
}

// 初期化
updateCanvasSize();
render();