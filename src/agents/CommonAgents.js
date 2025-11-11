import store from "../redux/store";

const CommonAgents = () => {
    return new Promise((resolve) => {
        const unsubscribe = store.subscribe(() => {
            const state = store.getState()
            const { status, error } = state.global.allAgents
            const commonAgents = state.global.commonAgents
            if (status !== 'loading') {
                unsubscribe()
                resolve({
                    status,
                    error,
                    data: commonAgents
                })
            }
        })
    })
}

export default CommonAgents;