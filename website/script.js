document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const healthIssueInput = document.getElementById('health-issue');
    const micButton = document.getElementById('mic-button');
    const getAdviceButton = document.getElementById('get-advice');
    const adviceResult = document.getElementById('advice-result');
    const currentYearElement = document.getElementById('current-year');
    
    // Set current year in the footer
    currentYearElement.textContent = new Date().getFullYear();
    
    // Initialize speech recognition
    let recognition = null;
    let isListening = false;
    const isRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    
    if (isRecognitionSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        healthIssueInput.value = transcript;
        stopListening();
        
        // Auto submit after voice recognition
        setTimeout(() => {
          getAdviceButton.click();
        }, 300);
      };
      
      recognition.onend = function() {
        stopListening();
      };
      
      recognition.onerror = function(event) {
        console.error("Speech recognition error:", event.error);
        stopListening();
      };
    } else {
      micButton.style.opacity = '0.5';
      micButton.style.cursor = 'not-allowed';
      micButton.title = 'Voice input is not supported in your browser';
    }
    
    // Listen for mic button clicks
    micButton.addEventListener('click', function() {
      if (!isRecognitionSupported) return;
      
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
        const listeningAnimation = document.createElement('div');
        listeningAnimation.id = 'listening-animation';
        listeningAnimation.innerHTML = `
          <div class="dot dot1"></div>
          <div class="dot dot2"></div>
          <div class="dot dot3"></div>
        `;
        
        // Add to mic container
        const micContainer = document.querySelector('.mic-container');
        micContainer.appendChild(listeningAnimation);
        
        // Start recognition
        try {
          recognition.start();
          
          // Safety timeout - stop listening after 7 seconds if no result
          setTimeout(() => {
            if (isListening) {
              stopListening();
            }
          }, 7000);
        } catch (e) {
          console.error('Error starting speech recognition:', e);
          stopListening();
        }
      }
    }
    
    function stopListening() {
      if (recognition && isListening) {
        isListening = false;
        
        // Remove listening animation
        const listeningAnimation = document.getElementById('listening-animation');
        if (listeningAnimation) {
          listeningAnimation.remove();
        }
        
        // Stop recognition
        try {
          recognition.stop();
        } catch (e) {
          console.log('Recognition already stopped');
        }
      }
    }
    
    // Handle get advice button click
    getAdviceButton.addEventListener('click', async function() {
      const healthIssue = healthIssueInput.value.trim();
      
      if (!healthIssue) {
        showError("Please describe your health issue to get advice.");
        return;
      }
      
      showLoading();
      
      try {
        const advice = await getHealthAdvice(healthIssue);
        displayAdvice(advice, healthIssue);
      } catch (error) {
        showError(error.message || "Network error. Please check your connection and try again.");
      }
    });
    
    // Handle enter key press in input
    healthIssueInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        getAdviceButton.click();
      }
    });
    
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
        
        if (response.ok && data.candidates && data.candidates[0]) {
          return data.candidates[0].content.parts[0].text;
        } else {
          throw new Error(data.error ? data.error.message : "Failed to fetch advice");
        }
      } catch (error) {
        console.error("API request failed:", error);
        throw new Error("Network error. Please check your connection and try again.");
      }
    }
    
    // Display advice in the result container
    function displayAdvice(advice, query) {
      const formattedAdvice = formatAdvice(advice);
      
      const adviceHTML = `
        <div class="result-header">
          <div class="hex-icon" style="width: 32px; height: 28px; margin-right: 10px;">
            <svg xmlns="http://www.w3.org/2000/svg" class="icon" style="width: 16px; height: 16px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 class="result-title">Health Advice for "${query}"</h3>
        </div>
        <div class="result-content">
          ${formattedAdvice}
        </div>
        <div class="disclaimer-note">
          <b>Note:</b> This advice is generated by AI and should not replace professional medical consultation. 
          If you're experiencing a medical emergency, please call emergency services immediately.
        </div>
      `;
      
      adviceResult.innerHTML = adviceHTML;
      adviceResult.classList.add('show');
      
      // Scroll to result if needed
      setTimeout(() => {
        adviceResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    // Format advice text with proper structure
    function formatAdvice(text) {
      // Split by paragraphs (double line breaks)
      const paragraphs = text.split('\n\n');
      
      let formattedContent = '';
      
      // Process paragraphs
      paragraphs.forEach(para => {
        if (para.trim()) {
          // Check if paragraph is a list
          if (para.includes('- ')) {
            const listItems = para.split('- ').filter(item => item.trim());
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
    
    // Show loading state
    function showLoading() {
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
    }
    
    // Show error message
    function showError(message) {
      const isInputError = message.includes('Please describe');
      
      adviceResult.innerHTML = `
        <div class="${isInputError ? 'warning' : 'error'}">
          <div class="${isInputError ? 'warning-icon' : 'error-icon'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${
                isInputError 
                  ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                  : 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
              }" />
            </svg>
          </div>
          <div class="${isInputError ? 'warning-message' : 'error-message'}">
            ${message}
          </div>
        </div>
      `;
      adviceResult.classList.add('show');
    }
  });