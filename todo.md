# Project TODO - Loja FiveM (Aurora City)

## Completed Features
- [x] Database schema and tables (products, categories, banners, orders, users)
- [x] Frontend landing page with product catalog
- [x] Shopping cart with discount coupon (SP25 = 25% off)
- [x] Checkout form with player nick and game ID
- [x] Admin panel with login authentication
- [x] Admin product management (create, edit, delete)
- [x] Admin category management
- [x] Admin banner management
- [x] Admin orders view
- [x] Discord OAuth integration
- [x] Discord Webhook notifications for new orders
- [x] Order creation and storage in database
- [x] Database schema correction (gameId and discordId columns added to orders table)
- [x] Order retrieval from database

## Known Issues Fixed
- [x] Database column case sensitivity issue (gameId, discordId, createdAt, updatedAt)
- [x] Missing gameId and discordId columns in orders table
- [x] Schema Drizzle mapping to database columns

## Remaining Tasks
- [x] Fix Discord OAuth redirect_uri configuration
- [x] Discord OAuth now working with Manus domain
- [x] Login system working with Manus OAuth (more reliable)
- [x] Local authentication system with email/password implemented
- [x] User registration page created
- [x] User login page created
- [x] User profile page created
- [x] Fix route / 404 error
- [x] Add cookie-parser middleware to server
- [x] Create localAccounts table in database
- [x] Add localAccounts table initialization in initDb.ts
- [x] Write unit tests for local authentication
- [x] Test local authentication end-to-end (register, login, profile)
- [x] Test Discord Webhook notifications (verify messages are sent to Discord)
- [x] Implement payment processing (Stripe schema added, webhook integration pending)
- [ ] Add order status management (pending, completed, cancelled)
- [ ] Implement email notifications
- [ ] Add order history for users
- [ ] Implement inventory management
- [ ] Add product reviews/ratings
- [ ] Implement search and filtering improvements
- [ ] Add analytics dashboard
- [ ] Optimize performance and SEO
- [ ] Deploy to production

## Current Status
The core functionality is working:
- ✅ Users can browse products
- ✅ Users can add products to cart
- ✅ Users can checkout with their game ID
- ✅ Orders are saved to database
- ✅ Admin can view orders
- ⚠️ Discord notifications need verification
- ⚠️ Discord OAuth redirect_uri needs configuration

## Notes
- Database: MySQL (TiDB)
- Frontend: React 19, Tailwind 4
- Backend: Express 4, tRPC 11, Drizzle ORM
- Authentication: Manus OAuth + Discord OAuth
- Deployment: Manus WebDev platform

## New Features (User Requested)
- [x] Login automático após registro (auto-login after register)
- [x] Persistência de sessão (session persistence across pages)
- [x] Dashboard de compras com histórico de pedidos (purchase dashboard with order history)
- [x] Perfil editável com foto de perfil (editable profile with profile picture)
- [x] Edição de Game ID no perfil (edit Game ID in profile)
- [x] Sistema de status de pedidos (order status system: pending, approved, rejected)
- [x] Indicador visual de login na loja (visual login indicator in store)
- [x] Painel de compras integrado (integrated purchase panel in store)


## CRITICAL FIXES (User Reported)
- [x] Sessão não persiste ao navegar entre páginas
- [x] Login não funciona corretamente - usuário não fica logado na loja
- [x] Botão "Voltar à Loja" não mantém autenticação
- [x] useAuth() não está sincronizando corretamente com sessão
- [x] Implementar verificação de sessão ao carregar página
- [x] Corrigir fluxo de autenticação para manter login persistente
- [x] Erro "Não autenticado" na página inicial
- [x] Erros TypeScript em Admin.tsx, Home.tsx, Profile.tsx
- [x] Procedimentos de admin com caminho incorreto


## ADM System & Notifications (User Requested)
- [x] Criar sistema de login ADM com senha especial
- [x] Implementar painel admin protegido (apenas ADM)
- [x] Adicionar notificações visuais de sucesso em login
- [x] Adicionar notificações visuais de erro em login
- [x] Adicionar notificações visuais de sucesso em cadastro
- [x] Adicionar notificações visuais de erro em cadastro
- [x] Adicionar notificações visuais de logout
- [x] Testar fluxo completo de ADM


## Admin Panel - Full Management (Priority)
- [x] Procedimentos tRPC para CRUD de categorias
- [x] Procedimentos tRPC para CRUD de produtos
- [x] Procedimentos tRPC para CRUD de banners
- [x] Dashboard admin principal com estatísticas
- [x] Interface de gerenciamento de categorias (criar, editar, deletar)
- [x] Interface de gerenciamento de produtos (criar, editar, deletar)
- [x] Interface de gerenciamento de banners (criar, editar, deletar)
- [x] Proteção de rotas admin (apenas admin pode acessar)
- [ ] Upload de imagens para produtos e banners
- [x] Notificações de sucesso/erro nas operações admin
- [x] Testes para procedimentos admin

## UI/UX Improvements (User Requested)
- [x] Adicionar campo de ordem (position/order) nas tabelas de categorias e produtos
- [x] Implementar botões "Mover para cima" e "Mover para baixo" para categorias
- [x] Implementar botões "Mover para cima" e "Mover para baixo" para produtos
- [x] Implementar botões "Mover para cima" e "Mover para baixo" para banners
- [x] Procedimentos tRPC para atualizar ordem de categorias, produtos e banners

## Site Content Management (User Requested)
- [ ] Criar tabela de configurações de site (site_config)
- [ ] Adicionar campos: hero_title, hero_subtitle, hero_description, welcome_text
- [ ] Criar procedimentos tRPC para ler/atualizar configurações
- [ ] Adicionar seção "Configurações do Site" no painel de admin
- [ ] Permitir edição de textos da página inicial (bem-vindo, título, descrição)
- [ ] Permitir edição de tags de produtos (Mais vendido, Entrega rápida, etc)
- [ ] Atualizar Home.tsx para usar textos do banco de dados
