/*
 * Small games of not more than 32KBytes ROM do not require a MBC chip for ROM banking.
 * The ROM is directly mapped to memory at 0000-7FFFh. Optionally up to 8KByte of RAM could be connected at A000-BFFF,
 * even though that could require a tiny MBC-like circuit, but no real MBC chip. */
export function init(rom, ramBanks) {
    console.log("init standard");

    return {
        read: function(address) {
            switch (address & 0xF000) {
                //ROM bank 0
                case 0x0000:
                case 0x1000:
                case 0x2000:
                case 0x3000:

                //Switchable ROM bank
                case 0x4000:
                case 0x5000:
                case 0x6000:
                case 0x7000: return rom[address];

                //Switchable RAM bank
                case 0xA000:
                case 0xB000: return ramBanks[address - 0xA000];
                default: return 0xFF;
            }
        },
        write: function(address, byte) {
            switch (address & 0xF000) {
                //ROM bank 0
                case 0x0000:
                case 0x1000:
                case 0x2000:
                case 0x3000:

                //Switchable ROM bank
                case 0x4000:
                case 0x5000:
                case 0x6000:
                case 0x7000:
                    //ROM is read-only
                break;   
                     
                //Switchable RAM bank
                case 0xA000:
                case 0xB000: ramBanks[address - 0xA000] = byte;
                break;
            }    
        }
    };
}