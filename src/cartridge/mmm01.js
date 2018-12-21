
const ROM_BANK_SIZE = 0x4000;
const RAM_BANK_SIZE = 0x2000;

const MMM01MODE_ROMONLY = 0;
const MMM01MODE_BANKING = 1;

export function init(rom, romSize, ramBanks, ramSize) {
    console.log("init MMM01");

    let ramEnabled = false;
    let mode = MMM01MODE_ROMONLY;
    let ramOffset = 0;
    let romOffset = ROM_BANK_SIZE;
    let romBase = 0x00;
    
    return {
        read: function(address) {
            if (mode == MMM01MODE_ROMONLY) 
                switch (address & 0xF000) {
                    //ROM bank 0
                    case 0x0000:
                    case 0x1000:
                    case 0x2000:
                    case 0x3000:

                    //ROM bank 1
                    case 0x4000:
                    case 0x5000:
                    case 0x6000:
                    case 0x7000: return rom[address];

                    //Switchable RAM bank
                    case 0xA000:
                    case 0xB000: if (ramEnabled) return ramBanks[address - 0xA000 + ramOffset];
                }
            else
                switch (address & 0xF000) {
                    //ROM bank 0
                    case 0x0000:
                    case 0x1000:
                    case 0x2000:
                    case 0x3000: return rom[ROM_BANK_SIZE * 2 + romBase + address];

                    //ROM bank 1
                    case 0x4000:
                    case 0x5000:
                    case 0x6000:
                    case 0x7000: return rom[address - 0x4000 + ROM_BANK_SIZE * 2 + romBase + romOffset];

                    //Switchable RAM bank
                    case 0xA000:
                    case 0xB000: if (ramEnabled) return ramBanks[address - 0xA000 + ramOffset];
                }
            return 0xFF;
        },
        write: function(address, byte) {
            switch (address & 0xF000) {
                //Modes switching
                case 0x0000:
                case 0x1000:
                    if (mode == MMM01MODE_ROMONLY) mode = MMM01MODE_BANKING;
                    else ramEnabled = (byte & 0x0F) == 0x0A;
                break;

                //ROM bank switching
                case 0x2000:
                case 0x3000:
                    if (mode == MMM01MODE_ROMONLY) {
                        romBase = byte & 0x3F;
                        romBase %= romSize - 2;
                        romBase *= ROM_BANK_SIZE;
                    } else {
                        if (byte + romBase / ROM_BANK_SIZE > romSize - 3)
                            byte = (romSize - 3 - romBase / ROM_BANK_SIZE) & 0xFF;
                        romOffset = byte * ROM_BANK_SIZE;
                    }
                break;

                //RAM bank switching in banking mode
                case 0x4000:
                case 0x5000:
                    if (mode == MMM01MODE_BANKING) {
                        byte %= ramSize;
                        ramOffset = byte * RAM_BANK_SIZE;
                    }
                break;

                //Switchable RAM bank
                case 0xA000:
                case 0xB000: if (ramEnabled) ramBanks[address - 0xA000 + ramOffset] = byte;
                break;
            }
        }
    };
}