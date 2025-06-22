document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const toFullWidthBtn = document.getElementById('toFullWidth');
    const clearTextBtn = document.getElementById('clearText');
    const copyTextBtn = document.getElementById('copyText');
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const messageEl = document.getElementById('message');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalConfirmBtn = document.getElementById('modal-confirm');

    // 显示弹窗函数
    function showModal() {
        modalOverlay.style.display = 'flex';
    }

    // 隐藏弹窗函数
    function hideModal() {
        modalOverlay.classList.add('closing');
        setTimeout(() => {
            modalOverlay.style.display = 'none';
            modalOverlay.classList.remove('closing');
        }, 200); 
    }

    showModal();

    modalConfirmBtn.addEventListener('click', hideModal);

    function showMessage(text, type = 'info') {
        if (!document.querySelector('style.qjzh-message-style')) {
            const style = document.createElement('style');
            style.className = 'qjzh-message-style';
            style.textContent = `
                #message {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    padding: 12px 24px;
                    border-radius: 4px;
                    font-size: 16px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    opacity: 0;
                    transition: all 0.3s ease;
                    z-index: 9999;
                }
                #message.show {
                    opacity: 1;
                    top: 30px;
                }
                #message.success {
                    color: #52c41a;
                    background-color: rgba(246, 255, 237, 0.9);
                    border: 1.5px solid #5cb85c;
                    backdrop-filter: blur(4px);
                }
                #message.error {
                    color: #f5222d;
                    background-color: rgba(255, 241, 240, 0.9);
                    border: 1px solid #ffa39e;
                }
            `;
            document.head.appendChild(style);
        }

        messageEl.textContent = text;
        messageEl.className = type;
        messageEl.classList.remove('show');
        setTimeout(() => messageEl.classList.add('show'), 10);
        clearTimeout(messageEl.timer);
        messageEl.timer = setTimeout(() => messageEl.classList.remove('show'), 3000);
    }

    // 转换核心
    function processCommand(command) {
        command = command.replace(/\s{2,}/g, ' ');

        // 检测detect
        const detectPattern = /^execute\s(@\S+)\s((?:[~0-9-]+ ?){1,3})detect\s((?:[~0-9-]+ ?){1,3})(\w+)\s(-?\d+)\s(.*)$/i;
        if (detectPattern.test(command)) {
            const match = command.match(detectPattern);
            return `execute as ${match[1]} at @s positioned ${match[2].trim()} if block ${match[3].trim()} ${match[4]} ${match[5]} run ${processCommand(match[6])}`;
        }

        // 基础exec
        const basicPattern = /^execute\s(@\S+)\s((?:[~0-9-]+ ?){1,3})(?!detect)(.+)$/i;
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
            if (!/^\/?execute\b/i.test(input)) {
                throw new Error('输入为空或不是execute命令');
            }

            let cmd = input.replace(/^\//, '')
                         .replace(/\s{2,}/g, ' ')
                         .trim();

            let converted = processCommand(cmd);

            if (!/^\/execute\s+as\s+@/i.test('/' + converted)) {
                throw new Error('生成命令不符合规范');
            }

            converted = converted.replace(/ positioned ~~~/g, '')
                               .replace(/ positioned ~ ~ ~/g, '');

            return '/' + converted.replace(/\s+/g, ' ').trim();

        } catch (err) {
            return `//错误 ：${err.message}`;
        }
    }

    // 事件绑定
    toFullWidthBtn.addEventListener('click', function() {
        const result = convertExecuteCommand(inputText.value);
        outputText.value = result;
        result.startsWith('//错误 ：') 
            ? showMessage('转换失败', 'error') 
            : showMessage('转换成功', 'success');
    });

    clearTextBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        inputText.focus();
    });

    copyTextBtn.addEventListener('click', async function() {
        if (await copyText(outputText.value)) {
            showMessage('复制成功', 'success');
        } else {
            showMessage('复制失败，请手动复制', 'error');
        }
    });

    toggleThemeBtn.addEventListener('click', function() {
        // 先模拟浏览器返回
        if (history.length > 1) {
          // 有历史记录时尝试返回
          const fallbackTimer = setTimeout(() => {
            location.href = "/"; // 超时未返回则跳转首页
          }, 300); // 超时阈值
          
          window.history.back();
          window.addEventListener('popstate', function handlePop() {
            clearTimeout(fallbackTimer); // 返回成功时清除定时器
            window.removeEventListener('popstate', handlePop); // 清理事件
          }, { once: true });
        } else {
          location.href = "/";
        }
      });

    /* 
    async function copyText(text) {
        if (!text.trim()) return false;
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            }
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        } catch (err) {
            console.error('复制失败:', err);
            return false;
        }
    } */


    // 复制
    async function copyText(text) {
        if (!text.trim()) {
            showMessage('没有可复制的内容', 'error');
            return false;
        }

        // Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch (err) {
                console.error('Clipboard API failed:', err);
            }
        }

        try {
            // 创建临时textarea
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            
            // 保存当前焦点和选中状态
            const focused = document.activeElement;
            const selected = document.getSelection().rangeCount > 0 ? 
                document.getSelection().getRangeAt(0) : false;
            
            // 选中并复制
            textArea.select();
            document.execCommand('copy');
            
            // 清理并恢复焦点
            document.body.removeChild(textArea);
            if (focused && focused.focus) {
                focused.focus();
            }
            if (selected) {
                document.getSelection().removeAllRanges();
                document.getSelection().addRange(selected);
            }
            
            return true;
        } catch (err) {
            console.error('Fallback copy method failed:', err);
            return false;
        }
    }
});