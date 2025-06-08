// Placeholder image for the cat profile. In a real application, this would be uploaded or part of the initial content.
// I'm using a simple data URL for a small transparent GIF. You might want to replace this with a proper image file.
const catPlaceholderImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// IMPORTANT: Set your backend URL here
const BACKEND_URL = 'https://catfeed.website';

// Display limits for logs and messages
const FEEDING_LOG_LIMIT = 20;
const MESSAGE_DISPLAY_LIMIT = 10;

// Pre-populate cat_placeholder.jpg if it doesn't exist. 
// In a real scenario, you'd serve this image from your server or a CDN.
// This client-side check is primarily for local development convenience.
const img = new Image();
img.src = "cat_placeholder.jpg";
img.onerror = () => {
    console.log("cat_placeholder.jpg not found. Please place a cat image file in the root directory.");
    // In a real deployment, ensure this image is served from your static host.
};

// Helper function to format date as YYYY/MM/DD
const formatDate = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${year}/${month}/${day} ${hours}:${minutes}`;
};

document.addEventListener('DOMContentLoaded', async () => {
    // --- Feeding Section Logic ---
    const feedCanButton = document.getElementById('feed-can-button');
    const feedFoodButton = document.getElementById('feed-food-button');
    const feedOtherButton = document.getElementById('feed-other-button');
    const feedingTimesList = document.getElementById('feeding-times-list');
    const showAllFeedingsBtn = document.getElementById('show-all-feedings-btn');
    const feedingDetailsModal = document.getElementById('feeding-details-modal');
    const closeModalButtonFeeding = document.querySelector('#feeding-details-modal .close-button');
    const allFeedingRecordsList = document.getElementById('all-feeding-records-list');

    let feedingRecords = []; // Data will now come from the backend

    const fetchFeedingRecords = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/feedings`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            feedingRecords = await response.json();
            renderFeedingTimes();
            renderAllFeedingRecords(); // Also update modal if it's open
            processAndRenderFeedingChart(feedingRecords); // New: Process and render chart
        } catch (error) {
            console.error('Error fetching feeding records:', error);
        }
    };

    const renderFeedingTimes = () => {
        feedingTimesList.innerHTML = ''; // Clear existing list
        const activeFeedings = feedingRecords.filter(record => !record.deleted);
        activeFeedings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent
        const latestFeedings = activeFeedings.slice(0, FEEDING_LOG_LIMIT); // Apply limit

        latestFeedings.forEach((record) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${formatDate(record.timestamp)} - ${record.type}</span>
                <button class="btn delete-restore-btn" data-id="${record.id}" data-action="delete">Delete</button>
            `;
            feedingTimesList.appendChild(listItem);
        });
    };

    const addFeedingRecord = async (type) => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/feedings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            await fetchFeedingRecords(); // Re-fetch all to update UI
        } catch (error) {
            console.error('Error adding feeding record:', error);
        }
    };

    feedCanButton.addEventListener('click', () => addFeedingRecord('Cat Can'));
    feedFoodButton.addEventListener('click', () => addFeedingRecord('Cat Food'));
    feedOtherButton.addEventListener('click', () => addFeedingRecord('Other'));

    feedingTimesList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-restore-btn')) {
            const recordId = parseInt(e.target.dataset.id);
            try {
                const response = await fetch(`${BACKEND_URL}/api/feedings/${recordId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ deleted: true }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await fetchFeedingRecords(); // Re-fetch to update UI
            } catch (error) {
                console.error('Error deleting feeding record:', error);
            }
        }
    });

    showAllFeedingsBtn.addEventListener('click', () => {
        renderAllFeedingRecords(); // Ensure modal is up-to-date
        feedingDetailsModal.style.display = 'block';
    });

    closeModalButtonFeeding.addEventListener('click', () => {
        feedingDetailsModal.style.display = 'none';
    });

    // Handle generic modal closing for feeding modal (click outside)
    window.addEventListener('click', (event) => {
        if (event.target == feedingDetailsModal) {
            feedingDetailsModal.style.display = 'none';
        }
    });

    const renderAllFeedingRecords = () => {
        allFeedingRecordsList.innerHTML = '';
        feedingRecords.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        feedingRecords.forEach(record => {
            const listItem = document.createElement('li');
            const statusClass = record.deleted ? 'deleted-item' : '';
            let buttonHtml = '';
            if (!record.deleted) {
                buttonHtml = `<button class="btn delete-restore-btn" data-id="${record.id}" data-action="delete">Delete</button>`;
            }

            listItem.innerHTML = `
                <span class="${statusClass}">${formatDate(record.timestamp)} - ${record.type} ${record.deleted ? '(Deleted)' : ''}</span>
                ${buttonHtml}
            `;
            allFeedingRecordsList.appendChild(listItem);
        });
    };

    allFeedingRecordsList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-restore-btn')) {
            const recordId = parseInt(e.target.dataset.id);
            const action = e.target.dataset.action;
            try {
                if (action === 'delete') {
                    const response = await fetch(`${BACKEND_URL}/api/feedings/${recordId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ deleted: true }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                }
                await fetchFeedingRecords(); // Re-fetch to update UI
            } catch (error) {
                console.error('Error updating feeding record from modal:', error);
            }
        }
    });

    // --- Message Board Logic ---
    const messageInput = document.getElementById('message-input');
    const submitMessageBtn = document.getElementById('submit-message-btn');
    const messagesList = document.getElementById('messages-list-container');
    const showAllMessagesBtn = document.getElementById('show-all-messages-btn');
    const messageDetailsModal = document.getElementById('message-details-modal');
    const closeModalButtonMessage = document.querySelector('#message-details-modal .close-button');
    const allMessageRecordsList = document.getElementById('all-message-records-list');

    let messages = []; // Data will now come from the backend

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/messages`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            messages = await response.json();
            renderMessages();
            renderAllMessageRecords(); // Also update modal if open
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const renderMessages = () => {
        messagesList.innerHTML = ''; // Clear existing list, now refers to messages-list-container
        const activeMessages = messages.filter(msg => !msg.deleted);
        
        // Sort by most recent for latest messages
        const latestMessages = activeMessages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5);
        
        // Sort by likes for most liked messages
        const mostLikedMessages = activeMessages.sort((a, b) => b.likes - a.likes).slice(0, 5);

        const messageDisplayContainer = document.createElement('div');
        messageDisplayContainer.classList.add('message-display-container');

        // Create container for Latest Messages
        const latestMessagesContainer = document.createElement('div');
        latestMessagesContainer.classList.add('latest-messages-container');
        const latestHeader = document.createElement('h4');
        latestHeader.textContent = 'Latest 5 Messages:';
        latestMessagesContainer.appendChild(latestHeader);
        const latestMessagesList = document.createElement('ul'); // Create ul here
        if (latestMessages.length === 0) {
            latestMessagesList.innerHTML += '<p>No recent messages.</p>';
        }
        latestMessages.forEach(msg => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <p>${msg.content}</p>
                <p class="message-time">${formatDate(msg.timestamp)}
                    <button class="btn like-btn" data-id="${msg.id}" data-action="like-message">👍 ${msg.likes}</button>
                    <button class="btn delete-restore-btn" data-id="${msg.id}" data-action="delete-message">Delete</button>
                </p>
            `;
            latestMessagesList.appendChild(listItem);
        });
        latestMessagesContainer.appendChild(latestMessagesList);
        messageDisplayContainer.appendChild(latestMessagesContainer);

        // Create container for Most Liked Messages
        const mostLikedMessagesContainer = document.createElement('div');
        mostLikedMessagesContainer.classList.add('most-liked-messages-container');
        const mostLikedHeader = document.createElement('h4');
        mostLikedHeader.textContent = 'Most Liked 5 Messages:';
        mostLikedMessagesContainer.appendChild(mostLikedHeader);
        const mostLikedMessagesList = document.createElement('ul'); // Create ul here
        if (mostLikedMessages.length === 0) {
            mostLikedMessagesList.innerHTML += '<p>No liked messages yet.</p>';
        }
        mostLikedMessages.forEach(msg => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <p>${msg.content}</p>
                <p class="message-time">${formatDate(msg.timestamp)}
                    <button class="btn like-btn" data-id="${msg.id}" data-action="like-message">👍 ${msg.likes}</button>
                    <button class="btn delete-restore-btn" data-id="${msg.id}" data-action="delete-message">Delete</button>
                </p>
            `;
            mostLikedMessagesList.appendChild(listItem);
        });
        mostLikedMessagesContainer.appendChild(mostLikedMessagesList);
        messageDisplayContainer.appendChild(mostLikedMessagesContainer);

        messagesList.appendChild(messageDisplayContainer);
    };

    submitMessageBtn.addEventListener('click', async () => {
        const content = messageInput.value.trim();
        if (content) {
            try {
                const response = await fetch(`${BACKEND_URL}/api/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                messageInput.value = ''; // Clear input
                await fetchMessages(); // Re-fetch to update UI
            } catch (error) {
                console.error('Error submitting message:', error);
            }
        }
    });

    messagesList.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('delete-restore-btn') && target.dataset.action === 'delete-message') {
            const messageId = parseInt(target.dataset.id);
            try {
                const response = await fetch(`${BACKEND_URL}/api/messages/${messageId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ deleted: true }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await fetchMessages(); // Re-fetch to update UI
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        } else if (target.classList.contains('like-btn') && target.dataset.action === 'like-message') {
            const messageId = parseInt(target.dataset.id);
            const messageToLike = messages.find(msg => msg.id === messageId);
            if (messageToLike) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/messages/${messageId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ likes: messageToLike.likes + 1 }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    await fetchMessages(); // Re-fetch to update UI
                } catch (error) {
                    console.error('Error liking message:', error);
                }
            }
        }
    });

    showAllMessagesBtn.addEventListener('click', () => {
        renderAllMessageRecords();
        messageDetailsModal.style.display = 'block';
    });

    closeModalButtonMessage.addEventListener('click', () => {
        messageDetailsModal.style.display = 'none';
    });

    const renderAllMessageRecords = () => {
        allMessageRecordsList.innerHTML = '';
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        messages.forEach(msg => {
            const listItem = document.createElement('li');
            const statusClass = msg.deleted ? 'deleted-item' : '';
            let buttonHtml = '';
            // Add like button for all messages in modal
            buttonHtml += `<button class="btn like-btn" data-id="${msg.id}" data-action="like-message-modal">👍 ${msg.likes}</button>`;

            if (!msg.deleted) {
                buttonHtml += `<button class="btn delete-restore-btn" data-id="${msg.id}" data-action="delete-message-modal">Delete</button>`;
            }

            listItem.innerHTML = `
                <span class="${statusClass}">${formatDate(msg.timestamp)} - ${msg.content} ${msg.deleted ? '(Deleted)' : ''}</span>
                ${buttonHtml}
            `;
            allMessageRecordsList.appendChild(listItem);
        });
    };

    allMessageRecordsList.addEventListener('click', async (e) => {
        const target = e.target;
        if (target.classList.contains('delete-restore-btn') && target.dataset.action === 'delete-message-modal') {
            const messageId = parseInt(target.dataset.id);
            try {
                const response = await fetch(`${BACKEND_URL}/api/messages/${messageId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ deleted: true }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                await fetchMessages(); // Re-fetch to update UI
            } catch (error) {
                console.error('Error deleting message from modal:', error);
            }
        } else if (target.classList.contains('like-btn') && target.dataset.action === 'like-message-modal') {
            const messageId = parseInt(target.dataset.id);
            const messageToLike = messages.find(msg => msg.id === messageId);
            if (messageToLike) {
                try {
                    const response = await fetch(`${BACKEND_URL}/api/messages/${messageId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ likes: messageToLike.likes + 1 }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    await fetchMessages(); // Re-fetch to update UI
                } catch (error) {
                    console.error('Error liking message from modal:', error);
                }
            }
        }
    });

    // Handle generic modal closing for any modal (click outside)
    window.addEventListener('click', (event) => {
        if (event.target == feedingDetailsModal) {
            feedingDetailsModal.style.display = 'none';
        }
        if (event.target == messageDetailsModal) {
            messageDetailsModal.style.display = 'none';
        }
    });

    // Chart related functions
    let feedingChartInstance = null; // To hold the Chart.js instance

    const processAndRenderFeedingChart = (records) => {
        const dailyCounts = {};
        records.forEach(record => {
            if (!record.deleted) { // Only count active feedings
                const date = formatDate(record.timestamp).split(' ')[0]; // Get YYYY/MM/DD part
                dailyCounts[date] = (dailyCounts[date] || 0) + 1;
            }
        });

        // Sort dates chronologically
        const sortedDates = Object.keys(dailyCounts).sort((a, b) => new Date(a) - new Date(b));
        const labels = sortedDates;
        const data = sortedDates.map(date => dailyCounts[date]);

        renderFeedingChart(labels, data);
    };

    const renderFeedingChart = (labels, data) => {
        const ctx = document.getElementById('feedingChart').getContext('2d');

        if (feedingChartInstance) {
            feedingChartInstance.destroy(); // Destroy existing chart before creating a new one
        }

        feedingChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '每日喂食次数',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '喂食次数'
                        },
                        ticks: {
                            stepSize: 1
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '日期'
                        }
                    }
                },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    };

    // Initial data fetch for all sections
    await fetchFeedingRecords();
    await fetchMessages();
}); 