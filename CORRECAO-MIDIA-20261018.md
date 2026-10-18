# Recuperação de chamadas — 18/10/2026

Corrigido replay simultâneo da mesma resposta de chamada pelo Realtime e pela consulta de histórico. Os sinais são deduplicados e processados em sequência; encerramento não espera a fila. Eventos de contas diferentes do par da chamada são ignorados.

A chegada de uma faixa de áudio deixa de reatribuir o srcObject do vídeo remoto. A reprodução é tentada novamente quando a faixa remota passa a fornecer dados. Dimensões de vídeo atualizadas por resize/canplay também liberam a imagem, preservando o retorno ao estado vazio.

Validação: testes do componente real em VM reproduziram a resposta duplicada antes da correção e passaram depois. Passaram sinalização ICE antecipada, remontagem da câmera, ligação de mídia remota, cancelamento, hangup local, gravação WAV, envio confirmado, histórico e câmera. Sintaxe JavaScript validada. Teste de interface em navegador bloqueado pelo ambiente: Chrome não iniciou por restrição de socket; não se afirma teste real entre navegadores nem validação física.

Registros de produção confirmam ofertas/respostas entre contas diferentes com vídeo negociado e três arquivos WAV salvos. Isso não comprova conteúdo audível ou frames recebidos. O banco continua sem registros FCM nativos. Assinatura do APK 1.0.4, credencial FCM e recebimento com tela apagada permanecem pendentes; não foi gerado instalador novo. Nenhum outro aplicativo foi alterado.
