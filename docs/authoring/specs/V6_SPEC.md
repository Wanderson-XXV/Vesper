# V6 — Especificação de implementação

## Objetivo da versão

Consolidar a direção visual e autoral da V5 sem adicionar sistemas grandes. A V6 deve corrigir pequenos rompimentos de imersão e tornar o conteúdo reutilizável para futuras tracks.

## 1. Exterior com estado visual

### Antes do Ritual 0
Usar:
`assets/reference/exterior_portao_fechado.png`

### Depois do Ritual 0
Usar o background atual com o portão aberto.

### Transição
1. resposta correta;
2. SFX de rito;
3. SFX mecânico / fechadura;
4. fade to black curto (250–450 ms);
5. trocar background;
6. fade in;
7. continuar cena;
8. liberar ação de entrada.

Não criar uma nova “sala”; isto é um estado visual da mesma sala.

## 2. Ritual 0 — correção narrativa

Remover qualquer frase equivalente a “é fácil de propósito”.

O ritual deve existir porque os selos externos possuem uma forma simples de resposta, não porque um designer criou um tutorial.

### Explicação mínima esperada de Tomás
- as marcas no portão são selos;
- o instrumento detecta resposta do selo;
- `1` = selo ainda responde;
- `0` = selo apagado;
- precisamos saber quantos ainda respondem para romper o equilíbrio da trava.

A protagonista reformula o problema antes da HUD do rito abrir.

## 3. Evidências reabríveis

No Arquivo de Campo, cada evidência deve ser clicável.

Ao clicar:
- reconstruir o visual original do documento/pista;
- não disparar flags novamente;
- não alterar progresso;
- botão “Voltar ao arquivo”.

Cada evidência precisa suportar `viewScene` ou um `viewPayload` equivalente.

## 4. Grimório V2

Manter o conceito de livro aberto.

Melhorias:
- navegação integrada ao rodapé/páginas;
- remover botões flutuantes fora do livro;
- conteúdo mais detalhado;
- adicionar anotação humana da protagonista quando fizer sentido;
- código continua em bloco técnico, mas inserido na página.

Cada verbete deve poder conter:
- o que é;
- como pensar;
- sintaxe;
- exemplo;
- erro comum;
- quando aparece num rito;
- anotação da protagonista;
- dica de Tomás opcional.

## 5. Perfis de personagem

Personagens conhecidos no Arquivo devem ser clicáveis.

Perfil mínimo:
- nome;
- papel conhecido pelo jogador;
- retrato;
- “o que sabemos”;
- observação atual da protagonista;
- evidências relacionadas.

Nunca mostrar informação secreta apenas porque existe em `characters.json`.

## 6. Áudio

Configurações separadas:
- Master;
- Música;
- SFX.

Fórmula conceitual:
`volumeFinal = master * categoria * volumeDoAsset`

## 7. Não fazer na V6

- editor visual de campanha;
- login;
- backend;
- execução de Java no navegador;
- mapa navegável;
- novo sistema de combate;
- refazer toda a história.
