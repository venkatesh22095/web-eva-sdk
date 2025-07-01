import { createSlice } from '@reduxjs/toolkit';
import { 
  advanceSearch, 
  fetchAgents, 
  fetchConfigData, 
  fetchProfileData, 
  fetchHistory,
  fetchRecentFiles, 
  getRecentFileDownloadUrl,
  searchSession,
  submitFeedback,
  presenceStart,
  getNotification
} from './actions/global.action';
import { handleAsyncActions } from '../utils/handleAsyncActions';
import { cloneDeep, concat, isEmpty, orderBy, uniqBy } from 'lodash';

const initialState = { 
  profile: {},
  config: {},
  allAgents: {},
  enabledAgents: null,
  recentAgents: null,
  advanceSearchRes: {},
  questions: {},
  activeBoardId: null,
  recentFilesRes: {},
  recentFiles: {},
  AllrecentFiles: {},
  currentQuestion: {},
  historyRes: {},
  history: {},
  AllHistory: {},
  recentFileDownloadUrl: {},
  // searchHistoryRes: {},
  chatHistoryMoreAvailable: false,
  fileTypes : null,
  selectedContext : {},
  maxAllowedFileSize : null,
  enabledCustomTemplates: {},
  GptUploadedFiles: null,
  submitFeedback: {},
  customData : {},
  presenceStart: {},
  chatInterfaceOptions: {},
  botTemplateElementReference: null,
  botSDkInstance: null,
  enableKoreBotSDK: false, // use to enable the bot sdk custom templates
  enableContextByFollowupContext: false, // use to set the context by followup context,
  errorState : [],
  notifications : {},
  bookMarkedChatThreads: [],
  enableDebugging: false,
  quickActions: []
};

const globalSlice = createSlice({
    name: 'global',
    initialState,
    reducers: {
      updateChatData: (state, action) => {
        state.questions = action.payload;
      },
      setActiveBoardId: (state, action) => {
        state.activeBoardId = action.payload;
      },
      setCurrentQuestion: (state, action) => {
        state.currentQuestion = action.payload;
      },
      setRecentFiles: (state, action) => {
        state.recentFiles = action.payload;
      },
      setAllRecentFiles: (state, action) => {
        state.AllrecentFiles = action.payload;
      },
      setAllHistory: (state, action) => {
        state.AllHistory = action.payload;
      },
      setChatHistoryMoreAvailable: (state, action) => {
        state.chatHistoryMoreAvailable = action.payload;
      },
      setSelectedContext : (state, action) => {
        state.selectedContext = action.payload;
      },
      setEnabledCustomTemplates : (state, action) => {
        state.enabledCustomTemplates = action.payload;
      },
      setGptUploadedFiles : (state, action) => {
        state.GptUploadedFiles = action.payload;
      },
      setCustomData : (state, action) => {
        state.customData = action.payload
      },
      setChatInterfaceOptions : (state, action) => {
        state.chatInterfaceOptions = action.payload;
      },
      setBotSDKInstance : (state, action) => {
        state.botSDkInstance = action.payload
      }, 
      setEnableKoreBotSDK: (state, action) => {
        state.enableKoreBotSDK = action.payload
      },
      setEnableContextByFollowupContext: (state, action) => {
        state.enableContextByFollowupContext = action.payload
      },  
      // deleteHistoryItem : (state, action) =>{
      //   state.AllHistory = action.payload
      // },
      // updateHistoryItem : (state, action) => {
      //   state.AllHistory = action.payload
      // }
      setErrorState: (state, action) => {
        state.errorState = action.payload
      },
      setNotifications: (state, action) => {
        state.notifications = action.payload
      },
	  setBookMarkedChatThreads: (state, action) => {
        state.bookMarkedChatThreads = action.payload
      },
      setEnabledDebugging: (state, action) => {
        state.enableDebugging = action.payload
      },
      setQuickActions: (state, action) => {
        state.quickActions = action.payload;
      },
    },
    extraReducers: (builder) => {
      handleAsyncActions(builder, fetchConfigData, 'config', (state, action) => {
        state.fileTypes = action.payload.fileTypes
        state.maxAllowedFileSize = action.payload.maxKnowledgeFileSize
      });
      handleAsyncActions(builder, fetchProfileData, 'profile');
      handleAsyncActions(builder, fetchAgents, 'allAgents', (state, action) => {
        let enabledAgents = action.payload.agents.filter(a => !!a?.enabled)
        state.enabledAgents = enabledAgents
        state.recentAgents = action.payload.recents
      });
      handleAsyncActions(builder, advanceSearch, 'advanceSearchRes', (state, action) => {
        /*
        update the botConversation of the conversation
        */
       if(action?.meta?.arg?.params?.from === "botAgent"){
         let botReqId = action?.meta?.arg?.params?.reqId
         let questions = cloneDeep(state?.questions)
         const currentBotAgentQuestion = Object.values(questions).find((ques) => ques.reqId === botReqId)
         if(currentBotAgentQuestion){      
          /*for history question we need to rely on id */    
          if(currentBotAgentQuestion?.historicalData){
            if(questions?.[currentBotAgentQuestion?.id]?.hasOwnProperty('botConversation')) {
              questions[currentBotAgentQuestion?.id].botConversation[action?.payload?.messageId] = {
                ...questions[currentBotAgentQuestion?.id].botConversation[action?.payload?.messageId],
                "status": action?.payload?.status,
                "answer": action?.payload?.answer
              }
            }
          }else{
            if (questions?.[currentBotAgentQuestion?.reqId]?.hasOwnProperty('botConversation')) {
              questions[currentBotAgentQuestion?.reqId].botConversation[action?.payload?.messageId] = {
                ...questions[currentBotAgentQuestion?.reqId].botConversation[action?.payload?.messageId],
                "status": action?.payload?.status,
                "answer": action?.payload?.answer
              }           
            }
          }
           state.questions = questions           
         }
         
       }
        console.log("state", "action", state, action)
      });
      handleAsyncActions(builder, fetchHistory, 'historyRes', (state, action)=> {
        if(action?.meta?.arg?.onload) {
          state.history = state.historyRes
          // state.AllHistory = state.historyRes
        }
        // if(action?.meta?.arg?.loadmore) {
          let allHistory = cloneDeep(state.AllHistory?.data) || []     
          if(action?.meta?.arg?.initialData) {
            allHistory = state.historyRes?.data?.boards
          } else {
            allHistory = uniqBy(concat(allHistory, state.historyRes?.data?.boards), 'id')
          }
			allHistory = allHistory?.map(item => {
				item = {...item, bookMarked: item?.pinnedAt > 0}
			return item
		  })
          state.AllHistory.data = allHistory
          state.AllHistory.status = state.historyRes.status
          state.AllHistory.error = state.historyRes.error
          state.AllHistory.hasMore = state.historyRes?.data?.moreAvailable
        // }
      });
      handleAsyncActions(builder, fetchRecentFiles, 'recentFilesRes', (state, action)=> {
        if(action?.meta?.arg?.onload) {
          state.recentFiles = state.recentFilesRes
          state.AllrecentFiles = state.recentFilesRes
        }
        if(action?.meta?.arg?.loadmore) {
          let AllrecentFiles = cloneDeep(state.AllrecentFiles?.data?.files)
          AllrecentFiles = uniqBy(concat(AllrecentFiles, state.recentFilesRes?.data?.files), 'id')
          state.AllrecentFiles.data.files = AllrecentFiles
          state.AllrecentFiles.status = state.recentFilesRes.status
          state.AllrecentFiles.error = state.recentFilesRes.error
        }
      });
      handleAsyncActions(builder, searchSession, 'selectedContext')
      handleAsyncActions(builder, getRecentFileDownloadUrl, 'recentFileDownloadUrl');
      handleAsyncActions(builder, submitFeedback, 'submitFeedback', (state, action)=> {
        // feedback logic to update questions
        let questions = cloneDeep(state.questions)
        //As we started to support feedback for the individual volley of a threaded conversation, we need to update the botConversation with the feedback
        const isThreadedQuestion = Object.values(questions)?.find(q => q.messageId === action.payload?.data?.pId) || {}
        if(!isEmpty(isThreadedQuestion?.botConversation)){
          questions[[action.meta.arg.cId]].botConversation[action.payload?.data?.messageId] = action.payload?.data
        }else{
          questions[[action.meta.arg.cId]] = { ...questions[[action.meta.arg.cId]], ...action.payload.data }
        }
                  
        state.questions = questions
      });
      handleAsyncActions(builder, presenceStart, 'presenceStart');
    }
});

// Export actions
export const { 
  updateChatData,
  setActiveBoardId,
  setCurrentQuestion,
  setRecentFiles,
  setAllHistory,
  setAllRecentFiles,
  // deleteHistoryItem,
  // updateHistoryItem,
  setChatHistoryMoreAvailable,
  setSelectedContext,
  setEnabledCustomTemplates,
  setGptUploadedFiles, 
  setCustomData,
  setChatInterfaceOptions,
  setBotSDKInstance,
  setEnableKoreBotSDK,
  setEnableContextByFollowupContext,
  setErrorState,
  setNotifications,
  setBookMarkedChatThreads,
  setEnabledDebugging,
	setQuickActions
} = globalSlice.actions;

export default globalSlice;