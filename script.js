// Placeholder image for the cat profile. In a real application, this would be uploaded or part of the initial content.
// I'm using a simple data URL for a small transparent GIF. You might want to replace this with a proper image file.
const catPlaceholderImage = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Pre-populate cat_placeholder.jpg if it doesn't exist. 
// In a real scenario, you'd serve this image from your server or a CDN.
const img = new Image();
img.src = "cat_placeholder.jpg";
img.onerror = () => {
    // Only if the image fails to load (i.e., it doesn't exist), then we can create it.
    // In a real application, you'd ensure this image is part of your deployment.
    // For this demonstration, we'll use a very small, simple placeholder.
    // This part is for demonstration and might not be suitable for production.
    fetch(catPlaceholderImage)
        .then(res => res.blob())
        .then(blob => {
            const file = new File([blob], "cat_placeholder.jpg", { type: "image/gif" });
            // In a real web app, you would not write files directly from client-side JS.
            // This is purely illustrative of how an initial image *could* be set up.
            // For this static site, the user would manually place the image.
            console.log("cat_placeholder.jpg would be created here if possible.");
        });
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

document.addEventListener('DOMContentLoaded', () => {
    // --- Feeding Section Logic ---
    const feedCanButton = document.getElementById('feed-can-button');
    const feedFoodButton = document.getElementById('feed-food-button');
    const feedOtherButton = document.getElementById('feed-other-button');
    const feedingTimesList = document.getElementById('feeding-times-list');
    const showAllFeedingsBtn = document.getElementById('show-all-feedings-btn');
    const feedingDetailsModal = document.getElementById('feeding-details-modal');
    const closeModalButton = document.querySelector('#feeding-details-modal .close-button');
    const allFeedingRecordsList = document.getElementById('all-feeding-records-list');

    let feedingRecords = JSON.parse(localStorage.getItem('feedingRecords')) || [];

    const saveFeedingRecords = () => {
        localStorage.setItem('feedingRecords', JSON.stringify(feedingRecords));
    };

    const renderFeedingTimes = () => {
        feedingTimesList.innerHTML = ''; // Clear existing list
        const activeFeedings = feedingRecords.filter(record => !record.deleted);
        activeFeedings.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort by most recent
        activeFeedings.forEach((record, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span>${formatDate(record.timestamp)} - ${record.type}</span>
                <button class="btn delete-restore-btn" data-index="${record.id}" data-action="delete">Delete</button>
            `;
            feedingTimesList.appendChild(listItem);
        });
    };

    const addFeedingRecord = (type) => {
        const now = new Date().toISOString();
        const newRecord = { id: Date.now(), timestamp: now, type: type, deleted: false };
        feedingRecords.unshift(newRecord); // Add to the beginning
        saveFeedingRecords();
        renderFeedingTimes();
    };

    feedCanButton.addEventListener('click', () => addFeedingRecord('Cat Can'));
    feedFoodButton.addEventListener('click', () => addFeedingRecord('Cat Food'));
    feedOtherButton.addEventListener('click', () => addFeedingRecord('Other'));

    feedingTimesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-restore-btn')) {
            const recordId = parseInt(e.target.dataset.index);
            const recordIndex = feedingRecords.findIndex(record => record.id === recordId);
            if (recordIndex !== -1) {
                feedingRecords[recordIndex].deleted = true; // Mark as deleted
                saveFeedingRecords();
                renderFeedingTimes();
                renderAllFeedingRecords(); // Update modal if open
            }
        }
    });

    showAllFeedingsBtn.addEventListener('click', () => {
        renderAllFeedingRecords();
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
                // Only show delete button for non-deleted items in the modal
                buttonHtml = `<button class="btn delete-restore-btn" data-index="${record.id}" data-action="delete">Delete</button>`;
            }

            listItem.innerHTML = `
                <span class="${statusClass}">${formatDate(record.timestamp)} - ${record.type} ${record.deleted ? '(Deleted)' : ''}</span>
                ${buttonHtml}
            `;
            allFeedingRecordsList.appendChild(listItem);
        });
    };

    allFeedingRecordsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-restore-btn')) {
            const recordId = parseInt(e.target.dataset.index);
            const action = e.target.dataset.action;
            const recordIndex = feedingRecords.findIndex(record => record.id === recordId);
            if (recordIndex !== -1) {
                if (action === 'delete') {
                    feedingRecords[recordIndex].deleted = true;
                }
                // No restore action needed now
                saveFeedingRecords();
                renderFeedingTimes(); // Update main list
                renderAllFeedingRecords(); // Update modal
            }
        }
    });

    // Initial render
    renderFeedingTimes();

    // --- Message Board Logic ---
    const messageInput = document.getElementById('message-input');
    const submitMessageBtn = document.getElementById('submit-message-btn');
    const messagesList = document.getElementById('messages-list');

    let messages = JSON.parse(localStorage.getItem('catMessages')) || [];

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

    submitMessageBtn.addEventListener('click', () => {
        const content = messageInput.value.trim();
        if (content) {
            const newMessage = { content, timestamp: new Date().toISOString() };
            messages.unshift(newMessage); // Add to the beginning
            localStorage.setItem('catMessages', JSON.stringify(messages));
            messageInput.value = ''; // Clear input
            renderMessages();
        }
    });

    // Initial render
    renderMessages();

    // --- Image Upload and Gallery Logic ---
    const imageUploadInput = document.getElementById('image-upload-input');
    const uploadImageBtn = document.getElementById('upload-image-btn');
    const galleryGrid = document.getElementById('gallery-grid');

    let imageUrls = JSON.parse(localStorage.getItem('catImages')) || [];

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

    uploadImageBtn.addEventListener('click', () => {
        const file = imageUploadInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const newImage = { url: e.target.result, timestamp: new Date().toISOString() };
                imageUrls.unshift(newImage); // Add to the beginning
                localStorage.setItem('catImages', JSON.stringify(imageUrls));
                imageUploadInput.value = ''; // Clear input
                renderGallery();
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image file to upload.');
        }
    });

    // Initial render
    renderGallery();
}); 