import moment from "moment";
import store from "../redux/store";
import { cloneDeep, debounce } from "lodash";
import { setErrorState } from "../redux/globalSlice";
import ReactDOM from "react-dom/server";
import { getSuggestedContactListNew } from "../redux/actions/global.action";

export const Timedifference = (time) => {
    let daysdiff = new Date().getDate() - new Date(time).getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let daysuffix;
    daysuffix = moment.localeData().ordinal(new Date(time).getDate())
    if (daysdiff === 0 && new Date().getMonth() === new Date(time).getMonth() && new Date().getFullYear() === new Date(time).getFullYear()) {
        return 'TODAY'
    }
    else if (daysdiff === 1 && new Date().getMonth() === new Date(time).getMonth() && new Date().getFullYear() === new Date(time).getFullYear()) {
        return 'YESTERDAY'
    }
    else {
        return daysuffix + " " + months[new Date(time).getMonth()]
    }
}

export const generateShortUUID = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(5));
    const hexString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 9);

    const shortUUID = `#${hexString}`;

    return shortUUID;
}

export const getUID = function (len) {
    len = len || 10;
    var p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    return [...Array(len)].reduce(a => a + p[~~(Math.random() * p.length)], '');
}

export const getFileExtension = (fileName) => {
    const parts = fileName?.split('.');
    if (parts?.length > 1 && parts[parts?.length - 1].trim() !== '') {
        return parts[parts?.length - 1].toLowerCase();
    } else {
        return '';
    }
}

export const generateComponentId = () => {
    let cId = Math.random().toString(36).slice(2);
    return cId.substring(0, 6);
}

export const getQueryParams = (url) => {
    const queryParams = {};
    const queryString = url.split('?')[1]; 

    if (queryString) {
        const paramPairs = queryString.split('&'); 

        paramPairs.forEach(pair => {
            const [key, value] = pair.split('='); // Split each parameter pair into key and value
            queryParams[key] = decodeURIComponent(value); // Store the key-value pair in the result object
        });
    }

    return queryParams;
}

export const getCidByMessageId = (data, messageId) => {
    for (const key in data) {
        if (data[key].messageId === messageId) {
            return data[key].cId;
        }
    }
    return null; // or an appropriate value if no match is found
};

export const getReqIdByMessageId = (messageId) => {
    let questions = cloneDeep(store.getState().global?.questions)
    for (const key in questions) {
        if (questions[key]?.messageId === messageId) {
            return questions[key]?.historicalData ? questions[key]?.id 
                                                  : questions[key]?.isTask ? questions[key]?.cId 
                                                                           : questions[key]?.reqId;
        }
    }
    return null; // or an appropriate value if no match is found
};

export const getCidByReqId = (questions, reqId) => {
    for (const key in questions) {
        if (questions[key].reqId === reqId) {
            return questions[key].cId;
        }
    }
    return null;
}

export const renderIcons = (provider, extIcon, providerIcon) => { //providerIcon will be helpful for history, in case the existing connection is deleted and no connections left for that specific integration

    const state = store.getState().global
    const { enabledAgents } = state;
    let icon = enabledAgents?.find(skill => skill.id === provider || skill?.appId === provider)?.icon || providerIcon
    if (!icon) {
        icon = enabledAgents?.find(item => item?.id === provider)?.icon
    }

    const Icondiv = document.createElement('div');
    Icondiv.className = 'srcimg';

    const img = document.createElement('img');
    img.src = icon;
    img.className = 'backgroundIcon';
    if(icon){
        Icondiv.appendChild(img);
    }

    if (extIcon) {
        const subImg = document.createElement('img');
        subImg.src = extIcon; 
        subImg.className = 'subIcon';
        Icondiv.appendChild(subImg); 
    }

    return Icondiv;
}

export const htmlDecode = (input) => {
    const e = document.createElement('div');

    // Universal search breaking issue workaround
    if (Array.isArray(input)) {
        input = input[0];
    }

    input = input ? input.replace(/&quot;/g, '') : '';

    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : (e.childNodes[0].nodeValue || e.childNodes[0].outerHTML);
};

export const getCurrentQuestion = (item) => {
    let state = store.getState().global;
    let _questions = cloneDeep(state.questions);
    let requiredQuestion = Object.values(_questions).find(it => it.reqId === item?.reqId);
    return requiredQuestion;
}

export const handleErrorState = (error, name = null) => {
    let currentErrorState = cloneDeep(store.getState().global.errorState) || [];
    let obj = {
        error : error?.response?.data?.errors?.[0]
    }

    if(name) {
        obj.failedCall = name;
    }

	currentErrorState.push(obj);
	store.dispatch(setErrorState(currentErrorState));
};

export const convertTemplateToHtml = (element) => {
	// Create a temporary div
	const tempDiv = document.createElement("div");

	// Render React element to HTML string
	const htmlString = ReactDOM.renderToString(element);

	// Set the HTML string to the div
	tempDiv.innerHTML = htmlString;

	// Return the HTML string
	return tempDiv.innerHTML;
};

export function encodeHtml(text) {
	text = text?.toString();
	text = text?.replace(/&nbsp;/g, " ");
	text = text?.replace(/&amp;/g, "&");
	text = text?.replace(/&lt;/g, "<");
	text = text?.replace(/&gt;/g, ">");
	text = text?.replace(/&quot;/g, '"');
	text = text?.replace(/&apos;/g, "'");
	return text;
}

export const formatToDDMMYY = (dateStr) => {
	const date = new Date(dateStr);
	if (isNaN(date)) return '';
  
	const dd = String(date.getDate()).padStart(2, '0');
	const mm = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-based
	const yy = String(date.getFullYear()).slice(-2);
  
	return `${dd}/${mm}/${yy}`;
  };

  export const delayedSearchCallback = async (value, type) => {
	let userId = store?.getState()?.global?.profile?.data?.id;

    if (type === 'getSuggestedContactList') {
        // store.dispatch(getSuggestedContactList(value?.value));
    } else {
        // store.dispatch(getContactList(value?.value));
        let params = {
            source: value?.connectionSource,
			userId : userId,			
        }
        let payload = {
            "dataType": "listPeople",
            "fieldId": "to",
            "connectionId": value?.connectionId,
            "params": {
                "q": value?.value
            },
            "meta": {
                "page": 0
            }
        }
        const response = await store.dispatch(getSuggestedContactListNew({params, payload}))
        return response?.payload?.choices;
    }
}
export const checkHistoryAccessed = (questions) => {
    return Object.values(questions ||{}).every(q => q?.historicalData)
}

// Placeholder functions for missing icons
export const getExtIcon = (extension) => {
    // Return a simple file icon based on extension
    const iconMap = {
        'pdf': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMTIuNjY2N0g1LjMzMzMzVjMuMzMzMzNIMTAuNjY2N1YxMi42NjY3WiIgZmlsbD0iI0Y0NDQ0NCIvPgo8L3N2Zz4K',
        'doc': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMTIuNjY2N0g1LjMzMzMzVjMuMzMzMzNIMTAuNjY2N1YxMi42NjY3WiIgZmlsbD0iIzQyODVGQSIvPgo8L3N2Zz4K',
        'txt': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEwLjY2NjcgMTIuNjY2N0g1LjMzMzMzVjMuMzMzMzNIMTAuNjY2N1YxMi42NjY3WiIgZmlsbD0iIzY2NzA4NSIvPgo8L3N2Zz4K'
    };
    return iconMap[extension?.toLowerCase()] || iconMap['txt'];
};

export const getDownloadIcon = () => {
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMTJWMiBNMTIgOEg4TDEwIDZMMTIgOEg4WiIgc3Ryb2tlPSIjNjY3MDg1IiBzdHJva2Utd2lkdGg9IjEuMzMiLz4KPC9zdmc+Cg==';
};

export const getAgentType = (type) => {
    switch (type) {
        case 'gptAgent':
            return 'Prompt Agent';
        case 'botAgent':
            return 'Bot Agent';
        case 'aAAgent':
            return 'Autonomous Agent';
        case 'dataAgent':
            return 'API Agent';
        default:
            return 'Agent';
    }
}

export const isUserNearBottom = (el, threshold = 200) => {
    const delta = el.scrollHeight - el.scrollTop - el.clientHeight;
    return delta <= threshold;
};

/**
 * DOM Manipulation Utilities - Aggressive immediate hiding/showing of elements
 * These functions force immediate DOM updates without delays
 */


export const hideElementImmediately = (element, options = {}) => {
    if (!element) return;
    
    const { enableLogging = false } = options;
    
    // Clean up any pending show timeouts
    if (element._showTimeout) {
        clearTimeout(element._showTimeout);
        delete element._showTimeout;
    }
    
    // Clean up any existing observer
    if (element._hideObserver) {
        element._hideObserver.disconnect();
        delete element._hideObserver;
    }
        
    element.style.display = 'none';
    element.setAttribute('hidden', 'true');
    element.setAttribute('aria-hidden', 'true');
    
    if (enableLogging) {
        console.log('Element hidden:', element);
    }
};


export const showElementImmediately = (element, displayValue = 'block', enableLogging = false) => {
    if (!element) return;
        
    if (element._showTimeout) {
        clearTimeout(element._showTimeout);
        delete element._showTimeout;
    }
    
    
    if (element._hideObserver) {
        element._hideObserver.disconnect();
        delete element._hideObserver;
    }
    
    
    element.style.display = displayValue;
    element.removeAttribute('hidden');
    element.removeAttribute('aria-hidden');
        
};

export const showElementDelayed = (element, delay = 100, displayValue = 'block', enableLogging = false) => {
    if (!element) return;
    
    
    
    
    if (element._showTimeout) {
        clearTimeout(element._showTimeout);
        delete element._showTimeout;
        
    }
    
    // Mark element as intended to be visible (but delayed)
    element._intendedState = 'visible-delayed';
    
    // Set up the timeout
    element._showTimeout = setTimeout(() => {
        if (element._intendedState === 'visible-delayed') { // Only show if not overridden
            showElementImmediately(element, displayValue, enableLogging);
        }
        delete element._showTimeout; 
    }, delay);
    
    
};




export const quickHide = (target, options = {}) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
        hideElementImmediately(element, options);
    } else {
        console.warn('Element not found:', target);
    }
};


export const quickShow = (target, displayValue = 'block', enableLogging = false) => {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (element) {
        showElementImmediately(element, displayValue, enableLogging);
    } else if (enableLogging) {
        console.warn('Element not found:', target);
    }
};

export const getIconsList = (agent = {}, icons = []) => {
    const intentList = icons;
    if(intentList?.length === 0) {
    agent?.config?.executionPipeline?.map((task, index) => {
        task?.intents?.map((intent) => {
            if (intentList?.find((i) => i?.agentMeta?.name === intent?.agentMeta?.name)) return;
            intentList?.push(intent)
        })
    });
}
    
    let html = '';
    
    // Add first 3 icons
    intentList?.slice(0, 1).forEach((intent, idx) => {
        html += `            
            <span class="agentBorder" title="${intent?.agentMeta?.name}">
                <img src="${intent?.agentMeta?.icon}" size="16" alt="Agent ${idx + 1}" />
            </span>            
        `;
    });
    
    // Add count indicator if more than 3 icons
    if (intentList?.length > 1) {
        html += `
            <span class="agent-count">
                +${intentList.length - 1}
            </span>
        `;
    }
    
    return html;
}

export const convertToTimeFormat = (isoDate) => {
    if(!isoDate) return moment().local().format("hh:mm A");
    return moment().utc(isoDate).local().format("hh:mm A");
}