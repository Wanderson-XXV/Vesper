# Executor futuro de código

O jogo atual valida saídas. Quando a execução de código entrar, use uma instalação separada do Judge0 ou serviço equivalente, preferencialmente em outra VPS.

## Contrato mínimo

- linguagens inicialmente permitidas: Java e Python;
- limite padrão: 2 s de CPU, 5 s de parede, 256 MB, 32 processos e 64 KB de saída;
- rede desabilitada;
- filesystem temporário, sem montagem do host;
- imagens e versões em lista fechada;
- rate limit por usuário/equipe;
- fonte máxima de 64 KB;
- harnesses e casos de teste pertencem ao servidor;
- aplicação Vesper conversa apenas com a API do executor, nunca com o daemon Docker;
- MicroPython/Pybricks com motor/sensor fica fora até existir mock ou simulação aprovada.

Antes de produção, testar timeout, fork bomb, consumo de memória, saída infinita, acesso à rede e tentativa de leitura do host.
