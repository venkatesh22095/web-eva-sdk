import BotConversation from "./chat/botAgent/getBotConversation";
// import CustomTemplateComponentManager from "./chat/botAgent/customTemplatesFolder/CustomTemplateComponentManager";
// import HoldConversationTemplateManager from "./chat/botAgent/customTemplatesFolder/HoldConversationTemplateManager";
import { fetchAgents, fetchConfigData, fetchProfileData, fetchHistory, fetchRecentFiles, presenceStart, getAllAnnouncements} from "./redux/actions/global.action";
import { setEnabledDebugging, setAppMetaData } from "./redux/globalSlice";
import store from "./redux/store";
import { WebSocketService } from "./socket/socket.service";
export const initializeSDK = async (config) => {
  const requiredKeys = ['accessToken', 'api_url', 'userId']
  let initialHistoryLimit = config?.initialHistoryLimit || 10;

  let misConfig = false;
  requiredKeys.map(key => {
    if(!Object.keys(config).includes(key)) {
      console.error(`SDK initialization error: '${key}' is required.`);
      misConfig = true
      return;
    }
  })

  // if(misConfig) return;
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && misConfig) return;

  // Set the SDK config globally
  window.sdkConfig = config;

  // making foundation api call once sdk initialized properly
  store.dispatch(fetchConfigData(config.userId))
  store.dispatch(fetchProfileData(config.userId))
  store.dispatch(fetchAgents({userId: config.userId}))
  store.dispatch(fetchHistory({onload: true, params: {limit: initialHistoryLimit}}))
  store.dispatch(fetchRecentFiles({onload: true, userId: config.userId, params: {limit: 10}}))
  store.dispatch(getAllAnnouncements({params: {userId: config.userId}}))
  store.dispatch(setAppMetaData(config.appMetaData))
  
  // once presenceStart call success than get the sToken which is required to connect socket
  await store.dispatch(presenceStart())

  //enablement of debugging i.e console.log statements
  store.dispatch(setEnabledDebugging(config.enableDebugging))

  // Initialize and connect WebSocket
  WebSocketService.initialize({
    url: config.presence_url,
    options: {
      query: {
        userid: config.userId,
        channels: 7,
        sToken: store.getState().global?.presenceStart?.data?.sToken,
        rnd: new Date().getTime(),
      },
    },
  });
  WebSocketService.connect();
  // WebSocketService.on("live", (data) => {
  //   console.log('sadfafafs')
  // })

};
