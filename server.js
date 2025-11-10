// -------------------------------------------
// IMPORTAÇÕES
// -------------------------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { writeFileSync } from "fs";

// -------------------------------------------
// CONFIGURAÇÕES BÁSICAS DO SERVIDOR
// -------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.static(__dirname));

// -------------------------------------------
// CONFIGURAÇÕES DA API DO TRELLO
// -------------------------------------------
const API_KEY = "e407186c781175f4eda383070fef7b89";
const TOKEN = "ATTA78346b1d891c7208078545999724c985575bc696bf078d1624b2dcbcc5d2bf31FE1786C9";
const BOARD_ID = "XyMSKz4a";

// -------------------------------------------
// FUNÇÕES DE INTEGRAÇÃO COM A API DO TRELLO
// -------------------------------------------

async function getCards() {
  const url = `https://api.trello.com/1/boards/${BOARD_ID}/cards?key=${API_KEY}&token=${TOKEN}`;
  const res = await fetch(url);
  const data = await res.json();
  return data;
}

// -------------------------------------------
// ROTAS DO SERVIDOR
// -------------------------------------------

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/cards", async (req, res) => {
  try {
    const cards = await getCards();
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar cards");
  }
});

app.get("/export", async (req, res) => {
  try {
    const cards = await getCards();
    let csv = "Nome,Descrição,Data\n";
    cards.forEach(c => {
      csv += `"${c.name}","${c.desc.replace(/\n/g, " ")}","${c.dateLastActivity}"\n`;
    });

    res.setHeader("Content-disposition", "attachment; filename=cards.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao gerar CSV");
  }
});

app.get("/base", async (req, res) => {
  try {
    const url = `https://api.trello.com/1/boards/${BOARD_ID}/cards/closed?key=${API_KEY}&token=${TOKEN}`;
    const response = await fetch(url);
    const cards = await response.json();

    const parseInfo = (desc) => {
      const cidadeMatch = desc.match(/Cidade:\s*([A-Za-zÀ-ÿ\s]+)/i);
      const ufMatch = desc.match(/UF:\s*([A-Z]{2})/i);
      const tipoMatch = desc.match(/(link dedicado|banda larga|l2l)/i);
      const valorMatch = desc.match(/R?\$?\s?([\d.,]+)/i);

      return {
        cidade: cidadeMatch ? cidadeMatch[1].trim() : "",
        uf: ufMatch ? ufMatch[1].trim().toUpperCase() : "",
        tipo: tipoMatch ? tipoMatch[1].toUpperCase() : "",
        valor: valorMatch ? valorMatch[1].replace(",", ".") : ""
      };
    };

    let csv = "Cidade,UF,Tipo,Valor\n";
    cards.forEach(card => {
      const info = parseInfo(card.desc + " " + card.name);
      csv += `"${info.cidade}","${info.uf}","${info.tipo}","${info.valor}"\n`;
    });

    res.setHeader("Content-disposition", "attachment; filename=base_trello.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao gerar base CSV");
  }
});

// -------------------------------------------
// EXPORTAÇÃO PARA A VERCEL (sem app.listen)
// -------------------------------------------
export default app;