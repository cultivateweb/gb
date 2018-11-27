import {MMC_ROMONLY, MMC_MBC1, MMC_MBC2, MMC_MBC3, MMC_MBC5, MMC_MMM01, MMC_UNKNOWN,
        CARTRIDGE_TYPES, NEW_LICENSES, OLD_LICENSES,
        ROM_SIZES, RAM_SIZES, DESTINATION_CODES, NINTENDO_GRAPHIC} from './gb-cartridge.consts.js';

// Game Boy Cartridges
// 32kB - 1MB for GB'89

export function initCartridge(ROM) {
   
    let title = "";
    for (let p = 0x0134; p <= 0x0142 && ROM[p] != 0x00; p++) 
        title += String.fromCharCode(ROM[p]);

    function check(ROM) {
        //Checking j scrolling graphic. 
        //Real Gameboy won't run if it's invalid. We are checking just to be sure that input file is Gameboy ROM
        for (let b = 0; b < NINTENDO_GRAPHIC.length; b++)
            if (NINTENDO_GRAPHIC[b] != ROM[b + 0x0104])
                return false;
    
        //Checking header checksum. 
        //Real Gameboy won't run if it's invalid. We are checking just to be sure that input file is Gameboy ROM
        let complement = 0;
        for (let b = 0x134; b <= 0x14C; b++) complement = complement - ROM[b] - 1; 
        if (complement != ROM[0x14D]) return false;
        return true;
    }

    let cartType = CARTRIDGE_TYPES[ROM[0x147]] || {name: "Unknown"};

    let info = {
        colorGB:         ROM[0x0143] == 0x80 || ROM[0x0143] == 0xC0,
        superGB:         ROM[0x0146] == 0x03,
        cartType:        cartType,
        ROMSize:         ROM_SIZES[ROM[0x0148]],
        RAMSize:         cartType.RAMSize || RAM_SIZES[ROM[0x0149]],
        newLicense:      NEW_LICENSES[(ROM[0x0144] & 0xF0) | (ROM[0x0145] & 0x0F)] || "Unknown",
        destinationCode: DESTINATION_CODES[ROM[0x14A]] || "Unknown",
        oldLicense:      OLD_LICENSES[ROM[0x14B]] || "Unknown",
    };


    return {
        title: title,
        read: function(address) {
            return 0;
        },
        write: function(address, byte) {

        }
    };

}
