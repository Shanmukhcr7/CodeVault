const API_URL = "https://script.google.com/macros/s/AKfycbyuRi6WxprpukIAGzN9UmYID7_A7uhZ_xqT6az4Itd-N6RWY3o4EdaKOSHld3eKUtXAaA/exec"; // <-- Replace with your Apps Script Web App URL

const keyInput = document.getElementById("sessionKey");
const enterBtn = document.getElementById("enterBtn");
const fileSection = document.getElementById("fileSection");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const progressBar = document.getElementById("progressBar");
const progress = document.getElementById("progress");

let currentKey = "";

// Animate entry
gsap.from(".container", { duration: 1, y: 50, opacity: 0, ease: "power3.out" });

enterBtn.addEventListener("click", () => {
  currentKey = keyInput.value.trim();
  if (!currentKey) return alert("Please enter a key!");

  gsap.to(".key-input", { opacity: 0, y: -20, duration: 0.5, onComplete: () => {
    document.querySelector(".key-input").classList.add("hidden");
    fileSection.classList.remove("hidden");
    gsap.from("#fileSection", { opacity: 0, y: 30, duration: 0.8 });
    fetchFiles();
  }});
});

async function fetchFiles() {
  fileList.innerHTML = `<p>Loading files...</p>`;
  const res = await fetch(`${API_URL}?key=${currentKey}`);
  const data = await res.json();

  fileList.innerHTML = "";

  if (!data.files || data.files.length === 0) {
    fileList.innerHTML = `<p>No files found for key "${currentKey}". Upload some!</p>`;
    return;
  }

  data.files.forEach(file => {
    const div = document.createElement("div");
    div.classList.add("file-card");
    div.innerHTML = `
      <a href="${file.url}" target="_blank">${file.name}</a>
      <button class="delete-btn" onclick="deleteFile('${file.id}')">Delete</button>
    `;
    fileList.appendChild(div);
  });
}

uploadBtn.addEventListener("click", async () => {
  const files = fileInput.files;
  if (!files.length) return alert("Select a file!");

  progressBar.style.display = "block";
  progress.style.width = "0%";

  for (let file of files) {
    await uploadFile(file);
  }

  progress.style.width = "100%";
  setTimeout(() => {
    progressBar.style.display = "none";
  }, 500);

  fileInput.value = "";
  fetchFiles();
});

async function uploadFile(file) {
  progress.style.width = "20%";

  // Simulate file upload with a small delay
  await new Promise(r => setTimeout(r, 500));
  const url = URL.createObjectURL(file); // simulate file storage link

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key: currentKey, name: file.name, url })
  });

  const data = await res.json();
  console.log(data);
  progress.style.width = "80%";
}

async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;

  const res = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
  const data = await res.json();
  console.log(data);
  fetchFiles();
}
