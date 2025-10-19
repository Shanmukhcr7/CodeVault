const API_URL = "https://script.google.com/macros/s/AKfycby4br4UG4SU1uyBaKsw10kkInoTiwhqWExFvAeZXc6Q0yAY3fw1sEyjwENCFGyW9rSHkw/exec"; // replace with your deployment URL
const fileInput = document.getElementById("fileInput");
const keyInput = document.getElementById("keyInput");
const filesContainer = document.getElementById("filesContainer");
const uploadBtn = document.getElementById("uploadBtn");
const loader = document.getElementById("loader");

// ----------------------
// Fetch files for the key
// ----------------------
async function fetchFiles() {
  const key = keyInput.value.trim();
  if (!key) return alert("Please enter a key");

  showLoader(true);

  try {
    const res = await fetch(`${API_URL}?key=${encodeURIComponent(key)}`);
    const data = await res.json();

    if (data.status !== "ok") {
      alert(data.message || "Error fetching files");
      showLoader(false);
      return;
    }

    renderFiles(data.files);
  } catch (err) {
    alert("Failed to fetch files: " + err.message);
  } finally {
    showLoader(false);
  }
}

// ----------------------
// Render files in the UI
// ----------------------
function renderFiles(files) {
  filesContainer.innerHTML = "";
  if (!files.length) {
    filesContainer.innerHTML = `<p>No files for this key. Upload some!</p>`;
    return;
  }

  files.forEach(file => {
    const div = document.createElement("div");
    div.classList.add("file-card");
    div.innerHTML = `
      <p class="file-name">${file.name}</p>
      <p class="file-size">${(file.size / 1024).toFixed(2)} KB</p>
      <div class="file-actions">
        <a href="${file.url}" target="_blank" class="download-btn">Download</a>
        <button class="delete-btn" onclick="deleteFile('${file.id}', this)">Delete</button>
      </div>
    `;
    filesContainer.appendChild(div);

    // GSAP animation
    gsap.from(div, { opacity: 0, y: 20, duration: 0.5 });
  });
}

// ----------------------
// Upload a file
// ----------------------
uploadBtn.addEventListener("click", async () => {
  const key = keyInput.value.trim();
  const file = fileInput.files[0];
  if (!key || !file) return alert("Please enter a key and select a file");

  showLoader(true);

  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1]; // Remove prefix
      const payload = {
        key,
        name: file.name,
        type: file.type || "application/octet-stream",
        file: base64
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.status === "success") {
        fetchFiles(); // Refresh list
        fileInput.value = ""; // Reset input
      } else {
        alert(data.message || "Upload failed");
      }
    };
    reader.readAsDataURL(file);
  } catch (err) {
    alert("Error uploading file: " + err.message);
  } finally {
    showLoader(false);
  }
});

// ----------------------
// Delete a file
// ----------------------
async function deleteFile(id, btn) {
  if (!confirm("Are you sure you want to delete this file?")) return;

  showLoader(true);
  btn.disabled = true;

  try {
    const res = await fetch(`${API_URL}?id=${id}`, { method: "DELETE" });
    const data = await res.json();

    if (data.status === "deleted") {
      fetchFiles(); // Refresh list
    } else {
      alert(data.message || "Delete failed");
      btn.disabled = false;
    }
  } catch (err) {
    alert("Error deleting file: " + err.message);
    btn.disabled = false;
  } finally {
    showLoader(false);
  }
}

// ----------------------
// Loader control
// ----------------------
function showLoader(show) {
  loader.style.display = show ? "block" : "none";
}

// ----------------------
// Optional: Fetch files on key enter
// ----------------------
keyInput.addEventListener("keyup", (e) => {
  if (e.key === "Enter") fetchFiles();
});
