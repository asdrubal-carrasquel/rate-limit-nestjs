# Ejemplos de Uso de la API

Este documento contiene ejemplos prácticos de cómo usar la API de Rate Limiting.

## Configuración Inicial

### 1. Crear un Cliente

```bash
curl -X POST http://localhost:3000/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Mi API Externa",
    "description": "API de ejemplo para integración",
    "contactEmail": "contact@example.com"
  }'
```

Respuesta:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Mi API Externa",
  "description": "API de ejemplo para integración",
  "contactEmail": "contact@example.com",
  "isActive": true,
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

### 2. Crear una API Key

```bash
curl -X POST http://localhost:3000/clients/{clientId}/api-keys \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "expiresAt": "2024-12-31T23:59:59Z"
  }'
```

Respuesta:
```json
{
  "apiKey": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Production API Key",
    "isActive": true,
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "clientId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2024-01-15T10:05:00.000Z"
  },
  "key": "rl_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
}
```

**⚠️ IMPORTANTE**: Guarda el valor de `key`, no se mostrará de nuevo.

## Uso del Rate Limiting

### 3. Configurar Rate Limit

```bash
curl -X POST http://localhost:3000/rate-limit/configs \
  -H "X-API-Key: rl_tu_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API General - 100 req/min",
    "description": "Límite general para toda la API",
    "maxRequests": 100,
    "windowSeconds": 60
  }'
```

### 4. Verificar Rate Limit (Incrementa el contador)

Este es el endpoint principal que debes llamar en cada request que quieras limitar:

```bash
curl -X POST http://localhost:3000/rate-limit/check \
  -H "X-API-Key: rl_tu_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "api/v1/users",
    "userId": "user-123"
  }'
```

Respuesta cuando está permitido:
```json
{
  "allowed": true,
  "remaining": 99,
  "limit": 100,
  "reset": 1703123456,
  "resetIn": 58
}
```

Respuesta cuando se excede el límite:
```json
{
  "allowed": false,
  "remaining": 0,
  "limit": 100,
  "reset": 1703123456,
  "resetIn": 45
}
```

### 5. Verificar Estado (Sin incrementar)

Útil para verificar antes de procesar una request costosa:

```bash
curl -X GET http://localhost:3000/rate-limit/status \
  -H "X-API-Key: rl_tu_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "api/v1/users",
    "userId": "user-123"
  }'
```

### 6. Resetear Rate Limit

```bash
curl -X POST http://localhost:3000/rate-limit/reset \
  -H "X-API-Key: rl_tu_api_key_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "resource": "api/v1/users",
    "userId": "user-123"
  }'
```

## Consultar Métricas

### 7. Obtener Métricas

```bash
curl -X GET "http://localhost:3000/metrics?timeRange=day" \
  -H "X-API-Key: rl_tu_api_key_aqui"
```

Respuesta:
```json
{
  "totalRequests": 1500,
  "limitedRequests": 23,
  "averageRequests": 62.5,
  "peakRequests": 105,
  "metrics": [
    {
      "id": "...",
      "clientId": "...",
      "resource": "api/v1/users",
      "requestCount": 105,
      "limit": 100,
      "wasLimited": true,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

### 8. Top Recursos

```bash
curl -X GET "http://localhost:3000/metrics/top-resources?limit=10" \
  -H "X-API-Key: rl_tu_api_key_aqui"
```

## Integración en tu API

### Ejemplo con Node.js/Express

```javascript
const axios = require('axios');

async function checkRateLimit(apiKey, resource, userId) {
  try {
    const response = await axios.post(
      'http://localhost:3000/rate-limit/check',
      { resource, userId },
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.allowed) {
      throw new Error('Rate limit exceeded');
    }

    return response.data;
  } catch (error) {
    if (error.response?.status === 429 || error.message === 'Rate limit exceeded') {
      throw new Error('Rate limit exceeded');
    }
    throw error;
  }
}

// Uso en tu endpoint
app.post('/api/users', async (req, res) => {
  try {
    // Verificar rate limit
    const rateLimitStatus = await checkRateLimit(
      process.env.RATE_LIMIT_API_KEY,
      'api/users',
      req.user?.id
    );

    // Si llegamos aquí, está permitido
    // Procesar la request...
    
    res.json({ 
      success: true,
      rateLimit: {
        remaining: rateLimitStatus.remaining,
        resetIn: rateLimitStatus.resetIn
      }
    });
  } catch (error) {
    if (error.message === 'Rate limit exceeded') {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests, please try again later'
      });
    }
    throw error;
  }
});
```

### Ejemplo con Python

```python
import requests

def check_rate_limit(api_key, resource=None, user_id=None):
    response = requests.post(
        'http://localhost:3000/rate-limit/check',
        json={'resource': resource, 'userId': user_id},
        headers={'X-API-Key': api_key}
    )
    
    if response.status_code == 200:
        data = response.json()
        if not data['allowed']:
            raise Exception('Rate limit exceeded')
        return data
    else:
        response.raise_for_status()

# Uso
try:
    status = check_rate_limit(
        api_key='rl_tu_api_key',
        resource='api/users',
        user_id='user-123'
    )
    print(f"Requests remaining: {status['remaining']}")
except Exception as e:
    print(f"Error: {e}")
```

## Casos de Uso

### Rate Limit por Usuario

Si quieres limitar por usuario final, pasa el `userId`:

```json
{
  "resource": "api/v1/payments",
  "userId": "user-12345"
}
```

Cada usuario tendrá su propio contador.

### Rate Limit por Recurso

Si quieres diferentes límites por endpoint:

```json
{
  "resource": "api/v1/heavy-operation",
  "userId": "user-12345"
}
```

Puedes crear diferentes configuraciones de rate limit para diferentes recursos.

### Rate Limit Global

Si no pasas `resource` ni `userId`, se aplica un límite global para el cliente:

```json
{}
```

## Mejores Prácticas

1. **Siempre verifica el rate limit antes de procesar requests costosas**
2. **Usa el endpoint `/status` para verificar sin incrementar cuando sea necesario**
3. **Maneja el error 429 apropiadamente en tu cliente**
4. **Considera usar diferentes recursos para diferentes endpoints**
5. **Monitorea las métricas regularmente para ajustar los límites**
