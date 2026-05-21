/**
 * みつばち日記カード - コアロジック
 */

const storageKey = 'kame_honey_diary_book';
let phrases = JSON.parse(localStorage.getItem(storageKey)) || []; // 既存のコード形式を完全維持

// DOM要素のバインド
const inputGood1 = document.getElementById('input-good1');
const inputGood2 = document.getElementById('input-good2');
const inputGood3 = document.getElementById('input-good3');
const saveBtn = document.getElementById('save-btn');
const listContainer = document.getElementById('diary-list-container');
const toast = document.getElementById('toast');

const captureStage = document.getElementById('capture-stage');
const captureDate = document.getElementById('capture-date');
const captureGood1 = document.getElementById('capture-good1');
const captureGood2 = document.getElementById('capture-good2');
const captureGood3 = document.getElementById('capture-good3');

/**
 * 画面下部にメッセージ通知を表示する関数
 */
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

/**
 * 隠しステージの文字要素を更新する関数
 */
function prepareCaptureStage(date, g1, g2, g3) {
    captureDate.textContent = date;
    captureGood1.textContent = g1;
    captureGood2.textContent = g2;
    captureGood3.textContent = g3;
}

/**
 * html2canvasを動かしてBlob（画像データ）を取得する関数
 */
function generateCardBlob() {
    return html2canvas(captureStage.querySelector('.capture-card'), {
        backgroundColor: null,
        scale: 2,
        useCORS: true
    }).then(canvas => {
        return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    });
}

/**
 * メモアプリへのURLスキーム切り替え
 */
function openMemoApp() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        window.location.href = "mobilenotes://";
    } else if (/Android/.test(userAgent)) {
        window.location.href = "https://keep.google.com/";
    } else {
        showToast('📸 クリップボードに日記画像を格納しました！貼り付けて保存してね');
    }
}

/**
 * 【超重要】セキュリティ制限をバイパスする高速コピー関数
 */
async function copyAsImageAndLaunch() {
    if (!navigator.clipboard || !window.ClipboardItem) {
        showToast('❌ お使いのブラウザは画像コピーに対応していません。最新のSafariやChromeでお試しください。');
        return;
    }

    showToast('✨ 日記カードを作成中...');

    try {
        // iOS/Safariの制約を突破するため、先にコンストラクタを作り中で画像生成を待機させる
        await navigator.clipboard.write([
            new window.ClipboardItem({
                "image/png": (async () => {
                    const blob = await generateCardBlob();
                    if (!blob) throw new Error("Blob generation failed");
                    return blob;
                })()
            })
        ]);

        showToast('📸 日記カードをコピー！メモ帳が開きます');
        setTimeout(openMemoApp, 600);

    } catch (err) {
        console.error('Clipboard Error:', err);
        showToast('❌ コピーに失敗。HTTPS環境（GitHub Pages上）で実行しているかご確認ください。');
    }
}

/**
 * 登録データを画面に再描画する関数
 */
function renderPhrases() {
    listContainer.innerHTML = '';
    if (phrases.length === 0) {
        listContainer.innerHTML = '<div class="empty-state">ストックされた日記はまだありません。</div>';
        return;
    }

    // 最新の記録が最上位に表示されるよう逆順ループ
    phrases.slice().reverse().forEach((item, index) => {
        const actualIndex = phrases.length - 1 - index;
        const card = document.createElement('div');
        card.className = 'diary-card';

        card.innerHTML = `
            <div class="diary-item-date">📅 ${escapeHtml(item.date || '')}</div>
            <ol class="diary-list-ol">
                <li>${escapeHtml(item.g1)}</li>
                <li>${escapeHtml(item.g2)}</li>
                <li>${escapeHtml(item.g3)}</li>
            </ol>
            <div class="card-actions">
                <button class="action-btn btn-copy" onclick="triggerManualCapture(${actualIndex})">📸 カードを再コピー</button>
                <button class="action-btn btn-delete" onclick="deletePhrase(${actualIndex})">削除</button>
            </div>
        `;
        listContainer.appendChild(card);
    });
}

// 記録ボタンのイベントリスナー
saveBtn.addEventListener('click', () => {
    const g1Text = inputGood1.value.trim();
    const g2Text = inputGood2.value.trim();
    const g3Text = inputGood3.value.trim();

    if (!g1Text || !g2Text || !g3Text) {
        showToast('⚠️ 良かったことを3つすべて入力してください');
        return;
    }

    // 今日の日付を自動生成（YYYY/MM/DD 形式）
    const now = new Date();
    const dateText = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // 既存配列フォーマットを崩さずにマッピング保存
    phrases.push({ 
        g1: g1Text, 
        g2: g2Text, 
        g3: g3Text,
        date: dateText
    });
    localStorage.setItem(storageKey, JSON.stringify(phrases));

    // 画像化ステージの文字情報を更新
    prepareCaptureStage(dateText, g1Text, g2Text, g3Text);

    // フォームのクリア
    inputGood1.value = '';
    inputGood2.value = '';
    inputGood3.value = '';
    renderPhrases();

    // 画像コピー＆アプリ起動処理を発火
    copyAsImageAndLaunch();
});

/**
 * アイテム削除処理
 */
window.deletePhrase = function(index) {
    if (confirm('この日記を削除しますか？')) {
        phrases.splice(index, 1);
        localStorage.setItem(storageKey, JSON.stringify(phrases));
        renderPhrases();
        showToast('🗑️ 削除しました');
    }
};

/**
 * 過去アイテムの再画像化およびコピー起動
 */
window.triggerManualCapture = function(index) {
    const item = phrases[index];
    prepareCaptureStage(item.date || '', item.g1, item.g2, item.g3);
    copyAsImageAndLaunch();
};

/**
 * エスケープ処理
 */
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// 起動時レンダリング
renderPhrases();
