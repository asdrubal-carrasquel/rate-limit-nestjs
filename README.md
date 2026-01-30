# Rate Limiting Service API

API de Rate Limiting como Servicio construida con NestJS, diseñada para ser consumida por múltiples APIs externas mediante API Keys.

## 🚀 Características

- **Autenticación con API Keys**: Sistema seguro de autenticación mediante API Keys
- **Gestión de Clientes**: Administración completa de clientes y sus API Keys
- **Rate Limiting Configurable**: Configuración flexible de límites por cliente
- **Almacenamiento en Redis**: Uso de Redis para contadores de rate limiting de alto rendimiento
- **Métricas y Monitoreo**: Sistema de métricas para análisis de uso
- **Documentación Swagger**: API completamente documentada
- **Arquitectura Limpia**: Código organizado siguiendo principios SOLID

## 📋 Requisitos Previos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- Redis >= 6.x
- npm o yarn

## 🛠️ Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd rate-limit-nestjs
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:

El proyecto incluye un archivo `.env` con valores por defecto para desarrollo local. Si necesitas personalizar las configuraciones, puedes editar el archivo `.env`:

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=rate_limit_db
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Nota**: El archivo `.env` está en `.gitignore` y no se sube al repositorio. El archivo `.env.example` contiene un template con todas las variables disponibles.

4. Iniciar PostgreSQL y Redis:
```bash
# PostgreSQL
# Asegúrate de que PostgreSQL esté corriendo

# Redis
redis-server
```

5. Ejecutar la aplicación:
```bash
# Desarrollo
npm run start:dev

# Producción
npm run build
npm run start:prod
```

## 📚 Documentación de la API

Una vez que la aplicación esté corriendo, accede a la documentación Swagger en:
```
http://localhost:3000/api/docs
```

## 🔑 Uso de la API

### 1. Crear un Cliente

```bash
POST /clients
Content-Type: application/json

{
  "name": "Mi API Externa",
  "description": "API de ejemplo",
  "contactEmail": "contact@example.com"
}
```

### 2. Crear una API Key

```bash
POST /clients/{clientId}/api-keys
Content-Type: application/json

{
  "name": "Production API Key",
  "expiresAt": "2024-12-31T23:59:59Z" // Opcional
}
```

**⚠️ IMPORTANTE**: Guarda la API Key retornada, no se mostrará de nuevo.

### 3. Verificar Rate Limit

```bash
POST /rate-limit/check
X-API-Key: rl_tu_api_key_aqui
Content-Type: application/json

{
  "resource": "api/v1/users",  // Opcional
  "userId": "user-123"          // Opcional
}
```

Respuesta:
```json
{
  "allowed": true,
  "remaining": 95,
  "limit": 100,
  "reset": 1703123456,
  "resetIn": 45
}
```

### 4. Obtener Estado del Rate Limit (sin incrementar)

```bash
GET /rate-limit/status
X-API-Key: rl_tu_api_key_aqui
Content-Type: application/json

{
  "resource": "api/v1/users",
  "userId": "user-123"
}
```

### 5. Configurar Rate Limit

```bash
POST /rate-limit/configs
X-API-Key: rl_tu_api_key_aqui
Content-Type: application/json

{
  "name": "API General - 100 req/min",
  "description": "Límite general para toda la API",
  "maxRequests": 100,
  "windowSeconds": 60
}
```

### 6. Ver Métricas

```bash
GET /metrics?timeRange=day
X-API-Key: rl_tu_api_key_aqui
```

## 🏗️ Arquitectura

El proyecto sigue una arquitectura modular y limpia:

```
src/
├── modules/
│   ├── auth/           # Autenticación con API Keys
│   ├── clients/         # Gestión de clientes
│   ├── rate-limit/     # Lógica de rate limiting
│   ├── metrics/        # Métricas y estadísticas
│   └── redis/          # Servicio de Redis
├── config/             # Configuraciones
└── main.ts             # Punto de entrada
```

### Módulos Principales

- **AuthModule**: Maneja la autenticación mediante API Keys usando Passport
- **ClientsModule**: CRUD de clientes y gestión de API Keys
- **RateLimitModule**: Lógica core de rate limiting con Redis
- **MetricsModule**: Registro y consulta de métricas
- **RedisModule**: Servicio global de Redis

## 🔒 Seguridad

- Las API Keys se generan de forma segura usando UUIDs
- Las API Keys expiradas se validan automáticamente
- Las API Keys pueden ser revocadas sin eliminar el cliente
- Validación de entrada con class-validator
- CORS configurable

## 📊 Base de Datos

### Entidades Principales

- **Client**: Información de los clientes
- **ApiKey**: API Keys asociadas a clientes
- **RateLimitConfig**: Configuraciones de rate limit por cliente
- **RateLimitMetric**: Métricas históricas de uso

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 🚢 Despliegue

### Docker (Próximamente)

```bash
docker-compose up -d
```

### Variables de Entorno de Producción

Asegúrate de configurar:
- `NODE_ENV=production`
- `DB_HOST`, `DB_PASSWORD` (valores seguros)
- `REDIS_PASSWORD` (si aplica)
- `CORS_ORIGIN` (dominios permitidos)

## 📝 Scripts Disponibles

- `npm run start:dev` - Inicia en modo desarrollo con hot-reload
- `npm run build` - Compila el proyecto
- `npm run start:prod` - Inicia en modo producción
- `npm run lint` - Ejecuta el linter
- `npm run format` - Formatea el código con Prettier

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

Desarrollado como servicio de Rate Limiting para múltiples APIs externas.

---

Para más información, consulta la documentación Swagger en `/api/docs` cuando la aplicación esté corriendo.
