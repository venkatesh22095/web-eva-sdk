import { CheckCircle, createCopyIcon } from "../icons-library";
import { toast } from "../../chat";

function render(data, type = 'question') {
    let messageTextId = '', copyButtonId = '', messageDivId = '';
    messageTextId = `message-text-${data?.messageId || data?.reqId}`;
    copyButtonId = `copy-btn-${data?.messageId || data?.reqId}`;
    messageDivId = `copy-message-${data?.messageId || data?.reqId}`;
    if (type === 'answer') {        
        copyButtonId = `copyAnswerButton-${data?.messageId}`;
        messageDivId = `copyAnswerMessage-${data?.messageId}`;
    }

    let timeout;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        const copyButton = document.getElementById(copyButtonId);
        if (copyButton) {
            // Add click event for copying text
            copyButton.addEventListener('click', () => {
                if (type === 'answer') {
                    const messageDiv = document.querySelector(`#answer-${data?.messageId} .message-renderer`);
                    if (messageDiv) {
                        const htmlData = messageDiv.outerHTML;
                        const blob = new Blob([htmlData], { type: 'text/html' });
                        const clipboardItem = new ClipboardItem({ 'text/html': blob });
                        navigator.clipboard.write([clipboardItem])
                            .then(() => console.log('Copied with formatting!'))
                            .catch(err => console.error('Clipboard copy failed:', err));
                    }else{
                        navigator.clipboard.writeText(data?.answer);
                    }
                } else {
                    const messageText = document.getElementById(messageTextId);
                    if (messageText) {
                        navigator.clipboard.writeText(messageText.textContent);
                        const composeBarInput = document.querySelector('.eva-compose-textarea');
                        if (!composeBarInput?.value?.length) {
                            composeBarInput.value = messageText.textContent;
                            // Trigger input event to update ComposeBar's internal state                        
                            const inputEvent = new Event('input', { bubbles: true });
                            composeBarInput.dispatchEvent(inputEvent);
                        }
                    }
                }
                // Show the message div
                const messageDiv = document.getElementById(messageDivId);
                if (messageDiv) {
                    messageDiv.style.display = 'flex';

                    // Hide the message div after 1 second
                    setTimeout(() => {
                        messageDiv.style.display = 'none';
                    }, 3000);
                }


            });

            // Find the parent message-content div
            const messageContent = copyButton.closest('.message-content');
            // if(messageContent) {
            //     // Ensure relative positioning for absolute positioning to work
            //     if(getComputedStyle(messageContent).position === 'static') {
            //         messageContent.style.position = 'relative';
            //     }

            //     // Show copy icon on hover
            //     messageContent.addEventListener('mouseenter', () => {
            //         copyButton.style.opacity = '1';
            //     });

            //     // Hide copy icon when not hovering
            //     messageContent.addEventListener('mouseleave', () => {
            //         copyButton.style.opacity = '0';
            //     });
            // }
        }
    }, 1000);

    return `
    <sl-tooltip content="Copy Response" placement="bottom">
        <div class='questcopy' id='${copyButtonId}'>
            ${createCopyIcon({ size: 16, color: '#666', className: 'questcopy-icon' })}
        </div>
    </sl-tooltip>
    <div id='${messageDivId}' class='copy-message wa-dropdown-enter-anim'>        
        <div class='copy-message-icon'>
            ${CheckCircle({ size: 16, color: '#039855' })}
        </div>
        <div class='copy-message-text'>Copied to Clipboard</div>
    </div>
    `
}

export { render };