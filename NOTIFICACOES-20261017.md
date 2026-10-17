# Notificações — diagnóstico de 17/10/2026

Verificação HTTP do endpoint push-notify no projeto ngidsolvxegpyrprlbex:
OPTIONS com Origin https://bate.papo.il-talk.com.br retornou 403,
Access-Control-Allow-Origin null e corpo {"error":"origin not allowed"}.
O bloqueio acontece antes da chamada ao Firebase ou ao Web Push.
A origem nova já está no código-fonte da função; falta implantá-lo no projeto
correto. Nesta sessão o Supabase não está conectado. Não foi alterado outro
projeto nem se afirma que o Firebase recebeu ou entregou notificações.

Cliente: removida supressão de aviso do sistema quando a página está visível.
Incluído aviso dentro da página para mensagens, áudio, fotos, vídeos e ofertas
de chamadas. O aviso interno não depende da permissão de notificação do sistema.
Foram preservados filtros de eventos próprios, duplicados e chamadas antigas.

Testes simulados passaram: test-visible-notifications.cjs,
test-alert-startup.cjs e test-alert-idempotence.cjs.
A entrega real em computador/celular e a configuração da credencial FCM no
servidor ainda não foram confirmadas. No vídeo enviado, o navegador do celular
mostra o botão para liberar o som; isso é uma permissão local independente do
bloqueio de origem no servidor.
