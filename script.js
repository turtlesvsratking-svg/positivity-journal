const today = new Date();
const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
document.getElementById('currentDate').textContent = dateString;

const saveBtn = document.getElementById('saveBtn');
const saveUrlBtn = document.getElementById('saveUrlBtn');
const noteUrlInput = document.getElementById('noteUrlInput');
const historyList = document.getElementById('historyList');

window.addEventListener('DOMContentLoaded', () => {
    loadLogs();
    const savedUrl = localStorage.getItem('iosNotesDiaryUrl');
    if (savedUrl) {
        noteUrlInput.value = savedUrl;
    }
});

saveUrlBtn.addEventListener('click', () => {
    const url = noteUrlInput.value.trim();
    if (url) {
        localStorage.setItem('iosNotesDiaryUrl', url);
        alert('iPhoneメモの連携設定を保存しました！🍯');
    } else {
        alert('URLを入力してください。');
    }
});

saveBtn.addEventListener('click', () => {
    const g1 = document.getElementById('good1').value.trim();
    const g2 = document.getElementById('good2').value.trim();
    const g3 = document.getElementById('good3').value.trim();

    if (!g1 && !g2 && !g3) {
        alert('どれか一つでも入力してみてくださいね。');
        return;
    }

    const log = {
        id: Date.now(),
        date: dateString,
        goods: [g1, g2, g3].filter(Boolean)
    };

    let logs = JSON.parse(localStorage.getItem('threeGoodThingsIos')) || [];
    logs = logs.filter(item => item.date !== dateString); 
    logs.unshift(log); 
    localStorage.setItem('threeGoodThingsIos', JSON.stringify(logs));

    let todayText = `🐝 ${dateString}\n`;
    log.goods.forEach((item, index) => {
        todayText += `  ${index + 1}. ${item}\n`;
    });
    todayText += `\n`; 

    navigator.clipboard.writeText(todayText).then(() => {
        document.getElementById('good1').value = '';
        document.getElementById('good2').value = '';
        document.getElementById('good3').value = '';
        loadLogs();

        const targetUrl = localStorage.getItem('iosNotesDiaryUrl');
        if (targetUrl) {
            alert('今日の日記をコピーしました！\nメモが開いたら、一番下をタップして「ペースト（貼り付け）」してくださいね。');
            window.location.href = targetUrl; 
        } else {
            alert('今日の日記をコピーしました！設定欄にiCloud共有URLを登録すると、明日から専用メモを直接開けるようになります。');
            window.location.href = "mobilenotes://"; 
        }
    }).catch(err => {
        alert('コピーに失敗しました。ブラウザの権限設定を確認してください。');
    });
});

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

window.deleteLog = function(id) {
    if (confirm('この日の記録をアプリから削除しますか？（iPhoneメモ側の内容は削除されません）')) {
        let logs = JSON.parse(localStorage.getItem('threeGoodThingsIos')) || [];
        logs = logs.filter(log => log.id !== id);
        localStorage.setItem('threeGoodThingsIos', JSON.stringify(logs));
        loadLogs();
    }
};
