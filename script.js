const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzKFdCl_lTGK0UiKm3oNEX2cMMefeMKYiqvyaUoMP_QPWsJp8nV1x7bESfUCoCt2X4Rng/exec"; // Replace this

// Fetch and display files
async function fetchFiles() {
  try {
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    const fileList = document.getElementById("fileList");
    fileList.innerHTML = "";

    if (data.files.length === 0) {
      fileList.innerHTML = "<li>No files found.</li>";
      return;
    }

    data.files.forEach(file => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${file.url}" target="_blank">${file.name}</a>
        <button onclick="deleteFile('${file.id}')">🗑️ Delete</button>
      `;
      fileList.appendChild(li);
    });
  } catch (error) {
    console.error("Error fetching files:", error);
  }
}

// Upload files
async function uploadFiles() {
  const input = document.getElementById("fileInput");
  const files = input.files;

  if (files.length === 0) return alert("Select at least one file!");

  for (const file of files) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];

      const response = await fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify({
          name: file.name,
          type: file.type,
          file: base64
        }),
      });

      const result = await response.json();
      console.log(result);
      fetchFiles();
    };
    reader.readAsDataURL(file);
  }
}

// Delete file
async function deleteFile(fileId) {
  if (!confirm("Are you sure you want to delete this file?")) return;
  await fetch(`${SCRIPT_URL}?id=${fileId}`, { method: "DELETE" });
  fetchFiles();
}

// Initial load
fetchFiles();
