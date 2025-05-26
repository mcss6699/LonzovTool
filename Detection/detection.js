// 状态类名常量
const STATUS = {
    NORMAL: 'status-normal',
    WARNING: 'status-warning',
    ERROR: 'status-error'
};

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

// 检测浏览器UA标识
function detectBrowserUA() {
    const ua = navigator.userAgent;
    const element = document.getElementById('browser-ua');
    const statusElement = document.getElementById('browser-ua-status');
    if (element) element.textContent = ua;
    if (statusElement) statusElement.textContent = '-';
}

// 检测浏览器核心
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

// 检测深浅色模式
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

// IP检测
async function detectIP() {
    const TIMEOUT = 10000; // 超时

    //IP地址
    let ip;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch('https://api.ipify.org?format=json', {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error('IP查询失败');
        const data = await response.json();
        ip = data.ip;
    } catch (error) {
        try {
            // 备用IP查询
            const backupRes = await fetch('https://ipv4.icanhazip.com/');
            ip = (await backupRes.text()).trim();
        } catch {
            updateElement('ipv4', 'IP获取失败', STATUS.ERROR);
            updateElement('ipv4-location', '服务不可用', STATUS.ERROR);
            return;
        }
    }

    updateElement('ipv4', ip, STATUS.NORMAL);

// 运营商检测
    // 1-太平洋网络
    try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), TIMEOUT);
        
        const response = await fetch(`http://whois.pconline.com.cn/ipJson.jsp?ip=${ip}&json=true`, {
            signal: controller.signal,
            headers: { 'Accept-Language': 'zh-CN' }
        });
        
        const data = await response.json();
        if (data.addr) {
            return updateElement('ipv4-location', data.addr.split(' ').pop(), STATUS.NORMAL);
        }
    } catch {}

    // A2-国内HTTPS API
    try {
        const response = await fetch(`https://ip.niu.pi/api/ip/isp?ip=${ip}`);
        const data = await response.json();
        if (data.data?.isp) {
            return updateElement('ipv4-location', data.data.isp, STATUS.NORMAL);
        }
    } catch {}

    // 3-IPinfo
    try {
        const response = await fetch(`https://ipinfo.io/${ip}/json?token=233425fc2ab6a5`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const data = await response.json();
        
        if (data.org) {
            const processed = processInternationalISP(data.org);
            return updateElement('ipv4-location', processed, STATUS.NORMAL);
        }
    } catch {}

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
    setInterval(detectIP, 60000); // 每60s更新
});

async function pingWebsite(url, elementId) {
    const TIMEOUT = 5000; // 总检测超时5秒
    const WARNING_THRESHOLD = 500; // 慢速阈值0.5秒
    
    try {
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

        updateElement(elementId, statusText, status);
        
    } catch (error) {
        const isTimeout = error.name === 'AbortError';
        const isCertError = error.message.match(/SSL|certificate/i);
        
        let errorText = '不可访问';
        if (isTimeout) errorText = '请求超时';
        else if (isCertError) errorText = '证书错误';
        
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

    // 每30秒更新一次Ping检测
    setInterval(runPingTests, 30000);
});