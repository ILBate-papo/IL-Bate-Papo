# Diagnóstico local de chamadas 1.1.4

O diagnóstico 1.1.3 mistura o último processamento da chamada recebida pelo
Firebase com o processamento iniciado pelo aplicativo aberto. Uma chamada
mostrada em primeiro plano pode, por isso, parecer evidência de entrega FCM.

Esta versão de teste separa os registros. O recebimento FCM é anotado antes
das verificações de destinatário, prazo e permissões, com a prioridade enviada
e recebida e o estado da tela. O serviço de chamada mantém seu registro próprio
e não sobrescreve essa evidência. O diagnóstico mostra também os estados que
o Android expõe para economia de bateria e restrição em segundo plano. Isso
não inclui todas as restrições específicas de fabricantes.

Os registros ficam somente no aparelho. Não guardam tokens, nomes, conteúdo
de mensagens nem credenciais. O envio pelo servidor, a duração das chamadas,
a lógica de toque e os scripts de mídia da versão 1.1.3 são preservados.

## Validação necessária no aparelho

Depois de atualizar apenas o aparelho de teste, abrir o aplicativo uma vez e
receber uma chamada com ele em segundo plano. Em Meu perfil, tocar em
“Ativar e testar avisos do Android” para ver o diagnóstico. Comparar o horário
da tentativa com “Recebimento pelo Firebase”. O registro anterior de 1.1.3
permanece na seção de processamento e não é apresentado como um recebimento
FCM da nova versão.

Nenhum recebimento FCM durante o teste aponta para uma falha anterior ao
callback, mas não identifica sozinho se a causa é rede, cadastro, FCM ou
restrição do Android. Prioridade recebida normal quando enviada alta identifica
redução de prioridade nesse aviso. Um aviso expirado confirma que o callback
recebeu o aviso depois do prazo. Nenhum desses resultados deve ser presumido
antes do teste físico.

Esta versão melhora a investigação e não constitui uma correção comprovada
da falha de entrega. Não publicar como versão estável antes dos testes nos
POCO e no Redmi.
