
const TRACK_SURVEY_DURATION = true;

// Redem Variables
const BASE_URL = "http://localhost:8000";
// https://staging.live-api.redem.io
let SESSION_STORAGE_HELPERS = {};
let redemScore = -998;
let nextBtn = null;
let global_answer = null;
const QUESTION_TYPES = {
	OES: "OES",
	TS: "TS",
	IBS: "IBS",
};

// Customer inputs
const params = document.body.getElementsByTagName("script");
query = params[0].classList;
const questionTypes = query[0]? query[0].split("|"): [];
const questionID = query[1];
const position = query[2];
const datafile_secret_key = query[3];

console.log(
	"datafile_secret_key:",
	datafile_secret_key,
	" questionTypes:",
	questionTypes,
	" Start/End/None:",
	position,
	" questionID:",
	questionID
);

// Code
function checkSurveyCompleted() {
	let surveyCompleted = false;
	// find surveyCompleted
	if (position == "END") {
		surveyCompleted = true;
	}
	return surveyCompleted;
}

function getAnswer() {
	let answer;
	if (questionTypes.includes(QUESTION_TYPES.OES)) {
		const input = document.querySelector("input[id^=Q" + questionID + "A]");
		if (input.type == "text") {
			answer = input.value;
		}
	}
	return answer;
}

async function handleButtonClick(startTime) {
	// Step 1: Get answer and store in global variable
	global_answer = getAnswer();

	// Step 2: Get existing data from session storage
	let payload = JSON.parse(sessionStorage.getItem("payload")) || {
		open_answers: {},
		item_batteries: {},
		timestamps: {},
	};

	if (questionTypes.includes(QUESTION_TYPES.OES)) {
		payload["open_answers"][questionID] = global_answer;
		// } else if (questionType === "IBS") {
		// 	// global answer is already an array of items here
		// 	payload["item_batteries"][questionID] = global_answer;
	}

	if (questionTypes.includes(QUESTION_TYPES.TS)) {
		let oldDeltaT = 0;
		if (Object.keys(payload["timestamps"]).includes(questionID)) {
			oldDeltaT = payload["timestamps"][questionID];
		}
		let deltaT = Date.now() - startTime;
		payload["timestamps"][questionID] = oldDeltaT + deltaT;
	}

	// Step 3: Set session storage items
	sessionStorage.setItem(
		"sessionStorage",
		JSON.stringify(SESSION_STORAGE_HELPERS)
	);
	sessionStorage.setItem("payload", JSON.stringify(payload));
}


async function initButtonListener() {
	if (document.getElementById("btn_send_ahead")) {
		nextBtn = document.getElementById("btn_send_ahead");
		const surveyCompleted = checkSurveyCompleted();
		if (surveyCompleted) {
			//step 1: setup the layout for API call
			nextBtn.style.display = "none";
			const input = document.querySelector("input[id^=Q" + questionID + "A1]");
			input.style.display = "none";

			// Step 2: Trigger API
			redemScore = await triggerAPI(nextBtn);
		} else {
			//Step 1: track timestamp when question loads
			let startTime;
			if (questionTypes.includes(QUESTION_TYPES.TS)) {
				startTime = Date.now();
			}

			// Step 2: track survey duration needed then add a timestamp when question loads
			if (!SESSION_STORAGE_HELPERS["surveyStart"] && TRACK_SURVEY_DURATION) {
				SESSION_STORAGE_HELPERS["surveyStart"] = Date.now();
				sessionStorage.setItem("sessionStorage", JSON.stringify(SESSION_STORAGE_HELPERS));
			}

			// Step 3: add listener
			nextBtn.addEventListener("click", async () => {
				await handleButtonClick(startTime);
			});
		}
	} else {
		window.setTimeout("initButtonListener()", 10);
	}
}

function setRedemScoreToAnswer(redemScore) {
	const input = document.querySelector("input[id^=Q" + questionID + "A1]");
	input.value = redemScore;
	input.click();

	// click the button and proceed
	nextBtn.style.display = "";
	nextBtn.click();
}

async function triggerAPI(nextBtn) {
	// Step 1: get payload from storage
	let payload = JSON.parse(sessionStorage.getItem("payload"));

	// Step 2: format data
	const datapoints = [];
	for (let i = 0; i < Object.keys(payload["open_answers"]).length; i++) {
		let questionID = Object.keys(payload["open_answers"])[i];
		datapoints.push({
			dataPointIdentifier: "Q" + (i + 1) + "_OES",
			openEndedAnswer: payload["open_answers"][questionID],
		});
	}
	// for (let i = 0; i < Object.keys(payload["item_batteries"]).length; i++) {
	// 	let questionID = Object.keys(payload["item_batteries"])[i];
	// 	datapoints.push({
	// 		dataPointIdentifier: questionID,
	// 		itemBattery: payload["item_batteries"][questionID],
	// 		numberOfItems: payload["item_batteries"][questionID].length,
	// 	});
	// }

	for (let i = 0; i < Object.keys(payload["timestamps"]).length; i++) {
		let questionID = Object.keys(payload["timestamps"])[i];
		datapoints.push({
			dataPointIdentifier: "Q" + (i + 1)+ "_TS",
			timeStamp: payload["timestamps"][questionID],
		});
	}

	// Step 3: If total duration is enabled add it as a seperate datapoint
	if(TRACK_SURVEY_DURATION){
		SESSION_STORAGE_HELPERS["surveyCompleted"] = Date.now();
		const totalSurveyDuration = SESSION_STORAGE_HELPERS["surveyStart"] ? SESSION_STORAGE_HELPERS["surveyCompleted"] - SESSION_STORAGE_HELPERS["surveyStart"] : undefined;
		// alert("The survey is complete. Total duration: "+String(totalSurveyDuration));
		datapoints.push({
			dataPointIdentifier: "Total_TS",
			timeStamp: totalSurveyDuration,
		});
	}

	// Step 4: Call the API
	try {
		const res = await fetch(`${BASE_URL}/live-respondent/create`, {
			method: "POST",
			mode: "cors",
			body: JSON.stringify({
				respondentID: `${new Date().getTime()}`,
				datapoints: datapoints,
				datafile_secret_key: datafile_secret_key,
			}),
			referrer: "origin",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await res.json();
		redemScore = (data.body.redemScore && data.body.redemScore >=0)?  data.body.redemScore : -997;
	} catch (error) {
		alert("API call failed");
		// alert(error);
		redemScore = -997;
	} finally {
		// alert("Redem Score in finally block: " + String(redemScore));
		//always proceed with the redem score not affecting the user flow of the survey tool
		setRedemScoreToAnswer(redemScore);
		clearSessionStorage();
		return redemScore;
	}
}

function clearSessionStorage(){
	console.log("Clear Here");
}

SESSION_STORAGE_HELPERS = JSON.parse(
	sessionStorage.getItem("sessionStorage")
) || {
	totalScore: -999,
	surveyStart: false,
	surveyCompleted: false
};

initButtonListener();
