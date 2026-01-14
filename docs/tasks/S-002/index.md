# Story S-002: Endpoint para Obtener Eventos del Usuario - Task Index (Frontend)

## Referencia a Story

- **Story:** [S-002: Endpoint para Obtener Eventos del Usuario](../../../docs/stories/S-002.endpoint-eventos-usuario.md)
- **Servicio:** Telescopio-web (Frontend - React/TypeScript)
- **Resumen:** Consumir el nuevo endpoint del backend para sincronizar correctamente los eventos donde el usuario participa.

## Criterios de Aceptación Cubiertos

| CA# | Descripción | Task(s) |
|-----|-------------|---------|
| CA5 | Frontend sincronizado al iniciar sesión | 1, 2 |
| CA6 | Botones correctos en listado | 1, 2 |
| CA8 | Backward compatibility | 1, 2 |

## Tasks

| # | Task | Status | Descripción |
|---|------|--------|-------------|
| 1 | [Crear Service para User Events](./1.crear-service-user-events.md) | Pending | Agregar endpoint y método en el servicio API para consumir `GET /users/{id}/events` |
| 2 | [Sincronizar en AuthContext](./2.sincronizar-auth-context.md) | Pending | Implementar `syncUserEvents()` y llamarlo al login y al cargar la app |
| 3 | [Limpiar Auto-corrección Temporal](./3.limpiar-auto-correccion.md) | Pending | Eliminar lógica temporal de auto-corrección del localStorage en componentes |

## Grafo de Dependencias

```
┌─────────────────────────────────────┐
│  Task 1: Service User Events        │
│  (API call method)                  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Task 2: Sincronizar AuthContext    │
│  (Login + App Load)                 │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Task 3: Limpiar Código Temporal    │
│  (Remove auto-fix)                  │
└─────────────────────────────────────┘
```

## Orden de Ejecución Sugerido

1. **Task 1** - Crear Service (necesario para Task 2)
2. **Task 2** - Sincronizar en Context (usa Task 1, bloquea Task 3)
3. **Task 3** - Limpiar código temporal (después de verificar que Task 2 funciona)

## Progreso

- **Total:** 3 tareas
- **Pending:** 3
- **In Progress:** 0
- **Completed:** 0

## Notas de Implementación

- **Prerequisito:** El backend debe tener el endpoint funcionando antes de implementar el frontend
- **Testing:** Probar en múltiples escenarios (login, recarga, múltiples dispositivos)
- **Fallback:** Si falla la sincronización, usar localStorage como fallback temporal
- **Timing:** Llamar a `syncUserEvents()` después del login y al montar AuthContext

