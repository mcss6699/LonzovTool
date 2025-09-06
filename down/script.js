document.addEventListener('DOMContentLoaded', () => {
    // 读取配置数据
    let config = {};
    const configScript = document.getElementById('downloadConfig');
    if (configScript) {
        try {
            config = JSON.parse(configScript.textContent);
        } catch (e) {
            console.error("解析下载配置失败:", e);
            showMessage("配置加载失败", false);
        }
    } else {
        console.error("未找到ID为 'downloadConfig' 的配置脚本。");
        showMessage("配置缺失", false);
    }

    const downloadPassword = document.getElementById('downloadPassword');
    const manualDownloadLink = document.getElementById('manualDownloadLink');
    const directDownloadBtn = document.getElementById('directDownloadBtn');
    const quickDownloadBtn = document.getElementById('quickDownloadBtn');
    const copyPasswordBtn = document.getElementById('copyPasswordBtn');
    const message = document.getElementById('message');

    const quickDownloadCard = document.getElementById('quickDownloadCard');
    const manualDownloadCard = document.getElementById('manualDownloadCard');

    // 遮罩层
    const overlay = document.getElementById('download-overlay') || (() => {
        const newOverlay = document.createElement('div');
        newOverlay.id = 'download-overlay';
        newOverlay.innerHTML = `
            <p class="overlay-main">接下来请忽视不安全警告</p>
            <p class="overlay-normal">即将前往api站解析直链。请忽略浏览器可能弹出的"不安全"警告，这是由服务器SSL配置导致的正常现象。</br>如果不放心请使用星辰云/手动下载</p>
            <p class="overlay-small">点击任意位置继续</p>
        `;
        document.body.appendChild(newOverlay);
        return newOverlay;
    })();
    let isOverlayShown = false;

    // API
    const API_BASE_URL = 'http://api.lonzov.top/lanzou/public/index.php';

    // 根据配置初始化值和控制显示
    let isQuickCardNeeded = false;
    let isManualCardNeeded = false;

    // 初始化密码
    if (config.lanzou?.password) {
        downloadPassword.value = config.lanzou.password;
    }

    // 初始化手动下载链接和卡片
    if (config.lanzou?.url) {
        manualDownloadLink.href = config.lanzou.url;
        isManualCardNeeded = true;
    } else {
        manualDownloadLink.classList.add('disabled');
        manualDownloadLink.href = '#';
    }

    // 初始化快捷下载按钮和卡片
    if (config.direct?.url) {
        directDownloadBtn.href = config.direct.url;
        isQuickCardNeeded = true;
    } else {
        directDownloadBtn.href = '#';
        directDownloadBtn.classList.add('disabled');
    }

    if (config.lanzou?.url && config.lanzou?.password) {
        isQuickCardNeeded = true;
    } else {
        quickDownloadBtn.classList.add('disabled');
    }

    // 控制卡片显示
    quickDownloadCard.style.display = isQuickCardNeeded ? 'block' : 'none';
    manualDownloadCard.style.display = isManualCardNeeded ? 'block' : 'none';

    // 如果两个卡片都隐藏，则隐藏整个下载卡片
    if (!isQuickCardNeeded && !isManualCardNeeded) {
        document.querySelector('.download-section').innerHTML = '<p class="section-description">暂无可用的下载方式。</p>';
        console.warn("没有有效的下载链接配置。");
    }

    // 主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    window.addEventListener('storage', (e) => {
        if (e.key === 'theme') {
            document.documentElement.setAttribute('data-theme', e.newValue || 'light');
        }
    });

    // 密码复制
    copyPasswordBtn.addEventListener('click', (e) => {
        if (!downloadPassword.value) {
            showMessage('无密码可复制', false, e);
            return;
        }
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

    // 下载逻辑
    // 生成API URL的函数
    function generateApiUrl() {
        if (!config.lanzou?.url || !config.lanzou?.password) {
            console.error("缺少生成API URL所需的数据 (url 或 password)");
            showMessage("下载配置错误", false);
            return '#';
        }
        const params = new URLSearchParams({
            url: encodeURIComponent(config.lanzou.url),
            pwd: encodeURIComponent(config.lanzou.password),
            type: 'down'
        });
        return `${API_BASE_URL}?${params}`;
    }

    // 处理遮罩层点击
    function handleOverlayClick() {
        if (isOverlayShown) {
            overlay.classList.remove('show');
            isOverlayShown = false;
            const apiUrl = generateApiUrl();
            if (apiUrl !== '#' && apiUrl !== 'http://api.lonzov.top/lanzou/public/index.php?') {
                console.log("跳转到 API URL:", apiUrl);
                window.open(apiUrl, '_blank');
            } else {
                showMessage("无法生成下载链接", false);
            }
        }
    }
    overlay.addEventListener('click', handleOverlayClick);

    // 蓝奏云按钮点击事件(显示遮罩，然后跳转)
    quickDownloadBtn.addEventListener('click', function(e) {
        if (this.classList.contains('disabled')) {
            e.preventDefault();
            showMessage('蓝奏云解析不可用', false, e);
            return;
        }

        if (!isOverlayShown) {
            overlay.classList.add('show');
            isOverlayShown = true;
        }
        e.preventDefault();
    });

    // 消息提示
    function showMessage(text, isSuccess, eventOrPosition) {
        message.textContent = text;
        message.className = 'toast show';
        message.classList.add(isSuccess ? 'success' : 'error');

        setTimeout(() => {
            message.classList.remove('show');
        }, 3000);
    }
});
