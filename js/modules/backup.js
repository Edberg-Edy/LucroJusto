// Backup dos dados do usuário em um arquivo .json.

// Monta o conteúdo do backup (função pura, testada em backup.test.js). Os dias saem em ordem de data.
export function montarBackup(config, dias, agora = new Date()) {
  return {
    app: 'LucroJusto',
    versao: 1,
    exportadoEm: agora.toISOString(),
    config,
    dias: [...dias].sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0)),
  };
}

// Faz o navegador baixar o arquivo.
export function baixarBackup(backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `lucrojusto-backup-${backup.exportadoEm.slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}