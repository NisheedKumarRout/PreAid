document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const healthInput = document.getElementById('health-issue');
    const micButton = document.getElementById('mic-button');
    const getAdviceButton = document.getElementById('get-advice');
    const adviceResult = document.getElementById('advice-result');
    const currentYearElement = document.getElementById('current-year');
    
    // Set current year in the footer
    currentYearElement.textContent = new Date().getFullYear();
    
    // Initialize speech recognition if available
    let recognition = null;
    let isListening = false;
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        healthInput.value = transcript;
        stopListening();
        
        // Auto submit after voice recognition
        setTimeout(() => {
          getAdviceButton.click();
        }, 500);
      };
      
      recognition.onend = function() {
        stopListening();
      };
      
      recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
        stopListening();
        
        // Show error message if needed
        if (event.error === 'not-allowed') {
          showError("Microphone access was denied. Please allow microphone access in your browser settings.");
        }
      };
    } else {
      // Speech recognition not supported
      micButton.disabled = true;
      micButton.title = "Voice input is not supported in your browser";
      micButton.style.opacity = 0.5;
    }
    
    // Mic button event listener
    micButton.addEventListener('click', function() {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    });
    
    function startListening() {
      if (recognition) {
        isListening = true;
        
        // Create listening animation
        const listeningIndicator = document.createElement('div');
        listeningIndicator.className = 'listening-indicator';
        listeningIndicator.innerHTML = `
          <div class="listening-dot dot1"></div>
          <div class="listening-dot dot2"></div>
          <div class="listening-dot dot3"></div>
        `;
        listeningIndicator.onclick = stopListening;
        
        // Add to input container
        const micContainer = micButton.parentElement;
        micContainer.appendChild(listeningIndicator);
        
        // Start recognition
        try {
          recognition.start();
          
          // Auto-stop after 10 seconds (safety)
          setTimeout(() => {
            if (isListening) {
              stopListening();
            }
          }, 10000);
        } catch (error) {
          console.error("Error starting recognition:", error);
          stopListening();
        }
      }
    }
    
    function stopListening() {
      if (recognition && isListening) {
        isListening = false;
        
        // Remove listening animation
        const listeningIndicator = document.querySelector('.listening-indicator');
        if (listeningIndicator) {
          listeningIndicator.remove();
        }
        
        // Stop recognition
        try {
          recognition.stop();
        } catch (error) {
          console.error("Error stopping recognition:", error);
        }
      }
    }
    
    // Get advice button click handler
    getAdviceButton.addEventListener('click', async function() {
      const healthIssue = healthInput.value.trim();
      
      if (!healthIssue) {
        showError("Please describe your health issue to get advice.");
        return;
      }
      
      // Show loading state
      showLoading();
      
      try {
        const advice = await getHealthAdvice(healthIssue);
        displayAdvice(advice, healthIssue);
      } catch (error) {
        console.error("Error getting advice:", error);
        showError(error.message || "Failed to get health advice. Please try again later.");
      }
    });
    
    // Handle enter key press in the input field
    healthInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        getAdviceButton.click();
      }
    });
    
    async function getHealthAdvice(issue) {
      // Use Gemini API for health advice
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
        
        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch advice");
        }
        
        if (!data.candidates || !data.candidates[0]) {
          throw new Error("No response received from AI");
        }
        
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error("API error:", error);
        throw new Error("Network error. Please check your connection and try again.");
      }
    }
    
    function displayAdvice(advice, query) {
      // Format advice for display
      const formattedAdvice = formatAdvice(advice);
      
      // Create HTML for advice
      const adviceHTML = `
        <div class="result-header">
          <div class="hex-icon-small">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="result-title">Health Advice for "${query}"</h3>
        </div>
        <div class="result-content">
          ${formattedAdvice}
        </div>
        <div class="disclaimer-box">
          <p class="disclaimer-text">
            <b>Note:</b> This advice is generated by AI and should not replace professional medical consultation. 
            If you're experiencing a medical emergency, please call emergency services immediately.
          </p>
        </div>
      `;
      
      // Display the advice
      adviceResult.innerHTML = adviceHTML;
      adviceResult.classList.add('show');
      adviceResult.style.display = 'block';
      
      // Scroll to result
      adviceResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    function formatAdvice(text) {
      // Split by line breaks
      const paragraphs = text.split('\n\n');
      
      let formattedContent = '';
      
      // Process first paragraph as title if it looks like one
      if (paragraphs.length > 0 && paragraphs[0].length < 100) {
        formattedContent += `<h3>${paragraphs[0]}</h3>`;
        paragraphs.shift();
      }
      
      // Process remaining paragraphs
      paragraphs.forEach(para => {
        if (para.trim()) {
          // Check if paragraph is a list
          if (para.includes("- ")) {
            const listItems = para.split("- ").filter(item => item.trim());
            formattedContent += '<ul>';
            listItems.forEach(item => {
              formattedContent += `<li>${item.trim()}</li>`;
            });
            formattedContent += '</ul>';
          } else {
            formattedContent += `<p>${para}</p>`;
          }
        }
      });
      
      return formattedContent;
    }
    
    function showLoading() {
      // Display loading animation
      adviceResult.innerHTML = `
        <div class="loading">
          <div class="loading-icon">
            <div class="loading-pulse"></div>
            <div class="loading-hex">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <p class="loading-text">Analyzing your health concern...</p>
        </div>
      `;
      adviceResult.classList.add('show');
      adviceResult.style.display = 'block';
    }
    
    function showError(message) {
      // Display error message
      const isInputError = message.includes("Please describe your health issue");
      
      adviceResult.innerHTML = `
        <div class="error">
          <div class="error-icon">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isInputError 
                ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' 
                : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'}" />
            </svg>
          </div>
          <div class="error-content">
            <p class="error-title">${isInputError ? 'Input Required' : 'Error'}</p>
            <p class="error-message">${message}</p>
          </div>
        </div>
      `;
      adviceResult.classList.add('show');
      adviceResult.style.display = 'block';
    }
  });