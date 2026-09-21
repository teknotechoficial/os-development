# Project State

## Status

Repository preparation completed.

## OS Implementation

Not started.

## Target Architecture

- x86_64
- Monolithic modular kernel
- C + Assembly

## Current Phase

**Phase 0 — Project and toolchain preparation.**

## Next Phase

**Phase 1 — Boot and initial kernel.**

## Current Objective

Prepare the repository and development workflow before implementing the first bootable kernel.

## Important Notes

- The repository structure is not proof that an OS subsystem exists.
- Only implemented and tested functionality should be considered complete.
- The files `boot/boot.asm` and `kernel/main.c` are **prototypes** for build system verification only. They do NOT implement real functionality.

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Repository structure | Completed | Directory layout created |
| Toolchain (Makefile) | Completed | Base Makefile for x86_64 |
| Linker script | Completed | Base linker.ld |
| Agent configuration | Completed | CLAUDE.md, OPENCODE.md, AGENTS.md |
| CI/CD (GitHub Actions) | Completed | build.yml, tests.yml |
| GitHub templates | Completed | Issue templates, PR template |
| Architecture docs | Completed | .ai/architecture/system.md with ADRs |
| Bootloader | Not started | ADR-004 pending (GRUB2 vs Limine vs UEFI) |
| Kernel | Not started | |
| Memory management | Not started | |
| Interrupts | Not started | |
| Processes | Not started | |
| Drivers | Not started | |
| Filesystem | Not started | |
| Userspace | Not started | |
| Testing framework | Not started | |

## Recent Changes

- Repository initialized with base structure
- Agent configuration files created (CLAUDE.md, OPENCODE.md, AGENTS.md)
- Makefile and linker script base created
- Architecture documentation with 7 ADRs created
- GitHub workflows and issue templates configured

## Next Steps

1. Decide bootloader (GRUB2, Limine, or UEFI) — ADR-004
2. Implement bootstrap minimum to verify toolchain
3. Develop basic GDT and IDT
4. Implement minimal functional kernel (hello world in QEMU)
