/*
 * It is similar to the MBC3 (but no RTC) but can access up to 64mbits of ROM and up to 1mbit of RAM.
 * 
 * The lower 8 bits of the 9-bit rom bank select is written to the 2000-2FFF area while the upper bit
 * is written to the least significant bit of the 3000-3FFF area.
 * 
 * Writing a value (XXXXBBBB - X = Don't care, B = bank select bits) into 4000-5FFF area will select
 * an appropriate RAM bank at A000-BFFF if the cart contains RAM. Ram sizes are 64kbit,256kbit, & 1mbit.
 * 
 * Also, this is the first MBC that allows rom bank 0 to appear in the 4000-7FFF range by writing $000 to the rom bank select. */

const ROM_BANK_SIZE = 0x4000;
const RAM_BANK_SIZE = 0x2000;

export function init(rom, romSize, ramBanks, ramSize) {
    console.log("init MBC5");

    let ramOffset = 0;
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
                case 0x7000: return rom[address - 0x4000 + romOffset];
        
                //RAM bank 0
                case 0xA000:
                case 0xB000: return ramBanks[address - 0xA000 + ramOffset];
            }
            return 0xFF;
        },
        write: function(address, byte) {
            switch (address & 0xF000) {
                //ROM bank switching (8 LSB)
                case 0x2000:
                    romOffset = ((romOffset / ROM_BANK_SIZE) & 0x0100) | byte;
                    romOffset %= romSize;
                    romOffset *= ROM_BANK_SIZE;
                break;

                //ROM bank switching (1 MSB)
                case 0x3000:
                    romOffset = ((romOffset / ROM_BANK_SIZE) & 0xFF) | ((byte & 0x01) << 9);
                    romOffset %= romSize;
                    romOffset *= ROM_BANK_SIZE;
                break;

                //RAM bank switching
                case 0x4000:
                case 0x5000:
                    ramOffset = byte & 0x0F;
                    ramOffset %= ramSize;
                    ramOffset *= RAM_BANK_SIZE;
                break;

                //Switchable RAM bank
                case 0xA000:
                case 0xB000:
                    ramBanks[address - 0xA000 + ramOffset] = byte;
                break;
            }
        }
    };
}