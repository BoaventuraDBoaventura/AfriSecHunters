# Guia de Deploy - AfriSec Hunters

## Requisitos
- Servidor com Docker instalado
- Portainer configurado
- Nginx Proxy Manager configurado
- Domínio cyberstartup.cloud apontando para o servidor

---

## Passo 1: Configurar DNS

No seu provedor de domínio, configure:

| Tipo | Nome | Valor |
|------|------|-------|
| A | @ | IP_DO_SEU_SERVIDOR |
| A | www | IP_DO_SEU_SERVIDOR |

---

## Passo 2: Criar Rede Docker

Execute no terminal do servidor:

```bash
docker network create proxy-network
```

**Importante:** Certifique-se de que o Nginx Proxy Manager também está nessa rede.

---

## Passo 3: Clonar o Repositório

```bash
cd /opt
git clone https://github.com/SEU_USUARIO/afrisec-hunters.git
cd afrisec-hunters
```

---

## Passo 4: Deploy via Portainer

### Opção A: Via Interface do Portainer

1. Acesse o Portainer
2. Vá em **Stacks** → **Add Stack**
3. Nome: `afrisec-hunters`
4. Cole o conteúdo do `docker-compose.yml`
5. Clique em **Deploy the stack**

### Opção B: Via Terminal

```bash
cd /opt/afrisec-hunters
docker-compose up -d --build
```

---

## Passo 5: Configurar Nginx Proxy Manager

1. Acesse o Nginx Proxy Manager (geralmente porta 81)
2. Vá em **Proxy Hosts** → **Add Proxy Host**

### Aba Details:
| Campo | Valor |
|-------|-------|
| Domain Names | `cyberstartup.cloud` `www.cyberstartup.cloud` |
| Scheme | http |
| Forward Hostname/IP | `afrisec-hunters` (nome do container) |
| Forward Port | `80` |
| Cache Assets | ✅ |
| Block Common Exploits | ✅ |
| Websockets Support | ✅ |

### Aba SSL:
| Campo | Valor |
|-------|-------|
| SSL Certificate | Request a new SSL Certificate |
| Force SSL | ✅ |
| HTTP/2 Support | ✅ |
| HSTS Enabled | ✅ |
| Email for Let's Encrypt | seu@email.com |

3. Clique em **Save**

---

## Passo 6: Verificar Deploy

```bash
# Ver logs do container
docker logs afrisec-hunters

# Verificar status
docker ps | grep afrisec

# Testar localmente
curl http://localhost:3000/health
```

---

## Passo 7: Testar o Site

Acesse: https://cyberstartup.cloud

---

## Comandos Úteis

```bash
# Rebuild e restart
docker-compose up -d --build

# Ver logs em tempo real
docker logs -f afrisec-hunters

# Parar container
docker-compose down

# Limpar imagens antigas
docker system prune -a
```

---

## Atualizar o Site

```bash
cd /opt/afrisec-hunters
git pull origin main
docker-compose up -d --build
```

---

## Troubleshooting

### Erro 502 Bad Gateway
- Verifique se o container está rodando: `docker ps`
- Verifique se está na mesma rede: `docker network inspect proxy-network`

### Certificado SSL não funciona
- Verifique se o DNS está propagado: `nslookup cyberstartup.cloud`
- Aguarde alguns minutos para o Let's Encrypt

### Site não carrega rotas
- O nginx.conf já está configurado para SPA routing

---

## Estrutura de Rede

```
Internet
    ↓
cyberstartup.cloud (DNS)
    ↓
Nginx Proxy Manager (:443 SSL)
    ↓
afrisec-hunters container (:80)
```
