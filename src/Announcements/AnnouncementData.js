import store from "../redux/store";

const AnnouncementData = (props) => {
    let state = store.getState().global;

    // Subscribe to store updates
    const subscribe = (cb) => {
        let callback = cb;
        const unsubscribe = store.subscribe(() => {
            state = store.getState().global;
            const { status, error, announcements } = state.announcements;
            if (callback) {
                callback({
                    status,
                    error,
                    data: announcements || []
                });
            }
        });

        // Return a function to unsubscribe
        return () => {
            unsubscribe();
        };
    };

    return {
        subscribe
    };
};

export default AnnouncementData;
