// Redem Variables
const BASE_URL = "http://127.0.0.1:8000";
// https://staging.live-api.redem.io
let SESSION_STORAGE_HELPERS = {};

let global_answer;

// Customer inputs
const params = document.body.getElementsByTagName("script");
query = params[0].classList;
const questionType = query[0];
const questionID = query[1];
const position = query[2];
const hashed_magic_key = query[3];

console.log(
	"hashed_magic_key:",
	hashed_magic_key,
	" questionType:",
	questionType,
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

function getAnswer(questionType) {
	let answer;
	if (questionType == "OES") {
		const input = document.querySelector("input[id^=Q" + questionID + "A]");

		if (input.type == "text") {
			answer = input.value;
		}
	}

	// } else if (questionType == "singleChoice") {
	// 	const liInputs = document.getElementsByClassName("answerOrder");
	// 	let selectedAnswerElement;
	// 	for (const el of liInputs) {
	// 		// For n out of m or 1 out of m selections, identify the element which has the answer by the "hidden" type
	// 		if (el.type == "hidden") {
	// 			selectedAnswerElement = el;
	// 		}
	// 	}
	// 	let numericAnswer = Number(selectedAnswerElement.value);
	// 	const ul = document.getElementsByTagName("ul");
	// 	const lis = ul[0].getElementsByTagName("li");
	// 	for (const li of lis) {
	// 		let i = li
	// 			.getElementsByTagName("div")[0]
	// 			.getElementsByTagName("div")[0]
	// 			.getElementsByTagName("input")[0].value;
	// 		i = Number(i[i.length - 1]);
	// 		if (i == numericAnswer) {
	// 			answer = li
	// 				.getElementsByTagName("div")[0]
	// 				.getElementsByTagName("div")[0]
	// 				.getElementsByClassName("style-0")[0].innerHTML;
	// 		}
	// 	}
	// } else if (questionType == "multipleChoice") {
	// 	const liInputs = document.getElementsByClassName("answerOrder");
	// 	let selectedAnswerElement;
	// 	for (const el of liInputs) {
	// 		// For n out of m or 1 out of m selections, identify the element which has the answer by the "hidden" type
	// 		if (el.type == "hidden") {
	// 			selectedAnswerElement = el;
	// 		}
	// 	}
	// 	let numericAnswers = selectedAnswerElement.value
	// 		.split(",")
	// 		.map((v) => Number(v));
	// 	answer = [];
	// 	const ul = document.getElementsByTagName("ul");
	// 	const lis = ul[0].getElementsByTagName("li");
	// 	for (const li of lis) {
	// 		let i = li
	// 			.getElementsByTagName("div")[0]
	// 			.getElementsByTagName("div")[0]
	// 			.getElementsByTagName("input")[0].value;
	// 		i = Number(i[i.length - 1]);
	// 		let textValue = li
	// 			.getElementsByTagName("div")[0]
	// 			.getElementsByTagName("div")[0]
	// 			.getElementsByClassName("style-0")[0].innerHTML;
	// 		if (numericAnswers.includes(i)) {
	// 			answer.push(textValue);
	// 		}
	// 	}
	// }

	return answer;
}

function handleButtonClick() {
	// Step 1: Get answer and store in global variable
	global_answer = getAnswer(questionType);

	// Step 2: Get existing data from session storage
	let payload = JSON.parse(sessionStorage.getItem("payload")) || {
		open_answers: {},
		item_batteries: {},
		timestamps: {},
	};

	if (questionType === "OES") {
		payload["open_answers"][questionID] = global_answer;
		// } else if (questionType === "IBS") {
		// 	// global answer is already an array of items here
		// 	payload["item_batteries"][questionID] = global_answer;
		// } else if (questionType === "TS") {
		// 	let oldDeltaT = 0;
		// 	if (Object.keys(payload["timestamps"]).includes(questionID)) {
		// 		oldDeltaT = payload["timestamps"][questionID];
		// 	}
		// 	let deltaT = Date.now() - startTime;
		// 	payload["timestamps"][questionID] = oldDeltaT + deltaT;
	}
	let redemScore;

	// Step 3: Trigger API
	const surveyCompleted = checkSurveyCompleted();
	if (surveyCompleted) {
		alert("The survey is complete. Sending payload to Redem API now ...");
		redemScore = triggerAPI(payload);
	}

	// Step 4: Set session storage items
	sessionStorage.setItem(
		"sessionStorage",
		JSON.stringify(SESSION_STORAGE_HELPERS)
	);
	sessionStorage.setItem("payload", JSON.stringify(payload));
}

function handleIncludeExclude(response) {
	console.log(
		"get api response and set to the input/screenout logic",
		response
	);
}

function initButtonListener() {
	if (document.getElementById("btn_send_ahead")) {
		var nextBtn = document.getElementById("btn_send_ahead");
		nextBtn.onclick = handleButtonClick;
	} else {
		window.setTimeout("initButtonListener()", 10);
	}
}

function setRedemScoreToAnswer(redemScore) {
	let inputs = document.getElementsByTagName("input");
	for (const el of inputs) {
		if (el.type == "number") {
			el.value = redemScore;
			el.click();
		}
	}
}

async function triggerAPI(payload) {
	const datapoints = [];
	for (let i = 0; i < Object.keys(payload["open_answers"]).length; i++) {
		let questionID = Object.keys(payload["open_answers"])[i];
		datapoints.push({
			dataPointIdentifier: questionID,
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
	// for (let i = 0; i < Object.keys(payload["timestamps"]).length; i++) {
	// 	let questionID = Object.keys(payload["timestamps"])[i];
	// 	datapoints.push({
	// 		dataPointIdentifier: questionID,
	// 		timeStamp: payload["timestamps"][questionID],
	// 	});

	let redemScore = -998;

	fetch(`${BASE_URL}/live-respondent/create`, {
		method: "POST",
		mode: "cors",
		body: JSON.stringify({
			respondentID: `${new Date().getTime()}`,
			datapoints: datapoints,
			hashed_magic_key: hashed_magic_key,
		}),
		referrer: "origin",
		headers: {
			"Content-Type": "application/json",
		},
	})
		.then(function (response) {
			// The API call was successful!
			if (response.ok) {
				return response.json();
			} else {
				return Promise.reject(response);
			}
		})
		.then(function (data) {
			// This is the JSON from our response
			console.warn("Successfull!", data);
			handleIncludeExclude(data);
			alert("Success:" + JSON.stringify(data));
		})
		.catch(function (err) {
			// There was an error
			console.warn("Something went wrong ->", err);
			alert("error:" + err.message);
		});

	// 	alert(data.message);
	// 	const data = await res.json();
	// 	redemScore = data.body.redemScore;
	// 	alert("API call succeeded!");
	// 	alert(data.message);
	// } catch (error) {
	// 	alert("API call failed");
	// 	redemScore = -997;
	// 	alert(error);
	// } finally {
	// 	alert("Redem Score in finally block: " + String(redemScore));
	// 	return redemScore;
	// }
}

SESSION_STORAGE_HELPERS = JSON.parse(
	sessionStorage.getItem("sessionStorage")
) || {
	totalScore: -999,
	surveyStart: false,
};

initButtonListener();
