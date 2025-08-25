const TextConverterApp = (function () {
    const inputElement = document.getElementById('inputText');
    const outputElement = document.getElementById('outputText');
    const statusElement = document.getElementById('statusMessage');
    const convertBtn = document.getElementById('convertBtn');
    const copyBtn = document.getElementById('copyBtn');
    const clearBtn = document.getElementById('clearBtn');
    const backButton = document.getElementById('backButton');
    const modeSelect = document.getElementById('modeSelect');
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


// 角标(右上)
function toSuperscript(inputText) {
    if (typeof inputText !== 'string') {
        throw new Error('请检查输入');
    }
    const superscriptMap = {
        '0': '\u2070', '1': '\u00B9', '2': '\u00B2', '3': '\u00B3', '4': '\u2074',
        '5': '\u2075', '6': '\u2076', '7': '\u2077', '8': '\u2078', '9': '\u2079',
        '+': '\u207A', '-': '\u207B', '=': '\u207C', '(': '\u207D', ')': '\u207E', 'n': '\u207F',
        // 大小写字母 A-Z, a-z
        'A': '\u1D2C', 'B': '\u1D2E', 'C': '\u1D30', 'D': '\u1D31', 'E': '\u1D32',
        'F': '\u1D33', 'G': '\u1D34', 'H': '\u1D35', 'I': '\u1D36', 'J': '\u1D37',
        'K': '\u1D38', 'L': '\u1D39', 'M': '\u1D3A', 'N': '\u1D3B', 'O': '\u1D3C',
        'P': '\u1D3E', // 'Q': '\u1D3F', // Q 的上标不常用或不存在
        'R': '\u1D3F', 'S': '\u1D40', 'T': '\u1D41', 'U': '\u1D42', 'V': '\u1D43',
        'W': '\u1D44', 'X': '\u1D45', 'Y': '\u1D46', 'Z': '\u1D47',
        'a': '\u1D48', 'b': '\u1D49', 'c': '\u1D4A', 'd': '\u1D4B', 'e': '\u1D4C',
        'f': '\u1D4D', 'g': '\u1D4E', 'h': '\u1D4F', 'i': '\u1D50', 'j': '\u1D51',
        'k': '\u1D52', 'l': '\u1D53', 'm': '\u1D54', 'n': '\u1D55', 'o': '\u1D56',
        'p': '\u1D57', 'q': '\u1D58', 'r': '\u1D59', 's': '\u1D5A', 't': '\u1D5B',
        'u': '\u1D5C', 'v': '\u1D5D', 'w': '\u1D5E', 'x': '\u1D5F', 'y': '\u1D60',
        'z': '\u1D61'
        // 部分字母共享或使用不同的Unicode点
        // 有些字母没有标准的上标形式，或者使用了希腊字母等替代
    };

    let result = '';
    for (let i = 0; i < inputText.length; i++) {
        const char = inputText[i];
        if (superscriptMap.hasOwnProperty(char)) {
            result += superscriptMap[char];
        } else {
            result += char;
        }
    }
    return result;
}

// 角标(右下)
function toSubscript(inputText) {
    if (typeof inputText !== 'string') {
        throw new Error('请检查输入');
    }
    const subscriptMap = {
        '0': '\u2080', '1': '\u2081', '2': '\u2082', '3': '\u2083', '4': '\u2084',
        '5': '\u2085', '6': '\u2086', '7': '\u2087', '8': '\u2088', '9': '\u2089',
        '+': '\u208A', '-': '\u208B', '=': '\u208C', '(': '\u208D', ')': '\u208E',
        'a': '\u2090', 'b': '\u2091', 'c': '\u2092', 'd': '\u2093', 'e': '\u2094',
        'f': '\u2095', 'g': '\u2096', 'h': '\u2097', 'i': '\u2098', 'j': '\u2099',
        'k': '\u209A', 'l': '\u209B', 'm': '\u209C', 'n': '\u209D', 'o': '\u2092', // o 共用 c
        'p': '\u209A', // p 共用 k
        'r': '\u1D63', 's': '\u209B', // s 共用 l
        't': '\u209C', // t 共用 m
        'u': '\u1D64', 'v': '\u1D65', 'x': '\u2093', // x 共用 d
        'y': '\u1D67', 'z': '\u1D66',
        'A': '\u2090', 'B': '\u2091', 'C': '\u2092', 'D': '\u2093', 'E': '\u2094',
        'F': '\u2095', 'G': '\u2096', 'H': '\u2097', 'I': '\u2098', 'J': '\u2099',
        'K': '\u209A', 'L': '\u209B', 'M': '\u209C', 'N': '\u209D', 'O': '\u2092', // O 共用 C
        'P': '\u209A', 'R': '\u1D63', 'S': '\u209B', 'T': '\u209C',
        'U': '\u1D64', 'V': '\u1D65', 'X': '\u2093', 'Y': '\u1D67', 'Z': '\u1D66'
        // 部分大写字母没有专用下标，使用了小写或相近的下标
    };

    let result = '';
    for (let i = 0; i < inputText.length; i++) {
        const char = inputText[i];
        if (subscriptMap.hasOwnProperty(char)) {
            result += subscriptMap[char];
        } else {
            result += char;
        }
    }
    return result;
}

// 类拉丁文
function toLatinLetter(inputText) {
    if (typeof inputText !== 'string') {
        throw new Error('请检查输入');
    }
    const latinMap = {
        'A': '\u1D00', // ᴀ
        'B': '\u0299', // ʙ
        'C': '\u1D04', // ᴄ
        'D': '\u1D05', // ᴅ
        'E': '\u1D07', // ᴇ
        'F': '\uA730', // ꜰ
        'G': '\u0262', // ɢ
        'H': '\u029C', // ʜ
        'I': '\u026A', // ɪ
        'J': '\u1D0A', // ᴊ
        'K': '\u1D0B', // ᴋ
        'L': '\u029F', // ʟ
        'M': '\u1D0D', // ᴍ
        'N': '\u0274', // ɴ
        'O': '\u1D0F', // ᴏ
        'P': '\u1D18', // ᴘ
        'Q': '\u0051', // Q
        'R': '\u0280', // ʀ
        'S': '\uA731', // ꜱ
        'T': '\u1D1B', // ᴛ
        'U': '\u1D1C', // ᴜ
        'V': '\u1D20', // ᴠ
        'W': '\u1D21', // ᴡ
        'X': '\u0058', // X
        'Y': '\u028F', // ʏ
        'Z': '\u1D22'  // ᴢ
    };

    let result = '';
    for (let i = 0; i < inputText.length; i++) {
        const char = inputText[i];
        if (latinMap.hasOwnProperty(char)) {
            result += latinMap[char];
        } else {
            result += char;
        }
    }
    return result;
}

// 核心转换函数
function transformText(inputText) {
    const selectedMode = modeSelect.value;

    switch (selectedMode) {
        case 'fullwidth':
            if (typeof inputText !== 'string') {
                throw new Error('请检查输入');
            }
            let fullwidthResult = '';
            for (let i = 0; i < inputText.length; i++) {
                const char = inputText[i];
                const charCode = char.charCodeAt(0);
                if ((charCode >= 65 && charCode <= 90) || // A-Z
                    (charCode >= 97 && charCode <= 122) || // a-z
                    (charCode >= 48 && charCode <= 57)) { // 0-9
                    fullwidthResult += String.fromCharCode(charCode + 65248);
                } else {
                    fullwidthResult += char;
                }
            }
            return fullwidthResult;

        case 'superscript':
            return toSuperscript(inputText);

        case 'subscript':
            return toSubscript(inputText);

        case 'latin':
            return toLatinLetter(inputText);

        default:
            throw new Error('未知的转换模式');
    }
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