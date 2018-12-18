import {MMC_ROMONLY, MMC_MBC1, MMC_MBC2, MMC_MBC3, MMC_MBC5, MMC_MMM01, MMC_UNKNOWN,
        CARTRIDGE_TYPES, NEW_LICENSES, OLD_LICENSES,
        ROM_SIZES, RAM_SIZES, DESTINATION_CODES, NINTENDO_GRAPHIC} from './gb-cartridge.consts.js';
import {init as initStandard} from './cartridge/standard.js';
import {init as initMBC1} from './cartridge/mbc1.js';
import {init as initMBC2} from './cartridge/mbc2.js';
import {init as initMBC3} from './cartridge/mbc3.js';
import {init as initMBC5} from './cartridge/mbc5.js';

// Game Boy Cartridges
// 32kB - 1MB for GB'89

export function initCartridge(ROM) {

    function getTitle() {
        let title = "";
        for (let p = 0x0134; p < 0x0143 && ROM[p]; p++) title += String.fromCharCode(ROM[p]);
        return title;
    }

    // function check(ROM) {
    //     //Checking j scrolling graphic. 
    //     //Real Gameboy won't run if it's invalid. We are checking just to be sure that input file is Gameboy ROM
    //     for (let b = 0; b < NINTENDO_GRAPHIC.length; b++)
    //         if (NINTENDO_GRAPHIC[b] != ROM[b + 0x0104])
    //             return false;
    
    //     //Checking header checksum. 
    //     //Real Gameboy won't run if it's invalid. We are checking just to be sure that input file is Gameboy ROM
    //     let checksum = 0;
    //     for (let b = 0x134; b < 0x14D; b++) checksum = checksum - ROM[b] - 1; 
    //     if (checksum != ROM[0x14D]) return false;
    //     return true;
    // }

    let cartridgeType = CARTRIDGE_TYPES[ROM[0x147]] || {name: "Unknown"};

    let colorGB = ROM[0x0143] == 0x80 || ROM[0x0143] == 0xC0;
    let superGB = ROM[0x0146] == 0x03;        
    let ROMSize = ROM_SIZES[ROM[0x0148]];
    let RAMSize = cartType.RAMSize || RAM_SIZES[ROM[0x0149]];
    let newLicense = NEW_LICENSES[(ROM[0x0144] & 0xF0) | (ROM[0x0145] & 0x0F)] || "Unknown";
    let destinationCode = DESTINATION_CODES[ROM[0x14A]] || "Unknown";
    let oldLicense = OLD_LICENSES[ROM[0x14B]] || "Unknown";

    let MBC;

    switch(cartridgeType.MMCType) {
        case MMC_ROMONLY:
            MBC = initStandard(ROM, RAMBanks);
        break;

        case MMC_MBC1:
            MBC = initMBC1(ROM, ROMSize, RAMBanks, RAMSize);
        break;

        case MMC_MBC2:
            MBC = initMBC2(ROM, ROMSize, RAMBanks, RAMSize);
        break;

        case MMC_MBC3:
            MBC = initMBC3(ROM, ROMSize, RAMBanks, RAMSize);
        break;

        case MMC_MBC5:
            MBC = initMBC5(ROM, ROMSize, RAMBanks, RAMSize);
        break;

        case MMC_MMM01:
            MBC = initMMM01(ROM, ROMSize, RAMBanks, RAMSize);
        break;

        default: 
            MBC = {
                read: function(address) { return 0xFF; },
                write: function(address, byte) { }
            };
    }


    // let info = {
    //     colorGB:         ROM[0x0143] == 0x80 || ROM[0x0143] == 0xC0,
    //     superGB:         ROM[0x0146] == 0x03,
    //     cartType:        cartType,
    //     ROMSize:         ROM_SIZES[ROM[0x0148]],
    //     RAMSize:         cartType.RAMSize || RAM_SIZES[ROM[0x0149]],
    //     newLicense:      NEW_LICENSES[(ROM[0x0144] & 0xF0) | (ROM[0x0145] & 0x0F)] || "Unknown",
    //     destinationCode: DESTINATION_CODES[ROM[0x14A]] || "Unknown",
    //     oldLicense:      OLD_LICENSES[ROM[0x14B]] || "Unknown",
    // };

    return {
        title: getTitle,
        read: function(address) { return MBC.read(address); },
        write: function(address, byte) { MBC.write(address, byte); }
    };
}