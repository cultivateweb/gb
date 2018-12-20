import {init as initStandard} from './cartridge/standard.js';
import {init as initMBC1} from './cartridge/mbc1.js';
import {init as initMBC2} from './cartridge/mbc2.js';
import {init as initMBC3} from './cartridge/mbc3.js';
import {init as initMBC5} from './cartridge/mbc5.js';

// Game Boy Cartridges
// 32kB - 1MB for GB'89

const ROM_SIZES = {0x00:2,0x01:4,0x02:8,0x03:16,0x04:32,0x05:64,0x06:128,0x52:72,0x53:80,0x54:96};
const RAM_SIZES = [0,1,1,4,16];
const DESTINATION_CODES = {0x00:"Japanese",0x01:"Non-Japanese"};

// 0x0104-0x0133
const NINTENDO_GRAPHIC = [
    0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
    0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D,
    0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
    0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99,
    0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC,
    0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E];

// const MMC_ROMONLY = 0x00;
// const MMC_MBC1    = 0x01;
// const MMC_MBC2    = 0x02;
// const MMC_MBC3    = 0x03;
// const MMC_MBC5    = 0x04;
// const MMC_MMM01   = 0x05;
// const MMC_UNKNOWN = 0x06;

// const CARTRIDGE_TYPES = {
//     0x00: { name: "ROM ONLY",                  MMCType: MMC_ROMONLY                                         },
//     0x01: { name: "ROM+MBC1",                  MMCType: MMC_MBC1                                            },
//     0x02: { name: "ROM+MBC1+RAM",              MMCType: MMC_MBC1                                            },
//     0x03: { name: "ROM+MBC1+RAM+BATT",         MMCType: MMC_MBC1, BatterySupport: true                      },
//     0x05: { name: "ROM+MBC2",                  MMCType: MMC_MBC2, RAMSize: 512                              },
//     0x06: { name: "ROM+MBC2+BATT",             MMCType: MMC_MBC2, BatterySupport: true, RAMSize: 512        },
//     0x08: { name: "ROM+RAM",                   MMCType: MMC_ROMONLY                                         },
//     0x09: { name: "ROM+RAM+BATT",              MMCType: MMC_ROMONLY, BatterySupport: true                   },
//     0x0B: { name: "ROM+MMM01",                 MMCType: MMC_MMM01                                           },
//     0x0C: { name: "ROM+MMM01+SRAM",            MMCType: MMC_MMM01                                           },
//     0x0D: { name: "ROM+MMM01+SRAM+BATT",       MMCType: MMC_MMM01, BatterySupport: true                     },
//     0x0F: { name: "ROM+MBC3+TIMER+BATT",       MMCType: MMC_MBC3,  BatterySupport: true,  RTCSupport: true  },
//     0x10: { name: "ROM+MBC3+TIMER+RAM+BATT",   MMCType: MMC_MBC3,  BatterySupport: true,  RTCSupport: true  },
//     0x11: { name: "ROM+MBC3",                  MMCType: MMC_MBC3                                            },
//     0x12: { name: "ROM+MBC3+RAM",              MMCType: MMC_MBC3                                            },
//     0x13: { name: "ROM+MBC3+RAM+BATT",         MMCType: MMC_MBC3, BatterySupport: true                      },
//     0x19: { name: "ROM+MBC5",                  MMCType: MMC_MBC5                                            },
//     0x1A: { name: "ROM+MBC5+RAM",              MMCType: MMC_MBC5                                            },
//     0x1B: { name: "ROM+MBC5+RAM+BATT",         MMCType: MMC_MBC5, BatterySupport: true                      },
//     0x1C: { name: "ROM+MBC5+RUMBLE",           MMCType: MMC_MBC5, RumbleSupport: true                       },
//     0x1D: { name: "ROM+MBC5+RUMBLE+SRAM",      MMCType: MMC_MBC5, RumbleSupport: true                       },
//     0x1E: { name: "ROM+MBC5+RUMBLE+SRAM+BATT", MMCType: MMC_MBC5, BatterySupport: true, RumbleSupport: true },
//     0x1F: { name: "Pocket Camera"                                                                           },
//     0xFD: { name: "Bandai TAMA5"                                                                            },
//     0xFE: { name: "Hudson HuC-3",              MMCType: MMC_MBC1                                            },
//     0xFF: { name: "Hudson HuC-1",              MMCType: MMC_MBC1                                            }};

const NEW_LICENSES = {
    0x00: "None",
    0x01: "Nintendo",
    0x31: "Nintendo",
    0x08: "Capcom",
    0x13: "Electronic Arts",
    0x69: "Electronic Arts",
    0x18: "HudsonSoft",
    0x19: "B-AI",
    0x20: "KSS",
    0x22: "POW",
    0x24: "PCM Complete",
    0x25: "San-X",
    0x28: "Kemco Japan",
    0x29: "Seta",
    0x30: "Viacom",
    0x32: "Bandia",
    0x33: "ocean/acclaim",
    0x93: "ocean/acclaim",
    0x34: "Konami",
    0x54: "Konami",
    0x35: "Hector",
    0x37: "Taito",
    0x38: "Hudson",
    0x39: "Banpresto",
    0x41: "Ubisoft",
    0x42: "Atlus",
    0x44: "Malibu",
    0x46: "Angel",
    0x47: "Pullet-Proof",
    0x49: "Irem",
    0x50: "Absolute",
    0x51: "Acclaim",
    0x52: "Activision",
    0x53: "American Summy",
    0x55: "HiTech Entertainment",
    0x56: "LJN",
    0x57: "Matchbox",
    0x58: "Mattel",
    0x59: "Milton Bradley",
    0x60: "Titus",
    0x61: "Virgin",
    0x64: "Lucas Arts",
    0x67: "Ocean",
    0x70: "Infogrames",
    0x71: "Interplay",
    0x72: "Broderbund",
    0x73: "Sculptured",
    0x75: "SCI",
    0x78: "T*HQ",
    0x79: "Accolade",
    0x80: "Misawa",
    0x83: "Lozc",
    0x86: "Tokuma Shoten I",
    0x87: "Tsukuda Ori",
    0x91: "Chun Soft",
    0x92: "Video System",
    0x95: "Varie",
    0x96: "Yonezawas PAL",
    0x97: "Kaneko",
    0x99: "Pack in Soft"};

const OLD_LICENSES = {
    0x00: "None",
    0x01: "Nintendo",
    0x31: "Nintendo",
    0x0A: "Jaleco",
    0xE0: "Jaleco",
    0x13: "Electronic Arts",
    0x69: "Electronic Arts",
    0x1A: "Yanoman",
    0x24: "PCM Complete",
    0x29: "Seta",
    0x32: "Bandai",
    0xA2: "Bandai",
    0xB2: "Bandai",
    0x35: "Hector",
    0x3C: "Entertainment I",
    0x42: "Atlus",
    0xEB: "Atlus",
    0x47: "Spectrum Holoby",
    0x4D: "Malibu",
    0x44: "Malibu",
    0x51: "Acclaim",
    0xB0: "Accalim",
    0x54: "Gametek",
    0x57: "MatchBox",
    0x5B: "Romstar",
    0x60: "Titus",
    0x70: "Infogrames",
    0x30: "Infogrames",
    0x73: "Sculptered Soft",
    0x79: "Accolade",
    0x7F: "Kemco",
    0xC2: "Kemco",
    0x86: "Tokuma Shoten I",
    0xC4: "Tokuma Shoten I",
    0x8E: "APE",
    0x92: "Video System",
    0x96: "Yonezawas PAL",
    0x9A: "Nihon Bussan",
    0x9D: "Banpresto",
    0x39: "Banpresto",
    0xD9: "Banpresto",
    0xA7: "Takara",
    0xAC: "Toei Animation",
    0xB4: "Enix",
    0xB9: "Pony Canyon",
    0xBD: "Sony/ImageSoft",
    0xC5: "Data East",
    0xC9: "UFL",
    0xCC: "Use",
    0xCF: "Angel",
    0x46: "Angel",
    0xD2: "Quest",
    0xD6: "Naxat Soft",
    0x5C: "Naxat Soft",
    0xDA: "Tomy",
    0xDE: "Human",
    0xE1: "Towachiki",
    0xE5: "Epoch",
    0xE9: "Natsume",
    0xEC: "Epic SonyRecords",
    0xF3: "Extereme Entertainment",
    0x08: "Capcom",
    0x38: "Capcom",
    0x0B: "Coconuts",
    0x18: "Hudsonsoft",
    0x1D: "Clary",
    0x25: "San X",
    0x33: "Seeabove",
    0x3E: "Gremlin",
    0x49: "Irem",
    0x4F: "US Gold",
    0x52: "Activision",
    0x55: "ParkPlace",
    0x59: "Milton Bradley",
    0x61: "Virgin",
    0x1F: "Virgin",
    0x4A: "Virgin",
    0x6E: "Elite Systems",
    0x0C: "Elite Systems",
    0x71: "Interplay",
    0x75: "The Sales Curve",
    0x7A: "Triffix Entertainment",
    0x80: "Misawa Entertainment",
    0x8B: "Bullet-Proof Software",
    0x8F: "IMAX",
    0x93: "Tsuburava",
    0x97: "Kaneko",
    0x9B: "Tecmo",
    0x9F: "Nova",
    0xA4: "Konami",
    0x34: "Konami",
    0xA9: "Technos JAPAN",
    0xAD: "Toho",
    0xB1: "ASCII Or Nexoft",
    0xB6: "HAL",
    0xBA: "Culture Brain O",
    0xBF: "Sammy",
    0xC3: "SquareSoft",
    0xC6: "TonkinHouse",
    0xCA: "Ultra",
    0xCD: "Meldac",
    0xD0: "Taito",
    0xC0: "Taito",
    0xD3: "Sigma Enterprises",
    0xD7: "Copya Systems",
    0xDB: "LJN",
    0xFF: "LJN",
    0x56: "LJN",
    0xDF: "Altron",
    0xE2: "Uutaka",
    0xE7: "Athena",
    0xEA: "King Records",
    0xEE: "IGS",
    0x09: "Hot B",
    0x19: "ITC Entertainment",
    0x28: "Kotobuki Systems",
    0x41: "Ubisoft",
    0x50: "Absolute",
    0x53: "American Sammy",
    0x5A: "Mindscape",
    0x5D: "Tradewest",
    0x67: "Ocean",
    0x6F: "Electro-Brain",
    0x72: "Broderbund",
    0xAA: "Broderbund",
    0x78: "THQ",
    0x7C: "Microprose",
    0x83: "Lozc",
    0x8C: "Victokai",
    0x91: "Chunsoft",
    0x95: "Varie",
    0xE3: "Varie",
    0x99: "Arc",
    0x9C: "Imagineer",
    0xA1: "Hori Electric",
    0xA6: "Kawada",
    0xAF: "Namco",
    0xB7: "SNK",
    0xBB: "Sunsoft",
    0xC8: "Koei",
    0xCB: "Vap",
    0xCE: "Pony Canyon OR",
    0xD1: "Sofel",
    0xD4: "Ask Kodansha",
    0xDD: "NCS",
    0xE8: "Asmik",
    0xF0: "Awave"};
    


export function init(ROM) {

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

    //let cartridgeType = CARTRIDGE_TYPES[ROM[0x147]] || {name: "Unknown"};



    let colorGB = ROM[0x0143] == 0x80 || ROM[0x0143] == 0xC0;
    let superGB = ROM[0x0146] == 0x03;        
    let newLicense = NEW_LICENSES[(ROM[0x0144] & 0xF0) | (ROM[0x0145] & 0x0F)] || "Unknown";
    let destinationCode = DESTINATION_CODES[ROM[0x14A]] || "Unknown";
    let oldLicense = OLD_LICENSES[ROM[0x014B]] || "Unknown";

    let MBC;
    switch(ROM[0x0147]) {
        case 0x00:
        case 0x08:
        case 0x09:
            MBC = initStandard(ROM, RAMBanks);
        break;

        case 0x01:
        case 0x02:
        case 0x03:
        case 0xFE:
        case 0xFF:
            MBC = initMBC1(ROM, ROM_SIZES[ROM[0x0148]], RAMBanks, RAM_SIZES[ROM[0x0149]]);
        break;

        case 0x05:
        case 0x06:
            MBC = initMBC2(ROM, ROM_SIZES[ROM[0x0148]], RAMBanks, 512);
        break;

        case 0x0F:
        case 0x10:
        case 0x11:
        case 0x12:
        case 0x13:
            MBC = initMBC3(ROM, ROM_SIZES[ROM[0x0148]], RAMBanks, RAM_SIZES[ROM[0x0149]]);
        break;

        case 0x19:
        case 0x1A:
        case 0x1B:
        case 0x1C:
        case 0x1D:
        case 0x1E:
            MBC = initMBC5(ROM, ROM_SIZES[ROM[0x0148]], RAMBanks, RAM_SIZES[ROM[0x0149]]);
        break;

        case 0x0B:
        case 0x0C:
        case 0x0D:
            MBC = initMMM01(ROM, ROM_SIZES[ROM[0x0148]], RAMBanks, RAM_SIZES[ROM[0x0149]]);
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