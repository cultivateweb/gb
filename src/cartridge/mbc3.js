/*
 * Beside for the ability to access up to 2MB ROM (128 banks), and 32KB RAM (4 banks), the MBC3 also includes a built-in Real Time Clock (RTC).
 * The RTC requires an external 32.768 kHz Quartz Oscillator, and an external battery (if it should continue to tick when the gameboy is turned off).
 * 
 * 0000-3FFF - ROM Bank 00 (Read Only)
 *             Same as for MBC1.
 * 
 * 4000-7FFF - ROM Bank 01-7F (Read Only)
 *             Same as for MBC1, except that accessing banks 20h, 40h, and 60h is supported now.
 * 
 * A000-BFFF - RAM Bank 00-03, if any (Read/Write)
 * A000-BFFF - RTC Register 08-0C (Read/Write)
 *             Depending on the current Bank Number/RTC Register selection (see below), this memory space is used to access an 8KByte external RAM Bank,
 *             or a single RTC Register.
 * 
 * 0000-1FFF - RAM and Timer Enable (Write Only)
 *             Mostly the same as for MBC1, a value of 0Ah will enable reading and writing to external RAM - and to the RTC Registers!
 *             A value of 00h will disable either.
 * 
 * 2000-3FFF - ROM Bank Number (Write Only)
 *             Same as for MBC1, except that the whole 7 bits of the RAM Bank Number are written directly to this address.
 *             As for the MBC1, writing a value of 00h, will select Bank 01h instead. All other values 01-7Fh select the corresponding ROM Banks.
 * 
 * 4000-5FFF - RAM Bank Number - or - RTC Register Select (Write Only)
 *             As for the MBC1s RAM Banking Mode, writing a value in range for 00h-03h maps the corresponding external RAM Bank (if any) into memory at A000-BFFF.
 *             When writing a value of 08h-0Ch, this will map the corresponding RTC register into memory at A000-BFFF. 
 *             That register could then be read/written by accessing any address in that area, typically that is done by using address A000.
 * 
 * 6000-7FFF - Latch Clock Data (Write Only)
 *             When writing 00h, and then 01h to this register, the current time becomes latched into the RTC registers. 
 *             The latched data will not change until it becomes latched again, by repeating the write 00h->01h procedure.
 *             This is supposed for <reading> from the RTC registers. It is proof to read the latched (frozen) time from the RTC registers, 
 *             while the clock itself continues to tick in background.
 * 
 * The Clock Counter Registers
 *   08h  RTC S   Seconds   0-59 (0-3Bh)
 *   09h  RTC M   Minutes   0-59 (0-3Bh)
 *   0Ah  RTC H   Hours     0-23 (0-17h)
 *   0Bh  RTC DL  Lower 8 bits of Day Counter (0-FFh)
 *   0Ch  RTC DH  Upper 1 bit of Day Counter, Carry Bit, Halt Flag
 *         Bit 0  Most significant bit of Day Counter (Bit 8)
 *         Bit 6  Halt (0=Active, 1=Stop Timer)
 *         Bit 7  Day Counter Carry Bit (1=Counter Overflow)
 * The Halt Flag is supposed to be set before <writing> to the RTC Registers.
 * 
 * The Day Counter
 * The total 9 bits of the Day Counter allow to count days in range from 0-511 (0-1FFh). The Day Counter Carry Bit becomes set when this value overflows.
 * In that case the Carry Bit remains set until the program does reset it. */

const ROM_BANK_SIZE = 0x4000;
const RAM_BANK_SIZE = 0x2000;

const RAM_BANK_MAPPING     = 0;
const RTC_REGISTER_MAPPING = 1;

const RTC_S  = 0;
const RTC_M  = 1;
const RTC_H  = 2;
const RTC_DL = 3;
const RTC_DH = 4;

export function init(rom, romSize, ramBanks, ramSize) {
    console.log("init MBC3");

    let mode = RAM_BANK_MAPPING;
    let ramOffset = 0;
    let romOffset = ROM_BANK_SIZE;
    let ramRTCEnabled = false;
    let lastLatchWrite = 0xFF;
    let baseTime = 0;
    let haltTime = 0;
    let rtcRegisters = [];
    let selectedRTCRegister;

    function time() { return +(new Date() / 1000).toFixed(0); }

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

                //Switchable RAM bank/RTC register
                case 0xA000:
                case 0xB000:
                    if (ramRTCEnabled) {
                        if (mode == RAM_BANK_MAPPING) return ramBanks[address - 0xA000 + ramOffset];
                        else return rtcRegisters[selectedRTCRegister];
                    }
            }
            return 0xFF;  
        },
        write: function(address, byte) {
            switch (address & 0xF000) {
                //RAM/RTC registers enable/disable
                case 0x0000:
                case 0x1000: ramRTCEnabled = (byte & 0x0F) == 0x0A;
                break;

                //ROM bank switching
                case 0x2000:
                case 0x3000:
                    romOffset = byte & 0x7F;
                    romOffset %= romSize;
                    if (romOffset == 0) romOffset = 1;
                    romOffset *= ROM_BANK_SIZE;
                break;

                //RAM bank/RTC register switching
                case 0x4000:
                case 0x5000:
                    if ((byte & 0x0F) < 0x04) {
                        mode = RAM_BANK_MAPPING;
                        ramOffset = byte & 0x0F;
                        ramOffset %= ramSize;
                        ramOffset *= RAM_BANK_SIZE;
                    } else if ((byte & 0x0F) > 0x07 && (byte & 0x0F) < 0x0D) {
                        mode = RTC_REGISTER_MAPPING;
                        selectedRTCRegister = (byte & 0x0F) - 0x08;
                    }
                break;

                //RTC data latch
                case 0x6000:
                case 0x7000:
                    if (mode == RTC_REGISTER_MAPPING) {
                        if (lastLatchWrite == 0 && byte == 1) {
                            let passedTime = ((rtcRegisters[RTC_DH] & 0x40) ? haltTime : time()) - baseTime;
                            if (passedTime > 0x01FF * 86400) {
                                do {
                                    passedTime -= 0x01FF * 86400;
                                    baseTime   += 0x01FF * 86400;
                                } while (passedTime > 0x01FF * 86400);
                                rtcRegisters[RTC_DH] |= 0x80;//Day counter overflow
                            }
                            rtcRegisters[RTC_DL] = (passedTime / 86400) & 0xFF;
                            rtcRegisters[RTC_DH] &= 0xFE;
                            rtcRegisters[RTC_DH] |= ((passedTime / 86400) & 0x0100) >> 8;
                            passedTime %= 86400;
                            rtcRegisters[RTC_H] = (passedTime / 3600) & 0xFF;
                            passedTime %= 3600;
                            rtcRegisters[RTC_M] = (passedTime / 60) & 0xFF;
                            passedTime %= 60;
                            rtcRegisters[RTC_S] = passedTime & 0xFF;
                        }
                        lastLatchWrite = byte;
                    }
                break;

                //Switchable RAM bank/RTC register
                case 0xA000:
                case 0xB000:
                    if (ramRTCEnabled) {
                             if (mode == RAM_BANK_MAPPING) ramBanks[addr - 0xA000 + ramOffset] = byte;
                        else if (mode == RTC_REGISTER_MAPPING) {
                            let oldBasetime = (rtcRegisters[RTC_DH] & 0x40) ? haltTime : time();
                            switch (selectedRTCRegister) {
                                case RTC_S: {
                                    baseTime += (oldBasetime - baseTime) % 60;
                                    baseTime -= byte;
                                }
                                break;
                                case RTC_M: {
                                    let oldMinutes = ((oldBasetime - baseTime) / 60) % 60;
                                    baseTime += oldMinutes * 60;
                                    baseTime -= byte * 60;
                                }
                                break;
                                case RTC_H: {
                                    let oldHours = ((oldBasetime - baseTime) / 3600) % 24;
                                    baseTime += oldHours * 3600;
                                    baseTime -= byte * 3600;
                                }
                                break;
                                case RTC_DL: {
                                    let oldLowDays = ((oldBasetime - baseTime) / 86400) % 0xFF;
                                    baseTime += oldLowDays * 86400;
                                    baseTime -= byte * 86400;
                                }
                                break;
                                case RTC_DH: {
                                    let oldHighDays = ((oldBasetime - baseTime) / 86400) & 0x100;
                                    baseTime += oldHighDays * 86400;
                                    baseTime -= ((byte & 0x01) << 8) * 86400;
                                    if ((rtcRegisters[RTC_DH] ^ byte) & 0x40) {
                                        if (byte & 0x40) haltTime = time();
                                        else baseTime += time() - haltTime;
                                    }
                                }
                                break;
                            }
                            rtcRegisters[selectedRTCRegister] = byte;
                        }
                    }
                break;
            }
        }
    };
}