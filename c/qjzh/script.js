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


function transformText(inputText) {
    const selectedMode = modeSelect.value;

    switch (selectedMode) {
        case 'fullwidth':
            if (typeof inputText !== 'string') throw new Error('请检查输入');
            let result = '';
            for (let i = 0; i < inputText.length; i++) {
                const char = inputText[i];
                const code = char.charCodeAt(0);
                if ((code >= 48 && code <= 57) || (code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
                    result += String.fromCharCode(code + 65248);
                } else { result += char; }
            }
            return result;

        case 'superscript':
            const sourceCharsSuper = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const targetCharsSuper = '⁰¹²³⁴⁵⁶⁷⁸⁹ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻᴬᴮᒼᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾᴼ̴ᴿˢᵀᵁⱽᵂˣᵞᙆ';
            const superMap = {};
            for (let i = 0; i < sourceCharsSuper.length; i++) {
                superMap[sourceCharsSuper[i]] = targetCharsSuper[i];
            }

            let superResult = '';
            for (let i = 0; i < inputText.length; i++) {
                const char = inputText[i];
                superResult += superMap[char] !== undefined ? superMap[char] : char;
            }
            return superResult;

        case 'subscript':
            const sourceCharsSub = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const targetCharsSub = '₀₁₂₃₄₅₆₇₈₉ₐᵦcdₑfgₕᵢⱼₖₗₘₙₒₚᵨᵣₛₜᵤᵥwₓᵧzAᵦCDEFGHₗJK˪៳៷ₒₚᵨᵣₛₜᵤ៴WᵪᵧZ';
            const subMap = {};
            if (sourceCharsSub.length === targetCharsSub.length) {
                for (let i = 0; i < sourceCharsSub.length; i++) {
                    subMap[sourceCharsSub[i]] = targetCharsSub[i];
                }
            }

            let subResult = '';
            for (let i = 0; i < inputText.length; i++) {
                const char = inputText[i];
                subResult += subMap[char] !== undefined ? subMap[char] : char;
            }
            return subResult;

        case 'latin':
            const sourceCharsLatin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const targetCharsLatin = 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ';
            const latinMap = {};
            for (let i = 0; i < sourceCharsLatin.length; i++) {
                latinMap[sourceCharsLatin[i]] = targetCharsLatin[i];
            }

            let latinResult = '';
            for (let i = 0; i < inputText.length; i++) {
                const char = inputText[i];
                latinResult += latinMap[char] !== undefined ? latinMap[char] : char;
            }
            return latinResult;

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