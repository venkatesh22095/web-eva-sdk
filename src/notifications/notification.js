import { cloneDeep, isEmpty } from "lodash"
import { JoinChatThread } from "../chat"
import { getNotification, readNotification } from "../redux/actions/global.action"
import { setNotifications } from "../redux/globalSlice"
import store from "../redux/store"

const Notification = () => {
    let state = store.getState().global

    const subscribe = (cb) => {
        let callback = cb;
        const unsubscribe = store.subscribe(() => {
            state = store.getState().global;
            callback(state?.notifications?.notifications, state?.notifications?.hasMore, state?.notifications?.bell, state?.notifications?.alert);
        });

        return () => {
            unsubscribe();
        };
    };

    const getNotifications = async () => {
        //Method to get notifications
        let userId = state?.profile?.data?.id
        const res = await store.dispatch(getNotification({userId}))
        /*bell count object format should be changed */
        store.dispatch(setNotifications(res.payload))
    }

    const notifyLatestNotification = async (notification) => {
        if(notification?.nStats?.bell === 0) return;
        /*we should not honor the alerts that are coming for badge count, to do so added the below condition */
        if(notification?.channels?.includes("bell")) return;
        //Method to notify the latest notification
        let _notificationState = cloneDeep(state?.notifications);
        _notificationState.bell = { 'bell': notification?.nStats?.bell };
        let alerts = _notificationState?.alert?.length ? _notificationState?.alert : [];
        alerts.unshift({message : notification?.notification, cd : notification?.customdata});
        _notificationState.alert = alerts;
        store.dispatch(setNotifications(_notificationState))
    }

    const redirectToNotificationChatThread = async (notification) => {
        /* adding the logic to change the 'read' state of the notification if it is unread */
        if (!notification?.isRead) {
            await markNotificationAsRead(notification)
        }
        let reqdBoardId = notification?.cd?.ed?.payload?.boardId
        JoinChatThread({ boardId: reqdBoardId, redirectFromNotification: true })

    }

    const getMoreNotifications = async () => {
        let limit = 20;
        let offset = state?.notifications?.notifications?.length;
        let userId = state?.profile?.data?.id
        const res = await store.dispatch(getNotification({userId, limit, offset, loadMore: true}))
        let _notificationState = cloneDeep(state?.notifications);
        _notificationState.notifications = [..._notificationState.notifications, ...res.payload.notifications]
        _notificationState.hasMore = res.payload.hasMore
        _notificationState.bell = res.payload.bell
        store.dispatch(setNotifications(_notificationState))
    }

    const markAllAsRead = async () => {
        //Method to mark all the notifications that are displayedas read        
        let userId = state?.profile?.data?.id
        let payload;
        //If alert is there, sending the id of alert to the backend, once we get the response, will send the latest notification id to the backend
        //Also need to check with the backed team, if we send the latest alert id, will it work or not
        if (state?.notifications?.alert?.length > 0) {
            payload = {
                "readTill": state?.notifications?.alert?.[0]?.cd?.nId
            }
            const alertNotificationRes = await store.dispatch(readNotification({ userId, payload }))
            console.log("alertNotificationRes", alertNotificationRes)
        }

        payload = {
            "readTill": state?.notifications?.notifications?.[0]?._id
        }
        /*get the total notifications to update the isRead state of the notifications*/
        const res = await store.dispatch(readNotification({ userId, payload }))
        /*in case alert is there, when clicked on mark all as read, need to mark read for that alert as well */
        if (res?.payload?.SUCCESS) {
            let wholeNotifications = [];
            let _notificationState = cloneDeep(state?.notifications);
            wholeNotifications = _notificationState?.notifications
            if (_notificationState?.alert?.length > 0) {
                wholeNotifications = [..._notificationState?.alert, ..._notificationState?.notifications]
                delete _notificationState?.alert;
            }
            else {
                wholeNotifications = _notificationState?.notifications
            }

            _notificationState.notifications = wholeNotifications?.map(notification => {
                notification.isRead = true;
                return notification;
            });
            /*Bell count is should be update to 0, as all notifications are read */
            _notificationState.bell = { bell: 0 };
            store.dispatch(setNotifications(_notificationState))
        }
    }

    const redirectToLatestAlert = async (notification) => {
        //Method to redirect to the latest alert
        /*the below read method is handled in  redirectToNotificationChatThread, so commenting the below*/
        let id = notification?.cd?.nId
        // let userId = state?.profile?.data?.id
        // let payload = {
        //     "read": id
        // }
        // const res = await store.dispatch(readNotification({userId, payload}))        
        redirectToNotificationChatThread(notification)

        // Clearing the alert from the state
        // let _notificationState = cloneDeep(state?.notifications);
        // _notificationState.alert = _notificationState.alert.filter(alert => alert?.cd?.nId !== id)
        // _notificationState.bell = _notificationState.bell - 1;
        // store.dispatch(setNotifications(_notificationState))
    }

    const clearNotifications = async () => {
       store.dispatch(setNotifications({}))
    }

    const markNotificationAsRead = async (notification) => {
        if(notification?.isRead) return;
        let userId = state?.profile?.data?.id
        let id = notification?.cd?.nId || notification?._id 
        let payload = {
            "read": id
        }   
        const res = await store.dispatch(readNotification({userId, payload}))
        if(res?.payload?.SUCCESS){
            let _notificationState;
            if(isEmpty(state?.notifications)){
                getMoreNotifications();
            }
            _notificationState = cloneDeep(state?.notifications);
            if(_notificationState?.hasOwnProperty("alert")){
                //Clearing the alert from the state                
                _notificationState.alert = _notificationState.alert.filter(alert => alert?.cd?.nId !== id)                            

            }else{
                _notificationState.notifications = _notificationState.notifications.map(notification => {
                    if ((notification?.cd?.nId || notification?._id) === id) {
                        notification.isRead = true;
                    }
                    return notification;
                });
            }
            if (_notificationState?.bell?.bell){
                _notificationState.bell = { 'bell': _notificationState?.bell?.bell - 1 };   
            }            
            store.dispatch(setNotifications(_notificationState))
            if(state?.enableDebugging){
                console.log("notification marked as read: ", id)
            }
        }
        
    }

    return {
        subscribe,
        getNotifications,
        notifyLatestNotification,
        redirectToNotificationChatThread,
        getMoreNotifications,
        markAllAsRead,
        redirectToLatestAlert,
        clearNotifications,
        markNotificationAsRead
    }
}

export default Notification;