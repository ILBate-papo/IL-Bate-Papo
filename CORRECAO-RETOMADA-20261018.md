# Recuperação de chamadas após suspensão

O IL Bate Papo passa a consultar chamadas dos últimos 90 segundos ao abrir,
voltar para a página, recuperar internet ou restabelecer o canal de eventos.
Ofertas já respondidas, encerradas ou expiradas não voltam a tocar. O mesmo
evento recebido pela consulta e pelo canal não gera avisos duplicados.

A recuperação continua obedecendo às políticas do banco e à conta conectada.
Sair da conta remove os ouvintes e descarta consultas ainda em andamento.
Não atende chamadas automaticamente nem acessa microfone/câmera ao recuperar.

Validação simulada: recuperação inicial e após retorno, filtro de chamadas
atendidas/encerradas/antigas, duplicação, encerramento concorrente com consulta
e limpeza dos ouvintes. Testes anteriores de sinalização, mídia e notificação
continuam passando. Não equivale a teste em aparelhos físicos.

Limites verificados nesta sessão: não foram encontrados registros FCM nativos
no banco. A busca de arquivos não localizou a chave original para assinar uma
atualização do APK. O APK 1.0.4 não foi reconstruído nem distribuído.
Nenhum arquivo ou configuração da Mioko foi alterado.
