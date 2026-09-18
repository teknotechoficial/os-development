/* linker.ld - Linker script for x86_64 kernel */

/* Entry point */
ENTRY(_start)

/* Kernel base address */
KERNEL_BASE = 0x100000;

SECTIONS
{
    /* Kernel loaded at 1MB (standard for x86) */
    . = KERNEL_BASE;

    /* Code section */
    .text : AT(ADDR(.text) - KERNEL_BASE)
    {
        *(.text)
        *(.text.*)
    }

    /* Read-only data */
    .rodata : AT(ADDR(.rodata) - KERNEL_BASE)
    {
        *(.rodata)
        *(.rodata.*)
    }

    /* Data section */
    .data : AT(ADDR(.data) - KERNEL_BASE)
    {
        *(.data)
        *(.data.*)
    }

    /* BSS section (zero-initialized) */
    .bss : AT(ADDR(.bss) - KERNEL_BASE)
    {
        __bss_start = .;
        *(.bss)
        *(.bss.*)
        *(COMMON)
        __bss_end = .;
    }

    /* Kernel end address */
    __kernel_end = .;

    /* Discard debug and other sections */
    /DISCARD/ :
    {
        *(.comment)
        *(.note*)
        *(.eh_frame*)
        *(.debug*)
    }
}
