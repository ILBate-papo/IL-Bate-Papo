# IL Bate Papo Android 1.0.8

Pacote `br.com.ilbatepapo.app`, versionCode 10, Android 8 ou superior.

Esta versão restaura os controles nativos de chamada (tela recebida, atender,
recusar e encerramento) a partir do código 1.0.5 salvo, preservando o banco
atual, o login Google e os recursos de localização do repositório.
O aplicativo carrega o site atual, sem substituir scripts por cópias antigas
embutidas. Publicar o código web junto com esta atualização é necessário.

O servidor só marca uma chamada perdida quando há oferta e encerramento
registrados, o remetente é quem iniciou e não existe resposta. O sinal de
encerramento continua chegando nas chamadas atendidas para fechar o aviso.
Tentativas sem resposta encerram após 90 segundos enquanto o cliente de
origem estiver executando. Fechar ou suspender esse cliente pode adiar o
encerramento: não há agendador de chamadas no servidor nesta versão.

## Compilação

JDK 17, Gradle 8.11.1, Android SDK/build-tools 35 e AGP 8.9.2.
Executar `gradle :app:assembleRelease` em `android`.

A assinatura release usa `ILBP_KEYSTORE`, `ILBP_STORE_PASSWORD`,
`ILBP_KEY_ALIAS` e `ILBP_KEY_PASSWORD`. Manter credenciais fora do repositório.
Sem elas, o APK release não estará assinado.

Certificado do APK 1.0.6, preservado nesta atualização:
`38467574e0deffa69c74cdee241a6488842dde48238ce07b69fc8bd2558ac3c6`.
Comparar com `apksigner verify --print-certs` antes de distribuir.

Firebase: `il-bate-papo-20261013-c1e4c`.
Servidor: `push-notify` no Supabase `cipfycetzelxzwpfaqiu`.
O segredo `ILBP_FCM_SERVICE_ACCOUNT` pertence somente ao servidor.

## Limites da validação

Compilação release e certificado de assinatura verificados localmente.

Os testes locais exercitam o bridge nativo, atender/recusar, encerramento,
expiração, notificações visíveis e classificação de chamadas perdidas.
Eles não substituem testes de entrega FCM, áudio, vídeo e repouso prolongado
em aparelhos físicos. Permissões, canais de notificação e restrições de
bateria do Android continuam afetando o recebimento.
