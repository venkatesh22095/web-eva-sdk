import { cloneDeep } from "lodash";
import moment from "moment";
import ChatInterface from "../../chat/ChatInterface";
import store from "../../redux/store";

function validateInput(templateType, data) {
	if (!templateType || typeof templateType !== "string") {
		throw new Error("Template type must be a string");
	}

	if (!data || typeof data !== "object") {
		throw new Error("Template data must be an object");
	}
}

export const encodeHtml = (str) => {
	if (!str) return "";
	return str
		?.replace(/&/g, "&amp;")
		?.replace(/</g, "&lt;")
		?.replace(/>/g, "&gt;")
		?.replace(/"/g, "&quot;")
		?.replace(/'/g, "&#039;");
};

export const getTimeline = (time, type) => {
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	const daysF = [
		"Sunday",
		"Monday",
		"Tuesday",
		"Wednesday",
		"Thursday",
		"Friday",
		"Saturday",
	];
	const givenDate = new Date(time);
	const day = days[givenDate.getDay()];
	const dayF = daysF[givenDate.getDay()];
	let month = months[givenDate.getMonth()];
	const date = givenDate.getDate();

	const currentDate = new Date();
	const todayDay = days[currentDate.getDay()];
	const todayMonth = months[currentDate.getMonth()];
	const todayDate = currentDate.getDate();

	const yesterday = new Date(new Date().valueOf() - 1000 * 60 * 60 * 24);
	const yesterdayDay = days[yesterday.getDay()];
	const yesterdayMonth = months[yesterday.getMonth()];
	const yesterdayDate = yesterday.getDate();

	const tomorrow = new Date(new Date().valueOf() + 1000 * 60 * 60 * 24);
	const tomorrowDay = days[tomorrow.getDay()];
	const tomorrowMonth = months[tomorrow.getMonth()];
	const tomorrowDate = tomorrow.getDate();

	let dd = givenDate.getDate();
	let mm = givenDate.getMonth();
	mm = mm + 1;
	let yy = givenDate.getFullYear();
	dd = dd < 10 ? "0" + dd : dd;
	mm = mm < 10 ? "0" + mm : mm;

	if (type === "time") {
		return getTime(time);
	} else if (type === "thread") {
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return getTime(time);
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return "Yesterday";
		} else {
			var finalDate =
				months[givenDate.getMonth()] + " " + givenDate.getDate();
			return finalDate;
		}
	} else if (type === "message") {
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return "Today";
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return "Yesterday";
		} else {
			var finalDate =
				months[givenDate.getMonth()] +
				" " +
				givenDate.getDate() +
				", " +
				givenDate.getFullYear();
			return finalDate;
		}
	} else if (type === "universalSearch") {
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return moment(givenDate).fromNow();
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return getTime(givenDate) + " " + "-" + " " + "Yesterday";
		} else {
			var finalDate =
				getTime(givenDate) +
				" " +
				"-" +
				" " +
				months[givenDate.getMonth()] +
				" " +
				givenDate.getDate() +
				", " +
				givenDate.getFullYear();
			return finalDate;
		}
	} else if (type === "contextCollab") {
		moment.updateLocale("en", {
			relativeTime: {
				future: "in %s",
				past: "%s",
				s: "now",
				ss: "%d now",
				m: "1 min ago",
				mm: "%d mins ago",
				h: "1 hr", //this is the setting that you need to change
				hh: "%d hr",
				d: "1 d",
				dd: "%d d",
				w: "1 w",
				ww: "%d w",
				M: "1 mo", //change this for month
				MM: "%d mo",
				y: "1 y",
				yy: "%d y",
			},
		});
		return moment(givenDate).fromNow();
	} else if (type === "monthNameDateFullyear") {
		var finalDate =
			months[givenDate.getMonth()] +
			" " +
			givenDate.getDate() +
			", " +
			givenDate.getFullYear();
		return finalDate;
	} else if (type === "M/DD/YYYY") {
		let finalData = mm + "/" + dd + "/" + givenDate.getFullYear();
		return finalData;
	} else if (type === "DD/M/YYYY") {
		let finalData = dd + "/" + mm + "/" + givenDate.getFullYear();
		return finalData;
	} else if (type === "YYYY-MM-DD") {
		let finalData = givenDate.getFullYear() + "-" + mm + "-" + dd;
		return finalData;
	} else if (type === "numberDateTime") {
		let finalData =
			dd + "/" + mm + "/" + yy + " " + "-" + " " + getTime(time);
		return finalData;
	} else if (type === "fulldate") {
		let creationDate =
			day +
			", " +
			month +
			" " +
			givenDate.getDate() +
			", " +
			givenDate.getFullYear() +
			", " +
			getTime(time);
		return creationDate;
	} else if (type === "postViaEmail") {
		let creationDate =
			givenDate.getDate() +
			" " +
			month +
			" " +
			givenDate.getFullYear() +
			" " +
			getTime(time);
		return creationDate;
	} else if (type === "remiderTime") {
		let creationDate;
		if (day + month + date === todayDay + todayMonth + todayDate) {
			creationDate = getTime(time) + ", " + "Today";
		} else if (
			day + month + date ===
			tomorrowDay + tomorrowMonth + tomorrowDate
		) {
			creationDate = getTime(time) + ", " + "Tomorrow";
		} else {
			creationDate =
				getTime(time) +
				", " +
				month +
				" " +
				givenDate.getDate() +
				", " +
				givenDate.getFullYear();
		}
		return creationDate;
	} else if (type === "commentTime") {
		let creationDate =
			months[givenDate.getMonth()] +
			" " +
			givenDate.getDate() +
			", " +
			givenDate.getFullYear() +
			" at " +
			getTime(time);
		return creationDate;
	} else if (type === "task") {
		let flag;
		if (day + month + date === todayDay + todayMonth + todayDate) {
			flag = "Today";
		} else if (
			day + month + date ===
			tomorrowDay + tomorrowMonth + tomorrowDate
		) {
			flag = "Tomorrow";
		}
		return flag;
	} else if (type === "dateAndTime") {
		let finalData =
			days[givenDate.getDay()] +
			", " +
			months[mm - 1] +
			" " +
			dd +
			" , " +
			getTime(time);
		return finalData;
	} else if (type === "dayDateAndTime") {
		let finalData =
			days[givenDate.getDay()] +
			", " +
			months[mm - 1] +
			" " +
			dd +
			" " +
			yy +
			", " +
			getTime(time);
		return finalData;
	} else if (type === "usEventdateAndTime") {
		let finalData =
			days[givenDate.getDay()] +
			", " +
			months[mm - 1] +
			" " +
			dd +
			" " +
			yy +
			", " +
			getTime(time) +
			" - " +
			getTime(time);
		return finalData;
	} else if (type === "post") {
		let finalData = months[mm - 1] + " " + dd + ", " + getTime(time);
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return getTime(time);
		} else {
			return finalData;
		}
	} else if (type === "discList") {
		let finalData = dd + "/" + mm + "/" + yy.toString().substr(-2);
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return getTime(time);
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return "Yesterday";
		} else {
			return finalData;
		}
	} else if (type === "comments") {
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return "Today";
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return "Yesterday";
		} else {
			var finalDate =
				months[givenDate.getMonth()] +
				" " +
				givenDate.getDate() +
				", " +
				givenDate.getFullYear();
			return finalDate;
		}
	} else if (type === "reactions") {
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return "Today";
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return "Yesterday";
		} else {
			var finalDate =
				months[givenDate.getMonth()] +
				" " +
				givenDate.getDate() +
				", " +
				givenDate.getFullYear() +
				" - " +
				getTime(time);
			return finalDate;
		}
	} else if (type === "lastCommentTime") {
		if (day + month + date === todayDay + todayMonth + todayDate) {
			return "Today at " + "" + getTime(time);
		} else if (
			day + month + date ===
			yesterdayDay + yesterdayMonth + yesterdayDate
		) {
			return "Yesterday at " + "" + getTime(time);
		} else {
			var finalDate =
				months[givenDate.getMonth()] +
				" " +
				givenDate.getDate() +
				", " +
				givenDate.getFullYear() +
				" at " +
				getTime(time);
			return finalDate;
		}
	} else if (type === "date") {
		return months[givenDate.getMonth()] + " " + givenDate.getDate();
	} else if (type === "year") {
		return givenDate.getFullYear();
	} else if (type === "skillCreatedOn") {
		createdOnDate =
			month + "-" + givenDate.getDate() + "-" + givenDate.getFullYear();
		return createdOnDate;
	}
};

function getTime(time) {
	let givenDate = new Date(time);
	var hours = givenDate.getHours();
	var minutes = givenDate.getMinutes();
	var ampm = hours >= 12 ? "PM" : "AM";
	hours = hours % 12;
	hours = hours ? hours : 12;
	const mMinutes = minutes < 10 ? "0" + minutes : minutes;
	var strTime =
		(hours.toString().length == 1 ? "0" + hours : hours) +
		":" +
		mMinutes +
		" " +
		ampm;
	return strTime?.replace(/^0+/, "");
}
export const highlightQuotedText = (input) => {
	return input?.replace(/"([^"]+)"/g, (match, p1) => {
		return `"​<span class="highlightedText">${p1}</span>"`;
	});
};

export const SHOELACE_TAGS = [
  // Input Components
  'sl-button',
  'sl-button-group',
  'sl-checkbox',
  'sl-color-picker',
  'sl-input',
  'sl-radio',
  'sl-radio-button',
  'sl-radio-group',
  'sl-range',
  'sl-rating',
  'sl-select',
  'sl-option',
  'sl-switch',
  'sl-textarea',
  
  // Display Components
  'sl-alert',
  'sl-avatar',
  'sl-badge',
  'sl-card',
  'sl-carousel',
  'sl-carousel-item',
  'sl-details',
  'sl-dialog',
  'sl-divider',
  'sl-drawer',
  'sl-icon',
  'sl-icon-button',
  'sl-image-comparer',
  'sl-progress-bar',
  'sl-progress-ring',
  'sl-qr-code',
  'sl-skeleton',
  'sl-spinner',
  'sl-tag',
  'sl-tooltip',
  
  // Navigation Components
  'sl-breadcrumb',
  'sl-breadcrumb-item',
  'sl-menu',
  'sl-menu-item',
  'sl-menu-label',
  'sl-tab',
  'sl-tab-group',
  'sl-tab-panel',
  'sl-tree',
  'sl-tree-item',
  
  // Layout Components
  'sl-split-panel',
  
  // Utility Components
  'sl-animated-image',
  'sl-animation',
  'sl-copy-button',
  'sl-dropdown',
  'sl-format-bytes',
  'sl-format-date',
  'sl-format-number',
  'sl-include',
  'sl-mutation-observer',
  'sl-popup',
  'sl-relative-time',
  'sl-resize-observer',
  'sl-visually-hidden',
];

export const SHOELACE_ATTRS = [
  // Common Web Component Attributes
  'slot',
  'part',
  'exportparts',
  
  // Common Shoelace Attributes
  'variant',
  'size',
  'type',
  'value',
  'placeholder',
  'label',
  'name',
  'checked',
  'disabled',
  'readonly',
  'required',
  'invalid',
  'help-text',
  'clearable',
  'password-toggle',
  'password-visible',
  'no-spin-buttons',
  'form',
  'min',
  'max',
  'step',
  'minlength',
  'maxlength',
  'pattern',
  'autocomplete',
  'autocorrect',
  'autocapitalize',
  'spellcheck',
  'inputmode',
  
  // Button specific
  'circle',
  'pill',
  'caret',
  'loading',
  'outline',
  'href',
  'target',
  'download',
  
  // Select specific
  'multiple',
  'max-options-visible',
  'placement',
  'hoist',
  'filled',
  
  // Dialog/Drawer specific
  'open',
  'modal',
  'no-header',
  'contained',
  
  // Alert specific
  'closable',
  'duration',
  
  // Progress specific
  'percentage',
  'indeterminate',
  
  // Icon specific
  'src',
  'library',
  
  // Animation specific
  'play',
  'delay',
  'direction',
  'duration',
  'easing',
  'end-delay',
  'fill',
  'iterations',
  'iteration-start',
  'keyframes',
  'play-rate',
  
  // Carousel specific
  'loop',
  'navigation',
  'pagination',
  'autoplay',
  'autoplay-interval',
  'slides-per-page',
  'slides-per-move',
  'orientation',
  'mouse-dragging',
  
  // Tree specific
  'selection',
  'expanded',
  'selected',
  'indeterminate',
  'leaf',
  'lazy',
  
  // Tab specific
  'panel',
  'active',
  'closable',
  'placement',
  'activation',
  'no-scroll-controls',
  
  // Tooltip specific
  'content',
  'placement',
  'disabled',
  'distance',
  'open',
  'skidding',
  'trigger',
  'hoist',
  
  // Rating specific
  'max',
  'precision',
  'readonly',
  'clearable',
  'value',
  
  // Range specific
  'min',
  'max',
  'step',
  'value',
  'label',
  'help-text',
  'disabled',
  'tooltip',
  
  // Common data attributes that might be used
  'data-*',
  
  // Common event attributes (if you need them)
  'onclick',
  'onchange',
  'oninput',
  'onblur',
  'onfocus',
  'onsubmit',
  'onload',
  'onclose',
  'onopen',
  'onshow',
  'onhide',
  'onselect',
  'onslchange',
  'onslclear',
  'onslclose',
  'onslhide',
  'onslinput',
  'onslopen',
  'onslselect',
  'onslshow',
  'onslstart',
  'onslend',
  'onslcancel',
  'onslfinish',
  'onslreposition',
  'onslresize',
  'onslmutation',
  'onslload',
  'onslerror',
  'onslchange',
  'onslclear',
  'onslinvalid',
  'onslremove',
  'onslafter-show',
  'onslafter-hide',
  'onslrequest-close',
  'onslinitial-focus',
  'onslselection-change',
  'onslload',
  'onslerror',
  'onslplay',
  'onslpause',
  'onslcancel',
  'onslfinish',
  'onslstart',
  'onslend',
];


export const cancelOngoingCall = (currentTaskId) => {
	let state = store?.getState()?.global;
	let { questions} = state;
	let updatedQuestions = cloneDeep(questions)
	updatedQuestions[currentTaskId].status = "terminated"
	updatedQuestions[currentTaskId].loading = false	
	/* for cancel we should send either messageId / requId, but for multiIntent execution we are constructing question in questions array with stepId, hence pulling the messageId from that stepId and making the cancel call*/
	if (updatedQuestions[currentTaskId]?.hasOwnProperty("isTask")) {		
		ChatInterface().cancelMessageReqAction(updatedQuestions[currentTaskId]?.reqId)
	} else {
		// dispatch(stopResponse({ id: currentQuestion }, { boardId: selectedThreadId }, value))
	}

}

// return {
// 	validateInput,
// 	encodeHtml,
// };
