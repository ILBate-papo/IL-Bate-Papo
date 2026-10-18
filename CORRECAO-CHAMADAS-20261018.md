# Chamadas repetidas e avisos — 18/10/2026

O endereço curto tinha uma versão anterior do código de chamadas, sem o
recuperador de chamadas ao retomar a página e sem a separação de faixas remotas
já existente no repositório IL-Bate-Papo. As correções foram sincronizadas,
preservando o HTML e o identificador Analytics próprios de cada endereço.

Cada chamada agora tem sua própria instância React. O processamento de sinais
SDP/ICE é serializado e eventos repetidos de consulta/Realtime são ignorados.
O encerramento desliga callbacks, fecha a conexão, libera câmera/microfone e
os players da sessão correspondente. Eventos atrasados não operam na chamada
seguinte. Ao retornar à página, a reprodução das faixas vivas é tentada de novo;
se o navegador bloquear áudio, continua disponível o botão de ativação de som.

Os avisos Web Push e Realtime usam a mesma identificação por chamada. Atender
ou encerrar remove o aviso quando o evento chega ao cliente ativo. Registros
de histórico de chamada continuam na conversa, mas não geram um segundo aviso
de mensagem pelo observador local. O encerramento não é enviado por push pelo
servidor nesta alteração: um cliente suspenso pode manter um aviso antigo até
retomar. Não há promessa de toque contínuo ou tela cheia no navegador.

Validação: 27 testes Node simulados passaram. Os seis testes de navegador não
puderam rodar: o Chromium não está instalado e o download retornou arquivo
incompleto. Não houve teste de áudio/vídeo entre dois aparelhos físicos.

Consulta somente de leitura ao projeto ngidsolvxegpyrprlbex: 19 inscrições Web
Push do app ilbp; nenhuma inscrição com transporte FCM. O Firebase nativo não
foi ativado nem alterado. O APK não foi recompilado ou distribuído: a chave
original de assinatura não está disponível. O Android existente ainda precisa
de integração de atendimento/recusa na tela bloqueada e teste físico.

Nenhum código ou configuração da Mioko, IL Chats ou IL Chats Mail foi alterado.
