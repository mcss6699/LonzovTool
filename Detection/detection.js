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

async function detectIP() {
    const TIMEOUT = 10000; // 10秒超时

    // 获取IP地址
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (!response.ok) throw new Error('使用api.ipify.org失败');
        const data = await response.json();
        ip = data.ip;
    } catch (error) {
        try {
            // 备用IP查询
            const response = await fetch('https://ipv4.icanhazip.com/');
            if (!response.ok) throw new Error('使用icanhazip.com失败');
            const text = await response.text();
            ip = text.trim();
        } catch (backupError) {
            updateElement('ipv4', '获取IP失败', STATUS.ERROR);
            updateElement('ipv4-location', '无法获取', STATUS.ERROR);
            return;
        }
    }

    // 更新IP地址显示
    updateElement('ipv4', ip, STATUS.NORMAL);

    // 查询归属地信息
    try {
        const controller3 = new AbortController();
        const timeout3 = setTimeout(() => controller3.abort(), TIMEOUT);
        
        // 使用支持ISP/ASN的API
        const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
            headers: { 'User-Agent': 'Mozilla/5.0' }, // 绕过某些API的限制
            signal: controller3.signal
        });
        clearTimeout(timeout3);
        
        if (!geoResponse.ok) throw new Error(`HTTP ${geoResponse.status}`);
        const geoData = await geoResponse.json();
        
        // 智能组合归属地信息
        const locationParts = [];
        if (geoData.country) locationParts.push(geoData.country);
        if (geoData.region) locationParts.push(geoData.region);
        if (geoData.city) locationParts.push(geoData.city);
        if (geoData.org) locationParts.push(geoData.org.split(' ')[0]);
        
        const finalLocation = locationParts.length > 0 
            ? locationParts.join(' · ') 
            : '未知归属地';
        
        updateElement('ipv4-location', finalLocation, STATUS.NORMAL);
    } catch (geoError) {
        // 备用归属地查询
        try {
            const controller4 = new AbortController();
            const timeout4 = setTimeout(() => controller4.abort(), TIMEOUT);
            
            const backupGeo = await fetch(`https://ipwhois.app/format/json/${ip}`, {
                signal: controller4.signal
            });
            clearTimeout(timeout4);
            
            const backupData = await backupGeo.json();
            const simpleLocation = backupData.asn || backupData.timezone;
            updateElement('ipv4-location', simpleLocation || '查询超时', 
                        backupGeo.ok ? STATUS.WARNING : STATUS.ERROR);
        } catch {
            updateElement('ipv4-location', '服务不可用', STATUS.ERROR);
        }
    }
}

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
    pingWebsite('tool.lonzov.top', 'ping-tool.lonzov.top');
    pingWebsite('www.lonzov.top', 'ping-www.lonzov.top');
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