# Telescopio Web - Flujo de Participación en Eventos

## Funcionalidades Implementadas

### ✅ 1. Sistema de Autenticación
- **Login/Registro**: Modal de autenticación con validación básica
- **Persistencia**: Los datos del usuario se guardan en localStorage
- **Estado global**: Context API para manejar el estado de autenticación

### ✅ 2. Vista de Eventos
- **Lista de eventos**: Muestra todos los eventos disponibles
- **Estados visuales**: Badges de colores según la etapa del evento
- **Información detallada**: ID, descripción, fecha, ubicación

### ✅ 3. Participación en Eventos
- **Modal de detalles**: Vista completa del evento con acciones disponibles
- **Registro**: Los usuarios autenticados pueden unirse a eventos en etapa "registration"
- **Validaciones**: Solo se permite registrar si el evento está en la etapa correcta

### ✅ 4. Subida de Attachments
- **Upload de archivos**: Solo para usuarios registrados en eventos en etapa "attachment_upload"
- **Validaciones**:
  - Tamaño máximo: 10MB
  - Tipos permitidos: JPEG, PNG, GIF, PDF, TXT, DOC, DOCX
- **Preview**: Muestra información del archivo seleccionado antes de subir

## Flujo de Usuario

### 1. **Autenticación**
```
1. Hacer clic en "Login" o "Register" en la navbar
2. Completar el formulario (email requerido, nombre para registro)
3. El usuario queda logueado automáticamente
```

### 2. **Unirse a un Evento**
```
1. Ir a la sección "Events"
2. Hacer clic en "Ver Detalles" en cualquier evento
3. Si el evento está en etapa "Registro Abierto":
   - Hacer clic en "Registrarse"
   - Confirmar el registro
```

### 3. **Subir Attachment**
```
1. Una vez registrado, esperar a que el evento pase a etapa "Subida de Archivos"
2. En el modal de detalles del evento:
   - Seleccionar archivo usando el input
   - Verificar que cumple los requisitos
   - Hacer clic en "Subir Archivo"
```

## Estados de Eventos

| Etapa | Descripción | Acciones Disponibles |
|-------|-------------|---------------------|
| 🔨 **Creación** | Evento en construcción | Ninguna |
| 📝 **Registro Abierto** | Acepta nuevos participantes | Registrarse |
| 📎 **Subida de Archivos** | Participantes pueden subir contenido | Subir archivo |
| 🗳️ **Votación** | Fase de votación activa | Votar (próximamente) |
| 🏆 **Resultados** | Resultados disponibles | Ver resultados (próximamente) |

## Tecnologías Utilizadas

### Frontend
- **React 18** con Hooks
- **Context API** para estado global
- **CSS vanilla** con diseño responsive
- **Fetch API** para comunicación con backend

### Patrones Implementados
- **Compound Components**: Modal + Context
- **Custom Hooks**: useAuth
- **Controlled Components**: Formularios
- **Conditional Rendering**: Estados de UI

## Estructura de Archivos

```
src/
├── components/
│   ├── Auth.js & Auth.css          # Modal de autenticación
│   ├── Events.js & Events.css      # Lista de eventos
│   └── EventDetail.js & EventDetail.css  # Detalles y acciones de evento
├── context/
│   └── AuthContext.js              # Context de autenticación
├── config/
│   └── api.js                      # Configuración de endpoints
└── App.js & App.css                # Componente principal
```

## Para Probar

### 1. Configurar Backend
Asegúrate de que la API de Go esté corriendo en `http://localhost:8080`

### 2. Variables de Entorno
Crea un archivo `.env` basado en `.env.example`:
```bash
REACT_APP_API_URL=http://localhost:8080
```

### 3. Ejecutar Frontend
```bash
npm start
```

### 4. Flujo de Prueba Completo
1. **Login**: Registrarse con email y nombre
2. **Evento**: Crear un evento en la API o usar uno existente
3. **Registro**: Unirse al evento desde la interfaz
4. **Actualizar etapa**: Cambiar el evento a "attachment_upload" desde la API
5. **Upload**: Subir un archivo desde la interfaz

## Próximas Funcionalidades
- [ ] Sistema de votación
- [ ] Vista de resultados
- [ ] Gestión de perfiles de usuario
- [ ] Dashboard de eventos creados
- [ ] Notificaciones en tiempo real
