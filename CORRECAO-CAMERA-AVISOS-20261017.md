# Câmera e notificações — 17/10/2026

Câmera da conversa: substituído controlador inline antigo da raiz pelo módulo camera-session.js. Pausa de 350ms após encerrar tracks, preferência por facingMode frontal/traseira e alternativas por dispositivo. Falhas deixam o botão de troca disponível; falha em enumerateDevices não encerra a prévia. Fechamento e troca de tela cancelam solicitações pendentes.

Notificações: falha no registro/update do service worker não impede mais a assinatura Realtime de primeiro plano. Teste local diferencia inscrição e exibição local de entrega remota.

Testes Node simulados passaram: test-camera-switch.cjs, test-alert-startup.cjs, test-history-sync.cjs, test-history-send.cjs e test-history-push.cjs. Não houve teste em hardware Android.

Servidor: preparada inclusão de https://bate.papo.il-talk.com.br na origem aceita por supabase/functions/push-notify/index.ts do repositório IL-Bate-Papo. NÃO implantada no Supabase: conexão só lista lxjbpklzrhylmlyepdkc (outro aplicativo). Projeto necessário ngidsolvxegpyrprlbex sem permissão. Consulta OPTIONS direta também não respondeu por timeout de rede; não foi possível confirmar a versão implantada. Não se afirma entrega real de push nem toque em tela bloqueada.

Não foi alterado o Supabase de outro aplicativo. Ainda necessário: acesso ao projeto correto, publicação da função com origem nova, reinscrição dos dispositivos no subdomínio e validação com duas contas/aparelhos reais.
