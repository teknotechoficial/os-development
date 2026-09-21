# OS Development - Sistema Operativo desde Cero

Proyecto de desarrollo de un sistema operativo funcional para arquitectura x86_64, desarrollado por un equipo de agentes de IA.

## Estado Actual

**Fase:** Phase 0 — Preparación del proyecto y toolchain  
**Estado:** Repositorio preparado, implementación del OS pendiente

Este proyecto se encuentra en la fase de preparación. El repositorio tiene la estructura base, documentación arquitectónica y configuración de agentes lista. **El sistema operativo aún no tiene funcionalidad implementada.** Los archivos `boot/boot.asm` y `kernel/main.c` son prototipos mínimos para verificación del build system.

## Objetivo

Desarrollar un sistema operativo funcional desde cero que incluya:

- Bootloader para x86_64
- Kernel monolítico modular
- Gestión de memoria (física y virtual)
- Sistema de interrupciones
- Planificador de procesos
- Llamadas al sistema
- Sistema de archivos
- Userspace
- Interfaz gráfica (futuro)

## Arquitectura

| Componente | Decisión |
|------------|----------|
| Arquitectura | x86_64 |
| Kernel | Monolítico modular |
| Lenguajes | C y Assembly |
| Toolchain | GCC/Clang + binutils |
| Boot | A decidir (GRUB2, Limine, UEFI) |
| Emulador | QEMU |
| Debugger | GDB |
| Build system | Make |
| Control de versiones | Git |

La arquitectura está diseñada para ser evolutiva y no requiere reescrituras mayores para incorporar nuevas funcionalidades. Ver `.ai/architecture/system.md` para decisiones arquitectónicas detalladas (ADRs).

## Equipo de Agentes de IA

Este proyecto es desarrollado por dos agentes de IA especializados:

| Agente | Rol | Responsabilidades |
|--------|-----|-------------------|
| **Claude Code** | Lead Developer + Software Architect | Arquitectura, kernel, integración, decisiones técnicas |
| **OpenCode** | Supporting Developer + Specialized Engineer | Drivers, herramientas, tests, documentación, prototipos |

Cada agente tiene instrucciones específicas en archivos dedicados (`CLAUDE.md`, `OPENCODE.md`). Las reglas globales están en `AGENTS.md`.

## Roadmap

El desarrollo sigue un roadmap incremental de 8 fases:

- **Phase 0:** Preparación (completada)
- **Phase 1:** Boot y kernel inicial
- **Phase 2:** Kernel básico (interrupciones, timer, teclado, consola)
- **Phase 3:** Memoria (física, virtual, heap)
- **Phase 4:** Procesos (threads, scheduler, syscalls)
- **Phase 5:** Almacenamiento (drivers, VFS, filesystem)
- **Phase 6:** Userspace (libc, init, shell)
- **Phase 7:** GUI (framebuffer, compositor, desktop)
- **Phase 8:** Sistema avanzado (networking, USB, audio)

Ver `.ai/tasks/roadmap.md` para detalles completos.

## Requisitos Previos

### Linux/macOS
```bash
# Compilador C cross-compilation
sudo apt-get install gcc-multilib binutils  # Debian/Ubuntu
# o
brew install gcc                             # macOS

# QEMU
sudo apt-get install qemu-system-x86        # Debian/Ubuntu
# o
brew install qemu                            # macOS

# GDB
sudo apt-get install gdb                    # Debian/Ubuntu
# o
brew install gdb                             # macOS

# Make
sudo apt-get install make                   # Debian/Ubuntu
# o
xcode-select --install                       # macOS

# NASM (para Assembly)
sudo apt-get install nasm                   # Debian/Ubuntu
# o
brew install nasm                            # macOS
```

### Windows
- Instalar [MSYS2](https://www.msys2.org/)
- Instalar herramientas via pacman: `pacman -S mingw-w64-x86_64-gcc mingw-w64-x86_64-binutils mingw-w64-x86_64-qemu make nasm gdb`

## Compilación

```bash
# Compilar todo
make all

# Limpiar builds
make clean

# Compilar con verbose
make VERBOSE=1
```

## Ejecutar en QEMU

```bash
# Ejecutar en QEMU
make run

# Ejecutar con debugger habilitado
make debug
```

## Depuración

```bash
# En una terminal: iniciar QEMU con GDB server
make debug

# En otra terminal: conectar GDB
gdb
(gdb) target remote localhost:1234
(gdb) symbol-file build/kernel.elf
(gdb) break kernel_main
(gdb) continue
```

## Testing

```bash
# Ejecutar todos los tests
make test
```

> **Nota:** El framework de testing aún no está implementado. Los tests estarán disponibles en futuras versiones.

## Estructura del Repositorio

```
/
├── .github/          # CI/CD workflows y templates
├── .ai/              # Coordinación entre agentes
│   ├── architecture/ # Documentación arquitectónica (ADRs)
│   ├── tasks/        # Gestión de tareas y roadmap
│   └── state.md      # Estado actual del proyecto
├── boot/             # Bootloader (prototipo actual)
├── kernel/           # Kernel (prototipo actual)
├── tests/            # Tests automatizados (pendiente)
├── tools/            # Herramientas de desarrollo (pendiente)
├── docs/             # Documentación (pendiente)
├── Makefile          # Build system
├── linker.ld         # Linker script
├── AGENTS.md         # Reglas globales para agentes
├── CLAUDE.md         # Instrucciones para Claude Code
└── OPENCODE.md       # Instrucciones para OpenCode
```

## Contribuir

1. Leer `AGENTS.md` para entender las reglas del proyecto
2. Revisar `.ai/state.md` para entender el estado actual
3. Revisar `.ai/tasks/roadmap.md` para el roadmap del proyecto
4. Revisar `.ai/tasks/backlog.md` para tareas disponibles
5. Crear branch para tu funcionalidad (`feature/nombre`, `fix/nombre`)
6. Implementar cambios de forma incremental
7. Ejecutar tests antes de commitear
8. Crear Pull Request con descripción clara

## Reportar Problemas

Usar los templates de GitHub Issues:
- **Bug Report** — Para errores en el sistema
- **Kernel Issue** — Para problemas específicos del kernel
- **Driver Issue** — Para problemas con drivers
- **Feature Request** — Para sugerir nuevas funcionalidades
- **Architecture Decision** — Para proponer decisiones arquitectónicas

## Licencia

TBD (a decidir)

## Contacto

TBD
