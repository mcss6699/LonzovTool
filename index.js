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

// 鼠标拖动滚动分类栏
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
    const walk = (x - startX) * 2; // 滚动速度
    categoryFilter.scrollLeft = scrollLeft - walk;
    updateScrollFade();
});

// 卡片数据
const cardsData = [
    { title: "ID查询↗", description: "查询原版所有ID · by 命令助手", categories:["command"], link: "https://ca.projectxero.top/idlist/", newtap:true },
    { title: "艺术字转换", description: "Minecraft艺术字(全角)，游戏内才能正常显示", categories:["command"], link: "./qjzh", newtap:false },
    { title: "T显动画", description: "自动生成“打字机”动画", categories:["command"], link: "./tr", newtap:false },
    { title: "T显编辑器↗", description: "可视化T显编辑器 · by Dislink", categories:["command"], link: "https://dislink.github.io/rawJSONEditor/", newtap:true },    
    { title: "语法转换", description: "execute指令语法升级(有点小bug，请自行判断结果)", categories:["command"], link: "./execute", newtap:false },
    { title: "MCNav↗", description: "MC导航站 | MC工具大全", categories:["friend-links"], link: "https://www.mcnav.net/", newtap:true },
    { title: "命令魔方↗", description: "强大的命令辅助应用", categories:["friend-links"], link: "https://www.viqu.com/pricing.html", newtap:true },
    { title: "命令助手↗", description: "便捷易用的命令辅助输入应用", categories:["friend-links"], link: "https://ca.projectxero.top/", newtap:true },
    { title: "苦力怕论坛↗", description: "国内最大的基岩版资源分享社区(应该是吧)", categories:["friend-links"], link: "https://klpbbs.com/", newtap:true },
    { title: "网易版导入", description: "限免活动中…站长自营无坑", categories:["resource"], link: "./dr/pro.html", newtap:true },
    { title: "安卓基岩版下载↗", description: "优质的境外下载站", categories:["resource"], link: "https://mcapks.net/", newtap:true },
    { title: "幸运转盘", description: "选择困难症？让转盘来决定！", categories:["other"], link: "./spin-the-wheel", newtap:true },
    { title: "nohello", description: "不要问在吗 | 短链接:nohello.top (池鱼提供服务器&域名支持)", categories:["other"], link: "./nohello", newtap:true },
    
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
    generateCards(cardsData);
    
    // 分类过滤功能
    const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 更新按钮状态
        filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        // 过滤卡片
        const category = button.dataset.category;
        const filteredCards = category === 'all' 
            ? cardsData 
            : cardsData.filter(card => card.categories.includes(category)); // 使用includes检查标签数组
        
        generateCards(filteredCards);
    });
});
    
    // 搜索功能
    const searchBox = document.querySelector('.search-box');
    searchBox.addEventListener('input', () => {
        const searchTerm = searchBox.value.toLowerCase();
        
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
    updateScrollFade();
    window.addEventListener('resize', updateScrollFade);
});