const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
const sourceList = document.getElementById('sourceList');
const addMenu = document.getElementById('addMenu');

canvas.width = 1280;
canvas.height = 720;

let sources = [];
let selectedSource = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

// 描画ループ：これがないと映像が止まっちゃうみょん！
function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    sources.forEach(s => {
        // 映像を描画
        ctx.drawImage(s.el, s.x, s.y, s.w, s.h);
        
        // 選択中のソースに青い枠をつけるみょん（編集モード！）
        if (s === selectedSource) {
            ctx.strokeStyle = '#4a90e2';
            ctx.lineWidth = 3;
            ctx.strokeRect(s.x, s.y, s.w, s.h);
        }
    });
    requestAnimationFrame(draw);
}
draw();

// マイク許可（これは前回と同じだみょん）
async function askMic() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        alert("マイクOKだみょん！🎤");
    } catch (e) { alert("マイク失敗みょん..."); }
}

// ソース追加：追加したらリストを更新するみょん！
async function addScreen() {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    createSource(stream, "画面共有");
}

async function addCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    createSource(stream, "カメラ");
}

function createSource(stream, name) {
    const v = document.createElement('video');
    v.srcObject = stream;
    v.play();
    
    const newSource = {
        el: v,
        name: `${name} ${sources.length + 1}`,
        x: 50, y: 50, w: 480, h: 270 // 初期の大きさ
    };
    
    sources.push(newSource);
    selectedSource = newSource;
    updateSourceList(); // リストに表示させるみょん！
    addMenu.classList.add('hidden');
}

// ★ソースリストの表示を更新する関数
function updateSourceList() {
    sourceList.innerHTML = '';
    sources.forEach((s, index) => {
        const item = document.createElement('div');
        item.className = 'source-item' + (s === selectedSource ? ' active' : '');
        item.textContent = `👁️ ${s.name}`;
        item.onclick = () => {
            selectedSource = s;
            updateSourceList();
        };
        sourceList.appendChild(item);
    });
}

// ★マウスで編集（ドラッグ）する魔法
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

canvas.onmousedown = (e) => {
    const pos = getMousePos(e);
    // 重なっている場合は上のソースから選ぶみょん
    selectedSource = [...sources].reverse().find(s => 
        pos.x > s.x && pos.x < s.x + s.w && pos.y > s.y && pos.y < s.y + s.h
    );
    
    if (selectedSource) {
        isDragging = true;
        dragOffset.x = pos.x - selectedSource.x;
        dragOffset.y = pos.y - selectedSource.y;
        updateSourceList();
    }
};

window.onmousemove = (e) => {
    if (isDragging && selectedSource) {
        const pos = getMousePos(e);
        selectedSource.x = pos.x - dragOffset.x;
        selectedSource.y = pos.y - dragOffset.y;
    }
};

window.onmouseup = () => { isDragging = false; };

// UI制御
document.getElementById('addBtn').onclick = (e) => {
    e.stopPropagation();
    addMenu.classList.toggle('hidden');
};
document.getElementById('openSettings').onclick = () => document.getElementById('settingsModal').classList.remove('hidden');
document.getElementById('closeSettings').onclick = () => document.getElementById('settingsModal').classList.add('hidden');