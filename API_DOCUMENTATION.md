# Expense Splitter - API Documentation

## Descripción de la Aplicación

**Expense Splitter** es una aplicación web para dividir gastos entre grupos de personas. Permite a los usuarios crear grupos, agregar gastos compartidos, y calcular automáticamente quién debe dinero a quién. La aplicación simplifica las transacciones necesarias para saldar cuentas usando un algoritmo de optimización.

### Características Principales
- Sistema de autenticación basado en username
- Gestión de grupos con múltiples miembros
- Registro de gastos con división flexible (quién pagó, quién participó)
- Cálculo automático de balances individuales
- Algoritmo de simplificación de transacciones para minimizar pagos
- Perfiles de usuario personalizables con avatares (emojis o fotos)
- Registro de liquidaciones entre usuarios

---

## Acciones e Interacciones de la UI

### Autenticación
- ✅ Registro de usuario con username, display name y contraseña
- ✅ Login con username y contraseña
- ✅ Logout
- ✅ Asignación automática de emoji aleatorio como avatar por defecto

### Gestión de Perfil
- ✅ Actualizar display name
- ✅ Cambiar avatar (emoji o foto personalizada en Base64)
- ✅ Visualizar perfil actual

### Gestión de Grupos
- ✅ Crear grupo nuevo (nombre, emoji, lista de miembros por username)
- ✅ Listar grupos del usuario actual
- ✅ Seleccionar grupo activo
- ✅ Editar nombre y emoji del grupo
- ✅ Agregar miembros al grupo (por username)
- ✅ Eliminar miembros del grupo
- ✅ Eliminar grupo completo
- ✅ Ver cantidad de miembros

### Gestión de Gastos
- ✅ Crear gasto (título, monto, quién pagó, quién participó)
- ✅ Listar gastos del grupo actual
- ✅ Eliminar gasto
- ✅ Ver detalles de cada gasto (fecha, monto, participantes)
- ✅ Calcular división automática del gasto

### Cálculos y Liquidaciones
- ✅ Calcular balance individual del usuario en el grupo
- ✅ Calcular transacciones simplificadas para saldar cuentas
- ✅ Registrar liquidación entre dos usuarios
- ✅ Mostrar estado de deuda (owed/owes/settled)

---

## Endpoints Requeridos

### 1. Autenticación

#### `POST /api/auth/signup`
**Descripción:** Registrar nuevo usuario

**Request Body:**
```json
{
  "username": "string (lowercase, unique)",
  "displayName": "string",
  "password": "string",
  "avatarUrl": "string (emoji or Base64 image URL)"
}
```

**Response (201):**
```json
{
  "user": {
    "username": "string",
    "displayName": "string",
    "avatarUrl": "string"
  },
  "token": "string (JWT or session token)"
}
```

**Errors:**
- `400` - Username ya existe
- `400` - Datos inválidos

---

#### `POST /api/auth/login`
**Descripción:** Iniciar sesión

**Request Body:**
```json
{
  "username": "string (lowercase)",
  "password": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "username": "string",
    "displayName": "string",
    "avatarUrl": "string"
  },
  "token": "string"
}
```

**Errors:**
- `401` - Credenciales inválidas

---

#### `POST /api/auth/logout`
**Descripción:** Cerrar sesión

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

---

#### `GET /api/auth/me`
**Descripción:** Obtener usuario actual

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string"
}
```

**Errors:**
- `401` - No autenticado

---

### 2. Gestión de Usuarios

#### `GET /api/users/:username`
**Descripción:** Obtener información pública de un usuario (para agregar a grupos)

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string"
}
```

**Errors:**
- `404` - Usuario no encontrado

---

#### `PATCH /api/users/me`
**Descripción:** Actualizar perfil del usuario actual

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "displayName": "string (optional)",
  "avatarUrl": "string (optional, emoji or Base64)"
}
```

**Response (200):**
```json
{
  "username": "string",
  "displayName": "string",
  "avatarUrl": "string"
}
```

---

### 3. Gestión de Grupos

#### `GET /api/groups`
**Descripción:** Listar grupos del usuario actual

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": "string",
    "name": "string",
    "emoji": "string",
    "members": ["username1", "username2"],
    "expenses": [
      {
        "id": "string",
        "title": "string",
        "amount": "number",
        "paidBy": ["username1"],
        "participants": ["username1", "username2"],
        "date": "ISO 8601 string"
      }
    ]
  }
]
```

---

#### `POST /api/groups`
**Descripción:** Crear nuevo grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string",
  "emoji": "string",
  "members": ["username1", "username2"]
}
```

**Response (201):**
```json
{
  "id": "string",
  "name": "string",
  "emoji": "string",
  "members": ["currentUser", "username1", "username2"],
  "expenses": []
}
```

**Errors:**
- `400` - Datos inválidos
- `404` - Algún username no existe

---

#### `GET /api/groups/:groupId`
**Descripción:** Obtener detalles de un grupo específico

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "emoji": "string",
  "members": ["username1", "username2"],
  "expenses": [...]
}
```

**Errors:**
- `403` - Usuario no es miembro del grupo
- `404` - Grupo no encontrado

---

#### `PATCH /api/groups/:groupId`
**Descripción:** Actualizar información del grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "name": "string (optional)",
  "emoji": "string (optional)"
}
```

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "emoji": "string",
  "members": ["username1", "username2"],
  "expenses": [...]
}
```

**Errors:**
- `403` - Usuario no es miembro del grupo

---

#### `DELETE /api/groups/:groupId`
**Descripción:** Eliminar grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Response (204):**
```
No content
```

**Errors:**
- `403` - Usuario no es miembro del grupo

---

#### `POST /api/groups/:groupId/members`
**Descripción:** Agregar miembro al grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "username": "string (lowercase)"
}
```

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "emoji": "string",
  "members": ["username1", "username2", "newUsername"],
  "expenses": [...]
}
```

**Errors:**
- `403` - Usuario no es miembro del grupo
- `404` - Username no existe
- `400` - Usuario ya es miembro

---

#### `DELETE /api/groups/:groupId/members/:username`
**Descripción:** Eliminar miembro del grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "string",
  "name": "string",
  "emoji": "string",
  "members": ["username1"],
  "expenses": [...]
}
```

**Errors:**
- `403` - Usuario no es miembro del grupo
- `400` - No se puede eliminar el último miembro

---

### 4. Gestión de Gastos

#### `POST /api/groups/:groupId/expenses`
**Descripción:** Crear nuevo gasto en el grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "title": "string",
  "amount": "number",
  "paidBy": ["username1", "username2"],
  "participants": ["username1", "username2", "username3"]
}
```

**Response (201):**
```json
{
  "id": "string",
  "title": "string",
  "amount": "number",
  "paidBy": ["username1", "username2"],
  "participants": ["username1", "username2", "username3"],
  "date": "ISO 8601 string"
}
```

**Errors:**
- `403` - Usuario no es miembro del grupo
- `400` - Datos inválidos (paidBy o participants vacíos, usernames no son miembros)

---

#### `DELETE /api/groups/:groupId/expenses/:expenseId`
**Descripción:** Eliminar gasto

**Headers:**
```
Authorization: Bearer {token}
```

**Response (204):**
```
No content
```

**Errors:**
- `403` - Usuario no es miembro del grupo
- `404` - Gasto no encontrado

---

### 5. Cálculos y Liquidaciones

#### `GET /api/groups/:groupId/balance`
**Descripción:** Obtener balance del usuario actual en el grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "username": "currentUser",
  "balance": "number (positive = owed, negative = owes)",
  "status": "owed | owes | settled"
}
```

---

#### `GET /api/groups/:groupId/settlements`
**Descripción:** Obtener transacciones simplificadas para saldar cuentas del grupo

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "settlements": [
    {
      "from": "username1",
      "to": "username2",
      "amount": "number"
    }
  ]
}
```

**Notas:**
- El backend debe implementar el algoritmo de simplificación de transacciones
- Calcula balances netos de todos los miembros
- Retorna el mínimo número de transacciones necesarias

---

#### `POST /api/groups/:groupId/settle`
**Descripción:** Registrar liquidación entre usuarios (crea un gasto especial)

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "from": "username1",
  "to": "username2",
  "amount": "number"
}
```

**Response (201):**
```json
{
  "id": "string",
  "title": "Settlement: username1 → username2",
  "amount": "number",
  "paidBy": ["username1"],
  "participants": ["username2"],
  "date": "ISO 8601 string"
}
```

**Notas:**
- Internamente crea un gasto donde `from` paga y `to` es el único participante
- Esto balancea las cuentas entre ambos usuarios

---

## Notas de Implementación

### Autenticación
- Todos los endpoints (excepto `/auth/signup` y `/auth/login`) requieren autenticación
- Usar JWT o sesiones para manejar autenticación
- Los usernames deben ser únicos y almacenarse en lowercase

### Validaciones
- Validar que los usernames en `paidBy` y `participants` sean miembros del grupo
- Validar que `paidBy` y `participants` no estén vacíos
- Validar que `amount` sea un número positivo
- Validar que el usuario autenticado sea miembro del grupo para operaciones de grupo

### Cálculo de Balances
El algoritmo de balance debe:
1. Para cada gasto, calcular cuánto pagó cada persona y cuánto debe cada participante
2. Sumar todos los pagos y restas para obtener el balance neto de cada miembro
3. Positivo = le deben dinero, Negativo = debe dinero

### Algoritmo de Simplificación
1. Separar usuarios en deudores (balance negativo) y acreedores (balance positivo)
2. Ordenar ambos grupos por monto (mayor a menor)
3. Emparejar deudores con acreedores, creando transacciones por el mínimo entre ambos
4. Continuar hasta que todos los balances sean cero

### Almacenamiento de Avatares
- Si se usa Base64, considerar límite de tamaño (ej: 5MB)
- Alternativamente, implementar upload a S3/Cloud Storage y retornar URL
- Los emojis se almacenan como strings Unicode

---

## Ejemplo de Flujo Completo

1. **Usuario se registra:** `POST /api/auth/signup`
2. **Usuario crea grupo:** `POST /api/groups`
3. **Usuario agrega miembros:** `POST /api/groups/:id/members`
4. **Usuario crea gasto:** `POST /api/groups/:id/expenses`
5. **Usuario consulta balance:** `GET /api/groups/:id/balance`
6. **Usuario consulta liquidaciones:** `GET /api/groups/:id/settlements`
7. **Usuario registra pago:** `POST /api/groups/:id/settle`
8. **Usuario actualiza perfil:** `PATCH /api/users/me`
