// -------------------------------------------
// IMPORTAÇÕES
// -------------------------------------------
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch"; // ✅ necessário para requisições HTTP no Vercel
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
// FUNÇÃO: Buscar todos os cards (inclusive arquivados)
// -------------------------------------------
async function getCards(includeClosed = false) {
  const status = includeClosed ? "all" : "open"; // ✅ busca abertos ou todos
  const url = `https://api.trello.com/1/boards/${BOARD_ID}/cards/${status}?key=${API_KEY}&token=${TOKEN}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erro na requisição: ${res.status}`);
  const data = await res.json();
  return data;
}

// -------------------------------------------
// ROTAS DO SERVIDOR
// -------------------------------------------

// Página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Rota: listar todos os cards abertos
app.get("/cards", async (req, res) => {
  try {
    const cards = await getCards(false);
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar cards");
  }
});

// Rota: exportar todos os cards abertos como CSV
app.get("/export", async (req, res) => {
  try {
    const cards = await getCards(false);
    let csv = "Nome,Descrição,Data\n";
    cards.forEach(c => {
      csv += `"${c.name}","${(c.desc || "").replace(/\n/g, " ")}","${c.dateLastActivity}"\n`;
    });

    res.setHeader("Content-disposition", "attachment; filename=cards.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao gerar CSV");
  }
});

// Rota: gerar base de dados com cards arquivados
app.get("/base", async (req, res) => {
  try {
    const url = `https://api.trello.com/1/boards/${BOARD_ID}/cards/closed?key=${API_KEY}&token=${TOKEN}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro ao acessar API: ${response.status}`);
    const cards = await response.json();

    // Função para extrair dados de Cidade, UF, Tipo e Valor
    const parseInfo = (text) => {
      const cidadeMatch = text.match(/(?:Cidade|Localidade)[:\-]?\s*([A-Za-zÀ-ÿ\s]+)/i);
      const ufMatch = text.match(/UF[:\-]?\s*([A-Z]{2})/i);
      const tipoMatch = text.match(/(link dedicado|banda larga|l2l)/i);
      const valorMatch = text.match(/R?\$?\s?([\d.,]+)/i);

      return {
        cidade: cidadeMatch ? cidadeMatch[1].trim() : "",
        uf: ufMatch ? ufMatch[1].trim().toUpperCase() : "",
        tipo: tipoMatch ? tipoMatch[1].toUpperCase() : "",
        valor: valorMatch ? valorMatch[1].replace(",", ".") : ""
      };
    };

    // Montar CSV com as informações extraídas
    let csv = "Cidade,UF,Tipo,Valor\n";
    cards.forEach(card => {
      const texto = `${card.name} ${card.desc}`;
      const info = parseInfo(texto);
      csv += `"${info.cidade}","${info.uf}","${info.tipo}","${info.valor}"\n`;
    });

    // Enviar CSV para download
    res.setHeader("Content-disposition", "attachment; filename=base_trello.csv");
    res.set("Content-Type", "text/csv");
    res.status(200).send(csv);
  } catch (err) {
    console.error("Erro ao gerar base:", err);
    res.status(500).send("Erro ao gerar base CSV");
  }
});

// -------------------------------------------
// EXPORTAÇÃO PARA A VERCEL
// -------------------------------------------
export default app;
