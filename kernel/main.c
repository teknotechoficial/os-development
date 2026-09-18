/*
 * kernel/main.c - Minimal kernel entry for build verification
 *
 * PROTOTYPE FILE - Only for build system verification.
 * This file will be replaced by the actual kernel implementation.
 *
 * WARNING: This file does NOT implement any real kernel functionality.
 */

#include <stdint.h>

/*
 * Kernel main function
 *
 * PROTOTYPE: This function only verifies that the build system works.
 * It does NOT initialize any kernel subsystems.
 */
void kernel_main(void)
{
    /*
     * In a real kernel, this would:
     * - Initialize console/screen
     * - Print boot message
     * - Initialize kernel subsystems
     * - Start scheduler
     * - Enter idle loop
     */

    /* Infinite loop - nothing to do yet */
    while (1) {
        /* Halt until next interrupt */
        __asm__ volatile("hlt");
    }
}
