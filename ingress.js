// info "|"" and "[0]" doesnt work on ingress inside of a script inside table
// use [] in the root level as much as possible

// Redem Variables
const BASE_URL = "https://staging.live-api.redem.io";
let SESSION_STORAGE_HELPERS = {};
let GLOBAL_PAYLOAD = {};

const tan1 = '%TAN%;'
console.log("tan1", tan1);

let includeRespondent = true;
let score = -999;
let nextBtn = null;
let GLOBAL_ANSWER = null;
const SCORE_TYPES = {
	OES: "OES",
	TS: "TS",
	IBS: "IBS",
};

// Customer inputs
var script = document.currentScript;
var query = script.getAttribute("data-params").split(",");

//POP order is important from last to first
const datafile_secret_key = query.pop(); //3rd param
const questionID = query.pop(); //2nd param
const position = query.pop(); //1st param
let questionTypes = query.pop();
let respID = query.pop();
questionTypes == "null" ? questionTypes.split("+") : new Array();

// console.log(
// 	"datafile_secret_key:",
// 	datafile_secret_key,
// 	" questionTypes:",
// 	questionTypes,
// 	" Start/End/None:",
// 	position,
// 	" questionID:",
// 	questionID
// );

// General Functions
function checkSurveyCompleted() {
	let surveyCompleted = false;
	// find surveyCompleted
	if (position.toLowerCase() == "end") {
		surveyCompleted = true;
	}
	return surveyCompleted;
}

function getAnswer() {
	let answer;
	if (questionTypes.includes(SCORE_TYPES.OES)) {
		const input = document.querySelector(".answer_input_text input");
		if (input.type == "text") {
			answer = input.value;
		}
	} else if (questionTypes.includes(SCORE_TYPES.IBS)) {
		answer = new Array();
		const inputs = document.querySelectorAll("input[id^=Q]");
		for (const input of inputs) {
			if (input.type == "radio" && input.checked) {
				answer.push(input.value);
			}
		}
	}
	return answer;
}

async function handleNextButtonClick(startTime) {
	// Step 1: Get answer and store in global variable
	GLOBAL_ANSWER = getAnswer();
	if (questionTypes.includes(SCORE_TYPES.OES)) {
		if (!GLOBAL_PAYLOAD["open_answers"][questionID]) {
			GLOBAL_PAYLOAD["open_answers"][questionID] = {
				answer: GLOBAL_ANSWER,
				copyPasted: false,
			};
		} else {
			GLOBAL_PAYLOAD["open_answers"][questionID]["answer"] = GLOBAL_ANSWER;
		}
	} else if (questionTypes.includes(SCORE_TYPES.IBS)) {
		GLOBAL_PAYLOAD["item_batteries"][questionID] = GLOBAL_ANSWER;
	}

	if (questionTypes.includes(SCORE_TYPES.TS)) {
		let oldDeltaT = 0;
		if (Object.keys(GLOBAL_PAYLOAD["timestamps"]).includes(questionID)) {
			oldDeltaT = GLOBAL_PAYLOAD["timestamps"][questionID];
		}
		let deltaT = Date.now() - startTime;
		GLOBAL_PAYLOAD["timestamps"][questionID] = oldDeltaT + deltaT;
	}
	// Step 3: update the session storage
	setSessionStorage();
}

async function handleBackButtonClick(startTime) {
	if (questionTypes.includes(SCORE_TYPES.TS)) {
		let oldDeltaT = 0;
		if (Object.keys(GLOBAL_PAYLOAD["timestamps"]).includes(questionID)) {
			oldDeltaT = GLOBAL_PAYLOAD["timestamps"][questionID];
		}
		let deltaT = Date.now() - startTime;
		GLOBAL_PAYLOAD["timestamps"][questionID] = oldDeltaT + deltaT;
	}
	sessionStorage.setItem("payload", JSON.stringify(GLOBAL_PAYLOAD));
}

// Handling Session Storage
function clearSessionStorage() {
	sessionStorage.removeItem("sessionStorage");
	sessionStorage.removeItem("payload");
}

function getPayloadFromSessionStorage() {
	return sessionStorage.getItem("payload")
		? JSON.parse(sessionStorage.getItem("payload"))
		: {
				open_answers: {},
				item_batteries: {},
				timestamps: {},
		  };
}

function getSessionFromSessionStorage() {
	return sessionStorage.getItem("sessionStorage")
		? JSON.parse(sessionStorage.getItem("sessionStorage"))
		: {
				surveyStart: false,
				surveyCompleted: false,
				trackSurveyDuration: false,
		  };
}

function setSessionStorage() {
	sessionStorage.setItem(
		"sessionStorage",
		JSON.stringify(SESSION_STORAGE_HELPERS)
	);
	sessionStorage.setItem("payload", JSON.stringify(GLOBAL_PAYLOAD));
}

SESSION_STORAGE_HELPERS = getSessionFromSessionStorage();
GLOBAL_PAYLOAD = getPayloadFromSessionStorage();

// Main Function
async function initButtonListener() {
	// if (document.getElementById("btn_send_ahead")) {
		nextBtn = document.getElementById("btn_send_ahead");
		backBtn = document.getElementById("btn_send_back");

		const surveyCompleted = checkSurveyCompleted();
		if (surveyCompleted) {
			//step 1: setup the layout for API call
			nextBtn.style.display = "none";
			const input = document.querySelector(".answer_input_text input");
			input.style.display = "none";

			// Step 2: Trigger API
			await triggerAPI();
		} else {
			//Step 1: track timestamp when question loads
			let startTime;
			if (questionTypes.includes(SCORE_TYPES.TS)) {
				startTime = Date.now();
			}

			if (questionTypes.includes(SCORE_TYPES.OES)) {
				// Special code to detect copy paste
				let inputElement;
				let answer;
				const input = document.querySelector(".answer_input_text input");
				if (input.type == "text") {
					answer = input.value;
					inputElement = input;
				}

				function pasteHandler() {
					GLOBAL_PAYLOAD["open_answers"][questionID] = {
						copyPasted: true,
						answer: answer,
					};
				}
				inputElement.onpaste = pasteHandler;
			}

			if (position.toLowerCase() == "start") {
				SESSION_STORAGE_HELPERS["trackSurveyDuration"] = true;
			}

			// Step 2: track survey duration needed then add a timestamp when question loads
			if (
				!SESSION_STORAGE_HELPERS["surveyStart"] &&
				SESSION_STORAGE_HELPERS["trackSurveyDuration"]
			) {
				SESSION_STORAGE_HELPERS.surveyStart = Date.now();
			}

			// Step 3: add listener
			nextBtn.addEventListener("click", async () => {
				await handleNextButtonClick(startTime);
			});

			if (backBtn) {
				backBtn.addEventListener("click", async () => {
					await handleBackButtonClick(startTime);
				});
			}

			// Step 4: update the session storage
			setSessionStorage();
		}
	// } else {
	// 	window.setTimeout("initButtonListener()", 10);
	// }
}

document.addEventListener("DOMContentLoaded", function () {
initButtonListener();
});

// API related functions
// function setRespondentIncludeToAnswer(include, score) {
// 	const input = document.querySelector(".answer_input_text input");
// 	input.value = String(include);
// 	input.click();

// 	//we use this to update the form and send data to ingress
// 	setRedemSummaryToRedemForm(false, score);
// }

function setRedemSummaryToRedemForm(include, score) {
	const screenoutStatus = include ? "0" : "1";

	// instead of clicking button append to form and send to Ingress
	const formular = document.getElementById("f");
	var inputIncludeStatus = document.createElement("input");
	inputIncludeStatus.setAttribute("type", "hidden");
	inputIncludeStatus.setAttribute("name", "ReDemQualityCheck");
	inputIncludeStatus.setAttribute("value", screenoutStatus);
	formular.appendChild(inputIncludeStatus);

	var inputRScore = document.createElement("input");
	inputRScore.setAttribute("type", "hidden");
	inputRScore.setAttribute("name", "ReDemQualityCheckScore");
	inputRScore.setAttribute("value", score);
	formular.appendChild(inputRScore);

	clearSessionStorage();

	//finally submit the form
	if (screenoutStatus === "1") {
			//if status is 1 we should submit the form and cause a screenout and manually submit
			formular.submit();
		} else {
			const input = document.querySelector(".answer_input_text input");
			input.value = String(include);
			input.click();
			//if not just let it run with the normal logic of clicking next button and ending survey
			nextBtn.style.display = "";
			nextBtn.click();
		}
}

async function triggerAPI() {
	// Step 1: get payload from storage
	GLOBAL_PAYLOAD = getPayloadFromSessionStorage();

	// Step 2: format data
	const datapoints = [];
	for (let i = 0; i < Object.keys(GLOBAL_PAYLOAD["open_answers"]).length; i++) {
		let questionID = Object.keys(GLOBAL_PAYLOAD["open_answers"])[i];
		datapoints.push({
			dataPointIdentifier: "OES_" + questionID,
			openEndedAnswer: GLOBAL_PAYLOAD["open_answers"][questionID]["answer"],
		});
	}

	for (
		let i = 0;
		i < Object.keys(GLOBAL_PAYLOAD["item_batteries"]).length;
		i++
	) {
		let questionID = Object.keys(GLOBAL_PAYLOAD["item_batteries"])[i];
		datapoints.push({
			dataPointIdentifier: "IBS_" + questionID,
			itemBattery: GLOBAL_PAYLOAD["item_batteries"][questionID],
			numberOfItems: GLOBAL_PAYLOAD["item_batteries"][questionID].length,
		});
	}

	for (let i = 0; i < Object.keys(GLOBAL_PAYLOAD["timestamps"]).length; i++) {
		let questionID = Object.keys(GLOBAL_PAYLOAD["timestamps"])[i];
		datapoints.push({
			dataPointIdentifier: "TS_" + questionID,
			timeStamp: GLOBAL_PAYLOAD["timestamps"][questionID],
		});
	}

	// Step 3: If total duration is enabled add it as a seperate datapoint
	if (SESSION_STORAGE_HELPERS["trackSurveyDuration"]) {
		SESSION_STORAGE_HELPERS["surveyCompleted"] = Date.now();
		const totalSurveyDuration = SESSION_STORAGE_HELPERS["surveyStart"]
			? SESSION_STORAGE_HELPERS["surveyCompleted"] -
			  SESSION_STORAGE_HELPERS["surveyStart"]
			: undefined;
		// alert("The survey is complete. Total duration: "+String(totalSurveyDuration));
		datapoints.push({
			dataPointIdentifier: "TOTAL_TS",
			timeStamp: totalSurveyDuration,
		});
	}

	// Step 4: Call the API
	let respondentID = respID;

	const tan2 = '%TAN%;'
	console.log("tan2", tan2);
	if(respID.toString().includes("%TAN%")) respondentID = tan2
	if(respondentID.toString().includes("-")) respondentID= `Test_${new Date().getTime()}`
 	if(respondentID.toString().includes("%TAN%")) respondentID = `Resp_${new Date().getTime()}`

	try {
		const res = await fetch(`${BASE_URL}/live-respondent/create`, {
			method: "POST",
			mode: "cors",
			body: JSON.stringify({
				respondentID: respondentID,
				datapoints: datapoints,
				datafile_secret_key: datafile_secret_key,
			}),
			referrer: "origin",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await res.json();
		// alert(JSON.stringify(data.body));
		includeRespondent =
			data.body.isRespondentInclude !== undefined
				? data.body.isRespondentInclude
				: true;
		score = data.body.redemScore !== undefined ? data.body.redemScore : -999;
	} catch (error) {
		// alert("API call failed");
		// alert(error);
		score = -999;
		includeRespondent = true;
	} finally {
		// alert("Include Logic finally block: " + String(includeRespondent +' : '+ score));
		//always proceed with the redem score not affecting the user flow of the survey tool
		// setRespondentIncludeToAnswer(includeRespondent, score);
		setRedemSummaryToRedemForm(includeRespondent, score);
	}
}
