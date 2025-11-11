// -------------------------------------------
// IMPORTAÇÕES
// -------------------------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import multer from "multer";
import { parse } from "csv-parse/sync";
import { writeFileSync, readFileSync } from "fs";

// -------------------------------------------
// CONFIGURAÇÕES BÁSICAS
// -------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const upload = multer({ dest: "/tmp" }); // compatível com Vercel

app.use(express.static(__dirname));

// -------------------------------------------
// CONFIGURAÇÕES DA API DO TRELLO
// -------------------------------------------
const API_KEY = "e407186c781175f4eda383070fef7b89";
const TOKEN = "ATTA78346b1d891c7208078545999724c985575bc696bf078d1624b2dcbcc5d2bf31FE1786C9";
const BOARD_ID = "XyMSKz4a";

// -------------------------------------------
// FUNÇÃO AUXILIAR
// -------------------------------------------
async function getCards(includeArchived = false) {
  const filter = includeArchived ? "all" : "open";
  const url = `https://api.trello.com/1/boards/${BOARD_ID}/cards/${filter}?key=${API_KEY}&token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro ao buscar cards: ${res.status}`);
  return await res.json();
}

// -------------------------------------------
// ROTAS
// -------------------------------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Exportar CSV (Trello)
app.get("/export", async (req, res) => {
  try {
    const cards = await getCards(true);
    let csv = "Cidade,UF,Tipo,Valor,Velocidade,BlocoIP,Meio\n";
    cards.forEach(c => {
      csv += `"${c.name}","${c.desc.replace(/\n/g, " ")}","","","","",""\n`;
    });
    res.setHeader("Content-disposition", "attachment; filename=cards.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao gerar CSV");
  }
});

// -------------------------------------------
// NOVO: Importar CSV e unificar base
// -------------------------------------------
app.post("/upload", upload.single("csvFile"), async (req, res) => {
  try {
    const csvContent = readFileSync(req.file.path, "utf8");
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true
    });

    // Padroniza e limpa
    const padronizados = records.map(r => ({
      CIDADE: (r.Cidade || "").toUpperCase().trim(),
      UF: (r.UF || "").toUpperCase().trim(),
      TIPO: (r.Tipo || "").toUpperCase().trim(),
      VELOCIDADE: (r.Velocidade || "").trim(),
      BLOCO_IP: (r.BlocoIP || "").trim(),
      VALOR: (r.Valor || "").replace(",", ".").trim(),
      MEIO: (r.Meio || "").toUpperCase().trim()
    }));

    // Cria um novo CSV com o resultado
    let csv = "CIDADE,UF,TIPO,VELOCIDADE,BLOCO_IP,VALOR,MEIO\n";
    padronizados.forEach(l => {
      csv += `"${l.CIDADE}","${l.UF}","${l.TIPO}","${l.VELOCIDADE}","${l.BLOCO_IP}","${l.VALOR}","${l.MEIO}"\n`;
    });

    writeFileSync("/tmp/base_final.csv", csv);
    res.status(200).send("✅ CSV importado e padronizado com sucesso!");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao importar CSV");
  }
});

// -------------------------------------------
// EXPORTAÇÃO PARA VERCEL
// -------------------------------------------
export default app;
