import React, { useEffect, useRef, useState } from "react";
import ChatInterface from "../chat/ChatInterface";
import NewChat from "../chat/NewChat";
import AgentWelcomeTemplate from "./WelcomeTemplate";
import History from "./history";
import DemoComp from "./selectedContextDemoComp";
import AskFollowup from "../Attachments/askFollowup";
import MultiResponseTestComp from "./MultiResponseTestComp";
import BotAgentTestComponent from "./BotAgentTestComponent";
import BotConversation from "../chat/botAgent/getBotConversation";
import CustomTemplateComponentManager from "../chat/botAgent/customTemplatesFolder/CustomTemplateComponentManager";
import HoldConversationTemplateManager from "../chat/botAgent/customTemplatesFolder/HoldConversationTemplateManager";
import Notifications from "./Notifications";
import { FileUpload } from "../Attachments";
import { cloneDeep } from "lodash";
import { TemplateRenderer } from "../templateRenderer";
import { convertTemplateToHtml } from "../utils/helpers";

// import { submitUserFeedback } from '../Feedback'

const TestComp = (props) => {
	const [questions, setQuestions] = useState(null);
	const [input, setInput] = useState("");
	const [selectedItem, setSelectedItem] = useState(null);
	const [showDislikeMenu, setShowDislikeMenu] = useState(null);
	const [errorStates, setErrorStates] = useState([]);
	const [quickActions, setQuickActions] = useState([]);
	const chatInterface = useRef();
	const followupInstance = useRef();
	useEffect(() => {
		// Create an instance of ChatInterface
		followupInstance.current = FileUpload();
		chatInterface.current = ChatInterface();
		chatInterface.current.options({ contentStreaming: true });
		// Show the input bar in a specific DOM element
		// chatInterface.current.showComposeBar('composeBar');

		// Subscribe to updates
		const unsubscribe = chatInterface.current.subscribe(
			(question, searchResponse, moreAvailable, errorStates, quickActions) => {
				// Handle the API response data
				console.log(
					"Received data from chat API:",
					question,
					searchResponse,
					moreAvailable,
					errorStates,
					quickActions
				);
				setQuestions(question);
				setErrorStates(errorStates);
				setQuickActions(quickActions);
			}
		);

		chatInterface.current.enableCustomTemplate({ gpt_form_template: true });

		// Installing custom templates for BOT Agent
		let botInstance = BotConversation();
		botInstance.initializeBotSDK({
			name: "ProcureBot",
			streamId: "st-b6012ef2-810d-5240-b33e-5404d68b680e",
			webhook: {
				clientId: "cs-79a89a6f-b0ab-5e2f-b912-8dd1e2f95da0",
				clientSecret: "VJNwkfbPcMZl4bOa1Qn3XtYRz6rqigwtTgOlaYX25Xs=",
			},
		});
		botInstance.enableEVABotSdk(true);
		botInstance.installOwnTemplate(CustomTemplateComponentManager());
		botInstance.installOwnTemplate(HoldConversationTemplateManager());

		// chatInterface.current.storeCustomData({"test" : "yes"})

		// Cleanup on component unmount
		return () => {
			// Unsubscribe from store updates
			unsubscribe();
		};
	}, []);

	const onChange = async (event) => {
		if (event.keyCode === 13 && !event.shiftKey) {
			event.preventDefault();
			let items = Object.values(questions);
			await chatInterface.current.sendMessage(
				input,
				items?.[items?.length - 1]
			);
			console.log("working.....");
			setInput("");
		}
	};

	const handleClick = (label) => {
		setSelectedItem(label);
	};

	return (
		<>
			<div>
				<div>
					{questions &&
						Object.values(questions).map((item) => {
							if(item?.isTask) return;
							// 	item?.templateType === "agent_welcome_template"
							// ) {
							// 	return <AgentWelcomeTemplate item={item} />;
							// }
							// if (item?.templateType === "gpt_form_template") {
							// 	return item.status === "terminated" ? (
							// 		<div>{item?.answer}</div>
							// 	) : (
							// 		<MultiResponseTestComp item={item} />
							// 		// <div dangerouslySetInnerHTML={{ __html: item.template_html }}></div>
							// 	);
							// }
							// if (
							// 	item?.templateType === "search_answer" &&
							// 	item?.viewType !== "threadView"
							// ) {
							// 	return (
							// 		<>
							// 			<div>{item?.answer}</div>
							// 			<div
							// 				dangerouslySetInnerHTML={{
							// 					__html: item.answerFrom_html,
							// 				}}
							// 			></div>
							// 			{item?.answerFrom_html && (
							// 				<div
							// 					onClick={() =>
							// 						AskFollowup(item)
							// 					}
							// 				>
							// 					Ask followup
							// 				</div>
							// 			)}
							// 			{!item?.disableFeedback && (
							// 				<div>
							// 					<button
							// 						onClick={() =>
							// 							submitUserFeedback({
							// 								type: "like",
							// 								cId: item?.cId,
							// 								payload: null,
							// 							})
							// 						}
							// 					>
							// 						Like
							// 					</button>
							// 					<button
							// 						onClick={() =>
							// 							setShowDislikeMenu(true)
							// 						}
							// 					>
							// 						Dislike
							// 					</button>
							// 					<input
							// 						id={`comment-${item?.messageId}`}
							// 					></input>
							// 					{showDislikeMenu && (
							// 						<div className="feedBackDislikeGroup">
							// 							<ul className="radio-group">
							// 								{[
							// 									{
							// 										id: 1,
							// 										name: "cat1",
							// 									},
							// 									{
							// 										id: 2,
							// 										name: "cat2",
							// 									},
							// 									{
							// 										id: 3,
							// 										name: "cat3",
							// 									},
							// 								].map((item) => {
							// 									return (
							// 										<li
							// 											key={
							// 												item?.id
							// 											}
							// 										>
							// 											<label>
							// 												<input
							// 													type="radio"
							// 													name="categories"
							// 													value={
							// 														item.name
							// 													}
							// 													checked={
							// 														selectedItem ===
							// 														item.name
							// 													}
							// 													onChange={() =>
							// 														handleClick(
							// 															item.name
							// 														)
							// 													}
							// 												/>
							// 												{
							// 													item.name
							// 												}
							// 											</label>
							// 										</li>
							// 									);
							// 								})}
							// 							</ul>
							// 						</div>
							// 					)}
							// 					<div>
							// 						<button
							// 							onClick={() => {
							// 								submitUserFeedback({
							// 									type: "dislike",
							// 									cId: item?.cId,
							// 									payload: null,
							// 								}),
							// 									setShowDislikeMenu(
							// 										false
							// 									);
							// 							}}
							// 						>
							// 							Submit
							// 						</button>
							// 					</div>
							// 				</div>
							// 			)}
							// 		</>
							// 	);
							// }
							// if (item?.templateType === "multi_responses") {
							// 	return (
							// 		<>
							// 			{item?.responses?.map(
							// 				(response, index) => {
							// 					return (
							// 						<>
							// 							<div>{`Response ${
							// 								index + 1
							// 							}`}</div>
							// 							<div>
							// 								{response?.answer}
							// 							</div>
							// 						</>
							// 					);
							// 				}
							// 			)}
							// 		</>
							// 	);
							// }
							// if (item?.viewType === "threadView") {
							// 	return (
							// 		<>
							// 			<BotAgentTestComponent
							// 				question={item}
							// 			/>
							// 			{item?.status === "completed" && (
							// 				<>
							// 					<button
							// 						onClick={() => {
							// 							followupInstance.current.askFollowup(
							// 								item
							// 							);
							// 						}}
							// 					>
							// 						set context
							// 					</button>
							// 					<button
							// 						onClick={() => {
							// 							followupInstance.current.clearContext(
							// 								{}
							// 							);
							// 						}}
							// 					>
							// 						clear context
							// 					</button>
							// 				</>
							// 			)}
							// 		</>
							// 	);
							// }
							// return null;
							const assistantIconTemplate = () => {
								return <Solidstar04 size={20} />;
							};

							const userIconTemplate = () => {
								return (
									<div className="ic-text">
										<span className="text-wrapper">AP</span>
									</div>
								);
							};
							let html = TemplateRenderer.generateHTMLTemplate(
								item,
								{
									assistantIconTemplate,
									userIconTemplate,
									loadingText: "Analyzing",
								}
							);
							console.log(html);
							return (
								<div
									dangerouslySetInnerHTML={{
										__html: html.innerHTML,
									}}
								/>
							);
						})}
				</div>
				<div>
					{quickActions?.map((item) => {
						return <div key={item?.id} onClick={() => {
							chatInterface.current.askQuickActions(item);
						}}>{item?.label}</div>;
					})}
					<textarea
						id="composeBar"
						onKeyDown={onChange}
						onInput={(event) => setInput(event.target.value)}
						value={input}
						placeholder="Ask question..."
					/>
				</div>
				<button
					onClick={() => {
						let items = Object.values(questions);
						chatInterface.current.sendMessage(
							input,
							items?.[items?.length - 1]
						);
					}}
				>
					Send
				</button>
				<button onClick={() => NewChat()}>+New</button>
				<button
					onClick={() =>
						chatInterface.current.cancelMessageReqAction()
					}
				>
					Stop
				</button>
			</div>
			<div>
				<History />
				{/* <DemoComp/> */}
				<Notifications />
			</div>
			<div>
				{errorStates.length > 0 &&
					errorStates?.map((item) => {
						return (
							<div>{`${item?.failedCall} Call Failed with Error ${item?.error?.code} and Message ${item?.error?.msg}`}</div>
						);
					})}
			</div>
		</>
	);
};

export default TestComp;
export const Solidstar04 = ({
	size,
	color,
	className = "",
	strokeWidth = "",
}) => {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<mask id="path-1-inside-1_623_13570" fill="white">
				<path d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z" />
			</mask>
			<path
				d="M0 12C0 5.37258 5.37258 0 12 0C18.6274 0 24 5.37258 24 12C24 18.6274 18.6274 24 12 24C5.37258 24 0 18.6274 0 12Z"
				fill="url(#paint0_linear_623_13570)"
			/>
			<path
				d="M0 0H24H0ZM24 12.4706C24 19.098 18.6274 24.4706 12 24.4706C5.37258 24.4706 0 19.098 0 12.4706V12C0 18.3675 5.37258 23.5294 12 23.5294C18.6274 23.5294 24 18.3675 24 12V12.4706ZM0 24V0V24ZM24 0V24V0Z"
				fill="#D0D5DD"
				mask="url(#path-1-inside-1_623_13570)"
			/>
			<path
				d="M12.4973 6.47567C12.418 6.2697 12.2202 6.13379 11.9995 6.13379C11.7788 6.13379 11.5809 6.2697 11.5017 6.47567L10.4287 9.26558C10.2684 9.68214 10.2181 9.80217 10.1492 9.89902C10.0801 9.9962 9.99522 10.0811 9.89805 10.1502C9.8012 10.2191 9.68116 10.2694 9.2646 10.4296L6.47469 11.5027C6.26872 11.5819 6.13281 11.7798 6.13281 12.0005C6.13281 12.2211 6.26872 12.419 6.47469 12.4982L9.2646 13.5713C9.68116 13.7315 9.8012 13.7818 9.89805 13.8507C9.99522 13.9198 10.0801 14.0047 10.1492 14.1019C10.2181 14.1987 10.2684 14.3188 10.4287 14.7353L11.5017 17.5252C11.5809 17.7312 11.7788 17.8671 11.9995 17.8671C12.2202 17.8671 12.418 17.7312 12.4973 17.5252L13.5703 14.7353C13.7305 14.3188 13.7809 14.1987 13.8497 14.1019C13.9188 14.0047 14.0037 13.9198 14.1009 13.8507C14.1978 13.7818 14.3178 13.7315 14.7344 13.5713L17.5243 12.4982C17.7302 12.419 17.8661 12.2211 17.8661 12.0005C17.8661 11.7798 17.7302 11.5819 17.5243 11.5027L14.7344 10.4296C14.3178 10.2694 14.1978 10.2191 14.1009 10.1502C14.0037 10.0811 13.9188 9.9962 13.8497 9.89902C13.7809 9.80217 13.7305 9.68214 13.5703 9.26558L12.4973 6.47567Z"
				fill="white"
			/>
			<defs>
				<linearGradient
					id="paint0_linear_623_13570"
					x1="12"
					y1="-29.6471"
					x2="34.6039"
					y2="-17.3054"
					gradientUnits="userSpaceOnUse"
				>
					<stop stopColor="#7DD4EB" />
					<stop offset="1" stopColor="#2574F0" />
				</linearGradient>
			</defs>
		</svg>
	);
};