
function initializeAddressSpace() {
    const ROM_BANK_SIZE = 0x4000, // 16Kb
          RAM_BANK_SIZE = 0x2000; //  8Kb
/*
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
*/

    switch (addr & 0xF000) {
        case 0x8000:
        case 0x9000:
            //осуществляем операции с видеопамятью
            break;
    }

    return {
        read: function(address) {
            return 0;
        },
        write: function(address, byte) {

        },
        load: function() {

        },
        save: function() {

        }
    };

}

function initRam(cartridge) {

    let ram = [];

/*
  прерывания:
    IF (interrupt flags)
    IE (interrupt enable)
    Бит 	Прерывание
    4 	Joypad
    3 	Serial I/O transfer complete
    2 	Timer overflow
    1 	LCDC
    0 	V-Blank




    PPU

*/

    return {
        read: function(addr) {
            return;
        },
        write: function(addr, byte) {
            ;
        }
    }
}

var RAM = initRAM(ROM);
var byte = RAM.read(addr);
RAM.write(addr, byte);

function initCPU(RAM) {

    const CLOCK = 4194304; //Hz

    // Instruction Extender (0xCB)

    // 1-bit flags of register F
    let Z = 0; // Zero Flag
    let N = 0; // Subtract Flag
    let H = 0; // Half Carry Flag
    let C = 0; // Carry Flag

    // 8-bit registers
    let A = 0x00; // Accumulator
    let B = 0x00;
    let C = 0x00;
    let D = 0x00;
    let E = 0x00;
    let H = 0x00;
    let L = 0x00;

    // 16-bit registers
    let PC = 0x0100; // program counter 
    let SP = 0x0000; // stack pointer

    // 1-bit 
    let IME = 0; // interrupt master enable

    return function(opcode) {
        let cycles = 0;
        switch (opcode) {
            // Misc/control instructions
            case 0x00://NOP {1  4} 

                cycles = 4;
            break;
            case 0x10://STOP 0 {2  4} 

                cycles = 4;
                PC = PC + 1;
            break;
            case 0x76://HALT {1  4} 

                cycles = 4;
            break;
            case 0xCB://PREFIX CB {1  4} 
///////////////////////////////////
                cycles = 4;
            break;
            case 0xF3://DI {1  4} 

                cycles = 4;
            break;
            case 0xFB://EI {1  4} 

                cycles = 4;
            break;

            // 16bit load/store/move instructions
            case 0x01://LD BC,d16 {3  12} 

                cycles = 12;
                PC = PC + 2;
            break;
            case 0x08://LD (a16),SP {3  20} 

                cycles = 20;
                PC = PC + 2;
            break;
            case 0x11://LD DE,d16 {3  12} 

                cycles = 12;
                PC = PC + 2;
            break;
            case 0x21://LD HL,d16 {3  12} 

                cycles = 12;
                PC = PC + 2;
            break;
            case 0x31://LD SP,d16 {3  12} 

                cycles = 12;
                PC = PC + 2;
            break;
            case 0xC1://POP BC {1  12} 

                cycles = 12;
            break;
            case 0xC5://PUSH BC {1  16} 

                cycles = 16;
            break;
            case 0xD1://POP DE {1  12} 

                cycles = 12;
            break;
            case 0xD5://PUSH DE {1  16} 

                cycles = 16;
            break;
            case 0xE1://POP HL {1  12} 

                cycles = 12;
            break;
            case 0xE5://PUSH HL {1  16} 

                cycles = 16;
            break;
            case 0xF1://POP AF {1  12} Z N H C
                Z = 1;
                N = 1;
                H = 1;
                C = 1;
                cycles = 12;
            break;
            case 0xF5://PUSH AF {1  16} 

                cycles = 16;
            break;
            case 0xF8://LD HL,SP+r8 {2  12} 0 0 H C
            //0
            //0
                H = 1;
                C = 1;
                cycles = 12;
                PC = PC + 1;
            break;
            case 0xF9://LD SP,HL {1  8} 

                cycles = 8;
            break;

            // 8bit load/store/move instructions
            case 0x02://LD (BC),A {1  8} 

                cycles = 8;
            break;
            case 0x06://LD B,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x0A://LD A,(BC) {1  8} 

                cycles = 8;
            break;
            case 0x0E://LD C,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x12://LD (DE),A {1  8} 

                cycles = 8;
            break;
            case 0x16://LD D,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x1A://LD A,(DE) {1  8} 

                cycles = 8;
            break;
            case 0x1E://LD E,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x22://LD (HL+),A {1  8} 

                cycles = 8;
            break;
            case 0x26://LD H,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x2A://LD A,(HL+) {1  8} 

                cycles = 8;
            break;
            case 0x2E://LD L,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x32://LD (HL-),A {1  8} 

                cycles = 8;
            break;
            case 0x36://LD (HL),d8 {2  12} 

                cycles = 12;
                PC = PC + 1;
            break;
            case 0x3A://LD A,(HL-) {1  8} 

                cycles = 8;
            break;
            case 0x3E://LD A,d8 {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0x40://LD B,B {1  4} 

                cycles = 4;
            break;
            case 0x41://LD B,C {1  4} 

                cycles = 4;
            break;
            case 0x42://LD B,D {1  4} 

                cycles = 4;
            break;
            case 0x43://LD B,E {1  4} 

                cycles = 4;
            break;
            case 0x44://LD B,H {1  4} 

                cycles = 4;
            break;
            case 0x45://LD B,L {1  4} 

                cycles = 4;
            break;
            case 0x46://LD B,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x47://LD B,A {1  4} 

                cycles = 4;
            break;
            case 0x48://LD C,B {1  4} 

                cycles = 4;
            break;
            case 0x49://LD C,C {1  4} 

                cycles = 4;
            break;
            case 0x4A://LD C,D {1  4} 

                cycles = 4;
            break;
            case 0x4B://LD C,E {1  4} 

                cycles = 4;
            break;
            case 0x4C://LD C,H {1  4} 

                cycles = 4;
            break;
            case 0x4D://LD C,L {1  4} 

                cycles = 4;
            break;
            case 0x4E://LD C,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x4F://LD C,A {1  4} 

                cycles = 4;
            break;
            case 0x50://LD D,B {1  4} 

                cycles = 4;
            break;
            case 0x51://LD D,C {1  4} 

                cycles = 4;
            break;
            case 0x52://LD D,D {1  4} 

                cycles = 4;
            break;
            case 0x53://LD D,E {1  4} 

                cycles = 4;
            break;
            case 0x54://LD D,H {1  4} 

                cycles = 4;
            break;
            case 0x55://LD D,L {1  4} 

                cycles = 4;
            break;
            case 0x56://LD D,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x57://LD D,A {1  4} 

                cycles = 4;
            break;
            case 0x58://LD E,B {1  4} 

                cycles = 4;
            break;
            case 0x59://LD E,C {1  4} 

                cycles = 4;
            break;
            case 0x5A://LD E,D {1  4} 

                cycles = 4;
            break;
            case 0x5B://LD E,E {1  4} 

                cycles = 4;
            break;
            case 0x5C://LD E,H {1  4} 

                cycles = 4;
            break;
            case 0x5D://LD E,L {1  4} 

                cycles = 4;
            break;
            case 0x5E://LD E,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x5F://LD E,A {1  4} 

                cycles = 4;
            break;
            case 0x60://LD H,B {1  4} 

                cycles = 4;
            break;
            case 0x61://LD H,C {1  4} 

                cycles = 4;
            break;
            case 0x62://LD H,D {1  4} 

                cycles = 4;
            break;
            case 0x63://LD H,E {1  4} 

                cycles = 4;
            break;
            case 0x64://LD H,H {1  4} 

                cycles = 4;
            break;
            case 0x65://LD H,L {1  4} 

                cycles = 4;
            break;
            case 0x66://LD H,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x67://LD H,A {1  4} 

                cycles = 4;
            break;
            case 0x68://LD L,B {1  4} 

                cycles = 4;
            break;
            case 0x69://LD L,C {1  4} 

                cycles = 4;
            break;
            case 0x6A://LD L,D {1  4} 

                cycles = 4;
            break;
            case 0x6B://LD L,E {1  4} 

                cycles = 4;
            break;
            case 0x6C://LD L,H {1  4} 

                cycles = 4;
            break;
            case 0x6D://LD L,L {1  4} 

                cycles = 4;
            break;
            case 0x6E://LD L,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x6F://LD L,A {1  4} 

                cycles = 4;
            break;
            case 0x70://LD (HL),B {1  8} 

                cycles = 8;
            break;
            case 0x71://LD (HL),C {1  8} 

                cycles = 8;
            break;
            case 0x72://LD (HL),D {1  8} 

                cycles = 8;
            break;
            case 0x73://LD (HL),E {1  8} 

                cycles = 8;
            break;
            case 0x74://LD (HL),H {1  8} 

                cycles = 8;
            break;
            case 0x75://LD (HL),L {1  8} 

                cycles = 8;
            break;
            case 0x77://LD (HL),A {1  8} 

                cycles = 8;
            break;
            case 0x78://LD A,B {1  4} 

                cycles = 4;
            break;
            case 0x79://LD A,C {1  4} 

                cycles = 4;
            break;
            case 0x7A://LD A,D {1  4} 

                cycles = 4;
            break;
            case 0x7B://LD A,E {1  4} 

                cycles = 4;
            break;
            case 0x7C://LD A,H {1  4} 

                cycles = 4;
            break;
            case 0x7D://LD A,L {1  4} 

                cycles = 4;
            break;
            case 0x7E://LD A,(HL) {1  8} 

                cycles = 8;
            break;
            case 0x7F://LD A,A {1  4} 

                cycles = 4;
            break;
            case 0xE0://LDH (a8),A {2  12} 

                cycles = 12;
                PC = PC + 1;
            break;
            case 0xE2://LD (C),A {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0xEA://LD (a16),A {3  16} 

                cycles = 16;
                PC = PC + 2;
            break;
            case 0xF0://LDH A,(a8) {2  12} 

                cycles = 12;
                PC = PC + 1;
            break;
            case 0xF2://LD A,(C) {2  8} 

                cycles = 8;
                PC = PC + 1;
            break;
            case 0xFA://LD A,(a16) {3  16} 

                cycles = 16;
                PC = PC + 2;
            break;

            // 16bit arithmetic/logical instructions
            case 0x03://INC BC {1  8} 

                cycles = 8;
            break;
            case 0x09://ADD HL,BC {1  8} - 0 H C
            //0
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x0B://DEC BC {1  8} 

                cycles = 8;
            break;
            case 0x13://INC DE {1  8} 

                cycles = 8;
            break;
            case 0x19://ADD HL,DE {1  8} - 0 H C
            //0
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x1B://DEC DE {1  8} 

                cycles = 8;
            break;
            case 0x23://INC HL {1  8} 

                cycles = 8;
            break;
            case 0x29://ADD HL,HL {1  8} - 0 H C
            //0
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x2B://DEC HL {1  8} 

                cycles = 8;
            break;
            case 0x33://INC SP {1  8} 

                cycles = 8;
            break;
            case 0x39://ADD HL,SP {1  8} - 0 H C
            //0
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x3B://DEC SP {1  8} 

                cycles = 8;
            break;
            case 0xE8://ADD SP,r8 {2  16} 0 0 H C
            //0
            //0
                H = 1;
                C = 1;
                cycles = 16;
                PC = PC + 1;
            break;

            // 8bit arithmetic/logical instructions
            case 0x04://INC B {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x05://DEC B {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x0C://INC C {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x0D://DEC C {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x14://INC D {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x15://DEC D {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x1C://INC E {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x1D://DEC E {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x24://INC H {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x25://DEC H {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x27://DAA {1  4} Z - 0 C
                Z = 1;
            //0
                C = 1;
                cycles = 4;
            break;
            case 0x2C://INC L {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x2D://DEC L {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x2F://CPL {1  4} - 1 1 -
            //1
            //1
                cycles = 4;
            break;
            case 0x34://INC (HL) {1  12} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 12;
            break;
            case 0x35://DEC (HL) {1  12} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 12;
            break;
            case 0x37://SCF {1  4} - 0 0 1
            //0
            //0
            //1
                cycles = 4;
            break;
            case 0x3C://INC A {1  4} Z 0 H -
                Z = 1;
            //0
                H = 1;
                cycles = 4;
            break;
            case 0x3D://DEC A {1  4} Z 1 H -
                Z = 1;
            //1
                H = 1;
                cycles = 4;
            break;
            case 0x3F://CCF {1  4} - 0 0 C
            //0
            //0
                C = 1;
                cycles = 4;
            break;
            case 0x80://ADD A,B {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x81://ADD A,C {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x82://ADD A,D {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x83://ADD A,E {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x84://ADD A,H {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x85://ADD A,L {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x86://ADD A,(HL) {1  8} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x87://ADD A,A {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x88://ADC A,B {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x89://ADC A,C {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x8A://ADC A,D {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x8B://ADC A,E {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x8C://ADC A,H {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x8D://ADC A,L {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x8E://ADC A,(HL) {1  8} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x8F://ADC A,A {1  4} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x90://SUB B {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x91://SUB C {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x92://SUB D {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x93://SUB E {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x94://SUB H {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x95://SUB L {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x96://SUB (HL) {1  8} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x97://SUB A {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x98://SBC A,B {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x99://SBC A,C {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x9A://SBC A,D {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x9B://SBC A,E {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x9C://SBC A,H {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x9D://SBC A,L {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0x9E://SBC A,(HL) {1  8} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0x9F://SBC A,A {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xA0://AND B {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA1://AND C {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA2://AND D {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA3://AND E {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA4://AND H {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA5://AND L {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA6://AND (HL) {1  8} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 8;
            break;
            case 0xA7://AND A {1  4} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 4;
            break;
            case 0xA8://XOR B {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xA9://XOR C {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xAA://XOR D {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xAB://XOR E {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xAC://XOR H {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xAD://XOR L {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xAE://XOR (HL) {1  8} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 8;
            break;
            case 0xAF://XOR A {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB0://OR B {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB1://OR C {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB2://OR D {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB3://OR E {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB4://OR H {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB5://OR L {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB6://OR (HL) {1  8} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 8;
            break;
            case 0xB7://OR A {1  4} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 4;
            break;
            case 0xB8://CP B {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xB9://CP C {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xBA://CP D {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xBB://CP E {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xBC://CP H {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xBD://CP L {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xBE://CP (HL) {1  8} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 8;
            break;
            case 0xBF://CP A {1  4} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 4;
            break;
            case 0xC6://ADD A,d8 {2  8} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xCE://ADC A,d8 {2  8} Z 0 H C
                Z = 1;
            //0
                H = 1;
                C = 1;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xD6://SUB d8 {2  8} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xDE://SBC A,d8 {2  8} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xE6://AND d8 {2  8} Z 0 1 0
                Z = 1;
            //0
            //1
            //0
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xEE://XOR d8 {2  8} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xF6://OR d8 {2  8} Z 0 0 0
                Z = 1;
            //0
            //0
            //0
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xFE://CP d8 {2  8} Z 1 H C
                Z = 1;
            //1
                H = 1;
                C = 1;
                cycles = 8;
                PC = PC + 1;
            break;

            // 8bit rotations/shifts and bit instructions
            case 0x07://RLCA {1  4} 0 0 0 C
            //0
            //0
            //0
                C = 1;
                cycles = 4;
            break;
            case 0x0F://RRCA {1  4} 0 0 0 C
            //0
            //0
            //0
                C = 1;
                cycles = 4;
            break;
            case 0x17://RLA {1  4} 0 0 0 C
            //0
            //0
            //0
                C = 1;
                cycles = 4;
            break;
            case 0x1F://RRA {1  4} 0 0 0 C
            //0
            //0
            //0
                C = 1;
                cycles = 4;
            break;

            // Jumps/calls
            case 0x18://JR r8 {2  12} 

                cycles = 12;
                PC = PC + 1;
            break;
            case 0x20://JR NZ,r8 {2  12/8} 

                cycles = 12;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0x28://JR Z,r8 {2  12/8} 

                cycles = 12;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0x30://JR NC,r8 {2  12/8} 

                cycles = 12;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0x38://JR C,r8 {2  12/8} 

                cycles = 12;
                cycles = 8;
                PC = PC + 1;
            break;
            case 0xC0://RET NZ {1  20/8} 

                cycles = 20;
                cycles = 8;
            break;
            case 0xC2://JP NZ,a16 {3  16/12} 

                cycles = 16;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xC3://JP a16 {3  16} 

                cycles = 16;
                PC = PC + 2;
            break;
            case 0xC4://CALL NZ,a16 {3  24/12} 

                cycles = 24;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xC7://RST 00H {1  16} 

                cycles = 16;
            break;
            case 0xC8://RET Z {1  20/8} 

                cycles = 20;
                cycles = 8;
            break;
            case 0xC9://RET {1  16} 

                cycles = 16;
            break;
            case 0xCA://JP Z,a16 {3  16/12} 

                cycles = 16;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xCC://CALL Z,a16 {3  24/12} 

                cycles = 24;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xCD://CALL a16 {3  24} 

                cycles = 24;
                PC = PC + 2;
            break;
            case 0xCF://RST 08H {1  16} 

                cycles = 16;
            break;
            case 0xD0://RET NC {1  20/8} 

                cycles = 20;
                cycles = 8;
            break;
            case 0xD2://JP NC,a16 {3  16/12} 

                cycles = 16;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xD4://CALL NC,a16 {3  24/12} 

                cycles = 24;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xD7://RST 10H {1  16} 

                cycles = 16;
            break;
            case 0xD8://RET C {1  20/8} 

                cycles = 20;
                cycles = 8;
            break;
            case 0xD9://RETI {1  16} 

                cycles = 16;
            break;
            case 0xDA://JP C,a16 {3  16/12} 

                cycles = 16;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xDC://CALL C,a16 {3  24/12} 

                cycles = 24;
                cycles = 12;
                PC = PC + 2;
            break;
            case 0xDF://RST 18H {1  16} 

                cycles = 16;
            break;
            case 0xE7://RST 20H {1  16} 

                cycles = 16;
            break;
            case 0xE9://JP (HL) {1  4} 

                cycles = 4;
            break;
            case 0xEF://RST 28H {1  16} 

                cycles = 16;
            break;
            case 0xF7://RST 30H {1  16} 

                cycles = 16;
            break;
            case 0xFF://RST 38H {1  16} 

                cycles = 16;
            break;

            // undefined
            case 0xD3:break;
            case 0xDB:break;
            case 0xDD:break;
            case 0xE3:break;
            case 0xE4:break;
            case 0xEB:break;
            case 0xEC:break;
            case 0xED:break;
            case 0xF4:break;
            case 0xFC:break;
            case 0xFD:break;
        }
        PC = PC + 1;
    };
}

let CPU = initCPU(initRAM(ROM));

CPU(opcode);























const A = 0;
const B = 1;
const C = 2;
const D = 3;
const E = 4;
const F = 5;
const H = 6;
const L = 7;

const PC = 0; // program counter
const SP = 1; // stack pointer

class LR35902 {
    constructor() {
        // 8-bit registers                     A     B     C     D     E     F     H     L
        //this.registers8bit = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x00,       0x00, 0x00]);

        // 16-bit registers                      PC      SP
        //this.registers16bit = new Uint16Array([0x0100, 0x0000]);

        // 1-bit flags of register F
        this.Z = 0b0; // Zero Flag
        this.N = 0b0; // Subtract Flag
        this.H = 0b0; // Half Carry Flag
        this.C = 0b0; // Carry Flag

        // 8-bit registers
        this.A = 0x00;
        this.B = 0x00;
        this.C = 0x00;
        this.D = 0x00;
        this.E = 0x00;
        //this.F = 0x00; 
        this.H = 0x00;
        this.L = 0x00;

        // 16-bit registers
        this.PC = 0x0100;
        this.SP = 0x0000;
        // this.AF = {A: , F: };
        // this.BC = {B: , C: };
        // this.DE = {D: , E: };
        // this.HL = {H: , L: };

        this.IME = 0; // interrupt master enable
        
        //Interrupts
        //IF (interrupt flags) 
        //IE (interrupt enable)
        // Бит 	Прерывание
        // 4 	Joypad
        // 3 	Serial I/O transfer complete
        // 2 	Timer overflow
        // 1 	LCDC
        // 0 	V-Blank

        //opcode 0xCB

    }

    step() {

    }


    read(opcode) {
        // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html


            

        //                  |INS reg|← Instruction mnemonic
        // Length in bytes →|  2 8  |← Duration in cycles
        //                  |Z N H C|← Flags affected

    }

}