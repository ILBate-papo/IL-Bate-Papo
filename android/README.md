# IL Bate Papo Android 1.0.4 — integração preparada

Pacote `br.com.ilbatepapo.app`, versionCode 5, Android 8 ou superior.
Firebase: `il-bate-papo-20261013-c1e4c`, configuração Android fornecida pelo usuário.

Inclui Firebase Messaging nativo, registro do token ligado à conta autenticada,
notificações com canais de som/vibração e expiração de chamadas. O receptor
confere aplicativo, destinatário e validade antes de exibir o aviso.
O WebView usa o domínio confiável na comunicação nativa.

O recebimento remoto depende da publicação do código web corrigido e da Edge
Function `push-notify` no Supabase `ngidsolvxegpyrprlbex`, com o segredo privado
`ILBP_FCM_SERVICE_ACCOUNT` correspondente ao projeto Firebase.
`google-services.json` não substitui essa credencial de servidor.
Não publicar esse segredo no repositório nem no aplicativo.

## Assinatura original

A compilação release usa a chave original quando as variáveis
`ILBP_KEYSTORE`, `ILBP_STORE_PASSWORD`, `ILBP_KEY_ALIAS` e `ILBP_KEY_PASSWORD`
estão definidas. Sem elas, o resultado é **não assinado e não instalável**.
Não gerar outra chave para atualizar a versão existente.

Certificado SHA-256 verificado no APK 1.0.3 existente no repositório:
`38467574e0deffa69c74cdee241a6488842dde48238ce07b69fc8bd2558ac3c6`.
Depois da assinatura, executar `apksigner verify --print-certs` e comparar
esse digest antes de distribuir. A chave privada não pode ser recuperada
desse certificado ou do APK.

O backup da chave original deve ficar fora do repositório e do ZIP de código,
em armazenamento privado protegido por senha. Preservar alias e senhas
em local privado separado. Nenhum backup da chave foi feito nesta sessão:
o arquivo privado não estava disponível.

## Compilação e validação

JDK 17, Gradle 8.11.1, Android SDK/build-tools 35, AGP 8.9.2. Em `android`, executar
`gradle :app:assembleRelease`. AndroidX está habilitado e as versões do Google
Services e Firebase estão fixadas nos arquivos Gradle.

Compilação release verificada sem assinatura. Não houve teste físico de
entrega, chamada, som ou vibração. O toque depende dos canais, permissões e
políticas do Android. Não há ação de atender/recusar na tela bloqueada nem
promessa de funcionamento equivalente ao WhatsApp.

O APK carrega o site remoto. Compilar, sozinho, não publica as correções web
e não ativa o servidor de notificações. Nenhuma cobrança foi ativada.
