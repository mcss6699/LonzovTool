// 状态类名常量
const STATUS = {
    NORMAL: 'status-normal',
    WARNING: 'status-warning',
    ERROR: 'status-error'
};

// 调试日志系统
const debugLog = [];
const debugLogElement = document.getElementById('debug-log');
const debugToggle = document.getElementById('debug-toggle');

// 确保日志元素支持换行显示
if (debugLogElement) {
    debugLogElement.style.whiteSpace = 'pre-wrap';
    debugLogElement.style.overflowY = 'auto';
    debugLogElement.style.maxHeight = '300px';
}

// 添加日志
function addDebugLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    debugLog.push(`[${timestamp}] ${message}`);
    
    if (debugLogElement.style.display === 'block') {
        debugLogElement.textContent = debugLog.join('\n');
        debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
}

// 切换调试日志显示
debugToggle.addEventListener('click', () => {
    if (debugLogElement.style.display === 'none' || !debugLogElement.style.display) {
        debugLogElement.style.display = 'block';
        debugLogElement.textContent = debugLog.join('\n');
        debugToggle.textContent = '隐藏详细信息';
    } else {
        debugLogElement.style.display = 'none';
        debugToggle.textContent = '显示详细信息';
    }
});

// 更新元素内容和状态的通用函数
function updateElement(id, value, status) {
    const element = document.getElementById(id);
    const statusElement = document.getElementById(`${id}-status`);
    if (element) element.textContent = value;
    if (statusElement) {
        statusElement.textContent = status === STATUS.NORMAL ? '正常' : 
                                  status === STATUS.WARNING ? '警告' : '异常';
        statusElement.className = status;
    }
}

const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                document.documentElement.setAttribute('data-theme', e.newValue || 'light');
            }
        });

// 用户代理
function detectBrowserUA() {
    const ua = navigator.userAgent;
    const element = document.getElementById('browser-ua');
    const statusElement = document.getElementById('browser-ua-status');
    if (element) element.textContent = ua;
    if (statusElement) statusElement.textContent = '-';
}

// 浏览器信息
function detectBrowserCore() {
    const ua = navigator.userAgent;
    let browserCore = '';

    if (ua.includes('Chrome')) {
        browserCore = 'Chromium';
    } else if (ua.includes('Firefox')) {
        browserCore = 'Gecko';
    } else if (ua.includes('Safari')) {
        browserCore = 'WebKit';
    } else if (ua.includes('Edge')) {
        browserCore = 'EdgeHTML';
    } else {
        browserCore = '未知';
    }

    const element = document.getElementById('browser-core');
    const statusElement = document.getElementById('browser-core-status');
    if (element) element.textContent = browserCore;
    if (statusElement) statusElement.textContent = '-';
}

// 深浅色模式
function detectColorScheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const colorScheme = isDarkMode ? '深色模式' : '浅色模式';
    const element = document.getElementById('color-scheme');
    const statusElement = document.getElementById('color-scheme-status');
    if (element) element.textContent = colorScheme;
    if (statusElement) statusElement.textContent = '-';

    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newColorScheme = e.matches ? '深色模式' : '浅色模式';
        if (element) element.textContent = newColorScheme;
        if (statusElement) statusElement.textContent = '-';
    });
}

// 英文运营商名称映射表
const ISP_TRANSLATIONS = {
    'China Mobile': '中国移动',
    'China Telecom': '中国电信',
    'China Unicom': '中国联通',
    'CMCC': '中国移动',
    'CHINANET': '中国电信',
    'UNICOM': '中国联通'
};

// 处理FuHongAPI返回的运营商数据
function processFuHongISP(data) {
    const lines = data.split('\n');
    let province = '';
    let isp = '';
    
    for (const line of lines) {
        if (line.includes('IP物理位置：')) {
            province = line.split('：')[1].trim().split('省')[0];
        } else if (line.includes('IP运营商：')) {
            isp = line.split('：')[1].trim();
        }
    }
    
    return province ? `${province}${isp}` : isp;
}

// IP检测
async function detectIP() {
    const TIMEOUT = 3000; // 超时
    let ip;

    // 1. 优先使用FuHongAPI获取IP
    try {
        addDebugLog('开始调用FuHongAPI(IP)');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch('https://fuhongweb.cn/api/api/ip.php', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            addDebugLog(`FuHongAPI(IP)返回错误状态: ${response.status}`);
            throw new Error('IP查询失败');
        }
        ip = (await response.text()).trim();
        addDebugLog('FuHongAPI(IP)调用成功');
    } catch (error) {
        addDebugLog(`FuHongAPI(IP)调用失败: ${error.message}`);
        // 2. 使用ipify.org
        try {
            addDebugLog('开始调用ipify.org获取IP');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
            
            const response = await fetch('https://api.ipify.org?format=json', {
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                addDebugLog(`ipify.org返回错误状态: ${response.status}`);
                throw new Error('IP查询失败');
            }
            const data = await response.json();
            ip = data.ip;
            addDebugLog('ipify.org调用成功');
        } catch (error) {
            addDebugLog(`ipify.org调用失败: ${error.message}`);
            // 3. 使用icanhazip.com
            try {
                addDebugLog('开始调用icanhazip.com获取IP');
                const backupRes = await fetch('https://ipv4.icanhazip.com/');
                ip = (await backupRes.text()).trim();
                addDebugLog('icanhazip.com调用成功');
            } catch (error) {
                addDebugLog(`icanhazip.com调用失败: ${error.message}`);
                updateElement('ipv4', 'IP获取失败', STATUS.ERROR);
                updateElement('ipv4-location', '服务不可用', STATUS.ERROR);
                return;
            }
        }
    }

    updateElement('ipv4', ip, STATUS.NORMAL);

    // 运营商检测
    // 1. 优先使用FuHongAPI
    try {
        addDebugLog('开始调用FuHongAPI(运营商)');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch(`https://fuhongweb.cn/api/api/ip_info.php?ip=${ip}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            addDebugLog(`FuHongAPI(运营商)返回错误状态: ${response.status}`);
            throw new Error('运营商查询失败');
        }
        
        const data = await response.text();
        const processed = processFuHongISP(data);
        if (processed) {
            addDebugLog(`FuHongAPI(运营商)调用成功: ${processed}`);
            return updateElement('ipv4-location', processed, STATUS.NORMAL);
        }
        addDebugLog('FuHongAPI返回数据缺少运营商信息');
    } catch (error) {
        addDebugLog(`FuHongAPI(运营商)调用失败: ${error.message}`);
    }

    // 2. 使用IPinfo
    try {
        addDebugLog('开始调用IPinfo获取运营商信息');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=233425fc2ab6a5`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            addDebugLog(`IPinfo返回错误状态: ${response.status}`);
            throw new Error('运营商查询失败');
        }
        
        const data = await response.json();
        if (data.org) {
            const processed = processInternationalISP(data.org);
            addDebugLog('IPinfo调用成功');
            return updateElement('ipv4-location', processed, STATUS.NORMAL);
        }
        addDebugLog('IPinfo返回数据缺少运营商信息');
    } catch (error) {
        addDebugLog(`IPinfo调用失败: ${error.message}`);
    }

    updateElement('ipv4-location', '运营商检测失败', STATUS.WARNING);
}

// IPinfo特殊处理函数
function processInternationalISP(ispString) {
    // 去除AS号码和技术细节
    const cleaned = ispString
        .replace(/^AS\d+\s*/i, '')  // 去除AS
        .replace(/[^\w\s]/g, ' ')   // 去除特殊字符
        .trim();

    // 优先完整匹配
    for (const [en, cn] of Object.entries(ISP_TRANSLATIONS)) {
        if (new RegExp(`\\b${en}\\b`, 'i').test(cleaned)) {
            return cn;
        }
    }

    // 关键词匹配
    if (/mobile|cmcc/i.test(cleaned)) return '中国移动';
    if (/telecom|chinanet/i.test(cleaned)) return '中国电信';
    if (/unicom/i.test(cleaned)) return '中国联通';

    return cleaned; // 无法识别时返回原始数据
}

// 辅助函数和初始化
function updateElement(id, value, status) {
    const element = document.getElementById(id);
    const statusElement = document.getElementById(`${id}-status`);
    if (element) element.textContent = value;
    if (statusElement) {
        statusElement.textContent = 
            status === STATUS.NORMAL ? '正常' :
            status === STATUS.WARNING ? '警告' : '异常';
        statusElement.className = status;
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    detectIP();
    setInterval(detectIP, 30000); // 自动更新
});

async function pingWebsite(url, elementId) {
    const TIMEOUT = 8000; // 总检测超时
    const WARNING_THRESHOLD = 800; // 慢速阈值
    
    try {
        addDebugLog(`开始ping测试: ${url}`);
        // 双协议并行检测
        const controller = new AbortController();
        setTimeout(() => controller.abort(), TIMEOUT);
        
        // 同时尝试HTTPS和HTTP
        const requests = [
            fetch(`https://${url}`, { mode: 'no-cors', signal: controller.signal }),
            fetch(`http://${url}`, { mode: 'no-cors', signal: controller.signal })
        ];

        // 等待任意一个协议成功
        const startTime = Date.now();
        const response = await Promise.any(requests);
        const latency = Date.now() - startTime;

        // 判断访问速度
        let status = STATUS.NORMAL;
        let statusText = '正常';
        if (latency > WARNING_THRESHOLD) {
            status = STATUS.WARNING;
            statusText = '较慢';
        }

        addDebugLog(`ping测试成功: ${url}, 延迟: ${latency}ms, 状态: ${statusText}`);
        updateElement(elementId, statusText, status);
        
    } catch (error) {
        const isTimeout = error.name === 'AbortError';
        const isCertError = error.message.match(/SSL|certificate/i);
        
        let errorText = '不可访问';
        if (isTimeout) errorText = '请求超时';
        else if (isCertError) errorText = '证书错误';
        
        addDebugLog(`ping测试失败: ${url}, 错误: ${errorText}, 详情: ${error.message}`);
        updateElement(elementId, errorText, STATUS.ERROR);
    }
}

// 执行所有Ping检测
function runPingTests() {
    pingWebsite('baidu.com', 'ping-baidu');
    pingWebsite('mihoyo.com', 'ping-mihoyo');
    pingWebsite('bilibili.com', 'ping-bilibili');
    pingWebsite('github.io', 'ping-githubio');
    pingWebsite('github.com', 'ping-github');
    pingWebsite('youtube.com', 'ping-youtube');
}

// 页面加载完成后执行所有检测
document.addEventListener('DOMContentLoaded', () => {
    detectBrowserCore();
    detectBrowserUA();
    detectColorScheme();
    detectIP();
    runPingTests();

    // 自动更新Ping检测
    setInterval(runPingTests, 600000);
});