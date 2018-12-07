// 4213440 ticks per second

const CLOCK = 4194304; //Hz

const OPCODE_LENGTTHS = [
    1,3,1,1,1,1,2,1,3,1,1,1,1,1,2,1,2,3,1,1,1,
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

const OPCODE_CYCLES1 = [
    4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,
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

const OPCODE_CYCLES2 = [
    4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,
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

export function initLR35902(addressSpace) {
    let IME = false; // interrupt master enable

    let A = 0x01; // accumulator
    let F = 0x00; // flag registers ZNHC0000
    let B = 0x00; //                |||+-Carry Flag
    let C = 0x13; //                ||+--Half Carry Flag
    let D = 0x00; //                |+---Subtract Flag
    let E = 0xD8; //                +----Zero Flag
    let H = 0x01;
    let L = 0x4D;

    let PC = 0x0100; // program counter 
    let SP = 0xFFFE; // stack pointer

    let stopped = 0;
  
    function cbinstruction(code) {
        var data = 0;
        var data0 = 0;
        var op = 0;
        
        switch (code%8) {
           case 0: data = B; break;
           case 1: data = C; break;
           case 2: data = D; break;
           case 3: data = E; break;
           case 4: data = HL >> 8; break;
           case 5: data = HL & 0xFF; break;
           case 6: data = getAddress(HL); break;
           case 7: data = A; break;
        }
        data0 = data;
        
        op = code / 8;
        if (op >= 0 & op <= 7){
           if (op == 0){ // RLC - Rotate left
              if (data >= 128){data = ((data << 1) % 256) + 1; FC = 1;
              } else {data = (data << 1) % 256; FC = 0;}
           } else  if (op == 1){ // RRC - Rotate right
              if (data & 1){data = (data >> 1) + 128; FC = 1;
              } else {data = (data >> 1); FC = 0;}
           } else  if (op == 2){ // RL - Rotate left through carry
              if (data >= 128){data = ((data << 1) % 256) + FC; FC = 1;}
              else{data = ((data << 1) % 256) + FC; FC = 0;}
           } else  if (op == 3){ // RR - Rotate right through carry
              if (data & 1){data = (data >> 1) + (FC*128); FC = 1;}
              else{data = (data >> 1) + (FC*128); FC = 0;}
           } else  if (op == 4){ // SLA - Shift left arithmetic
              if (data >= 128) FC = 1; else FC = 0;
              data = (data << 1) % 256;
           } else  if (op == 5){ // SRA - Shift right arithmetic
              if (data & 1){FC = 1;} else {FC = 0;}
              data = (data >> 1) + (data>=128?128:0);
           } else  if (op == 6){ // SWAP - Exchange low/hi-nibble
              FC = 0;
              data = ((data % 16)*16) + (data / 16);
           } else  if (op == 7){ // SRL - Shift right logical
              if (data & 1){FC = 1;} else {FC = 0};
              data = (data >> 1);
           }
           if (data == 0) FZ = 1; else FZ = 0;
           FN = 0;
           FH = 0;
        }
        if (op >= 8 & op <=15){
           FN = 0;
           FH = 1;
           if ((data & (1 << (op-8))) == 0) FZ = 1; else FZ = 0;
        }
        if (op >= 16 & op <=23){
           data = data & ~(1<<(op-16)) ;
        }
        if (op >= 24 & op <=31){
           data = data | 1<<(op-24);
        }
        
        if (data0 != data) {
           switch (code%8) {
              case 0: B = data % 256; break;
              case 1: C = data % 256; break;
              case 2: D = data % 256; break;
              case 3: E = data % 256; break;
              case 4: setH(data % 256); break;
              case 5: setL(data % 256); break;
              case 6: putAddress(HL, data % 256); break;
              case 7: A = data % 256; break;
           }
        }
     }  
  
    // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    //                  |INS reg|← Instruction mnemonic
    // Length in bytes →|  2 8  |← Duration in cycles
    //                  |Z N H C|← Flags affected
    const OPCODES = [
        /* 0x00 NOP          */ function(){},
        /* 0x01 LD BC,d16    */ function(){C=addressSpace.read(PC+1);B=addressSpace.read(PC+2);},
        /* 0x02 LD (BC),A    */ function(){addressSpace.write(B<<8|C,A);},
        /* 0x03 INC BC       */ function(){let val=B<<8|C+1;B=val>>>8;C=val&0xFF;},
        /* 0x04 INC B        */ function(){F=F&0x90;if(B>0xFE){F=F|0x60;B=0;}else{F=F&0x70;if(B%0x10==0x0F)F=F|0x20;B++;}},
        /* 0x05 DEC B        */ function(){F=F&0xD0|0x40;if(B==0){F=F&0x70|0x20;B=0xFF;}else if(B==1){F=F|0x80;}else{F=F&0x70;if(B%0x10==0)F=F|0x20;B--;}},
        /* 0x06 LD B,d8      */ function(){B=addressSpace.read(PC+1);},
        /* 0x07 RLCA         */ function(){let bit=A>>7;A=A<<1|bit; F=((~(A|~A+1)>>31&0b00000001)<<7|F&0b01110000)&(bit<<4|F&0b10000000);},
        /* 0x08 LD (a16),SP  */ function(){let addr=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);addressSpace.write(addr,SP&0xFF);addressSpace.write(addr+1,SP>>>8);},
        /* 0x09 ADD HL,BC    */ function(){let HL=H<<8|L;let BC=B<<8|C;if(BC<0)BC=BC+0x010000;F=F&0xB0;F=(+(HL+BC>0xFFFF)<<4)|F&0xEF;F=(+((HL%0x1000)+BC%0x1000>0x0FFF)<<5)|F&0xDF;HL=(HL+BC)%0x010000;H=HL>>>8;L=HL&0xFF;F=F&0x70},
        /* 0x0A LD A,(BC)    */ function(){A=addressSpace.read(B<<8|C);},
        /* 0x0B DEC BC       */ function(){let val=B<<8|C-1;B=val>>>8;C=val&0xFF;},
        /* 0x0C INC C        */ function(){F=F&0x90;if(C>0xFE){F=F|0x60;C=0;}else{F=F&0x70;if(C%0x10==0x0F)F=F|0x20;C++;}},
        /* 0x0D DEC C        */ function(){F=F&0xD0|0x40;if(C==0){F=F&0x70|0x20;C=0xFF;}else if(C==1){F=F|0x80;}else{F=F&0x70;if(C%0x10==0)F=F|0x20;C--;}},
        /* 0x0E LD C,d8      */ function(){C=addressSpace.read(PC+1);},
        /* 0x0F RRCA         */ function(){let bit=A&0b00000001;A=A>>1|bit<<7;F=bit<<4|F&0b00000000;},
        /* 0x10 STOP 0       */ function(){stopped=1;},
        /* 0x11 LD DE,d16    */ function(){E=addressSpace.read(PC+1);D=addressSpace.read(PC+2);},
        /* 0x12 LD (DE),A    */ function(){addressSpace.write(D<<8|E,A);},
        /* 0x13 INC DE       */ function(){let val=D<<8|E+1;D=val>>>8;E=val&0xFF;},
        /* 0x14 INC D        */ function(){F=F&0x90;if(D>0xFE){F=F|0x60;D=0;}else{F=F&0x70;if(D%0x10==0x0F)F=F|0x20;D++;}},
        /* 0x15 DEC D        */ function(){F=F&0xD0|0x40;if(D==0){F=F&0x70|0x20;D=0xFF;}else if(D==1){F=F|0x80;}else{F=F&0x70;if(D%0x10==0)F=F|0x20;D--;}},
        /* 0x16 LD D,d8      */ function(){D=addressSpace.read(PC+1);},
        /* 0x17 RLA          */ function(){let bit=A>>7;A=A<<1|F>>4&0b00000001;F=bit<<4|F&0b00000000;},
        /* 0x18 JR r8        */ function(){},
        /* 0x19 ADD HL,DE    */ function(){let HL=H<<8|L;let DE=D<<8|E;if(DE<0)DE=DE+0x010000;F=F&0xB0;F=(+(HL+DE>0xFFFF)<<4)|F&0xEF;F=(+((HL%0x1000)+DE%0x1000>0x0FFF)<<5)|F&0xDF;HL=(HL+DE)%0x010000;H=HL>>>8;L=HL&0xFF;F=F&0x70},
        /* 0x1A LD A,(DE)    */ function(){A=addressSpace.read(D<<8|E);},
        /* 0x1B DEC DE       */ function(){let val=D<<8|E-1;D=val>>>8;E=val&0xFF;},
        /* 0x1C INC E        */ function(){F=F&0x90;if(E>0xFE){F=F|0x60;E=0;}else{F=F&0x70;if(E%0x10==0x0F)F=F|0x20;E++;}},
        /* 0x1D DEC E        */ function(){F=F&0xD0|0x40;if(E==0){F=F&0x70|0x20;E=0xFF;}else if(E==1){F=F|0x80;}else{F=F&0x70;if(E%0x10==0)F=F|0x20;E--;}},
        /* 0x1E LD E,d8      */ function(){E=addressSpace.read(PC+1);},
        /* 0x1F RRA          */ function(){let bit=A&0b00000001;A=A>>1|F>>4&0b00000001;F=bit<<4|F&0b00000000;},
        /* 0x20 JR NZ,r8     */ function(){},
        /* 0x21 LD HL,d16    */ function(){L=addressSpace.read(PC+1);H=addressSpace.read(PC+2);},
        /* 0x22 LD (HL+),A   */ function(){let HL=H<<8|L;addressSpace.write(HL++,A);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}},
        /* 0x23 INC HL       */ function(){let val=H<<8|L+1;H=val>>>8;L=val&0xFF;},
        /* 0x24 INC H        */ function(){F=F&0x90;if(H>0xFE){F=F|0x60;H=0;}else{F=F&0x70;if(H%0x10==0x0F)F=F|0x20;H++;}},
        /* 0x25 DEC H        */ function(){F=F&0xD0|0x40;if(H==0){F=F&0x70|0x20;H=0xFF;}else if(H==1){F=F|0x80;}else{F=F&0x70;if(H%0x10==0)F=F|0x20;H--;}},
        /* 0x26 LD H,d8      */ function(){H=addressSpace.read(PC+1);},
        /* 0x27 DAA          */ function(){if(F>>6&0b00000001==0){if(F>>5&0b00000001==0!=0||(A&0xF)>9)A+=0x06;if(F>>4&0b00000001==0!= 0||A>0x9F)A+=0x60;}else{if(F>>5&0b00000001==0!=0)A=(A-6)&0xFF;if(F>>4&0b00000001==0!=0)A-=0x60;}if((A&0x100)==0x100)F=F|0b00010000;A&=0xFF;F=(+(A==0)<<7)|(F&0b01010000);},
        /* 0x28 JR Z,r8      */ function(){},
        /* 0x29 ADD HL,HL    */ function(){let HL=H<<8|L;let HL=H<<8|L;if(HL<0)HL=HL+0x010000;F=F&0xB0;F=(+(HL+HL>0xFFFF)<<4)|F&0xEF;F=(+((HL%0x1000)+HL%0x1000>0x0FFF)<<5)|F&0xDF;HL=(HL+HL)%0x010000;H=HL>>>8;L=HL&0xFF;F=F&0x70},
        /* 0x2A LD A,(HL+)   */ function(){let HL=H<<8|L;A=addressSpace.read(HL++);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}},
        /* 0x2B DEC HL       */ function(){let val=H<<8|L-1;H=val>>>8;L=val&0xFF;},
        /* 0x2C INC L        */ function(){F=F&0x90;if(L>0xFE){F=F|0x60;L=0;}else{F=F&0x70;if(L%0x10==0x0F)F=F|0x20;L++;}},
        /* 0x2D DEC L        */ function(){F=F&0xD0|0x40;if(L==0){F=F&0x70|0x20;L=0xFF;}else if(L==1){F=F|0x80;}else{F=F&0x70;if(L%0x10==0)F=F|0x20;L--;}},
        /* 0x2E LD L,d8      */ function(){L=addressSpace.read(PC+1);},
        /* 0x2F CPL          */ function(){A=~A;F=F|0b01100000;},
        /* 0x30 JR NC,r8     */ function(){},
        /* 0x31 LD SP,d16    */ function(){P=addressSpace.read(PC+1);S=addressSpace.read(PC+2);},
        /* 0x32 LD (HL-),A   */ function(){let HL=H<<8|L;addressSpace.write(HL--,A);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}},
        /* 0x33 INC SP       */ function(){let val=S<<8|P+1;S=val>>>8;P=val&0xFF;},
        /* 0x34 INC (HL)     */ function(){let HL=H<<8|L;addressSpace.write(HL,addressSpace.read(HL)+1);},
        /* 0x35 DEC (HL)     */ function(){let HL=H<<8|L;addressSpace.write(HL,addressSpace.read(HL)-1);},
        /* 0x36 LD (HL),d8   */ function(){addressSpace.write(H<<8|L,addressSpace.read(PC+1));},
        /* 0x37 SCF          */ function(){},
        /* 0x38 JR C,r8      */ function(){},
        /* 0x39 ADD HL,SP    */ function(){let HL=H<<8|L;let SP=S<<8|P;if(SP<0)SP=SP+0x010000;F=F&0xB0;F=(+(HL+SP>0xFFFF)<<4)|F&0xEF;F=(+((HL%0x1000)+SP%0x1000>0x0FFF)<<5)|F&0xDF;HL=(HL+SP)%0x010000;H=HL>>>8;L=HL&0xFF;F=F&0x70},
        /* 0x3A LD A,(HL-)   */ function(){let HL=H<<8|L;A=addressSpace.read(HL--);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}},
        /* 0x3B DEC SP       */ function(){let val=S<<8|P-1;S=val>>>8;P=val&0xFF;},
        /* 0x3C INC A        */ function(){F=F&0x90;if(A>0xFE){F=F|0x60;A=0;}else{F=F&0x70;if(A%0x10==0x0F)F=F|0x20;A++;}},
        /* 0x3D DEC A        */ function(){F=F&0xD0|0x40;if(A==0){F=F&0x70|0x20;A=0xFF;}else if(A==1){F=F|0x80;}else{F=F&0x70;if(A%0x10==0)F=F|0x20;A--;}},
        /* 0x3E LD A,d8      */ function(){A=addressSpace.read(PC+1);},
        /* 0x3F CCF          */ function(){F=F&0b10010000&(1-(F>>4&0b00000001)<<4|F&0b11100000);},
        /* 0x40 LD B,B       */ function(){B=B;},
        /* 0x41 LD B,C       */ function(){B=C;},
        /* 0x42 LD B,D       */ function(){B=D;},
        /* 0x43 LD B,E       */ function(){B=E;},
        /* 0x44 LD B,H       */ function(){B=H;},
        /* 0x45 LD B,L       */ function(){B=L;},
        /* 0x46 LD B,(HL)    */ function(){B=addressSpace.read(H<<8|L);},
        /* 0x47 LD B,A       */ function(){B=A;},
        /* 0x48 LD C,B       */ function(){C=B;},
        /* 0x49 LD C,C       */ function(){C=C;},
        /* 0x4A LD C,D       */ function(){C=D;},
        /* 0x4B LD C,E       */ function(){C=E;},
        /* 0x4C LD C,H       */ function(){C=H;},
        /* 0x4D LD C,L       */ function(){C=L;},
        /* 0x4E LD C,(HL)    */ function(){C=addressSpace.read(H<<8|L);},
        /* 0x4F LD C,A       */ function(){C=A;},
        /* 0x50 LD D,B       */ function(){D=B;},
        /* 0x51 LD D,C       */ function(){D=C;},
        /* 0x52 LD D,D       */ function(){D=D;},
        /* 0x53 LD D,E       */ function(){D=E;},
        /* 0x54 LD D,H       */ function(){D=H;},
        /* 0x55 LD D,L       */ function(){D=L;},
        /* 0x56 LD D,(HL)    */ function(){D=addressSpace.read(H<<8|L);},
        /* 0x57 LD D,A       */ function(){D=A;},
        /* 0x58 LD E,B       */ function(){E=B;},
        /* 0x59 LD E,C       */ function(){E=C;},
        /* 0x5A LD E,D       */ function(){E=D;},
        /* 0x5B LD E,E       */ function(){E=E;},
        /* 0x5C LD E,H       */ function(){E=H;},
        /* 0x5D LD E,L       */ function(){E=L;},
        /* 0x5E LD E,(HL)    */ function(){E=addressSpace.read(H<<8|L);},
        /* 0x5F LD E,A       */ function(){E=A;},
        /* 0x60 LD H,B       */ function(){H=B;},
        /* 0x61 LD H,C       */ function(){H=C;},
        /* 0x62 LD H,D       */ function(){H=D;},
        /* 0x63 LD H,E       */ function(){H=E;},
        /* 0x64 LD H,H       */ function(){H=H;},
        /* 0x65 LD H,L       */ function(){H=L;},
        /* 0x66 LD H,(HL)    */ function(){H=addressSpace.read(H<<8|L);},
        /* 0x67 LD H,A       */ function(){H=A;},
        /* 0x68 LD L,B       */ function(){L=B;},
        /* 0x69 LD L,C       */ function(){L=C;},
        /* 0x6A LD L,D       */ function(){L=D;},
        /* 0x6B LD L,E       */ function(){L=E;},
        /* 0x6C LD L,H       */ function(){L=H;},
        /* 0x6D LD L,L       */ function(){L=L;},
        /* 0x6E LD L,(HL)    */ function(){L=addressSpace.read(H<<8|L);},
        /* 0x6F LD L,A       */ function(){L=A;},
        /* 0x70 LD (HL),B    */ function(){addressSpace.write(H<<8|L,B);},
        /* 0x71 LD (HL),C    */ function(){addressSpace.write(H<<8|L,C);},
        /* 0x72 LD (HL),D    */ function(){addressSpace.write(H<<8|L,D);},
        /* 0x73 LD (HL),E    */ function(){addressSpace.write(H<<8|L,E);},
        /* 0x74 LD (HL),H    */ function(){addressSpace.write(H<<8|L,H);},
        /* 0x75 LD (HL),L    */ function(){addressSpace.write(H<<8|L,L);},
        /* 0x76 HALT         */ function(){if(IME)stopped=1;},
        /* 0x77 LD (HL),A    */ function(){addressSpace.write(H<<8|L,A);},
        /* 0x78 LD A,B       */ function(){A=B;},
        /* 0x79 LD A,C       */ function(){A=C;},
        /* 0x7A LD A,D       */ function(){A=D;},
        /* 0x7B LD A,E       */ function(){A=E;},
        /* 0x7C LD A,H       */ function(){A=H;},
        /* 0x7D LD A,L       */ function(){A=L;},
        /* 0x7E LD A,(HL)    */ function(){A=addressSpace.read(H<<8|L);},
        /* 0x7F LD A,A       */ function(){A=A;},
        /* 0x80 ADD A,B      */ function(){let v=B;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x81 ADD A,C      */ function(){let v=C;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x82 ADD A,D      */ function(){let v=D;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x83 ADD A,E      */ function(){let v=E;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x84 ADD A,H      */ function(){let v=H;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x85 ADD A,L      */ function(){let v=L;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x86 ADD A,(HL)   */ function(){let v=addressSpace.read(H<<8|L);let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
        /* 0x87 ADD A,A      */ function(){let v=A;let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
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
        /* 0xC1 POP BC       */ function(){C=addressSpace.read(SP++);B=addressSpace.read(SP++);},
        /* 0xC2 JP NZ,a16    */ function(){},
        /* 0xC3 JP a16       */ function(){},
        /* 0xC4 CALL NZ,a16  */ function(){},
        /* 0xC5 PUSH BC      */ function(){addressSpace.write(--SP,B);addressSpace.write(--SP,C);},
        /* 0xC6 ADD A,d8     */ function(){let v=addressSpace.read(PC+1);let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;},
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
        /* 0xD1 POP DE       */ function(){E=addressSpace.read(SP++);D=addressSpace.read(SP++);},
        /* 0xD2 JP NC,a16    */ function(){},
        /* 0xD3              */ function(){},
        /* 0xD4 CALL NC,a16  */ function(){},
        /* 0xD5 PUSH DE      */ function(){addressSpace.write(--SP,D);addressSpace.write(--SP,E);},
        /* 0xD6 SUB d8       */ function(){},
        /* 0xD7 RST 10H      */ function(){},
        /* 0xD8 RET C        */ function(){},
        /* 0xD9 RETI         */ function(){DELAYED_JUMP(StackPopWord());IME=1;},
        /* 0xDA JP C,a16     */ function(){},
        /* 0xDB              */ function(){},
        /* 0xDC CALL C,a16   */ function(){},
        /* 0xDD              */ function(){},
        /* 0xDE SBC A,d8     */ function(){},
        /* 0xDF RST 18H      */ function(){},
        /* 0xE0 LDH (a8),A   */ function(){},
        /* 0xE1 POP HL       */ function(){L=addressSpace.read(SP++);H=addressSpace.read(SP++);},
        /* 0xE2 LD (C),A     */ function(){addressSpace.write(0xFF00|C,A);},
        /* 0xE3              */ function(){},
        /* 0xE4              */ function(){},
        /* 0xE5 PUSH HL      */ function(){addressSpace.write(--SP,H);addressSpace.write(--SP,L);},
        /* 0xE6 AND d8       */ function(){},
        /* 0xE7 RST 20H      */ function(){},
        /* 0xE8 ADD SP,r8    */ function(){let data=addressSpace.read(PC+1);data=data<0x80?data:(data-0x0100);if(data<0)data=data+0x010000;F=F&0xB0;F=(+(SP+data>0xFFFF)<<4)|F&0xEF;F=(+((SP%0x1000)+data%0x1000>0x0FFF)<<5)|F&0xDF;SP=(SP+data)%0x010000;F=F&0x70},
        /* 0xE9 JP (HL)      */ function(){},
        /* 0xEA LD (a16),A   */ function(){addressSpace.write(addressSpace.read(PC+2)<<8|addressSpace.read(PC+1),A);},
        /* 0xEB              */ function(){},
        /* 0xEC              */ function(){},
        /* 0xED              */ function(){},
        /* 0xEE XOR d8       */ function(){},
        /* 0xEF RST 28H      */ function(){},
        /* 0xF0 LDH A,(a8)   */ function(){},
        /* 0xF1 POP AF       */ function(){F=addressSpace.read(SP++);A=addressSpace.read(SP++);},
        /* 0xF2 LD A,(C)     */ function(){A=addressSpace.read(0xFF00|C);},
        /* 0xF3 DI           */ function(){IME=false;},
        /* 0xF4              */ function(){},
        /* 0xF5 PUSH AF      */ function(){addressSpace.write(--SP,A);addressSpace.write(--SP,F);},
        /* 0xF6 OR d8        */ function(){},
        /* 0xF7 RST 30H      */ function(){},
        /* 0xF8 LD HL,SP+r8  */ function(){let data=addressSpace.read(PC+1);data=data<0x80?data:(data-0x0100);if(data<0)data=data+0x010000;F=F&0xB0;F=(+(SP+data>0xFFFF)<<4)|F&0xEF;F=(+((SP%0x1000)+data%0x1000>0x0FFF)<<5)|F&0xDF;let HL=(SP+data)%0x010000;H=HL>>>8;L=HL&0xFF;F=F&0x70},
        /* 0xF9 LD SP,HL     */ function(){SP=H<<8|L;},
        /* 0xFA LD A,(a16)   */ function(){A=addressSpace.read(addressSpace.read(PC+2)<<8|addressSpace.read(PC+1));},
        /* 0xFB EI           */ function(){IME=true;interrupt();},
        /* 0xFC              */ function(){},
        /* 0xFD              */ function(){},
        /* 0xFE CP d8        */ function(){},
        /* 0xFF RST 38H      */ function(){}
    ];

    return {
        run: function() {

    // Instruction Extender (0xCB)

        }
    };
}