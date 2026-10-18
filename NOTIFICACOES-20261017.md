# Notificações — diagnóstico e implantação de 17/10/2026

## Correção publicada no Supabase

A função `push-notify` versão 6 foi publicada em `ngidsolvxegpyrprlbex`.
Ela aceita `https://bate.papo.il-talk.com.br`, mantém os endereços anteriores,
inclui o tipo de anexo no aviso e usa o módulo FCM preparado neste repositório.
JWT obrigatório, verificação do remetente e filtro por aplicativo foram mantidos.
Nenhuma alteração foi feita no projeto da Mioko.

Verificação HTTP após a publicação: preflight do domínio novo e dos dois
endereços GitHub retorna 200 e a origem correspondente. Origem desconhecida
continua retornando 403. POST sem autenticação retorna 401.

Passaram os testes locais do servidor (incluindo o domínio novo), FCM,
Service Worker, avisos visíveis, inicialização sem Service Worker e controle
de som. São testes simulados e de HTTP; não comprovam som físico nem entrega.

No banco, há inscrições Web Push identificadas como IL Bate Papo, mas nenhuma
inscrição com transporte FCM. A credencial privada FCM não foi conferida nem
alterada. O recebimento no APK e a entrega com tela apagada continuam pendentes
de validação em aparelhos. Testar com duas contas distintas: eventos enviados
pela própria conta são filtrados pelo cliente.

## Diagnóstico anterior (antes da publicação)

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
