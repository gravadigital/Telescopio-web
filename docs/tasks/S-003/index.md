# Story S-003: Fecha de Finalización Estimativa - Task Index (Frontend)

## Referencia a Story

- **Story:** [S-003: Fecha de Finalización Estimativa](../../../../docs/stories/S-003.fecha-finalizacion-estimativa.md)
- **Servicio:** Telescopio-web (Frontend - React/TypeScript)
- **Resumen:** Implementar la UI para que los organizadores definan fechas estimativas de cierre al avanzar etapas, y que los participantes vean estas fechas en el detalle del evento.

## Criterios de Aceptación Cubiertos

| CA# | Descripción | Task(s) |
|-----|-------------|---------|
| CA1 | Modal de confirmación en transiciones de etapa | 3, 4 |
| CA2 | Campo de fecha en modal para etapas específicas | 3 |
| CA3 | Validación de fechas (no pasadas) | 3 |
| CA4 | Visualización en detalle del evento | 5 |
| CA5 | Edición de fechas estimativas | 4 |
| CA8 | Visibilidad para todos los roles | 5 |

## Tasks

| # | Task | Status | Descripción |
|---|------|--------|-------------|
| 1 | [Actualizar Tipos y Config](./1.actualizar-tipos-config.md) | Pending | Agregar campos de fecha estimativa a interface `Event` y nuevo endpoint en config |
| 2 | [Actualizar Servicios API](./2.actualizar-servicios-api.md) | Pending | Modificar `updateEventStage` y agregar `updateEstimatedEndDate` en `EventService` |
| 3 | [Crear StageAdvanceModal](./3.crear-stage-advance-modal.md) | Pending | Crear componente modal de confirmación con campo de fecha opcional |
| 4 | [Integrar Modal en ManageEventPage](./4.integrar-modal-manage-page.md) | Pending | Usar el modal al avanzar etapa y agregar botón para editar fechas |
| 5 | [Mostrar Fecha en EventDetailPage](./5.mostrar-fecha-event-detail.md) | Pending | Mostrar fecha estimativa de cierre en la sección de información del evento |

## Grafo de Dependencias

```
┌─────────────────────────────────────┐
│  Task 1: Tipos y Config             │
│  (Interface Event + endpoint)       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Task 2: Servicios API              │
│  (updateEventStage + nuevo método)  │
└──────────────────┬──────────────────┘
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
┌─────────────────┐  ┌─────────────────┐
│  Task 3         │  │  Task 5         │
│  StageAdvance   │  │  EventDetail    │
│  Modal          │  │  (mostrar)      │
└────────┬────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Task 4         │
│  ManageEvent    │
│  (integrar)     │
└─────────────────┘
```

## Orden de Ejecución Sugerido

1. **Task 1** - Actualizar Tipos y Config (bloquea a las demás)
2. **Task 2** - Actualizar Servicios API (requiere Task 1)
3. **Task 3** - Crear StageAdvanceModal (requiere Task 2)
4. **Task 5** - Mostrar Fecha en EventDetailPage (requiere Task 2, puede hacerse en paralelo con Task 3)
5. **Task 4** - Integrar Modal en ManageEventPage (requiere Tasks 2 y 3)

**Nota:** Tasks 3 y 5 pueden ejecutarse en paralelo una vez completada Task 2.

## Progreso

- **Total:** 5 tareas
- **Pending:** 0
- **In Progress:** 0
- **Completed:** 5

## Notas de Implementación

- **Prerequisito Backend:** Las tareas del backend (S-003 en telescopio-api) deben estar completadas antes de probar estas tareas.
- **Default de fechas:** +7 días para participation, +3 días para voting
- **Formato de visualización:** "October 15, 2026 (in 5 days)" con tiempo relativo
- **Validación cliente:** Fecha >= HOY (el backend también valida)
- **Restricción edición:** Solo posponer fechas (validado en backend, mostrar error en frontend)

