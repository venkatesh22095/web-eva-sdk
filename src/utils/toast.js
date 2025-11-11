/**
 * Toast Notification System
 * A simple, lightweight toast notification system that can be used from anywhere
 * 
 * Usage:
 * import { toast } from '../utils/toast.js';
 * 
 * toast.success('Operation completed successfully!');
 * toast.error('Something went wrong!');
 * toast.warning('Please check your input');
 * toast.info('New update available');
 * 
 * // Custom options
 * toast('Custom message', { type: 'success', duration: 5000, position: 'top-right' });
 */

let container = null;

function initToastSystem() {
    // Create toast container if it doesn't exist
    createContainer();

    // Add styles if not already added
    addStyles();
}

function createContainer() {
    if (container) return;

    container = document.createElement('div');
    container.id = 'eva-toast-container';
    container.className = 'eva-toast-container';
    document.body.appendChild(container);
}

function addStyles() {
    if (document.getElementById('eva-toast-styles')) return;

    const styles = document.createElement('style');
    styles.id = 'eva-toast-styles';
    styles.textContent = `
            .eva-toast-container {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10000;
                pointer-events: none;
                max-width: 400px;
            }

            .eva-toast {
                pointer-events: auto;
                background: white;
                border:.0625rem solid #6ce9a6;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                margin-bottom: 12px;
                padding: 16px 20px;
                display: flex;
                align-items: flex-start;
                gap: 12px;                
                position: relative;
                animation: toastSlideIn 0.3s ease-out;
                transition: all 0.3s ease;
                word-wrap: break-word;
                max-width: 100%;
            }

            .eva-toast.removing {
                animation: toastSlideOut 0.3s ease-in forwards;
            }

            .eva-toast.success {                
                background: #f0fdf4;
            }

            .eva-toast.error {
                border-left-color: #ef4444;
                background: #fef2f2;
            }

            .eva-toast.warning {
                border-left-color: #f59e0b;
                background: #fffbeb;
            }

            .eva-toast.info {
                border-left-color: #3b82f6;
                background: #eff6ff;
            }

            .eva-toast-icon {
                flex-shrink: 0;
                width: 20px;
                height: 20px;
                margin-top: 1px;
            }

            .eva-toast-content {
                flex: 1;
                min-width: 0;
            }

            .eva-toast-title {
                font-weight: 600;
                font-size: 14px;
                line-height: 1.4;
                margin: 0 0 4px 0;
                color: #111827;
            }

            .eva-toast-message {
                font-size: 14px;
                line-height: 1.4;
                color: #6b7280;
                margin: 0;
            }

            .eva-toast-close {
                flex-shrink: 0;
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                transition: color 0.2s ease;
            }

            .eva-toast-close:hover {
                color: #6b7280;
                background: rgba(0, 0, 0, 0.05);
            }

            .eva-toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 2px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 0 0 8px 8px;
                transition: width linear;
            }

            .eva-toast.success .eva-toast-progress {
                background: #10b981;
            }

            .eva-toast.error .eva-toast-progress {
                background: #ef4444;
            }

            .eva-toast.warning .eva-toast-progress {
                background: #f59e0b;
            }

            .eva-toast.info .eva-toast-progress {
                background: #3b82f6;
            }

            @keyframes toastSlideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes toastSlideOut {
                to {
                    transform: translateX(100%);
                    opacity: 0;
                    margin-bottom: 0;
                    padding-top: 0;
                    padding-bottom: 0;
                    max-height: 0;
                }
            }

            /* Mobile responsiveness */
            @media (max-width: 640px) {
                .eva-toast-container {
                    left: 16px;
                    right: 16px;
                    top: 16px;
                    transform: none;
                    max-width: none;
                }

                .eva-toast {
                    margin-bottom: 8px;
                    padding: 12px 16px;
                }
            }
        `;
    document.head.appendChild(styles);
}

function getIcon(type) {
    const icons = {
        success: `<svg viewBox="0 0 20 20" fill="currentColor" style="color: #10b981;">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>`,
        error: `<svg viewBox="0 0 20 20" fill="currentColor" style="color: #ef4444;">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>`,
        warning: `<svg viewBox="0 0 20 20" fill="currentColor" style="color: #f59e0b;">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>`,
        info: `<svg viewBox="0 0 20 20" fill="currentColor" style="color: #3b82f6;">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>`
    };
    return icons[type] || icons.info;
}

function showToast(message, options = {}) {
    const config = {
        type: 'info',
        title: '',
        duration: 4000,
        closable: false,
        showProgress: false,
        ...options
    };

    const toastId = `toast-${Date.now()}`;

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `eva-toast ${config.type}`;
    toast.setAttribute('data-toast-id', toastId);

    // Build toast content
    let content = `
            <div class="eva-toast-icon">
                ${getIcon(config.type)}
            </div>
            <div class="eva-toast-content">
                ${config.title ? `<div class="eva-toast-title">${escapeHtml(config.title)}</div>` : ''}
                <div class="eva-toast-message">${escapeHtml(message)}</div>
            </div>
        `;

    if (config.closable) {
        content += `
                <button class="eva-toast-close" data-action="close">
                    <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            `;
    }

    if (config.showProgress && config.duration > 0) {
        content += '<div class="eva-toast-progress"></div>';
    }

    toast.innerHTML = content;

    // Add event listeners
    if (config.closable) {
        const closeBtn = toast.querySelector('[data-action="close"]');
        closeBtn.addEventListener('click', () => removeToast(toastId));
    }

    // Add to container
    container.appendChild(toast);


    // Set up auto-dismiss
    if (config.duration > 0) {
        setupAutoDismiss(toastId, config.duration, config.showProgress);
    }

    return toastId;
}

function setupAutoDismiss(toastId, duration, showProgress) {
    const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (!toastElement) return;

    const element = toastElement;

    if (showProgress) {
        const progressBar = element.querySelector('.eva-toast-progress');
        if (progressBar) {
            // Animate progress bar
            progressBar.style.width = '100%';
            progressBar.style.transition = `width ${duration}ms linear`;

            // Use requestAnimationFrame to ensure the initial state is applied
            requestAnimationFrame(() => {
                progressBar.style.width = '0%';
            });
        }
    }

    // Set timeout for auto-dismiss
    toastElement.timeoutId = setTimeout(() => {
        removeToast(toastId);
    }, duration);
}

function removeToast(toastId) {
    const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`);
    if (!toastElement) return;

    const element = toastElement;
    const timeoutId = toastElement.timeoutId;

    // Clear timeout if exists
    if (timeoutId) {
        clearTimeout(timeoutId);
    }

    // Add removing class for animation
    element.classList.add('removing');

    // Remove after animation
    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
        toastElement.remove();
    }, 300);
}


function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Main toast function
function toast(message, options = {}) {
    // Initialize the system on first use
    initToastSystem();

    return showToast(message, options);
}

toast.success = (message, options = {}) => {
    return toast(message, { ...options, type: 'success' });
};

toast.error = (message, options = {}) => {
    return toast(message, { ...options, type: 'error' });
};

toast.warning = (message, options = {}) => {
    return toast(message, { ...options, type: 'warning' });
};

toast.info = (message, options = {}) => {
    return toast(message, { ...options, type: 'info' });
};

// Utility methods
toast.remove = (toastId) => {
    return removeToast(toastId);
};


// Export the toast function
export default toast;