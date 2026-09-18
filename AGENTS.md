# AGENTS.md - Reglas Globales para Agentes de IA

## Proyecto

Sistema operativo funcional desarrollado desde cero por un equipo de agentes de IA.

**Leer este archivo ANTES de comenzar cualquier tarea.**

## Arquitectura Objetivo

- **Arquitectura:** x86_64
- **Kernel:** Monolítico modular
- **Lenguajes:** C y Assembly (GNU asm / NASM según contexto)
- **Toolchain:** GCC/Clang + binutils (cross-compilation recomendada)
- **Boot:** bootloader para x86_64 (a decidir: GRUB2, Limine, UEFI directo)
- **Emulador:** QEMU (principal), VirtualBox/VMware (compatibilidad secundaria)
- **Debugger:** GDB (con QEMU stub remoto)
- **Build system:** Make
- **Control de versiones:** Git
- **Testing:** tests automatizados + pruebas de arranque en QEMU

## Convenciones de Código

### C
- Estilo Linux kernel (indentación con tabs, 8 columnas)
- Nombres en snake_case para funciones y variables
- Nombres en UPPER_CASE para macros y constantes
- Comentarios en inglés preferentemente
- Headers con include guard (`#ifndef HEADER_H / #define HEADER_H`)
- No usar `//` en C89/90 (usar `/* */` para compatibilidad)
- Funciones estáticas cuando el alcance es interno al archivo
- Usar `stdint.h` para tipos de ancho fijo (`uint32_t`, `int64_t`, etc.)

### Assembly
- Sintaxis AT&T para GCC, Intel para NASM según contexto
- Comentarios con `#` (AT&T) o `;` (Intel)
- Labels en snake_case
- Separar lógica de kernel de bootstrap correctamente

### Makefile
- Targets claros con documentación
- Usar variables para toolchain (`CC`, `AS`, `LD`, etc.)
- Mantener builds reproducibles
- Soporte para `clean`, `all`, `test`, `run`, `debug`

## Reglas de Git

- Commits descriptivos en inglés o español claro
- Formato: `[componente] descripción corta`
  - Ejemplo: `[kernel] initialize GDT`
  - Ejemplo: `[boot] add multiboot header`
  - Ejemplo: `[tests] add boot test framework`
- No commitear archivos binarios, builds, ni resultados
- No commitear secretos, credenciales, API keys, tokens
- Branches por funcionalidad: `feature/nombre`, `fix/nombre`, `refactor/nombre`
- Revisión de código obligatoria antes de merge a main

## Reglas de Testing

- TODO código nuevo debe tener tests cuando sea posible
- Tests de boot deben ejecutarse en QEMU
- No declarar funcionalidades terminadas sin haberlas probado
- Ejecutar `make test` antes de commitear cambios significativos
- Los tests deben ser deterministas (no depender de timing externo)

## Reglas de Modificación de Arquitectura

- Cualquier cambio arquitectónico debe documentarse primero
- Crear issue o documento de decisión antes de implementar
- Discutir impacto en componentes existentes
- Preservar compatibilidad con x86_64 en todo momento
- No romper interfaces existentes sin justificación y documentación

## Reglas de Documentación

- Documentar decisiones de diseño en `.ai/architecture/`
- Mantener README.md actualizado
- Documentar APIs públicas del kernel
- Comentar código complejo o no obvio
- Mantener CHANGELOG cuando exista

## Seguridad

- **PROHIBIDO** introducir secretos, API keys, tokens, contraseñas
- **PROHIBIDO** subir certificados privados o claves privadas
- **PROHIBIDO** conectarse a servicios externos sin autorización explícita
- Usar variables de entorno para configuraciones sensibles
- Revisar que `.gitignore` excluya archivos sensibles

## Reglas de Calidad

- **PROHIBIDO** declarar funcionalidades terminadas sin probarlas
- **OBLIGATORIO** verificar cambios en QEMU cuando corresponda
- **OBLIGATORIO** preservar compatibilidad con x86_64
- **OBLIGATORIO** revisar código existente antes de modificarlo
- **OBLIGATORIO** evitar cambios destructivos innecesarios
- Preferir cambios incrementales sobre rewrites masivos

## Coordinación entre Agentes

- Cada agente debe respetar su rol definido (ver CLAUDE.md, CODEX.md, OPENCODE.md)
- No duplicar trabajo de otros agentes
- Comunicar cambios que afecten componentes de otros agentes
- Respetar el backlog y las tareas asignadas
- Revisar `.ai/state.md` antes de comenzar trabajo

## Estructura del Proyecto

```
/
├── .github/          # CI/CD y templates
├── .ai/              # Coordinación y documentación de agentes
├── boot/             # Bootloader
├── kernel/           # Kernel
├── tests/            # Tests automatizados
├── tools/            # Herramientas de desarrollo
├── docs/             # Documentación
├── Makefile          # Build system
├── linker.ld         # Linker script
├── AGENTS.md         # Este archivo
├── CLAUDE.md         # Instrucciones para Claude Code
├── CODEX.md          # Instrucciones para Codex CLI
└── OPENCODE.md       # Instrucciones para OpenCode
```
