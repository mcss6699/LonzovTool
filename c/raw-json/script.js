// --- 核心数据模型 ---
let rawTextArray = [];
let selectedNodePath = null;
let previewSettings = {};
let undoStack = [];
let redoStack = [];
// --- DOM 元素引用 ---
const $ = document;
const $rawTextTree = $.getElementById('rawTextTree');
const $emptyState = $.getElementById('emptyState');
const $addComponentBtn = $.getElementById('addComponentBtn');
const $previewOutput = $.getElementById('previewOutput');
const $addModal = $.getElementById('addModal');
const $addModalBody = $.getElementById('addModalBody');
const $addSubComponentModal = $.getElementById('addSubComponentModal');
const $addSubModalBody = $.getElementById('addSubModalBody');
const $importModal = $.getElementById('importModal');
const $exportModal = $.getElementById('exportModal');
const $scoreSettingsModal = $.getElementById('scoreSettingsModal');
const $scoreSettingsModalContainer = $.getElementById('scoreSettingsModalContainer');
const $clearAllModal = $.getElementById('clearAllModal');
const $importTextarea = $.getElementById('importTextarea');
const $exportTextarea = $.getElementById('exportTextarea');
const $confirmImportBtn = $.getElementById('confirmImportBtn');
const $copyExportBtn = $.getElementById('copyExportBtn');
const $downloadExportBtn = $.getElementById('downloadExportBtn');
const $confirmClearBtn = $.getElementById('confirmClearBtn');
const $cancelClearBtn = $.getElementById('cancelClearBtn');
const $themeToggleBtn = $.getElementById('themeToggleBtn');
const $previewPanel = $.getElementById('previewPanel');
const $undoBtn = $.getElementById('undoBtn');
const $redoBtn = $.getElementById('redoBtn');
const $openScoreSettingsBtn = $.getElementById('openScoreSettingsBtn');
const $clearAllBtn = $.getElementById('clearAllBtn');
const $homeBtn = $.getElementById('homeBtn');
// --- § 代码映射表 ---
const formattingCodes = {
    '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
    '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
    '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
    'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
    'g': '#DDD605', 'h': '#E3D4D1', 'i': '#CECACA', 'j': '#443A3B',
    'm': '#971607', 'n': '#B4684D', 'p': '#DEB12D', 'q': '#47A036',
    's': '#2CBAA8', 't': '#21497B', 'u': '#9A5CC6'
};
// --- 用于修复输入框编辑问题 ---
let currentlyEditingInput = null;
let editingPath = null;
let editingKey = null;
// --- 用于记录 details 展开状态 ---
let expandedDetailsPaths = new Set();
// --- 初始化 ---
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage();
    renderTree();
    updatePreview();
    attachEventListeners();
});
function attachEventListeners() {
    // 首页按钮
    $homeBtn.addEventListener('click', () => {
        window.location.href = '/'; // 返回根目录
    });
    // 主界面添加组件按钮
    $addComponentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        $addModal.style.display = 'block';
        delete $addModal.dataset.nestedPath; // 确保清除临时路径，添加到根
    });
    // 获取模态框body元素
    const $addModalBody = $.getElementById('addModalBody');
    const $addSubModalBody = $.getElementById('addSubModalBody');
    if (!$addModalBody || !$addSubModalBody) {
        console.error("无法找到模态框 body 元素");
        return;
    }
    // 主界面添加组件模态框事件
    attachModalEventListeners($addModal, $addModalBody, false); // 不需要嵌套路径，不需要删除翻译选项
    attachModalCloseEvent($addModal); // 修复：添加关闭事件
    // 子组件添加模态框事件
    attachModalEventListeners($addSubComponentModal, $addSubModalBody, true); // 需要嵌套路径，需要删除翻译选项
    attachModalCloseEvent($addSubComponentModal); // 修复：添加关闭事件
    // 为其他模态框添加关闭事件
    attachModalCloseEvent($importModal);
    attachModalCloseEvent($exportModal);
    attachModalCloseEvent($scoreSettingsModal);
    attachModalCloseEvent($clearAllModal);
    // 导入按钮
    $.getElementById('importBtn').addEventListener('click', () => {
        $importTextarea.value = '';
        $importModal.style.display = 'block';
    });
    // 确认导入
    $confirmImportBtn.addEventListener('click', () => {
        importRawText($importTextarea.value);
        $importModal.style.display = 'none';
    });
    // --- 修复 1: 导出时紧凑显示 & 全局替换双反斜杠 ---
    // 导出按钮
    $.getElementById('exportBtn').addEventListener('click', () => {
        // 创建一个深拷贝用于导出处理
        const exportData = JSON.parse(JSON.stringify(rawTextArray));
        // 递归处理文本值，将实际换行符替换为字面量 
        function processTextForExport(obj) {
            if (obj !== null && typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    obj.forEach(item => processTextForExport(item));
                } else {
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if (typeof obj[key] === 'string') {
                                // 将实际换行符替换为字面量 \n
                                obj[key] = obj[key].replace(/\n/g, '\\n');
                            } else if (obj[key] !== null && typeof obj[key] === 'object') {
                                processTextForExport(obj[key]);
                            }
                        }
                    }
                }
            }
        }
        processTextForExport(exportData);
        // 紧凑导出，不带格式化和换行
        const exportString = JSON.stringify(exportData);
        // --- 最后步骤：执行一次全局替换，将所有双反斜杠替换为单反斜杠 ---
        const finalExportString = exportString.replace(/\\\\/g, '\\');
        // --- end 最后步骤 ---
        $exportTextarea.value = finalExportString;
        $exportModal.style.display = 'block';
    });
    // --- end 修复 1 ---
    // 复制导出内容
    $copyExportBtn.addEventListener('click', () => {
        $exportTextarea.select();
        document.execCommand('copy');
        alert('已复制到剪贴板！');
    });
    // 下载导出文件
    $downloadExportBtn.addEventListener('click', () => {
        const content = $exportTextarea.value;
        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'rawtext.json';
        a.click();
        URL.revokeObjectURL(url);
    });
    // 删除全部按钮
    $clearAllBtn.addEventListener('click', () => {
        $clearAllModal.style.display = 'block';
    });
    // 确认删除全部
    $confirmClearBtn.addEventListener('click', () => {
        clearAllComponents();
        $clearAllModal.style.display = 'none';
    });
    // 取消删除全部
    $cancelClearBtn.addEventListener('click', () => {
        $clearAllModal.style.display = 'none';
    });
    // 主题切换
    $themeToggleBtn.addEventListener('click', toggleTheme);
    // 分数预览设置模态框
    $openScoreSettingsBtn.addEventListener('click', () => {
        updateScoreSettingsModalUI();
        $scoreSettingsModal.style.display = 'block';
    });
    // 撤销/恢复按钮
    $undoBtn.addEventListener('click', undo);
    $redoBtn.addEventListener('click', redo);
    // 绑定事件委托 (注意：不再直接处理 input 事件来更新数据)
    // document.addEventListener('input', handleInputChange); // 移除此行
    document.addEventListener('focusout', handleInputBlur); // 新增：处理失焦事件
    document.addEventListener('click', handleDeleteButtonClick);
    document.addEventListener('click', handleNodeSelection);
}
// --- 为模态框添加关闭事件 ---
function attachModalCloseEvent(modal) {
    modal.querySelector('.close').addEventListener('click', (e) => {
        e.stopPropagation();
        modal.style.display = 'none';
        // 清除嵌套路径 (如果适用)
        if (modal.id === 'addSubComponentModal' || modal.id === 'addModal') {
             delete modal.dataset.nestedPath;
        }
    });
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            modal.style.display = 'none';
            // 清除嵌套路径 (如果适用)
            if (modal.id === 'addSubComponentModal' || modal.id === 'addModal') {
                 delete modal.dataset.nestedPath;
            }
        }
    });
}
// --- 模态框事件监听器通用函数 (仅处理按钮点击) ---
function attachModalEventListeners(modal, modalBody, isNestedModal = false) {
    if (!modalBody) {
        console.error("attachModalEventListeners: modalBody 为 null 或未定义");
        return;
    }
    // 添加组件类型选择按钮 (事件委托)
    modalBody.addEventListener('click', (e) => {
        const button = e.target.closest('.component-type-btn');
        if (button) {
            e.stopPropagation(); // 阻止事件冒泡
            const type = button.dataset.type;
            if (isNestedModal) {
                const pathStr = modal.dataset.nestedPath;
                if (pathStr) {
                    const path = JSON.parse(pathStr);
                    addComponent(type, path);
                    delete modal.dataset.nestedPath; // 清除临时路径
                }
            } else {
                addComponent(type);
            }
            modal.style.display = 'none';
        }
    });
    // 移除翻译按钮 (如果需要)
    if (isNestedModal) {
        const translateBtn = modalBody.querySelector('.component-type-btn[data-type="translate"]');
        if (translateBtn) {
            translateBtn.remove();
        }
    }
}
// --- 核心功能函数 ---
function addComponent(type, path = null) {
    saveStateToUndoStack();
    const newComponent = createDefaultComponent(type);
    if (path) {
        // 插入到指定路径 (用于嵌套)
        const targetArray = getNestedObject(rawTextArray, path);
        if (Array.isArray(targetArray)) {
            targetArray.push(newComponent);
        } else {
            console.error("addComponent: 尝试向非数组对象添加组件", path, targetArray);
            return;
        }
    } else {
        rawTextArray.push(newComponent);
    }
    renderTree();
    updatePreview();
    saveStateToLocalStorage();
}
function removeComponent(path) {
    saveStateToUndoStack();
    const parentArray = getNestedObject(rawTextArray, path.slice(0, -1));
    if (Array.isArray(parentArray)) {
        parentArray.splice(path[path.length - 1], 1);
    } else {
        console.error("removeComponent: 尝试从非数组对象删除组件", path, parentArray);
        return;
    }
    if (JSON.stringify(path) === JSON.stringify(selectedNodePath)) {
        selectedNodePath = null;
    }
    renderTree();
    updatePreview();
    saveStateToLocalStorage();
}
function clearAllComponents() {
    saveStateToUndoStack(); // 将当前状态存入撤销栈
    rawTextArray = [];
    selectedNodePath = null;
    renderTree();
    updatePreview();
    saveStateToLocalStorage();
}
// --- 新增/修改：处理组件值的更新 ---
// 这个函数现在只负责更新内存中的数据和预览，不再直接刷新整个树
function updateComponentValue(path, key, value) {
    saveStateToUndoStack(); // 仍然需要保存撤销状态
    const component = getNestedObject(rawTextArray, path);
    if (key.includes('.')) {
        const keys = key.split('.');
        let obj = component;
        for (let i = 0; i < keys.length - 1; i++) {
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
    } else {
        component[key] = value;
    }
    updatePreview(); // 仅更新预览
    saveStateToLocalStorage(); // 保存到本地存储
    // 注意：不调用 renderTree()
}
// --- 新增：处理输入框失焦事件 ---
function handleInputBlur(e) {
    // --- 修复 1: 失焦时更新数据 ---
    if (currentlyEditingInput && editingPath && editingKey) {
        const newValue = currentlyEditingInput.value;
        updateComponentValue(editingPath, editingKey, newValue); // 更新数据和预览
        // 可选：如果需要在失焦后局部更新UI（例如其他依赖此值的地方），可以在这里调用一个小的更新函数
        // 但现在我们只更新数据和预览，不刷新整个树
    }
    // 重置编辑状态
    currentlyEditingInput = null;
    editingPath = null;
    editingKey = null;
    // --- end 修复 1 ---
}
function moveComponent(fromPath, toPath) {
    saveStateToUndoStack();
    const item = getNestedObject(rawTextArray, fromPath);
    const fromParentArray = getNestedObject(rawTextArray, fromPath.slice(0, -1)); // 获取源父级数组
    const fromIndex = fromPath[fromPath.length - 1]; // 获取源元素索引
    const toParentArray = getNestedObject(rawTextArray, toPath.slice(0, -1)); // 获取目标父级数组
    const toIndex = toPath[toPath.length - 1]; // 获取目标插入索引
    if (Array.isArray(fromParentArray) && Array.isArray(toParentArray)) {
        fromParentArray.splice(fromIndex, 1); // 从源数组移除
        toParentArray.splice(toIndex, 0, item); // 插入到目标数组
    } else {
        console.error("moveComponent: 源或目标父级不是数组", fromParentArray, toParentArray);
        return;
    }
    // 更新选中路径（如果移动的是当前选中项）
    if (JSON.stringify(fromPath) === JSON.stringify(selectedNodePath)) {
        selectedNodePath = [...toPath];
    }
    // --- 动效：移动组件 (渐隐 -> 换位置 -> 渐显) ---
    const fromElement = document.querySelector(`.node:nth-child(${fromIndex + 1})`);
    if (fromElement) {
        // 计算目标位置
        const targetElement = document.querySelector(`.node:nth-child(${toIndex + (fromIndex < toIndex ? 2 : 1)})`); // 考虑插入后索引偏移
        if (targetElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            // 应用初始偏移
            fromElement.style.position = 'relative';
            fromElement.style.zIndex = '1000'; // 确保在最上层
            fromElement.style.pointerEvents = 'none'; // 防止动画期间交互
            fromElement.style.transform = `translateY(${targetRect.top - fromRect.top}px)`;
            // 强制重排
            fromElement.offsetHeight;
            // 添加过渡
            fromElement.style.transition = 'transform 0.2s ease-in-out';
            // 移除偏移，触发动画
            fromElement.style.transform = 'translateY(0)';
            fromElement.style.position = '';
            fromElement.style.zIndex = '';
            fromElement.style.pointerEvents = '';
            // 动画结束后更新DOM
            setTimeout(() => {
                fromElement.style.transition = '';
                renderTree(); // 更新DOM结构
            }, 200); // 与过渡时间匹配
            return; // 不立即渲染
        }
    }
    // 如果找不到元素，则直接渲染
    renderTree();
    // --- end 动效 ---
    updatePreview();
    saveStateToLocalStorage();
}
function createDefaultComponent(type) {
    switch (type) {
        case 'text':
            return { text: "新文本" }; // 默认值改回 "新文本"
        case 'translate':
            return { translate: "translation.key", with: { rawtext: [] } };
        case 'selector':
            return { selector: "@s" };
        case 'score':
            return { score: { name: "@s", objective: "objective" } };
        default:
            return { text: "" };
    }
}
function getNestedObject(obj, path) {
    return path.reduce((current, key) => current[key], obj);
}
function setNestedObject(obj, path, value) {
    const lastKey = path.pop();
    const parent = getNestedObject(obj, path);
    parent[lastKey] = value;
}
// --- 渲染函数 ---
function renderTree(parentArray = rawTextArray, basePath = [], parentElement = $rawTextTree) {
    // --- 修复 2: 记录当前展开的 details 状态 ---
    const currentlyExpandedPaths = new Set();
    parentElement.querySelectorAll('details[open]').forEach(detail => {
        const input = detail.closest('.node').querySelector('input[data-path]');
        if (input) {
            const path = input.dataset.path;
            if (path) {
                currentlyExpandedPaths.add(path);
            }
        }
    });
    // --- end 记录 ---
    parentElement.innerHTML = '';
    if (parentArray.length === 0) {
        $emptyState.style.display = 'flex';
        return;
    }
    $emptyState.style.display = 'none'; // 修复：有组件时隐藏空状态
    parentArray.forEach((component, index) => {
        const currentPath = [...basePath, index];
        const nodeElement = document.createElement('div');
        nodeElement.className = 'node';
        if (JSON.stringify(currentPath) === JSON.stringify(selectedNodePath)) {
            nodeElement.classList.add('selected');
        }
        const type = Object.keys(component)[0];
        nodeElement.innerHTML = `
            <div class="node-header">
                <span class="node-type">${type.toUpperCase()}</span>
                <div class="node-actions">
                    <button class="icon-btn move-up" title="上移"><i class="fas fa-arrow-up"></i></button>
                    <button class="icon-btn move-down" title="下移"><i class="fas fa-arrow-down"></i></button>
                    <button class="icon-btn delete-btn" title="删除"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="node-content">
                ${renderComponentContent(component, currentPath)}
            </div>
        `;
        // --- 动效：添加组件 ---
        if (basePath.length === 0 && index === parentArray.length - 1 && parentArray.length > 0) {
            nodeElement.classList.add('adding');
            setTimeout(() => {
                nodeElement.classList.remove('adding');
            }, 300); // 动画持续时间
        }
        // --- end 动效 ---
        // 绑定移动按钮
        const moveUpBtn = nodeElement.querySelector('.move-up');
        const moveDownBtn = nodeElement.querySelector('.move-down');
        if (index > 0) {
            moveUpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                moveComponent(currentPath, [...basePath, index - 1]);
            });
        } else {
            moveUpBtn.disabled = true;
            moveUpBtn.style.visibility = 'hidden';
        }
        if (index < parentArray.length - 1) {
            moveDownBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                moveComponent(currentPath, [...basePath, index + 1]);
            });
        } else {
            moveDownBtn.disabled = true;
            moveDownBtn.style.visibility = 'hidden';
        }
        parentElement.appendChild(nodeElement);
        // 如果是 translate 组件，渲染其嵌套的 rawtext
        if (type === 'translate' && component.with && component.with.rawtext) {
            const nestedContainer = document.createElement('div');
            nestedContainer.className = 'nested-tree';
            nodeElement.appendChild(nestedContainer);
            // 创建一个可折叠的 details 元素
            const details = document.createElement('details');
            // --- 修复 2: 恢复展开状态 ---
            if (currentlyExpandedPaths.has(JSON.stringify([...currentPath, 'with', 'rawtext']))) {
                details.setAttribute('open', '');
            }
            // --- end 恢复 ---
            details.innerHTML = `<summary>With (rawtext)</summary>`;
            nestedContainer.appendChild(details);
            const nestedContentDiv = document.createElement('div');
            nestedContentDiv.className = 'nested-editor-container';
            details.appendChild(nestedContentDiv);
            // 渲染嵌套的 rawtext 树
            renderTree(component.with.rawtext, [...currentPath, 'with', 'rawtext'], nestedContentDiv);
            // 添加嵌套编辑器的“添加子组件”按钮
            const addNestedBtn = document.createElement('button');
            addNestedBtn.className = 'btn-secondary nested-editor-add-btn';
            addNestedBtn.innerHTML = '<i class="fas fa-plus"></i> 添加子组件';
            addNestedBtn.onclick = (e) => {
                e.stopPropagation(); // 阻止事件冒泡到 details
                $addSubComponentModal.style.display = 'block';
                // 临时存储路径，供模态框确认按钮使用
                $addSubComponentModal.dataset.nestedPath = JSON.stringify([...currentPath, 'with', 'rawtext']);
            };
            nestedContentDiv.appendChild(addNestedBtn);
            // 如果嵌套数组为空，显示空状态
            if (component.with.rawtext.length === 0) {
                const emptyStateDiv = document.createElement('div');
                emptyStateDiv.className = 'empty-nested-state';
                emptyStateDiv.innerHTML = '<p>此区域内暂无组件</p>';
                nestedContentDiv.appendChild(emptyStateDiv);
            }
        }
    });
    // --- 修复 1: 渲染后恢复编辑状态 ---
    if (editingPath && editingKey) {
        const inputElement = document.querySelector(`input[data-path="${JSON.stringify(editingPath)}"][data-key="${editingKey}"]`);
        if (inputElement) {
            // 从 rawTextArray 获取最新值
            const component = getNestedObject(rawTextArray, editingPath);
            const keyParts = editingKey.split('.');
            let valueToUse = component;
            for (const part of keyParts) {
                valueToUse = valueToUse[part];
            }
            inputElement.value = valueToUse; // 使用 rawTextArray 中的值更新 DOM
            inputElement.focus();
            // 尝试恢复光标位置 (可能不完全精确，但比没有好)
            if (currentlyEditingInput) {
                 inputElement.setSelectionRange(currentlyEditingInput.selectionStart, currentlyEditingInput.selectionEnd);
            }
            currentlyEditingInput = inputElement; // 更新引用
        } else {
            // 如果渲染后找不到对应输入框，重置编辑状态
            currentlyEditingInput = null;
            editingPath = null;
            editingKey = null;
        }
    }
    // --- end 恢复 ---
}
function renderComponentContent(component, path) {
    if (!Array.isArray(path)) {
        console.error("renderComponentContent: path 参数不是数组", path, component);
        return `<p style="color: red;">渲染错误：路径无效</p>`;
    }
    const type = Object.keys(component)[0];
    let contentHtml = '';
    switch (type) {
        case 'text':
            const safePathStr = escapeHtml(JSON.stringify(path));
            // --- 修复 1: 使用 textarea 替代 input ---
            contentHtml = `<textarea rows="3" data-path="${safePathStr}" data-key="text" placeholder="文本内容">${escapeHtml(component.text)}</textarea>`;
            // --- end 修复 1 ---
            break;
        case 'translate':
            const safeTranslatePathStr = escapeHtml(JSON.stringify(path));
            contentHtml = `
                <input type="text" value="${escapeHtml(component.translate)}" data-path="${safeTranslatePathStr}" data-key="translate" placeholder="语言文件键">
                <details>
                    <summary>With (rawtext)</summary>
                    <div class="nested-input">
                        <!-- 嵌套的 rawtext 树会在此处渲染 -->
                    </div>
                </details>
            `;
            break;
        case 'selector':
            const safeSelectorPathStr = escapeHtml(JSON.stringify(path));
            contentHtml = `<input type="text" value="${escapeHtml(component.selector)}" data-path="${safeSelectorPathStr}" data-key="selector">`;
            break;
        case 'score':
            const safeScorePathStr = escapeHtml(JSON.stringify(path));
            contentHtml = `
                <input type="text" value="${escapeHtml(component.score.name)}" data-path="${safeScorePathStr}" data-key="score.name" placeholder="选择器">
                <input type="text" value="${escapeHtml(component.score.objective)}" data-path="${safeScorePathStr}" data-key="score.objective" placeholder="计分板名称">
            `;
            break;
    }
    return contentHtml;
}
function updatePreview() {
    let fullText = '';
    rawTextArray.forEach(component => {
        if (component.text !== undefined) {
            fullText += component.text;
        } else if (component.selector !== undefined) {
            fullText += '[玩家/实体]';
        } else if (component.score !== undefined) {
            const name = component.score.name;
            const objective = component.score.objective;
            const key = `${name}:${objective}`;
            fullText += previewSettings[key] || 0;
        } else if (component.translate !== undefined) {
            fullText += '[translate组件，预览功能暂未实现]';
        }
    });
    // --- 修复 2: 预览时处理换行 ---
    $previewOutput.innerHTML = parseFormattingCodes(fullText);
    // --- end 修复 2 ---
}
// --- 修复 2: 修改 parseFormattingCodes 处理 \n 和 \\n ---
function parseFormattingCodes(text) {
    // 1. 首先处理实际的换行符 (来自用户按 Enter)
    let processedText = text.replace(/\n/g, '<br>');
    // 2. 然后处理字面量 \n (用户输入的 \n)
    processedText = processedText.replace(/\\n/g, '<br>');
    // 3. 最后处理字面量 \\n (用户输入的 \\n)
    processedText = processedText.replace(/\\\\n/g, '\\n'); // 显示为字面量 \n

    // --- end 修复 2 ---
    const parts = processedText.split(/(§.)/g);
    let inFormattingSpan = false;
    let currentStyleTags = []; // 存储当前生效的样式标签
    let resultHtml = '';
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('§') && part.length === 2) {
            const code = part[1];
            const style = formattingCodes[code];
            // 如果当前在格式化状态，且当前代码不是格式化代码或需要关闭span，则先关闭span
            if (inFormattingSpan) {
                // 遇到重置代码时，需要关闭span
                if (code === 'r') {
                    resultHtml += '</span>';
                    inFormattingSpan = false;
                    currentStyleTags = []; // 清空样式
                } else if (style) {
                    // 遇到有效的格式化代码，先关闭当前span，然后处理新代码
                    resultHtml += '</span>';
                    inFormattingSpan = false;
                }
                // 'k' (随机字符) 代码不关闭当前span，因为它本身会渲染内容
            }
            if (style) {
                switch (code) {
                    case 'l':
                        currentStyleTags.push('font-weight: bold; font-family: inherit;');
                        break;
                    case 'o':
                        currentStyleTags.push('font-style: italic; font-family: inherit;');
                        break;
                    case 'r':
                        // 重置，清空所有样式 - 已在上面处理
                        break;
                    default:
                        // 颜色代码，清空之前的样式，只保留这个颜色
                        currentStyleTags = [`color: ${style}; font-family: inherit;`];
                        break;
                }
                // 重新开启span
                const currentStyle = currentStyleTags.join(' ');
                if (currentStyle) {
                    resultHtml += `<span style="${currentStyle}">`;
                    inFormattingSpan = true;
                }
            } else {
                // 未知代码
                switch (code) {
                    case 'k':
                        // 渲染随机字符，不改变当前样式状态，但需要在当前span内渲染
                        if (inFormattingSpan) {
                            resultHtml += '(随机字符)'; // 已在span内
                        } else {
                            resultHtml += '<span>(随机字符)</span>'; // 需要新开一个span
                        }
                        break;
                    case 'r':
                        // 重置代码已经在上面处理过了 (关闭了span)
                        break;
                    default:
                        // 未知代码，忽略，不改变当前渲染状态，也不输出任何内容
                        // 例如 '§v' 不会影响 '123456' 的样式
                        continue; // 跳过本次循环，不执行后续的添加内容逻辑
                }
            }
        } else {
            // 非格式化代码部分，直接添加 (已经预处理过了)
            resultHtml += part;
        }
    }
    if (inFormattingSpan) {
        resultHtml += '</span>'; // 确保最后一个span被闭合
    }
    return resultHtml;
}
// --- end 修复 2 ---
function updateScoreSettingsModalUI() {
    $scoreSettingsModalContainer.innerHTML = '';
    const scoreComponents = findScoreComponents(rawTextArray);
    const uniqueKeys = [...new Set(scoreComponents.map(c => `${c.score.name}:${c.score.objective}`))];
    if (uniqueKeys.length === 0) {
        $scoreSettingsModalContainer.innerHTML = '<p style="text-align: center; color: var(--text-secondary); font-style: italic;">当前没有需要设置的分数组件</p>';
        return;
    }
    uniqueKeys.forEach(key => {
        const [name, objective] = key.split(':');
        const settingItem = document.createElement('div');
        settingItem.className = 'score-setting-item-modal';
        settingItem.innerHTML = `
            <label for="score-${key}">${name} -> ${objective}:</label>
            <input type="number" id="score-${key}" value="${previewSettings[key] || 0}" data-key="${key}" placeholder="预览值">
        `;
        $scoreSettingsModalContainer.appendChild(settingItem);
    });
    // 为模态框内的输入框绑定事件
    $scoreSettingsModalContainer.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', (e) => {
            const key = e.target.dataset.key;
            const value = e.target.value;
            previewSettings[key] = value;
            updatePreview();
            saveStateToLocalStorage();
        });
    });
}
function findScoreComponents(array, results = []) {
    array.forEach(item => {
        if (item.score) {
            results.push(item);
        }
        if (item.with && item.with.rawtext) {
            findScoreComponents(item.with.rawtext, results);
        }
    });
    return results;
}
function selectNode(path) {
    selectedNodePath = path;
    renderTree();
}
// --- 状态管理 ---
function saveStateToUndoStack() {
    undoStack.push(JSON.stringify(rawTextArray));
    redoStack = []; // 清空重做栈
    if (undoStack.length > 50) {
        undoStack.shift();
    }
}
function undo() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(rawTextArray));
    const prevState = undoStack.pop();
    rawTextArray = JSON.parse(prevState);
    renderTree();
    updatePreview();
    updateScoreSettingsModalUI(); // 更新分数设置UI
    saveStateToLocalStorage();
}
function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(rawTextArray));
    const nextState = redoStack.pop();
    rawTextArray = JSON.parse(nextState);
    renderTree();
    updatePreview();
    updateScoreSettingsModalUI(); // 更新分数设置UI
    saveStateToLocalStorage();
}
function saveStateToLocalStorage() {
    try {
        localStorage.setItem('rawTextArray', JSON.stringify(rawTextArray));
        localStorage.setItem('previewSettings', JSON.stringify(previewSettings));
        localStorage.setItem('undoStack', JSON.stringify(undoStack));
        localStorage.setItem('redoStack', JSON.stringify(redoStack));
        // --- 修复 2: 保存 details 展开状态 ---
        localStorage.setItem('expandedDetailsPaths', JSON.stringify([...expandedDetailsPaths]));
        // --- end 保存 ---
    } catch (e) {
        console.error("保存到 localStorage 失败:", e);
    }
}
function loadStateFromLocalStorage() {
    try {
        const savedRawText = localStorage.getItem('rawTextArray');
        const savedPreviewSettings = localStorage.getItem('previewSettings');
        const savedUndoStack = localStorage.getItem('undoStack');
        const savedRedoStack = localStorage.getItem('redoStack');
        // --- 修复 2: 加载 details 展开状态 ---
        const savedExpandedDetails = localStorage.getItem('expandedDetailsPaths');
        // --- end 加载 ---
        if (savedRawText) rawTextArray = JSON.parse(savedRawText);
        if (savedPreviewSettings) previewSettings = JSON.parse(savedPreviewSettings);
        if (savedUndoStack) undoStack = JSON.parse(savedUndoStack);
        if (savedRedoStack) redoStack = JSON.parse(savedRedoStack);
        // --- 修复 2: 设置展开状态 ---
        if (savedExpandedDetails) {
            try {
                expandedDetailsPaths = new Set(JSON.parse(savedExpandedDetails));
            } catch (e) {
                console.error("加载展开状态失败:", e);
                expandedDetailsPaths = new Set(); // 重置为默认空集
            }
        }
        // --- end 设置 ---
    } catch (e) {
        console.error("从 localStorage 加载失败:", e);
        rawTextArray = [];
        previewSettings = {};
        undoStack = [];
        redoStack = [];
        expandedDetailsPaths = new Set(); // 重置为默认空集
    }
}
// --- 导入导出 ---
function importRawText(input) {
    try {
        // --- 修复 2: 在解析前进行 JSON 规范化处理 ---
        // 去除首尾空白字符，防止解析失败
        const trimmedInput = input.trim();
        let parsed;
        try {
            parsed = JSON.parse(trimmedInput);
        } catch {
            const match = trimmedInput.match(/\/tellraw\s+\S+\s+(.*)/);
            if (match) {
                parsed = JSON.parse(match[1].trim()); // 对匹配到的部分也进行 trim
            } else {
                throw new Error("无法解析输入内容");
            }
        }
        // --- end 规范化 ---
        if (!Array.isArray(parsed)) throw new Error("导入的数据必须是一个数组");
        saveStateToUndoStack();
        rawTextArray = parsed;
        renderTree();
        updatePreview();
        updateScoreSettingsModalUI(); // 更新分数设置UI
        saveStateToLocalStorage();
    } catch (error) {
        alert(`导入失败: ${error.message}`);
    }
}
// --- 工具函数 ---
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "<")
        .replace(/>/g, ">")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    const icon = $themeToggleBtn.querySelector('i');
    icon.classList.toggle('fa-moon', newTheme === 'dark');
    icon.classList.toggle('fa-sun', newTheme === 'light');
}
// --- 键盘快捷键 ---
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'z':
                if (e.shiftKey) {
                    redo();
                } else {
                    undo();
                }
                e.preventDefault();
                break;
            case 'y':
                redo();
                e.preventDefault();
                break;
        }
    }
});
// --- 实时更新组件内容 (事件委托) ---
// --- 修复 1: 移除或修改 handleInputChange，新增 handleTextareaChange ---
// 这个函数现在主要用于记录正在编辑的 textarea，而不是立即更新数据
function handleTextareaChange(e) { // 修改函数名
     // 确保获取到的是正确的 textarea 元素 (修复 textarea 选择器)
    const targetTextarea = e.target.closest('textarea[data-path][data-key]'); // 修改选择器
    if (targetTextarea) {
        const pathStr = targetTextarea.dataset.path; // 使用 dataset
        const keyStr = targetTextarea.dataset.key;
        if (!pathStr || !keyStr) {
            console.warn("handleTextareaChange: data-path 或 data-key 属性为空或缺失", targetTextarea); // 更新日志
            return;
        }
        let path, key;
        try {
            path = JSON.parse(pathStr);
            key = keyStr; // data-key 通常不是JSON，直接赋值
        } catch (parseError) {
            console.error("handleTextareaChange: 解析 data-path 或 data-key 失败", pathStr, keyStr, parseError); // 更新日志
            return; // 如果解析失败，则不执行后续逻辑
        }
        // 检查解析后的 path 和 key 是否为期望的类型
        if (!Array.isArray(path) || typeof key !== 'string') {
            console.error("handleTextareaChange: 解析后的 path 或 key 类型不正确", path, key); // 更新日志
            return;
        }
        // --- 修复 1: 仅记录当前正在编辑的 textarea 及其路径和键 ---
        currentlyEditingInput = targetTextarea; // 更新引用为 textarea
        editingPath = path;
        editingKey = key;
        // 不再调用 updateComponent 或 renderTree
        // 数据更新延迟到 handleTextareaBlur (focusout 事件)
        // --- end 修复 1 ---
    }
    // 如果 e.target 不是我们关心的元素，则直接忽略
}
// --- end 修复 1 ---
// --- 删除按钮确认逻辑 (事件委托) ---
function handleDeleteButtonClick(e) {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const nodeElement = deleteBtn.closest('.node');
        const currentPath = JSON.parse(nodeElement.querySelector('textarea[data-path], input[data-path]').dataset.path); // 可能是 textarea 或 input
        let confirmTimeout;
        if (deleteBtn.classList.contains('confirmed')) {
            clearTimeout(confirmTimeout);
            deleteBtn.classList.remove('confirmed');
            deleteBtn.title = '删除';
            nodeElement.classList.add('removing');
            setTimeout(() => {
                removeComponent(currentPath);
            }, 300);
            return;
        } else {
            deleteBtn.classList.add('confirmed');
            deleteBtn.title = '再次点击确认删除';
            confirmTimeout = setTimeout(() => {
                deleteBtn.classList.remove('confirmed');
                deleteBtn.title = '删除';
            }, 5000);
        }
        e.stopPropagation();
    }
}
// --- 选择节点逻辑 (事件委托) ---
function handleNodeSelection(e) {
    // 修复：更精确地判断点击目标
    const nodeElement = e.target.closest('.node');
    if (nodeElement && e.target === nodeElement) {
        // 只有当点击的确实是 .node 本身时才选中
        const inputElement = nodeElement.querySelector('textarea[data-path], input[data-path]'); // 查找 textarea 或 input
        if (inputElement) {
            const path = JSON.parse(inputElement.dataset.path);
            selectNode(path);
        }
    }
    // 修复：点击 details 或 summary 不选中节点，并阻止冒泡
    if (e.target.tagName === 'SUMMARY' || e.target.tagName === 'DETAILS') {
        e.stopPropagation();
        return; // 不执行后续的节点选中逻辑
    }
    // 重置记录的输入框引用和路径
    currentlyEditingInput = null;
    editingPath = null;
    editingKey = null;
}
// --- 在 DOMContentLoaded 之后添加 textarea 事件监听器 ---
document.addEventListener('DOMContentLoaded', () => {
    // 使用事件委托为动态添加的 textarea 绑定 input 事件
    $rawTextTree.addEventListener('input', handleTextareaChange); // 监听 input 事件 (内容变化)
    // focus 事件可以在这里添加，如果需要的话
    // $rawTextTree.addEventListener('focus', handleTextareaFocus); // 监听 focus 事件
});