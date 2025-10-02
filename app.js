// CV Chatbot Application
class CVChatbot {
    constructor() {
        this.state = {
            theme: 'light',
            questionsRemaining: 5,
            isEmailVerified: false,
            totalCost: 0.0,
            chatHistory: [],
            isTyping: false,
            conversationContext: []
        };

        this.costPerQuestion = 0.05;

        // API Configuration - removed direct Perplexity API calls
        this.SUPABASE_URL = null;  // Will be loaded from /api/config
        this.SUPABASE_ANON_KEY = null;  // Will be loaded from /api/config
        
        // Initialize Supabase client
        if (this.SUPABASE_URL && this.SUPABASE_ANON_KEY && window.supabase) {
            this.supabaseClient = window.supabase.createClient(this.SUPABASE_URL, this.SUPABASE_ANON_KEY);
        }

        this.fallbackSuggestions = [
            "What is Suhas's current role at HYGH AG?",
            "What are his key AI and ML competencies?",
            "Tell me about his team leadership experience at Atheneum",
            "What business impact has he achieved in his roles?",
            "What's his educational background from WHU?",
            "Which BI tools and platforms does he specialize in?",
            "What AI automation projects has he worked on?",
            "How did he grow the data team at Atheneum?",
            "What cost optimization results has he achieved?",
            "What are his Salesforce and CRM skills?"
        ];

        this.currentSuggestions = this.fallbackSuggestions.slice(0, 3);

        this.init();
    }

    async init() {
        this.loadFromStorage();
        this.initializeTheme();
        this.bindEvents();
        this.updateUI();
        this.loadChatHistory();
        await this.loadSupabaseConfig();
    }

    async loadSupabaseConfig() {
        try {
            const response = await fetch('/api/config');
            const config = await response.json();
            
            if (config.supabaseUrl && config.supabaseAnonKey) {
                this.SUPABASE_URL = config.supabaseUrl;
                this.SUPABASE_ANON_KEY = config.supabaseAnonKey;
                
                if (window.supabase) {
                    this.supabaseClient = window.supabase.createClient(
                        this.SUPABASE_URL, 
                        this.SUPABASE_ANON_KEY
                    );
                    console.log('✅ Questions logging enabled');
                }
            }
        } catch (error) {
            console.warn('Supabase setup failed - questions won\'t be logged');
        }
    }

    loadFromStorage() {
        const stored = localStorage.getItem('cvChatbotState');
        if (stored) {
            try {
                const parsedState = JSON.parse(stored);
                this.state = { ...this.state, ...parsedState };
            } catch (e) {
                console.warn('Failed to parse stored state');
            }
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('cvChatbotState', JSON.stringify(this.state));
        } catch (e) {
            console.warn('Failed to save state to localStorage');
        }
    }

    loadChatHistory() {
        if (this.state.chatHistory.length > 1) {
            const chatMessages = document.getElementById('chatMessages');
            // Clear existing messages except the welcome message
            chatMessages.innerHTML = `
                <div class="message assistant-message welcome-message">
                    <div class="message-content">
                        <div class="message-text">
                            Hello! I'm here to help you learn about Suhas Thakral's professional background. You can ask me about his experience, skills, education, or any other details from his CV. I'll be frank about what information I can or cannot find.
                        </div>
                        <div class="message-time">Now</div>
                    </div>
                </div>
            `;

            // Add stored messages
            this.state.chatHistory.forEach((msg, index) => {
                if (index > 0) { // Skip the welcome message
                    this.addMessageToDOM(msg.content, msg.type, msg.timestamp, false);
                }
            });

            this.scrollToBottom();
        }
    }

    initializeTheme() {
        if (this.state.theme) {
            document.documentElement.setAttribute('data-color-scheme', this.state.theme);
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            this.state.theme = prefersDark ? 'dark' : 'light';
            document.documentElement.setAttribute('data-color-scheme', this.state.theme);
        }
        this.updateThemeIcon();
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Send message
        document.getElementById('sendButton').addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // Auto-resize textarea
        document.getElementById('messageInput').addEventListener('input', (e) => {
            this.autoResizeTextarea(e.target);
        });

        // Suggestion buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('suggestion-btn')) {
                const question = e.target.dataset.question;
                this.sendSuggestion(question);
            }
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('cancelButton').addEventListener('click', () => {
            this.hideModal();
        });

        document.getElementById('verifyButton').addEventListener('click', () => {
            this.verifyEmail();
        });

        // Close modal on backdrop click
        document.getElementById('emailModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-backdrop')) {
                this.hideModal();
            }
        });
    }

    toggleTheme() {
        this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-color-scheme', this.state.theme);
        this.updateThemeIcon();
        this.saveToStorage();
    }

    updateThemeIcon() {
        const icon = document.querySelector('.theme-icon');
        icon.textContent = this.state.theme === 'light' ? '🌙' : '☀️';
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    async sendSuggestion(question) {
        const input = document.getElementById('messageInput');
        input.value = question;
        this.autoResizeTextarea(input);
        await this.sendMessage();
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        const message = input.value.trim();

        if (!message || this.state.isTyping) return;

        if (this.state.questionsRemaining <= 0 && !this.state.isEmailVerified) {
            this.showModal();
            return;
        }

        // Check cost limit
        if (this.state.totalCost >= 5.0) {
            this.addMessageToDOM("I'm sorry, but you've reached the monthly cost limit of $5.00. Please try again next month.", 'assistant');
            return;
        }

        // Store question in Supabase
        await this.storeQuestion(message);

        // Add user message
        this.addMessageToDOM(message, 'user');
        input.value = '';
        input.style.height = 'auto';

        // Update state
        if (this.state.questionsRemaining > 0) {
            this.state.questionsRemaining--;
        }
        this.state.totalCost += this.costPerQuestion;
        this.state.conversationContext.push(message);

        this.updateUI();
        this.saveToStorage();

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Generate response using API endpoint
            const response = await this.generateResponseWithPerplexity(message);
            this.hideTypingIndicator();
            await this.addMessageWithTyping(response, 'assistant');
        } catch (error) {
            console.error('Error generating response:', error);
            this.hideTypingIndicator();

            // Fallback to local response generation
            const fallbackResponse = await this.generateResponse(message);
            await this.addMessageWithTyping(fallbackResponse, 'assistant');
        }

        // Update suggestions based on conversation
        await this.updateSuggestions();
    }

    async storeQuestion(question) {
        if (!this.supabaseClient) {
            console.warn('Supabase not configured, skipping question storage');
            return;
        }

        try {
            const { data, error } = await this.supabaseClient
                .from('questions')
                .insert([{ text: question }]);

            if (error) {
                console.error('Error storing question:', error);
            }
        } catch (error) {
            console.error('Failed to store question in Supabase:', error);
        }
    }

    async generateResponseWithPerplexity(question) {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: question }]
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.content;
    }

    addMessageToDOM(content, type, timestamp = null, animate = true) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        if (!animate) {
            messageDiv.style.animation = 'none';
        }

        const messageTime = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">${content}</div>
                <div class="message-time">${messageTime}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Store in chat history
        this.state.chatHistory.push({ content, type, timestamp: messageTime });
        this.saveToStorage();
    }

    async addMessageWithTyping(content, type) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <span class="typewriter-text"></span>
                </div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;

        chatMessages.appendChild(messageDiv);
        this.scrollToBottom();

        // Typing animation
        const textElement = messageDiv.querySelector('.typewriter-text');
        await this.typeText(textElement, content);
        textElement.classList.remove('typewriter-text');

        // Store in chat history
        this.state.chatHistory.push({ content, type, timestamp });
        this.saveToStorage();
    }

    async typeText(element, text) {
        const words = text.split(' ');
        let currentText = '';

        for (let i = 0; i < words.length; i++) {
            currentText += (i > 0 ? ' ' : '') + words[i];
            element.textContent = currentText;
            this.scrollToBottom();

            // Variable speed - faster for short words
            const delay = words[i].length < 4 ? 50 : 100;
            await this.delay(delay + Math.random() * 50);
        }
    }

    showTypingIndicator() {
        this.state.isTyping = true;
        const chatMessages = document.getElementById('chatMessages');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant-message typing-message';
        typingDiv.id = 'typingIndicator';

        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        chatMessages.appendChild(typingDiv);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.state.isTyping = false;
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async generateResponse(question) {
        // Simulate API delay for realistic feel
        await this.delay(1000 + Math.random() * 2000);

        return "I'm being frank with you - I couldn't connect to the API. Please try again later.";
    }

    async updateSuggestions() {
        const suggestionsLoading = document.getElementById('suggestionsLoading');
        suggestionsLoading.classList.remove('hidden');

        // Simulate suggestion generation delay
        await this.delay(1500 + Math.random() * 1000);

        // Generate contextual suggestions
        const newSuggestions = this.generateContextualSuggestions();
        this.currentSuggestions = newSuggestions;

        suggestionsLoading.classList.add('hidden');
        this.renderSuggestions();
    }

    generateContextualSuggestions() {
        const recentQuestions = this.state.conversationContext.slice(-3);
        let suggestions = [];

        if (!recentQuestions.some(q => q.toLowerCase().includes('experience'))) {
            suggestions.push("What is Suhas's current role at HYGH AG?");
        } else {
            suggestions.push("Tell me about his team leadership experience at Atheneum");
        }

        if (!recentQuestions.some(q => q.toLowerCase().includes('skill'))) {
            suggestions.push("What are his core BI and data visualization skills?");
        } else {
            suggestions.push("What AI and automation projects has he worked on?");
        }

        if (!recentQuestions.some(q => q.toLowerCase().includes('education'))) {
            suggestions.push("What's his educational background from WHU?");
        } else {
            suggestions.push("What business impact has he achieved in his roles?");
        }

        return suggestions.slice(0, 3);
    }

    renderSuggestions() {
        const suggestionsList = document.getElementById('suggestionsList');
        suggestionsList.innerHTML = '';

        this.currentSuggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = 'suggestion-btn';
            button.dataset.question = suggestion;
            button.textContent = suggestion;
            suggestionsList.appendChild(button);
        });
    }

    showModal() {
        document.getElementById('emailModal').classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('emailModal').classList.add('hidden');
        document.getElementById('verificationStatus').classList.add('hidden');
        document.getElementById('emailInput').value = '';
    }

    async verifyEmail() {
        const email = document.getElementById('emailInput').value.trim();

        if (!email || !this.isValidEmail(email)) {
            alert('Please enter a valid email address.');
            return;
        }

        document.getElementById('verifyButton').disabled = true;
        document.getElementById('verifyButton').textContent = 'Verifying...';

        await this.delay(2000);

        this.state.isEmailVerified = true;
        this.state.questionsRemaining = 10;

        document.getElementById('verificationStatus').classList.remove('hidden');
        document.getElementById('verifyButton').textContent = 'Verified!';

        this.updateUI();
        this.saveToStorage();

        setTimeout(() => {
            this.hideModal();
            document.getElementById('verifyButton').disabled = false;
            document.getElementById('verifyButton').textContent = 'Verify Email';
        }, 2000);
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    updateUI() {
        const questionCount = document.getElementById('questionCount');
        questionCount.textContent = this.state.questionsRemaining;

        const currentCost = document.getElementById('currentCost');
        currentCost.textContent = `$${this.state.totalCost.toFixed(2)}`;

        if (this.state.totalCost >= 4.50) {
            currentCost.style.color = 'var(--color-warning)';
        } else if (this.state.totalCost >= 4.90) {
            currentCost.style.color = 'var(--color-error)';
        }
    }

    scrollToBottom() {
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new CVChatbot();
});
