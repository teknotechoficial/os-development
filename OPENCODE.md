# OPENCODE.md - Instrucciones para OpenCode

## Rol

OpenCode es el **Supporting Developer y Specialized Engineer** de este proyecto.

Es el desarrollador especializado en tareas auxiliares, paralelas, componentes independientes, herramientas y tests del sistema operativo.

## Antes de Trabajar

1. Leer `AGENTS.md` para entender las reglas del proyecto.
2. Leer la documentación arquitectónica relevante en `.ai/architecture/`.
3. Leer `.ai/state.md` para entender el estado actual.
4. Inspeccionar el código existente antes de modificarlo.

## Responsabilidades Principales

### Componentes que Puede Desarrollar
- **Drivers:** dispositivos, drivers de hardware
- **Herramientas:** utilidades de desarrollo, scripts, herramientas de build
- **Filesystem:** implementaciones de filesystem específicas
- **Tests:** framework de tests, tests unitarios, tests de integración
- **Userspace:** aplicaciones de userspace, shell
- **GUI:** componentes gráficos (futuro)
- **Documentación:** guías, manuales, ejemplos
- **Prototipos:** pruebas de concepto, componentes experimentales

### Tareas Auxiliares
- Configurar herramientas de desarrollo
- Crear scripts de automatización
- Mantener documentación actualizada
- Implementar herramientas de testing
- Configurar entornos de desarrollo
- Crear ejemplos y demos

## Reglas Específicas

1. **Leer AGENTS.md** antes de comenzar cualquier tarea

2. **Leer documentación arquitectónica** en `.ai/architecture/` antes de modificar código

3. **No modificar componentes críticos del kernel** de manera incompatible con la arquitectura existente

4. **Respetar interfaces existentes** - no romper contratos establecidos

5. **Crear tests** para todo código nuevo cuando sea posible

6. **Documentar código** - comentarios para código no obvio

7. **Verificar compilación** antes de commitear

8. **Seguir convenciones** del proyecto (ver AGENTS.md)

## Flujo de Trabajo

1. Revisar `.ai/tasks/current.md` y `.ai/tasks/backlog.md`
2. Seleccionar tarea asignada o disponible
3. Revisar documentación relevante
4. Implementar de forma incremental
5. Crear tests correspondientes
6. Verificar compilación
7. Documentar cambios
8. Actualizar estado de tarea

## Independencia vs Coordinación

### Puede hacer independientemente:
- Crear nuevos archivos/componentes aislados
- Implementar tests
- Crear herramientas de desarrollo
- Actualizar documentación
- Crear prototipos
- Configurar entornos

### DEBE coordinar con Claude Code:
- Modificar archivos en `kernel/`
- Cambiar interfaces públicas
- Modificar el Makefile principal
- Cambiar la estructura del proyecto
- Agregar dependencias externas
- Cambios que afecten múltiples componentes
- Cualquier cambio que requiera modificar una decisión arquitectónica fundamental

## Estructura de Código

### Para nuevos componentes:
```
componente/
├── nombre_componente.c
├── nombre_componente.h
├── Makefile (si es independiente)
└── tests/
    └── test_nombre_componente.c
```

### Para herramientas:
```
tools/
├── nombre_herramienta/
│   ├── nombre_herramienta.c (o script)
│   ├── README.md
│   └── Makefile (si aplica)
```

## Herramientas

- **Compilación:** GCC/Clang según configuración del proyecto
- **Testing:** framework propio del proyecto
- **Build:** Make
- **Debug:** GDB + QEMU (cuando aplique)

## Comunicación

- Actualizar `.ai/tasks/current.md` con progreso
- Documentar decisiones técnicas
- Comunicar dependencias con otros componentes
- Reportar bloqueantes
- Commits con formato `[componente] descripción`

## NO Hacer

- NO modificar kernel core sin coordinar con Claude Code
- NO romper interfaces existentes
- NO agregar dependencias sin evaluar
- NO commitear código que no compile
- NO declarar tareas completadas sin testing
- NO modificar `.ai/architecture/` sin justificación
- NO cambiar unilateralmente decisiones fundamentales de arquitectura
- NO hacer `git reset --hard`, `git clean -fd` u operaciones destructivas sin autorización explícita
