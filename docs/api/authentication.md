# API de autenticación

La API de autenticación de Learn2Code permite registrar usuarios, iniciar y renovar sesiones, cerrar sesión y consultar al usuario autenticado.

## URL base

```text
http://localhost:3000/api/v1/auth
```

## Manejo de la sesión

Learn2Code utiliza dos tipos de token:

- Access token JWT con duración predeterminada de 15 minutos.
- Refresh token opaco con duración predeterminada de 30 días.

El access token se devuelve en el cuerpo de la respuesta. El refresh token se guarda en una cookie con las siguientes propiedades:

- `HttpOnly`
- `SameSite=Lax`
- `Secure` en producción
- Ruta `/api/v1/auth`

La cookie se llama:

```text
learn2code_refresh_token
```

## Registrar un usuario

```http
POST /api/v1/auth/register
Content-Type: application/json
```

Cuerpo:

```json
{
  "fullName": "Estudiante Ejemplo",
  "email": "estudiante@example.com",
  "password": "Contraseña-Segura-2026!"
}
```

Respuesta exitosa: `201 Created`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "UUID",
      "fullName": "Estudiante Ejemplo",
      "email": "estudiante@example.com",
      "roles": ["student"],
      "emailVerified": false
    },
    "accessToken": "JWT"
  }
}
```

El usuario recibe automáticamente el rol `student`.

Posibles errores:

- `400 VALIDATION_ERROR`
- `409 EMAIL_ALREADY_REGISTERED`

## Iniciar sesión

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Cuerpo:

```json
{
  "email": "estudiante@example.com",
  "password": "Contraseña-Segura-2026!"
}
```

Respuesta exitosa: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "UUID",
      "fullName": "Estudiante Ejemplo",
      "email": "estudiante@example.com",
      "roles": ["student"],
      "emailVerified": false
    },
    "accessToken": "JWT"
  }
}
```

Las credenciales incorrectas siempre producen el mismo error para evitar revelar si un correo está registrado:

```text
401 INVALID_CREDENTIALS
```

## Renovar la sesión

```http
POST /api/v1/auth/refresh
```

No requiere cuerpo. El refresh token se obtiene de la cookie HttpOnly.

Respuesta exitosa: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "UUID",
      "fullName": "Estudiante Ejemplo",
      "email": "estudiante@example.com",
      "roles": ["student"],
      "emailVerified": false
    },
    "accessToken": "NUEVO_JWT"
  }
}
```

En cada renovación:

1. El refresh token anterior se revoca.
2. Se genera un refresh token nuevo.
3. La cookie se reemplaza.
4. Se genera un access token nuevo.

Posibles errores:

- `401 INVALID_REFRESH_TOKEN`
- `401 EXPIRED_REFRESH_TOKEN`
- `401 REFRESH_TOKEN_REUSE_DETECTED`

Si se detecta reutilización, se revocan las sesiones activas del usuario.

## Cerrar sesión

```http
POST /api/v1/auth/logout
```

El endpoint revoca el refresh token actual y elimina la cookie.

Respuesta exitosa:

```text
204 No Content
```

La operación es idempotente: también devuelve `204` si la cookie no existe o el token ya estaba revocado.

## Consultar al usuario autenticado

```http
GET /api/v1/auth/me
Authorization: Bearer ACCESS_TOKEN
```

Respuesta exitosa: `200 OK`

```json
{
  "status": "success",
  "data": {
    "user": {
      "id": "UUID",
      "fullName": "Estudiante Ejemplo",
      "email": "estudiante@example.com",
      "avatarUrl": null,
      "preferredLocale": "es-MX",
      "preferredProgrammingLanguageId": null,
      "roles": ["student"],
      "emailVerified": false,
      "lastLoginAt": null
    }
  }
}
```

Posibles errores:

- `401 AUTHENTICATION_REQUIRED`

El error se devuelve cuando el token falta, está mal formado, fue modificado, expiró o el usuario ya no está activo.

## Autorización por roles

Las rutas privadas pueden requerir uno o más roles.

Roles iniciales:

- `student`
- `admin`

Una cuenta autenticada sin el rol necesario recibe:

```text
403 INSUFFICIENT_PERMISSIONS
```

## Formato de error

Los errores de la API utilizan una estructura similar a:

```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Descripción del error"
}
```

## Recomendaciones para el frontend

- Mantener el access token únicamente en memoria.
- No guardar el access token en `localStorage`.
- Enviar peticiones de sesión con credenciales habilitadas.
- Usar `/refresh` para recuperar la sesión después de recargar la página.
- Redirigir al login cuando la renovación falle.