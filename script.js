// Placeholder image for the cat profile. In a real application, this would be uploaded or part of the initial content.
// I'm using a simple data URL for a small transparent GIF. You might want to replace this with a proper image file.
const catPlaceholderImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// IMPORTANT: Set your backend URL here
const BACKEND_URL = 'https://catfeed.website';

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
    const closeModalButton = document.querySelector('#feeding-details-modal .close-button');
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
        } catch (error) {
            console.error('Error fetching feeding records:', error);
        }
    };

    const renderFeedingTimes = () => {
        feedingTimesList.innerHTML = ''; // Clear existing list
        const activeFeedings = feedingRecords.filter(record => !record.deleted);
        activeFeedings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent
        activeFeedings.forEach((record) => {
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

    closeModalButton.addEventListener('click', () => {
        feedingDetailsModal.style.display = 'none';
    });

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
                // Only delete action is relevant now, restore is removed.
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
    const messagesList = document.getElementById('messages-list');

    let messages = []; // Data will now come from the backend

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/messages`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            messages = await response.json();
            renderMessages();
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const renderMessages = () => {
        messagesList.innerHTML = ''; // Clear existing list
        messages.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent
        messages.forEach(msg => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <p>${msg.content}</p>
                <p class="message-time">${formatDate(msg.timestamp)}</p>
            `;
            messagesList.appendChild(listItem);
        });
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

    // --- Image Upload and Gallery Logic ---
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const galleryGrid = document.getElementById('gallery-grid');

    let imageUrls = []; // Data will now come from the backend

    const fetchImages = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/images`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            imageUrls = await response.json();
            renderGallery();
        } catch (error) {
            console.error('Error fetching images:', error);
        }
    };

    const renderGallery = () => {
        galleryGrid.innerHTML = ''; // Clear existing grid
        imageUrls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent
        const latest10Images = imageUrls.slice(0, 10); // Get only the latest 10

        latest10Images.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.classList.add('gallery-item');
            galleryItem.innerHTML = `
                <img src="${image.url}" alt="Cat Photo">
                <span class="upload-date">${formatDate(image.timestamp)}</span>
            `;
            galleryGrid.appendChild(galleryItem);
        });
    };

    uploadImageBtn.addEventListener('click', async () => {
        const file = imageUploadInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64Image = e.target.result; // This is the data URL
                try {
                    const response = await fetch(`${BACKEND_URL}/api/images/upload`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ url: base64Image, timestamp: new Date().toISOString() }),
                    });
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    imageUploadInput.value = ''; // Clear input
                    await fetchImages(); // Re-fetch to update UI
                } catch (error) {
                    console.error('Error uploading image:', error);
                    alert('Failed to upload image. Please check console for details.');
                }
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image file to upload.');
        }
    });

    // Initial data fetch for all sections
    await fetchFeedingRecords();
    await fetchMessages();
    await fetchImages();
}); 