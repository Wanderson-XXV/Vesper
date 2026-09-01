# 0011 — Conta precede o caso e identifica o investigador

## Decisão

Uma sessão autenticada é necessária para iniciar ou retomar um caso. O usuário da conta identifica o investigador no MVP; não há um segundo campo de nome no cadastro.

O Hub mantém o acesso à conta no canto da tela. Ao tentar iniciar sem sessão, abre a entrada de conta; depois de autenticar, o jogador segue diretamente para o caso escolhido. Login aparece primeiro e criação de conta é uma etapa separada. A decisão `0012` acrescenta código obrigatório de equipe ao cadastro estudantil.

## Consequência

Criação visual de personagem, aparência e outras escolhas de identidade serão uma etapa futura do perfil, e não uma duplicação do usuário. Privilégio de mentor deixa de ser campo do onboarding e usa bootstrap administrativo. O vínculo estudantil com equipe foi posteriormente definido como obrigatório pela decisão `0012`.

Casos, saves premiados e relatórios passam a ter uma conta como referência explícita. O modo sem API continua útil para desenvolvimento visual, mas não inicia investigação no fluxo de produto.
