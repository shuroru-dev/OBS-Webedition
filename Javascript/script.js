const canvas = document.getElementById('obsCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const imageInput = document.getElementById('imageInput');

let sources = []; // 画面上の全ソースを管理するみょん
let selectedSource = null;
let isDragging = false;

// 1. レンダリングループ（毎フレーム描画）
function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Z-index順（配列の順）に描画だみょん
    sources.forEach(src => {
        if (src.type === 'video' || src.type === 'image') {
            ctx.drawImage(src.element, src.x, src.y, src.w, src.h);
        }
        
        // 選択中のソースに枠を出すみょん
        if (src === selectedSource) {
            ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 4;
            ctx.strokeRect(src.x, src.y, src.w, src.h);
        }
    });
    requestAnimationFrame(render);
}
render();

// 2. ソース追加機能 (パクり)
document.getElementById('addSourceBtn').onclick = () => {
    document.getElementById('sourceContextMenu').classList.toggle('hidden');
};

// 共通追加ロジック
function addSourceToScene(type, element, name, w=640, h=360) {
    const newSource = { type, element, x: 0, y: 0, w, h, name: `${name} ${sources.length+1}` };
    sources.push(newSource);
    selectedSource = newSource;
    updateSourceList();
    document.getElementById('sourceContextMenu').classList.add('hidden');
}

// 各種キャプチャ
document.getElementById('addScreen').onclick = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
    const video = document.createElement('video'); video.srcObject = stream; video.play();
    addSourceToScene('video', video, '🖥️ 画面');
};
document.getElementById('addCamera').onclick = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.createElement('video'); video.srcObject = stream; video.play();
    addSourceToScene('video', video, '📷 カメラ', 320, 180); // ちょっと小さめに
};
document.getElementById('addMic').onclick = async () => {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    addSourceToScene('audio', null, '🎤 マイク'); // 映像はないけどリストに
};

// 画像アップロードｗ
document.getElementById('addImageBtn').onclick = () => imageInput.click();
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        const img = new Image(); img.src = url;
        img.onload = () => addSourceToScene('image', img, '🖼️ 画像', img.width/2, img.height/2);
    }
});

// 3. マウス操作（ドラッグで位置調整だみょん！）
canvas.onmousedown = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const my = (e.clientY - rect.top) * (canvas.height / rect.height);

    // ヒットテスト（後ろからチェック）
    selectedSource = sources.slice().reverse().find(src => 
        mx > src.x && mx < src.x + src.w && my > src.y && my < src.y + src.h
    );

    if (selectedSource) isDragging = true;
};
canvas.onmousemove = (e) => {
    if (isDragging && selectedSource) {
        const rect = canvas.getBoundingClientRect();
        selectedSource.x = (e.clientX - rect.left) * (canvas.width / rect.width) - (selectedSource.w / 2);
        selectedSource.y = (e.clientY - rect.top) * (canvas.height / rect.height) - (selectedSource.h / 2);
    }
};
canvas.onmouseup = () => isDragging = false;

// 4. ソースリスト更新
function updateSourceList() {
    sourceList.innerHTML = '';
    sources.forEach(src => {
        const li = document.createElement('li');
        li.textContent = src.name;
        sourceList.appendChild(li);
    });
}

// 5. 設定モーダル管理（バツボタン対応みょん！）
const settingsModal = document.getElementById('settingsModal');
document.getElementById('toggleSettings').onclick = () => settingsModal.classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => settingsModal.classList.add('hidden');
document.getElementById('saveSettings').onclick = () => settingsModal.classList.add('hidden');