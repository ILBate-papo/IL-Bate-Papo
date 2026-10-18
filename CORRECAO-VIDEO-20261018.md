# IL Bate Papo — vídeo remoto e abertura da notificação

Os vídeos enviados mostram a câmera local funcionando e ampliando, mas o
vídeo remoto ausente em chamadas indicadas como conectadas. O vídeo anterior
também mostra notificações na cortina do Android; isso não comprova som.

Alterações: faixas recebidas de áudio e vídeo são ligadas a elementos com
streams independentes. A chegada de áudio não redefine a fonte do vídeo.
A reprodução é tentada novamente quando a faixa deixa de estar silenciada
por falta de dados; a indicação de vídeo pronto também acompanha metadados
e mudanças de tamanho. A imagem local e o envio de arquivos são preservados.

Abrir uma notificação agora foca a janela já aberta sem recarregá-la.
O recarregamento anterior descartava o estado da chamada e a conexão WebRTC.

Validação: testes de faixa remota atrasada, substituição e fim de faixa,
roteamento do componente, ICE inicial, cancelamento, liberação de câmera,
recuperação de anexo, controle de som, notificações e foco sem recarregar.
Esses testes são simulados. O navegador de teste não pôde ser instalado
(download incompleto); não houve validação de vídeo/áudio entre aparelhos.

O som com o navegador em segundo plano continua dependendo da permissão e
do canal de notificação do Android. Não há comprovação de toque físico.
O APK não foi reconstruído; a assinatura original continua indisponível.
Nenhum arquivo nem configuração da Mioko foi alterado.
