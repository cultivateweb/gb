/*
 * 0000-3FFF - ROM Bank 00 (Read Only)
 *             Same as for MBC1.
 * 
 * 4000-7FFF - ROM Bank 01-0F (Read Only)
 *             Same as for MBC1, but only a total of 16 ROM banks is supported.
 * 
 * A000-A1FF - 512x4bits RAM, built-in into the MBC2 chip (Read/Write)
 *             The MBC2 doesn't support external RAM, instead it includes 512x4 bits of built-in RAM (in the MBC2 chip itself).
 *             It still requires an external battery to save data during power-off though.
 *             As the data consists of 4bit values, only the lower 4 bits of the "bytes" in this memory area are used.
 * 
 * 0000-1FFF - RAM Enable (Write Only)
 *             The least significant bit of the upper address byte must be zero to enable/disable cart RAM. For example 
 *             the following addresses can be used to enable/disable cart RAM: 0000-00FF, 0200-02FF, 0400-04FF, ..., 1E00-1EFF.
 *             The suggested address range to use for MBC2 ram enable/disable is 0000-00FF.
 * 
 * 2000-3FFF - ROM Bank Number (Write Only)
 *             Writing a value (XXXXBBBB - X = Don't cares, B = bank select bits) into 2000-3FFF area will select an appropriate ROM bank at 4000-7FFF.
 * 
 * The least significant bit of the upper address byte must be one to select a ROM bank. For example the following addresses can be used to select a ROM bank: 2100-21FF, 2300-23FF, 2500-25FF, ..., 3F00-3FFF.
 * The suggested address range to use for MBC2 rom bank selection is 2100-21FF. */

const ROM_BANK_SIZE = 0x4000;

export function init(rom, romSize, ramBanks) {
    console.log("init MBC2");

    let romOffset = ROM_BANK_SIZE;
    return {
        read: function(address) {
            switch (address & 0xF000) {
                //ROM bank 0
                case 0x0000:
                case 0x1000:
                case 0x2000:
                case 0x3000: return rom[address];

                //ROM bank 1
                case 0x4000:
                case 0x5000:
                case 0x6000:
                case 0x7000: return rom[romOffset + (address - 0x4000)];

                //RAM bank 0
                case 0xA000:
                case 0xB000: return ramBanks[address - 0xA000] & 0x0F;
            }
            return 0xFF;
        },
        write: function(address, byte) {
            switch (address & 0xF000) {
                //ROM bank switching
                case 0x2000:
                case 0x3000:
                    romOffset = byte & 0x0F;
                    romOffset %= romSize;
                    if (romOffset == 0) romOffset = 1;
                    romOffset *= ROM_BANK_SIZE;
                break;

                //RAM bank 0
                case 0xA000:
                case 0xB000: ramBanks[address - 0xA000] = byte & 0x0F;
                break;
            }
        }
    };
}