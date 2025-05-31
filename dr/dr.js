// DOM元素
const projectContainer = document.getElementById('project-container');
const searchInput = document.getElementById('search-input');
const searchHint = document.getElementById('search-hint');
const priceBtn = document.getElementById('price-btn');
const detailOverlay = document.getElementById('detail-overlay');
const pricePopup = document.getElementById('price-popup');

// 加载作品数据
async function loadProjects() {
  try {
    const response = await fetch('dr.json');
    if (!response.ok) throw new Error('数据加载失败');
    const data = await response.json();
    console.log('加载到项目数据:', data); // 调试日志
    return data;
  } catch (error) {
    console.error('加载作品数据出错:', error);
    // 返回示例数据作为后备
    return [
      {
        "id": "backup-1",
        "title": "示例项目",
        "description": "这是示例项目",
        "image": "https://img.fastmirror.net/s/2025/05/17/6827ffcf8218b.jpg",
        "price": "S - 小型",
        "tags": ["示例"]
      }
    ];
  }
}

// 渲染作品卡片
function renderProjects(projects) {
  projectContainer.innerHTML = '';
  
  projects.forEach(project => {
    const card = document.createElement('div');
    card.className = 'project-card';
    card.innerHTML = `
      <img class="card-image" src="${project.image}" alt="${project.title}">
      <div class="card-content">
        <h3>${project.title}</h3>
        <p>${project.description}</p>
        <span class="price-tag" data-id="${project.id}">${project.price}</span>
      </div>
    `;
    
    // 添加点击事件
    card.addEventListener('click', () => showProjectDetail(project));
    projectContainer.appendChild(card);
  });
}

// 显示作品详情
function showProjectDetail(project) {
  console.log('显示详情开始');
  const detailImage = detailOverlay.querySelector('.detail-image');
  const detailTitle = detailOverlay.querySelector('.detail-title');
  const detailDesc = detailOverlay.querySelector('.detail-description');
  const priceValue = detailOverlay.querySelector('.price-value');
  
  // 重置状态确保动画可重播
  detailOverlay.classList.remove('active');
  detailOverlay.querySelector('.detail-content').classList.remove('active');
  
  // 设置内容
  detailImage.src = project.image;
  detailImage.alt = project.title;
  detailTitle.textContent = project.title;
  detailDesc.textContent = project.description;
  priceValue.textContent = project.price;
  detailOverlay.querySelector('.price-label').textContent = '建筑规模: ';
  
  // 立即显示并触发动画
  detailOverlay.style.display = 'flex';
  detailOverlay.querySelector('.detail-content').style.display = 'block';
  
  // 强制同步布局和重绘
  requestAnimationFrame(() => {
    detailOverlay.classList.add('active');
    detailOverlay.querySelector('.detail-content').classList.add('active');
    console.log('动画已触发');
  });
}

// 搜索过滤功能
async function setupSearch(projects) {
  // 搜索图标点击事件
  document.querySelector('.search-icon').addEventListener('click', async () => {
    await performSearch(projects);
  });

  // 回车键搜索
  searchInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      if (searchInput.value.trim() === '') {
        // 空搜索时重置状态
        const projects = await loadProjects();
        renderProjects(projects);
        searchHint.textContent = '按回车搜索...';
      } else {
        await performSearch(projects);
      }
    }
  });

  // 执行搜索
  async function performSearch(projects) {
    const searchTerm = searchInput.value.trim().toLowerCase();
    
    if (!searchTerm) {
      searchHint.textContent = '请输入搜索关键词';
      return;
    }

    const filtered = projects.filter(project => 
      project.title.toLowerCase().includes(searchTerm) || 
      project.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    
    renderProjects(filtered);
    
    if (filtered.length === 0) {
      // 显示浏览器通知
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('什么都没搜到捏…换个关键词试试吧~');
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification('什么都没搜到捏…换个关键词试试吧~');
            }
          });
        }
      }
      
      // 重置搜索状态
      searchInput.value = '';
      const projects = await loadProjects();
      renderProjects(projects);
      searchHint.textContent = '按回车搜索...';
    } else {
      searchHint.textContent = '';
    }
  }
}

// 初始化详情页和弹窗事件
function initModalEvents() {
  // 价格按钮点击事件
  priceBtn.addEventListener('click', () => {
    const popup = pricePopup;
    const content = popup.querySelector('.popup-content');
    
    // 重置状态
    popup.style.display = 'flex';
    content.style.display = 'block';
    popup.classList.remove('active');
    content.style.opacity = '0';
    content.style.transform = 'translateY(-50%) scale(0.95)';
    
    // 强制重绘后触发动画
    requestAnimationFrame(() => {
      popup.classList.add('active');
      content.style.opacity = '1';
      content.style.transform = 'translateY(-50%) scale(1)';
    });
  });

  // 关闭详情页
  detailOverlay.querySelector('.close-btn').addEventListener('click', () => {
    detailOverlay.classList.remove('active');
    setTimeout(() => {
      detailOverlay.style.display = 'none';
    }, 400);
  });
  
  // 点击遮罩层关闭
  detailOverlay.addEventListener('click', (e) => {
    if (e.target === detailOverlay) {
      detailOverlay.classList.remove('active');
      setTimeout(() => {
        detailOverlay.style.display = 'none';
      }, 400);
    }
  });
  
  /*
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('price-tag')) {
      pricePopup.classList.add('active');
      pricePopup.style.display = 'block';
    }
  });
  */
  
  // 我知道了按钮点击事件
  document.querySelector('.confirm-btn').addEventListener('click', () => {
    pricePopup.classList.remove('active');
    setTimeout(() => {
      pricePopup.style.display = 'none';
    }, 400);
  });

  // 搜索框事件
  searchInput.addEventListener('focus', () => {
    searchHint.textContent = '按回车搜索...';
  });

  searchInput.addEventListener('blur', () => {
    if (!searchInput.value) {
      searchHint.textContent = '';
    }
  });

  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      searchHint.textContent = '';
    }
  });
}

// 价格列表函数
function renderPriceList(projects) {
}

// 初始化应用
async function initApp() {
  console.log('应用初始化开始');
  
  // 请求通知权限
  if (typeof Notification !== 'undefined') {
    Notification.requestPermission().catch(console.error);
  }

  try {
    const projects = await loadProjects();
    console.log('项目数据:', projects);
    
    renderProjects(projects);
    setupSearch(projects);
    initModalEvents();
    
    // 调试事件监听
    console.log('事件监听状态:');
    console.log('搜索按钮:', document.querySelector('.search-icon').onclick);
    console.log('价格按钮:', document.getElementById('price-btn').onclick);
    
  } catch (error) {
    console.error('初始化失败:', error);
  }
}

// 确保DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM已加载');
  initApp();
});

// 启动应用
document.addEventListener('DOMContentLoaded', initApp);