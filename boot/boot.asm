; boot/boot.asm - Minimal bootstrap for build verification
; This is a PROTOTYPE file to verify the build system works.
; It will be replaced by the actual bootloader implementation.

[BITS 64]

section .text
global _start

_start:
    ; Minimal kernel entry point
    ; This code is ONLY for build system verification
    ; It does NOT implement any real functionality

    ; In a real kernel, this would:
    ; - Set up GDT
    ; - Set up IDT
    ; - Initialize memory
    ; - Call kernel_main

    ; For now, just hang (infinite loop)
    cli
.hang:
    hlt
    jmp .hang
