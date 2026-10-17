# Menu móvel e ativação de som — 17/10/2026

Menu inferior: ícones de conversa, pessoa, grupo e engrenagem substituem os
textos visíveis, mantendo os nomes acessíveis e os mesmos botões/ações.

Som: o aviso agora fica próximo ao rodapé, pode ser fechado e não reaparece
repetidamente depois de dispensado. O botão tenta liberar o áudio e executa
um teste. Quando o navegador confirma que a saída está ativa, remove o aviso.
Uma promessa de AudioContext.resume que não termina expira em 2,5 segundos;
a tentativa encerra o contexto antigo, libera o botão e permite nova tentativa.
Não se apresenta isso como confirmação de som ouvido em hardware.

Testes Node passaram: test-sound-control.cjs, test-sound-prompt.cjs e
 test-visible-notifications.cjs. Mantido o diagnóstico separado do servidor:
a origem nova recebeu 403 e o envio via Firebase ainda não foi confirmado.
