import RecentAgentsFunc from './RecentAgents';

// Extract individual functions for direct export
const recentAgentsInstance = RecentAgentsFunc();
export const renderRecentAgents = recentAgentsInstance.renderRecentAgents;
export const hideRecentAgentsDiv = recentAgentsInstance.hideRecentAgentsDiv;
export const unHideRecentAgentsDiv = recentAgentsInstance.unHideRecentAgentsDiv;

// Also keep the wrapper for backward compatibility
export { default as RecentAgentsFunc } from './RecentAgents';
