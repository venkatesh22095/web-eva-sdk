import { use, useEffect, useRef, useState } from "react"
import deleteChatThread from "../history/deleteHistoryData"
import updateHistoryData from "../history/updateHistoryData"
import { HistoryData, HistoryInterface, LoadMoreHistoryData } from "../history"
import { JoinChatThread } from "../chat"
import { LoadMoreRecentFiles, RecentFiles } from "../files"
import getBookMarkedChatThreads from "../history/getBookMarkedChatThreads"
import bookMarkChatThread from "../history/bookMarkChatThread"
import loadMoreBookMarkedChatThreads from "../history/loadMoreBookMarkedChatThreads"
import RecentAgentsFunc from "../LandingPageRecentAgents/RecentAgents"
const {hideRecentAgentsDiv} = RecentAgentsFunc();
import store from "../redux/store"

const History = (props) => {
    const [historyData, setHistoryData] = useState(null)
    const [bookMarkedThreads, setBookMarkedThreads] = useState(null)
    const historyInterface = useRef()
    const recentFilesInterface = useRef()
    const state = store.getState().global

    useEffect(() => {
        // fetchHistoryData()

        // Create an instance of HistoryInterface
        historyInterface.current = HistoryInterface();
        recentFilesInterface.current = RecentFiles();
        getBookMarkedThreads()

        // Subscribe to updates
        const unsubscribe = historyInterface.current.subscribe((allhistoryData, apiRes, bookMarkedChatThreads) => {
            // Handle the API response data
            if(state?.enableDebugging) {
                console.log('Received data from History API:', allhistoryData, apiRes, bookMarkedChatThreads);
            }
            setHistoryData(allhistoryData)
            setBookMarkedThreads(bookMarkedChatThreads)
        });

        // recentFilesInterface.current.subscribe((allRecentFilesData, apiRes) => {
        //     console.log('Received data from Recent Files API:', allRecentFilesData, apiRes);
        // })


        // Cleanup on component unmount
        return () => {
            // Unsubscribe from store updates
            unsubscribe();
        };
    }, [])
    

    // const fetchHistoryData = async () => {
    //     const res = await HistoryData()
    //     console.log('history', res)
    // }

    const fetchLoadMoreHistoryInitial = async () => {
        const res = await LoadMoreHistoryData({limit: 20, initialData: true})
        // console.log('All History', res)
    }

    const fetchRecentFilesInitial = async () => {
        const res = await LoadMoreRecentFiles({limit: 20, initialData: true})   
        // console.log('All Recent Files', res)
    }

    const fetchLoadMoreHistory = async () => {
        const res = await LoadMoreHistoryData({limit: 10})
        // console.log('All History', res)
    }

    const editNamePopup = (item) => {
        const inputText = document.createElement('input')
        inputText.type = 'text'
        inputText.id = `historyName-${item?.id}`
        inputText.value = item?.name

        const updateButton = document.createElement('button')
        updateButton.innerText = "Update"
        updateButton.addEventListener('click', (e) => changeHistoryBoardName(e,item))

        const respectiveHistoryTab = document.querySelector(`.historyGrp-${item?.id}`)
        respectiveHistoryTab.appendChild(inputText)
        respectiveHistoryTab.appendChild(updateButton)
    }

    const changeHistoryBoardName = (e, item) => {
        e?.preventDefault();
        let updatedNameText = document.getElementById(`historyName-${item?.id}`)
        let updatedName = updatedNameText?.value
        updateHistoryData({ boardId: item?.id, newName: updatedName })
    }

    const joinChatHistory = (board) => {
        hideRecentAgentsDiv('recent-agents-container')
        JoinChatThread({ boardId: board?.id })
    };

    const getBookMarkedThreads = () => {
        getBookMarkedChatThreads({limit: 10})
    }

    const loadMoreBookMarkedThreads = () => {
        loadMoreBookMarkedChatThreads({limit: 10})
    }

    const bookMarkChatThreadItem = (item) => {
        bookMarkChatThread(item)
    }

    return (
        <div className="history-section">
            {/* <div className="history-heading">History</div> */}
            
            {/* <button onClick={fetchLoadMoreHistoryInitial}>Initial history data with custom param</button> */}
            <div className="history-list">
                {historyData?.data?.length > 0 && historyData?.data?.map(item => {
                    return (
                        <div id={`historyGrp-${item?.id}`} className="history-item" onClick={()=> joinChatHistory(item)} key={item?.id}>
                            {/* <button onClick={(e) => { e.preventDefault();  e?.stopPropagation();deleteChatThread(item) }}>Delete</button> */}
                            <span>{item?.name}</span>
                            {/* <button onClick={(e) => { e.preventDefault();  e?.stopPropagation();editNamePopup(item) }}>Edit</button> */}
                            {/* <button onClick={(e) => { e.preventDefault(); e?.stopPropagation(); bookMarkChatThreadItem(item) }}>{item?.bookMarked ? 'UnBook Mark' : 'Book Mark'}</button> */}
                        </div>
                    )
                })}
                <div className="history-loadmore"><button className="loadmore-btn" onClick={fetchLoadMoreHistory}>Load more history</button></div>
            </div>
            {/* <div>
                <h1>Book Marked Chat Thread</h1>
                <button onClick={getBookMarkedThreads}>Get Book Marked Chat Threads</button>
                <button onClick={loadMoreBookMarkedThreads}>Get More Book Marked Chat Threads</button>
                {bookMarkedThreads?.boards?.length > 0 && bookMarkedThreads?.boards?.map(item => {
                    return (
                        <div className={`bookMarkedGrp-${item?.id}`} onClick={()=> joinChatHistory(item)}>
                            <span>{item?.name}</span>
                            <button onClick={(e) => { e.preventDefault(); e?.stopPropagation(); bookMarkChatThreadItem(item) }}>UnBook Mark</button>
                        </div>
                    )
                })}
            </div>
            <div>
                <h1>Recent Files</h1>
                <button onClick={fetchRecentFilesInitial}>Initial Recent files data with custom param</button>
                <button onClick={fetchLoadMoreHistory}>Load more Recent files</button>                
            </div>             */}
        </div>
    )
}

export default History