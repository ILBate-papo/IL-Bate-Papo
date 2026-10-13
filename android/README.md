# IL Bate Papo Android 1.0.3

Pacote br.com.ilbatepapo.app, versionCode 4, Android 8 ou superior. Site e chamadas web preservados.

Inclui cache renovado, compartilhamento Android, download aberto no navegador, câmera/microfone, permissão de notificações no Android 13+, canais separados para mensagens, áudio, voz e vídeo, com som e vibração. O teste local fica no Perfil. A comunicação com o Android usa WebMessagePort enviado apenas ao domínio confiável; não expõe addJavascriptInterface a páginas ou frames.

Limitação: não há recebimento nativo de push com o aplicativo suspenso ou fechado. Firebase ainda precisa ser conectado, configurado e integrado; isso não deve ser anunciado como concluído. A chave nova foi guardada em backup privado, fora deste repositório. O APK 1.0.1 usa outra chave e precisa ser removido antes da primeira instalação desta linha. Depois, preservar a nova assinatura nas próximas versões.

Validação: compilação Java com Android SDK 35; DEX com D8 35; recursos com AAPT2 35; assinatura e verificação com apksig 8.9.2. Pacote/versão/permissões do manifesto conferidos. Sem teste físico Android.
