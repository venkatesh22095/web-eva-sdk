import { cloneDeep } from "lodash";
import { default as fileUpload } from "../Attachments/fileUpload.js";
import store from "../redux/store.js";
import { attachmentIcon, createDeleteIcon } from "../templateRenderer/icons-library.js";
import { getFileExtension } from "../utils/helpers.js";


const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${size} ${sizes[i]}`;
};


const formatDate = (date) => {
    if (!date) return '';
    
    try {
        const d = new Date(date);
        const now = new Date();
        const diffTime = Math.abs(now - d);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        
        return d.toLocaleDateString();
    } catch (error) {
        return '';
    }
};

const handleFileAttach = (e, file, options = {}) => {
    try {
        fileUpload().setAttachmentContext(file);       
        
    } catch (error) {
        console.error('Error attaching file:', error);
    }
    finally{
        /*close the modal */
        if (options.onFileClose && typeof options.onFileClose === 'function') {
            options.onFileClose();
        }
    }
};



const renderRecentFilesList = (targetEl, files, listType = 'recent', options = {}) => {
    if (!files || files.length === 0) {
        targetEl.innerHTML = `<li class="no-files-message">No recent files found</li>`;
        return;
    }

    // Generate HTML for each file
    const itemsHtml = files.map(file => {
        const safeName = (file?.name || file?.fileName || 'Untitled').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const fileExtension = getFileExtension(file?.name || file?.fileName || '');
        const fileSize = formatFileSize(file?.size);        
        const lastModified = formatDate(file?.lastModified || file?.updatedAt);

        return `<li class="eva-file-item" data-file-id="${file.id || file.fileId}" data-file-type="${listType}">
            <div class="file-icon"><img src="images/${fileExtension}.png" alt=''/></div>
            <div class="file-details">
                <div class="file-name" title="${safeName}">${safeName}</div>
                <div class="file-meta">
                    <span class="file-extension">${fileExtension}</span>
                    ${fileSize ? `<span>•</span><span class="file-size">${fileSize}</span>` : ''}
                    ${lastModified ? `<span>•</span><span class="file-date">${lastModified}</span>` : ''}
                </div>
            </div>            
        </li>`;
    }).join('');

    targetEl.innerHTML = itemsHtml;

    // Attach click handlers
    targetEl.querySelectorAll('.eva-file-item').forEach(item => {
        // Main file item click (attach file)
        item.addEventListener('click', (e) => {
            // Don't trigger if clicking on action buttons
            if (e.target.closest('.file-action-btn')) return;

            const fileId = item.getAttribute('data-file-id');
            const file = files.find(f => String(f.id || f.fileId) === String(fileId));
            if (!file) return;

            handleFileAttach(e, file, options);
        });

        // Attach button click
        const attachBtn = item.querySelector('.attach-btn');
        if (attachBtn) {
            attachBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const fileId = item.getAttribute('data-file-id');
                const file = files.find(f => String(f.id || f.fileId) === String(fileId));
                if (!file) return;

                handleFileAttach(e, file, options);
            });
        }
        
    });
};


const renderRecentFiles = (targetEl, options = {}) => {
    try {
        const state = store.getState();
        const files = state?.global?.AllrecentFiles?.data?.files || [];
        renderRecentFilesList(targetEl, files, 'recent', options);
    } catch (error) {
        console.error('Error rendering recent files:', error);
        targetEl.innerHTML = `<li class="error-message">Failed to load recent files</li>`;
    }
};

export { 
    renderRecentFilesList, 
    renderRecentFiles,        
    formatFileSize,
    formatDate,
    handleFileAttach
};