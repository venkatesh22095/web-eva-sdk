import _, { cloneDeep } from "lodash";
import { bookMarkChatThread, deleteHistory, getBookMarkedChatThreads, updateHistory } from "../redux/actions/global.action";
import { setAllHistory, setBookMarkedChatThreads } from "../redux/globalSlice";
import store from "../redux/store";

let bookMarkedThreadsOffset = 1;

const HistoryInterface = (props) => {
    let state = store.getState().global;

    // Subscribe to store updates
    const subscribe = (cb) => {
        let callback = cb;
        const unsubscribe = store.subscribe(() => {
            state = store.getState().global;
            // If callback exists and API call is completed, invoke it
            if (state.historyRes.status !== 'loading' && callback) {
                /*sort history by createdOn in descending order using lodash*/
                let _history = cloneDeep(state.AllHistory)
                _history.data = _.orderBy(_history.data, 'createdOn', 'desc')
                callback(_history, state.historyRes, state.bookMarkedChatThreads);
            }
        });

        // Return a function to unsubscribe
        return () => {
            unsubscribe();
        };
    };

    const deleteHistoryBoard = async (arg) => {
        const response = await store.dispatch(deleteHistory({ boardId: arg?.id }))
        if (response?.payload?.success) {
            let newHistory = { 
                ...state.AllHistory, 
                data: state.AllHistory.data.filter(item => item?.id !== response?.meta?.arg?.boardId)
              };
              
              store.dispatch(setAllHistory(newHistory));      
        }
    }

    const updateHistoryBoardName = async (arg) => {
        let params = {
            "boardId": arg?.boardId
        }
        let payload = {
            "name": arg?.newName
        }
        const response = await store.dispatch(updateHistory({ params, payload }))
        if (response) {
            let newBoard = state?.AllHistory?.data.map(b => {
                if(b.id === arg.boardId) {
                    b = response.payload
                }
                return b
            })
            let newHistory = {
                ...state.AllHistory,
                data: newBoard
            };
            store.dispatch(setAllHistory(newHistory));
        }
    }

    const fetchBookMarkedChatThread = async (arg) => {
        let params = {
            limit: arg?.limit || 10
        }
        const res = await store.dispatch(getBookMarkedChatThreads(params))
        let bookmarkedThreads = {
            ...res?.payload,
            boards: res?.payload?.boards?.map(boardItem => {
                boardItem = {...boardItem, bookMarked: true}
                return boardItem
            })
        }
        store.dispatch(setBookMarkedChatThreads(bookmarkedThreads))
    }

    const loadMoreBookMarkedChatThreads = async (arg) => {
        let _bookMarkedThreads = cloneDeep(state?.bookMarkedChatThreads)
        let params = {
            limit: arg?.limit || 10,
            offset: bookMarkedThreadsOffset* arg?.limit || 10
        }
        const res = await store.dispatch(getBookMarkedChatThreads(params))
        if(!!res?.payload) {
            _bookMarkedThreads = {
                ..._bookMarkedThreads,
                boards: [..._bookMarkedThreads?.boards, ...res?.payload?.boards], 
                moreAvailable: res?.payload?.moreAvailable
            }
            if(res?.payload?.moreAvailable) {
                bookMarkedThreadsOffset++
            }
            store.dispatch(setBookMarkedChatThreads(_bookMarkedThreads))
        }
    }

    const bookMarkChatThreadItem = async (item) => {
        const payload = {
            markAsStar: item?.bookMarked ? false : true
        }
        const params = {
            boardId: item?.id
        }
        const res = await store.dispatch(bookMarkChatThread({params, payload}))
        if(res?.payload?.[0] === "SUCCESS") {
            let _history = cloneDeep(state?.AllHistory)
            let _bookMarkedThreads = cloneDeep(state?.bookMarkedChatThreads)
            _history.data = _history?.data?.map(historyItem => {
                if(historyItem?.id === item?.id) {
                    historyItem = {...historyItem, bookMarked: !historyItem?.bookMarked}
                }
                return historyItem
            })
            if(item?.bookMarked) {
                _bookMarkedThreads.boards = _bookMarkedThreads?.boards?.filter(boardItem => boardItem?.id !== item?.id)
            }
            store.dispatch(setAllHistory(_history))
            store.dispatch(setBookMarkedChatThreads(_bookMarkedThreads))
        }
    }

    const updateHistoryBoardNameonSocketEvent = async (arg) => {
        let _history = cloneDeep(state?.AllHistory)
        _history.data = _history?.data?.map(historyItem => {
            if (historyItem?.id === arg?.id) {
                historyItem = { ...historyItem, name: arg?.name }
            }
            return historyItem
        })
        store.dispatch(setAllHistory(_history))
    }

    return {
        subscribe,
        deleteHistoryBoard,
        updateHistoryBoardName,
        fetchBookMarkedChatThread,
        loadMoreBookMarkedChatThreads,
        bookMarkChatThreadItem,
        updateHistoryBoardNameonSocketEvent
    }
}

export default HistoryInterface;