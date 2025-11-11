/**
 * QuillEditor Plugin Usage Examples
 * 
 * This file contains examples of how to use the QuillEditor plugin
 * with vanilla JavaScript, React, and Angular frameworks.
 */

// ========================================
// 1. VANILLA JAVASCRIPT EXAMPLE
// ========================================

/**
 * Basic Vanilla JavaScript usage
 */
function vanillaJavaScriptExample() {
  // Import the QuillEditor
  // import { QuillEditor } from 'eva-web-sdk';
  
  // Create a container element
  const container = document.createElement('div');
  container.className = 'eva-quill-editor';
  document.body.appendChild(container);
  
  // Initialize the editor
  const editor = new QuillEditor(container, {
    placeholder: 'Enter your text here...',
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image']
      ]
    }
  });
  
  // Initialize the editor
  editor.init();
  
  // Listen for text changes
  editor.on('textChange', (delta, oldDelta, source) => {
    console.log('Text changed:', editor.getText());
  });
  
  // Example of setting content
  editor.setContent('<p>Hello <strong>World</strong>!</p>');
  
  // Example of getting content
  const htmlContent = editor.getContent('html');
  const textContent = editor.getContent('text');
  
  console.log('HTML:', htmlContent);
  console.log('Text:', textContent);
  
  // Clean up when done
  // editor.destroy();
}

// ========================================
// 2. REACT EXAMPLE
// ========================================

/**
 * React Component Example
 */
const ReactQuillEditorExample = `
import React, { useEffect, useRef, useState } from 'react';
import { QuillEditor } from 'eva-web-sdk';

const RichTextEditor = ({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Enter your text...', 
  disabled = false,
  theme = 'light' // 'light' or 'dark'
}) => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      // Add appropriate CSS classes
      editorRef.current.className = \`eva-quill-editor \${theme === 'dark' ? 'dark-theme' : ''}\`;
      
      // Initialize the editor
      quillRef.current = new QuillEditor(editorRef.current, {
        placeholder,
        theme: 'snow',
        modules: {
          toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['clean'],
            ['link', 'image']
          ]
        }
      });

      quillRef.current.init();
      setIsReady(true);

      // Listen for text changes
      quillRef.current.on('textChange', (delta, oldDelta, source) => {
        if (source === 'user') {
          const content = quillRef.current.getContent('html');
          onChange(content);
        }
      });
    }
  }, [placeholder, theme]);

  useEffect(() => {
    if (quillRef.current && isReady && value !== quillRef.current.getContent('html')) {
      quillRef.current.setContent(value);
    }
  }, [value, isReady]);

  useEffect(() => {
    if (quillRef.current && isReady) {
      quillRef.current.enable(!disabled);
    }
  }, [disabled, isReady]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (quillRef.current) {
        quillRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="eva-quill-editor-wrapper">
      <div ref={editorRef} />
    </div>
  );
};

// Usage in a React component
const App = () => {
  const [content, setContent] = useState('<p>Initial content</p>');
  const [theme, setTheme] = useState('light');

  const handleContentChange = (newContent) => {
    setContent(newContent);
    console.log('Content changed:', newContent);
  };

  return (
    <div>
      <h1>Rich Text Editor Example</h1>
      
      <div>
        <label>
          <input 
            type="radio" 
            value="light" 
            checked={theme === 'light'} 
            onChange={(e) => setTheme(e.target.value)} 
          />
          Light Theme
        </label>
        <label>
          <input 
            type="radio" 
            value="dark" 
            checked={theme === 'dark'} 
            onChange={(e) => setTheme(e.target.value)} 
          />
          Dark Theme
        </label>
      </div>

      <RichTextEditor
        value={content}
        onChange={handleContentChange}
        placeholder="Start typing..."
        theme={theme}
      />
      
      <div>
        <h3>Current Content:</h3>
        <pre>{content}</pre>
      </div>
    </div>
  );
};

export default App;
`;

// ========================================
// 3. ANGULAR EXAMPLE
// ========================================

/**
 * Angular Component Example
 */
const AngularQuillEditorExample = `
// quill-editor.component.ts
import { 
  Component, 
  ElementRef, 
  ViewChild, 
  Input, 
  Output, 
  EventEmitter, 
  OnInit, 
  OnDestroy, 
  OnChanges, 
  SimpleChanges 
} from '@angular/core';
import { QuillEditor } from 'eva-web-sdk';

@Component({
  selector: 'app-quill-editor',
  template: \`
    <div class="eva-quill-editor-wrapper">
      <label *ngIf="label" class="eva-quill-editor-label">{{ label }}</label>
      <div 
        #editorContainer 
        [class]="getEditorClasses()"
      ></div>
      <div *ngIf="helperText" class="eva-quill-editor-help">{{ helperText }}</div>
      <div *ngIf="errorText" class="eva-quill-editor-error">{{ errorText }}</div>
      <div *ngIf="showCharacterCount" class="eva-quill-editor-character-count">
        {{ characterCount }} / {{ maxCharacters || '∞' }}
      </div>
    </div>
  \`,
  styleUrls: ['./quill-editor.component.css']
})
export class QuillEditorComponent implements OnInit, OnDestroy, OnChanges {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef;
  
  @Input() value: string = '';
  @Input() placeholder: string = 'Enter your text...';
  @Input() disabled: boolean = false;
  @Input() theme: 'light' | 'dark' = 'light';
  @Input() compact: boolean = false;
  @Input() label: string = '';
  @Input() helperText: string = '';
  @Input() errorText: string = '';
  @Input() showCharacterCount: boolean = false;
  @Input() maxCharacters: number | null = null;
  @Input() toolbar: any[] = [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image']
  ];
  
  @Output() valueChange = new EventEmitter<string>();
  @Output() textChange = new EventEmitter<any>();
  @Output() selectionChange = new EventEmitter<any>();
  @Output() focus = new EventEmitter<void>();
  @Output() blur = new EventEmitter<void>();
  
  private quillEditor: QuillEditor | null = null;
  private isReady: boolean = false;
  characterCount: number = 0;
  
  ngOnInit() {
    this.initializeEditor();
  }
  
  ngOnDestroy() {
    if (this.quillEditor) {
      this.quillEditor.destroy();
    }
  }
  
  ngOnChanges(changes: SimpleChanges) {
    if (this.quillEditor && this.isReady) {
      if (changes['value'] && changes['value'].currentValue !== this.quillEditor.getContent('html')) {
        this.quillEditor.setContent(changes['value'].currentValue);
      }
      
      if (changes['disabled']) {
        this.quillEditor.enable(!changes['disabled'].currentValue);
      }
    }
  }
  
  private initializeEditor() {
    if (this.editorContainer?.nativeElement) {
      this.quillEditor = new QuillEditor(this.editorContainer.nativeElement, {
        placeholder: this.placeholder,
        theme: 'snow',
        modules: {
          toolbar: this.toolbar
        }
      });
      
      this.quillEditor.init();
      this.isReady = true;
      
      // Set initial content
      if (this.value) {
        this.quillEditor.setContent(this.value);
      }
      
      // Set initial disabled state
      if (this.disabled) {
        this.quillEditor.enable(false);
      }
      
      // Set up event listeners
      this.setupEventListeners();
    }
  }
  
  private setupEventListeners() {
    if (!this.quillEditor) return;
    
    this.quillEditor.on('textChange', (delta, oldDelta, source) => {
      if (source === 'user') {
        const content = this.quillEditor!.getContent('html');
        this.characterCount = this.quillEditor!.getText().length;
        this.valueChange.emit(content);
        this.textChange.emit({ delta, oldDelta, source });
      }
    });
    
    this.quillEditor.on('selectionChange', (range, oldRange, source) => {
      this.selectionChange.emit({ range, oldRange, source });
    });
    
    // Add focus/blur listeners using the underlying Quill instance
    const quill = this.quillEditor.getQuill();
    if (quill) {
      quill.on('focus', () => this.focus.emit());
      quill.on('blur', () => this.blur.emit());
    }
  }
  
  getEditorClasses(): string {
    const classes = ['eva-quill-editor'];
    
    if (this.theme === 'dark') {
      classes.push('dark-theme');
    }
    
    if (this.compact) {
      classes.push('compact');
    }
    
    if (this.errorText) {
      classes.push('error');
    }
    
    return classes.join(' ');
  }
  
  // Public methods
  getContent(format: 'html' | 'text' | 'delta' = 'html'): string | object {
    return this.quillEditor?.getContent(format) || '';
  }
  
  setContent(content: string, format: 'html' | 'text' | 'delta' = 'html'): void {
    this.quillEditor?.setContent(content, format);
  }
  
  focusEditor(): void {
    this.quillEditor?.focus();
  }
  
  blurEditor(): void {
    this.quillEditor?.blur();
  }
  
  clearContent(): void {
    this.quillEditor?.clear();
  }
  
  insertText(text: string): void {
    this.quillEditor?.insertText(text);
  }
  
  insertHTML(html: string): void {
    this.quillEditor?.insertHTML(html);
  }
  
  getStats(): any {
    return this.quillEditor?.getStats();
  }
}

// app.module.ts
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { QuillEditorComponent } from './quill-editor.component';

@NgModule({
  declarations: [
    AppComponent,
    QuillEditorComponent
  ],
  imports: [
    BrowserModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

// app.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="container">
      <h1>Quill Editor Angular Example</h1>
      
      <div class="controls">
        <label>
          <input 
            type="radio" 
            value="light" 
            [(ngModel)]="theme" 
            name="theme"
          />
          Light Theme
        </label>
        <label>
          <input 
            type="radio" 
            value="dark" 
            [(ngModel)]="theme" 
            name="theme"
          />
          Dark Theme
        </label>
        <label>
          <input 
            type="checkbox" 
            [(ngModel)]="compact"
          />
          Compact Mode
        </label>
        <label>
          <input 
            type="checkbox" 
            [(ngModel)]="disabled"
          />
          Disabled
        </label>
      </div>
      
      <app-quill-editor
        [value]="content"
        (valueChange)="onContentChange($event)"
        (textChange)="onTextChange($event)"
        (selectionChange)="onSelectionChange($event)"
        (focus)="onFocus()"
        (blur)="onBlur()"
        [theme]="theme"
        [compact]="compact"
        [disabled]="disabled"
        [showCharacterCount]="true"
        [maxCharacters]="1000"
        label="Rich Text Editor"
        helperText="You can format your text using the toolbar above"
        placeholder="Start typing your content here..."
      ></app-quill-editor>
      
      <div class="output">
        <h3>Current Content:</h3>
        <pre>{{ content }}</pre>
      </div>
    </div>
  \`,
  styles: [\`
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .controls {
      margin-bottom: 20px;
    }
    
    .controls label {
      display: inline-block;
      margin-right: 20px;
      margin-bottom: 10px;
    }
    
    .output {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  \`]
})
export class AppComponent {
  content: string = '<p>Initial content with <strong>bold</strong> text</p>';
  theme: 'light' | 'dark' = 'light';
  compact: boolean = false;
  disabled: boolean = false;
  
  onContentChange(content: string) {
    this.content = content;
    console.log('Content changed:', content);
  }
  
  onTextChange(event: any) {
    console.log('Text change event:', event);
  }
  
  onSelectionChange(event: any) {
    console.log('Selection change event:', event);
  }
  
  onFocus() {
    console.log('Editor focused');
  }
  
  onBlur() {
    console.log('Editor blurred');
  }
}
`;

// ========================================
// 4. ADVANCED CONFIGURATION EXAMPLES
// ========================================

/**
 * Advanced Configuration Examples
 */
const AdvancedConfigurationExamples = `
// Custom toolbar configuration
const customToolbar = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'font': [] }],
  [{ 'size': ['small', false, 'large', 'huge'] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'color': [] }, { 'background': [] }],
  [{ 'script': 'sub'}, { 'script': 'super' }],
  ['blockquote', 'code-block'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],
  [{ 'direction': 'rtl' }],
  [{ 'align': [] }],
  ['link', 'image', 'video'],
  ['clean']
];

// Minimal toolbar for simple use cases
const minimalToolbar = [
  ['bold', 'italic', 'underline'],
  ['link']
];

// Create editor with custom configuration
const editor = new QuillEditor(container, {
  theme: 'snow',
  placeholder: 'Enter your text...',
  modules: {
    toolbar: customToolbar,
    // Add custom modules here if needed
  },
  formats: [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'direction', 'align',
    'link', 'image', 'video'
  ]
});

// Initialize and setup event handlers
editor.init();

// Advanced event handling
editor.on('textChange', (delta, oldDelta, source) => {
  const stats = editor.getStats();
  console.log('Words:', stats.words);
  console.log('Characters:', stats.characters);
  
  // Auto-save functionality
  if (source === 'user') {
    debounce(() => {
      saveContent(editor.getContent('html'));
    }, 1000);
  }
});

// Character limit enforcement
editor.on('textChange', (delta, oldDelta, source) => {
  const limit = 1000;
  const currentLength = editor.getText().length;
  
  if (currentLength > limit) {
    // Prevent further input
    editor.setContent(editor.getText().substring(0, limit));
    showWarning('Character limit exceeded!');
  }
});

// Custom image upload handler
const imageUploadHandler = () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  
  input.onchange = () => {
    const file = input.files[0];
    if (file) {
      // Upload file to your server
      uploadImage(file).then(url => {
        // Insert image into editor
        editor.insertHTML(\`<img src="\${url}" alt="Uploaded image" />\`);
      });
    }
  };
};

// Helper functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function saveContent(content) {
  // Implementation for saving content
  console.log('Saving content:', content);
}

function showWarning(message) {
  // Implementation for showing warning
  console.warn(message);
}

function uploadImage(file) {
  // Implementation for uploading image
  return new Promise((resolve) => {
    // Simulate upload
    setTimeout(() => {
      resolve('https://example.com/uploaded-image.jpg');
    }, 1000);
  });
}
`;

// Export all examples
export {
  vanillaJavaScriptExample,
  ReactQuillEditorExample,
  AngularQuillEditorExample,
  AdvancedConfigurationExamples
}; 