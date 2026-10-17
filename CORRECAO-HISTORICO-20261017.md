# IL Bate Papo — correção de histórico e recuperação

Estado: correção de cliente testada com servidor simulado. Não é validação do servidor ou dos aparelhos reais.

## Causas demonstráveis no código anterior

A consulta ordenava mensagens antigas primeiro, sem paginação, portanto o limite da API podia ocultar mensagens recentes. A abertura de conversas e o carregamento assíncrono não descartavam respostas de uma conversa anterior. Anexos eram resolvidos em conjunto antes de apresentar o histórico. INSERT não solicitava o registro confirmado para reconciliar imediatamente a interface.

## Alterações

- history-sync.js: paginação por created_at e id, leitura das páginas até resposta vazia, eventos recebidos durante a consulta reaplicados sobre o resultado, deduplicação por ID, reconciliação após reconexão e retorno da página.
- Assinatura de anexos separada da apresentação de texto, com no máximo quatro operações simultâneas. Falha em um anexo mantém a mensagem.
- Abertura de conversa e troca de conta invalidam respostas pendentes. Texto e anexos usam a conversa capturada no início e aguardam INSERT com retorno do registro.
- Apenas notifications.js registra o service worker; removido trecho que cancelava a inscrição da raiz. SW usa o próprio escopo e aguarda navegação antes de foco. Chamada expirada aparece como perdida sem novo toque.
- Canais de notificações são removidos na troca de conta; respostas de nomes de remetentes não geram avisos após logout.

## Verificação local executada

node test-history-sync.cjs: 1205 mensagens, limite de API de 83, horários iguais, INSERT/DELETE durante consulta, duplicatas, erro de rede, anexo lento, reconexão e corridas de RPC no trecho real do bundle.
node test-history-push.cjs: tipos de anexo, chamada expirada/atual e navegação aguardada nos escopos raiz e /IL-Bate-Papo/.
Regressões: test-push.cjs, test-alert-idempotence.cjs, test-media.cjs, test-attachment-renewal.cjs, test-sound-control.cjs, test-read-receipts.cjs passaram.
Sintaxe: bundle, history-sync.js, notifications.js e sw.js.

## Pendências e bloqueio concreto

O projeto Supabase usado pelo aplicativo é ngidsolvxegpyrprlbex. Ele não aparece na conexão Supabase disponível (que pertence a outro aplicativo e não foi alterado). Não foram executados INSERT/SELECT reais, inspeção de RLS, RPC direta, entrega VAPID/FCM ou teste entre duas contas em aparelhos reais. A persistência do servidor não está certificada. Os testes locais simulam banco e dispositivos.

O site raiz é servido pelo repositório ILBate-papo/ilbate-papo.github.io, separado de IL-Bate-Papo. Publicar somente neste repositório não demonstra atualização de https://ilbate-papo.github.io/. A mesma correção foi aplicada preservando o HTML da raiz no commit d2302ce86632168b3e2aca782fa594fa3b82cb37; o workflow GitHub Pages foi iniciado.

Push existente ainda depende do disparo do cliente. Falta provisionar/verificar entrega pelo servidor independentemente da página remetente, destino específico da conversa/chamada e chamada perdida persistida no servidor. O aviso de chamada perdida do SW é apenas uma notificação, não um registro no banco.

Não foram gerados APK, AAB ou instalador Windows: a validação funcional real, exigida antes deles, permanece pendente. Navegador e sistema controlam som e vibração; não se promete toque contínuo, fala ou alerta apesar de bloqueios do sistema.

## Próxima validação obrigatória

Com acesso ao projeto correto: acompanhar upload, INSERT e ID; comparar conversation_id no reabrir; verificar RPC retorna sempre mesma conversa para o par. Depois testar duas contas Android/computador com texto, foto, vídeo, áudio, arquivo e chamada em primeiro plano, outra conversa, segundo plano, bloqueio, reabertura e reconexão. Confirmar no servidor e na tela, sem duplicatas. Não apagar dados nem relaxar RLS.

Verificação adicional: test-history-send.cjs passou executando as funções reais do bundle para confirmação de texto, falha de INSERT, upload após troca de conversa e troca de conta. list_tables no projeto ngidsolvxegpyrprlbex retornou explicitamente: You do not have permission to perform this action.
