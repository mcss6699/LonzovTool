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
    let isOutputEdited = false;
    const editedLabel = document.querySelector('.edited-label');

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

    function resetOutputEditState() {
        isOutputEdited = false;
        outputText.classList.remove('edited');
        editedLabel.style.display = 'none';
    }

    // 生成T显命令
    function generateTCommands(text, scoreboard, startScore) {
        if (!text.trim()) {
            showMessage('请输入需要转换的文本', 'error');
            return '';
        }
        
        try {
            const commands = [];
            let i = 0;
            let score = parseInt(startScore);
            
            while (i < text.length) {
                let currentText = '';
                
                // 递归收集所有连续的§*和\n
                while (i < text.length) {
                    // 处理§*格式
                    if (text[i] === '§' && i + 1 < text.length) {
                        currentText += text.substr(i, 2);
                        i += 2;
                        continue;
                    }
                    // 处理\n字符串
                    else if (text[i] === '\\' && i + 1 < text.length && text[i+1] === 'n') {
                        currentText += '\n'; // 直接使用换行符
                        i += 2;
                        continue;
                    }
                    // 处理实际换行符
                    else if (text[i] === '\n') {
                        currentText += '\n';
                        i++;
                        continue;
                    }
                    break;
                }
                
                // 收集后续一个普通字符
                if (i < text.length && currentText) {
                    currentText += text[i];
                    i++;
                }
                
                if (currentText) {
                    const commandData = {
                        translate: "%%2",
                        with: {
                            rawtext: [
                                {selector: `@s[scores={${scoreboard}=${score}..}]`},
                                {text: currentText}
                            ]
                        }
                    };
                    commands.push(JSON.stringify(commandData));
                    score++;
                } else if (i < text.length) {
                    // 处理普通字符
                    const commandData = {
                        translate: "%%2",
                        with: {
                            rawtext: [
                                {selector: `@s[scores={${scoreboard}=${score}..}]`},
                                {text: text[i]}
                            ]
                        }
                    };
                    commands.push(JSON.stringify(commandData));
                    i++;
                    score++;
                }
            }
            
            const result = "[" + commands.join(",") + "]";
            showMessage(`✔共生成 ${commands.length} 组！`, 'success');
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
    outputText.addEventListener('input', function() {
        if (!isOutputEdited) {
            isOutputEdited = true;
            this.classList.add('edited');
            editedLabel.style.display = 'inline';
        }
    });
    
    toFullWidthBtn.addEventListener('click', function() {
        const scoreboard = scoreboardName.value || 'T显';
        const score = startScore.value || '0';
        const result = generateTCommands(inputText.value, scoreboard, score);
        if (result) {
            outputText.value = result;
            setTimeout(() => {
                resetOutputEditState();
            }, 0);
        }
    });

    clearTextBtn.addEventListener('click', function() {
        inputText.value = '';
        outputText.value = '';
        scoreboardName.value = 'T显';
        startScore.value = '0';
        inputText.focus();
        messageEl.className = 'message';
        setTimeout(() => {
            resetOutputEditState();
        }, 0);
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
    
        // 返回
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
    });