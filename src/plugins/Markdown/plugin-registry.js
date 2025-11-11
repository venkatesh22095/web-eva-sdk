export const pluginRegistry = (function() {
    let plugins = [];

    function register(plugin) {
        const index = plugins.findIndex(p => p.name === plugin.name);
        if (index >= 0) {
            plugins[index] = plugin;
        } else {
            plugins.push(plugin);
        }
        plugins.sort((a, b) => b.priority - a.priority);
    }

    function getPlugin(content) {
        return plugins.find(p => p.canHandle(content)) || null;
    }

    function getAllPlugins() {
        return [...plugins];
    }

    return {register, getPlugin, getAllPlugins};
})();
