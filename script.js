const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw4yq9EFJR0_SKjGDLVFHR8S1PV4V08IPjJhgrTL-2Iy7YiZJF_TRCuhS_MVRyXG7-AQQ/exec";
const CORS_PROXY = "https://corsproxy.io/?";

let sessionKey = "";

document.getElementById("enterBtn").addEventListener("click", () => {
  const key = document.getElementById("keyInput").value.trim();
  if (!key) return alert("Enter a valid session key!");
  sessionKey = key;
  document.getElementById("currentKey").textContent = sessionKey;
  document.getElementById("key-section").classList.add("hidden");
  document.getElementById("file-section").classList.remove("hidden");
  gsap.from("#file-section", { opacity: 0, y: 30, duration: 0.5 });
  fetchFiles();
});

document.getElementById("uploadBtn").addEventListener("click", uploadFiles);

async function uploadFiles() {
  const files = document.getElementById("fileInput").files;
  if (!files.length) return alert("Select at least one file!");
  document.getElementById("message").textContent = "Uploading...";

  for (let file of files) {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Data = event.target.result.split(",")[1];
      const formData = new FormData();
      formData.append("action", "upload");
      formData.append("key", sessionKey);
      formData.append("file", base64Data);
      formData.append("fileName", file.name);
      formData.append("mimeType", file.type);

      try {
        const res = await fetch(CORS_PROXY + encodeURIComponent(SCRIPT_URL), {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        console.log(data);
        document.getElementById("message").textContent = "Uploaded successfully!";
        fetchFiles();
      } catch (err) {
        console.error(err);
        document.getElementById("message").textContent = "Upload failed!";
      }
    };
    reader.readAsDataURL(file);
  }
}

async function fetchFiles() {
  try {
    const res = await fetch(CORS_PROXY + encodeURIComponent(SCRIPT_URL + "?key=" + sessionKey));
    const data = await res.json();
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    if (!data.files || data.files.length === 0) {
      list.innerHTML = "<li>No files yet.</li>";
      return;
    }

    data.files.forEach(f => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${f.url}" target="_blank">${f.name}</a>`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error(err);
  }
}
