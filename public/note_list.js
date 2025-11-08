const API_URL = '/api/notes';
const noteContainer = document.getElementById('noteContainer');
const addNoteBtn = document.getElementById('addNote');
const titleInput = document.getElementById('title');
const contentInput = document.getElementById('content');
const themeToggle = document.getElementById('themeToggle');
const bgTheme = document.getElementById('bgTheme');
const appContainer = document.getElementById('appContainer');
const editorToolbar = document.getElementById('editorToolbar');
const addTodoBtn = document.getElementById('addTodoBtn');

// CSS-based background patterns (always visible, no external dependencies)
// Using more visible patterns with higher opacity for better visibility
const backgrounds = {
  blue: 'linear-gradient(45deg, rgba(11, 14, 222, 0.75) 25%, transparent 95%), linear-gradient(-45deg, rgba(59, 130, 246, 0.15) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(18, 98, 227, 0.15) 75%), linear-gradient(-45deg, transparent 75%, rgba(59, 130, 246, 0.15) 75%)',
  green: 'radial-gradient(circle at 2px 2px, rgba(13, 215, 87, 0.9) 1.5px, transparent 70%), radial-gradient(circle at 18px 18px, rgba(34, 197, 94, 0.75) 1.5px, transparent 50%)',
  yellow: 'repeating-linear-gradient(45deg, rgba(234, 179, 8, 0.95), rgba(234, 179, 8, 0.95) 10px, transparent 10px, transparent 20px)',
  black: 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(0, 0, 0, 0.95) 0deg, transparent 45deg, rgba(0, 0, 0, 0.95) 60deg)',
  purple: 'linear-gradient(90deg, rgba(121, 22, 213, 0.75) 50%, transparent 50%), linear-gradient(rgba(168, 85, 247, 0.75) 50%, transparent 50%)'
};

// Background sizes for patterns
const backgroundSizes = {
  blue: '20px 20px',
  green: '40px 40px',
  yellow: '20px 20px',
  black: '40px 40px',
  purple: '20px 20px'
};

// Apply saved background theme
const savedBg = localStorage.getItem('bgTheme');
if (savedBg && backgrounds[savedBg]) {
  bgTheme.value = savedBg;
  appContainer.style.backgroundImage = backgrounds[savedBg];
  appContainer.style.backgroundSize = backgroundSizes[savedBg] || '20px 20px';
}

// Load saved theme
const savedTheme = localStorage.getItem('darkMode');
if (savedTheme === 'true') {
  document.body.setAttribute('data-theme', 'dark');
  themeToggle.innerHTML = `<i class="fas fa-sun"></i>`;
} else {
  document.body.removeAttribute('data-theme');
  themeToggle.innerHTML = `<i class="fas fa-moon"></i>`;
}

// Background theme change handler
bgTheme.addEventListener('change', () => {
  const value = bgTheme.value;
  if (value && backgrounds[value]) {
    appContainer.style.backgroundImage = backgrounds[value];
    appContainer.style.backgroundSize = backgroundSizes[value] || '20px 20px';
    localStorage.setItem('bgTheme', value);
  } else {
    appContainer.style.backgroundImage = 'none';
    appContainer.style.backgroundSize = 'auto';
    localStorage.removeItem('bgTheme');
  }
});

// Theme toggle
themeToggle.addEventListener('click', () => {
  const current = document.body.getAttribute('data-theme');
  if (current === 'dark') {
    document.body.removeAttribute('data-theme');
    localStorage.setItem('darkMode', 'false');
    themeToggle.innerHTML = `<i class="fas fa-moon"></i>`;
  } else {
    document.body.setAttribute('data-theme', 'dark');
    localStorage.setItem('darkMode', 'true');
    themeToggle.innerHTML = `<i class="fas fa-sun"></i>`;
  }
});

// Smart format block - prevents stacking headers
function smartFormatBlock(tagName) {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) return;
  
  const range = selection.getRangeAt(0);
  let container = range.commonAncestorContainer;
  
  // Find the block element (h1-h6, p, div, etc.)
  while (container && container.nodeType !== 1) {
    container = container.parentNode;
  }
  
  if (!container) return;
  
  // Check if we're already in a header or block element
  const blockElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV'];
  let currentBlock = container;
  
  while (currentBlock && currentBlock !== contentInput) {
    if (blockElements.includes(currentBlock.tagName)) {
      // If it's already the same tag, do nothing
      if (currentBlock.tagName === tagName.toUpperCase()) {
        return;
      }
      // If it's a different block element, replace it
      const newElement = document.createElement(tagName);
      newElement.innerHTML = currentBlock.innerHTML;
      currentBlock.parentNode.replaceChild(newElement, currentBlock);
      
      // Restore selection
      const newRange = document.createRange();
      newRange.selectNodeContents(newElement);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
      return;
    }
    currentBlock = currentBlock.parentNode;
  }
  
  // If no block element found, use standard formatBlock
  document.execCommand('formatBlock', false, tagName);
}

// Rich text editor toolbar functionality
editorToolbar.addEventListener('click', (e) => {
  const btn = e.target.closest('.toolbar-btn');
  if (!btn) return;
  
  e.preventDefault();
  const command = btn.dataset.command;
  const value = btn.dataset.value;
  
  // Handle formatBlock commands (headers, paragraphs) with smart formatting
  if (command === 'formatBlock' && value) {
    smartFormatBlock(value);
    updateToolbarState();
  } else if (command && value) {
    document.execCommand(command, false, value);
    updateToolbarState();
  } else if (command) {
    document.execCommand(command, false, null);
    updateToolbarState();
  }
  
  contentInput.focus();
});

// Update toolbar button states
function updateToolbarState() {
  const commands = ['bold', 'italic', 'underline'];
  commands.forEach(cmd => {
    const btn = editorToolbar.querySelector(`[data-command="${cmd}"]`);
    if (btn) {
      if (document.queryCommandState(cmd)) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    }
  });
}

// Save and restore selection
let savedSelection = null;

function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    savedSelection = selection.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (savedSelection) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(savedSelection);
  }
}

// Save selection when clicking color picker (only if contentInput exists)
if (contentInput) {
  contentInput.addEventListener('blur', saveSelection);
  contentInput.addEventListener('mouseup', saveSelection);
  contentInput.addEventListener('keyup', saveSelection);
}

// Color picker functionality
const colorPickerBtn = document.getElementById('colorPickerBtn');
const colorPickerDropdown = document.getElementById('colorPickerDropdown');
const colorPresets = document.querySelectorAll('.color-preset');
const rgbColorInput = document.getElementById('rgbColorInput');
const applyRgbBtn = document.getElementById('applyRgbBtn');

// Apply color to selected text
function applyTextColor(color) {
  if (!contentInput) {
    console.error('Content input not found');
    return;
  }
  
  // Restore focus and selection
  contentInput.focus();
  
  // Small delay to ensure focus is set
  setTimeout(() => {
    // Try to restore selection
    restoreSelection();
    
    // If no selection, select all
    const selection = window.getSelection();
    if (selection.rangeCount === 0 || selection.toString().trim() === '') {
      const range = document.createRange();
      range.selectNodeContents(contentInput);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Apply color
    try {
      const success = document.execCommand('foreColor', false, color);
      if (!success) {
        throw new Error('execCommand failed');
      }
    } catch (e) {
      // Fallback: wrap selection in span with color
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.style.color = color;
        try {
          range.surroundContents(span);
        } catch (e) {
          // If surroundContents fails, extract and wrap
          const contents = range.extractContents();
          span.appendChild(contents);
          range.insertNode(span);
        }
      }
    }
    
    contentInput.focus();
  }, 10);
}

// Color preset clicks
if (colorPresets && colorPresets.length > 0) {
  colorPresets.forEach(preset => {
    preset.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const color = preset.dataset.color;
      if (color) {
        applyTextColor(color);
      }
      colorPickerDropdown.style.display = 'none';
    });
  });
}

// RGB color input
if (applyRgbBtn && rgbColorInput) {
  applyRgbBtn.addEventListener('click', () => {
    const color = rgbColorInput.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      applyTextColor(color);
      rgbColorInput.value = '';
      colorPickerDropdown.style.display = 'none';
    } else {
      alert('Please enter a valid hex color (e.g., #FF0000)');
    }
  });

  rgbColorInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyRgbBtn.click();
    }
  });
}

// Keep color picker open when interacting with it
if (colorPickerBtn && colorPickerDropdown) {
  colorPickerBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    saveSelection();
    colorPickerDropdown.style.display = colorPickerDropdown.style.display === 'block' ? 'none' : 'block';
  });

  // Close color picker when clicking outside
  document.addEventListener('click', (e) => {
    if (colorPickerBtn && colorPickerDropdown && 
        !colorPickerBtn.contains(e.target) && 
        !colorPickerDropdown.contains(e.target)) {
      colorPickerDropdown.style.display = 'none';
    }
  });
}

// Add to-do item
addTodoBtn.addEventListener('click', (e) => {
  e.preventDefault();
  const selection = window.getSelection();
  const range = selection.getRangeAt(0);
  
  // Create todo item HTML
  const todoId = 'todo-' + Date.now();
  const todoHtml = `
    <div class="todo-item" data-todo-id="${todoId}">
      <input type="checkbox" class="todo-checkbox">
      <span class="todo-text" contenteditable="true">New to-do item</span>
      <button class="delete-todo" type="button"><i class="fas fa-times"></i></button>
    </div>
  `;
  
  // Insert todo
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = todoHtml;
  const todoElement = tempDiv.firstElementChild;
  
  range.deleteContents();
  range.insertNode(todoElement);
  
  // Set up todo event listeners
  setupTodoListeners(todoElement);
  
  // Focus on the todo text
  const todoText = todoElement.querySelector('.todo-text');
  todoText.focus();
  
  contentInput.focus();
});

// Setup todo item event listeners
function setupTodoListeners(todoElement) {
  const checkbox = todoElement.querySelector('.todo-checkbox');
  const deleteBtn = todoElement.querySelector('.delete-todo');
  const todoText = todoElement.querySelector('.todo-text');
  
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      todoElement.classList.add('completed');
    } else {
      todoElement.classList.remove('completed');
    }
  });
  
  deleteBtn.addEventListener('click', () => {
    todoElement.remove();
  });
  
  // Prevent line breaks in todo text
  todoText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      todoText.blur();
    }
  });
}

// Setup todos in content editable
function setupTodosInContent(element) {
  const todos = element.querySelectorAll('.todo-item');
  todos.forEach(todo => setupTodoListeners(todo));
}

// Load notes
async function loadNotes() {
  const res = await axios.get(API_URL);
  const notes = res.data;
  noteContainer.innerHTML = '';

  notes.forEach(note => {
    const div = document.createElement('div');
    div.classList.add('note');

    // Parse content - check if it's HTML or plain text
    let contentHtml = note.content;
    try {
      // Try to parse as HTML, if it fails, treat as plain text
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = note.content;
      if (tempDiv.children.length === 0 && note.content.trim()) {
        // Plain text, wrap in paragraph
        contentHtml = `<p>${note.content.replace(/\n/g, '</p><p>')}</p>`;
      }
    } catch (e) {
      contentHtml = `<p>${note.content}</p>`;
    }

    div.innerHTML = `
      <input type="text" class="edit-title" value="${escapeHtml(note.title)}">
      <div class="editor-toolbar edit-toolbar">
        <button class="toolbar-btn" data-command="formatBlock" data-value="h1" title="Heading 1">
          <i class="fas fa-heading"></i> H1
        </button>
        <button class="toolbar-btn" data-command="formatBlock" data-value="h2" title="Heading 2">
          <i class="fas fa-heading"></i> H2
        </button>
        <button class="toolbar-btn" data-command="formatBlock" data-value="h3" title="Heading 3">
          <i class="fas fa-heading"></i> H3
        </button>
        <button class="toolbar-btn" data-command="formatBlock" data-value="h4" title="Heading 4">
          <i class="fas fa-heading"></i> H4
        </button>
        <button class="toolbar-btn" data-command="formatBlock" data-value="h5" title="Heading 5">
          <i class="fas fa-heading"></i> H5
        </button>
        <button class="toolbar-btn" data-command="formatBlock" data-value="h6" title="Heading 6">
          <i class="fas fa-heading"></i> H6
        </button>
        <button class="toolbar-btn" data-command="formatBlock" data-value="p" title="Paragraph">
          <i class="fas fa-paragraph"></i> P
        </button>
        <button class="toolbar-btn" data-command="insertUnorderedList" title="Bullet List">
          <i class="fas fa-list-ul"></i>
        </button>
        <button class="toolbar-btn" data-command="insertOrderedList" title="Numbered List">
          <i class="fas fa-list-ol"></i>
        </button>
        <button class="toolbar-btn add-todo-btn" title="Add To-Do Item">
          <i class="fas fa-check-square"></i> To-Do
        </button>
        <button class="toolbar-btn" data-command="bold" title="Bold">
          <i class="fas fa-bold"></i>
        </button>
        <button class="toolbar-btn" data-command="italic" title="Italic">
          <i class="fas fa-italic"></i>
        </button>
        <button class="toolbar-btn" data-command="underline" title="Underline">
          <i class="fas fa-underline"></i>
        </button>
        <div class="color-picker-wrapper edit-color-picker">
          <button class="toolbar-btn edit-color-btn" title="Text Color">
            <i class="fas fa-palette"></i> Color
          </button>
          <div class="color-picker-dropdown edit-color-dropdown">
            <div class="color-picker-header">Text Color</div>
            <div class="color-presets">
              <div class="color-preset" data-color="#000000" style="background: #000000;" title="Black"></div>
              <div class="color-preset" data-color="#FFFFFF" style="background: #FFFFFF; border: 1px solid #ccc;" title="White"></div>
              <div class="color-preset" data-color="#FF0000" style="background: #FF0000;" title="Red"></div>
              <div class="color-preset" data-color="#00FF00" style="background: #00FF00;" title="Green"></div>
              <div class="color-preset" data-color="#0000FF" style="background: #0000FF;" title="Blue"></div>
              <div class="color-preset" data-color="#FFFF00" style="background: #FFFF00;" title="Yellow"></div>
              <div class="color-preset" data-color="#FF00FF" style="background: #FF00FF;" title="Magenta"></div>
              <div class="color-preset" data-color="#00FFFF" style="background: #00FFFF;" title="Cyan"></div>
              <div class="color-preset" data-color="#FFA500" style="background: #FFA500;" title="Orange"></div>
              <div class="color-preset" data-color="#800080" style="background: #800080;" title="Purple"></div>
              <div class="color-preset" data-color="#FFC0CB" style="background: #FFC0CB;" title="Pink"></div>
              <div class="color-preset" data-color="#A52A2A" style="background: #A52A2A;" title="Brown"></div>
            </div>
            <div class="color-rgb-input">
              <label>RGB:</label>
              <input type="text" class="edit-rgb-input" placeholder="#000000" pattern="^#[0-9A-Fa-f]{6}$">
              <button class="apply-rgb-btn edit-apply-rgb">Apply</button>
            </div>
          </div>
        </div>
      </div>
      <div class="content-editable edit-content" contenteditable="true">${contentHtml}</div>
      <div class="action-btns">
        <button class="save-btn"><i class="fas fa-check"></i></button>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    `;

    const editContent = div.querySelector('.edit-content');
    const editToolbar = div.querySelector('.edit-toolbar');
    const addTodoBtnEdit = div.querySelector('.add-todo-btn');

    // Setup toolbar for edit mode
    editToolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('.toolbar-btn');
      if (!btn) return;
      
      e.preventDefault();
      const command = btn.dataset.command;
      const value = btn.dataset.value;
      
      // Handle formatBlock commands with smart formatting
      if (command === 'formatBlock' && value) {
        // Use smart format block for edit mode
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return;
        
        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;
        
        while (container && container.nodeType !== 1) {
          container = container.parentNode;
        }
        
        if (!container) return;
        
        const blockElements = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'DIV'];
        let currentBlock = container;
        
        while (currentBlock && currentBlock !== editContent) {
          if (blockElements.includes(currentBlock.tagName)) {
            if (currentBlock.tagName === value.toUpperCase()) {
              return;
            }
            const newElement = document.createElement(value);
            newElement.innerHTML = currentBlock.innerHTML;
            currentBlock.parentNode.replaceChild(newElement, currentBlock);
            
            const newRange = document.createRange();
            newRange.selectNodeContents(newElement);
            newRange.collapse(false);
            selection.removeAllRanges();
            selection.addRange(newRange);
            return;
          }
          currentBlock = currentBlock.parentNode;
        }
        
        document.execCommand('formatBlock', false, value);
      } else if (command && value) {
        document.execCommand(command, false, value);
      } else if (command) {
        document.execCommand(command, false, null);
      }
      
      editContent.focus();
    });

    // Save selection for edit mode
    let editSavedSelection = null;
    
    function saveEditSelection() {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        editSavedSelection = selection.getRangeAt(0).cloneRange();
      }
    }
    
    function restoreEditSelection() {
      if (editSavedSelection) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(editSavedSelection);
      }
    }
    
    editContent.addEventListener('blur', saveEditSelection);
    editContent.addEventListener('mouseup', saveEditSelection);
    editContent.addEventListener('keyup', saveEditSelection);

    // Setup color picker for edit mode
    const editColorBtn = div.querySelector('.edit-color-btn');
    const editColorDropdown = div.querySelector('.edit-color-dropdown');
    const editColorPresets = div.querySelectorAll('.edit-color-picker .color-preset');
    const editRgbInput = div.querySelector('.edit-rgb-input');
    const editApplyRgb = div.querySelector('.edit-apply-rgb');

    function applyEditTextColor(color) {
      // Restore focus and selection
      editContent.focus();
      restoreEditSelection();
      
      // If no selection, select all
      const selection = window.getSelection();
      if (selection.rangeCount === 0 || selection.toString().trim() === '') {
        const range = document.createRange();
        range.selectNodeContents(editContent);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Apply color
      try {
        document.execCommand('foreColor', false, color);
      } catch (e) {
        // Fallback: wrap selection in span with color
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = document.createElement('span');
          span.style.color = color;
          try {
            range.surroundContents(span);
          } catch (e) {
            // If surroundContents fails, extract and wrap
            const contents = range.extractContents();
            span.appendChild(contents);
            range.insertNode(span);
          }
        }
      }
      
      editContent.focus();
    }

    if (editColorPresets && editColorPresets.length > 0) {
      editColorPresets.forEach(preset => {
        preset.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const color = preset.dataset.color;
          if (color) {
            applyEditTextColor(color);
          }
          editColorDropdown.style.display = 'none';
        });
      });
    }

    if (editApplyRgb && editRgbInput) {
      editApplyRgb.addEventListener('click', () => {
        const color = editRgbInput.value.trim();
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
          applyEditTextColor(color);
          editRgbInput.value = '';
          editColorDropdown.style.display = 'none';
        } else {
          alert('Please enter a valid hex color (e.g., #FF0000)');
        }
      });

      editRgbInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          editApplyRgb.click();
        }
      });
    }

    if (editColorBtn && editColorDropdown) {
      editColorBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        saveEditSelection();
        
        const isVisible = editColorDropdown.style.display === 'block';
        editColorDropdown.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
          // Smart positioning - check if dropdown would overflow
          setTimeout(() => {
            const dropdownRect = editColorDropdown.getBoundingClientRect();
            const noteRect = div.getBoundingClientRect();
            const buttonRect = editColorBtn.getBoundingClientRect();
            
            // Default: align to right (button side)
            editColorDropdown.style.left = 'auto';
            editColorDropdown.style.right = '0';
            
            // Check if dropdown would overflow on the right
            if (dropdownRect.right > noteRect.right) {
              // Try aligning to left instead
              editColorDropdown.style.left = '0';
              editColorDropdown.style.right = 'auto';
              
              // If still overflows on left, center it
              const newRect = editColorDropdown.getBoundingClientRect();
              if (newRect.left < noteRect.left) {
                const centerOffset = (noteRect.width - newRect.width) / 2;
                editColorDropdown.style.left = centerOffset + 'px';
                editColorDropdown.style.right = 'auto';
              }
            }
            
            // Check if dropdown would overflow on the left
            const finalRect = editColorDropdown.getBoundingClientRect();
            if (finalRect.left < noteRect.left) {
              editColorDropdown.style.left = '0';
              editColorDropdown.style.right = 'auto';
            }
            
            // Ensure max-width doesn't exceed note width
            const maxWidth = Math.min(280, noteRect.width - 32);
            editColorDropdown.style.maxWidth = maxWidth + 'px';
          }, 10);
        }
      });
    }

    // Add todo in edit mode
    addTodoBtnEdit.addEventListener('click', (e) => {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      const todoId = 'todo-' + Date.now();
      const todoHtml = `
        <div class="todo-item" data-todo-id="${todoId}">
          <input type="checkbox" class="todo-checkbox">
          <span class="todo-text" contenteditable="true">New to-do item</span>
          <button class="delete-todo" type="button"><i class="fas fa-times"></i></button>
        </div>
      `;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = todoHtml;
      const todoElement = tempDiv.firstElementChild;
      
      range.deleteContents();
      range.insertNode(todoElement);
      
      setupTodoListeners(todoElement);
      
      const todoText = todoElement.querySelector('.todo-text');
      todoText.focus();
      
      editContent.focus();
    });

    // Setup todos in the content
    setupTodosInContent(editContent);

    div.querySelector('.save-btn').addEventListener('click', async () => {
      const newTitle = div.querySelector('.edit-title').value.trim();
      const newContent = div.querySelector('.edit-content').innerHTML.trim();
      if (!newTitle || !newContent) return alert('Title & content required');
      await axios.put(`${API_URL}/${note.id}`, { title: newTitle, content: newContent });
      loadNotes();
    });

    div.querySelector('.delete-btn').addEventListener('click', async () => {
      if (confirm('Are you sure to delete this note?')) {
        await axios.delete(`${API_URL}/${note.id}`);
        loadNotes();
      }
    });

    noteContainer.appendChild(div);
  });
}

// Add note
addNoteBtn.addEventListener('click', async () => {
  const title = titleInput.value.trim();
  const content = contentInput.innerHTML.trim();
  if (!title || !content) return alert('Please enter both title and content');
  
  try {
    await axios.post(API_URL, { title, content });
    titleInput.value = '';
    contentInput.innerHTML = '';
    
    // Ensure form stays visible and scroll to form
    const noteForm = document.querySelector('.note-form');
    if (noteForm) {
      noteForm.style.display = 'flex';
      noteForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    loadNotes();
  } catch (error) {
    console.error('Error adding note:', error);
    alert('Failed to add note. Please try again.');
  }
});

// Escape HTML for safe display
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Content editable placeholder
contentInput.addEventListener('focus', function() {
  if (this.innerHTML.trim() === '') {
    this.innerHTML = '';
  }
});

contentInput.addEventListener('blur', function() {
  if (this.innerHTML.trim() === '') {
    this.innerHTML = '';
  }
});

// Load notes on page load
loadNotes();
