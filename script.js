const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Your browser does not support speech recognition. Try using Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    const healthIssueInput = document.getElementById("health-issue");
    const getAdviceButton = document.getElementById("get-advice");
    const adviceResult = document.getElementById("advice-result");
    const micButton = document.getElementById("mic-button");
    const micContainer = document.querySelector(".mic-container");

    // ✅ MIC ANIMATION LOGIC
    let isListening = false;
    let timeoutId;

    function startListening() {
        isListening = true;
        recognition.start();

        // Hide mic button and show dots
        micButton.style.display = 'none';
        const dots = document.createElement('div');
        dots.className = 'listening-dots';
        dots.innerHTML = '<span></span><span></span><span></span>';
        micContainer.appendChild(dots);

        // Set timeout for automatic stop
        timeoutId = setTimeout(() => {
            if (isListening) stopListening();
        }, 5000);
    }

    function stopListening() {
        if (!isListening) return;
        isListening = false;

        clearTimeout(timeoutId);
        recognition.stop();

        // Remove dots and show mic button
        const dots = micContainer.querySelector('.listening-dots');
        if (dots) dots.remove();
        micButton.style.display = 'block';
    }

    micButton.addEventListener("click", () => {
        if (!isListening) {
            startListening();
        } else {
            stopListening();
        }
    });

    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        healthIssueInput.value = speechResult;
        getAdviceButton.click();
        stopListening();
    };

    recognition.onend = () => {
        stopListening();
    };

    recognition.onerror = (event) => {
        stopListening();
        alert("Speech recognition error: " + event.error);
    };

    // Rest of your existing code (getHealthAdvice, displayAdvice, etc.)
    async function getHealthAdvice(issue) {
        const API_KEY = "AIzaSyDJP_zSrVOGFPrN0aNqeiGEiGexzAe0aNQ";
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

        try {
            const response = await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Provide first aid or health advice for: ${issue}`,
                        }],
                    }],
                }),
            });

            const data = await response.json();
            if (response.ok) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error(data.error.message || "Failed to fetch advice");
            }
        } catch (error) {
            return `Error: ${error.message}`;
        }
    }

    function displayAdvice(advice) {
        adviceResult.innerHTML = advice;
    }

    getAdviceButton.addEventListener("click", async () => {
        const issue = healthIssueInput.value.trim();
        if (!issue) {
            alert("Please describe your health issue.");
            return;
        }
        adviceResult.textContent = "Fetching advice...";
        const advice = await getHealthAdvice(issue);
        displayAdvice(advice);
    });

    healthIssueInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            getAdviceButton.click();
        }
    });
}
