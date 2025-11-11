import ComposeBar from "./ComposeBar";

function RenderComposeBar(targetDiv, options = {}) {
    // Default options
    const defaultOptions = {
        placeholder: 'Ask question or Search Anything...',
        showQuickActions: true,
        showNewButton: true,
        showStopButton: true,
        ...options
    };

    try {
        // Create and return ComposeBar instance
        const composeBar = new ComposeBar(targetDiv, defaultOptions);
        return composeBar;
    } catch (error) {
        console.error('Failed to initialize ComposeBar:', error);
        throw error;
    }
}

export default RenderComposeBar;
