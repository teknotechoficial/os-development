# Roadmap — OS Development

Roadmap de desarrollo incremental del sistema operativo.

---

## Phase 0 — Preparación

**Estado:** Completada

- [x] Arquitectura x86_64 definida
- [x] Toolchain configurada (GCC, NASM, binutils)
- [x] Build system (Make) configurado
- [x] Linker script base creado
- [x] QEMU y GDB configurados
- [x] Git y GitHub configurados
- [x] CI/CD básico (build.yml, tests.yml)
- [x] Documentación arquitectónica (ADRs)
- [x] Archivos de coordinación de agentes

---

## Phase 1 — Boot y kernel inicial

**Estado:** Pendiente

- [ ] Decidir bootloader (GRUB2, Limine, UEFI) — ADR-004
- [ ] Implementar bootloader funcional
- [ ] Entrada del kernel en modo largo (x86_64 long mode)
- [ ] GDT básica
- [ ] IDT básica
- [ ] Salida serial (para debugging)
- [ ] Kernel básico funcional
- [ ] Imagen arrancable
- [ ] Prueba exitosa en QEMU

---

## Phase 2 — Kernel básico

**Estado:** Pendiente

- [ ] Manejo de interrupciones (ISR, IRQ)
- [ ] Timer (PIT/APIC)
- [ ] Driver de teclado
- [ ] Consola de texto (VGA/framebuffer)
- [ ] Manejo básico de errores (panic, assertion)

---

## Phase 3 — Memoria

**Estado:** Pendiente

- [ ] Physical memory manager
- [ ] Paging (paginación nivel 4 x86_64)
- [ ] Virtual memory
- [ ] Kernel heap

---

## Phase 4 — Procesos

**Estado:** Pendiente

- [ ] Threads
- [ ] Scheduler (FIFO → Round Robin → Priority)
- [ ] Context switching
- [ ] User mode (Ring 3)
- [ ] Syscalls básicas

---

## Phase 5 — Almacenamiento

**Estado:** Pendiente

- [ ] Drivers de almacenamiento (ATA/AHCI)
- [ ] VFS (Virtual File System)
- [ ] Filesystem inicial (FAT o ext2)

---

## Phase 6 — Userspace

**Estado:** Pendiente

- [ ] libc básica
- [ ] Init process
- [ ] Shell básica
- [ ] Utilities básicas (ls, cat, echo, etc.)

---

## Phase 7 — GUI

**Estado:** Pendiente (futuro)

- [ ] Framebuffer
- [ ] Input handling
- [ ] Compositor básico
- [ ] Window manager
- [ ] Desktop environment

---

## Phase 8 — Sistema avanzado

**Estado:** Pendiente (futuro)

- [ ] Networking stack
- [ ] USB
- [ ] Audio
- [ ] Drivers adicionales
- [ ] Installer
- [ ] Package manager

---

## Notas

- Este roadmap es orientativo y puede evolucionar.
- Cada fase debe ser completada y verificada antes de avanzar.
- Las decisiones arquitectónicas se documentan en `.ai/architecture/` como ADRs.
- El progreso se registra en `.ai/tasks/completed.md`.
