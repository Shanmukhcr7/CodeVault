const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMstKvZ0pw280ltKDgJ_ryjBmOQzGDg2QQ8h5mrUuEREQyV8u6Dr5MyWDP1Gay-tnloQ/exec"; // Replace this
let sessionKey = null;

function enterSession() {
  const keyInput = document.getElementById("keyInput").value.trim();
  if (!keyInput) return alert("Please enter a valid key.");

  sessionKey = keyInput;
  document.getElementById("sessionName").innerText = sessionKey;
  document.getElementById("sessionArea").style.display = "block";
  fetchFiles();
}

async function fetchFiles() {
  try {
    const response = await fetch(`${SCRIPT_URL}?key=${encodeURIComponent(sessionKey)}`);
    const data = await response.json();
    const list = document.getElementById("fileList");
    list.innerHTML = "";

    if (data.files.length === 0) {
      list.innerHTML = "<li>No files in this session yet.</li>";
      return;
    }

    data.files.forEach(f => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="${f.url}" target="_blank">${f.name}</a>
        <button onclick="deleteFile('${f.id}')">🗑️</button>
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

async function uploadFiles() {
  const input = document.getElementById("fileInput");
  if (input.files.length === 0) return alert("Select at least one file.");

  for (const file of input.files) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      const body = { key: sessionKey, name: file.name, type: file.type, file: base64 };

      const res = await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(body) });
      const result = await res.json();
      console.log(result);
      fetchFiles();
    };
    reader.readAsDataURL(file);
  }
}

async function deleteFile(id) {
  if (!confirm("Delete this file?")) return;
  await fetch(`${SCRIPT_URL}?id=${id}`, { method: "DELETE" });
  fetchFiles();
}
