// Check if Speech Recognition is supported
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (!SpeechRecognition) {
    alert("Your browser does not support speech recognition. Try using Chrome.");
} else {
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    // DOM Elements
    const healthIssueInput = document.getElementById("health-issue");
    const getAdviceButton = document.getElementById("get-advice");
    const adviceResult = document.getElementById("advice-result");
    const micButton = document.getElementById("mic-button");
    const micContainer = document.querySelector(".mic-container");

    let isListening = false;
    let listeningTimeout = null;

    function startListening() {
        isListening = true;
        recognition.start();
        micButton.style.display = "none";

        const dots = document.createElement("div");
        dots.classList.add("listening-dots");
        dots.innerHTML = "<span></span><span></span><span></span>";

        dots.addEventListener("click", stopListening);

        // Force animation trigger
        void dots.offsetHeight;

        micContainer.appendChild(dots);

        // Stop listening automatically after 7 seconds (fallback)
        listeningTimeout = setTimeout(() => {
            stopListening();
        }, 7000);
    }

    function stopListening() {
        if (!isListening) return;

        isListening = false;
        recognition.stop();
        micButton.style.display = "inline";

        const dots = document.querySelector(".listening-dots");
        if (dots) dots.remove();

        if (listeningTimeout) {
            clearTimeout(listeningTimeout);
            listeningTimeout = null;
        }
    }

    // Mic button click
    micButton.addEventListener("click", () => {
        if (!isListening) {
            startListening();
        } else {
            stopListening();
        }
    });

    // Speech recognition result
    recognition.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        healthIssueInput.value = speechResult;
        getAdviceButton.click();
    };

    recognition.onend = () => {
        stopListening();
    };

    recognition.onerror = (event) => {
        alert("Speech recognition error: " + event.error);
        stopListening();
    };

    // Get health advice from API
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
