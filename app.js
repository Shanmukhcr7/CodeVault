// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB4FoIzSip4z43P-coeBkh_QlNWsqlagEU",
  authDomain: "my-live-440119.firebaseapp.com",
  projectId: "my-live-440119",
  storageBucket: "my-live-440119.firebasestorage.app",
  messagingSenderId: "893090469170",
  appId: "1:893090469170:web:495d45cac83579c99e332b"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// DOM elements
const landingPage = document.getElementById('landing-page');
const fileUploadPage = document.getElementById('file-upload-page');
const sessionKeyInput = document.getElementById('session-key');
const enterBtn = document.getElementById('enter-btn');
const copyLinkBtn = document.getElementById('copy-link-btn');
const selectFilesBtn = document.getElementById('select-files-btn');
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const dropZoneContent = document.querySelector('.drop-zone-content');
const uploadProgress = document.getElementById('upload-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');
const filesContainer = document.getElementById('files-container');
const errorMessage = document.getElementById('error-message');
const sessionTitle = document.getElementById('session-title');

let currentSessionKey = '';

// Initialize app
document.addEventListener('DOMContentLoaded', init);

// Initialize function
function init() {
    setupEventListeners();
    animatePageIn(landingPage);
}

// Setup event listeners
function setupEventListeners() {
    // Landing page
    enterBtn.addEventListener('click', handleEnterSession);
    sessionKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleEnterSession();
    });

    // File upload page
    copyLinkBtn.addEventListener('click', copySessionLink);
    selectFilesBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelection);

    // Drag and drop
    dropZone.addEventListener('dragover', handleDragOver);
    dropZone.addEventListener('dragleave', handleDragLeave);
    dropZone.addEventListener('drop', handleFileDrop);
}

// Handle entering a session
async function handleEnterSession() {
    const key = sessionKeyInput.value.trim();
    if (!key) {
        showError('Please enter a session key');
        return;
    }

    try {
        const sessionExists = await checkSessionExists(key);
        if (sessionExists) {
            // Load existing session
            currentSessionKey = key;
            switchToFilePage();
            loadSessionFiles();
        } else {
            // Create new session
            await createNewSession(key);
            currentSessionKey = key;
            switchToFilePage();
        }
    } catch (error) {
        console.error('Error handling session:', error);
        showError('Failed to access session. Please try again.');
    }
}

// Check if session exists
async function checkSessionExists(sessionKey) {
    try {
        const doc = await db.collection('sessions').doc(sessionKey).get();
        return doc.exists;
    } catch (error) {
        console.error('Error checking session:', error);
        return false;
    }
}

// Create new session
async function createNewSession(sessionKey) {
    try {
        await db.collection('sessions').doc(sessionKey).set({
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            fileCount: 0
        });
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
}

// Switch to file upload page
function switchToFilePage() {
    gsap.to(landingPage, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        onComplete: () => {
            landingPage.style.display = 'none';
            fileUploadPage.style.display = 'block';
            sessionTitle.textContent = currentSessionKey;
            animatePageIn(fileUploadPage);
        }
    });
}

// Load session files
async function loadSessionFiles() {
    try {
        const filesRef = db.collection('sessions').doc(currentSessionKey).collection('files');
        filesRef.orderBy('uploadedAt', 'desc').onSnapshot((snapshot) => {
            const files = [];
            snapshot.forEach((doc) => {
                files.push({ id: doc.id, ...doc.data() });
            });
            renderFiles(files);
        });
    } catch (error) {
        console.error('Error loading files:', error);
    }
}

// Render files list
function renderFiles(files) {
    if (files.length === 0) {
        filesContainer.innerHTML = '<p class="no-files">No files uploaded yet</p>';
        return;
    }

    filesContainer.innerHTML = '';
    files.forEach((file) => {
        const fileItem = createFileElement(file);
        gsap.fromTo(fileItem, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3 });
        filesContainer.appendChild(fileItem);
    });
}

// Create file element
function createFileElement(file) {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    const fileInfo = document.createElement('div');
    fileInfo.className = 'file-info';

    const fileIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    fileIcon.setAttribute('viewBox', '0 0 24 24');
    fileIcon.setAttribute('fill', 'none');
    fileIcon.setAttribute('stroke', 'currentColor');
    fileIcon.setAttribute('stroke-width', '2');
    fileIcon.className = 'file-icon';
    fileIcon.innerHTML = getFileIcon(file.fileName);

    const fileDetails = document.createElement('div');
    fileDetails.className = 'file-details';

    const fileName = document.createElement('h4');
    fileName.textContent = file.fileName;

    const fileMeta = document.createElement('p');
    const uploadDate = file.uploadedAt ? new Date(file.uploadedAt.seconds * 1000).toLocaleString() : 'Unknown';
    fileMeta.textContent = `Uploaded: ${uploadDate}`;

    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn download-btn';
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', () => downloadFile(file.fileUrl, file.fileName));

    fileDetails.appendChild(fileName);
    fileDetails.appendChild(fileMeta);
    fileInfo.appendChild(fileIcon);
    fileInfo.appendChild(fileDetails);
    fileItem.appendChild(fileInfo);
    fileItem.appendChild(downloadBtn);

    return fileItem;
}

// Get file icon based on file type
function getFileIcon(fileName) {
    const ext = fileName.split('.').pop().toLowerCase();
    const icons = {
        pdf: '<path d="M14,1H6A3,3 0 0,0 3,4V20A3,3 0 0,0 6,23H18A3,3 0 0,0 21,20V8L14,1M14,8V3.5L18.5,8H14Z"></path><polyline points="9,13 13,17 17,13"></polyline><line x1="13" y1="17" x2="13" y2="13"></line>',
        doc: '<path d="M14,1H6A3,3 0 0,0 3,4V20A3,3 0 0,0 6,23H18A3,3 0 0,0 21,20V8L14,1M14,8V3.5L18.5,8H14Z"></path><line x1="9" y1="15" x2="15" y2="15"></line><line x1="9" y1="17" x2="15" y2="17"></line><line x1="9" y1="19" x2="13" y2="19"></line>',
        docx: '<path d="M14,1H6A3,3 0 0,0 3,4V20A3,3 0 0,0 6,23H18A3,3 0 0,0 21,20V8L14,1M14,8V3.5L18.5,8H14Z"></path><line x1="9" y1="15" x2="15" y2="15"></line><line x1="9" y1="17" x2="15" y2="17"></line><line x1="9" y1="19" x2="13" y2="19"></line>',
        jpg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><polygon points="21,15 16,10 5,21"/></polygon>',
        jpeg: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><polygon points="21,15 16,10 5,21"/></polygon>',
        png: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><polygon points="21,15 16,10 5,21"/></polygon>',
        gif: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><polygon points="21,15 16,10 5,21"/></polygon>',
        default: '<path d="M14,1H6A3,3 0 0,0 3,4V20A3,3 0 0,0 6,23H18A3,3 0 0,0 21,20V8L14,1M14,8V3.5L18.5,8H14Z"></path><line x1="9" y1="15" x2="15" y2="15"></line><line x1="9" y1="17" x2="15" y2="17"></line><line x1="9" y1="19" x2="13" y2="19"></line>'
    };
    return icons[ext] || icons.default;
}

// Download file
function downloadFile(url, fileName) {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Handle file selection
function handleFileSelection(event) {
    const files = Array.from(event.target.files);
    uploadFiles(files);
}

// Handle drag and drop
function handleDragOver(e) {
    e.preventDefault();
    dropZone.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    if (!dropZone.contains(e.relatedTarget)) {
        dropZone.classList.remove('dragover');
    }
}

function handleFileDrop(e) {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    uploadFiles(files);
}

// Upload files
async function uploadFiles(files) {
    if (!currentSessionKey) return;

    for (const file of files) {
        await uploadSingleFile(file);
    }
}

// Upload single file
async function uploadSingleFile(file) {
    try {
        // Show progress and hide drop zone content
        dropZoneContent.style.display = 'none';
        uploadProgress.style.display = 'block';

        const fileId = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const storageRef = storage.ref().child(`${currentSessionKey}/${file.name}`);
        const uploadTask = storageRef.put(file);

        uploadTask.on('state_changed', (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Uploading ${file.name}... ${Math.round(progress)}%`;
        }, (error) => {
            console.error('Upload error:', error);
            showError('Failed to upload file');
            resetUploadUI();
        }, async () => {
            try {
                const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();

                // Save metadata to Firestore
                await db.collection('sessions').doc(currentSessionKey).collection('files').doc(fileId).set({
                    fileName: file.name,
                    fileUrl: downloadURL,
                    fileSize: file.size,
                    uploadedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                gsap.to(progressFill, { width: '100%', duration: 0.5, onComplete: resetUploadUI });
            } catch (error) {
                console.error('Error saving file metadata:', error);
                showError('Failed to save file metadata');
                resetUploadUI();
            }
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        showError('Failed to upload file');
        resetUploadUI();
    }
}

// Reset upload UI
function resetUploadUI() {
    setTimeout(() => {
        uploadProgress.style.display = 'none';
        dropZoneContent.style.display = 'block';
        progressFill.style.width = '0%';
        progressText.textContent = 'Uploading...';
        fileInput.value = '';
    }, 1000);
}

// Copy session link
async function copySessionLink() {
    const url = `${window.location.origin}${window.location.pathname}#${currentSessionKey}`;
    try {
        await navigator.clipboard.writeText(url);
        showError('Session link copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy link:', error);
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showError('Session link copied to clipboard!', 'success');
    }
    setTimeout(() => errorMessage.style.display = 'none', 3000);
}

// Show error message
function showError(message, type = 'error') {
    errorMessage.textContent = message;
    errorMessage.style.color = type === 'error' ? '#ff6b6b' : '#10b981';
    errorMessage.style.display = 'block';

    gsap.fromTo(errorMessage, { opacity: 0, y: -10 }, { opacity: 1, y: 0, duration: 0.3 });

    if (type === 'error') {
        setTimeout(() => {
            gsap.to(errorMessage, { opacity: 0, y: -10, duration: 0.3, onComplete: () => errorMessage.style.display = 'none' });
        }, 5000);
    }
}

// Animate page in
function animatePageIn(page) {
    gsap.fromTo(page, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
}

// Handle URL hash for direct session access
function handleUrlHash() {
    const hash = window.location.hash.slice(1);
    if (hash) {
        sessionKeyInput.value = hash;
        handleEnterSession();
    }
}
window.addEventListener('load', handleUrlHash);
window.addEventListener('hashchange', handleUrlHash);
