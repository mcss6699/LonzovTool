document.addEventListener('DOMContentLoaded', () => {
    // 初始化DOM元素
    const downloadPassword = document.getElementById('downloadPassword');
    const manualDownloadLink = document.getElementById('manualDownloadLink');
    const quickDownloadBtn = document.getElementById('quickDownloadBtn');
    const copyPasswordBtn = document.getElementById('copyPasswordBtn');
    const themeToggle = document.getElementById('themeToggle');
    const message = document.getElementById('message');

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

    // 下载功能配置
    let clickPosition = { x: 0, y: 0 };
    let apiFailCount = 0;
    let isCoolingDown = false;

    // 带超时的fetch封装
    async function fetchWithTimeout(url, timeout = 3000) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    // 下载主逻辑
    async function startDownload(isInitialLoad = false) {
        // 检查失败次数
        if (apiFailCount >= 3) {
            showMessage('请手动下载', false, clickPosition);
            return;
        }

        // 检查冷却状态
        if (isCoolingDown) {
            showMessage('不要重复点击', false, clickPosition);
            return;
        }

        // 设置加载状态
        quickDownloadBtn.innerHTML = '加载中 <i class="fas fa-spinner fa-spin"></i>';
        quickDownloadBtn.disabled = true;
        isCoolingDown = true;

        // 设置5秒超时
        const timeoutId = setTimeout(() => {
            if (isCoolingDown) {
                apiFailCount++;
                showMessage('请手动下载，API调用超时', false, clickPosition);
                resetDownloadButton();
            }
        }, 5000);

        try {
            // 主API调用
            const apiUrl = `https://api.suxun.site/api/lanzou?url=${encodeURIComponent(downloadData.lanzoudown.url)}&pwd=${encodeURIComponent(downloadData.lanzoudown.password)}&type=json`;
            
            const response = await fetchWithTimeout(apiUrl);
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP错误: ${response.status}`);
            }

            const data = await response.json();
            
            if (data && data.download) {
                window.open(data.download, '_blank');
                resetDownloadButton();
                return;
            }
            throw new Error('无效的API响应: 缺少download字段');
        } catch (mainError) {
            console.log('主API失败，尝试备用API...');
            
            try {
                // 备用API调用
                const backupUrl = `https://v2.alapi.cn/api/lanzou?url=${encodeURIComponent(downloadData.lanzoudown.url)}&token=LwExDtUWhF3rH5ib`;
                const backupResponse = await fetchWithTimeout(backupUrl);
                
                if (backupResponse.ok) {
                    window.open(backupResponse.url, '_blank');
                    resetDownloadButton();
                    return;
                }
                throw new Error('备用API返回无效响应');
            } catch (backupError) {
                clearTimeout(timeoutId);
                apiFailCount++;
                showMessage(
                    `请手动下载，备用API调用失败: ${backupError.message}`,
                    false,
                    clickPosition
                );
                resetDownloadButton();
                
                if (apiFailCount >= 5) {
                    quickDownloadBtn.innerHTML = '立即下载 <i class="fas fa-download"></i>';
                    quickDownloadBtn.classList.add('disabled');
                }
            }
        }
    }

    function resetDownloadButton() {
        isCoolingDown = false;
        quickDownloadBtn.innerHTML = '立即下载 <i class="fas fa-download"></i>';
        quickDownloadBtn.disabled = apiFailCount >= 5;
    }

    // 为下载按钮添加点击事件
    quickDownloadBtn.addEventListener('click', function(e) {
        clickPosition = { x: e.clientX, y: e.clientY };
        // 先显示提示再开始下载
        startDownload();
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
});