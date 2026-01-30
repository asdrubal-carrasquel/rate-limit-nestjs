# Arquitectura del Sistema

## Visión General

Este servicio de Rate Limiting está diseñado siguiendo principios de arquitectura limpia y está pensado para ser consumido por múltiples APIs externas mediante API Keys.

## Arquitectura de Módulos

### 1. Módulo de Clientes (`ClientsModule`)

**Responsabilidad**: Gestión de clientes y API Keys

**Componentes**:
- `Client`: Entidad que representa un cliente
- `ApiKey`: Entidad que representa una API Key asociada a un cliente
- `ClientsService`: Lógica de negocio para CRUD de clientes y API Keys
- `ClientsController`: Endpoints REST para gestión de clientes

**Características**:
- Generación segura de API Keys usando UUIDs
- Validación de expiración de API Keys
- Revocación y activación de API Keys
- Relación uno-a-muchos con RateLimitConfig

### 2. Módulo de Autenticación (`AuthModule`)

**Responsabilidad**: Autenticación mediante API Keys

**Componentes**:
- `ApiKeyStrategy`: Estrategia de Passport para validar API Keys
- `ApiKeyGuard`: Guard que protege rutas con autenticación
- `@CurrentClient()`: Decorador para obtener el cliente actual
- `@Public()`: Decorador para marcar rutas públicas

**Flujo de Autenticación**:
1. Cliente envía request con header `X-API-Key`
2. `ApiKeyGuard` intercepta la request
3. `ApiKeyStrategy` valida la API Key contra la base de datos
4. Si es válida, se inyecta el cliente en `request.user`
5. Si no es válida, se retorna 401 Unauthorized

### 3. Módulo de Rate Limiting (`RateLimitModule`)

**Responsabilidad**: Lógica core de rate limiting

**Componentes**:
- `RateLimitConfig`: Configuración de límites por cliente
- `RateLimitService`: Servicio que implementa la lógica de rate limiting
- `RateLimitController`: Endpoints para verificar y gestionar rate limits

**Algoritmo de Rate Limiting**:
1. Se obtiene la configuración de rate limit del cliente (o default)
2. Se construye una clave Redis única basada en:
   - `clientId`
   - `configId`
   - `resource` (opcional)
   - `userId` (opcional)
3. Se incrementa el contador en Redis
4. Se verifica si excede el límite
5. Se retorna el estado (allowed, remaining, reset, etc.)
6. Se registra la métrica

**Estrategia de Almacenamiento**:
- Redis para contadores de alta performance
- PostgreSQL para configuraciones y métricas históricas
- TTL automático en Redis basado en `windowSeconds`

### 4. Módulo de Métricas (`MetricsModule`)

**Responsabilidad**: Registro y consulta de métricas

**Componentes**:
- `RateLimitMetric`: Entidad para métricas históricas
- `MetricsService`: Servicio para registrar y consultar métricas
- `MetricsController`: Endpoints para consultar métricas

**Métricas Registradas**:
- Total de requests
- Requests limitadas
- Promedio de requests
- Peak de requests
- Top recursos más utilizados

### 5. Módulo de Redis (`RedisModule`)

**Responsabilidad**: Gestión de conexión y operaciones Redis

**Componentes**:
- `RedisService`: Servicio wrapper para operaciones Redis
- `REDIS_CLIENT`: Provider de conexión Redis

**Operaciones Principales**:
- `increment`: Incrementar contador
- `get`: Obtener valor
- `expire`: Establecer TTL
- `ttl`: Obtener tiempo restante
- `delete`: Eliminar clave

## Flujo de una Request de Rate Limiting

```
1. Cliente externo → POST /rate-limit/check
   Headers: X-API-Key: rl_xxx
   Body: { resource: "api/users", userId: "user-123" }

2. ApiKeyGuard intercepta
   ↓
3. ApiKeyStrategy valida API Key
   ↓
4. RateLimitController.checkRateLimit()
   ↓
5. RateLimitService.checkRateLimit()
   ├─ Obtiene configuración del cliente
   ├─ Construye clave Redis
   ├─ Incrementa contador en Redis
   ├─ Verifica límite
   ├─ Registra métrica
   └─ Retorna respuesta
```

## Estructura de Datos

### Redis Keys

Formato: `rate_limit:{clientId}:{configId}:{resource}:{userId}`

Ejemplo: `rate_limit:550e8400-...:660e8400-...:api/users:user-123`

### Base de Datos

**Tabla: clients**
- Información de clientes
- Relación con api_keys y rate_limit_configs

**Tabla: api_keys**
- API Keys asociadas a clientes
- Validación de expiración y estado activo

**Tabla: rate_limit_configs**
- Configuraciones de límites
- maxRequests, windowSeconds

**Tabla: rate_limit_metrics**
- Métricas históricas
- Índices para consultas eficientes

## Escalabilidad

### Horizontal Scaling

- **Stateless**: La aplicación no mantiene estado en memoria
- **Redis compartido**: Todos los nodos comparten el mismo Redis
- **PostgreSQL**: Base de datos compartida para configuraciones

### Optimizaciones

- **Redis para contadores**: Alta performance para operaciones de rate limiting
- **Índices en PostgreSQL**: Para consultas rápidas de métricas
- **TTL automático**: Redis limpia automáticamente las claves expiradas
- **Métricas asíncronas**: El registro de métricas no bloquea la respuesta

## Seguridad

1. **API Keys**: Generación segura con UUIDs, validación de expiración
2. **Validación de entrada**: class-validator en todos los DTOs
3. **CORS configurable**: Control de orígenes permitidos
4. **Rate limiting por cliente**: Aislamiento entre clientes
5. **Rate limiting por recurso/usuario**: Granularidad configurable

## Extensibilidad

### Agregar Nuevos Tipos de Rate Limiting

1. Crear nueva entidad de configuración
2. Extender `RateLimitService` con nueva lógica
3. Agregar endpoints en `RateLimitController`

### Agregar Nuevas Métricas

1. Extender `RateLimitMetric` con nuevos campos
2. Actualizar `MetricsService` para registrar nuevas métricas
3. Agregar endpoints de consulta en `MetricsController`

## Patrones de Diseño Utilizados

- **Repository Pattern**: TypeORM repositories
- **Strategy Pattern**: Passport strategies
- **Guard Pattern**: NestJS guards para autenticación
- **Dependency Injection**: NestJS DI container
- **DTO Pattern**: Data Transfer Objects para validación
- **Module Pattern**: Separación por responsabilidades

## Consideraciones de Producción

1. **Monitoreo**: Implementar logging y métricas de aplicación
2. **Health Checks**: Endpoints de health para load balancers
3. **Rate Limiting del servicio**: Proteger el propio servicio
4. **Backup de Redis**: Considerar persistencia de Redis
5. **Migraciones**: Usar migraciones de TypeORM para cambios de esquema
6. **Caché**: Considerar caché de configuraciones frecuentes
7. **Queue para métricas**: Para alta carga, usar queue para registro asíncrono
