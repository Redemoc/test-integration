
// Redem Variables
let global_answer;
// const qNumber = "%Q_NUMBER%";


// Customer inputs
	const params = document.body.getElementsByTagName('script');
	query = params[0].classList;
	const questionID = query[1];
	const questionType = query[0];
	const position = query[2];
	const hashed_magic_key = query[3];
	console.log("hashed_magic_key:", hashed_magic_key, " questionType:",questionType,  " Start/End/None:", position, " questionID:", questionID);

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

	// Step 1: Save data to sessionStorage
	global_answer = getAnswer(questionType);
	console.log(
		"test click",
		global_answer,
		questionID,
		questionType
	);

	let payload = JSON.parse(sessionStorage.getItem("payload")) || {
		answers: [],
	};
	payload["answers"].push(global_answer);
	sessionStorage.setItem("payload", JSON.stringify(payload));

	// Step 2: Trigger API
	const surveyCompleted = checkSurveyCompleted();
	if (surveyCompleted) {
		alert("The survey is complete. Sending payload to Redem API now ...");
		triggerAPI(payload);
	}
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

function triggerAPI(payload) {
	fetch("http://127.0.0.1:8000/live-respondent/create", {
		method: "POST",
		mode: 'cors',
		body: JSON.stringify({
			respondentID: `${new Date().getTime()}`,
			hashed_magic_key: hashed_magic_key,
			datapoints: [
				{
					dataPointIdentifier: "Timestamp 1",
					timeStamp: 4800,
				},
				{
					dataPointIdentifier: "OE 1",
					openEndedAnswer: "antwort 1",
				}
			],
		}),
		referrer: "origin",
		headers: {
			'Content-Type': 'application/json',
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
}

initButtonListener();
