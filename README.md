# OS Development - Sistema Operativo desde Cero

Proyecto de desarrollo de un sistema operativo funcional para arquitectura x86_64, desarrollado por un equipo de agentes de IA.

## Estado Actual

**Fase:** Infraestructura de desarrollo  
**Estado:** Repositorio inicializado, listo para desarrollo

Este proyecto se encuentra en su fase inicial de preparación. El sistema operativo aún no tiene funcionalidad implementada.

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

La arquitectura está diseñada para ser evolutiva y no requiere reescrituras mayores para incorporar nuevas funcionalidades.

## Equipo de Agentes de IA

Este proyecto es desarrollado por tres agentes de IA especializados:

| Agente | Rol | Responsabilidades |
|--------|-----|-------------------|
| **Claude Code** | Arquitecto principal | Arquitectura, kernel, integración |
| **Codex CLI** | Auditor y QA | Code review, testing, seguridad |
| **OpenCode** | Desarrollador especializado | Drivers, herramientas, tests |

Cada agente tiene instrucciones específicas en archivos dedicados (CLAUDE.md, CODEX.md, OPENCODE.md).

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

# Ejecutar tests específicos
make test BOOT    # Tests de boot
make test KERNEL  # Tests de kernel
```

## Estructura del Repositorio

```
/
├── .github/          # CI/CD workflows y templates
├── .ai/              # Coordinación entre agentes
│   ├── architecture/ # Documentación arquitectónica
│   ├── tasks/        # Gestión de tareas
│   ├── reviews/      # Revisiones de código
│   └── state.md      # Estado actual del proyecto
├── boot/             # Bootloader
├── kernel/           # Kernel
├── tests/            # Tests automatizados
├── tools/            # Herramientas de desarrollo
├── docs/             # Documentación
├── Makefile          # Build system
├── linker.ld         # Linker script
├── AGENTS.md         # Reglas globales para agentes
├── CLAUDE.md         # Instrucciones para Claude Code
├── CODEX.md          # Instrucciones para Codex CLI
└── OPENCODE.md       # Instrucciones para OpenCode
```

## Contribuir

1. Leer `AGENTS.md` para entender las reglas del proyecto
2. Revisar `.ai/state.md` para entender el estado actual
3. Revisar `.ai/tasks/backlog.md` para tareas disponibles
4. Crear branch para tu funcionalidad
5. Implementar cambios de forma incremental
6. Ejecutar tests antes de commitear
7. Crear Pull Request con descripción clara

## Licencia

 TBD (a decidir)

## Contacto

 TBD
