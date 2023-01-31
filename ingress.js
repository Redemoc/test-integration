
function checkSurveyCompleted(currentQ) {
	let surveyCompleted = false;
	// find surveyCompleted
	function checkSurveyCompleted(currentQ) {
		let surveyCompleted = false;
		// find surveyCompleted

		var qCount = 1;
		var validQue = false;
		do {
			var validQue = `${"%Q"+qCount+",text%"}`;
			console.log("Print", validQue);
									qCount++;
		} while (validQue);

		if(validQue == qCount){
			surveyCompleted = true;
		}
		return surveyCompleted;

}


function getAnswer(questionType) {
	let answer;
	if (questionType == "openEnded") {
		let inputs = document.getElementsByTagName("input");
		for (const el of inputs) {
			if (el.type == "text") {
				answer = el.value;
			}
		}
	} else if (questionType == "singleChoice") {
		const liInputs = document.getElementsByClassName("answerOrder");
		let selectedAnswerElement;
		for (const el of liInputs) {
			// For n out of m or 1 out of m selections, identify the element which has the answer by the "hidden" type
			if (el.type == "hidden") {
				selectedAnswerElement = el;
			}
		}
		let numericAnswer = Number(selectedAnswerElement.value);
		const ul = document.getElementsByTagName("ul");
		const lis = ul[0].getElementsByTagName("li");
		for (const li of lis) {
			let i = li.getElementsByTagName("div")[0].getElementsByTagName("div")[0].
				getElementsByTagName("input")[0].value;
			i = Number(i[i.length-1]);
			if (i == numericAnswer) {
				answer = li.getElementsByTagName("div")[0].
				getElementsByTagName("div")[0].getElementsByClassName("style-0")[0].innerHTML;
			}
		}
	} else if (questionType == "multipleChoice") {
		const liInputs = document.getElementsByClassName("answerOrder");
		let selectedAnswerElement;
		for (const el of liInputs) {
			// For n out of m or 1 out of m selections, identify the element which has the answer by the "hidden" type
			if (el.type == "hidden") {
				selectedAnswerElement = el;
			}
		}
		let numericAnswers = selectedAnswerElement.value.split(",").map(v => Number(v));
		answer = [];
		const ul = document.getElementsByTagName("ul");
		const lis = ul[0].getElementsByTagName("li");
		for (const li of lis) {
			let i = li.getElementsByTagName("div")[0].getElementsByTagName("div")[0].
				getElementsByTagName("input")[0].value;
			i = Number(i[i.length-1]);
			let textValue = li.getElementsByTagName("div")[0].
				getElementsByTagName("div")[0].getElementsByClassName("style-0")[0].innerHTML
			if (numericAnswers.includes(i)) {
				answer.push(textValue);
			}
		}
	}
	return answer;
}

function handleButtonClick() {
	console.log("test click");
	var currentQ = "%Q_NUMBER%";
	var ans = "%Q1,result%";
	var que = "%Q1,text%";
	console.log("test click",currentQ, ans, que);


// 	var question = %Q%Q_NUMBER%,text%;
// var answer = %Q%Q_NUMBER%,result%;
// console.log("looping each question:answer load", question, answer);


	// Step 1: Save data to sessionStorage
	// let payload = JSON.parse(sessionStorage.getItem("payload"))|| { "answers": [] };
	// payload["answers"].push(global_answer);
	// sessionStorage.setItem("payload",JSON.stringify(payload));

	// Step 2: Trigger API
	const surveyCompleted = checkSurveyCompleted(currentQ);
	if (surveyCompleted) {
		alert("The survey is complete. Sending payload to Redem API now ...");
		triggerAPI(payload);
	}
}

function triggerAPI(payload) {
	// TODO 1 format global_answer and add to body

	fetch("http://localhost:8000/respondent/create", {
		method: "POST",
		body: JSON.stringify({
			respondentID: `${new Date().getTime()}`,
			surveyID: SURVEY_ID,
			datapoints: [
				{
					dataPointIdentifier: "DP1",
					timeStamp: 10,
				},
				{
					dataPointIdentifier: "DP2",
					itemBattery: [6, 1, 2, 3, 4, 5, 1, 1, 1, 1],
					numberOfItems: 10,
				},
				{
					dataPointIdentifier: "DP3",
					openEndedAnswer: "antwort 2",
				},
			],
		}),
		headers: {
			magic_key: MAGIC_KEY,
			api_key: INTEGRATION_KEY,
			Accept: "application/json",
			"Content-Type": "application/json",
		},
		referrer: "no-referrer",
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
			alert(JSON.stringify(data));
		})
		.catch(function (err) {
			// There was an error
			console.warn("Something went wrong.", err);
			alert(err.message);
		});
}

function initButtonListener() {
	if (document.getElementById("btn_send_ahead")) {
		var nextBtn = document.getElementById("btn_send_ahead");
		nextBtn.onclick = handleButtonClick;
	} else {
		window.setTimeout("initButtonListener()", 10);
	}
}

initButtonListener();
