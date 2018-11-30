// 4213440 ticks per second

const CLOCK = 4194304; //Hz

// flag masks of register F
const FLAG_MASK_Z = 0x80; // Zero Flag
const FLAG_MASK_N = 0x40; // Subtract Flag
const FLAG_MASK_H = 0x20; // Half Carry Flag
const FLAG_MASK_C = 0x10; // Carry Flag

export function initLR35902(addressSpace) {

    // 8-bit registers
    let A = 0x01; // Accumulator
    let B = 0x00;
    let C = 0x13;
    let D = 0x00;
    let E = 0xD8;   
    let F = 0x00; // Z N H C 0 0 0 0 
    let H = 0x01;
    let L = 0x4D;

    // 16-bit registers
    let PC = 0x0100; // program counter 
    let SP = 0xFFFE; // stack pointer

    let IME = false; // interrupt master enable



    let stopped = 0;
    function stop(){ stopped = 1; }
    function resume(){ stopped = 0; }
 
    // function addressSpace.read16(address){
    //     address = address|0;
    //     return ((addressSpace.read((address + 1) | 0) | 0) << 8) + (addressSpace.read(address | 0) | 0) | 0;
    // }
  
    // function addressSpace.write16(address, data){
    //     address = address|0;
    //     data = data|0;
    //     addressSpace.write((address + 1) | 0, ((data >>> 0) / (256 >>> 0)) | 0);
    //     addressSpace.write((address    ) | 0, ((data >>> 0) % (256 >>> 0)) | 0);
    // }
  
    function call(address){
        address = address;
        SP = SP - 2;
        addressSpace.write16(SP, PC);
        PC = address;
        SP = (SP + 0x10000) % 0x10000;
    }
  
    function interrupt(address){
        address = address|0;
        if (IME) {
           IME = false;
           call(address);
           resume();
           return 1;
        }
        return 0;
     }


     function cbinstruction(code){
        code = code|0;
        var data = 0;
        var data0 = 0;
        var op = 0;
        
        switch((code|0) % 8|0){
           case 0: data = RB; break;
           case 1: data = RC; break;
           case 2: data = RD; break;
           case 3: data = RE; break;
           case 4: data = RHL >> 8; break;
           case 5: data = RHL & 0xFF; break;
           case 6: data = addressSpace.read(RHL|0)|0; break;
           case 7: data = RA; break;
        }
        data0 = data;
        
        op = (code|0) / 8|0;
        if((op|0) >= 0 & (op|0) <= 7){
           if((op|0) == 0){ // RLC - Rotate left
              if((data|0) >= 128){data = ((data << 1) % 256|0) + 1|0; FC = 1;
              }else{data = (data << 1) % 256|0; FC = 0;}
           }else if((op|0) == 1){ // RRC - Rotate right
              if((data|0) & 1){data = (data >> 1) + 128|0; FC = 1;
              }else{data = (data >> 1); FC = 0;}
           }else if((op|0) == 2){ // RL - Rotate left through carry
              if((data|0) >= 128){data = ((data << 1) % 256|0) + FC|0; FC = 1;}
              else{data = ((data << 1) % 256|0) + FC|0; FC = 0;}
           }else if((op|0) == 3){ // RR - Rotate right through carry
              if((data|0) & 1){data = (data >> 1) + (FC*128|0)|0; FC = 1;}
              else{data = (data >> 1) + (FC*128|0)|0; FC = 0;}
           }else if((op|0) == 4){ // SLA - Shift left arithmetic
              if((data|0) >= 128) FC = 1; else FC = 0;
              data = (data << 1) % 256|0;
           }else if((op|0) == 5){ // SRA - Shift right arithmetic
              if((data|0) & 1){FC = 1;}else{FC = 0;}
              data = (data >> 1) + ((data|0)>=128?128:0)|0;
           }else if((op|0) == 6){ // SWAP - Exchange low/hi-nibble
              FC = 0;
              data = (((data|0) % 16|0)*16)|0 + ((data|0) / 16|0);
           }else if((op|0) == 7){ // SRL - Shift right logical
              if(data & 1){FC = 1;}else{FC = 0};
              data = (data >> 1);
           }
           if((data|0) == 0) FZ = 1; else FZ = 0;
           FN = 0;
           FH = 0;
        }
        if((op|0) >= 8 & (op|0) <=15){
           FN = 0;
           FH = 1;
           if((data & (1 << (op-8))) == 0) FZ = 1; else FZ = 0;
        }
        if((op|0) >= 16 & (op|0) <=23){
           data = data & ~(1<<(op-16)) |0;
        }
        if((op|0) >= 24 & (op|0) <=31){
           data = data | 1<<(op-24);
        }
        
        if((data0|0) != (data|0)){
           switch((code|0) % 8 |0){
              case 0: RB = (data|0) % 256|0; break;
              case 1: RC = (data|0) % 256|0; break;
              case 2: RD = (data|0) % 256|0; break;
              case 3: RE = (data|0) % 256|0; break;
              case 4: setH((data|0) % 256|0); break;
              case 5: setL((data|0) % 256|0); break;
              case 6: addressSpace.write(RHL|0, (data|0) % 256|0); break;
              case 7: RA = (data|0) % 256|0; break;
           }
        }
     }
     
    // addressSpace.read(address);
    // addressSpace.write(address, value);


    function word(low, hi) { return hi << 8 | low; }
    function hi(word) { return word >>> 8; }
    function low(word) { return word & 0xFF; }

    function exec(opcode) {
        let cycles = 0;
        switch (opcode) {
            // Misc/control instructions
            case 0x00://NOP {1  4}
                PC = PC + 1;
                cycles = 4;
            break;
            case 0x10://STOP 0 {2  4} 
                //stop();
                PC = PC + 1;
                cycles = 4;
            break;
            case 0x76://HALT {1  4} 
                //if (IME) stop();
                PC = PC + 1; 
                cycles = 4;
            break;
            case 0xCB://PREFIX CB {1  4} 
                PC = PC + 1; 
                cbinstruction(
                    addressSpace.read(PC)
                );
                PC = PC + 1; 
                cycles = 4; //8?
            break;
            case 0xF3://DI {1  4} 
                IME = false; 
                PC = PC + 1; 
                cycles = 4;
            break;
            case 0xFB://EI {1  4} 
                IME = true; 
                PC = PC + 1; 
                //executeInt();
                cycles = 4;
            break;
    
            // 16bit load/store/move instructions
            case 0xC1://POP BC {1  12} 
                C = addressSpace.read(SP);
                B = addressSpace.read(SP = SP + 1);
                SP = SP + 1;
                PC = PC + 1; 
                cycles = 12;
            break;
            case 0xD1://POP DE {1  12} 
                E = addressSpace.read(SP);
                D = addressSpace.read(SP = SP + 1);
                SP = SP + 1;
                PC = PC + 1; 
                cycles = 12;
            break;
            case 0xE1://POP HL {1  12} 
                L = addressSpace.read(SP);
                H = addressSpace.read(SP = SP + 1);
                SP = SP + 1;
                PC = PC + 1; 
                cycles = 12;
            break;
            case 0xF1://POP AF {1  12} Z N H C
                F = addressSpace.read(SP);
                A = addressSpace.read(SP = SP + 1);
                SP = SP + 1;
                PC = PC + 1; 
                cycles = 12;
            break;
    
            case 0xC5://PUSH BC {1  16} 
                addressSpace.write(SP = SP - 1, B); 
                addressSpace.write(SP = SP - 1, C); 
                PC = PC + 1; 
                cycles = 16;
            break;
            case 0xD5://PUSH DE {1  16} 
                addressSpace.write(SP = SP - 1, D); 
                addressSpace.write(SP = SP - 1, E); 
                PC = PC + 1; 
                cycles = 16;
            break;
            case 0xE5://PUSH HL {1  16} 
                addressSpace.write(SP = SP - 1, H); 
                addressSpace.write(SP = SP - 1, L); 
                PC = PC + 1; 
                cycles = 16;
            break;
            case 0xF5://PUSH AF {1  16} 
                addressSpace.write(SP = SP - 1, A);
                addressSpace.write(SP = SP - 1, F);
                PC = PC + 1; 
                cycles = 16;
            break;
    
            case 0x01://LD BC,d16 {3  12} 
                C = addressSpace.read(PC = PC + 1);
                B = addressSpace.read(PC = PC + 1);
                PC = PC + 1;
                cycles = 12;
            break;
            case 0x08://LD (a16),SP {3  20} 
                addressSpace.write( addressSpace.read(PC = PC + 1), low(SP) );
                addressSpace.write( addressSpace.read(PC = PC + 1),  hi(SP) );
                PC = PC + 1;
                cycles = 20;
            break;
            case 0x11://LD DE,d16 {3  12} 
                E = addressSpace.read(PC = PC + 1);
                D = addressSpace.read(PC = PC + 1);
                PC = PC + 1;
                cycles = 12;
            break;
            case 0x21://LD HL,d16 {3  12} 
                L = addressSpace.read(PC = PC + 1);
                H = addressSpace.read(PC = PC + 1);
                PC = PC + 1;
                cycles = 12;
            break;
            case 0x31://LD SP,d16 {3  12} 
                SP = word(addressSpace.read(PC = PC + 1), 
                          addressSpace.read(PC = PC + 1));
                PC = PC + 1;
                cycles = 12;
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
    }

    return {
        run: function() {
        // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
        //
        //                  |INS reg|← Instruction mnemonic
        // Length in bytes →|  2 8  |← Duration in cycles
        //                  |Z N H C|← Flags affected

    // Instruction Extender (0xCB)

        }
    };
}