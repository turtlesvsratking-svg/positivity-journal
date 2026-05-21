/**
 * みつばち日記カード - コアロジック
 */

const storageKey = 'kame_honey_diary_book';
let phrases = JSON.parse(localStorage.getItem(storageKey)) || []; // 変数名は既存資産に準拠

// DOM要素のバインド
const inputTitle = document.getElementById('input-title');
const inputContent = document.getElementById('input-content');
const inputAction = document.getElementById('input-action');
const saveBtn = document.getElementById('save-btn');
const listContainer = document.getElementById('diary-list-container');
const toast = document.getElementById('toast');

const captureStage = document.getElementById('capture-stage');
const captureDate = document.getElementById('capture-date');
const captureTitle = document.getElementById('capture-title');
const captureContent = document.getElementById('capture-content');
const captureAction = document.getElementById('capture-action');

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
function prepareCaptureStage(date, title, content, action) {
    captureDate.textContent = date;
    captureTitle.textContent = title;
    captureContent.textContent = content;
    if (action) {
        captureAction.textContent = `🎯 次への目標: ${action}`;
        captureAction.style.display = 'block';
    } else {
        captureAction.style.display = 'none';
    }
}

/**
 * html2canvasを動かしてBlob（画像データ）を取得する関数
 */
function generateCardBlob() {
    return html2canvas(captureStage.querySelector('.capture-card'), {
        backgroundColor: null,
        scale: 2,
        useCORS: true // 外部フォントや画像ズレを防止
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
        showToast('📸 クリップボードに日記画像を格納しました！Ctrl+Vで貼り付けられます');
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
        
        const actionHtml = item.memo ? `<div class="diary-item-action">🎯 次への目標: ${escapeHtml(item.memo)}</div>` : '';

        card.innerHTML = `
            <div class="diary-item-date">📅 ${escapeHtml(item.date || '')}</div>
            <div class="diary-item-title">${escapeHtml(item.en)}</div>
            <div class="diary-item-content">${escapeHtml(item.ja)}</div>
            ${actionHtml}
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
    const titleText = inputTitle.value.trim();
    const contentText = inputContent.value.trim();
    const actionText = inputAction.value.trim();

    if (!titleText || !contentText) {
        showToast('⚠️ タイトルと日記本文を入力してください');
        return;
    }

    // 今日付を自動生成（YYYY/MM/DD 形式）
    const now = new Date();
    const dateText = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;

    // 既存のキー構造を壊さないようにマッピングして保存
    // en -> タイトル, ja -> 本文, memo -> アクション, date -> 日付
    phrases.push({ 
        en: titleText, 
        ja: contentText, 
        memo: actionText,
        date: dateText
    });
    localStorage.setItem(storageKey, JSON.stringify(phrases));

    // 画像化ステージの文字情報を更新
    prepareCaptureStage(dateText, titleText, contentText, actionText);

    // フォームのクリア
    inputTitle.value = '';
    inputContent.value = '';
    inputAction.value = '';
    renderPhrases();

    // 強固な画像コピー＆アプリ起動
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
    prepareCaptureStage(item.date || '', item.en, item.ja, item.memo);
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
