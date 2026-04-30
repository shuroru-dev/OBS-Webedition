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

// 音声合成用のノード
let audioCtx;
let mainAudioDestination; // すべての音をここに集めるみょん！
let micStreamNode;
let screenAudioNode;

/**
 * 1. キャンバスサイズの更新
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
 * 2. 音声コンテキストの初期化
 * ユーザーが操作した後に呼び出す必要があるみょん
 */
function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        mainAudioDestination = audioCtx.createMediaStreamDestination();
    }
}

/**
 * 3. 各種ソースの追加
 */
async function addMic() {
    initAudioContext();
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // メーター用
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        // 録画用にミックス！
        source.connect(mainAudioDestination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        function updateMeter() {
            analyser.getByteFrequencyData(dataArray);
            let avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
            micMeter.style.width = Math.min(avg * 2.5, 100) + "%";
            requestAnimationFrame(updateMeter);
        }
        updateMeter();
        
        addSourceToList("🎤 マイク入力");
    } catch (e) { alert("マイクが使えないみたいだみょん！"); }
}

async function addCamera() {
    try {
        const s = await navigator.mediaDevices.getUserMedia({ video: true });
        registerSource(s, "📷 映像キャプチャデバイス");
    } catch (e) { alert("カメラが見つからないみょん！"); }
}

async function addScreen() {
    initAudioContext();
    try {
        // 画面共有時に「システムオーディオも共有」にチェックを入れてね！
        const s = await navigator.mediaDevices.getDisplayMedia({ 
            video: true, 
            audio: true 
        });

        // 画面の音がある場合、ミックスに追加するみょん
        if (s.getAudioTracks().length > 0) {
            const screenAudioSource = audioCtx.createMediaStreamSource(s);
            screenAudioSource.connect(mainAudioDestination);
        }

        registerSource(s, "🖥️ 画面キャプチャ");
    } catch (e) { alert("画面共有がキャンセルされたみょん！"); }
}

function registerSource(stream, label) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    sources.push({ video, label });
    addSourceToList(label);
}

function addSourceToList(label) {
    const div = document.createElement('div');
    div.className = "source-item";
    div.textContent = label;
    sourceList.appendChild(div);
    document.getElementById('addMenu').classList.add('hidden');
}

/**
 * 4. 録画ロジック
 */
recordBtn.onclick = () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        initAudioContext();
        
        const fps = parseInt(document.getElementById('fpsSelect').value);
        const bps = parseInt(document.getElementById('bitrateInput').value) * 1000;
        
        // キャンバスの映像を取得
        const videoStream = canvas.captureStream(fps);
        
        // 映像ストリームに、ミックスした音声ストリームを合体させるみょん！
        const combinedStream = new MediaStream([
            ...videoStream.getVideoTracks(),
            ...mainAudioDestination.stream.getAudioTracks()
        ]);

        const mimeType = 'video/webm; codecs=vp9';
        const actualType = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm';

        mediaRecorder = new MediaRecorder(combinedStream, {
            mimeType: actualType,
            videoBitsPerSecond: bps
        });

        mediaRecorder.ondataavailable = e => recordedChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: actualType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `shuroru_rec_${Date.now()}.webm`;
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
        // 全画面に広げて描画（必要に応じて調整してね）
        ctx.drawImage(src.video, 0, 0, canvas.width, canvas.height);
    });
    
    requestAnimationFrame(render);
}

// モーダル制御などのイベント
document.getElementById('addBtn').onclick = () => document.getElementById('addMenu').classList.toggle('hidden');
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');
document.getElementById('saveSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');

window.showTab = (name) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.getElementById(`tab-${name}`).classList.remove('hidden');
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`tabBtn-${name}`).classList.add('active');
};

// 実行！
updateCanvasSize();
render();