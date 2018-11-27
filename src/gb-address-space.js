export function initAddressSpace(cartridge) {
    const ROM_BANK_SIZE = 0x4000, // 16Kb
          RAM_BANK_SIZE = 0x2000; //  8Kb
/*
memory mapped input output
memory mapping
память:
адресное пространство ограничено 0x10000 байтам
Из них только 0x8000 байт отведено на образ игры
Обращаясь по адресам 0x4000-0x7FFF, без банков памяти 
мы бы попали именно по этому адресу в образе игры.
С помощью банков памяти мы можем установить так, 
чтобы образ был поделен на банки, а по адресу 0x4000-0x7FFF 
был отображен выбранный банк.
0x4000-0x7FFF – это виртуальные адреса, которые не обязаны 
совпадать с физическими. Физический адрес – это настоящий 
адрес, по которому происходит доступ к ячейкам памяти.
Задача перевода виртуального адреса в физический лежит 
на MBC-контроллере, который находится внутри картриджа. 

ROM 32Kb 0000-7FFF
0000-3FFF ROM bank 0
4000-7FFF Switchable ROM bank
8000-9FFF Video RAM 8Kb
A000-BFFF Switchable RAM bank, External RAM 8Kb
C000-DFFF Internal RAM 1, Work RAM 8Kb    
E000-FDFF Echo of Internal RAM 1 
FE00-FE9F OAM, sprite attribute table
FEA0-FEFF not used
FF00-FF00 I/O ports
        --011111 d-pad (3-down 2-up 1-left 1-right)
        --101111 3-start 2-select 1-b 1-a
FF01-FF4B I/O ports
FF4C-FF7F not used 
FF80-FFFE Internal RAM 2, High RAM
FFFF-FFFF IE register, Interrupt enable register, interrapt switch

this.romBanks = 2*Math.pow(2,this.rom8bit[0x0148]);

*/

    return {
        read: function(address) {
            switch (address & 0xF000) {
                case 0x0000:
                case 0x1000:
                case 0x2000:
                case 0x3000:
                case 0x4000:
                case 0x5000:
                case 0x6000:
                case 0x7000:
                    cartridge.read(address);
                break;
                case 0x8000:
                case 0x9000:
                    // video.read(address);
                break;


                // A000-BFFF Switchable RAM bank, External RAM 8Kb
                // C000-DFFF Internal RAM 1, Work RAM 8Kb    
                // E000-FDFF Echo of Internal RAM 1 
                // FE00-FE9F OAM, sprite attribute table
                // FEA0-FEFF not used
                // FF00-FF00 I/O ports
                //         --011111 d-pad (3-down 2-up 1-left 1-right)
                //         --101111 3-start 2-select 1-b 1-a
                // FF01-FF4B I/O ports
                // FF4C-FF7F not used 
                // FF80-FFFE Internal RAM 2, High RAM
                // FFFF-FFFF IE register, Interrupt enable register, interrapt switch
                
            }

            return 0;
        },
        write: function(address, byte) {
            switch (address & 0xF000) {
                case 0x8000:
                case 0x9000:
                    // video.write(address, byte);
                break;
            }
        }
    };
}