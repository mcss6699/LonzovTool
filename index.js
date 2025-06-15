
document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const themeAlert = document.getElementById('theme-alert');
    const menuButton = document.querySelector('.menu-button');
    const closeMenuButton = document.querySelector('.close-menu');
    const sideMenu = document.querySelector('.side-menu');
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    const toolGrid = document.querySelector('.tool-grid');
    
    // 卡片
    const tools = [
        { title: "艺术字转换", desc: "Minecraft专属艺术字符，游戏内才能显示", link: "qjzh/qjzh.html" },
        { title: "命令转换", desc: "execute命令转换新语法", link: "execute/exec.html" },
        { title: "T显动画", desc: "自动生成打字机效果逐字出现动画", link: "tr/tr.html" },
        { title: "语法高亮", desc: "高亮语法指令编辑器，更易读易编辑(还在做)", link: "index.html" },
    ];

    // 初始化卡片
    function initToolCards() {
        toolGrid.innerHTML = '';
        
        tools.forEach(tool => {
            const card = document.createElement('div');
            card.className = 'tool-card';
            card.innerHTML = `
                <a href="${tool.link}" target="_blank" class="tool-link">
                    <h3 class="tool-title">${tool.title}</h3>
                    <p class="tool-desc">${tool.desc}</p>
                </a>
            `;
            toolGrid.appendChild(card);
        });
    }

    // 菜单
    function toggleMenu() {
        sideMenu.classList.toggle('active');
        body.classList.toggle('menu-active');
    }

    // 关菜单
    document.addEventListener('click', function(e) {
        if (sideMenu.classList.contains('active') && 
            !e.target.closest('.side-menu') && 
            !e.target.closest('.menu-button')) {
            toggleMenu();
        }
    });

    // 检测系统深色
    function isSystemDarkMode() {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // 深色提示
    function showThemeAlert() {
        themeAlert.classList.add('show');
        setTimeout(() => {
            themeAlert.classList.remove('show');
        }, 2500);
    }

    // 深浅色模式切换
    function toggleTheme() {
        const isDark = body.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        
        if (newTheme === 'light' && isSystemDarkMode()) {
            showThemeAlert();
        }

        body.setAttribute('data-theme', newTheme);
        themeToggle.textContent = isDark ? '深色' : '浅色';
        localStorage.setItem('theme', newTheme);
    }

    // 初始化主题
    function initTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        body.setAttribute('data-theme', savedTheme);
        themeToggle.textContent = savedTheme === 'dark' ? '浅色' : '深色';
    }

    // 事件监听
    menuButton.addEventListener('click', toggleMenu);
    closeMenuButton.addEventListener('click', toggleMenu);
    themeToggle.addEventListener('click', toggleTheme);

    // 初始化
    initToolCards();
    initTheme();

    // 禁用滚动动画当偏好减少动画时
    const announcementText = document.querySelector('.announcement-text');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (announcementText && prefersReducedMotion) {
        announcementText.style.animation = 'none';
        announcementText.style.paddingLeft = '0';
    }
});