# Project TODO

- [x] Definir contrato Stremio para `/manifest.json` e rotas públicas de stream para filmes e séries.
- [x] Consolidar os providers PT declarados: FSHD, MegaEmbed, Peachify, RedeFlix, AnimeZeY e VideoEasy, removendo duplicidades por ID.
- [x] Preservar créditos, repositório de origem, status e idiomas declarados de cada provider no registro interno do addon.
- [x] Adaptar respostas Nuvio para objetos de stream Stremio, incluindo identificação de fonte, qualidade, cabeçalhos de reprodução e temporada/episódio.
- [x] Aplicar filtro de elegibilidade PT/pt-BR e não incluir providers declarados apenas em outros idiomas.
- [x] Marcar VideoEasy como indisponível por padrão até passar por verificação técnica, em vez de expô-lo como ativo.
- [x] Não usar a API EmbedPlay como fonte de reprodução sem endpoint público de stream validado; apresentar seu status somente como índice de IDs.
- [x] Criar página pública elegante com instalação do Stremio, cópia da URL do manifesto e painel de diagnóstico de fontes.
- [x] Implementar proteção de tempo limite, falha isolada por provider e deduplicação de streams retornados.
- [x] Escrever testes Vitest para manifesto, mapeamento de streams, filtros de idioma, rotas e deduplicação.
- [x] Validar o manifesto e exemplos determinísticos de respostas das rotas antes da entrega.
- [x] Criar checkpoint final e fornecer a versão e o link de instalação para o Stremio.
