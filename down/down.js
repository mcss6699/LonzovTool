document.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM元素
    const downloadPassword = document.getElementById('downloadPassword');
    const manualDownloadLink = document.getElementById('manualDownloadLink');
    const quickDownloadBtn = document.getElementById('quickDownloadBtn');
    const copyPasswordBtn = document.getElementById('copyPasswordBtn');
    const themeToggle = document.getElementById('themeToggle');
    const message = document.getElementById('message');

    const overlay = document.createElement('div');
    overlay.id = 'download-overlay';
    overlay.innerHTML = `
        <p class="overlay-main">接下来如果有 任何不安全的警告请无视</p>
        <p class="overlay-normal">虚拟主机防火墙限制，SSL证书启用后会504，暂时只能这样，不安全警告是正常的</p>
        <p class="overlay-small">点击屏幕继续</p>
    `;
    document.body.appendChild(overlay);

    // 初始化值
    downloadPassword.value = downloadData.lanzoudown.password;
    manualDownloadLink.href = downloadData.lanzoudown.url;

    // 主题管理
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            document.documentElement.setAttribute('data-theme', e.newValue || 'light');
        }
    });

    // 密码复制
    copyPasswordBtn.addEventListener('click', (e) => {
        downloadPassword.select();
        try {
            const successful = document.execCommand('copy');
            showMessage(successful ? '密码已复制' : '复制失败', successful, e);
        } catch (err) {
            navigator.clipboard.writeText(downloadPassword.value)
                .then(() => showMessage('密码已复制', true, e))
                .catch(() => showMessage('复制失败', false, e));
        }
    });

    let clickPosition = { x: 0, y: 0 };
    let isOverlayShown = false;

    // 生成API URL的函数
    function generateApiUrl() {
        const proxyUrl = 'http://api.lonzov.top/lanzou/public/index.php';
        const params = new URLSearchParams({
            url: encodeURIComponent(downloadData.lanzoudown.url),
            pwd: encodeURIComponent(downloadData.lanzoudown.password),
            type: 'down'
        });
        return `${proxyUrl}?${params}`;
    }

    function handleOverlayClick() {
        if (isOverlayShown) {
            overlay.classList.remove('show');
            isOverlayShown = false;
            const apiUrl = generateApiUrl();
            console.log("跳转到 API URL:", apiUrl);
            window.open(apiUrl, '_blank');
        }
    }

    overlay.addEventListener('click', handleOverlayClick);

    quickDownloadBtn.addEventListener('click', function(e) {
        clickPosition = { x: e.clientX, y: e.clientY };
        if (!isOverlayShown) {
            overlay.classList.add('show');
            isOverlayShown = true;
        }
    });

    // 消息提示
    function showMessage(text, isSuccess, eventOrPosition) {
        message.textContent = text;
        message.className = 'message show';
        message.classList.add(isSuccess ? 'success' : 'error');
        // 统一的位置计算方式
        if (eventOrPosition) {
            let x, y;
            // 处理event对象或clickPosition对象
            if (eventOrPosition.clientX !== undefined) {
                // 来自event对象
                x = eventOrPosition.clientX;
                y = eventOrPosition.clientY;
            } else if (eventOrPosition.x !== undefined) {
                // 来自clickPosition对象
                x = eventOrPosition.x;
                y = eventOrPosition.y;
            } else if (eventOrPosition.changedTouches) {
                // 触屏事件
                x = eventOrPosition.changedTouches[0].clientX;
                y = eventOrPosition.changedTouches[0].clientY;
            }
            if (x !== undefined && y !== undefined) {
                // 使用与复制按钮相同的偏移量
                message.style.left = (x + 15) + 'px';
                message.style.top = (y + 15) + 'px';
                setTimeout(() => {
                    message.classList.remove('show');
                }, 2000);
                return;
            }
        }
        // 默认位置（按钮下方居中）
        const manualDownload = document.querySelector('.download-option:nth-child(3)');
        if (manualDownload) {
            const rect = manualDownload.getBoundingClientRect();
            message.style.left = (rect.left + rect.width / 2 - 50) + 'px';
            message.style.top = (rect.bottom + 5) + 'px';
        }
        setTimeout(() => {
            message.classList.remove('show');
        }, 2000);
    }

    // 密码输入框宽度调整
    function adjustPasswordWidth() {
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden';
        tempSpan.style.whiteSpace = 'pre';
        tempSpan.style.fontSize = getComputedStyle(downloadPassword).fontSize;
        tempSpan.textContent = downloadPassword.value || downloadPassword.placeholder;
        document.body.appendChild(tempSpan);
        downloadPassword.style.width = `${tempSpan.offsetWidth + 30}px`;
        document.body.removeChild(tempSpan);
    }

    // 页面加载时调整宽度
    window.addEventListener('load', () => {
        adjustPasswordWidth();
    });

    // 页面卸载时清理可能的定时器或状态
    window.addEventListener('beforeunload', () => {
        // 如果需要清理定时器等，可以在这里做
        // 例如：clearTimeout(someTimeoutId);
        // 当前逻辑下暂无需要清理的长时间运行任务
    });

});
