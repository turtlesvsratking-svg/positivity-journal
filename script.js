/**
 * みつばち日記 (iOS Notes Connect - 設定レス版)
 */

// 日付の自動設定
const today = new Date();
const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
document.getElementById('currentDate').textContent = dateString;

const saveBtn = document.getElementById('saveBtn');
const historyList = document.getElementById('historyList');

// アプリ起動時にLocal Storageからバックアップ履歴を読み込む
window.addEventListener('DOMContentLoaded', () => {
    loadLogs();
});

// ボタンを押した時のメイン処理
saveBtn.addEventListener('click', () => {
    const g1 = document.getElementById('good1').value.trim();
    const g2 = document.getElementById('good2').value.trim();
    const g3 = document.getElementById('good3').value.trim();

    if (!g1 && !g2 && !g3) {
        alert('どれか一つでも入力してみてくださいね。');
        return;
    }

    // 1. アプリ内（Local Storage）への保存処理
    const log = {
        id: Date.now(),
        date: dateString,
        goods: [g1, g2, g3].filter(Boolean)
    };

    let logs = JSON.parse(localStorage.getItem('threeGoodThingsIos')) || [];
    // 同一日の重複を上書き回避するためにフィルタリング
    logs = logs.filter(item => item.date !== dateString); 
    logs.unshift(log); 
    localStorage.setItem('threeGoodThingsIos', JSON.stringify(logs));

    // 2. コピー用テキストの生成
    let todayText = `🐝 ${dateString}\n`;
    log.goods.forEach((item, index) => {
        todayText += `  ${index + 1}. ${item}\n`;
    });
    todayText += `\n`; // 次回、追記ペーストしやすいように末尾に改行を入れる

    // 3. クリップボードへ書き込み＆iPhoneメモアプリの直接起動
    navigator.clipboard.writeText(todayText).then(() => {
        // 入力フォームのクリアと履歴の再描画
        document.getElementById('good1').value = '';
        document.getElementById('good2').value = '';
        document.getElementById('good3').value = '';
        loadLogs();

        // ユーザーへの通知とiOSメモアプリの立ち上げ
        alert('今日の日記をコピーしました！\nメモアプリが開いたら、お好きなノートの末尾に「ペースト（貼り付け）」してください。');
        
        // 特殊なURLスキームでiPhoneのメモアプリを直接起動
        window.location.href = "mobilenotes://"; 
    }).catch(err => {
        alert('クリップボードへのコピーに失敗しました。Safariブラウザでお試しください。');
        console.error('Clipboard error:', err);
    });
});

// 履歴データを画面に描画する処理
function loadLogs() {
    const logs = JSON.parse(localStorage.getItem('threeGoodThingsIos')) || [];
    historyList.innerHTML = '';

    if (logs.length === 0) {
        historyList.innerHTML = '<p class="empty-message">まだ集めた蜜がありません。今日の終わりに最初の一歩を記録してみましょう。</p>';
        return;
    }

    logs.forEach(log => {
        const card = document.createElement('div');
        card.className = 'card log-card';
        let listItems = log.goods.map(item => `<li>🍯 ${item}</li>`).join('');
        card.innerHTML = `
            <div class="log-header">
                <span class="log-date">${log.date}</span>
                <button class="delete-btn" onclick="deleteLog(${log.id})">削除</button>
            </div>
            <ul class="log-body">${listItems}</ul>
        `;
        historyList.appendChild(card);
    });
}

// 履歴の削除処理
window.deleteLog = function(id) {
    if (confirm('この日の記録をアプリから削除しますか？（メモアプリ側の内容は削除されません）')) {
        let logs = JSON.parse(localStorage.getItem('threeGoodThingsIos')) || [];
        logs = logs.filter(log => log.id !== id);
        localStorage.setItem('threeGoodThingsIos', JSON.stringify(logs));
        loadLogs();
    }
};
