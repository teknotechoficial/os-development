# OS Development Makefile
# Build system for x86_64 kernel

# Toolchain
CC      := gcc
AS      := nasm
LD      := ld
OBJCOPY := objcopy
OBJDUMP := objdump
GDB     := gdb
QEMU    := qemu-system-x86_64

# Flags
CFLAGS  := -ffreestanding -fno-builtin -fno-stack-protector \
           -nostdinc -nostdlib -mno-red-zone -m64 \
           -Wall -Wextra -Werror -pedantic \
           -std=c11

ASFLAGS := -f elf64

LDFLAGS := -nostdlib -z max-page-size=0x1000

# Directories
SRC_DIR   := .
BOOT_DIR  := boot
KERNEL_DIR := kernel
BUILD_DIR := build
TEST_DIR  := tests

# Find sources
C_SRCS   := $(wildcard $(KERNEL_DIR)/**/*.c $(KERNEL_DIR)/*.c)
ASM_SRCS := $(wildcard $(BOOT_DIR)/**/*.asm $(BOOT_DIR)/*.asm \
            $(KERNEL_DIR)/**/*.asm $(KERNEL_DIR)/*.asm)

# Object files
C_OBJS   := $(C_SRCS:.c=.o)
ASM_OBJS := $(ASM_SRCS:.asm=.o)
OBJS     := $(C_OBJS) $(ASM_OBJS)

# Output
KERNEL := $(BUILD_DIR)/kernel.elf
MAP    := $(BUILD_DIR)/kernel.map

# Default target
.PHONY: all
all: $(BUILD_DIR) $(KERNEL)

# Create build directory
$(BUILD_DIR):
	@mkdir -p $(BUILD_DIR)

# Link kernel
$(KERNEL): $(OBJS) linker.ld
	$(LD) $(LDFLAGS) -T linker.ld -o $(KERNEL) $(OBJS)
	@echo "Kernel built: $(KERNEL)"

# Compile C files
%.o: %.c
	$(CC) $(CFLAGS) -c $< -o $@

# Compile Assembly files
%.o: %.asm
	$(AS) $(ASFLAGS) $< -o $@

# Clean
.PHONY: clean
clean:
	rm -rf $(BUILD_DIR)
	find . -name "*.o" -delete
	@echo "Build cleaned"

# Run in QEMU
.PHONY: run
run: $(KERNEL)
	$(QEMU) -kernel $(KERNEL) -nographic

# Debug with QEMU + GDB
.PHONY: debug
debug: $(KERNEL)
	$(QEMU) -kernel $(KERNEL) -s -S -nographic &
	$(GDB) $(KERNEL) -ex "target remote localhost:1234"

# Run tests
.PHONY: test
test:
	@echo "Test framework not yet implemented"
	@echo "Tests will be available in future versions"

# Verbose mode
.PHONY: VERBOSE
VERBOSE:
	@echo "CC:     $(CC)"
	@echo "AS:     $(AS)"
	@echo "LD:     $(LD)"
	@echo "CFLAGS: $(CFLAGS)"
	@echo "SRCS:   $(C_SRCS) $(ASM_SRCS)"

# Help
.PHONY: help
help:
	@echo "OS Development Build System"
	@echo ""
	@echo "Targets:"
	@echo "  all     - Build kernel (default)"
	@echo "  clean   - Remove build artifacts"
	@echo "  run     - Run kernel in QEMU"
	@echo "  debug   - Run with GDB support"
	@echo "  test    - Run test suite"
	@echo "  help    - Show this help"
	@echo ""
	@echo "Variables:"
	@echo "  CC       - C compiler (default: gcc)"
	@echo "  AS       - Assembler (default: nasm)"
	@echo "  LD       - Linker (default: ld)"
	@echo "  CFLAGS   - C compiler flags"
	@echo "  ASFLAGS  - Assembler flags"
	@echo "  LDFLAGS  - Linker flags"
