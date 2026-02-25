// backend/data/siteSettings.js
// As configurações do site agora são gerenciadas pelo banco de dados PostgreSQL via Prisma.
// Uma linha na tabela SiteSettings (com id=1) conterá as configurações.
// Valores padrão são definidos no schema.prisma ou na primeira criação.

// Este objeto não é mais a fonte primária.
let siteSettings = {}; 
module.exports = siteSettings;
