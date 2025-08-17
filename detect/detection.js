const STATUS = {
    NORMAL: 'status-normal',
    WARNING: 'status-warning',
    WARNING2: 'status-warning2',
    ERROR: 'status-error'
};
const debugLog = [];
const debugLogElement = document.getElementById('debug-log');
const debugToggle = document.getElementById('debug-toggle');
const pingRefreshButton = document.getElementById('ping-refresh');

if (debugLogElement) {
    debugLogElement.style.whiteSpace = 'pre-wrap';
    debugLogElement.style.overflowY = 'auto';
    debugLogElement.style.maxHeight = '300px';
}

function addDebugLog(message) {
    const timestamp = new Date().toLocaleTimeString();
    debugLog.push(`[${timestamp}] ${message}`);
    if (debugLogElement.style.display === 'block') {
        debugLogElement.textContent = debugLog.join('\n');
        debugLogElement.scrollTop = debugLogElement.scrollHeight;
    }
}

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

function updateElement(id, value, status) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
        element.classList.remove(STATUS.NORMAL, STATUS.WARNING, STATUS.WARNING2, STATUS.ERROR);
        if (status) {
            element.classList.add(status);
        }
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
    if (element) element.textContent = ua;
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
    if (element) element.textContent = browserCore;
}
// 深浅色模式
function detectColorScheme() {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const colorScheme = isDarkMode ? '深色模式' : '浅色模式';
    const element = document.getElementById('color-scheme');
    if (element) element.textContent = colorScheme;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        const newColorScheme = e.matches ? '深色模式' : '浅色模式';
        if (element) element.textContent = newColorScheme;
    });
}

const ISP_TRANSLATIONS = {
    'China Mobile': '中国移动',
    'China Telecom': '中国电信',
    'China Unicom': '中国联通',
    'CMCC': '中国移动',
    'CHINANET': '中国电信',
    'UNICOM': '中国联通'
};

async function detectIP() {
    const TIMEOUT = 5500;
    let ip;
    try {
        addDebugLog('开始调用icanhazip获取IP');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        const response = await fetch('https://ipv4.icanhazip.com/', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            addDebugLog(`icanhazip返回错误状态: ${response.status}`);
            throw new Error('IP查询失败');
        }
        ip = (await response.text()).trim();
        addDebugLog('icanhazip调用成功');
        updateElement('ipv4', ip, STATUS.NORMAL);
        await detectIPLocation(ip);
    } catch (error) {
        addDebugLog(`icanhazip调用失败: ${error.message}`);
        updateElement('ipv4', 'IP获取失败', STATUS.ERROR);
        updateElement('ipv4-location', '服务不可用', STATUS.ERROR);
        return;
    }
}
async function detectIPLocation(ip) {
    const TIMEOUT = 5500;
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
        updateElement('ipv4-location', '运营商检测失败', STATUS.ERROR);
    } catch (error) {
        addDebugLog(`IPinfo调用失败: ${error.message}`);
        updateElement('ipv4-location', '运营商检测失败', STATUS.ERROR);
    }
}
// IPinfo特殊处理函数
function processInternationalISP(ispString) {
    const cleaned = ispString
        .replace(/^AS\d+\s*/i, '')
        .replace(/[^\w\s]/g, ' ')
        .trim();
    for (const [en, cn] of Object.entries(ISP_TRANSLATIONS)) {
        if (new RegExp(`\\b${en}\\b`, 'i').test(cleaned)) {
            return cn;
        }
    }
    if (/mobile|cmcc/i.test(cleaned)) return '中国移动';
    if (/telecom|chinanet/i.test(cleaned)) return '中国电信';
    if (/unicom/i.test(cleaned)) return '中国联通';
    return cleaned; // 无法识别时返回原始数据
}

// Ping检测函数
async function pingWebsite(url, elementId) {
    const SINGLE_TIMEOUT = 10000;
    const MAX_ATTEMPTS = 3;
    const results = [];
    let consecutiveTimeoutsOrErrors = 0;

    addDebugLog(`开始ping测试 (3次平均): ${url}`);

    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, SINGLE_TIMEOUT);

            const startTime = Date.now();
            const response = await fetch(`https://${url}`, { mode: 'no-cors', signal: controller.signal });
            const latency = Date.now() - startTime;

            clearTimeout(timeoutId);

            if (!controller.signal.aborted) {
                results.push(latency);
                consecutiveTimeoutsOrErrors = 0;
                addDebugLog(`第${i + 1}次ping (${url}) 成功: ${latency}ms`);
            } else {
                consecutiveTimeoutsOrErrors++;
                addDebugLog(`第${i + 1}次ping (${url}) 请求超时 (>=${SINGLE_TIMEOUT}ms)`);
                if (i === 1 && consecutiveTimeoutsOrErrors === 2) {
                    addDebugLog(`  ${url} 前两次均超时/失败，提前中止第三次检测。`);
                    break;
                }
            }
        } catch (error) {
            consecutiveTimeoutsOrErrors++;
            const isTimeout = error.name === 'AbortError';
            if (isTimeout) {
                addDebugLog(`第${i + 1}次ping (${url}) 请求超时 (>=${SINGLE_TIMEOUT}ms)`);
            } else {
                addDebugLog(`第${i + 1}次ping (${url}) 失败: ${error.message}`);
            }
            if (i === 1 && consecutiveTimeoutsOrErrors === 2) {
                addDebugLog(`  ${url} 前两次均超时/失败，提前中止第三次检测。`);
                break;
            }
        }
    }

    let status, statusText;
    if (results.length > 0) {
        const averageLatency = results.reduce((a, b) => a + b, 0) / results.length;
        addDebugLog(`${url} 检测完成，有效次数: ${results.length}, 平均延迟: ${averageLatency.toFixed(2)}ms`);

        if (averageLatency < 1000) {
            status = STATUS.NORMAL;
            statusText = '正常';
        } else if (averageLatency < 3000) {
            status = STATUS.WARNING;
            statusText = '较慢';
        } else if (averageLatency < 6000) {
            status = STATUS.WARNING2;
            statusText = '慢';
        } else if (averageLatency < 10000) {
            status = STATUS.WARNING2;
            statusText = '极慢';
        } else {
            status = STATUS.ERROR;
            statusText = '极慢';
        }
    } else {
        addDebugLog(`  ${url} 检测完成，所有尝试均失败或超时`);
        status = STATUS.ERROR;
        statusText = '超时';
    }

    updateElement(elementId, statusText, status);
}

function runPingTests() {
    const pingElements = ['ping-baidu', 'ping-mihoyo', 'ping-bilibili', 'ping-githubio', 'ping-github','ping-vercel', 'ping-vercelapp', 'ping-youtube'];
    pingElements.forEach(id => {
        updateElement(id, '检测中...', '');
    });

    pingWebsite('baidu.com', 'ping-baidu');
    pingWebsite('mihoyo.com', 'ping-mihoyo');
    pingWebsite('bilibili.com', 'ping-bilibili');
    pingWebsite('github.io', 'ping-githubio');
    pingWebsite('github.com', 'ping-github');
    pingWebsite('vercel.com', 'ping-vercel');
    pingWebsite('vercel.app', 'ping-vercelapp');
    pingWebsite('youtube.com', 'ping-youtube');
}
document.addEventListener('DOMContentLoaded', () => {
    detectBrowserCore();
    detectBrowserUA();
    detectColorScheme();
    detectIP();
    runPingTests();

    if (pingRefreshButton) {
        pingRefreshButton.addEventListener('click', () => {
            addDebugLog('===按钮触发刷新Ping===');
            runPingTests();
        });
    }
});