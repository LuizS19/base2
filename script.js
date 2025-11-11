document.getElementById("exportBtn").addEventListener("click", () => {
  window.location.href = "/export";
});

document.getElementById("baseBtn").addEventListener("click", () => {
  window.location.href = "/base";
});

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const fileName = document.getElementById("fileName");
const preview = document.getElementById("preview");
const csvPreview = document.getElementById("csvPreview");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    fileName.textContent = `📄 ${fileInput.files[0].name}`;
  }
});

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Selecione um arquivo CSV primeiro!");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/upload", { method: "POST", body: formData });
  const data = await res.json();

  preview.classList.remove("hidden");
  csvPreview.textContent = JSON.stringify(data, null, 2);
});
