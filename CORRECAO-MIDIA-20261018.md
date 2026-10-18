# Recuperação de mídia de chamadas

Preserva as correções atuais de isolamento de sessão, vídeo, painel de atendimento e notificações. Deduplica respostas SDP, valida o remetente esperado e encerra imediatamente sem aguardar a fila de ICE. Evita recarregar os elementos de mídia na chegada de outra faixa e recupera reprodução quando a faixa recebe dados. Atualiza a imagem após canplay e resize.

Testes Node/VM de chamadas, isolamento de sessão, faixas remotas, notificações, gravação WAV, envio confirmado, histórico e câmera passaram. Validação de áudio/vídeo em dois aparelhos e toque com tela apagada permanecem pendentes. Não há novo instalador nesta alteração.
