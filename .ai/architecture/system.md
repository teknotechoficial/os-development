# Arquitectura del Sistema Operativo

## Visión General

Sistema operativo monolítico modular para arquitectura x86_64, desarrollado desde cero por un equipo de agentes de IA.

## Decisiones Arquitectónicas

### ADR-001: Arquitectura x86_64

**Estado:** Aceptada

**Contexto:** El proyecto requiere una arquitectura ampliamente soportada y documentada para desarrollo educativo y funcional.

**Decisión:** Se utilizará x86_64 como arquitectura objetivo.

**Consecuencias:**
- Amplia disponibilidad de documentación y herramientas
- Compatible con QEMU y otros emuladores
- Requiere manejo de modo largo, paging de 4 niveles
- Complejidad adicional vs x86_32 pero mejor soporte moderno

---

### ADR-002: Kernel Monolítico Modular

**Estado:** Aceptada

**Contexto:** Se requiere un balance entre simplicidad y organizacion para un kernel educativo pero funcional.

**Decisión:** Kernel monolítico con estructura modular (archivos separados por componente, no módulos cargables dinámicamente en esta fase).

**Consecuencias:**
- Simplicidad de implementación inicial
- Facilidad de depuración
- Sin overhead de comunicación entre módulos
- Requiere disciplina para mantener separación de componentes
- Futura migración a módulos cargables es posible

---

### ADR-003: Lenguajes C y Assembly

**Estado:** Adecida

**Contexto:** Los kernels típicos usan C y Assembly para control directo del hardware.

**Decisión:** C como lenguaje principal, Assembly para bootstrap y operaciones de bajo nivel.

**Consecuencias:**
- Control directo del hardware
- Amplia documentación de kernels en C
- Requiere manejo cuidadoso de memoria
- Assembly limitado a operaciones esenciales

---

### ADR-004: Boot con bootloader externo

**Estado:** Pendiente

**Contexto:** El bootloader es un componente crítico pero complejo de desarrollar desde cero.

**Decisión:** TBD - Opciones:
1. GRUB2 (Multiboot2) - Maduro, bien documentado
2. Limine - Moderno, simpler API
3. UEFI directo - Máximo control, más complejidad

**Requiere:** Evaluación de opciones y decisión antes de implementar boot.

---

### ADR-005: Build System con Make

**Estado:** Aceptada

**Contexto:** Se necesita un build system robusto y ampliamente disponible.

**Decisión:** GNU Make como sistema de construcción.

**Consecuencias:**
- Disponible en todas las plataformas
- Amplio conocimiento y documentación
- Flexible para customización
- Makefile base ya creado

---

### ADR-006: Emulación con QEMU

**Estado:** Aceptada

**Contexto:** Se necesita un entorno de testing rápido y sin riesgo para el hardware.

**Decisión:** QEMU como emulador principal para desarrollo y testing.

**Consecuencias:**
- Testing rápido sin reboot real
- Soporte para GDB remote debugging
- Fácil automatización de tests
- Compatibilidad con GRUB2/Limine para testing de boot

---

### ADR-007: Git para Control de Versiones

**Estado:** Adecida

**Contexto:** Se necesita control de versiones distribuido para trabajo colaborativo entre agentes.

**Decisión:** Git con GitHub como plataforma.

**Consecuencias:**
- Branching model para features
- Pull requests para code review
- GitHub Actions para CI/CD
- Historial completo de cambios

---

## Componentes del Sistema

### Nivel 0: Hardware
- CPU x86_64
- RAM
- Dispositivos (teclado, pantalla, disco)

### Nivel 1: Bootstrap
- Bootloader (GRUB2/Limine/UEFI)
- Transición a modo largo
- Carga del kernel

### Nivel 2: Kernel Core
- GDT (Global Descriptor Table)
- IDT (Interrupt Descriptor Table)
- Gestión de memoria física
- Paging (memoria virtual)
- Gestión de procesos
- Scheduler
- Syscalls

### Nivel 3: Device Drivers
- Drivers de pantalla (VGA/framebuffer)
- Driver de teclado
- Driver de disco (ATA/AHCI)
- Drivers de timer

### Nivel 4: Filesystem
- VFS (Virtual File System)
- Implementaciones (FAT, ext2, etc.)

### Nivel 5: Userspace
- Init process
- Shell básica
- Aplicaciones básicas

## Decisiones Pendientes

1. **Bootloader:** GRUB2 vs Limine vs UEFI directo
2. **Sistema de archivos inicial:** FAT vs ext2 vs custom
3. **Scheduler:** FIFO vs Round Robin vs Priority
4. **Memoria virtual:** Paginación nivel 4 (x86_64 estándar)
5. **ABI:** System V AMD64 ABI
6. **Licencia:** TBD

## Referencias

- [OSDev Wiki](https://wiki.osdev.org)
- [OSDev Bare Bones Tutorial](https://wiki.osdev.org/Bare_Bones)
- [Intel SDM](https://software.intel.com/en-us/articles/intel-sdm)
- [AMD APM](https://developer.amd.com/resources/developer-guides-manuals/)
