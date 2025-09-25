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


    /**
     * 核心转换函数
     * @param {string} inputText - 需要被转换的原始文本
     * @returns {string} 转换后的文本
     * @throws {Error} 如果转换失败，抛出错误
     */

    function transformText(inputText) {
        // --- 模板: 在此处实现具体的文本转换逻辑 ---
        // 示例：处理特定失败情况
        if (inputText.trim() === '测试失败') {
            throw new Error('这是测试失败输出');
        }

        // 示例：简单地在文本前后加上标记
        return `[转换结果开始]\n${inputText}\n[转换结果结束]`;
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
            setOutputText(result);
            showStatus('转换成功！', 'success');
        } catch (error) {
            console.error('转换失败: ', error);
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