document.addEventListener('DOMContentLoaded', function() {
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.getElementById('chat-messages');

    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const message = messageInput.value.trim();
        if (message) {
            // display the user's message immediately
            displaySingleMessage(message, 'user');
            sendMessage(message);
            messageInput.value = '';
        }
    });

    function sendMessage(message) {
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message bot typing-indicator';
        typingDiv.innerHTML = '<div class="message-content"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: message }),
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            const indicator = chatMessages.querySelector('.typing-indicator');
            if (indicator) indicator.remove();

            // Update all messages
            updateMessages(data.messages);

            if (data.step === 'end') {
                messageInput.disabled = true;
                chatForm.querySelector('button').disabled = true;
            } else {
                messageInput.disabled = false;
                chatForm.querySelector('button').disabled = false;
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // Remove typing indicator on error
            const indicator = chatMessages.querySelector('.typing-indicator');
            if (indicator) indicator.remove();
        });
    }

    // Function to display a single message (supports newlines and emojis)
    function displaySingleMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        // Convert newlines to <br> for proper display
        const formattedText = text.replace(/\n/g, '<br>');
        messageDiv.innerHTML = `<div class="message-content">${formattedText}</div>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function updateMessages(messages) {
        chatMessages.innerHTML = '';
        messages.forEach(msg => {
            displaySingleMessage(msg.text, msg.sender);
        });
    }
});
