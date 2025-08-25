const TextConverterApp = (function () {
    const inputElement = document.getElementById('inputText');
    const outputElement = document.getElementById('outputText');
    const statusElement = document.getElementById('statusMessage');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const backButton = document.getElementById('backButton');
    let clearClickCount = 0; 
    let clearClickTimer = null;


    // 显示提示 'error', 'warning', 'default'
    function showStatus(message, type = 'default') {
        statusElement.textContent = message;
        statusElement.className = 'status-message'; 
        if (type) {
            statusElement.classList.add(type);
        }
    }

    function getInputText() {
        return inputElement.value;
    }

    function setOutputText(text) {
        outputElement.value = text;
    }

    function clearAll() {
        inputElement.value = '';
        setOutputText('');
        showStatus('已清空', 'warning');
        inputElement.focus();
        clearClickCount = 0;
        if (clearClickTimer) {
            clearTimeout(clearClickTimer);
            clearClickTimer = null;
        }
    }
    
    // 清空
    function handleClearClick() {
        clearClickCount++;
    
        if (clearClickCount === 1) {
            showStatus('双击确认清空', 'error');
    
            clearClickTimer = setTimeout(() => {
                clearClickCount = 0;
                clearClickTimer = null;
            }, 800);
    
        } else if (clearClickCount === 2) {
            clearTimeout(clearClickTimer);
            clearClickTimer = null;
            clearClickCount = 0;
            clearAll();
        }
    }
    

    // 复制
    async function copyToClipboard() {
        const textToCopy = outputElement.value;
        if (!textToCopy) {
            showStatus('请先转换再复制', 'warning');
            return;
        }
    
        // 首选 Clipboard API
        try {
            await navigator.clipboard.writeText(textToCopy);
            showStatus('复制成功！', 'success');
            outputElement.blur();
            return;
        } catch (err) {
            console.warn('Clipboard API 失败:', err);
        }
    
        // 回退方案 execCommand('copy')
        try {
            outputElement.select();
            outputElement.setSelectionRange(0, 999999);
    
            const successful = document.execCommand('copy');
    
            if (successful) {
                showStatus('复制成功！！', 'success');
            } else {
                throw new Error('execCommand 返回 false');
            }
        } catch (err) {
            console.error('execCommand 复制失败:', err);
            showStatus('复制失败: ' + (err.message || '未知错误'), 'error');
        } finally {
            outputElement.blur();
        }
    }


    // 核心转换逻辑
    function transformText(inputText) {
        
        function processCommand(command) {
            command = command.replace(/\s{2,}/g, ' ');
    
            // 检测detect
            const detectPattern = /^execute\s(@\S+)\s((?:[\^~0-9.-]+\s*){1,3})detect\s((?:[\^~0-9.-]+\s*){1,3})(\w+)(?:\s+(-?\d+|\*))?\s(.*)$/i;
            if (detectPattern.test(command)) {
                const match = command.match(detectPattern);
                const blockValue = match[5] ? match[5] : '0';
                return `execute as ${match[1]} at @s positioned ${match[2].trim()} if block ${match[3].trim()} ${match[4]} ${blockValue} run ${processCommand(match[6])}`;
            }
    
            // 基础exec
            const basicPattern = /^execute\s(@\S+)\s((?:[\^~0-9.-]+\s*){1,3})(?!detect)(.+)$/i;
            if (basicPattern.test(command)) {
                const match = command.match(basicPattern);
                const coords = match[2].trim().split(/\s+/);
                if (coords.length < 1 || coords.length > 3) {
                    throw new Error(`无效坐标: ${match[2]}`);
                }
                return `execute as ${match[1]} at @s positioned ${match[2].trim()} run ${processCommand(match[3])}`;
            }
    
            // 嵌套exec
            const nestedPattern = /^(execute)\s(.+?)\srun\s(.*)$/i;
            if (nestedPattern.test(command)) {
                const match = command.match(nestedPattern);
                return `execute ${match[2]} run ${processCommand(match[3])}`;
            }
    
            if (/^execute/i.test(command)) {
                throw new Error(`指令结构异常: ${command}`);
            }
            return command;
        }
    
        // 转换函数
        function convertExecuteCommand(input) {
            try {
                if (!input.trim()) {
                     throw new Error('输入为空');
                }
                if (!/^\/?execute\b/i.test(input)) {
                    throw new Error('不是execute命令');
                }
    
                let cmd = input.replace(/^\//, '')
                             .replace(/\s{2,}/g, ' ')
                             .trim();
    
                let converted = processCommand(cmd);
    
                converted = converted.replace(/ positioned ~~~/g, '')
                                   .replace(/ positioned ~ ~ ~/g, '');
    
                return '/' + converted.replace(/\s+/g, ' ').trim();
    
            } catch (err) {
                return `错误: ${err.message}`;
            }
        }
    
        return convertExecuteCommand(inputText);
    }


    // 转换
    function performConversion() {
        const inputText = getInputText();
        if (!inputText.trim()) {
            showStatus('请输入需要转换的文本', 'warning');
            return;
        }
    
        try {
            const result = transformText(inputText);

            if (result.startsWith('错误:')) {
                setOutputText(result);
                showStatus(result, 'error');
            } else {
                setOutputText(result);
                showStatus('转换成功!', 'success');
            }
        } catch (error) {
            console.error('未处理的异常:', error);
            setOutputText('');
            showStatus(`转换失败: ${error.message}`, 'error');
        }
    }

    // 初始化
    function init() {
        convertBtn.addEventListener('click', performConversion);
        copyBtn.addEventListener('click', copyToClipboard);
        clearBtn.addEventListener('click', handleClearClick);

        backButton.addEventListener('click', () => {
             if (history.length > 1) {
              const fallbackTimer = setTimeout(() => {
                location.href = "/";
              }, 300);
              window.history.back();
              window.addEventListener('popstate', function handlePop() {
                clearTimeout(fallbackTimer);
                window.removeEventListener('popstate', handlePop);
              }, { once: true });
            } else {
              location.href = "/";
            }
        });

        showStatus('--');
        inputElement.focus();
    }

    return {
        init: init
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    TextConverterApp.init();
});