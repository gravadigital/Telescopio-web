# Testing del Flujo de Telescopio

## Estado Actual de Implementación

✅ **Completado:**
- Vista de eventos públicos (sin necesidad de login)
- Sistema de autenticación (login/registro)
- Registro de usuarios en eventos
- Subida de archivos (attachments)
- Estados de eventos (stages)
- Vista detallada de eventos

## Cómo Probar el Flujo

### 1. Preparar el Entorno

Asegúrate de tener ambos servidores corriendo:

```bash
# Terminal 1 - API (Go)
cd telescopio-api
go run cmd/api/main.go

# Terminal 2 - Frontend (React)
cd Telescopio-web
npm start
```

### 2. Ver Eventos Sin Autenticación

1. Abre http://localhost:3000
2. Navega a "Events"
3. ✅ **Deberías ver**: Lista de eventos disponibles para todos
4. ✅ **Deberías ver**: Botón "Ver Detalles" para cada evento
5. ✅ **Deberías ver**: Botón "Iniciar sesión para participar" (deshabilitado) para eventos en registro

### 3. Crear Eventos de Prueba

Abre la consola del navegador (F12) y ejecuta:

```javascript
// Los comandos están disponibles globalmente
window.telescopioTest.showTestInstructions();

// Crear eventos de prueba
await window.telescopioTest.createTestEvents();

// Actualizar un evento a fase de registro
await window.telescopioTest.updateEventToRegistration('EVENT_ID');
```

Para obtener IDs de eventos:
```javascript
const events = await fetch('http://localhost:8080/api/events').then(r => r.json());
console.log('Eventos:', events);
```

### 4. Flujo de Usuario Completo

#### Paso 1: Registro/Login
1. Click en "Login" en la navbar
2. Crear una cuenta nueva o usar credenciales existentes
3. ✅ **Verificar**: Usuario aparece en la navbar después del login

#### Paso 2: Unirse a un Evento
1. En la lista de eventos, buscar uno en estado "Registro Abierto"
2. Click en "Participar" (ya no debería estar deshabilitado)
3. ✅ **Verificar**: Mensaje de éxito "Te has registrado exitosamente"

#### Paso 3: Subir Archivo (Attachment)
1. Cambiar el evento a fase de "attachment_upload":
   ```javascript
   await window.telescopioTest.updateEventToAttachmentUpload('EVENT_ID');
   ```
2. Refresh la página
3. Abrir detalles del evento
4. ✅ **Debería aparecer**: Sección "Subir tu Participación"
5. Seleccionar un archivo (JPEG, PNG, PDF, etc.)
6. Click en "Subir Archivo"
7. ✅ **Verificar**: Mensaje "¡Archivo subido exitosamente!"

### 5. Estados de Eventos

Los eventos tienen estos estados en orden:
- `creation` → `registration` → `attachment_upload` → `voting` → `results`

Puedes cambiar estados usando:
```javascript
// Cambiar a registro
await fetch('http://localhost:8080/api/events/EVENT_ID/stage', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stage: 'registration' })
});

// Cambiar a subida de archivos
await fetch('http://localhost:8080/api/events/EVENT_ID/stage', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ stage: 'attachment_upload' })
});
```

### 6. Verificar Datos en la API

```javascript
// Ver todos los eventos
fetch('http://localhost:8080/api/events').then(r => r.json()).then(console.log);

// Ver participantes de un evento
fetch('http://localhost:8080/api/events/EVENT_ID/participants').then(r => r.json()).then(console.log);

// Health check de la API
fetch('http://localhost:8080/ping').then(r => r.json()).then(console.log);
```

## Funcionalidad Implementada

### Frontend
- ✅ AuthContext para manejo de sesiones
- ✅ Vista Events públicos
- ✅ Modal EventDetail con acciones según estado
- ✅ Componente Auth (login/registro)
- ✅ Upload de archivos con validaciones
- ✅ Estados visuales de eventos
- ✅ Responsive design

### Backend (API)
- ✅ CORS configurado
- ✅ Endpoints de eventos (CRUD)
- ✅ Registro de participantes
- ✅ Upload de attachments
- ✅ Manejo de estados de eventos
- ✅ Validaciones de permisos
- ✅ Sistema de stages

## Próximos Pasos Sugeridos

1. **Votación**: Implementar sistema de votación
2. **Resultados**: Vista de resultados con rankings
3. **Persistencia**: Migrar de in-memory a base de datos
4. **Autenticación**: JWT tokens y middleware
5. **Notificaciones**: Sistema de notificaciones de cambios de estado
6. **Admin Panel**: Vista para administradores de eventos

## Comandos Útiles para Testing

```javascript
// Limpiar autenticación (logout forzado)
window.telescopioTest.clearAuth();

// Mostrar instrucciones en consola
window.telescopioTest.showTestInstructions();

// Crear eventos de prueba
await window.telescopioTest.createTestEvents();
```

## Troubleshooting

### Error: "No events found"
- Verifica que la API esté corriendo en puerto 8080
- Crea eventos usando `createTestEvents()`

### Error: "Cannot register"
- Verifica que estés logueado
- Verifica que el evento esté en estado 'registration'

### Error: "Cannot upload file"
- Verifica que estés registrado en el evento
- Verifica que el evento esté en estado 'attachment_upload'
- Verifica que el archivo sea del tipo correcto y menor a 10MB
