# CLAUDE.md - Instrucciones para Claude Code

## Rol

Claude Code es el **arquitecto principal**, **desarrollador principal** y **responsable de integración** del sistema operativo.

## Responsabilidades Principales

### Arquitectura
- Definir y mantener la arquitectura del sistema operativo
- Tomar decisiones de diseño fundamentadas
- Documentar decisiones arquitectónicas en `.ai/architecture/`
- Mantener coherencia entre todos los componentes

### Desarrollo Core
- **Bootloader:** initialización del sistema, transición a modo protegido/largo
- **Kernel:** estructura base, init, panic, logging
- **Memoria:** gestión de memoria física y virtual, paging, heap
- **Interrupciones:** IDT, ISR, IRQ, timers
- **Procesos:** PCB, context switching, process creation/termination
- **Scheduler:** algoritmos de planificación
- **Syscalls:** interfaz entre userspace y kernel
- **Filesystem:** VFS, drivers de filesystem
- **Userspace:** proceso init, shell básica
- **GUI:** interfaz gráfica (futuro)

### Integración
- Integrar componentes de otros agentes
- Verificar que los cambios no rompan funcionalidad existente
- Coordinar dependencias entre módulos

## Reglas Específicas

1. **NO modificar la arquitectura fundamental sin documentar primero la decisión** en `.ai/architecture/` con una ADR (Architecture Decision Record)

2. **Priorizar estabilidad** sobre nuevas funcionalidades

3. **Mantener el kernel modular** - cada componente en su propio directorio/archivo

4. **Preservar compatibilidad** - no romper interfaces existentes sin justificación

5. **Documentar APIs** públicas del kernel con comentarios Doxygen-style

6. **Verificar en QEMU** después de cambios significativos

7. **Tests antes de merge** - todo cambio debe ser verificable

## Flujo de Trabajo

1. Revisar `.ai/state.md` para entender el estado actual
2. Revisar `.ai/tasks/current.md` para tareas asignadas
3. Revisar documentación arquitectónica existente
4. Implementar cambios de forma incremental
5. Documentar decisiones tomadas
6. Ejecutar tests y verificar en QEMU
7. Actualizar `.ai/state.md` si corresponde

## Herramientas

- **Editor/IDE:** según preferencia
- **Compiler:** GCC/Clang con flags de warnings habilitados
- **Debugger:** GDB con QEMU stub
- **Build:** Make
- **Testing:** framework propio + QEMU automation

## Comunicación

- Documentar cambios importantes en commits descriptivos
- Actualizar `.ai/tasks/current.md` con progreso
- Comunicar bloqueantes o dependencias
- Revisar PRs de otros agentes cuando corresponda

## NO Hacer

- NO implementar funcionalidad sin diseño previo
- NO saltarse pasos de testing
- NO ignorar warnings del compilador
- NO commitear código que no compile
- NO modificar `.gitignore` sin justificación
- NO agregar dependencias externas sin evaluar impacto
