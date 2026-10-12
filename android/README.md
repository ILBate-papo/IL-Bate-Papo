# IL Bate Papo Android — versão de teste 1.0.1

Aplicativo Android com Activity e WebView próprios, usando exclusivamente https://ilbate-papo.github.io/. Não é uma instalação PWA. O conteúdo e os dados continuam no site e no Supabase atual.

Implementado: câmera/microfone com permissões Android limitadas ao domínio e caminhos do Bate Papo; seletor de anexos; armazenamento de sessão no WebView; área visível ajustada ao teclado e barras do sistema; ícone do leão.

Compile com JDK 17, SDK Android 35 e Gradle 8.11.1: `gradle assembleDebug bundleRelease` nesta pasta. As versões do Android Gradle Plugin estão fixadas no código. APK de teste usa assinatura de desenvolvimento; AAB release precisa da assinatura da loja. Antes de criar a versão de produção, conferir applicationId/versionCode e chave de assinatura do aplicativo já cadastrado no Google Play. Nenhuma chave privada deve entrar no repositório.

Validação realizada: compilação Java e DEX; assinatura APK validada por apksigner; AAB validado por bundletool 1.18.2. Não houve teste físico Android.

Pendências: push nativo para avisos com aplicativo fechado; isolamento completo dos dados no Supabase. Não confundir separação de sessão local com separação de contas, tabelas e políticas no servidor. Não publicar este AAB como versão final antes de resolver essas pendências.


Login Google 1.0.1: autorização no navegador externo, desafio SHA-256 PKCE, verificador privado de uso único com validade de dez minutos, callback br.com.ilbatepapo.app://auth-callback e troca do código no endpoint Supabase. A sessão é passada ao cliente do Bate Papo na página HTTPS autorizada. Não há chaves secretas no APK.

Configuração necessária: adicionar exatamente br.com.ilbatepapo.app://auth-callback em Authentication → URL Configuration → Redirect URLs do projeto ngidsolvxegpyrprlbex. Manter o Site URL existente, usado pelo IL Chats. Recomenda-se também conferir a permissão do retorno web https://ilbate-papo.github.io/ para o login no navegador. Nenhuma alteração dessa configuração foi feita pelo conector, que não oferece essa operação.

O login real com Google em um aparelho não foi testado; a compilação, a assinatura de atualização e o filtro de retorno do APK foram verificados.
