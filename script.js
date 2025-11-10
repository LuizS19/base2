/* global TrelloPowerUp */
const t = TrelloPowerUp.iframe();

document.getElementById('exportar').addEventListener('click', async () => {
  const cards = await t.cards('all');
  let csv = 'Nome,Descrição,Lista,Data\n';
  cards.forEach(card => {
    csv += `"${card.name}","${card.desc}","${card.idList}","${card.dateLastActivity}"\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'trello_dados.csv';
  a.click();
  document.getElementById('status').innerText = '✅ CSV gerado com sucesso!';
});