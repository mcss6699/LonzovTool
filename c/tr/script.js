const TextConverterApp = (function () {
    const inputElement = document.getElementById('inputText');
    const outputElement = document.getElementById('outputText');
    const statusElement = document.getElementById('statusMessage');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const backButton = document.getElementById('backButton');
    const startScoreInput = document.getElementById('startScoreInput');
    const scoreboardInput = document.getElementById('scoreboardInput');
    const initSelect = document.getElementById('initSelect');
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


// 核心转换函数
function transformText(inputText, scoreboard, startScore, initialize) {
    if (!inputText || !inputText.toString().trim()) {
        return '错误: 请输入需要转换的文本';
    }
    try {
        const commands = [];
        let i = 0;
        // 正确处理起始分数，默认为0
        let initialScoreValue = parseInt(startScore, 10);
        if (isNaN(initialScoreValue)) {
             initialScoreValue = 0;
        }
        // 使用 initialScoreValue 作为后续逻辑的基准
        let score = initialScoreValue;

        if (typeof scoreboard !== 'string' || !scoreboard.trim()) {
             return '错误: 请输入有效的计分板名称';
        }
        const trimmedScoreboard = scoreboard.trim();
        while (i < inputText.length) {
            let currentText = '';
            // 递归收集所有连续的§*和\n
            while (i < inputText.length) {
                // 处理§*格式
                if (inputText[i] === '§' && i + 1 < inputText.length) {
                    currentText += inputText.substr(i, 2);
                    i += 2;
                    continue;
                }
                // 处理\n字符串
                else if (inputText[i] === '\\' && i + 1 < inputText.length && inputText[i+1] === 'n') {
                    currentText += '\n'; // 直接使用换行符
                    i += 2;
                    continue;
                }
                // 处理实际换行符
                else if (inputText[i] === '\n') {
                    currentText += '\n';
                    i++;
                    continue;
                }
                break;
            }
            // 收集后续一个普通字符
            if (i < inputText.length && currentText) {
                currentText += inputText[i];
                i++;
            }
            if (currentText) {
                const commandData = {
                    translate: "%%2",
                    with: {
                        rawtext: [
                            {selector: `@s[scores={${trimmedScoreboard}=${score}..}]`},
                            {text: currentText}
                        ]
                    }
                };
                commands.push(JSON.stringify(commandData));
                score++;
            } else if (i < inputText.length) {
                // 处理普通字符
                const commandData = {
                    translate: "%%2",
                    with: {
                        rawtext: [
                            {selector: `@s[scores={${trimmedScoreboard}=${score}..}]`},
                            {text: inputText[i]}
                        ]
                    }
                };
                commands.push(JSON.stringify(commandData));
                i++;
                score++;
            }
        }
        let result = "[" + commands.join(",") + "]";
        if (initialize === true) {
            result = `/execute as @a[scores={${trimmedScoreboard}=${initialScoreValue}..}] run titleraw @s actionbar {"rawtext":${result}}`;
        }
        return result;
    } catch (err) {
        console.error("转换函数内部错误:", err);
        return `错误: 生成失败 (${err.message})`;
    }
}


    // 转换
    function performConversion() {
        const inputText = getInputText();
        const startScore = startScoreInput.value;
        const scoreboard = scoreboardInput.value;
        const initialize = initSelect.value === 'true';
    
        if (!scoreboard || !scoreboard.trim()) {
             showStatus('请输入计分板名称', 'warning');
             return;
        }
    
    
        try {
            const result = transformText(inputText, scoreboard, startScore, initialize);
    
            if (typeof result === 'string' && result.startsWith('错误:')) {
                setOutputText('');
                showStatus(result, 'error');
            } else {
                setOutputText(result);
                showStatus('转换成功!', 'success');
            }
        } catch (error) {
            console.error('转换过程中发生未处理的异常:', error);
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