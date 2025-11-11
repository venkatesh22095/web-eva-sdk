import {pluginRegistry} from './plugin-registry';
import {codePlugin} from './plugins/code-plugin';
import {textPlugin} from './plugins/text-plugin';
import {chartPlugin} from './plugins/chart-plugin';

pluginRegistry.register(chartPlugin);
pluginRegistry.register(codePlugin);
pluginRegistry.register(textPlugin);

export function MessageRenderer(content) {
    // Get all plugins that can handle this content
    const plugins = pluginRegistry.getAllPlugins().filter(plugin => plugin.canHandle(content));
    
    // If no plugins can handle it, use the text plugin (which always returns true for canHandle)
    // const plugin =  textPlugin;
    const plugin = plugins[0] || textPlugin;
    
    return `<div class="message-renderer">${plugin.render(content)}</div>`;
}
