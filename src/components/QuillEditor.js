import Quill from 'quill';
import 'quill/dist/quill.snow.css';

/**
 * QuillEditor Plugin for EVA Web SDK
 * A framework-agnostic rich text editor plugin that can be used with React, Angular, or vanilla JavaScript
 */
class QuillEditor {
  constructor(container, options = {}) {
    this.container = container;
    this.quill = null;
    this.options = {
      theme: 'snow',
      modules: {
        toolbar: []
      },
      placeholder: 'Type your message...',
      ...options
    };
    
    this.eventHandlers = {
      textChange: [],
      selectionChange: [],
      editorChange: []
    };
  }

  /**
   * Initialize the Quill editor
   */
  init() {
    if (!this.container) {
      throw new Error('Container element is required');
    }

    this.quill = new Quill(this.container, this.options);

    // Set up event listeners
    this.quill.on('text-change', (delta, oldDelta, source) => {
      this.eventHandlers.textChange.forEach(handler => {
        handler(delta, oldDelta, source);
      });
    });

    this.quill.on('selection-change', (range, oldRange, source) => {
      this.eventHandlers.selectionChange.forEach(handler => {
        handler(range, oldRange, source);
      });
    });

    this.quill.on('editor-change', (eventType, ...args) => {
      this.eventHandlers.editorChange.forEach(handler => {
        handler(eventType, ...args);
      });
    });

    return this;
  }

  /**
   * Get the current content of the editor
   * @param {string} format - 'html', 'text', or 'delta'
   * @returns {string|object} Content in the specified format
   */
  getContent(format = 'html') {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }

    switch (format) {
      case 'html':
        return this.quill.root.innerHTML;
      case 'text':
        return this.quill.getText();
      case 'delta':
        return this.quill.getContents();
      default:
        return this.quill.root.innerHTML;
    }
  }

  /**
   * Set content in the editor
   * @param {string|object} content - Content to set
   * @param {string} format - 'html', 'text', or 'delta'
   */
  setContent(content, format = 'html') {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }

    switch (format) {
      case 'html':
        this.quill.root.innerHTML = content;
        break;
      case 'text':
        this.quill.setText(content);
        break;
      case 'delta':
        this.quill.setContents(content);
        break;
      default:
        this.quill.root.innerHTML = content;
    }
  }

  /**
   * Get the text content without formatting
   * @returns {string} Plain text content
   */
  getText() {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    return this.quill.getText();
  }

  /**
   * Set plain text content
   * @param {string} text - Text to set
   */
  setText(text) {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    this.quill.setText(text);
  }

  /**
   * Clear the editor content
   */
  clear() {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    this.quill.setText('');
  }

  
  enable(enabled = true) {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    this.quill.enable(enabled);
  }

  
  focus() {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    this.quill.focus();
  }

  
  blur() {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    this.quill.blur();
  }

  /**
   * Get the current selection
   * @returns {object} Selection range
   */
  getSelection() {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    return this.quill.getSelection();
  }

  /**
   * Set the selection
   * @param {number} index - Start index
   * @param {number} length - Length of selection
   */
  setSelection(index, length = 0) {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    this.quill.setSelection(index, length);
  }

  /**
   * Insert text at the current cursor position
   * @param {string} text - Text to insert
   */
  insertText(text) {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    const selection = this.quill.getSelection();
    const index = selection ? selection.index : 0;
    this.quill.insertText(index, text);
  }

  /**
   * Insert HTML at the current cursor position
   * @param {string} html - HTML to insert
   */
  insertHTML(html) {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    const selection = this.quill.getSelection();
    const index = selection ? selection.index : 0;
    this.quill.clipboard.dangerouslyPasteHTML(index, html);
  }

  /**
   * Add event listener
   * @param {string} event - Event type ('textChange', 'selectionChange', 'editorChange')
   * @param {function} handler - Event handler function
   */
  on(event, handler) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].push(handler);
    }
  }

  
  off(event, handler) {
    if (this.eventHandlers[event]) {
      const index = this.eventHandlers[event].indexOf(handler);
      if (index > -1) {
        this.eventHandlers[event].splice(index, 1);
      }
    }
  }

  /**
   * Get the Quill instance (for advanced usage)
   * @returns {Quill} The Quill instance
   */
  getQuill() {
    return this.quill;
  }

  /**
   * Destroy the editor and clean up
   */
  destroy() {
    if (this.quill) {
      // Clear event handlers
      Object.keys(this.eventHandlers).forEach(event => {
        this.eventHandlers[event] = [];
      });
      
      // Remove the editor
      this.quill = null;
      
      // Clear the container
      if (this.container) {
        this.container.innerHTML = '';
      }
    }
  }

  /**
   * Get editor statistics
   * @returns {object} Editor statistics
   */
  getStats() {
    if (!this.quill) {
      throw new Error('Editor not initialized. Call init() first.');
    }
    
    const text = this.quill.getText();
    const html = this.quill.root.innerHTML;
    
    return {
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, '').length,
      words: text.trim().split(/\s+/).filter(word => word.length > 0).length,
      lines: text.split('\n').length,
      htmlLength: html.length
    };
  }
}

export default QuillEditor; 