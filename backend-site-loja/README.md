# Norte Sul Informática - Backend

Este repositório contém o código-fonte para o backend (Node.js + Express + Prisma) da aplicação Norte Sul Informática.

## 🚀 Guia de Instalação Rápida

Siga **exatamente** estes passos para rodar o backend localmente.

### Pré-requisitos

*   **Node.js**: Versão 18 ou superior.
*   **npm**: Instalado com o Node.js.
*   **PostgreSQL**: Instalado e rodando na sua máquina.

---

### Passo 1: Navegue para a Pasta do Backend

Abra seu terminal e certifique-se de que você está **dentro da pasta `backend-site-loja`**:

```bash
cd backend-site-loja
```

### Passo 2: Instale as Dependências do Backend

Este é o passo mais comum onde ocorrem erros. Execute o seguinte comando **dentro da pasta `backend-site-loja`**:

```bash
npm install
```

**Se você ver um erro como `Error: Cannot find module 'helmet'`, significa que este passo não foi executado ou falhou. Execute-o novamente.**

### Passo 3: Configure o Banco de Dados e Chaves de API

1.  Crie um arquivo chamado `.env` na raiz da pasta `backend-site-loja`.
2.  Copie o conteúdo abaixo para o seu arquivo `.env` e **substitua os valores** com as credenciais do seu PostgreSQL e as suas chaves de API.

    ```env
    # Substitua com seus dados reais de conexão com o PostgreSQL
    # Exemplo: postgresql://postgres:mysecretpassword@localhost:5432/nortesuldb?schema=public
    DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/NOME_DO_BANCO?schema=public"
    
    # ===================================================================================
    # Chave da API do Google Gemini - OBRIGATÓRIA
    # ===================================================================================
    # Crie sua chave em https://aistudio.google.com/app/apikey e cole aqui.
    # Esta chave é usada para o processamento de imagem de produtos com IA.
    API_KEY="SUA_CHAVE_API_GEMINI_AQUI"
    
    # ===================================================================================
    # URLs para Produção (IMPORTANTE para links de e-mail e imagens)
    # ===================================================================================
    # Domínio público do seu frontend (o site que o cliente acessa)
    FRONTEND_URL=https://nortesulinformatica.com
    # Domínio público do seu backend (onde a API está hospedada)
    BACKEND_URL=https://nortesulinformatica.com

    # Chave para JWT. Pode manter esta para testes locais.
    JWT_SECRET="um_segredo_muito_forte_e_aleatorio_para_jwt"
    
    # Chaves do Asaas (Opcional para iniciar). Pegue no painel de Homologação.
    ASAAS_API_KEY=""
    ASAAS_WEBHOOK_SECRET=""
    ```

### Passo 4: (Opcional) Configure o SSL para HTTPS

1.  Dentro da pasta `backend-site-loja`, crie uma pasta chamada `ssl`.
2.  Coloque seus arquivos de certificado (`cert.pem`) e chave (`key.pem`) dentro desta nova pasta.
3.  Se o servidor não encontrar esses arquivos ao iniciar, ele rodará em modo `http` por padrão.

### Passo 5: Crie e Popule o Banco de Dados

Este comando irá criar todas as tabelas e adicionar dados iniciais (como o usuário admin). **Use-o apenas na primeira vez.**

```bash
npm run db:reset
```

### Passo 6: Atualizando o Banco de Dados (Após Modificações)

**IMPORTANTE:** Sempre que você modificar o arquivo `prisma/schema.prisma.js` (ou baixar uma versão nova com modificações), você **precisa** atualizar seu banco de dados. Use o seguinte comando para aplicar as mudanças:

```bash
npm run prisma:migrate
```

O Prisma pedirá um nome para a migração (ex: `add_gemini_key`). Isso garante que seu banco de dados local corresponda ao código da aplicação.

### Passo 7: Inicie o Servidor

```bash
npm run dev
```

O servidor deve iniciar com sucesso e estará rodando em `https://localhost:8443` (com SSL) ou `http://localhost:8443` (sem SSL).