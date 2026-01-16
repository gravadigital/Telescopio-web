# Story S-001: Simplificación del Flujo de Participación - Task Index (Frontend)

## Referencia a Story

- **Story:** [S-001: Simplificación del Flujo de Participación](../../../docs/stories/S-001.simplificacion-flujo-participacion.md)
- **Servicio:** Telescopio-web (Frontend - React/TypeScript)
- **Resumen:** Actualizar la interfaz de usuario para reflejar la nueva etapa unificada `participation`, permitiendo que los usuarios vean las opciones de registro y subida de archivos en una sola vista sin necesidad de que el organizador avance manualmente entre etapas.

## Criterios de Aceptación Cubiertos

| CA# | Descripción | Task(s) |
|-----|-------------|---------|
| CA1 | Actualizar tipo `EventStage` en TypeScript | 1 |
| CA2 | Mostrar opción de registro en etapa `participation` | 2, 3 |
| CA3 | Mostrar opción de subida de archivos en etapa `participation` | 2 |
| CA4 | UI que permite subida opcional (no obligatoria al registrarse) | 2 |
| CA7 | UI actualizada con interfaz unificada | 2, 3 |

## Tasks

| # | Task | Status | Descripción |
|---|------|--------|-------------|
| 1 | [Actualizar Tipos TypeScript](./1.actualizar-tipos-typescript.md) | Completed | Actualizar interface `Event` en `src/types/index.ts` para usar `'participation'` en lugar de `'registration'` y `'attachment_upload'` |
| 2 | [Unificar UI en EventDetailPage](./2.unificar-ui-eventdetailpage.md) | Completed | Modificar `EventDetailPage.tsx` para mostrar registro y subida de archivos en una sola vista unificada durante la etapa `participation` |
| 3 | [Actualizar Componentes de Listado](./3.actualizar-componentes-listado.md) | Completed | Actualizar `Events.tsx`, `ManageEventPage.tsx` y otros componentes para reflejar las nuevas etapas y transiciones |

## Grafo de Dependencias

```
┌─────────────────────────────────────┐
│  Task 1: Tipos TypeScript           │
│  (Actualizar interface Event)       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Task 2: EventDetailPage            │
│  (Unificar UI registro + upload)    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  Task 3: Otros Componentes          │
│  (Events, ManageEvent, etc.)        │
└─────────────────────────────────────┘
```

## Orden de Ejecución Sugerido

1. **Task 1** - Actualizar Tipos TypeScript (bloquea a las demás, rápida)
2. **Task 2** - Unificar UI en EventDetailPage (tarea principal, requiere Task 1)
3. **Task 3** - Actualizar Componentes de Listado (requiere Tasks 1 y 2)

**Nota:** Las tareas deben ejecutarse secuencialmente. Task 3 podría potencialmente empezarse en paralelo con Task 2, pero se recomienda hacerla después para evitar conflictos.

## Progreso

- **Total:** 3 tareas
- **Pending:** 0
- **In Progress:** 0
- **Completed:** 3

## Notas de Implementación

- **Prerequisito:** Las tareas del backend deben estar completadas o al menos la migración de base de datos debe estar ejecutada para que la API devuelva la nueva etapa `participation`.
- **Testing:** Se recomienda probar contra el backend actualizado para verificar el flujo completo end-to-end.
- **Despliegue coordinado:** El frontend debe desplegarse después del backend para evitar inconsistencias.

