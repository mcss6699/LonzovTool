// 主题设置
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme') || 'light';

document.documentElement.setAttribute('data-theme', savedTheme);

window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
        document.documentElement.setAttribute('data-theme', e.newValue || 'light');
    }
});

themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// 菜单控制
const menuToggle = document.getElementById('menuToggle');
const menuPanel = document.getElementById('menuPanel');
const menuOverlay = document.getElementById('menuOverlay');

function toggleMenu() {
    const isActive = menuPanel.classList.toggle('active');
    menuOverlay.classList.toggle('active');
    menuToggle.classList.toggle('active');
}

menuToggle.addEventListener('click', toggleMenu);
menuOverlay.addEventListener('click', toggleMenu);

// 分类栏滚动时渐变效果
const categoryFilter = document.getElementById('categoryFilter');
const leftFade = document.querySelector('.category-scroll-fade-left');
const rightFade = document.querySelector('.category-scroll-fade-right');

function updateScrollFade() {
    // 左端渐变
    if (categoryFilter.scrollLeft > 0) {
        leftFade.style.opacity = '1';
    } else {
        leftFade.style.opacity = '0';
    }
    
    // 右端渐变
    const scrollRight = categoryFilter.scrollWidth - categoryFilter.clientWidth - categoryFilter.scrollLeft;
    if (scrollRight > 1) {
        rightFade.style.opacity = '1';
    } else {
        rightFade.style.opacity = '0';
    }
}

// 鼠标滚轮滚动分类栏
categoryFilter.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
    }
    
    categoryFilter.scrollLeft += e.deltaY;
    updateScrollFade();
});

// 拖动滚动分类栏
let isDown = false;
let startX;
let scrollLeft;

categoryFilter.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - categoryFilter.offsetLeft;
    scrollLeft = categoryFilter.scrollLeft;
    categoryFilter.style.cursor = 'grabbing';
});

categoryFilter.addEventListener('mouseleave', () => {
    isDown = false;
    categoryFilter.style.cursor = 'grab';
});

categoryFilter.addEventListener('mouseup', () => {
    isDown = false;
    categoryFilter.style.cursor = 'grab';
});

categoryFilter.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - categoryFilter.offsetLeft;
    const walk = (x - startX) * 1.5;
    categoryFilter.scrollLeft = scrollLeft - walk;
    updateScrollFade();
});

categoryFilter.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
        e.preventDefault();
    }
    
    categoryFilter.scrollLeft += e.deltaY;
    updateScrollFade();
});

let startTouchX = 0;
let isTouchMove = false;

categoryFilter.addEventListener('touchstart', (e) => {
    startTouchX = e.touches[0].pageX;
    scrollLeft = categoryFilter.scrollLeft;
    isTouchMove = false;
});

categoryFilter.addEventListener('touchmove', (e) => {
    const touchX = e.touches[0].pageX;
    const walk = (touchX - startTouchX) * 1;
    
    if (Math.abs(walk) > 5) {
        isTouchMove = true;
        categoryFilter.scrollLeft = scrollLeft - walk;
        updateScrollFade();
    }
    
    if (isTouchMove) {
        e.preventDefault();
    }
});

categoryFilter.addEventListener('touchend', (e) => {
    if (!isTouchMove) {
        const touch = e.changedTouches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (element && element.classList.contains('filter-btn')) {
            element.click();
        }
    }
    
    isTouchMove = false;
    updateScrollFade();
});

// 卡片数据
const cardsData = [
    { title: "ID查询↗", description: "查询原版所有ID · by 命令助手", categories:["command"], link: "https://ca.projectxero.top/idlist/", newtap:true },
    { title: "艺术字转换", description: "Minecraft艺术字(全角)，游戏内才能正常显示", categories:["command"], link: "./qjzh", newtap:false },
    { title: "T显动画", description: "自动生成“打字机”动画", categories:["command"], link: "./tr", newtap:false },
    { title: "T显编辑器↗", description: "可视化T显编辑器 · by Dislink", categories:["command"], link: "https://dislink.github.io/rawJSONEditor/", newtap:true },    
    { title: "语法转换", description: "execute指令语法升级", categories:["command"], link: "./execute", newtap:false },
    { title: "MCNav↗", description: "MC导航站 | MC工具大全", categories:["friend-links"], link: "https://www.mcnav.net/", newtap:true },
    { title: "命令魔方↗", description: "强大的命令辅助应用", categories:["friend-links"], link: "https://www.viqu.com/pricing.html", newtap:true },
    { title: "命令助手↗", description: "便捷易用的命令辅助输入应用", categories:["friend-links"], link: "https://ca.projectxero.top/", newtap:true },
    { title: "命令集↗", description: "利用无障碍权限实现全自动填写命令", categories:["friend-links"], link: "https://space.bilibili.com/1526784927", newtap:true },
    { title: "蓝天工作室↗", description: "代表作 CRoB命令查询机器人 等", categories:["friend-links"], link: "https://bsc.meteormc.cn/", newtap:true },
    { title: "MT管理器↗", description: "Android 平台文件管理 & 逆向修改神器", categories:["friend-links"], link: "https://mt2.cn/", newtap:true },
    { title: "苦力怕论坛↗", description: "国内最大的基岩版资源分享社区(应该是吧)", categories:["friend-links"], link: "https://klpbbs.com/", newtap:true },
    { title: "网易版导入", description: "限免活动中…站长自营无坑", categories:["resource"], link: "./dr/pro.html", newtap:true },
    { title: "安卓基岩版下载↗", description: "优质的境外下载站", categories:["resource"], link: "https://mcapks.net/", newtap:true },
    { title: "MT管理器-mc语法包", description: "指令语法高亮，压缩包里有具体使用说明", categories:["resource"], link: "./down/mc语法包", newtap:true },
    { title: "幸运转盘", description: "选择困难症？让转盘来决定！", categories:["other"], link: "./spin-the-wheel", newtap:true },
    { title: "nohello", description: "不要问在吗 | 短链接:nohello.top (池鱼提供服务器&域名支持)", categories:["other"], link: "./nohello", newtap:true },
    { title: "Markdown渲染器", description: "在线预览Markdown | 一键导出多种格式", categories:["other"], link: "./md", newtap:true },
    
];

// 动态生成卡片
function generateCards(cards) {
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.category = card.category;
        
        const linkTarget = card.newtap ? 'target="_blank" rel="noopener noreferrer"' : '';
        
        cardElement.innerHTML = `
            <div class="card-content">
                <h3 class="card-title">${card.title}</h3>
                <p class="card-desc">${card.description}</p>
                <a href="${card.link}" class="card-link" ${linkTarget}>
                    立即使用 <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        `;
        
        container.appendChild(cardElement);
    });
}

// 初始化页面
document.addEventListener('DOMContentLoaded', () => {
    // 移除no-js类表示JS已执行
    document.documentElement.classList.remove('no-js');
    
    // 清除静态卡片内容
    const container = document.getElementById('cardsContainer');
    container.innerHTML = '';
    
    // 生成动态卡片
    generateCards(cardsData);
    
    // 获取清除按钮和搜索框引用
    const clearSearchBtn = document.getElementById('clearSearch');
    const searchBox = document.querySelector('.search-box');
    
    const urlParams = new URLSearchParams(window.location.search);
    // 检查是否有search参数
    if (urlParams.has('search')) {
        // 获取参数值并解码
        const searchValue = decodeURIComponent(urlParams.get('search'));
        // 填充到搜索框
        searchBox.value = searchValue;
        
        // 有文字时显示叉号
        if (searchValue) {
            clearSearchBtn.style.display = 'block';
        }
    }
    
    // 叉号功能
    clearSearchBtn.addEventListener('click', () => {
        searchBox.value = '';
        searchBox.focus();
        clearSearchBtn.style.display = 'none';
        
        // 触发input事件更新搜索结果
        const event = new Event('input', { bubbles: true });
        searchBox.dispatchEvent(event);
    });
    
    // 标签分类过滤功能
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const category = button.dataset.category;
            const filteredCards = category === 'all' 
                ? cardsData 
                : cardsData.filter(card => card.categories.includes(category));
            
            generateCards(filteredCards);
        });
    });
    
    // 搜索功能
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        
        clearSearchBtn.style.display = searchTerm ? 'block' : 'none';
        
        const url = new URL(window.location);
        if (searchTerm) {
            url.searchParams.set('search', encodeURIComponent(searchTerm));
        } else {
            // 清空搜索时移除参数
            url.searchParams.delete('search');
        }
        window.history.replaceState({}, '', url);
        
        const filteredCards = cardsData.filter(card => 
            card.title.toLowerCase().includes(searchTerm) || 
            card.description.toLowerCase().includes(searchTerm)
        );
        
        generateCards(filteredCards);
        
        // 重置分类按钮状态
        filterButtons.forEach(btn => {
            if (btn.dataset.category === 'all') {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    });

    searchBox.addEventListener('focus', () => {
        // 保存原始placeholder
        if (!searchBox.dataset.originalPlaceholder) {
            searchBox.dataset.originalPlaceholder = searchBox.placeholder;
        }
        // 清空placeholder
        searchBox.placeholder = '';
    });
    
    searchBox.addEventListener('blur', () => {
        // 恢复原始placeholder
        if (searchBox.dataset.originalPlaceholder) {
            searchBox.placeholder = searchBox.dataset.originalPlaceholder;
        }
    });
    
    // 触发初始搜索
    if (urlParams.has('search')) {
        // 使用setTimeout确保页面渲染完成
        setTimeout(() => {
            const event = new Event('input', { bubbles: true });
            searchBox.dispatchEvent(event);
        }, 100);
    }
    
    // 更新滚动渐变效果
    updateScrollFade();
    window.addEventListener('resize', updateScrollFade);
});