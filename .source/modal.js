/**
 * 仿 iOS 风格弹窗组件
 *
 * 使用方式：
 *   showModal({
 *     id: 'notice_v1',          // 唯一标识（用于关闭 + 存储）
 *     version: '1.0',           // 版本号（升级后用户会再次看到）
 *     forceShow: false,         // 是否强制显示（无视已关闭记录）
 *     title: '公告',
 *     titleColor: 'default',    // 'default' 或 'white'（white状态下浅色模式为黑色，深色模式为白色）
 *     content: '<p>我是内容</p>',
 *     buttons: [
 *       { text: '确定', action: 'close' },
 *       { text: '跳转', action: 'open_link', url: 'https://example.com', style: 'red' }
 *     ]
 *   });
 *
 * 高级 API：
 *   closeModalById('notice_v1');  // 关闭最上层匹配 id 的弹窗
 */

(function () {
  // 动态注入 CSS 样式（修改为了 ios-modal- 前缀防止类选择器名称冲突）
  const style = document.createElement('style');
  style.textContent = `
    /* 背景遮罩层：半透明黑 + 毛玻璃 */
    .ios-modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 9998;
      opacity: 0;
      transition: opacity 0.3s ease;
      backdrop-filter: blur(2px);
    }

    /* 弹窗容器：居中 + 毛玻璃 + 圆角 */
    .ios-modal-container {
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
      transition: opacity 0.15s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      overflow: hidden;
      font-family: 'Misa', 'PingFang SC', 'HarmonyOS Sans SC', sans-serif;
    }

    /* 深色模式 */
    [data-theme="dark"] .ios-modal-container {
      background: rgba(30, 30, 30, 0.85);
    }

    /* 标题区域 */
    .ios-modal-title {
      padding: 12px 24px 12px;
      text-align: center;
      font-weight: 600;
      font-size: 18px;
      color: #dfefffff;
      position: relative;
    }

    /* 标题装饰 */
    .ios-modal-title::after {
      content: '';
      margin-left: -0.9em;
      pointer-events: none;
    }

    /* 标题动态字间距 */
    .ios-title-spacing-small2 { letter-spacing: 0em; }   /* 5+ 字 */
    .ios-title-spacing-small  { letter-spacing: 0.1em; } /* 4 字 */
    .ios-title-spacing-medium { letter-spacing: 0.7em; } /* 3 字 */
    .ios-title-spacing-large  { letter-spacing: 1em; }   /* 1~2 字 */

    /* 内容区域 */
    .ios-modal-content {
      padding: 0 24px;
      margin-top: -8px;
      font-size: 15px;
      color: #333;
      max-height: 50vh;
      overflow-y: auto;
      line-height: 1.5;
    }

    /* 内容中的段落 */
    .ios-modal-content p {
      margin-top: 0 !important;
      margin-bottom: 8.5px !important;
    }

    [data-theme="dark"] .ios-modal-content {
      color: #EEE;
    }

    /* 底部按钮栏 */
    .ios-modal-footer {
      display: flex;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      margin-top: 10px;
    }

    /* 按钮基础样式 */
    .ios-modal-button {
      flex: 1;
      padding: 9px 10px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: #007AFF;
      background: none;
      border: none;
      cursor: pointer;
      position: relative;
      line-height: 1.2;
    }

    /* 按钮分割线：非最后一个按钮右侧加细线 */
    .ios-modal-button:not(:last-child)::after {
      content: '';
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 1px;
      background: rgba(0, 0, 0, 0.1);
    }

    /* 按钮颜色变体 */
    .ios-button-red  { color: #FF3B30 !important; }
    .ios-button-gray { color: #8E8E93 !important; }
  `;

  // 注入到 <head>，确保样式优先级高
  document.head.appendChild(style);

  // 核心函数：创建并显示弹窗
  /**
   * 显示弹窗
   * @param {Object} config 配置对象
   * @param {string} [config.id=''] 唯一标识（用于关闭 + 版本存储）
   * @param {string} config.version 版本号（用于 localStorage 控制）
   * @param {boolean} [config.forceShow=false] 是否强制显示（忽略已关闭记录）
   * @param {string} [config.title='公告'] 标题
   * @param {'default'|'white'} [config.titleColor='default'] 标题颜色策略
   * @param {string} config.content 弹窗内容（支持 HTML）
   * @param {Array} config.buttons 按钮配置数组
   */

  window.showModal = function (config) {
    // 规范化 id：若未传或 falsy，转为空字符串（兼容旧版本）
    const id = config.id || '';
    const storageKey = `modal_closed_${location.host}_${id}`;

    // ▼ 版本控制逻辑 ▼
    // 仅当有 id 时做版本判断（无 id 的弹窗每次必弹）
    if (id) {
      const storedVersion = localStorage.getItem(storageKey);
      // 若非强制显示，且已存在 ≥ 当前版本的记录 → 不弹出
      if (!config.forceShow && storedVersion && storedVersion >= config.version) {
        return; // 静默退出
      }
    }

    // ▼ 创建 DOM 元素 ▼
    const backdrop = document.createElement('div');
    backdrop.className = 'ios-modal-backdrop';
    backdrop.dataset.modalId = id; // 标记弹窗id，用于精准关闭

    const container = document.createElement('div');
    container.className = 'ios-modal-container';
    container.dataset.modalId = id; // 同上

    // 获取当前主题
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';

    // 创建标题
    const title = document.createElement('div');
    title.className = 'ios-modal-title';
    title.textContent = config.title || '公告';

    // ▼ 动态设置标题字间距（字越少间距越大） ▼
    const titleLength = title.textContent.length;
    if (titleLength <= 2) {
      title.classList.add('ios-title-spacing-large');
    } else if (titleLength === 3) {
      title.classList.add('ios-title-spacing-medium');
    } else if (titleLength === 4) {
      title.classList.add('ios-title-spacing-small');
    } else {
      title.classList.add('ios-title-spacing-small2');
    }

      // 设置标题颜色
      if (config.titleColor === 'white') {
          // white 模式下深色模式白色，浅色模式黑色
          title.style.color = currentTheme === 'dark' ? '#FFFFFF' : '#000000';
      } else {
          // default 行为：始终使用 iOS 蓝（不随主题变化）
          title.style.color = '#007AFF';
      }

    // 创建内容区域
    const content = document.createElement('div');
    content.className = 'ios-modal-content';
    content.innerHTML = config.content;

    // 创建按钮栏
    const footer = document.createElement('div');
    footer.className = 'ios-modal-footer';

    // 遍历按钮配置，生成按钮
    config.buttons.forEach(btn => {
      const button = document.createElement('button');
      // 拼接 class：基础类 + 颜色类（如有）
      const colorClass = btn.style ? `ios-button-${btn.style}` : '';
      button.className = `ios-modal-button ${colorClass}`.trim();
      button.textContent = btn.text;

      // ▼ 绑定点击事件 ▼
      // 使用闭包捕获当前 modal 的 id（即 config.id || ''）
      const modalId = id;
      button.onclick = function () {
        if (btn.action === 'close') {
          // 关闭动作：记录版本 + 关闭当前弹窗
          handleButtonAction(btn.action, btn.url, config.id, config.version, modalId);
        } else {
          // 其他动作：跳转 / 关闭页面（不记录版本）
          executeButtonAction(btn.action, btn.url);
        }
      };

      footer.appendChild(button);
    });

    // 组装 DOM 树
    container.appendChild(title);
    container.appendChild(content);
    container.appendChild(footer);

    // 插入到 body 末尾（确保层级最高）
    document.body.appendChild(backdrop);
    document.body.appendChild(container);

    // ▼ 触发淡入动画 ▼
    // 使用 setTimeout 确保浏览器先渲染 opacity=0，再触发过渡
    setTimeout(() => {
      backdrop.style.opacity = '1';
      container.style.opacity = '1';
    }, 10);
  };

  // 按钮行为处理函数
  /**
   * 处理“关闭”类按钮行为
   * @param {string} action 动作类型（当前只处理 'close'）
   * @param {string} url 可选跳转地址（close 不需要）
   * @param {string} id 弹窗唯一 ID
   * @param {string} version 当前弹窗版本
   * @param {string} modalId 实际创建的 modalId（用于精准关闭）
   */
  function handleButtonAction(action, url, id, version, modalId) {
    // 仅对有 id 的弹窗记录“已关闭”状态
    if (id) {
      const storageKey = `modal_closed_${location.host}_${id}`;
      localStorage.setItem(storageKey, version);
    }

    // 调用精准关闭函数
    closeModalById(modalId);
  }

  /**
   * 执行非关闭类按钮行为
   * @param {string} action 'open_link' | 'go_home'
   * @param {string} url 跳转地址（open_link 时需要）
   */
  function executeButtonAction(action, url) {
    if (action === 'go_home') {
      // 尝试关闭当前窗口（仅当 window.opener 存在或为 window.open 打开时有效）
      try {
        window.close();
        // 若 1 秒后仍未关闭，则跳转空白页模拟退出
        setTimeout(() => {
          if (!window.closed) {
            window.location.href = 'about:blank';
          }
        }, 1000);
      } catch (e) {
        // 安全兜底：直接跳空白页
        window.location.href = 'about:blank';
      }
    } else if (action === 'open_link') {
      // 新窗口打开链接
      window.open(url, '_blank');
    }
  }

  // 多弹窗支持：按 ID 关闭最上层匹配弹窗

  /**
   * 关闭最上层匹配 modalId 的弹窗
   * @param {string} modalId 目标弹窗 ID（空字符串表示无 id 弹窗）
   */
  function closeModalById(modalId) {
    // 1. 查找所有匹配 modalId 的容器（按 DOM 顺序 → 后插入的在后）
    const containers = Array.from(document.querySelectorAll('.ios-modal-container'))
      .filter(el => el.dataset.modalId === (modalId || ''));

    // 无匹配 → 直接返回
    if (containers.length === 0) {
      console.warn(`[modal] No active modal found with id="${modalId}"`);
      return;
    }

    // 2. 取最后一个（即最上层/最新弹出的）
    const container = containers[containers.length - 1];

    // 3. 找到对应的 backdrop（按 DOM 结构：backdrop 紧邻 container 前）
    const backdrop = container.previousElementSibling;
    if (!backdrop || !backdrop.classList.contains('ios-modal-backdrop')) {
      console.error(`[modal] Backdrop not found for container with id="${modalId}"`);
      return;
    }

    // 4. 触发淡出动画
    container.style.opacity = '0';
    backdrop.style.opacity = '0';

    // 5. 动画结束后移除 DOM（避免内存泄漏）
    setTimeout(() => {
      // 安全检查：确保父节点存在再移除
      if (backdrop.parentNode) {
        document.body.removeChild(backdrop);
      }
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    }, 300); // 与 CSS transition 时长一致
  }

  // 暴露高级 API（供外部调用）
  window.closeModalById = closeModalById;
})();