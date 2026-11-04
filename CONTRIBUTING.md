# Como contribuir

Obrigado pelo interesse em melhorar o Cartaz Fácil.

## Antes de começar

- Procure uma issue existente antes de abrir uma nova.
- Para mudanças grandes, descreva a proposta em uma issue primeiro.
- Preserve o funcionamento offline e a compatibilidade com Windows.
- Não inclua dados pessoais, marcas de terceiros ou materiais sem licença.

## Ambiente local

```powershell
npm ci
npm start
```

Antes de enviar um pull request:

```powershell
npm run check
npm run screenshot
```

Teste também a impressão em escala de 100% quando a mudança afetar dimensões,
margens, tipografia ou regras de `@media print`.

## Pull requests

Explique o problema, a solução e como a mudança foi validada. Para alterações
visuais, inclua uma captura de antes e depois.
