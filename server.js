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
const csvTable = document.getElementById("csvTable");

fileInput.addEventListener("change", () => {
  if (fileInput.files.length > 0) {
    fileName.textContent = `📄 ${fileInput.files[0].name}`;
  }
});

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Selecione um arquivo CSV primeiro!");

  const text = await file.text();
  const rows = text.split("\n").map(r => r.split(",")).filter(r => r.length >= 4);

  csvTable.innerHTML = ""; // limpa a tabela
  rows.slice(1).forEach(row => {
    const cidade = (row[0] || "").trim().toUpperCase();
    const uf = (row[1] || "").trim().toUpperCase();
    const tipo = (row[2] || "").trim().toUpperCase();
    const velocidade = (row[3] || "").trim();
    const blocoIP = (row[4] || "").trim();
    const valor = (row[5] || "").trim();
    const meio = (row[6] || "").trim().toUpperCase();

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border px-3 py-2">${cidade}</td>
      <td class="border px-3 py-2">${uf}</td>
      <td class="border px-3 py-2">${tipo}</td>
      <td class="border px-3 py-2">${velocidade}</td>
      <td class="border px-3 py-2">${blocoIP}</td>
      <td class="border px-3 py-2">${valor}</td>
      <td class="border px-3 py-2">${meio}</td>
    `;
    csvTable.appendChild(tr);
  });

  preview.classList.remove("hidden");
});
