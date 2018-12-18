export function init(ROM, RAMBanks) {
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
                case 0x7000: return ROM[address];
                //Switchable RAM bank
                case 0xA000:
                case 0xB000: return RAMBanks[address - 0xA000];
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
                case 0xB000: RAMBanks[address - 0xA000] = byte;
                break;
            }    
        }
    };
}