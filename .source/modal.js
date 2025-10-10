// 仿ios弹窗
(function() {
    const style = document.createElement('style');
    style.textContent = `
        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 9998;
            opacity: 0;
            transition: opacity 0.3s;
            backdrop-filter: blur(2px);
        }

        .modal-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            min-width: 300px;
            max-width: 520px;
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(10px);
            border-radius: 18px;
            z-index: 9999;
            opacity: 0;
            transition: opacity 0.15s;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            font-family: 'Misa', 'PingFang SC', 'HarmonyOS Sans SC', sans-serif;
        }

        [data-theme="dark"] .modal-container {
            background: rgba(30, 30, 30, 0.85);
        }

        .modal-title {
            padding: 12px 24px 12px;
            text-align: center;
            font-weight: 600;
            font-size: 18px;
            color: #dfefffff;
            position: relative;
        }

        .modal-title::after {
            content: '';
            margin-left: -0.9em;
            pointer-events: none;
        }

        .title-spacing-small2 {
            letter-spacing: 0em;
        }

        .title-spacing-small {
            letter-spacing: 0.1em;
        }

        .title-spacing-medium {
            letter-spacing: 0.7em;
        }

        .title-spacing-large {
            letter-spacing: 1em;
        }

        .modal-content {
            padding: 0 24px;
            margin-top: -8px;
            font-size: 15px;
            color: #333;
            max-height: 50vh;
            overflow-y: auto;
            line-height: 1.5;
        }

        .modal-content p {
            margin-top: 0 !important;
            margin-bottom: 8.5px !important;
        }

        [data-theme="dark"] .modal-content {
            color: #EEE;
        }

        .modal-footer {
            display: flex;
            border-top: 1px solid rgba(0, 0, 0, 0.1);
            margin-top: 10px;
        }

        .modal-button {
            flex: 1;
            padding: 9px 10px;
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            color: #0e83ffff;
            background: none;
            border: none;
            cursor: pointer;
            position: relative;
            line-height: 1.2;
        }

        .modal-button:not(:last-child)::after {
            content: '';
            position: absolute;
            right: 0;
            top: 0;
            height: 100%;
            width: 1px;
            background: rgba(0, 0, 0, 0.1);
        }

        .button-red {
            color: #FF3B30 !important;
        }

        .button-gray {
            color: #8E8E93 !important;
        }
    `;
    document.head.appendChild(style);
    window.showModal = function(config) {
        const storageKey = `modal_closed_${location.host}_${config.id}`;
        const storedVersion = localStorage.getItem(storageKey);
        if (!config.forceShow && storedVersion && storedVersion >= config.version) {
            return;
        }

        // 创建DOM元素
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        const container = document.createElement('div');
        container.className = 'modal-container';
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

        // 标题
        const title = document.createElement('div');
        title.className = 'modal-title';
        title.textContent = config.title || '公告'; 

        // 动态字间距优化
        const titleLength = title.textContent.length;
        if (titleLength <= 2) {
            title.classList.add('title-spacing-large');
        } else if (titleLength === 3) {
            title.classList.add('title-spacing-medium');
        } else if (titleLength === 4) {
            title.classList.add('title-spacing-small');
        } else {
            title.classList.add('title-spacing-small2');
        }
        
        // 标题颜色设置
        if (config.titleColor === 'white') {
            title.style.color = currentTheme === 'dark' ? '#FFFFFF' : '#000000';
        } else {
            title.style.color = '#007AFF';
        }
        
        // 内容区域
        const content = document.createElement('div');
        content.className = 'modal-content';
        content.innerHTML = config.content;

        // 按钮区域
        const footer = document.createElement('div');
        footer.className = 'modal-footer';

        config.buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `modal-button ${btn.style ? 'button-' + btn.style : ''}`;
            button.textContent = btn.text;
            button.onclick = function() {
                if (btn.action === 'close') {
                    handleButtonAction(btn.action, btn.url, config.id, config.version);
                } else {
                    executeButtonAction(btn.action, btn.url);
                }
            };
            footer.appendChild(button);
        });

        container.appendChild(title);
        container.appendChild(content);
        container.appendChild(footer);
        document.body.appendChild(backdrop);
        document.body.appendChild(container);

        setTimeout(() => {
            backdrop.style.opacity = '1';
            container.style.opacity = '1';
        }, 10);
    };

    // 按钮点击处理
    function handleButtonAction(action, url, id, version) {
        const storageKey = `modal_closed_${location.host}_${id}`;
        localStorage.setItem(storageKey, version);
        
        const backdrop = document.querySelector('.modal-backdrop');
        const container = document.querySelector('.modal-container');
        container.style.opacity = '0';
        backdrop.style.opacity = '0';
        
        setTimeout(() => {
            document.body.removeChild(backdrop);
            document.body.removeChild(container);
        }, 300);
    }
    
    function executeButtonAction(action, url) {
        if (action === 'go_home') {
            try {
                window.close();
                setTimeout(() => !window.closed && (window.location.href = 'about:blank'), 1000);
            } catch (e) {
                window.location.href = 'about:blank';
            }
        } else if (action === 'open_link') {
            window.open(url, '_blank');
        }
    }
})();