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
    // Generate a random 5-byte buffer and convert it to a hex string
    const randomBytes = crypto.getRandomValues(new Uint8Array(5));
    const hexString = Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('').substring(0, 9);

    // Prefix with '#'
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
    const queryString = url.split('?')[1]; // Split the URL at the '?' character to get the query string

    if (queryString) {
        const paramPairs = queryString.split('&'); // Split the query string into parameter pairs

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
            return data[key].reqId;
        }
    }
    return null; // or an appropriate value if no match is found
};

export const getReqIdByMessageId = (messageId) => {
    let questions = cloneDeep(store.getState().global?.questions)
    for (const key in questions) {
        if (questions[key]?.messageId === messageId) {
            return questions[key]?.historicalData ? questions[key]?.id : questions[key]?.reqId;
        }
    }
    return null; // or an appropriate value if no match is found
};

export const getCidByReqId = (data, reqId) => {
    for (const key in data) {
        if (data[key].reqId === reqId) {
            return data[key].reqId;
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

    Icondiv.appendChild(img);

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
