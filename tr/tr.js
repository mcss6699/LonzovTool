document.addEventListener('DOMContentLoaded', function() {
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const startScore = document.getElementById('startScore');
    const toFullWidthBtn = document.getElementById('toFullWidth');
    const clearTextBtn = document.getElementById('clearText');
    const copyTextBtn = document.getElementById('copyText');
    const toggleThemeBtn = document.getElementById('toggleTheme');
    const messageEl = document.getElementById('message');
    const scoreboardName = document.getElementById('scoreboardName');

    // 显示消息提示
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
                    background-color: #f6ffed;
                    border: 1.5px solid #5cb85c;
                    background-color: rgba(246, 255, 237, 0.9);
                    backdrop-filter: blur(4px);
                }
                #message.error {
                    color: #f5222d;
                    background-color: #fff1f0;
                    border: 1px solid #ffa39e;
                }
                #message.warning {
                    color: #faad14;
                    background-color: #fffbe6;
                    border: 1px solid #ffe58f;
                }
                #message.info {
                    color: #1890ff;
                    background-color: #e6f7ff;
                    border: 1px solid #91d5ff;
                }
            `;
            document.head.appendChild(style);
        }

        messageEl.textContent = text;
        messageEl.className = type;
        
        messageEl.classList.remove('show');
        setTimeout(() => {
            messageEl.classList.add('show');
        }, 10);
        
        clearTimeout(messageEl.timer);
        messageEl.timer = setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }

    // 生成T显命令
    function generateTCommands(text, scoreboard, startScore) {
        if (!text.trim()) {
            showMessage('请输入需要转换的文本', 'error');
            return '';
        }
        
        try {
            const commands = [];
            
            for (let i = 0; i < text.length; i++) {
                const currentScore = parseInt(startScore) + i;
                const char = text[i];
                const commandData = {
                    translate: "%%2",
                    with: {
                        rawtext: [
                            {selector: `@s[scores={${scoreboard}=${currentScore}..}]`},
                            {text: char}
                        ]
                    }
                };
                commands.push(JSON.stringify(commandData));
            }
            
            const result = "[" + commands.join(",") + "]";
            showMessage(`生成 ${text.length} 条命令成功！`, 'success');
            return result;
        } catch (err) {
            showMessage('生成失败，请检查输入', 'error');
            return '';
        }
    }

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

    // 绑定事件处理函数
    toFullWidthBtn.addEventListener('click', function() {
        const scoreboard = scoreboardName.value || 'T显';
        const score = startScore.value || '0';
        outputText.value = generateTCommands(inputText.value, scoreboard, score);
    });

    clearTextBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        scoreboardName.value = 'T显';
        startScore.value = '0';
        inputText.focus();
        messageEl.className = 'message';
    });

    copyTextBtn.addEventListener('click', async function() {
        const success = await copyText(outputText.value);
        if (success) {
            showMessage('复制成功！', 'success');
            this.style.backgroundColor = 'var(--success-hover)';
            setTimeout(() => {
                this.style.backgroundColor = 'var(--success-color)';
            }, 1500);
        } else {
            showMessage('复制失败，请手动复制', 'error');
        }
    });
    
        // 返回(待优化)
        toggleThemeBtn.addEventListener('click', function() {
            try {
                window.close();
            } catch (e) {
                console.error('无法关闭窗口:', e);
            }
        });
    });