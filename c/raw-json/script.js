let rawTextArray = [];
let selectedNodePath = null;
let previewSettings = {};
let undoStack = [];
let redoStack = [];
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
const formattingCodes = {
    '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
    '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
    '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
    'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
    'g': '#DDD605', 'h': '#E3D4D1', 'i': '#CECACA', 'j': '#443A3B',
    'm': '#971607', 'n': '#B4684D', 'p': '#DEB12D', 'q': '#47A036',
    's': '#2CBAA8', 't': '#21497B', 'u': '#9A5CC6'
};
let currentlyEditingInput = null;
let editingPath = null;
let editingKey = null;
let expandedDetailsPaths = new Set();
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage();
    renderTree();
    updatePreview();
    attachEventListeners();
});
function attachEventListeners() {
    $homeBtn.addEventListener('click', () => {
        window.location.href = '/'; 
    });
    $addComponentBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        $addModal.style.display = 'block';
        delete $addModal.dataset.nestedPath;
    });
    const $addModalBody = $.getElementById('addModalBody');
    const $addSubModalBody = $.getElementById('addSubModalBody');
    if (!$addModalBody || !$addSubModalBody) {
        console.error("无法找到模态框 body 元素");
        return;
    }
    attachModalEventListeners($addModal, $addModalBody, false);
    attachModalCloseEvent($addModal);
    attachModalEventListeners($addSubComponentModal, $addSubModalBody, true);
    attachModalCloseEvent($addSubComponentModal);
    attachModalCloseEvent($importModal);
    attachModalCloseEvent($exportModal);
    attachModalCloseEvent($scoreSettingsModal);
    attachModalCloseEvent($clearAllModal);
    $.getElementById('importBtn').addEventListener('click', () => {
        $importTextarea.value = '';
        $importModal.style.display = 'block';
    });
    $confirmImportBtn.addEventListener('click', () => {
        importRawText($importTextarea.value);
        $importModal.style.display = 'none';
    });
    $.getElementById('exportBtn').addEventListener('click', () => {
        const exportData = JSON.parse(JSON.stringify(rawTextArray));
        function processTextForExport(obj) {
            if (obj !== null && typeof obj === 'object') {
                if (Array.isArray(obj)) {
                    obj.forEach(item => processTextForExport(item));
                } else {
                    for (const key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            if (typeof obj[key] === 'string') {
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
        const exportString = JSON.stringify(exportData);
        // 最后步骤：执行一次全局替换，将所有双反斜杠替换为单反斜杠
        // 这样肯定还是有各种问题的，目前能想到的最好的方案是用自定义编码替换，让反斜杠直接绕开需要转义的步骤
        const finalExportString = exportString.replace(/\\\\/g, '\\');
        $exportTextarea.value = finalExportString;
        $exportModal.style.display = 'block';
    });
    $copyExportBtn.addEventListener('click', () => {
        $exportTextarea.select();
        document.execCommand('copy');
        alert('已复制到剪贴板！');
    });
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
    $clearAllBtn.addEventListener('click', () => {
        $clearAllModal.style.display = 'block';
    });
    $confirmClearBtn.addEventListener('click', () => {
        clearAllComponents();
        $clearAllModal.style.display = 'none';
    });
    $cancelClearBtn.addEventListener('click', () => {
        $clearAllModal.style.display = 'none';
    });
    $themeToggleBtn.addEventListener('click', toggleTheme);
    $openScoreSettingsBtn.addEventListener('click', () => {
        updateScoreSettingsModalUI();
        $scoreSettingsModal.style.display = 'block';
    });
    $undoBtn.addEventListener('click', undo);
    $redoBtn.addEventListener('click', redo);
    document.addEventListener('focusout', handleInputBlur);
    document.addEventListener('click', handleDeleteButtonClick);
    document.addEventListener('click', handleNodeSelection);
}
function attachModalCloseEvent(modal) {
    modal.querySelector('.close').addEventListener('click', (e) => {
        e.stopPropagation();
        modal.style.display = 'none';
        if (modal.id === 'addSubComponentModal' || modal.id === 'addModal') {
             delete modal.dataset.nestedPath;
        }
    });
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            e.stopPropagation();
            modal.style.display = 'none';
            if (modal.id === 'addSubComponentModal' || modal.id === 'addModal') {
                 delete modal.dataset.nestedPath;
            }
        }
    });
}
function attachModalEventListeners(modal, modalBody, isNestedModal = false) {
    if (!modalBody) {
        console.error("attachModalEventListeners: modalBody 为 null 或未定义");
        return;
    }
    modalBody.addEventListener('click', (e) => {
        const button = e.target.closest('.component-type-btn');
        if (button) {
            e.stopPropagation();
            const type = button.dataset.type;
            if (isNestedModal) {
                const pathStr = modal.dataset.nestedPath;
                if (pathStr) {
                    const path = JSON.parse(pathStr);
                    addComponent(type, path);
                    delete modal.dataset.nestedPath;
                }
            } else {
                addComponent(type);
            }
            modal.style.display = 'none';
        }
    });
    if (isNestedModal) {
        const translateBtn = modalBody.querySelector('.component-type-btn[data-type="translate"]');
        if (translateBtn) {
            translateBtn.remove();
        }
    }
}
function addComponent(type, path = null) {
    saveStateToUndoStack();
    const newComponent = createDefaultComponent(type);
    if (path) {
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
    saveStateToUndoStack();
    rawTextArray = [];
    selectedNodePath = null;
    renderTree();
    updatePreview();
    saveStateToLocalStorage();
}
function updateComponentValue(path, key, value) {
    saveStateToUndoStack();
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
    updatePreview();
    saveStateToLocalStorage();
}
function handleInputBlur(e) {
    if (currentlyEditingInput && editingPath && editingKey) {
        const newValue = currentlyEditingInput.value;
        updateComponentValue(editingPath, editingKey, newValue);
    }
    currentlyEditingInput = null;
    editingPath = null;
    editingKey = null;
}
function moveComponent(fromPath, toPath) {
    saveStateToUndoStack();
    const item = getNestedObject(rawTextArray, fromPath);
    const fromParentArray = getNestedObject(rawTextArray, fromPath.slice(0, -1));
    const fromIndex = fromPath[fromPath.length - 1];
    const toParentArray = getNestedObject(rawTextArray, toPath.slice(0, -1));
    const toIndex = toPath[toPath.length - 1];
    if (Array.isArray(fromParentArray) && Array.isArray(toParentArray)) {
        fromParentArray.splice(fromIndex, 1);
        toParentArray.splice(toIndex, 0, item);
    } else {
        console.error("moveComponent: 源或目标父级不是数组", fromParentArray, toParentArray);
        return;
    }
    if (JSON.stringify(fromPath) === JSON.stringify(selectedNodePath)) {
        selectedNodePath = [...toPath];
    }
    const fromElement = document.querySelector(`.node:nth-child(${fromIndex + 1})`);
    if (fromElement) {
        const targetElement = document.querySelector(`.node:nth-child(${toIndex + (fromIndex < toIndex ? 2 : 1)})`);
        if (targetElement) {
            const fromRect = fromElement.getBoundingClientRect();
            const targetRect = targetElement.getBoundingClientRect();
            fromElement.style.position = 'relative';
            fromElement.style.zIndex = '1000';
            fromElement.style.pointerEvents = 'none';
            fromElement.style.transform = `translateY(${targetRect.top - fromRect.top}px)`;
            fromElement.offsetHeight;
            fromElement.style.transition = 'transform 0.2s ease-in-out';
            fromElement.style.transform = 'translateY(0)';
            fromElement.style.position = '';
            fromElement.style.zIndex = '';
            fromElement.style.pointerEvents = '';
            setTimeout(() => {
                fromElement.style.transition = '';
                renderTree();
            }, 200);
            return;
        }
    }
    renderTree();
    updatePreview();
    saveStateToLocalStorage();
}
function createDefaultComponent(type) {
    switch (type) {
        case 'text':
            return { text: "" };
        case 'translate':
            return { translate: "%%2", with: { rawtext: [] } };
        case 'selector':
            return { selector: "" };
        case 'score':
            return { score: { name: "", objective: "" } };
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
function renderTree(parentArray = rawTextArray, basePath = [], parentElement = $rawTextTree) {
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
    parentElement.innerHTML = '';
    if (parentArray.length === 0) {
        $emptyState.style.display = 'flex';
        return;
    }
    $emptyState.style.display = 'none';
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
        if (basePath.length === 0 && index === parentArray.length - 1 && parentArray.length > 0) {
            nodeElement.classList.add('adding');
            setTimeout(() => {
                nodeElement.classList.remove('adding');
            }, 300);
        }
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
        if (type === 'translate' && component.with && component.with.rawtext) {
            const nestedContainer = document.createElement('div');
            nestedContainer.className = 'nested-tree';
            nodeElement.appendChild(nestedContainer);
            const details = document.createElement('details');
            const withRawtextPathStr = JSON.stringify([...currentPath, 'with', 'rawtext']);
            if (currentlyExpandedPaths.has(withRawtextPathStr) || expandedDetailsPaths.has(withRawtextPathStr)) {
                details.setAttribute('open', '');
            }
            details.ontoggle = () => {
                if (details.open) {
                    expandedDetailsPaths.add(withRawtextPathStr);
                } else {
                    expandedDetailsPaths.delete(withRawtextPathStr);
                }
                saveStateToLocalStorage();
            };
            details.innerHTML = `<summary>With (rawtext)</summary>`;
            nestedContainer.appendChild(details);
            const nestedContentDiv = document.createElement('div');
            nestedContentDiv.className = 'nested-editor-container';
            details.appendChild(nestedContentDiv);
            renderTree(component.with.rawtext, [...currentPath, 'with', 'rawtext'], nestedContentDiv);
            const addNestedBtn = document.createElement('button');
            addNestedBtn.className = 'btn-secondary nested-editor-add-btn';
            addNestedBtn.innerHTML = '<i class="fas fa-plus"></i> 添加子组件';
            addNestedBtn.onclick = (e) => {
                e.stopPropagation();
                $addSubComponentModal.style.display = 'block';
                $addSubComponentModal.dataset.nestedPath = JSON.stringify([...currentPath, 'with', 'rawtext']);
            };
            nestedContentDiv.appendChild(addNestedBtn);
            if (component.with.rawtext.length === 0) {
                const emptyStateDiv = document.createElement('div');
                emptyStateDiv.className = 'empty-nested-state';
                emptyStateDiv.innerHTML = '<p>此区域内暂无组件</p>';
                nestedContentDiv.appendChild(emptyStateDiv);
            }
        }
    });
    if (editingPath && editingKey) {
        const inputElement = document.querySelector(`input[data-path="${JSON.stringify(editingPath)}"][data-key="${editingKey}"]`);
        if (inputElement) {
            const component = getNestedObject(rawTextArray, editingPath);
            const keyParts = editingKey.split('.');
            let valueToUse = component;
            for (const part of keyParts) {
                valueToUse = valueToUse[part];
            }
            inputElement.value = valueToUse;
            inputElement.focus();
            if (currentlyEditingInput) {
                 inputElement.setSelectionRange(currentlyEditingInput.selectionStart, currentlyEditingInput.selectionEnd);
            }
            currentlyEditingInput = inputElement;
        } else {
            currentlyEditingInput = null;
            editingPath = null;
            editingKey = null;
        }
    }
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
            contentHtml = `<textarea rows="3" data-path="${safePathStr}" data-key="text" placeholder="纯文本">${escapeHtml(component.text)}</textarea>`;
            break;
        case 'translate':
            const safeTranslatePathStr = escapeHtml(JSON.stringify(path));
            contentHtml = `
                <input type="text" value="${escapeHtml(component.translate)}" data-path="${safeTranslatePathStr}" data-key="translate" placeholder="格式化字符串">
            `;
            break;
        case 'selector':
            const safeSelectorPathStr = escapeHtml(JSON.stringify(path));
            contentHtml = `<input type="text" value="${escapeHtml(component.selector)}" data-path="${safeSelectorPathStr}" data-key="selector" placeholder="选择器">`;
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
            fullText += '[实体]';
        } else if (component.score !== undefined) {
            const name = component.score.name;
            const objective = component.score.objective;
            const key = `${name}:${objective}`;
            fullText += previewSettings[key] || 0;
        } else if (component.translate !== undefined) {
            fullText += '[translate组件，预览功能暂未实现]';
        }
    });
    $previewOutput.innerHTML = parseFormattingCodes(fullText);
}
function parseFormattingCodes(text) {
    let processedText = text.replace(/\n/g, '<br>');
    processedText = processedText.replace(/\\n/g, '<br>');
    processedText = processedText.replace(/\\\\n/g, '\\n');
    const parts = processedText.split(/(§.)/g);
    let inFormattingSpan = false;
    let currentStyleTags = [];
    let resultHtml = '';
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (part.startsWith('§') && part.length === 2) {
            const code = part[1];
            const style = formattingCodes[code];
            if (inFormattingSpan) {
                if (code === 'r') {
                    resultHtml += '</span>';
                    inFormattingSpan = false;
                    currentStyleTags = [];
                } else if (style) {
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
                        break;
                    default:
                        currentStyleTags = [`color: ${style}; font-family: inherit;`];
                        break;
                }
                const currentStyle = currentStyleTags.join(' ');
                if (currentStyle) {
                    resultHtml += `<span style="${currentStyle}">`;
                    inFormattingSpan = true;
                }
            } else {
                switch (code) {
                    case 'k':
                        if (inFormattingSpan) {
                            resultHtml += '(随机字符)';
                        } else {
                            resultHtml += '<span>(随机字符)</span>';
                        }
                        break;
                    case 'r':
                        break;
                    default:
                        continue;
                }
            }
        } else {
            resultHtml += part;
        }
    }
    if (inFormattingSpan) {
        resultHtml += '</span>';
    }
    return resultHtml;
}
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
function saveStateToUndoStack() {
    undoStack.push(JSON.stringify(rawTextArray));
    redoStack = [];
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
    updateScoreSettingsModalUI();
    saveStateToLocalStorage();
}
function redo() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(rawTextArray));
    const nextState = redoStack.pop();
    rawTextArray = JSON.parse(nextState);
    renderTree();
    updatePreview();
    updateScoreSettingsModalUI();
    saveStateToLocalStorage();
}
function saveStateToLocalStorage() {
    try {
        localStorage.setItem('rawTextArray', JSON.stringify(rawTextArray));
        localStorage.setItem('previewSettings', JSON.stringify(previewSettings));
        localStorage.setItem('undoStack', JSON.stringify(undoStack));
        localStorage.setItem('redoStack', JSON.stringify(redoStack));
        localStorage.setItem('expandedDetailsPaths', JSON.stringify([...expandedDetailsPaths]));
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
        const savedExpandedDetails = localStorage.getItem('expandedDetailsPaths');
        if (savedRawText) rawTextArray = JSON.parse(savedRawText);
        if (savedPreviewSettings) previewSettings = JSON.parse(savedPreviewSettings);
        if (savedUndoStack) undoStack = JSON.parse(savedUndoStack);
        if (savedRedoStack) redoStack = JSON.parse(savedRedoStack);
        if (savedExpandedDetails) {
            try {
                expandedDetailsPaths = new Set(JSON.parse(savedExpandedDetails));
            } catch (e) {
                console.error("加载展开状态失败:", e);
                expandedDetailsPaths = new Set();
            }
        }
    } catch (e) {
        console.error("从 localStorage 加载失败:", e);
        rawTextArray = [];
        previewSettings = {};
        undoStack = [];
        redoStack = [];
        expandedDetailsPaths = new Set();
    }
}
// 导入导出
function importRawText(input) {
    try {
        const trimmedInput = input.trim();
        let parsed;
        try {
            parsed = JSON.parse(trimmedInput);
        } catch {
            // 尝试匹配tellraw命令，待优化
            const match = trimmedInput.match(/\/tellraw\s+\S+\s+(.*)/);
            if (match) {
                parsed = JSON.parse(match[1].trim());
            } else {
                throw new Error("无法解析输入内容");
            }
        }
        if (!Array.isArray(parsed)) throw new Error("导入的数据必须是一个数组");
        saveStateToUndoStack();
        rawTextArray = parsed;
        renderTree();
        updatePreview();
        updateScoreSettingsModalUI();
        saveStateToLocalStorage();
    } catch (error) {
        alert(`导入失败: ${error.message}`);
    }
}
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
function handleInputChange(e) {
    const targetInput = e.target.closest('input[data-path][data-key], textarea[data-path][data-key]');
    if (targetInput) {
        const pathStr = targetInput.dataset.path;
        const keyStr = targetInput.dataset.key;
        if (!pathStr || !keyStr) {
            console.warn("handleInputChange: data-path 或 data-key 属性为空或缺失", targetInput);
            return;
        }
        let path, key;
        try {
            path = JSON.parse(pathStr);
            key = keyStr;
        } catch (parseError) {
            console.error("handleInputChange: 解析 data-path 或 data-key 失败", pathStr, keyStr, parseError);
            return;
        }
        if (!Array.isArray(path) || typeof key !== 'string') {
            console.error("handleInputChange: 解析后的 path 或 key 类型不正确", path, key);
            return;
        }
        currentlyEditingInput = targetInput;
        editingPath = path;
        editingKey = key;
    }
}
function handleDeleteButtonClick(e) {
    const deleteBtn = e.target.closest('.delete-btn');
    if (deleteBtn) {
        const nodeElement = deleteBtn.closest('.node');
        const currentPath = JSON.parse(nodeElement.querySelector('textarea[data-path], input[data-path]').dataset.path);
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
function handleNodeSelection(e) {
    const nodeElement = e.target.closest('.node');
    if (nodeElement && e.target === nodeElement) {
        const inputElement = nodeElement.querySelector('textarea[data-path], input[data-path]');
        if (inputElement) {
            const path = JSON.parse(inputElement.dataset.path);
            selectNode(path);
        }
    }
    if (e.target.tagName === 'SUMMARY' || e.target.tagName === 'DETAILS') {
        e.stopPropagation();
        return;
    }
    currentlyEditingInput = null;
    editingPath = null;
    editingKey = null;
}
document.addEventListener('DOMContentLoaded', () => {
    $rawTextTree.addEventListener('input', handleInputChange);
});