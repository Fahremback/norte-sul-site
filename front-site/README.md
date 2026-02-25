# Norte Sul Informática - Aplicação Full Stack

Este repositório contém o código-fonte para o frontend (Vite + React) e o backend (Node.js + Express + Prisma) da aplicação Norte Sul Informática.

## Pré-requisitos

Antes de começar, você precisará ter o seguinte software instalado em sua máquina:

*   **Node.js**: Versão 18 ou superior.
*   **npm** (ou yarn/pnpm): Gerenciador de pacotes do Node.js.
*   **PostgreSQL**: O banco de dados utilizado pela aplicação. Certifique-se de que ele esteja instalado e rodando.
*   **Certificados SSL (Opcional, para HTTPS local)**: Para rodar o backend em modo seguro (`https`), você precisará de um certificado (`cert.pem`) e uma chave (`key.pem`).

## Configuração para Testes Locais

Siga estes passos para configurar e rodar a aplicação completa no seu ambiente local.

### 1. Configuração do Backend

O backend é responsável pela API, banco de dados e lógica de negócios.

1.  **Navegue até a pasta do backend:**
    ```bash
    cd backend-site-loja
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as Variáveis de Ambiente:**
    *   Crie um arquivo chamado `.env` na raiz da pasta `backend-site-loja`.
    *   **IMPORTANTE:** Edite a variável `DATABASE_URL` neste arquivo com as credenciais corretas do seu banco de dados PostgreSQL.

    **Conteúdo para o seu arquivo `.env`:**
    ```
    # Substitua os valores abaixo com os seus dados reais
    DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/NOME_DO_BANCO?schema=public"
    
    # Chave para JWT. Pode manter esta para testes locais.
    JWT_SECRET="um_segredo_muito_forte_e_aleatorio_para_jwt"
    
    # Chaves do Asaas (Opcional para iniciar). Pegue no painel de Homologação.
    ASAAS_API_KEY=""
    ASAAS_WEBHOOK_SECRET=""
    ```

4.  **(Opcional) Configure o SSL para HTTPS:**
    *   Dentro da pasta `backend-site-loja`, crie uma nova pasta chamada `ssl`.
    *   Coloque seus arquivos de certificado e chave dentro dela, nomeados como `cert.pem` e `key.pem`.
    *   Se estes arquivos não forem encontrados, o servidor iniciará em modo `http` inseguro.

5.  **Prepare o Banco de Dados (Prisma):**
    *   Execute o seguinte comando para criar as tabelas no seu banco de dados com base no schema:
        ```bash
        npx prisma migrate dev --name init
        ```
    *   (Opcional, mas recomendado) Execute o comando a seguir para popular o banco com dados iniciais (usuário admin, cursos, etc.):
        ```bash
        npx prisma db seed
        ```

6.  **Inicie o servidor backend:**
    ```bash
    npm run dev
    ```
    O servidor estará rodando em `https://localhost:8443` (se SSL estiver configurado) ou `http://localhost:8443` (se não). Você verá logs de confirmação no terminal.

### 2. Configuração do Frontend

O frontend é a interface com a qual o usuário interage.

1.  **Abra um novo terminal** e navegue até a pasta raiz do projeto (onde fica o `index.html`).

2.  **Instale as dependências:**
    *   Para garantir uma instalação limpa, é uma boa prática remover a pasta `node_modules` e o arquivo `package-lock.json` se existirem:
        ```bash
        rm -rf node_modules package-lock.json
        ```
    *   Instale as dependências:
        ```bash
        npm install
        ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação frontend estará disponível em `http://localhost:5173`. O Vite irá automaticamente usar o proxy para se comunicar com o backend nas chamadas de API.

### 3. Configurando Pagamentos com Asaas (Opcional)

Para testar o fluxo de pagamento PIX, você precisará de uma conta no Asaas.

1.  **Crie uma conta no Asaas:** Acesse [https://www.asaas.com/](https://www.asaas.com/).
2.  **Use o Ambiente de Testes (Homologação):** No painel do Asaas, mude para o ambiente de **Homologação**. Isso é crucial para não usar dinheiro real.
3.  **Obtenha sua Chave de API:** No menu `Integração > API`, gere e copie sua chave de API (geralmente começa com `$aact_...`).
4.  **Configure as chaves no seu site:**
    *   Faça login como admin (use as credenciais definidas nas variáveis de ambiente `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
    *   Vá para `Painel Admin > Config. Site`.
    *   Cole a chave no campo `Chave de API Asaas`.
    *   Salve as alterações.

### 4. Testando Webhooks Localmente com `ngrok` (Avançado)

O Asaas precisa de uma URL pública para enviar a confirmação de pagamento (webhook). Como `localhost` não é público, você pode usar uma ferramenta como o `ngrok`.

1.  **Instale o ngrok:** Siga as instruções em [https://ngrok.com/download](https://ngrok.com/download).
2.  **Exponha a porta do seu backend:** Com o servidor backend rodando na porta 8443, execute em um novo terminal:
    ```bash
    ngrok http 8443
    ```
3.  **Copie a URL `https` fornecida pelo ngrok.** Ela será algo como `https://aleatorio.ngrok-free.app`.
4.  **Configure o Webhook no Asaas:**
    *   No painel do Asaas (em Homologação), vá para `Integração > Webhooks`.
    *   Crie um novo webhook e cole a URL do ngrok, adicionando o caminho do seu endpoint:
        `https://aleatorio.ngrok-free.app/api/payment/webhook/asaas-confirmation`
    *   Gere um **token de autenticação** e salve-o.
    *   No painel de admin do seu site, cole esse token no campo `Segredo do Webhook Asaas` e salve.

Agora, quando você simular um pagamento no Asaas (usando o modo de teste), ele enviará a confirmação para o seu servidor local através do túnel do ngrok.
