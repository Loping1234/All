        const statusElement = document.getElementById('currentStatus');
        const faceStatusElement = document.getElementById('faceStatus');
        const faceTextElement = document.getElementById('faceText');
        const earValueElement = document.getElementById('earValue');
        const yawnProbElement = document.getElementById('yawnProb');

        const timestampElement = document.getElementById('timestamp');
        const faceDirectionElement = document.getElementById('faceDirection');
        const timeAwayElement = document.getElementById('timeAway');

        // Distraction alert variables
        let lastAlertCount = 0;
        let alertSound = null;
        const motivationalMessages = [
            "🎯 Stay focused! You've got this!",
            "💪 Remember your goals - keep pushing forward!",
            "🌟 Every moment of focus brings you closer to success!",
            "🔥 You're capable of amazing things - stay concentrated!",
            "⚡ Focus is your superpower - use it wisely!",
            "🎊 Great minds focus on what matters - like yours!",
            "🚀 Your future self will thank you for staying focused!",
            "💎 Diamonds are formed under pressure - stay strong!",
            "🏆 Champions are made through focused effort!",
            "🌅 Each focused minute is an investment in your dreams!"
        ];

        const statusMessages = {
            'focused': 'FOCUSED',
            'yawning': 'YAWNING DETECTED',
            'drowsy': 'DROWSINESS DETECTED',
            'not_present': 'NOT PRESENT'
        };

        // Webcam feed disconnect handling
        let statusFailureCount = 0;
        let overlayFromPolling = false;
        const videoFeedImg = document.querySelector('.video-feed');
        const videoContainerEl = document.querySelector('.video-container');
        const feedOverlay = document.getElementById('feedOverlay');

        function showFeedOverlay() {
            if (feedOverlay) feedOverlay.classList.add('visible');
        }

        function hideFeedOverlay() {
            if (feedOverlay) feedOverlay.classList.remove('visible');
        }

        function reconnectFeed() {
            if (!videoFeedImg) return;
            const baseSrc = videoFeedImg.src.split('?')[0];
            videoFeedImg.src = baseSrc + '?t=' + Date.now();
            hideFeedOverlay();
        }

        if (videoFeedImg) {
            videoFeedImg.addEventListener('error', showFeedOverlay);
            videoFeedImg.addEventListener('load', hideFeedOverlay);
        }

        function updateFeedGlow(status) {
            if (!videoContainerEl) return;
            videoContainerEl.classList.remove('feed-focused', 'feed-warning', 'feed-danger');
            if (status === 'focused') {
                videoContainerEl.classList.add('feed-focused');
            } else if (status === 'yawning' || status === 'drowsy') {
                videoContainerEl.classList.add('feed-warning');
            } else {
                videoContainerEl.classList.add('feed-danger');
            }
        }

        function updateStatus() {
            fetch(`${API_BASE_URL}/status`)
                .then(response => response.json())
                .then(data => {
                    // Connection restored: clear any polling-triggered overlay
                    statusFailureCount = 0;
                    if (overlayFromPolling) {
                        overlayFromPolling = false;
                        hideFeedOverlay();
                    }

                    // Update main status
                    const status = data.status;
                    const statusText = statusMessages[status] || status.toUpperCase();

                    statusElement.textContent = statusText;
                    statusElement.className = `current-status status-${status}`;
                    updateFeedGlow(status);
                    
                    // Update face detection
                    if (data.face_found) {
                        faceStatusElement.className = 'status-indicator indicator-online';
                        faceTextElement.textContent = 'Detected';
                    } else {
                        faceStatusElement.className = 'status-indicator indicator-offline';
                        faceTextElement.textContent = 'Not Found';
                    }
                    
                    // Update metrics
                    earValueElement.textContent = data.ear_value || '0.000';
                    yawnProbElement.textContent = data.yawn_prob || '0.00';
                    

                    
                    // Update face direction and time away
                    faceDirectionElement.textContent = data.face_forward ? 'Forward' : 'Looking Away';
                    faceDirectionElement.style.color = data.face_forward ? '#4CAF50' : '#f44336';
                    
                    timeAwayElement.textContent = `${data.time_since_attentive || 0}s`;
                    timeAwayElement.style.color = (data.time_since_attentive || 0) > 2 ? '#f44336' : '#4CAF50';
                    
                    // Update timestamp
                    const now = new Date();
                    timestampElement.textContent = `Last updated: ${now.toLocaleTimeString()}`;

                    // Handle distraction alerts
                    if (data.distraction_alert_count > lastAlertCount) {
                        showDistractionAlert();
                        lastAlertCount = data.distraction_alert_count;
                    }
                })
                .catch(error => {
                    console.error('Error fetching status:', error);
                    statusElement.textContent = 'CONNECTION ERROR';
                    statusElement.className = 'current-status status-not_present';
                    updateFeedGlow('not_present');

                    // Show the disconnect overlay after ~3s of failed polls
                    statusFailureCount++;
                    if (statusFailureCount >= 6) {
                        overlayFromPolling = true;
                        showFeedOverlay();
                    }
                });
        }

        // Update status every 500ms for real-time feel
        setInterval(updateStatus, 500);
        
        // Initial update
        updateStatus();

        // Session Timer Functionality
        let sessionDuration = window.APP_CONFIG.sessionDuration; // seconds, injected by the template
        let remainingTime = sessionDuration;
        let timerInterval;
        let currentZoom = 100;
        let sessionNotes = localStorage.getItem('sessionNotes_' + Date.now()) || '';

        function startTimer() {
            timerInterval = setInterval(updateTimer, 1000);
            updateTimer(); // Initial call
        }

        function updateTimer() {
            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                alert('⏰ Session time completed! Well done!');
                endSession();
                return;
            }

            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            document.getElementById('sessionTimer').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            
            // Update progress bar
            const progress = ((sessionDuration - remainingTime) / sessionDuration) * 100;
            document.getElementById('progressBar').style.width = progress + '%';
            
            remainingTime--;
        }

        function endSession() {
            clearInterval(timerInterval);
            window.location.href = window.APP_CONFIG.endSessionUrl;
        }

        // Document Viewer Functions
        function viewDocument(filename) {
            const preview = document.getElementById('documentPreview');
            const fileExtension = filename.split('.').pop().toLowerCase();
            
            // Construct the correct URL path for uploaded files
            const fileUrl = `${API_BASE_URL}/uploads/${encodeURIComponent(filename)}`;
            
            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                preview.innerHTML = `
                    <div class="document-display" id="documentDisplay">
                        <img src="${fileUrl}" 
                             style="width: 100%; height: auto; max-height: 100%; object-fit: contain; zoom: ${currentZoom}%;" 
                             alt="Document Image">
                    </div>
                `;
            } else if (fileExtension === 'pdf') {
                // Use Google Docs viewer as fallback to avoid Edge blocking
                const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(window.location.origin + '/uploads/' + filename)}&embedded=true`;
                preview.innerHTML = `
                    <div class="document-display" id="documentDisplay">
                        <div style="display: flex; flex-direction: column; height: 100%; min-height: 600px;">
                            <div style="padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: #fff; font-weight: 500;">📄 ${filename.split('_').slice(2).join('_') || filename}</span>
                                <a href="${fileUrl}" target="_blank" download style="padding: 6px 12px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">
                                    📥 Download PDF
                                </a>
                            </div>
                            <object data="${fileUrl}" type="application/pdf" style="flex: 1; width: 100%; min-height: 550px; zoom: ${currentZoom}%;">
                                <iframe src="${fileUrl}#toolbar=1&navpanes=0" style="width: 100%; height: 100%; min-height: 550px; border: none;">
                                    <p style="text-align: center; padding: 50px; color: #666;">
                                        Your browser cannot display PDFs. 
                                        <a href="${fileUrl}" target="_blank" style="color: #4CAF50;">Click here to download</a>
                                    </p>
                                </iframe>
                            </object>
                        </div>
                    </div>
                `;
            } else {
                preview.innerHTML = `
                    <div class="document-display" id="documentDisplay">
                        <div style="text-align: center; padding: 100px; color: #666;">
                            <h4>📄 ${filename.split('_').slice(2).join('_')}</h4>
                            <p>This file type cannot be previewed directly.</p>
                            <a href="${fileUrl}" 
                               target="_blank" class="tool-btn" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background: #4CAF50; color: white; text-decoration: none; border-radius: 6px;">
                                📥 Download to View
                            </a>
                        </div>
                    </div>
                `;
            }
        }

        // Tools Functions
        function zoomIn() {
            currentZoom = Math.min(currentZoom + 25, 200);
            updateZoom();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom - 25, 50);
            updateZoom();
        }

        function updateZoom() {
            document.getElementById('zoomLevel').textContent = currentZoom + '%';
            const docDisplay = document.getElementById('documentDisplay');
            if (docDisplay) {
                const imgs = docDisplay.querySelectorAll('img');
                const iframes = docDisplay.querySelectorAll('iframe');
                
                imgs.forEach(img => {
                    img.style.zoom = currentZoom + '%';
                });
                
                iframes.forEach(iframe => {
                    iframe.style.zoom = currentZoom + '%';
                });
            }
        }

        function toggleNotes() {
            const modal = document.getElementById('notesModal');
            const textarea = document.getElementById('notesTextarea');
            
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
                // Save notes when closing
                sessionNotes = textarea.value;
                localStorage.setItem('sessionNotes_' + new Date().toDateString(), sessionNotes);
            } else {
                modal.classList.add('active');
                textarea.value = sessionNotes;
                textarea.focus();
            }
        }

        // Chat Functions
        let chatMessages = [];
        let currentChatMode = 'ask_anything'; // Default mode - Always start with "Ask Anything"
        
        function toggleChat() {
            const modal = document.getElementById('chatModal');
            
            if (modal.classList.contains('active')) {
                modal.classList.remove('active');
                modal.classList.remove('maximized');
                document.getElementById('chatOverlay').classList.remove('active');
            } else {
                modal.classList.add('active');
                document.getElementById('chatInput').focus();
                
                // Ensure mode is set to "Ask Anything" when opening chat
                if (!currentChatMode || currentChatMode === '') {
                    currentChatMode = 'ask_anything';
                    // Update button states to match
                    const askAnythingBtn = document.getElementById('askAnythingBtn');
                    const askDocumentBtn = document.getElementById('askDocumentBtn');
                    if (askAnythingBtn && askDocumentBtn) {
                        askAnythingBtn.classList.add('active');
                        askDocumentBtn.classList.remove('active');
                    }
                }
            }
        }

        function minimizeChat() {
            const modal = document.getElementById('chatModal');
            const overlay = document.getElementById('chatOverlay');
            const maximizeBtn = document.getElementById('maximizeBtn');
            
            modal.classList.remove('active');
            modal.classList.remove('maximized');
            overlay.classList.remove('active');
            
            // Reset maximize button icon
            maximizeBtn.innerHTML = '⛶';
            maximizeBtn.setAttribute('onclick', 'maximizeChat()');
            maximizeBtn.setAttribute('title', 'Maximize');
        }

        function maximizeChat() {
            const modal = document.getElementById('chatModal');
            const overlay = document.getElementById('chatOverlay');
            const maximizeBtn = document.getElementById('maximizeBtn');
            
            if (modal.classList.contains('maximized')) {
                // Restore to normal size
                modal.classList.remove('maximized');
                overlay.classList.remove('active');
                maximizeBtn.innerHTML = '⛶';
                maximizeBtn.setAttribute('title', 'Maximize');
            } else {
                // Maximize
                modal.classList.add('maximized');
                overlay.classList.add('active');
                maximizeBtn.innerHTML = '🗗';
                maximizeBtn.setAttribute('title', 'Restore');
            }
        }

        function setChatMode(mode) {
            currentChatMode = mode;
            
            // Update button styles
            const askAnythingBtn = document.getElementById('askAnythingBtn');
            const askDocumentBtn = document.getElementById('askDocumentBtn');
            
            if (mode === 'ask_anything') {
                askAnythingBtn.classList.add('active');
                askDocumentBtn.classList.remove('active');
                addChatMessage('system', '🌐 Mode: <strong>Ask Anything</strong> - You can now ask me any question!');
            } else {
                askAnythingBtn.classList.remove('active');
                askDocumentBtn.classList.add('active');
                addChatMessage('system', '📄 Mode: <strong>Ask from Document</strong> - I will answer based on your uploaded documents.');
            }
        }

        function sendChatMessage() {
            const input = document.getElementById('chatInput');
            const sendBtn = document.getElementById('sendChatBtn');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Disable input while processing
            input.disabled = true;
            sendBtn.disabled = true;
            sendBtn.textContent = '⏳';
            
            // Add user message to chat
            addChatMessage('user', message);
            input.value = '';
            
            // Add loading indicator
            const loadingId = addLoadingMessage();
            
            // Send to backend
            fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    mode: currentChatMode
                })
            })
            .then(response => response.json())
            .then(data => {
                // Remove loading indicator
                removeLoadingMessage(loadingId);
                
                if (data.success) {
                    // Add AI response with formatted text
                    addChatMessage('ai', formatAIResponse(data.response));
                    
                    // Show document count if in document mode
                    if (data.mode === 'ask_document' && data.documents_used) {
                        addChatMessage('system', `📚 Answer based on ${data.documents_used} uploaded document(s).`);
                    }
                } else {
                    // Show error message
                    addChatMessage('error', `❌ Error: ${data.error}`);
                    
                    // Auto-switch to "Ask Anything" mode if documents are missing
                    if (data.suggestion === 'ask_anything' && currentChatMode === 'ask_document') {
                        setTimeout(() => {
                            setChatMode('ask_anything');
                            addChatMessage('system', '✅ Automatically switched to "Ask Anything" mode. You can now ask any question!');
                        }, 1000);
                    }
                }
            })
            .catch(error => {
                console.error('Chat error:', error);
                removeLoadingMessage(loadingId);
                addChatMessage('error', '❌ Failed to get response. Please check your connection and try again.');
            })
            .finally(() => {
                // Re-enable input
                input.disabled = false;
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send';
                input.focus();
            });
        }

        function addChatMessage(sender, message) {
            const messagesContainer = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            
            // Different styling based on sender
            if (sender === 'user') {
                messageDiv.className = 'chat-message user-message';
                messageDiv.innerHTML = `<strong>You:</strong> ${escapeHtml(message)}`;
            } else if (sender === 'ai') {
                messageDiv.className = 'chat-message ai-message';
                // Allow HTML in AI responses (for formatting)
                messageDiv.innerHTML = `<strong>AI Assistant:</strong> ${message}`;
            } else if (sender === 'system') {
                messageDiv.className = 'chat-message ai-message';
                messageDiv.style.background = '#2d4a4a';
                messageDiv.style.borderLeft = '4px solid #4CAF50';
                messageDiv.innerHTML = message;
            } else if (sender === 'error') {
                messageDiv.className = 'chat-message ai-message';
                messageDiv.style.background = '#4a2d2d';
                messageDiv.style.borderLeft = '4px solid #f44336';
                messageDiv.innerHTML = message;
            }
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            chatMessages.push({ sender, message, timestamp: new Date() });
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function formatAIResponse(text) {
            // Format AI response with proper line breaks and structure
            let formatted = escapeHtml(text);
            
            // Convert markdown-style formatting
            // Bold text: **text** or __text__
            formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            formatted = formatted.replace(/__(.+?)__/g, '<strong>$1</strong>');
            
            // Italic text: *text* or _text_
            formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
            formatted = formatted.replace(/_(.+?)_/g, '<em>$1</em>');
            
            // Headers: ### Header
            formatted = formatted.replace(/###\s+(.+?)(\n|$)/g, '<h4 style="margin: 10px 0 5px 0; color: #4CAF50;">$1</h4>');
            formatted = formatted.replace(/##\s+(.+?)(\n|$)/g, '<h3 style="margin: 10px 0 5px 0; color: #4CAF50;">$1</h3>');
            
            // Bullet points: - item or * item
            formatted = formatted.replace(/^[\-\*]\s+(.+)$/gm, '<li style="margin-left: 20px;">$1</li>');
            
            // Numbered lists: 1. item
            formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li style="margin-left: 20px; list-style-type: decimal;">$1</li>');
            
            // Line breaks: double newline = paragraph break
            formatted = formatted.replace(/\n\n/g, '</p><p style="margin: 8px 0;">');
            formatted = '<p style="margin: 8px 0;">' + formatted + '</p>';
            
            // Single line breaks
            formatted = formatted.replace(/\n/g, '<br>');
            
            // Wrap consecutive <li> tags in <ul>
            formatted = formatted.replace(/(<li[^>]*>.*?<\/li>\s*)+/gs, '<ul style="margin: 5px 0; padding-left: 20px;">$&</ul>');
            
            return formatted;
        }

        let loadingMessageId = 0;
        
        function addLoadingMessage() {
            const messagesContainer = document.getElementById('chatMessages');
            const messageDiv = document.createElement('div');
            const id = 'loading-' + (++loadingMessageId);
            
            messageDiv.id = id;
            messageDiv.className = 'chat-message ai-message';
            messageDiv.style.background = '#2d3a4a';
            messageDiv.innerHTML = `
                <strong>AI Assistant:</strong> 
                <span class="loading-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </span>
                <span style="color: #888; font-size: 0.9em;"> Thinking...</span>
            `;
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            return id;
        }
        
        function removeLoadingMessage(id) {
            const loadingMsg = document.getElementById(id);
            if (loadingMsg) {
                loadingMsg.remove();
            }
        }

        function handleChatEnter(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendChatMessage();
            }
        }

        // Mini Games Configuration
        const workingGames = {
            crazyGames: [
                {
                    id: 'candy-riddles',
                    name: 'Candy Riddles',
                    provider: 'CrazyGames',
                    description: 'Match candies and solve sweet puzzles! Great for pattern recognition.',
                    embedUrl: 'https://www.crazygames.com/embed/candy-riddles',
                    thumbnail: '/static/images/games/candy-riddles.jpeg',
                    gradient: 'linear-gradient(135deg, #FF6B9D, #FFC371)',
                    duration: 3,
                    category: 'puzzle'
                },
                {
                    id: 'block-puzzle',
                    name: 'Block Puzzle',
                    provider: 'CrazyGames',
                    description: 'Fit blocks into a grid. Perfect for spatial reasoning and focus!',
                    embedUrl: 'https://www.crazygames.com/embed/block-puzzle',
                    thumbnail: '/static/images/games/block-puzzle.jpeg',
                    gradient: 'linear-gradient(135deg, #667EEA, #764BA2)',
                    duration: 3,
                    category: 'puzzle'
                },
                {
                    id: 'merge-cakes',
                    name: 'Merge Cakes',
                    provider: 'CrazyGames',
                    description: 'Merge identical cakes to create bigger ones. Strategic thinking game!',
                    embedUrl: 'https://www.crazygames.com/embed/merge-cakes',
                    thumbnail: '/static/images/games/merge-cakes.avif',
                    gradient: 'linear-gradient(135deg, #F093FB, #F5576C)',
                    duration: 3,
                    category: 'logic'
                },
                {
                    id: '2048',
                    name: '2048',
                    provider: 'CrazyGames',
                    description: 'Combine numbers to reach 2048. Great for math and strategy!',
                    embedUrl: 'https://www.crazygames.com/embed/2048',
                    thumbnail: '/static/images/games/2048.jpeg',
                    gradient: 'linear-gradient(135deg, #4FACFE, #00F2FE)',
                    duration: 3,
                    category: 'logic'
                },
                {
                    id: 'word-search',
                    name: 'Word Search',
                    provider: 'CrazyGames',
                    description: 'Find hidden words in a grid. Perfect for vocabulary and focus!',
                    embedUrl: 'https://www.crazygames.com/embed/word-search',
                    thumbnail: '/static/images/games/word-search.png',
                    gradient: 'linear-gradient(135deg, #43E97B, #38F9D7)',
                    duration: 3,
                    category: 'word'
                },
                {
                    id: 'helix-jump',
                    name: 'Helix Jump',
                    provider: 'CrazyGames',
                    description: 'Bounce the ball down the helix tower! Tests timing and reflexes.',
                    embedUrl: 'https://www.crazygames.com/embed/helix-jump',
                    thumbnail: '/static/images/games/helix-jump.jpeg',
                    gradient: 'linear-gradient(135deg, #FA8BFF, #2BD2FF)',
                    duration: 3,
                    category: 'arcade'
                }
            ],

            getAllGames() {
                return [...this.crazyGames];
            },

            getRandomGame() {
                const games = this.getAllGames();
                return games[Math.floor(Math.random() * games.length)];
            }
        };

        // Game Timer Variables
        let gameTimerInterval = null;
        let gameTimeRemaining = 0;

        // Mini Games Functions
        function openMiniGames() {
            console.log('Opening Mini Games modal...');
            const modal = document.getElementById('gamesModal');
            
            if (!modal) {
                console.error('Games modal element not found!');
                alert('Error: Games modal not found. Please refresh the page.');
                return;
            }
            
            console.log('Modal found, adding show class...');
            modal.classList.add('show');
            modal.classList.remove('minimized');
            
            console.log('Calling displayGames()...');
            displayGames();
        }

        function closeGames() {
            const modal = document.getElementById('gamesModal');
            modal.classList.remove('show');
            modal.classList.remove('maximized');
            modal.classList.remove('minimized');
        }

        function minimizeGames() {
            const modal = document.getElementById('gamesModal');
            modal.classList.add('minimized');
            modal.classList.remove('maximized');
        }

        function maximizeGames() {
            const modal = document.getElementById('gamesModal');
            if (modal.classList.contains('maximized')) {
                modal.classList.remove('maximized');
                document.getElementById('maxGamesBtn').textContent = '⛶';
            } else {
                modal.classList.add('maximized');
                modal.classList.remove('minimized');
                document.getElementById('maxGamesBtn').textContent = '◱';
            }
        }

        function displayGames() {
            console.log('displayGames() called');
            const gamesGrid = document.getElementById('gamesGrid');
            
            if (!gamesGrid) {
                console.error('Games grid element not found!');
                return;
            }
            
            console.log('Getting all games from workingGames...');
            const games = workingGames.getAllGames();
            console.log(`Found ${games ? games.length : 0} games`);

            if (!games || games.length === 0) {
                console.warn('No games available');
                gamesGrid.innerHTML = `
                    <div class="games-empty">
                        <div class="games-empty-icon">🎮</div>
                        <p>No games available at the moment</p>
                    </div>
                `;
                return;
            }

            console.log('Rendering games HTML...');
            const gamesHTML = games.map(game => `
                <div class="game-card" onclick="playGame('${game.id}')">
                    <div class="game-thumbnail" style="background: ${game.gradient};">
                        <img src="${game.thumbnail}" 
                             style="width: 100%; height: 100%; object-fit: cover; display: block;" 
                             alt="${game.name}" 
                             onerror="this.style.display='none'">
                    </div>
                    <div class="game-card-overlay">
                        <h3 class="game-overlay-title">${game.name}</h3>
                        <p class="game-overlay-description">${game.description}</p>
                        <div class="game-overlay-meta">
                            <span class="game-overlay-category">${game.category}</span>
                            <span class="game-overlay-duration">${game.duration} min</span>
                        </div>
                        <button class="game-play-btn" onclick="event.stopPropagation(); playGame('${game.id}')">
                            ▶ Play Now
                        </button>
                    </div>
                    <div class="game-card-info">
                        <h4 class="game-title">${game.name}</h4>
                        <div class="game-meta">
                            <span class="game-category">${game.category}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            gamesGrid.innerHTML = gamesHTML;
            console.log('Games rendered successfully!');
        }

        function playGame(gameId) {
            const games = workingGames.getAllGames();
            const game = games.find(g => g.id === gameId);

            if (!game) {
                alert('Game not found!');
                return;
            }

            const overlay = document.getElementById('gamePlayerOverlay');
            const content = document.getElementById('gamePlayerContent');
            const title = document.getElementById('gamePlayerTitle');

            // Set game title
            title.textContent = game.name;

            // Create iframe with game
            content.innerHTML = `
                <iframe 
                    src="${game.embedUrl}" 
                    class="game-player-iframe"
                    allow="autoplay; fullscreen; gamepad; microphone; camera"
                    allowfullscreen>
                </iframe>
            `;

            // Start timer
            gameTimeRemaining = game.duration * 60; // Convert minutes to seconds
            startGameTimer();

            // Show overlay
            overlay.classList.add('active');

            // Close games modal if open
            closeGames();
        }

        function startGameTimer() {
            // Clear any existing timer
            if (gameTimerInterval) {
                clearInterval(gameTimerInterval);
            }

            updateGameTimerDisplay();

            gameTimerInterval = setInterval(() => {
                gameTimeRemaining--;

                if (gameTimeRemaining <= 0) {
                    clearInterval(gameTimerInterval);
                    gameTimerInterval = null;
                    showGameTimeUp();
                } else {
                    updateGameTimerDisplay();
                }
            }, 1000);
        }

        function updateGameTimerDisplay() {
            const minutes = Math.floor(gameTimeRemaining / 60);
            const seconds = gameTimeRemaining % 60;
            const timerElement = document.getElementById('gameTimer');
            timerElement.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;

            // Change color when time is running out
            if (gameTimeRemaining <= 60) {
                timerElement.style.background = '#ef4444';
            } else if (gameTimeRemaining <= 120) {
                timerElement.style.background = '#f59e0b';
            } else {
                timerElement.style.background = '#10b981';
            }
        }

        function showGameTimeUp() {
            const userChoice = confirm('⏰ Time\'s up! Your break is over. Ready to get back to studying?');
            
            if (userChoice) {
                // User clicked OK - close game and return to studying
                closeGamePlayer();
            } else {
                // User clicked Cancel - give 30 more seconds as final warning
                gameTimeRemaining = 30; // Set to 30 seconds
                updateGameTimerDisplay();
                
                // Show notification
                const timerElement = document.getElementById('gameTimer');
                const originalText = timerElement.textContent;
                timerElement.textContent = '⚠️ Final 30 seconds!';
                timerElement.style.background = '#ef4444';
                
                setTimeout(() => {
                    timerElement.textContent = originalText;
                }, 2000);
                
                // Continue countdown but force close after 30 seconds
                gameTimerInterval = setInterval(() => {
                    gameTimeRemaining--;

                    if (gameTimeRemaining <= 0) {
                        clearInterval(gameTimerInterval);
                        gameTimerInterval = null;
                        // Force close without asking - time is really up!
                        showFinalGameTimeUp();
                    } else {
                        updateGameTimerDisplay();
                    }
                }, 1000);
            }
        }

        function showFinalGameTimeUp() {
            // Force close after the 30 second grace period
            alert('⏰ Time is really up now! Returning to your studies. Stay focused! 💪');
            closeGamePlayer();
        }

        function closeGamePlayer() {
            const overlay = document.getElementById('gamePlayerOverlay');
            const content = document.getElementById('gamePlayerContent');

            // Stop timer
            if (gameTimerInterval) {
                clearInterval(gameTimerInterval);
                gameTimerInterval = null;
            }

            // Clear iframe
            content.innerHTML = '';

            // Hide overlay
            overlay.classList.remove('active');

            // Show games modal again
            openMiniGames();
        }

        // Close game player when clicking outside
        document.getElementById('gamePlayerOverlay').addEventListener('click', function(e) {
            if (e.target === this) {
                if (confirm('Are you sure you want to quit the game?')) {
                    closeGamePlayer();
                }
            }
        });

        // Video Recommendations Function (placeholder)
        function getVideoRecommendations() {
            const modal = document.getElementById('videoModal');
            modal.classList.add('show');
            modal.classList.remove('minimized');
        }

        function closeVideo() {
            const modal = document.getElementById('videoModal');
            modal.classList.remove('show');
            modal.classList.remove('maximized');
            modal.classList.remove('minimized');
        }

        function minimizeVideo() {
            const modal = document.getElementById('videoModal');
            modal.classList.add('minimized');
            modal.classList.remove('maximized');
        }

        function maximizeVideo() {
            const modal = document.getElementById('videoModal');
            if (modal.classList.contains('maximized')) {
                modal.classList.remove('maximized');
                document.getElementById('maxVideoBtn').textContent = '⛶';
            } else {
                modal.classList.add('maximized');
                modal.classList.remove('minimized');
                document.getElementById('maxVideoBtn').textContent = '◱';
            }
        }

        function handleVideoEnter(event) {
            if (event.key === 'Enter') {
                searchVideos();
            }
        }

        async function searchVideos() {
            const topicInput = document.getElementById('videoTopicInput');
            const topic = topicInput.value.trim();
            const resultsContainer = document.getElementById('videoResultsContainer');
            const searchBtn = document.getElementById('searchVideoBtn');

            if (!topic) {
                resultsContainer.innerHTML = `
                    <div class="video-error">
                        ⚠️ Please enter a topic to search for videos
                    </div>
                `;
                return;
            }

            // Show loading state
            searchBtn.disabled = true;
            searchBtn.textContent = '🔍 Searching...';
            resultsContainer.innerHTML = `
                <div class="video-loading">
                    <div class="video-loading-spinner"></div>
                    <p style="margin-top: 15px;">Searching for videos on "${topic}"...</p>
                </div>
            `;

            try {
                const response = await fetch(`${API_BASE_URL}/get_video_recommendations`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ topic: topic })
                });

                const data = await response.json();

                if (data.success) {
                    displayVideos(data.videos, topic);
                } else {
                    resultsContainer.innerHTML = `
                        <div class="video-error">
                            ❌ ${data.error || 'Failed to fetch videos'}
                        </div>
                    `;
                }
            } catch (error) {
                console.error('Error fetching videos:', error);
                resultsContainer.innerHTML = `
                    <div class="video-error">
                        ❌ Network error. Please check your connection and try again.
                    </div>
                `;
            } finally {
                searchBtn.disabled = false;
                searchBtn.textContent = '🔍 Search Videos';
            }
        }

        function displayVideos(videos, topic) {
            const resultsContainer = document.getElementById('videoResultsContainer');

            if (!videos || videos.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="video-empty">
                        <div class="video-empty-icon">📹</div>
                        <p>No videos found for "${topic}"</p>
                        <p style="font-size: 12px;">Try a different search term</p>
                    </div>
                `;
                return;
            }

            const videosHTML = videos.map(video => `
                <div class="video-card" onclick="playVideo('${video.embedUrl}', '${escapeHtml(video.title)}')">
                    <img src="${video.thumbnail}" alt="${escapeHtml(video.title)}" class="video-thumbnail" />
                    <div class="video-info">
                        <div class="video-title">${escapeHtml(video.title)}</div>
                        <div class="video-channel">📺 ${escapeHtml(video.channel)}</div>
                        <div class="video-description">${escapeHtml(video.description)}</div>
                    </div>
                </div>
            `).join('');

            resultsContainer.innerHTML = `
                <div style="color: #9ca3af; font-size: 13px; margin-bottom: 15px;">
                    Found ${videos.length} videos for "${escapeHtml(topic)}" - Click any video to watch
                </div>
                <div class="video-results">
                    ${videosHTML}
                </div>
            `;
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function playVideo(embedUrl, title) {
            const overlay = document.getElementById('videoPlayerOverlay');
            const iframe = document.getElementById('videoPlayerIframe');
            const titleElement = document.getElementById('videoPlayerTitle');

            iframe.src = embedUrl + '?autoplay=1';
            titleElement.textContent = title;
            overlay.classList.add('active');
        }

        function closeVideoPlayer() {
            const overlay = document.getElementById('videoPlayerOverlay');
            const iframe = document.getElementById('videoPlayerIframe');

            iframe.src = '';
            overlay.classList.remove('active');
        }

        // Close video player when clicking outside
        document.getElementById('videoPlayerOverlay').addEventListener('click', function(e) {
            if (e.target === this) {
                closeVideoPlayer();
            }
        });

        function saveNotes() {
            const textarea = document.getElementById('notesTextarea');
            sessionNotes = textarea.value;
            localStorage.setItem('sessionNotes_' + new Date().toDateString(), sessionNotes);
            
            // Visual feedback
            const btn = event.target;
            const originalText = btn.textContent;
            btn.textContent = 'Saved!';
            btn.style.background = '#4CAF50';
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.background = '#4CAF50';
            }, 1500);
        }

        function clearNotes() {
            if (confirm('Are you sure you want to clear all notes?')) {
                document.getElementById('notesTextarea').value = '';
                sessionNotes = '';
            }
        }

        function downloadNotes() {
            const notes = document.getElementById('notesTextarea').value || sessionNotes;
            if (!notes.trim()) {
                alert('No notes to download!');
                return;
            }

            const blob = new Blob([notes], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            
            const now = new Date();
            const filename = `Session_Notes_${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2,'0')}-${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}-${now.getMinutes().toString().padStart(2,'0')}.txt`;
            
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            alert('📥 Notes downloaded successfully!');
        }

        // Music Functions — Web Audio API Binaural Beat Generator
        // No MP3 file needed — generates focus tones directly in the browser
        let binauralContext = null;
        let binauralNodes = {};
        let isPlaying = false;
        let musicVolume = 0.5;

        // Binaural beat presets for focus
        const FOCUS_PRESET = {
            baseFreq: 200,       // Carrier frequency (Hz)
            beatFreq: 10,        // Beat frequency: 10Hz = Alpha (relaxed focus)
            ambientFreq: 432,    // Ambient tone (Hz)
        };

        function initBinauralContext() {
            if (binauralContext) return true;
            try {
                binauralContext = new (window.AudioContext || window.webkitAudioContext)();
                return true;
            } catch (e) {
                console.error('Web Audio API not supported:', e);
                return false;
            }
        }

        function startBinauralBeats() {
            if (!initBinauralContext()) return;

            // Resume context if suspended (browser autoplay policy)
            if (binauralContext.state === 'suspended') {
                binauralContext.resume();
            }

            const ctx = binauralContext;
            const masterGain = ctx.createGain();
            masterGain.gain.value = musicVolume * 0.3; // Keep it subtle
            masterGain.connect(ctx.destination);

            // Left channel — base frequency
            const leftOsc = ctx.createOscillator();
            leftOsc.type = 'sine';
            leftOsc.frequency.value = FOCUS_PRESET.baseFreq;

            // Right channel — base + beat frequency (creates binaural beat)
            const rightOsc = ctx.createOscillator();
            rightOsc.type = 'sine';
            rightOsc.frequency.value = FOCUS_PRESET.baseFreq + FOCUS_PRESET.beatFreq;

            // Ambient low tone for depth
            const ambientOsc = ctx.createOscillator();
            ambientOsc.type = 'sine';
            ambientOsc.frequency.value = FOCUS_PRESET.ambientFreq;
            const ambientGain = ctx.createGain();
            ambientGain.gain.value = 0.08;

            // Channel splitter — left/right stereo
            const splitter = ctx.createChannelMerger(2);
            const leftGain = ctx.createGain();
            leftGain.gain.value = 1.0;
            const rightGain = ctx.createGain();
            rightGain.gain.value = 1.0;

            leftOsc.connect(leftGain);
            rightOsc.connect(rightGain);
            leftGain.connect(splitter, 0, 0);
            rightGain.connect(splitter, 0, 1);
            splitter.connect(masterGain);

            ambientOsc.connect(ambientGain);
            ambientGain.connect(masterGain);

            // Start oscillators
            leftOsc.start();
            rightOsc.start();
            ambientOsc.start();

            binauralNodes = { masterGain, leftOsc, rightOsc, ambientOsc, ambientGain };

            // Update UI
            document.getElementById('musicStatus').textContent = '🎵 Alpha Binaural Beats - Playing';
            document.getElementById('playPauseBtn').textContent = '⏸️';

            // Start time display
            startMusicTimeDisplay();
        }

        function stopBinauralBeats() {
            if (!binauralNodes.leftOsc) return;
            try {
                // Fade out gracefully
                const ctx = binauralContext;
                const gain = binauralNodes.masterGain;
                gain.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
                setTimeout(() => {
                    try {
                        binauralNodes.leftOsc.stop();
                        binauralNodes.rightOsc.stop();
                        binauralNodes.ambientOsc.stop();
                    } catch(e) {}
                    binauralNodes = {};
                }, 600);
            } catch(e) {
                binauralNodes = {};
            }
        }

        let musicStartTime = null;
        let musicDisplayInterval = null;

        function startMusicTimeDisplay() {
            musicStartTime = Date.now();
            clearInterval(musicDisplayInterval);
            musicDisplayInterval = setInterval(() => {
                if (!isPlaying) { clearInterval(musicDisplayInterval); return; }
                const elapsed = Math.floor((Date.now() - musicStartTime) / 1000);
                const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
                const secs = (elapsed % 60).toString().padStart(2, '0');
                const timeEl = document.getElementById('musicTime');
                if (timeEl) timeEl.textContent = `${mins}:${secs} / ∞`;
            }, 1000);
        }

        function toggleMusic() {
            const playPauseBtn = document.getElementById('playPauseBtn');
            const musicStatus = document.getElementById('musicStatus');

            if (isPlaying) {
                // Pause — suspend context
                if (binauralContext) binauralContext.suspend();
                stopBinauralBeats();
                playPauseBtn.textContent = '▶️';
                musicStatus.textContent = '⏸️ Binaural Beats — Paused';
                clearInterval(musicDisplayInterval);
                isPlaying = false;
            } else {
                // Play
                startBinauralBeats();
                isPlaying = true;
            }
        }

        function updateVolume() {
            const volumeSlider = document.getElementById('volumeSlider');
            const volumePercentage = document.getElementById('volumePercentage');
            musicVolume = volumeSlider.value / 100;
            volumePercentage.textContent = volumeSlider.value + '%';

            // Update live if playing
            if (binauralNodes.masterGain) {
                binauralNodes.masterGain.gain.setTargetAtTime(musicVolume * 0.3, binauralContext.currentTime, 0.1);
            }
        }

        function updateMusicTime() {
            // Handled by startMusicTimeDisplay interval
        }

        function formatTime(seconds) {
            if (isNaN(seconds)) return '00:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }

        function initializeMusic() {
            // Update status to indicate readiness
            const musicStatus = document.getElementById('musicStatus');
            const playPauseBtn = document.getElementById('playPauseBtn');
            if (musicStatus) musicStatus.textContent = '🎵 Alpha Binaural Beats — Ready';
            if (playPauseBtn) {
                playPauseBtn.style.opacity = '1';
                playPauseBtn.disabled = false;
            }
        }


        // Initialize features when page loads
        document.addEventListener('DOMContentLoaded', function() {
            // Load saved notes
            const savedNotes = localStorage.getItem('sessionNotes_' + new Date().toDateString());
            if (savedNotes) {
                sessionNotes = savedNotes;
            }
            
            // Start the session timer
            startTimer();
            
            // Initialize music controls
            initializeMusic();
            
            // Close notes modal when clicking outside
            document.addEventListener('click', function(e) {
                const modal = document.getElementById('notesModal');
                if (e.target === modal) {
                    toggleNotes();
                }
            });

            // Initialize alert sound (simple beep using Web Audio API)
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                alertSound = audioContext;
            } catch (e) {
                console.log('Web Audio API not supported');
            }
        });

        // Distraction Alert Functions
        function showDistractionAlert() {
            // Play alert sound
            playAlertSound();
            
            // Show visual alert
            showVisualAlert();
            
            // Show motivational message
            showMotivationalMessage();
        }

        function playAlertSound() {
            if (alertSound) {
                try {
                    const oscillator = alertSound.createOscillator();
                    const gainNode = alertSound.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(alertSound.destination);
                    
                    oscillator.frequency.value = 800; // 800 Hz tone
                    gainNode.gain.setValueAtTime(0.3, alertSound.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, alertSound.currentTime + 0.5);
                    
                    oscillator.start(alertSound.currentTime);
                    oscillator.stop(alertSound.currentTime + 0.5);
                } catch (e) {
                    console.log('Could not play alert sound');
                }
            }
        }

        function showVisualAlert() {
            // Create alert overlay
            const alertOverlay = document.createElement('div');
            alertOverlay.className = 'distraction-alert-overlay';
            alertOverlay.innerHTML = `
                <div class="alert-content">
                    <div class="alert-icon">⚠️</div>
                    <div class="alert-title">DISTRACTION DETECTED!</div>
                    <div class="alert-subtitle">Please return to your study session</div>
                </div>
            `;
            
            // Add CSS styles
            alertOverlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 9999;
                animation: alertPulse 0.5s ease-in-out;
            `;
            
            const alertContent = alertOverlay.querySelector('.alert-content');
            alertContent.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                animation: alertShake 0.5s ease-in-out;
            `;
            
            const alertIcon = alertOverlay.querySelector('.alert-icon');
            alertIcon.style.cssText = `
                font-size: 4rem;
                margin-bottom: 15px;
                animation: alertBounce 0.5s ease-in-out infinite;
            `;
            
            const alertTitle = alertOverlay.querySelector('.alert-title');
            alertTitle.style.cssText = `
                font-size: 1.8rem;
                font-weight: bold;
                color: #d32f2f;
                margin-bottom: 10px;
                font-family: 'Colonna MT', serif;
            `;
            
            const alertSubtitle = alertOverlay.querySelector('.alert-subtitle');
            alertSubtitle.style.cssText = `
                font-size: 1.2rem;
                color: #666;
            `;
            
            // Add CSS animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes alertPulse {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
                @keyframes alertShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
                @keyframes alertBounce {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
            
            document.body.appendChild(alertOverlay);
            
            // Remove alert after 3 seconds
            setTimeout(() => {
                if (alertOverlay.parentNode) {
                    alertOverlay.remove();
                }
                if (style.parentNode) {
                    style.remove();
                }
            }, 3000);
        }

        function showMotivationalMessage() {
            const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
            
            // Create motivational toast
            const toast = document.createElement('div');
            toast.className = 'motivational-toast';
            toast.textContent = randomMessage;
            
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 15px 20px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                z-index: 10000;
                font-weight: 600;
                max-width: 300px;
                animation: slideInRight 0.5s ease-out, fadeOut 0.5s ease-out 9.5s forwards;
            `;
            
            // Add slide animation
            const toastStyle = document.createElement('style');
            toastStyle.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes fadeOut {
                    to {
                        opacity: 0;
                        transform: translateX(100%);
                    }
                }
            `;
            document.head.appendChild(toastStyle);
            
            document.body.appendChild(toast);
            
            // Remove toast after 10 seconds
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
                if (toastStyle.parentNode) {
                    toastStyle.remove();
                }
            }, 10000);
        }

        // ============================================
        // TTS (Text-to-Speech) Functionality
        // ============================================

        class DocumentTTS {
            constructor() {
                this.synthesis = window.speechSynthesis;
                this.currentUtterance = null;
                this.isPlaying = false;
                this.isPaused = false;
                this.voices = [];
                
                // PDF support
                this.pdfDoc = null;
                this.currentPdfPage = 1;
                this.totalPdfPages = 0;
                this.pdfText = '';
                this.currentFileUrl = null;
                
                // Track progress for precise resuming
                this.currentText = '';
                this.lastCharIndex = 0; // Track exact character position
                
                this.init();
            }

            init() {
                this.loadVoices();
                this.setupEventListeners();
                this.detectCurrentDocument();
                
                // Load voices when they become available
                if (this.synthesis.onvoiceschanged !== undefined) {
                    this.synthesis.onvoiceschanged = () => {
                        this.loadVoices();
                    };
                }
            }

            loadVoices() {
                this.voices = this.synthesis.getVoices();
                const voiceSelect = document.getElementById('voiceSelect');
                
                if (!voiceSelect) return;
                
                voiceSelect.innerHTML = '';

                // Filter for English voices (both local and online)
                const englishVoices = this.voices.filter(voice => 
                    voice.lang.toLowerCase().includes('en')
                );

                if (englishVoices.length === 0) {
                    // Fallback to all voices if no English voices found
                    this.voices.forEach(voice => {
                        const option = document.createElement('option');
                        option.value = voice.name;
                        option.textContent = `${voice.name} (${voice.lang})`;
                        voiceSelect.appendChild(option);
                    });
                } else {
                    englishVoices.forEach(voice => {
                        const option = document.createElement('option');
                        option.value = voice.name;
                        const serviceType = voice.localService ? '🔊' : '☁️';
                        option.textContent = `${serviceType} ${voice.name}`;
                        voiceSelect.appendChild(option);
                    });
                }

                // Select first voice by default
                if (voiceSelect.options.length > 0) {
                    voiceSelect.selectedIndex = 0;
                }
            }

            setupEventListeners() {
                // Event listeners are handled via oninput attributes now
                // This ensures real-time updates
            }

            async detectCurrentDocument() {
                // Check if there's a PDF loaded
                const iframe = document.querySelector('.document-display iframe');
                if (iframe && iframe.src) {
                    const src = iframe.src;
                    if (src.includes('.pdf') || src.includes('file_id=')) {
                        this.currentFileUrl = src;
                        await this.loadPDF(src);
                    }
                }
            }

            async loadPDF(url) {
                try {
                    if (typeof pdfjsLib === 'undefined') {
                        console.error('PDF.js not loaded');
                        return false;
                    }

                    this.updateStatus('Loading PDF...');
                    
                    // Load the PDF document
                    const loadingTask = pdfjsLib.getDocument(url);
                    this.pdfDoc = await loadingTask.promise;
                    this.totalPdfPages = this.pdfDoc.numPages;
                    this.currentPdfPage = 1;
                    
                    // Show PDF controls
                    const pdfControls = document.getElementById('pdfControls');
                    if (pdfControls) {
                        pdfControls.style.display = 'block';
                    }
                    
                    this.updatePdfPageInfo();
                    this.updateStatus('PDF loaded - ' + this.totalPdfPages + ' pages');
                    
                    return true;
                } catch (error) {
                    console.error('Error loading PDF:', error);
                    this.updateStatus('Failed to load PDF');
                    return false;
                }
            }

            async extractTextFromPdfPage(pageNum) {
                try {
                    const page = await this.pdfDoc.getPage(pageNum);
                    const textContent = await page.getTextContent();
                    const textItems = textContent.items.map(item => item.str);
                    return textItems.join(' ');
                } catch (error) {
                    console.error('Error extracting text from page:', error);
                    return '';
                }
            }

            async extractAllPdfText() {
                if (!this.pdfDoc) return '';
                
                this.updateStatus('Extracting text from PDF...');
                let allText = '';
                
                for (let i = 1; i <= this.totalPdfPages; i++) {
                    const pageText = await this.extractTextFromPdfPage(i);
                    allText += `Page ${i}. ${pageText} `;
                }
                
                return allText.trim();
            }

            updatePdfPageInfo() {
                // Update page input
                const pageInput = document.getElementById('pdfPageInput');
                if (pageInput) {
                    pageInput.value = this.currentPdfPage;
                    pageInput.max = this.totalPdfPages;
                }
                
                // Update total pages display
                const totalPages = document.getElementById('totalPages');
                if (totalPages) {
                    totalPages.textContent = this.totalPdfPages;
                }
            }

            async getDocumentText() {
                // Check if we have a loaded PDF
                if (this.pdfDoc) {
                    return await this.extractAllPdfText();
                }

                const docDisplay = document.querySelector('.document-display');
                if (!docDisplay) {
                    return null;
                }

                // Try to get text from iframe (PDF)
                const iframe = docDisplay.querySelector('iframe');
                if (iframe && iframe.src) {
                    // Try to load PDF with PDF.js
                    const loaded = await this.loadPDF(iframe.src);
                    if (loaded) {
                        return await this.extractAllPdfText();
                    }
                    return null;
                }

                // Try to get text from image (can't read text from images directly)
                const img = docDisplay.querySelector('img');
                if (img) {
                    return null;
                }

                // Get text from HTML content
                const textContent = docDisplay.innerText || docDisplay.textContent;
                return textContent.trim();
            }

            async getCurrentPageText() {
                if (!this.pdfDoc || this.currentPdfPage < 1 || this.currentPdfPage > this.totalPdfPages) {
                    return null;
                }
                
                return await this.extractTextFromPdfPage(this.currentPdfPage);
            }

            speak(text, startFromChar = 0) {
                if (!text || !text.trim()) {
                    this.updateStatus('No text to read. Please upload a text document.');
                    return;
                }

                this.stop(); // Stop any current speech
                
                // Store the full text
                if (text !== this.currentText) {
                    this.currentText = text;
                    this.lastCharIndex = 0;
                }
                
                // Get the text to speak (from startFromChar onwards)
                const textToSpeak = startFromChar > 0 ? text.substring(startFromChar) : text;
                
                if (!textToSpeak.trim()) {
                    this.updateStatus('✅ Finished reading');
                    return;
                }

                const utterance = new SpeechSynthesisUtterance(textToSpeak);
                
                // Apply settings
                const rateSlider = document.getElementById('ttsRate');
                const volumeSlider = document.getElementById('ttsVolume');
                const voiceSelect = document.getElementById('voiceSelect');

                utterance.rate = rateSlider ? parseFloat(rateSlider.value) : 1;
                utterance.pitch = 1; // Keep pitch neutral
                utterance.volume = volumeSlider ? parseFloat(volumeSlider.value) : 1;

                // Set voice
                if (voiceSelect) {
                    const selectedVoice = this.voices.find(
                        voice => voice.name === voiceSelect.value
                    );
                    if (selectedVoice) {
                        utterance.voice = selectedVoice;
                    }
                }

                // Track character position using boundary event
                utterance.onboundary = (event) => {
                    if (event.name === 'word') {
                        // Update the exact character position
                        this.lastCharIndex = startFromChar + event.charIndex;
                    }
                };

                // Event handlers
                utterance.onstart = () => {
                    this.isPlaying = true;
                    this.isPaused = false;
                    this.updateControls();
                    this.updateStatus('Reading document...');
                    this.highlightDocument(true);
                };

                utterance.onend = () => {
                    this.isPlaying = false;
                    this.isPaused = false;
                    this.updateControls();
                    this.updateStatus('✅ Finished reading');
                    this.highlightDocument(false);
                    this.lastCharIndex = 0;
                };

                utterance.onerror = (event) => {
                    console.error('TTS error:', event);
                    this.isPlaying = false;
                    this.updateControls();
                    this.updateStatus('❌ Error: ' + event.error);
                    this.highlightDocument(false);
                };

                utterance.onpause = () => {
                    this.isPaused = true;
                    this.updateControls();
                    this.updateStatus('⏸️ Paused');
                };

                utterance.onresume = () => {
                    this.isPaused = false;
                    this.updateControls();
                    this.updateStatus('Reading...');
                };

                this.currentUtterance = utterance;
                this.synthesis.speak(utterance);
            }

            stop() {
                this.synthesis.cancel();
                this.isPlaying = false;
                this.isPaused = false;
                this.lastCharIndex = 0;
                this.updateControls();
                this.updateStatus('⏹️ Stopped');
                this.highlightDocument(false);
            }

            // Apply settings dynamically (restart speech with new settings from exact current position)
            applySettingsLive() {
                if (this.isPlaying && this.currentText) {
                    console.log('Applying settings live, resuming from character:', this.lastCharIndex);
                    // Resume from exact character position with new settings
                    this.speak(this.currentText, this.lastCharIndex);
                }
            }

            togglePause() {
                if (!this.isPlaying) return;

                if (this.isPaused) {
                    this.synthesis.resume();
                } else {
                    this.synthesis.pause();
                }
            }

            updateControls() {
                const playBtn = document.getElementById('ttsPlayBtn');
                const stopBtn = document.getElementById('ttsStopBtn');

                if (stopBtn) {
                    stopBtn.disabled = !this.isPlaying;
                }

                if (playBtn) {
                    playBtn.disabled = !this.isPlaying;
                    playBtn.textContent = this.isPaused ? '▶️' : '⏸️';
                    
                    if (this.isPlaying && !this.isPaused) {
                        playBtn.classList.add('playing');
                    } else {
                        playBtn.classList.remove('playing');
                    }
                }
            }

            updateStatus(message) {
                const status = document.getElementById('ttsStatus');
                if (status) {
                    status.textContent = message;
                    
                    if (message.includes('Reading')) {
                        status.classList.add('reading');
                    } else {
                        status.classList.remove('reading');
                    }
                }
            }

            highlightDocument(highlight) {
                const docPreview = document.querySelector('.document-preview');
                const docDisplay = document.querySelector('.document-display');
                
                if (docPreview) {
                    if (highlight) {
                        docPreview.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(59, 130, 246, 0.1))';
                        docPreview.style.transition = 'background 0.5s ease';
                    } else {
                        docPreview.style.background = '';
                    }
                }

                if (docDisplay) {
                    if (highlight) {
                        docDisplay.style.boxShadow = '0 0 20px rgba(139, 92, 246, 0.5)';
                        docDisplay.style.transition = 'box-shadow 0.5s ease';
                    } else {
                        docDisplay.style.boxShadow = '';
                    }
                }
            }

            getSelectedText() {
                // Try to get selection from main window
                let selection = window.getSelection().toString().trim();
                
                if (selection) {
                    return selection;
                }
                
                // Try to get selection from iframe (if accessible)
                try {
                    const iframe = document.querySelector('.document-display iframe');
                    if (iframe && iframe.contentWindow) {
                        const iframeSelection = iframe.contentWindow.getSelection();
                        if (iframeSelection) {
                            selection = iframeSelection.toString().trim();
                        }
                    }
                } catch (e) {
                    // Cross-origin restriction - can't access iframe
                    console.log('Cannot access iframe selection due to CORS');
                }
                
                return selection;
            }
        }

        // Global TTS instance
        let ttsInstance = null;

        // Initialize TTS when page loads
        window.addEventListener('load', () => {
            ttsInstance = new DocumentTTS();
        });

        // TTS UI Functions
        function toggleTTS() {
            const modal = document.getElementById('ttsModal');
            if (modal) {
                modal.classList.toggle('active');
            }
        }

        async function readFullDocument() {
            if (!ttsInstance) {
                alert('TTS not initialized. Please refresh the page.');
                return;
            }

            ttsInstance.updateStatus('Loading document...');
            const text = await ttsInstance.getDocumentText();
            
            if (!text || text.length < 10) {
                alert('Please open a document first!\n\nHow to use TTS:\n1. Click on a document from "Uploaded Documents" section\n2. Wait for it to load in the viewer\n3. Then click "Read All" to read the entire document\n\nSupported formats:\n• PDFs (via PDF.js)\n• Text documents (.txt)\n• HTML content\n\nNot supported: Images');
                ttsInstance.updateStatus('No document loaded');
                return;
            }

            ttsInstance.speak(text);
        }

        async function readSelectedText() {
            if (!ttsInstance) {
                alert('TTS not initialized. Please refresh the page.');
                return;
            }

            ttsInstance.updateStatus('Checking for selected text...');
            
            // First try to get selected text from the page
            let selectedText = ttsInstance.getSelectedText();
            
            console.log('Selected text length:', selectedText ? selectedText.length : 0);
            console.log('Selected text:', selectedText);
            
            // If no text selected and we have a PDF, show text selection dialog
            if ((!selectedText || selectedText.length < 2) && ttsInstance.pdfDoc) {
                ttsInstance.updateStatus('Opening text selector...');
                await showPdfTextSelector();
                return;
            }
            
            if (!selectedText || selectedText.length < 2) {
                // If no PDF or no selection, offer alternatives
                ttsInstance.updateStatus('No text selected');
                const confirm_result = confirm('No text selected. Read entire document instead?');
                if (confirm_result) {
                    await readFullDocument();
                }
                return;
            }

            console.log('Speaking selected text:', selectedText.substring(0, 50) + '...');
            ttsInstance.speak(selectedText);
        }

        // Show PDF text selector modal for manual text selection
        async function showPdfTextSelector() {
            if (!ttsInstance || !ttsInstance.pdfDoc) {
                alert('No PDF document loaded.');
                return;
            }

            // Create modal overlay
            const overlay = document.createElement('div');
            overlay.id = 'pdfTextSelectorOverlay';
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(10, 1, 24, 0.95);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                padding: 20px;
                overflow: hidden;
            `;

            // Create header
            const header = document.createElement('div');
            header.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding: 15px;
                background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                border-radius: 10px;
            `;
            header.innerHTML = `
                <h2 style="color: white; margin: 0;">Select Text from PDF (Page ${ttsInstance.currentPdfPage})</h2>
                <button id="closePdfSelector" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 8px 15px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                ">Close</button>
            `;

            // Create text container
            const textContainer = document.createElement('div');
            textContainer.id = 'pdfTextContent';
            textContainer.style.cssText = `
                flex: 1;
                background: rgba(139, 92, 246, 0.1);
                border: 1px solid rgba(139, 92, 246, 0.3);
                border-radius: 10px;
                padding: 20px;
                overflow-y: auto;
                color: #ffffff;
                font-size: 16px;
                line-height: 1.8;
                user-select: text;
                -webkit-user-select: text;
                -moz-user-select: text;
                -ms-user-select: text;
                white-space: pre-wrap;
                word-wrap: break-word;
            `;

            // Create button container
            const buttonContainer = document.createElement('div');
            buttonContainer.style.cssText = `
                display: flex;
                gap: 10px;
                margin-top: 20px;
                justify-content: center;
            `;
            buttonContainer.innerHTML = `
                <button id="readPdfSelection" style="
                    background: linear-gradient(135deg, #8b5cf6, #3b82f6);
                    border: none;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">Read Selected Text</button>
                <button id="readFullPage" style="
                    background: linear-gradient(135deg, #3b82f6, #06b6d4);
                    border: none;
                    color: white;
                    padding: 12px 25px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: 600;
                    transition: all 0.3s ease;
                ">Read Full Page</button>
            `;

            // Assemble modal
            overlay.appendChild(header);
            overlay.appendChild(textContainer);
            overlay.appendChild(buttonContainer);
            document.body.appendChild(overlay);

            // Load current page text
            ttsInstance.updateStatus('Loading page text...');
            const pageText = await ttsInstance.getCurrentPageText();
            if (pageText) {
                textContainer.textContent = pageText;
                ttsInstance.updateStatus('Select text and click "Read Selected Text"');
            } else {
                textContainer.textContent = 'Error: Could not extract text from this page.';
                ttsInstance.updateStatus('Failed to load page text');
            }

            // Event handlers
            document.getElementById('closePdfSelector').addEventListener('click', () => {
                document.body.removeChild(overlay);
                ttsInstance.updateStatus('Text selector closed');
            });

            document.getElementById('readPdfSelection').addEventListener('click', () => {
                const selection = window.getSelection();
                const selectedText = selection.toString().trim();
                
                if (selectedText && selectedText.length > 2) {
                    document.body.removeChild(overlay);
                    ttsInstance.speak(selectedText);
                } else {
                    alert('Please select some text first!\n\nClick and drag to select text from the display above.');
                }
            });

            document.getElementById('readFullPage').addEventListener('click', () => {
                document.body.removeChild(overlay);
                if (pageText) {
                    ttsInstance.speak(`Page ${ttsInstance.currentPdfPage}. ${pageText}`);
                }
            });
        }

        async function readCurrentPage() {
            if (!ttsInstance || !ttsInstance.pdfDoc) {
                alert('No PDF document loaded.');
                return;
            }

            ttsInstance.updateStatus('Reading current page...');
            const pageText = await ttsInstance.getCurrentPageText();
            
            if (pageText) {
                ttsInstance.speak(`Page ${ttsInstance.currentPdfPage}. ${pageText}`);
            } else {
                ttsInstance.updateStatus('Could not read page');
            }
        }

        async function readNextPage() {
            if (!ttsInstance || !ttsInstance.pdfDoc) {
                alert('No PDF document loaded.');
                return;
            }

            if (ttsInstance.currentPdfPage < ttsInstance.totalPdfPages) {
                ttsInstance.currentPdfPage++;
                ttsInstance.updatePdfPageInfo();
                await readCurrentPage();
            } else {
                alert('Already on last page');
            }
        }

        async function readPreviousPage() {
            if (!ttsInstance || !ttsInstance.pdfDoc) {
                alert('No PDF document loaded.');
                return;
            }

            if (ttsInstance.currentPdfPage > 1) {
                ttsInstance.currentPdfPage--;
                ttsInstance.updatePdfPageInfo();
                await readCurrentPage();
            } else {
                alert('Already on first page');
            }
        }

        async function goToPage(pageNum) {
            if (!ttsInstance || !ttsInstance.pdfDoc) {
                alert('No PDF document loaded.');
                return;
            }

            const page = parseInt(pageNum);
            
            if (isNaN(page) || page < 1 || page > ttsInstance.totalPdfPages) {
                alert(`Please enter a valid page number between 1 and ${ttsInstance.totalPdfPages}`);
                ttsInstance.updatePdfPageInfo(); // Reset to current page
                return;
            }

            ttsInstance.currentPdfPage = page;
            ttsInstance.updatePdfPageInfo();
            
            // Optionally auto-read the page when jumping to it
            const autoRead = confirm(`Jump to page ${page}. Read this page now?`);
            if (autoRead) {
                await readCurrentPage();
            } else {
                ttsInstance.updateStatus(`Moved to page ${page}`);
            }
        }

        function stopReading() {
            if (ttsInstance) {
                ttsInstance.stop();
            }
        }

        function toggleTTSPlayPause() {
            if (ttsInstance) {
                ttsInstance.togglePause();
            }
        }

        // Debounce timer for slider updates
        let sliderDebounceTimer = null;

        // Slider update functions
        function updateTTSRate(value) {
            console.log('updateTTSRate called with value:', value);
            const rateValue = document.getElementById('ttsRateValue');
            if (rateValue) {
                rateValue.textContent = parseFloat(value).toFixed(1) + 'x';
                console.log('Rate updated to:', rateValue.textContent);
            } else {
                console.error('ttsRateValue element not found');
            }
            
            // Apply settings live with debounce
            clearTimeout(sliderDebounceTimer);
            sliderDebounceTimer = setTimeout(() => {
                if (ttsInstance) {
                    ttsInstance.applySettingsLive();
                }
            }, 500); // Wait 500ms after user stops dragging
        }

        function updateTTSVolume(value) {
            console.log('updateTTSVolume called with value:', value);
            const volumeValue = document.getElementById('ttsVolumeValue');
            if (volumeValue) {
                const percentage = Math.round(parseFloat(value) * 100);
                volumeValue.textContent = percentage + '%';
                console.log('Volume updated to:', volumeValue.textContent);
            } else {
                console.error('ttsVolumeValue element not found');
            }
            
            // Apply settings live with debounce
            clearTimeout(sliderDebounceTimer);
            sliderDebounceTimer = setTimeout(() => {
                if (ttsInstance) {
                    ttsInstance.applySettingsLive();
                }
            }, 500); // Wait 500ms after user stops dragging
        }

        function updateTTSVoice() {
            console.log('updateTTSVoice called');
            // Apply voice change immediately
            if (ttsInstance) {
                ttsInstance.applySettingsLive();
            }
        }

        // Keyboard shortcuts for TTS
        document.addEventListener('keydown', (e) => {
            // Ctrl + Shift + R - Read selected or all
            if (e.ctrlKey && e.shiftKey && e.key === 'R') {
                e.preventDefault();
                readSelectedText();
            }
            // Ctrl + Shift + S - Stop reading
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                stopReading();
            }
            // Ctrl + Shift + P - Pause/Resume
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
                e.preventDefault();
                toggleTTSPlayPause();
            }
            // Ctrl + Shift + N - Next Page (PDF)
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
                e.preventDefault();
                readNextPage();
            }
            // Ctrl + Shift + B - Previous Page (PDF)
            if (e.ctrlKey && e.shiftKey && e.key === 'B') {
                e.preventDefault();
                readPreviousPage();
            }
        });
