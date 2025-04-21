// Check if Speech Recognition is supported
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Your browser does not support speech recognition. Try using Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false; // Only get final speech results
    recognition.continuous = false; // Stop after capturing speech

    // DOM Elements
    const healthIssueInput = document.getElementById("health-issue");
    const getAdviceButton = document.getElementById("get-advice");
    const adviceResult = document.getElementById("advice-result");
    const micButton = document.getElementById("mic-button");

    let isListening = false;

    // Click event to start/stop speech recognition
    micButton.addEventListener("click", () => {
        if (!isListening) {
            recognition.start();
            micButton.textContent = "🎙️ Listening...";
            isListening = true;
        } else {
            recognition.stop();
            micButton.textContent = "🎤"; // Reset button after stopping
            isListening = false;
        }
    });

    // Capture speech and insert into input field
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        healthIssueInput.value = speechResult;
    };

    // When recognition ends, reset the mic button
    recognition.onend = () => {
        micButton.textContent = "🎤";
        isListening = false;
    };

    // Handle errors
    recognition.onerror = (event) => {
        alert("Speech recognition error: " + event.error);
        micButton.textContent = "🎤";
        isListening = false;
    };

    // Function to fetch health advice
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

    // Function to display advice
    function displayAdvice(advice) {
        adviceResult.innerHTML = advice;
    }

    // Get Advice button event
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

    // Enter key triggers Get Advice
    healthIssueInput.addEventListener("keypress", async (e) => {
        if (e.key === "Enter") {
            getAdviceButton.click();
        }
    });
}