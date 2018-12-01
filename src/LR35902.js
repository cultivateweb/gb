// 4213440 ticks per second

const CLOCK = 4194304; //Hz

const AF = 0; //accumulator+flag registers
const BC = 1;
const DE = 2;
const HL = 3;
const PC = 4; // program counter 
const SP = 5; // stack pointer

const d16 = 6;

// flag masks of register F [Z N H C 0 0 0 0]
const FLAG_MASK_Z = 0x80; // Zero Flag
const FLAG_MASK_N = 0x40; // Subtract Flag
const FLAG_MASK_H = 0x20; // Half Carry Flag
const FLAG_MASK_C = 0x10; // Carry Flag

const LENGTTHS = [1,3,1,1,1,1,2,1,3,1,1,1,1,1,2,1,2,3,1,1,1,
                  1,2,1,2,1,1,1,1,1,2,1,2,3,1,1,1,1,2,1,2,1,
                  1,1,1,1,2,1,2,3,1,1,1,1,2,1,2,1,1,1,1,1,2,
                  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                  1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
                  1,1,1,1,1,3,3,3,1,2,1,1,1,3,1,3,3,2,1,1,1,
                  3,0,3,1,2,1,1,1,3,0,3,0,2,1,2,1,2,0,0,1,2,
                  1,2,1,3,0,0,0,2,1,2,1,2,1,0,1,2,1,2,1,3,1,
                  0,0,2,1];

const CYCLES1 = [4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,
                4,8,4,12,8,8,8,4,4,8,4,12,12,8,8,4,4,8,4,12,8,
                8,8,4,4,8,4,12,12,8,8,12,12,12,4,12,8,8,8,4,4,
                8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,
                4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,
                4,4,8,4,8,8,8,8,8,8,4,8,4,4,4,4,4,4,8,4,4,4,4,
                4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,
                4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,
                4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,20,12,16,16,24,
                16,8,16,20,16,16,4,24,24,8,16,20,12,16,0,24,16,
                8,16,20,16,16,0,24,0,8,16,12,12,8,0,0,16,8,16,
                16,4,16,0,0,0,8,16,12,12,8,4,0,16,8,16,12,8,16,
                4,0,0,8,16];

const CYCLES2 = [4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,
                 4,8,4,12,8,8,8,4,4,8,4,8,12,8,8,4,4,8,4,8,
                 8,8,8,4,4,8,4,8,12,8,8,12,12,12,4,8,8,8,8,
                 4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,
                 4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,
                 4,4,8,4,8,8,8,8,8,8,4,8,4,4,4,4,4,4,8,4,4,4,4,4,
                 4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,
                 4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,
                 4,4,8,4,4,4,4,4,4,4,8,4,8,12,12,16,12,
                 16,8,16,8,16,12,4,12,24,8,16,8,12,
                 12,0,12,16,8,16,8,16,12,0,12,0,8,
                 16,12,12,8,0,0,16,8,16,16,4,16,0,0,0,8,16,12,12,
                 8,4,0,16,8,16,12,8,16,4,0,0,8,16];

const OPCODES = [
    /* 0x00 NOP          */ function(){nop();},
    /* 0x01 LD BC,d16    */ function(){mov16FromRam(BC,d16);},
    /* 0x02 LD (BC),A    */ function(){mov((BC),A);},
    /* 0x03 INC BC       */ function(){inc(BC);},
    /* 0x04 INC B        */ function(){inc(B);},
    /* 0x05 DEC B        */ function(){dec(B);},
    /* 0x06 LD B,d8      */ function(){mov(B,d8);},
    /* 0x07 RLCA         */ function(){rlca();},
    /* 0x08 LD (a16),SP  */ function(){mov((a16),SP);},
    /* 0x09 ADD HL,BC    */ function(){add(HL,BC);},
    /* 0x0A LD A,(BC)    */ function(){mov(A,(BC));},
    /* 0x0B DEC BC       */ function(){dec(BC);},
    /* 0x0C INC C        */ function(){inc(C);},
    /* 0x0D DEC C        */ function(){dec(C);},
    /* 0x0E LD C,d8      */ function(){mov(C,d8);},
    /* 0x0F RRCA         */ function(){rrca();},
    /* 0x10 STOP 0       */ function(){stop();},
    /* 0x11 LD DE,d16    */ function(){mov16FromRam(DE,d16);},
    /* 0x12 LD (DE),A    */ function(){mov((DE),A);},
    /* 0x13 INC DE       */ function(){inc(DE);},
    /* 0x14 INC D        */ function(){inc(D);},
    /* 0x15 DEC D        */ function(){dec(D);},
    /* 0x16 LD D,d8      */ function(){mov(D,d8);},
    /* 0x17 RLA          */ function(){rla();},
    /* 0x18 JR r8        */ function(){},
    /* 0x19 ADD HL,DE    */ function(){add(HL,DE);},
    /* 0x1A LD A,(DE)    */ function(){mov(A,(DE));},
    /* 0x1B DEC DE       */ function(){dec(DE);},
    /* 0x1C INC E        */ function(){inc(E);},
    /* 0x1D DEC E        */ function(){dec(E);},
    /* 0x1E LD E,d8      */ function(){mov(E,d8);},
    /* 0x1F RRA          */ function(){rra();},
    /* 0x20 JR NZ,r8     */ function(){},
    /* 0x21 LD HL,d16    */ function(){mov16FromRam(HL,d16);},
    /* 0x22 LD (HL+),A   */ function(){mov((HL+),A);},
    /* 0x23 INC HL       */ function(){inc(HL);},
    /* 0x24 INC H        */ function(){inc(H);},
    /* 0x25 DEC H        */ function(){dec(H);},
    /* 0x26 LD H,d8      */ function(){mov(H,d8);},
    /* 0x27 DAA          */ function(){dda();},
    /* 0x28 JR Z,r8      */ function(){},
    /* 0x29 ADD HL,HL    */ function(){add(HL,HL);},
    /* 0x2A LD A,(HL+)   */ function(){mov(A,(HL+));},
    /* 0x2B DEC HL       */ function(){dec(HL);},
    /* 0x2C INC L        */ function(){inc(L);},
    /* 0x2D DEC L        */ function(){dec(L);},
    /* 0x2E LD L,d8      */ function(){mov(L,d8);},
    /* 0x2F CPL          */ function(){},
    /* 0x30 JR NC,r8     */ function(){},
    /* 0x31 LD SP,d16    */ function(){mov16FromRam(SP,d16);},
    /* 0x32 LD (HL-),A   */ function(){mov((HL-),A);},
    /* 0x33 INC SP       */ function(){inc(SP);},
    /* 0x34 INC (HL)     */ function(){inc((HL));},
    /* 0x35 DEC (HL)     */ function(){dec((HL));},
    /* 0x36 LD (HL),d8   */ function(){mov((HL),d8);},
    /* 0x37 SCF          */ function(){},
    /* 0x38 JR C,r8      */ function(){},
    /* 0x39 ADD HL,SP    */ function(){add(HL,SP);},
    /* 0x3A LD A,(HL-)   */ function(){mov(A,(HL-));},
    /* 0x3B DEC SP       */ function(){dec(SP);},
    /* 0x3C INC A        */ function(){inc(A);},
    /* 0x3D DEC A        */ function(){dec(A);},
    /* 0x3E LD A,d8      */ function(){mov(A,d8);},
    /* 0x3F CCF          */ function(){},
    /* 0x40 LD B,B       */ function(){mov(B,B);},
    /* 0x41 LD B,C       */ function(){mov(B,C);},
    /* 0x42 LD B,D       */ function(){mov(B,D);},
    /* 0x43 LD B,E       */ function(){mov(B,E);},
    /* 0x44 LD B,H       */ function(){mov(B,H);},
    /* 0x45 LD B,L       */ function(){mov(B,L);},
    /* 0x46 LD B,(HL)    */ function(){mov(B,(HL));},
    /* 0x47 LD B,A       */ function(){mov(B,A);},
    /* 0x48 LD C,B       */ function(){mov(C,B);},
    /* 0x49 LD C,C       */ function(){mov(C,C);},
    /* 0x4A LD C,D       */ function(){mov(C,D);},
    /* 0x4B LD C,E       */ function(){mov(C,E);},
    /* 0x4C LD C,H       */ function(){mov(C,H);},
    /* 0x4D LD C,L       */ function(){mov(C,L);},
    /* 0x4E LD C,(HL)    */ function(){mov(C,(HL));},
    /* 0x4F LD C,A       */ function(){mov(C,A);},
    /* 0x50 LD D,B       */ function(){mov(D,B);},
    /* 0x51 LD D,C       */ function(){mov(D,C);},
    /* 0x52 LD D,D       */ function(){mov(D,D);},
    /* 0x53 LD D,E       */ function(){mov(D,E);},
    /* 0x54 LD D,H       */ function(){mov(D,H);},
    /* 0x55 LD D,L       */ function(){mov(D,L);},
    /* 0x56 LD D,(HL)    */ function(){mov(D,(HL));},
    /* 0x57 LD D,A       */ function(){mov(D,A);},
    /* 0x58 LD E,B       */ function(){mov(E,B);},
    /* 0x59 LD E,C       */ function(){mov(E,C);},
    /* 0x5A LD E,D       */ function(){mov(E,D);},
    /* 0x5B LD E,E       */ function(){mov(E,E);},
    /* 0x5C LD E,H       */ function(){mov(E,H);},
    /* 0x5D LD E,L       */ function(){mov(E,L);},
    /* 0x5E LD E,(HL)    */ function(){mov(E,(HL));},
    /* 0x5F LD E,A       */ function(){mov(E,A);},
    /* 0x60 LD H,B       */ function(){mov(H,B);},
    /* 0x61 LD H,C       */ function(){mov(H,C);},
    /* 0x62 LD H,D       */ function(){mov(H,D);},
    /* 0x63 LD H,E       */ function(){mov(H,E);},
    /* 0x64 LD H,H       */ function(){mov(H,H);},
    /* 0x65 LD H,L       */ function(){mov(H,L);},
    /* 0x66 LD H,(HL)    */ function(){mov(H,(HL));},
    /* 0x67 LD H,A       */ function(){mov(H,A);},
    /* 0x68 LD L,B       */ function(){mov(L,B);},
    /* 0x69 LD L,C       */ function(){mov(L,C);},
    /* 0x6A LD L,D       */ function(){mov(L,D);},
    /* 0x6B LD L,E       */ function(){mov(L,E);},
    /* 0x6C LD L,H       */ function(){mov(L,H);},
    /* 0x6D LD L,L       */ function(){mov(L,L);},
    /* 0x6E LD L,(HL)    */ function(){mov(L,(HL));},
    /* 0x6F LD L,A       */ function(){mov(L,A);},
    /* 0x70 LD (HL),B    */ function(){mov((HL),B);},
    /* 0x71 LD (HL),C    */ function(){mov((HL),C);},
    /* 0x72 LD (HL),D    */ function(){mov((HL),D);},
    /* 0x73 LD (HL),E    */ function(){mov((HL),E);},
    /* 0x74 LD (HL),H    */ function(){mov((HL),H);},
    /* 0x75 LD (HL),L    */ function(){mov((HL),L);},
    /* 0x76 HALT         */ function(){halt();},
    /* 0x77 LD (HL),A    */ function(){mov((HL),A);},
    /* 0x78 LD A,B       */ function(){mov(A,B);},
    /* 0x79 LD A,C       */ function(){mov(A,C);},
    /* 0x7A LD A,D       */ function(){mov(A,D);},
    /* 0x7B LD A,E       */ function(){mov(A,E);},
    /* 0x7C LD A,H       */ function(){mov(A,H);},
    /* 0x7D LD A,L       */ function(){mov(A,L);},
    /* 0x7E LD A,(HL)    */ function(){mov(A,(HL));},
    /* 0x7F LD A,A       */ function(){mov(A,A);},
    /* 0x80 ADD A,B      */ function(){add(A,B);},
    /* 0x81 ADD A,C      */ function(){add(A,C);},
    /* 0x82 ADD A,D      */ function(){add(A,D);},
    /* 0x83 ADD A,E      */ function(){add(A,E);},
    /* 0x84 ADD A,H      */ function(){add(A,H);},
    /* 0x85 ADD A,L      */ function(){add(A,L);},
    /* 0x86 ADD A,(HL)   */ function(){add(A,(HL));},
    /* 0x87 ADD A,A      */ function(){add(A,A);},
    /* 0x88 ADC A,B      */ function(){},
    /* 0x89 ADC A,C      */ function(){},
    /* 0x8A ADC A,D      */ function(){},
    /* 0x8B ADC A,E      */ function(){},
    /* 0x8C ADC A,H      */ function(){},
    /* 0x8D ADC A,L      */ function(){},
    /* 0x8E ADC A,(HL)   */ function(){},
    /* 0x8F ADC A,A      */ function(){},
    /* 0x90 SUB B        */ function(){},
    /* 0x91 SUB C        */ function(){},
    /* 0x92 SUB D        */ function(){},
    /* 0x93 SUB E        */ function(){},
    /* 0x94 SUB H        */ function(){},
    /* 0x95 SUB L        */ function(){},
    /* 0x96 SUB (HL)     */ function(){},
    /* 0x97 SUB A        */ function(){},
    /* 0x98 SBC A,B      */ function(){},
    /* 0x99 SBC A,C      */ function(){},
    /* 0x9A SBC A,D      */ function(){},
    /* 0x9B SBC A,E      */ function(){},
    /* 0x9C SBC A,H      */ function(){},
    /* 0x9D SBC A,L      */ function(){},
    /* 0x9E SBC A,(HL)   */ function(){},
    /* 0x9F SBC A,A      */ function(){},
    /* 0xA0 AND B        */ function(){},
    /* 0xA1 AND C        */ function(){},
    /* 0xA2 AND D        */ function(){},
    /* 0xA3 AND E        */ function(){},
    /* 0xA4 AND H        */ function(){},
    /* 0xA5 AND L        */ function(){},
    /* 0xA6 AND (HL)     */ function(){},
    /* 0xA7 AND A        */ function(){},
    /* 0xA8 XOR B        */ function(){},
    /* 0xA9 XOR C        */ function(){},
    /* 0xAA XOR D        */ function(){},
    /* 0xAB XOR E        */ function(){},
    /* 0xAC XOR H        */ function(){},
    /* 0xAD XOR L        */ function(){},
    /* 0xAE XOR (HL)     */ function(){},
    /* 0xAF XOR A        */ function(){},
    /* 0xB0 OR B         */ function(){},
    /* 0xB1 OR C         */ function(){},
    /* 0xB2 OR D         */ function(){},
    /* 0xB3 OR E         */ function(){},
    /* 0xB4 OR H         */ function(){},
    /* 0xB5 OR L         */ function(){},
    /* 0xB6 OR (HL)      */ function(){},
    /* 0xB7 OR A         */ function(){},
    /* 0xB8 CP B         */ function(){},
    /* 0xB9 CP C         */ function(){},
    /* 0xBA CP D         */ function(){},
    /* 0xBB CP E         */ function(){},
    /* 0xBC CP H         */ function(){},
    /* 0xBD CP L         */ function(){},
    /* 0xBE CP (HL)      */ function(){},
    /* 0xBF CP A         */ function(){},
    /* 0xC0 RET NZ       */ function(){},
    /* 0xC1 POP BC       */ function(){pop(BC);},
    /* 0xC2 JP NZ,a16    */ function(){},
    /* 0xC3 JP a16       */ function(){},
    /* 0xC4 CALL NZ,a16  */ function(){},
    /* 0xC5 PUSH BC      */ function(){push(BC);},
    /* 0xC6 ADD A,d8     */ function(){add(A,d8);},
    /* 0xC7 RST 00H      */ function(){},
    /* 0xC8 RET Z        */ function(){},
    /* 0xC9 RET          */ function(){},
    /* 0xCA JP Z,a16     */ function(){},
    /* 0xCB PREFIX CB    */ function(){},
    /* 0xCC CALL Z,a16   */ function(){},
    /* 0xCD CALL a16     */ function(){},
    /* 0xCE ADC A,d8     */ function(){},
    /* 0xCF RST 08H      */ function(){},
    /* 0xD0 RET NC       */ function(){},
    /* 0xD1 POP DE       */ function(){pop(DE);},
    /* 0xD2 JP NC,a16    */ function(){},
    /* 0xD3              */ function(){},
    /* 0xD4 CALL NC,a16  */ function(){},
    /* 0xD5 PUSH DE      */ function(){push(DE);},
    /* 0xD6 SUB d8       */ function(){},
    /* 0xD7 RST 10H      */ function(){},
    /* 0xD8 RET C        */ function(){},
    /* 0xD9 RETI         */ function(){reti();},
    /* 0xDA JP C,a16     */ function(){},
    /* 0xDB              */ function(){},
    /* 0xDC CALL C,a16   */ function(){},
    /* 0xDD              */ function(){},
    /* 0xDE SBC A,d8     */ function(){},
    /* 0xDF RST 18H      */ function(){},
    /* 0xE0 LDH (a8),A   */ function(){},
    /* 0xE1 POP HL       */ function(){pop(HL);},
    /* 0xE2 LD (C),A     */ function(){mov((C),A);},
    /* 0xE3              */ function(){},
    /* 0xE4              */ function(){},
    /* 0xE5 PUSH HL      */ function(){push(HL);},
    /* 0xE6 AND d8       */ function(){},
    /* 0xE7 RST 20H      */ function(){},
    /* 0xE8 ADD SP,r8    */ function(){add(SP,r8);},
    /* 0xE9 JP (HL)      */ function(){},
    /* 0xEA LD (a16),A   */ function(){mov((a16),A);},
    /* 0xEB              */ function(){},
    /* 0xEC              */ function(){},
    /* 0xED              */ function(){},
    /* 0xEE XOR d8       */ function(){},
    /* 0xEF RST 28H      */ function(){},
    /* 0xF0 LDH A,(a8)   */ function(){},
    /* 0xF1 POP AF       */ function(){pop(AF);},
    /* 0xF2 LD A,(C)     */ function(){mov(A,(C));},
    /* 0xF3 DI           */ function(){di();},
    /* 0xF4              */ function(){},
    /* 0xF5 PUSH AF      */ function(){push(AF);},
    /* 0xF6 OR d8        */ function(){},
    /* 0xF7 RST 30H      */ function(){},
    /* 0xF8 LD HL,SP+r8  */ function(){mov(HL,SP+r8);},
    /* 0xF9 LD SP,HL     */ function(){mov(SP,HL);},
    /* 0xFA LD A,(a16)   */ function(){mov(A,(a16));},
    /* 0xFB EI           */ function(){ei();},
    /* 0xFC              */ function(){},
    /* 0xFD              */ function(){},
    /* 0xFE CP d8        */ function(){},
    /* 0xFF RST 38H      */ function(){}
];                 

export function initLR35902(addressSpace) {
    const REGISTERS = new Uint16Array([0x0100, 0x0013, 0x00D8, 0x014D, 0x0100, 0xFFFE, addressSpace]);

    let IME = false; // interrupt master enable



    let stopped = 0;
    function stop(){ stopped = 1; }
    function resume(){ stopped = 0; }
  
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
           case 4: data = RHL >>> 8; break;
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
              if((data|0) & 1){data = (data >>> 1) + 128|0; FC = 1;
              }else{data = (data >>> 1); FC = 0;}
           }else if((op|0) == 2){ // RL - Rotate left through carry
              if((data|0) >= 128){data = ((data << 1) % 256|0) + FC|0; FC = 1;}
              else{data = ((data << 1) % 256|0) + FC|0; FC = 0;}
           }else if((op|0) == 3){ // RR - Rotate right through carry
              if((data|0) & 1){data = (data >>> 1) + (FC*128|0)|0; FC = 1;}
              else{data = (data >>> 1) + (FC*128|0)|0; FC = 0;}
           }else if((op|0) == 4){ // SLA - Shift left arithmetic
              if((data|0) >= 128) FC = 1; else FC = 0;
              data = (data << 1) % 256|0;
           }else if((op|0) == 5){ // SRA - Shift right arithmetic
              if((data|0) & 1){FC = 1;}else{FC = 0;}
              data = (data >>> 1) + ((data|0)>=128?128:0)|0;
           }else if((op|0) == 6){ // SWAP - Exchange low/hi-nibble
              FC = 0;
              data = (((data|0) % 16|0)*16)|0 + ((data|0) / 16|0);
           }else if((op|0) == 7){ // SRL - Shift right logical
              if(data & 1){FC = 1;}else{FC = 0};
              data = (data >>> 1);
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

    function push(register) {
        addressSpace.write(SP = SP - 1, hi(REGISTERS[register])); 
        addressSpace.write(SP = SP - 1, low(REGISTERS[register]));
    }

    function pop(register) {
        let low = addressSpace.read(SP);
        let hi = addressSpace.read(SP = SP + 1);
        SP = SP + 1;
        REGISTERS[register] = word(low, hi);
    }

    // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    //
    //                  |INS reg|← Instruction mnemonic
    // Length in bytes →|  2 8  |← Duration in cycles
    //                  |Z N H C|← Flags affected
    function exec(opcode) {
        let cycles = 0;
        switch (opcode) {
            // Misc/control instructions
            case 0x00://NOP {1  4}
                // PC = PC + 1;
                // Length = 1
                // cycles = 4;
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
                BC = pop();
                PC = PC + 1; 
                cycles = 12;
            break;
            case 0xD1://POP DE {1  12} 
                DE = pop();
                PC = PC + 1; 
                cycles = 12;
            break;
            case 0xE1://POP HL {1  12} 
                HL = pop();
                PC = PC + 1; 
                cycles = 12;
            break;
            case 0xF1://POP AF {1  12} Z N H C
                AF = pop();
                PC = PC + 1; 
                cycles = 12;
            break;
    
            case 0xC5://PUSH BC {1  16} 
                push(BC);
                PC = PC + 1; 
                cycles = 16;
            break;
            case 0xD5://PUSH DE {1  16} 
                push(DE);
                PC = PC + 1; 
                cycles = 16;
            break;
            case 0xE5://PUSH HL {1  16} 
                push(HL);
                PC = PC + 1; 
                cycles = 16;
            break;
            case 0xF5://PUSH AF {1  16} 
                push(AF);
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

    // Instruction Extender (0xCB)

        }
    };
}