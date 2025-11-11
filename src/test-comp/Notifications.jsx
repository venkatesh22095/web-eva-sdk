import React, { useEffect, useRef, useState } from "react";
import Notification from "../notifications/notification";
import store from "../redux/store";

const Notifications = () => {

    const NotificationRef = useRef()
    const [notifications, setNotifications] = useState([])
    const [hasMore, setHasMore] = useState(false)
    const [notifyAlert, setNotifyAlert] = useState(false)
    const [notificationsCount, setNotificationsCount] = useState(0)
    const state = store.getState().global

    useEffect(() => {
        NotificationRef.current = Notification()
        NotificationRef.current.subscribe((notifications, hasMore, unreadCount, alerts) => {
            setNotifications(notifications)
            setHasMore(hasMore)
            setNotifyAlert(alerts)
            setNotificationsCount(unreadCount?.bell)
            if(state?.enableDebugging) {
                console.log("notifications", notifications, hasMore, unreadCount, alerts)
            }
            
        })
    }, [])
    return (
        <>
            <h1>Notifications</h1>
            {<h2>Unread Notifications: {notificationsCount}</h2>}
            {notifyAlert?.length > 0 && notifyAlert?.map((alert, index) => {
                return <div key={index} onClick={() => NotificationRef.current.redirectToLatestAlert(alert)}>{alert?.message?.title}</div>
            })}            
            {notifications?.map((notification, index) => {
                return (<>
                    <div key={index} onClick={() => NotificationRef.current.redirectToNotificationChatThread(notification)}>
                        <h3>{notification?.message?.title}</h3>
                        {/* <p>{notification?.message?.body}</p> */}
                        <p>{notification?._id}</p>
                        <p>{notification?.isRead ? "Read" : "Unread"}</p>
                    </div>

                </>)
            })}
            {notifications?.length > 0 ?
                <>
                    <button onClick={() => NotificationRef.current.markAllAsRead()}>Mark All As Read</button>
                    {hasMore && <button onClick={() => NotificationRef.current.getMoreNotifications()}>Get More Notifications</button>}
                    <button onClick={() => NotificationRef.current.clearNotifications()}>Clear Notifications</button>
                </>
            :
                <button onClick={() => NotificationRef.current.getNotifications()}>Get Notifications</button>
            }
        </>
    )
}

export default Notifications
