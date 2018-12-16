// 4213440 ticks per second

const CLOCK = 4194304; //Hz

const OPCODE_LENGTH = [1,3,1,1,1,1,2,1,3,1,1,1,1,1,2,1,2,3,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,3,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,3,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,3,1,2,1,1,1,3,1,3,3,2,1,1,1,3,0,3,1,2,1,1,1,3,0,3,0,2,1,2,1,2,0,0,1,2,1,2,1,3,0,0,0,2,1,2,1,2,1,0,1,2,1,2,1,3,1,0,0,2,1];
const OPCODE_CYCLE = [4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,4,8,4,12,8,8,8,4,4,8,4,12,12,8,8,4,4,8,4,12,8,8,8,4,4,8,4,12,12,8,8,12,12,12,4,12,8,8,8,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,8,8,8,8,8,8,4,8,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,20,12,16,16,24,16,8,16,20,16,16,4,24,24,8,16,20,12,16,0,24,16,8,16,20,16,16,0,24,0,8,16,12,12,8,0,0,16,8,16,16,4,16,0,0,0,8,16,12,12,8,4,0,16,8,16,12,8,16,4,0,0,8,16];

export function initLR35902(addressSpace) {
    let IME = false; // interrupt master enable

    let stopped = false;

    let intEnable = false;
    
    // register F (znhc0000)
    let z = false; // Zero Flag         – флаг установлен (бит равен 1), если результат последней математической операции равен нулю или два операнда оказались равными при сравнении.
    let n = false; // Subtract Flag     – флаг установлен, если последней операцией было вычитание.
    let h = false; // Half Carry Flag   – флаг установлен, если в результате последней математической операции произошел перенос из младшего полу-байта.
    let c = false; // Carry Flag        – флаг установлен, если в результате последней математической операции произошел перенос.

    let A = 0x01; // accumulator
    let B = 0x00;
    let C = 0x13;
    let D = 0x00;
    let E = 0xD8;
    let H = 0x01;
    let L = 0x4D;

    let PC = 0x0100; // program counter 

    function cbinstruction(code) {
        let data = 0, data0 = 0, op = 0;      
        switch (code % 8) {
            case 0: data = B; break;
            case 1: data = C; break;
            case 2: data = D; break;
            case 3: data = E; break;
            case 4: data = H; break;
            case 5: data = L; break;
            case 6: data = addressSpace.read(H<<8|L); break;
            case 7: data = A; break;
        }
        data0 = data;
        op = code / 8;
        if (op >=0 & op < 8) {
            switch (op) {
                case 0: // RLC - Rotate left
                case 2: // RL  - Rotate left through carry
                    c = data > 127;
                    data = (data << 1) % 256 + c;
                break; 
                case 1: // RRC - Rotate right
                case 3: // RR  - Rotate right through carry
                    c = data & 1;
                    data = (data >> 1) + (c << 7);
                break; 
                case 4: // SLA - Shift left arithmetic
                    c = data > 127;
                    data = (data << 1) % 256;
                break; 
                case 5: // SRA - Shift right arithmetic
                    c = data & 1;
                    data = (data >> 1) + (data > 127 ? 128 : 0);
                break; 
                case 6: // SWAP - Exchange low/hi-nibble
                    c = 0;
                    data = data % 16 * 16 + data / 16;
                break; 
                case 7: // SRL - Shift right logical
                    c = data & 1;
                    data = data >> 1;
                break; 
            }         
            z = !data;
            n = h = 0;
        }

        if (op >= 8 & op <= 15) {
            n = 0;
            h = 1;
            z = !(data & 1 << op - 8);
        }

        if (op >= 16 & op <= 23) data = data & ~(1 << op - 16);
        if (op >= 24 & op <= 31) data = data |   1 << op - 24;
         
        if (data0 != data) {
            let data = data % 256;
            switch (code % 8) {
               case 0: B = data; break;
               case 1: C = data; break;
               case 2: D = data; break;
               case 3: E = data; break;
               case 4: H = data; break;
               case 5: L = data; break;
               case 6: addressSpace.write(H<<8|L, data); break;
               case 7: A = data; break;
            }
        } 
    }

    function DAA() {
        let upper=A>>4,lower=A%16;
        if (n) {
                 if(!c & !h & upper<10 & lower<10){c = 0;}
            else if(!c &  h & upper<9  & lower> 5){c = 0; A = A + 0xFA }
            else if( c & !h & upper>6  & lower<10){c = 1; A = A + 0xA0 }
            else if( c &  h & upper>5  & lower> 5){c = 1; A = A + 0x9A }
        } else {
                 if(!c & !h & upper<10 & lower<10){c = 0;}
            else if(!c & !h & upper<9  & lower> 9){c = 0; A = A + 0x06 }
            else if(!c &  h & upper<10 & lower< 4){c = 0; A = A + 0x06 }
            else if(!c & !h & upper>9  & lower<10){c = 1; A = A + 0x60 }
            else if(!c & !h & upper>8  & lower> 9){c = 1; A = A + 0x66 }
            else if(!c &  h & upper>9  & lower< 4){c = 1; A = A + 0x66 }
            else if( c & !h & upper<3  & lower<10){c = 1; A = A + 0x60 }
            else if( c & !h & upper<3  & lower> 9){c = 1; A = A + 0x66 }
            else if( c &  h & upper<4  & lower< 4){c = 1; A = A + 0x66 }
        }
        A=A%256;
    }

    function interrupt(address) {
        if (IME) {
            IME = false;
            addressSpace.write16(SP-2, PC);
            PC = address;
            SP = (SP + 0x010000) % 0x010000;
            stopped = false;
            return 1;
        }
        return 0;
    }


    // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    //                  |INS reg|← Instruction mnemonic
    // Length in bytes →|  2 8  |← Duration in cycles
    //                  |z n h c|← Flags affected
    const OPCODES = [
    /* 0x00 NOP         [1 4]          */ function(){},
    /* 0x01 LD BC,d16   [3 12]         */ function(){C=addressSpace.read(PC+1);B=addressSpace.read(PC+2);},
    /* 0x02 LD (BC),A   [1 8]          */ function(){addressSpace.write(B<<8|C,A);},
    /* 0x03 INC BC      [1 8]          */ function(){if(++C>0xFF){C=0;if(++B>0xFF)B=0;}},
    /* 0x04 INC B       [1 4]     z0h- */ function(){n=0;z=h=B>0xFE;if(z)B=0;else{h=B%16==15;B+=1;}},
    /* 0x05 DEC B       [1 4]     z1h- */ function(){n=1;if(!B){z=0;h=1;B=0xFF;}else if(B==1){z=1;h=B=0;}else{z=0;h=B%16==0;B-=1;}},
    /* 0x06 LD B,d8     [2 8]          */ function(){B=addressSpace.read(PC+1);},
    /* 0x07 RLCA        [1 4]     000c */ function(){cbinstruction(7);},
    /* 0x08 LD (a16),SP [3 20]         */ function(){addressSpace.write16(addressSpace.read16(PC+1),addressSpace.getSP());},
    /* 0x09 ADD HL,BC   [1 8]     -0hc */ function(){let HL=H<<8|L;let BC=B<<8|C;let s=HL+BC;if(BC<0)BC+=65536;n=0;c=s>65535;h=HL%4096+BC%4096>4095;HL=s%65536;},
    /* 0x0A LD A,(BC)   [1 8]          */ function(){A=addressSpace.read(B<<8|C);},
    /* 0x0B DEC BC      [1 8]          */ function(){if(--C<0){C=0xFF;if(--B<0)B=0xFF;}},
    /* 0x0C INC C       [1 4]     z0h- */ function(){n=0;z=h=C>0xFE;if(z)C=0;else{h=C%16==15;C+=1;}},
    /* 0x0D DEC C       [1 4]     z1h- */ function(){n=1;if(!C){z=0;h=1;C=0xFF;}else if(C==1){z=1;h=C=0;}else{z=0;h=C%16==0;C-=1;}},
    /* 0x0E LD C,d8     [2 8]          */ function(){C=addressSpace.read(PC+1);},
    /* 0x0F RRCA        [1 4]     000c */ function(){cbinstruction(15);},
    /* 0x10 STOP 0      [2 4]          */ function(){stopped=true;},
    /* 0x11 LD DE,d16   [3 12]         */ function(){E=addressSpace.read(PC+1);D=addressSpace.read(PC+2);},
    /* 0x12 LD (DE),A   [1 8]          */ function(){addressSpace.write(D<<8|E,A);},
    /* 0x13 INC DE      [1 8]          */ function(){if(++E>0xFF){E=0;if(++D>0xFF)D=0;}},
    /* 0x14 INC D       [1 4]     z0h- */ function(){n=0;z=h=D>0xFE;if(z)D=0;else{h=D%16==15;D+=1;}},
    /* 0x15 DEC D       [1 4]     z1h- */ function(){n=1;if(!D){z=0;h=1;D=0xFF;}else if(D==1){z=1;h=D=0;}else{z=0;h=D%16==0;D-=1;}},
    /* 0x16 LD D,d8     [2 8]          */ function(){D=addressSpace.read(PC+1);},
    /* 0x17 RLA         [1 4]     000c */ function(){cbinstruction(23);},
    /* 0x18 JR r8       [2 12]         */ function(){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;},
    /* 0x19 ADD HL,DE   [1 8]     -0hc */ function(){let HL=H<<8|L;let DE=D<<8|E;let s=HL+DE;if(DE<0)DE+=65536;n=0;c=s>65535;h=HL%4096+DE%4096>4095;HL=s%65536;},
    /* 0x1A LD A,(DE)   [1 8]          */ function(){A=addressSpace.read(D<<8|E);},
    /* 0x1B DEC DE      [1 8]          */ function(){if(--E<0){E=0xFF;if(--D<0)D=0xFF;}},
    /* 0x1C INC E       [1 4]     z0h- */ function(){n=0;z=h=E>0xFE;if(z)E=0;else{h=E%16==15;E+=1;}},
    /* 0x1D DEC E       [1 4]     z1h- */ function(){n=1;if(!E){z=0;h=1;E=0xFF;}else if(E==1){z=1;h=E=0;}else{z=0;h=E%16==0;E-=1;}},
    /* 0x1E LD E,d8     [2 8]          */ function(){E=addressSpace.read(PC+1);},
    /* 0x1F RRA         [1 4]     000c */ function(){cbinstruction(31);},
    /* 0x20 JR NZ,r8    [2 12/8]       */ function(){if(z)cycle=8;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}},
    /* 0x21 LD HL,d16   [3 12]         */ function(){L=addressSpace.read(PC+1);H=addressSpace.read(PC+2);},
    /* 0x22 LD (HL+),A  [1 8]          */ function(){let HL=H<<8|L;addressSpace.write(HL++,A);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}},
    /* 0x23 INC HL      [1 8]          */ function(){if(++L>0xFF){L=0;if(++H>0xFF)H=0;}},
    /* 0x24 INC H       [1 4]     z0h- */ function(){n=0;z=h=H>0xFE;if(z)H=0;else{h=H%16==15;H+=1;}},
    /* 0x25 DEC H       [1 4]     z1h- */ function(){n=1;if(!H){z=0;h=1;H=0xFF;}else if(H==1){z=1;h=H=0;}else{z=0;h=H%16==0;H-=1;}},
    /* 0x26 LD H,d8     [2 8]          */ function(){H=addressSpace.read(PC+1);},
    /* 0x27 DAA         [1 4]     z-0c */ function(){DAA();},
    /* 0x28 JR Z,r8     [2 12/8]       */ function(){if(z){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=8;},
    /* 0x29 ADD HL,HL   [1 8]     -0hc */ function(){let HL=H<<8|L;let HL=H<<8|L;let s=HL+HL;if(HL<0)HL+=65536;n=0;c=s>65535;h=HL%4096+HL%4096>4095;HL=s%65536;},
    /* 0x2A LD A,(HL+)  [1 8]          */ function(){let HL=H<<8|L;A=addressSpace.read(HL++);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}},
    /* 0x2B DEC HL      [1 8]          */ function(){if(--L<0){L=0xFF;if(--H<0)H=0xFF;}},
    /* 0x2C INC L       [1 4]     z0h- */ function(){n=0;z=h=L>0xFE;if(z)L=0;else{h=L%16==15;L+=1;}},
    /* 0x2D DEC L       [1 4]     z1h- */ function(){n=1;if(!L){z=0;h=1;L=0xFF;}else if(L==1){z=1;h=L=0;}else{z=0;h=L%16==0;L-=1;}},
    /* 0x2E LD L,d8     [2 8]          */ function(){L=addressSpace.read(PC+1);},
    /* 0x2F CPL         [1 4]     -11- */ function(){A=A^0xFF;n=h=1;},
    /* 0x30 JR NC,r8    [2 12/8]       */ function(){if(c)cycle=8;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}},
    /* 0x31 LD SP,d16   [3 12]         */ function(){P=addressSpace.read(PC+1);S=addressSpace.read(PC+2);},
    /* 0x32 LD (HL-),A  [1 8]          */ function(){let HL=H<<8|L;addressSpace.write(HL--,A);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}},
    /* 0x33 INC SP      [1 8]          */ function(){addressSpace.incSP();},
    /* 0x34 INC (HL)    [1 12]    z0h- */ function(){let HL=addressSpace.read(H<<8|L);let v=addressSpace.read(HL);n=0;z=h=v>0xFE;if(z)v=0;else{h=v%16==15;v+=1;}addressSpace.write(HL,v);},
    /* 0x35 DEC (HL)    [1 12]    z1h- */ function(){let HL=addressSpace.read(H<<8|L);let v=addressSpace.read(HL);n=1;if(v==0){z=0;h=1;v=0xFF;}else if(v==1){z=1;h=v=0;}else{z=0;h=v%16==0;v-=1;}addressSpace.write(HL,v);},
    /* 0x36 LD (HL),d8  [2 12]         */ function(){addressSpace.write(H<<8|L,addressSpace.read(PC+1));},
    /* 0x37 SCF         [1 4]     -001 */ function(){n=h=0;c=1;},
    /* 0x38 JR C,r8     [2 12/8]       */ function(){if(c){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=8;},
    /* 0x39 ADD HL,SP   [1 8]     -0hc */ function(){let HL=H<<8|L;let SP=S<<8|P;let s=HL+SP;if(SP<0)SP+=65536;n=0;c=s>65535;h=HL%4096+SP%4096>4095;HL=s%65536;},
    /* 0x3A LD A,(HL-)  [1 8]          */ function(){let HL=H<<8|L;A=addressSpace.read(HL--);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}},
    /* 0x3B DEC SP      [1 8]          */ function(){addressSpace.decSP();},
    /* 0x3C INC A       [1 4]     z0h- */ function(){n=0;z=h=A>0xFE;if(z)A=0;else{h=A%16==15;A+=1;}},
    /* 0x3D DEC A       [1 4]     z1h- */ function(){n=1;if(!A){z=0;h=1;A=0xFF;}else if(A==1){z=1;h=A=0;}else{z=0;h=A%16==0;A-=1;}},
    /* 0x3E LD A,d8     [2 8]          */ function(){A=addressSpace.read(PC+1);},
    /* 0x3F CCF         [1 4]     -00c */ function(){n=h=0;c=1-c;},
    /* 0x40 LD B,B      [1 4]          */ function(){B=B;},
    /* 0x41 LD B,C      [1 4]          */ function(){B=C;},
    /* 0x42 LD B,D      [1 4]          */ function(){B=D;},
    /* 0x43 LD B,E      [1 4]          */ function(){B=E;},
    /* 0x44 LD B,H      [1 4]          */ function(){B=H;},
    /* 0x45 LD B,L      [1 4]          */ function(){B=L;},
    /* 0x46 LD B,(HL)   [1 8]          */ function(){B=addressSpace.read(H<<8|L);},
    /* 0x47 LD B,A      [1 4]          */ function(){B=A;},
    /* 0x48 LD C,B      [1 4]          */ function(){C=B;},
    /* 0x49 LD C,C      [1 4]          */ function(){C=C;},
    /* 0x4A LD C,D      [1 4]          */ function(){C=D;},
    /* 0x4B LD C,E      [1 4]          */ function(){C=E;},
    /* 0x4C LD C,H      [1 4]          */ function(){C=H;},
    /* 0x4D LD C,L      [1 4]          */ function(){C=L;},
    /* 0x4E LD C,(HL)   [1 8]          */ function(){C=addressSpace.read(H<<8|L);},
    /* 0x4F LD C,A      [1 4]          */ function(){C=A;},
    /* 0x50 LD D,B      [1 4]          */ function(){D=B;},
    /* 0x51 LD D,C      [1 4]          */ function(){D=C;},
    /* 0x52 LD D,D      [1 4]          */ function(){D=D;},
    /* 0x53 LD D,E      [1 4]          */ function(){D=E;},
    /* 0x54 LD D,H      [1 4]          */ function(){D=H;},
    /* 0x55 LD D,L      [1 4]          */ function(){D=L;},
    /* 0x56 LD D,(HL)   [1 8]          */ function(){D=addressSpace.read(H<<8|L);},
    /* 0x57 LD D,A      [1 4]          */ function(){D=A;},
    /* 0x58 LD E,B      [1 4]          */ function(){E=B;},
    /* 0x59 LD E,C      [1 4]          */ function(){E=C;},
    /* 0x5A LD E,D      [1 4]          */ function(){E=D;},
    /* 0x5B LD E,E      [1 4]          */ function(){E=E;},
    /* 0x5C LD E,H      [1 4]          */ function(){E=H;},
    /* 0x5D LD E,L      [1 4]          */ function(){E=L;},
    /* 0x5E LD E,(HL)   [1 8]          */ function(){E=addressSpace.read(H<<8|L);},
    /* 0x5F LD E,A      [1 4]          */ function(){E=A;},
    /* 0x60 LD H,B      [1 4]          */ function(){H=B;},
    /* 0x61 LD H,C      [1 4]          */ function(){H=C;},
    /* 0x62 LD H,D      [1 4]          */ function(){H=D;},
    /* 0x63 LD H,E      [1 4]          */ function(){H=E;},
    /* 0x64 LD H,H      [1 4]          */ function(){H=H;},
    /* 0x65 LD H,L      [1 4]          */ function(){H=L;},
    /* 0x66 LD H,(HL)   [1 8]          */ function(){H=addressSpace.read(H<<8|L);},
    /* 0x67 LD H,A      [1 4]          */ function(){H=A;},
    /* 0x68 LD L,B      [1 4]          */ function(){L=B;},
    /* 0x69 LD L,C      [1 4]          */ function(){L=C;},
    /* 0x6A LD L,D      [1 4]          */ function(){L=D;},
    /* 0x6B LD L,E      [1 4]          */ function(){L=E;},
    /* 0x6C LD L,H      [1 4]          */ function(){L=H;},
    /* 0x6D LD L,L      [1 4]          */ function(){L=L;},
    /* 0x6E LD L,(HL)   [1 8]          */ function(){L=addressSpace.read(H<<8|L);},
    /* 0x6F LD L,A      [1 4]          */ function(){L=A;},
    /* 0x70 LD (HL),B   [1 8]          */ function(){addressSpace.write(H<<8|L,B);},
    /* 0x71 LD (HL),C   [1 8]          */ function(){addressSpace.write(H<<8|L,C);},
    /* 0x72 LD (HL),D   [1 8]          */ function(){addressSpace.write(H<<8|L,D);},
    /* 0x73 LD (HL),E   [1 8]          */ function(){addressSpace.write(H<<8|L,E);},
    /* 0x74 LD (HL),H   [1 8]          */ function(){addressSpace.write(H<<8|L,H);},
    /* 0x75 LD (HL),L   [1 8]          */ function(){addressSpace.write(H<<8|L,L);},
    /* 0x76 HALT        [1 4]          */ function(){if(IME)stopped=true;},
    /* 0x77 LD (HL),A   [1 8]          */ function(){addressSpace.write(H<<8|L,A);},
    /* 0x78 LD A,B      [1 4]          */ function(){A=B;},
    /* 0x79 LD A,C      [1 4]          */ function(){A=C;},
    /* 0x7A LD A,D      [1 4]          */ function(){A=D;},
    /* 0x7B LD A,E      [1 4]          */ function(){A=E;},
    /* 0x7C LD A,H      [1 4]          */ function(){A=H;},
    /* 0x7D LD A,L      [1 4]          */ function(){A=L;},
    /* 0x7E LD A,(HL)   [1 8]          */ function(){A=addressSpace.read(H<<8|L);},
    /* 0x7F LD A,A      [1 4]          */ function(){A=A;},
    /* 0x80 ADD A,B     [1 4]     z0hc */ function(){let v=B;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x81 ADD A,C     [1 4]     z0hc */ function(){let v=C;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x82 ADD A,D     [1 4]     z0hc */ function(){let v=D;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x83 ADD A,E     [1 4]     z0hc */ function(){let v=E;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x84 ADD A,H     [1 4]     z0hc */ function(){let v=H;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x85 ADD A,L     [1 4]     z0hc */ function(){let v=L;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x86 ADD A,(HL)  [1 8]     z0hc */ function(){let v=addressSpace.read(H<<8|L);let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x87 ADD A,A     [1 4]     z0hc */ function(){let v=A;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x88 ADC A,B     [1 4]     z0hc */ function(){let v=B+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x89 ADC A,C     [1 4]     z0hc */ function(){let v=C+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x8A ADC A,D     [1 4]     z0hc */ function(){let v=D+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x8B ADC A,E     [1 4]     z0hc */ function(){let v=E+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x8C ADC A,H     [1 4]     z0hc */ function(){let v=H+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x8D ADC A,L     [1 4]     z0hc */ function(){let v=L+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x8E ADC A,(HL)  [1 8]     z0hc */ function(){let v=addressSpace.read(H<<8|L)+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x8F ADC A,A     [1 4]     z0hc */ function(){let v=A+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0x90 SUB B       [1 4]     z1hc */ function(){let v=B;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x91 SUB C       [1 4]     z1hc */ function(){let v=C;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x92 SUB D       [1 4]     z1hc */ function(){let v=D;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x93 SUB E       [1 4]     z1hc */ function(){let v=E;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x94 SUB H       [1 4]     z1hc */ function(){let v=H;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x95 SUB L       [1 4]     z1hc */ function(){let v=L;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x96 SUB (HL)    [1 8]     z1hc */ function(){let v=addressSpace.read(H<<8|L);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x97 SUB A       [1 4]     z1hc */ function(){let v=A;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0x98 SBC A,B     [1 4]     z1hc */ function(){let v=B+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x99 SBC A,C     [1 4]     z1hc */ function(){let v=C+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x9A SBC A,D     [1 4]     z1hc */ function(){let v=D+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x9B SBC A,E     [1 4]     z1hc */ function(){let v=E+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x9C SBC A,H     [1 4]     z1hc */ function(){let v=H+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x9D SBC A,L     [1 4]     z1hc */ function(){let v=L+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x9E SBC A,(HL)  [1 8]     z1hc */ function(){let v=(HL)+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0x9F SBC A,A     [1 4]     z1hc */ function(){let v=A+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0xA0 AND B       [1 4]     z010 */ function(){A=A&B;z=!A;n=0;h=1;c=0;},
    /* 0xA1 AND C       [1 4]     z010 */ function(){A=A&C;z=!A;n=0;h=1;c=0;},
    /* 0xA2 AND D       [1 4]     z010 */ function(){A=A&D;z=!A;n=0;h=1;c=0;},
    /* 0xA3 AND E       [1 4]     z010 */ function(){A=A&E;z=!A;n=0;h=1;c=0;},
    /* 0xA4 AND H       [1 4]     z010 */ function(){A=A&H;z=!A;n=0;h=1;c=0;},
    /* 0xA5 AND L       [1 4]     z010 */ function(){A=A&L;z=!A;n=0;h=1;c=0;},
    /* 0xA6 AND (HL)    [1 8]     z010 */ function(){A=A&addressSpace.read(H<<8|L);z=!A;n=0;h=1;c=0;},
    /* 0xA7 AND A       [1 4]     z010 */ function(){A=A&A;z=!A;n=0;h=1;c=0;},
    /* 0xA8 XOR B       [1 4]     z000 */ function(){A=A^B;z=!A;n=h=c=0;},
    /* 0xA9 XOR C       [1 4]     z000 */ function(){A=A^C;z=!A;n=h=c=0;},
    /* 0xAA XOR D       [1 4]     z000 */ function(){A=A^D;z=!A;n=h=c=0;},
    /* 0xAB XOR E       [1 4]     z000 */ function(){A=A^E;z=!A;n=h=c=0;},
    /* 0xAC XOR H       [1 4]     z000 */ function(){A=A^H;z=!A;n=h=c=0;},
    /* 0xAD XOR L       [1 4]     z000 */ function(){A=A^L;z=!A;n=h=c=0;},
    /* 0xAE XOR (HL)    [1 8]     z000 */ function(){A=A^addressSpace.read(H<<8|L);z=!A;n=h=c=0;},
    /* 0xAF XOR A       [1 4]     z000 */ function(){A=A^A;z=!A;n=h=c=0;},
    /* 0xB0 OR B        [1 4]     z000 */ function(){A=A|B;z=!A;n=h=c=0;},
    /* 0xB1 OR C        [1 4]     z000 */ function(){A=A|C;z=!A;n=h=c=0;},
    /* 0xB2 OR D        [1 4]     z000 */ function(){A=A|D;z=!A;n=h=c=0;},
    /* 0xB3 OR E        [1 4]     z000 */ function(){A=A|E;z=!A;n=h=c=0;},
    /* 0xB4 OR H        [1 4]     z000 */ function(){A=A|H;z=!A;n=h=c=0;},
    /* 0xB5 OR L        [1 4]     z000 */ function(){A=A|L;z=!A;n=h=c=0;},
    /* 0xB6 OR (HL)     [1 8]     z000 */ function(){A=A|addressSpace.read(H<<8|L);z=!A;n=h=c=0;},
    /* 0xB7 OR A        [1 4]     z000 */ function(){A=A|A;z=!A;n=h=c=0;},
    /* 0xB8 CP B        [1 4]     z1hc */ function(){let v=B;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xB9 CP C        [1 4]     z1hc */ function(){let v=C;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xBA CP D        [1 4]     z1hc */ function(){let v=D;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xBB CP E        [1 4]     z1hc */ function(){let v=E;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xBC CP H        [1 4]     z1hc */ function(){let v=H;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xBD CP L        [1 4]     z1hc */ function(){let v=L;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xBE CP (HL)     [1 8]     z1hc */ function(){let v=addressSpace.read(H<<8|L);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xBF CP A        [1 4]     z1hc */ function(){let v=A;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xC0 RET NZ      [1 20/8]       */ function(){if(z)cycle=8;else{PC=addressSpace.pop16();}},
    /* 0xC1 POP BC      [1 12]         */ function(){C=addressSpace.pop();B=addressSpace.pop();},
    /* 0xC2 JP NZ,a16   [3 16/12]      */ function(){if(z)cycle=12;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}},
    /* 0xC3 JP a16      [3 16]         */ function(){PC=addressSpace.read16(PC+1);},
    /* 0xC4 CALL NZ,a16 [3 24/12]      */ function(){if(z)cycle=12;else{addressSpace.write16(addressSpace.getSP()-2,PC+2);PC=addressSpace.read16(PC+1);addressSpace.setSP((SP+0x010000)%0x010000);}},
    /* 0xC5 PUSH BC     [1 16]         */ function(){addressSpace.push(B);addressSpace.push(C);},
    /* 0xC6 ADD A,d8    [2 8]     z0hc */ function(){let v=addressSpace.read(PC+1);let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0xC7 RST 00H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x00;},
    /* 0xC8 RET Z       [1 20/8]       */ function(){if(z){PC=addressSpace.pop16();}else cycle=8;},
    /* 0xC9 RET         [1 16]         */ function(){PC=addressSpace.pop16();},
    /* 0xCA JP Z,a16    [3 16/12]      */ function(){if(z){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=12;},
    /* 0xCB PREFIX CB   [1 4]          */ function(){cbinstruction(addressSpace.read(PC+1));},
    /* 0xCC CALL Z,a16  [3 24/12]      */ function(){if(z){addressSpace.write16(addressSpace.getSP()-2,PC+2);PC=addressSpace.read16(PC+1);addressSpace.setSP((SP+0x010000)%0x010000);}else cycle=12;},
    /* 0xCD CALL a16    [3 24]         */ function(){addressSpace.write16(addressSpace.getSP()-2,PC+2);PC=addressSpace.read16(PC+1);addressSpace.setSP((SP+0x010000)%0x010000);},
    /* 0xCE ADC A,d8    [2 8]     z0hc */ function(){let v=addressSpace.read(PC+1)+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;},
    /* 0xCF RST 08H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x08;},
    /* 0xD0 RET NC      [1 20/8]       */ function(){if(c)cycle=8;else{PC=addressSpace.pop16();}},
    /* 0xD1 POP DE      [1 12]         */ function(){E=addressSpace.pop();D=addressSpace.pop();},
    /* 0xD2 JP NC,a16   [3 16/12]      */ function(){if(c)cycle=12;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}},
    /* 0xD3                            */ function(){},
    /* 0xD4 CALL NC,a16 [3 24/12]      */ function(){if(c)cycle=12;else{addressSpace.write16(addressSpace.getSP()-2,PC+2);PC=addressSpace.read16(PC+1);addressSpace.setSP((SP+0x010000)%0x010000);}},
    /* 0xD5 PUSH DE     [1 16]         */ function(){addressSpace.push(D);addressSpace.push(E);},
    /* 0xD6 SUB d8      [2 8]     z1hc */ function(){let v=addressSpace.read(PC+1);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;},
    /* 0xD7 RST 10H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x10;},
    /* 0xD8 RET C       [1 20/8]       */ function(){if(c){PC=addressSpace.pop16();}else cycle=8;},
    /* 0xD9 RETI        [1 16]         */ function(){IME=true;PC=addressSpace.pop16();},
    /* 0xDA JP C,a16    [3 16/12]      */ function(){if(c){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=12;},
    /* 0xDB                            */ function(){},
    /* 0xDC CALL C,a16  [3 24/12]      */ function(){if(c){addressSpace.write16(addressSpace.getSP()-2,PC+2);PC=addressSpace.read16(PC+1);addressSpace.setSP((SP+0x010000)%0x010000);}else cycle=12;},
    /* 0xDD                            */ function(){},
    /* 0xDE SBC A,d8    [2 8]     z1hc */ function(){let v=d8+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;},
    /* 0xDF RST 18H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x18;},
    /* 0xE0 LDH (a8),A  [2 12]         */ function(){addressSpace.write(0xFF<<8|addressSpace.read(PC+1),A);},
    /* 0xE1 POP HL      [1 12]         */ function(){L=addressSpace.pop();H=addressSpace.pop();},
    /* 0xE2 LD (C),A    [2 8]          */ function(){addressSpace.write(0xFF00|C,A);},
    /* 0xE3                            */ function(){},
    /* 0xE4                            */ function(){},
    /* 0xE5 PUSH HL     [1 16]         */ function(){addressSpace.push(H);addressSpace.push(L);},
    /* 0xE6 AND d8      [2 8]     z010 */ function(){A=A&addressSpace.read(PC+1);z=!A;n=0;h=1;c=0;},
    /* 0xE7 RST 20H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x20;},
    /* 0xE8 ADD SP,r8   [2 16]    00hc */ function(){let SP=addressSpace.getSP();let v=addressSpace.read(PC+1);v=v<0x80?v:(v-0x0100);if(v<0)v=v+0x010000;let s=SP+v;n=0;c=s>255;h=SP%16+v%16>15;addressSpace.setSP(s%256);z=0;},
    /* 0xE9 JP (HL)     [1 4]          */ function(){PC=H<<8|L},
    /* 0xEA LD (a16),A  [3 16]         */ function(){addressSpace.write(addressSpace.read16(PC+1),A);},
    /* 0xEB                            */ function(){},
    /* 0xEC                            */ function(){},
    /* 0xED                            */ function(){},
    /* 0xEE XOR d8      [2 8]     z000 */ function(){A=A^addressSpace.read(PC+1);z=!A;n=h=c=0;},
    /* 0xEF RST 28H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x28;},
    /* 0xF0 LDH A,(a8)  [2 12]         */ function(){A=addressSpace.read(0xFF00|addressSpace.read(PC+1));},
    /* 0xF1 POP AF      [1 12]    znhc */ function(){let F=addressSpace.pop();z=F>>7&1;n=F>>6&1;h=F>>5&1;c=F>>4&1;A=addressSpace.pop();},
    /* 0xF2 LD A,(C)    [2 8]          */ function(){A=addressSpace.read(0xFF00|C);},
    /* 0xF3 DI          [1 4]          */ function(){IME=false;},
    /* 0xF4                            */ function(){},
    /* 0xF5 PUSH AF     [1 16]         */ function(){let F=z<<7|n<<6|h<<5|c<<4;addressSpace.push(A);addressSpace.push(F);},
    /* 0xF6 OR d8       [2 8]     z000 */ function(){A=A|addressSpace.read(PC+1);z=!A;n=h=c=0;},
    /* 0xF7 RST 30H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x30;},
    /* 0xF8 LD HL,SP+r8 [2 12]    00hc */ function(){let SP=addressSpace.getSP();let v=addressSpace.read(PC+1);v=v<0x80?v:(v-0x0100);let s=SP+v;if(v<0)v+=65536;n=0;c=s>65535;h=(SP%4096)+(v%4096)>4095;let HL=s%65536;H=HL>>>8;L=HL&0xFF;z=0;},
    /* 0xF9 LD SP,HL    [1 8]          */ function(){addressSpace.setSP(H<<8|L);},
    /* 0xFA LD A,(a16)  [3 16]         */ function(){A=addressSpace.read(addressSpace.read16(PC+1));},
    /* 0xFB EI          [1 4]          */ function(){IME=true;
                                                     let intvector = addressSpace.readIO8bit(15);
                                                     if (intvector & 0x01 && intEnable & 0x01 && interrupt(64)) intvector &= ~0x01;
                                                     if (intvector & 0x02 && intEnable & 0x02 && interrupt(72)) intvector &= ~0x02;
                                                     if (intvector & 0x04 && intEnable & 0x04 && interrupt(80)) intvector &= ~0x04;
                                                     if (intvector & 0x08 && intEnable & 0x08 && interrupt(88)) intvector &= ~0x08;
                                                     if (intvector & 0x10 && intEnable & 0x10 && interrupt(96)) intvector &= ~0x10;
                                                     addressSpace.writeIO8bit(15, intvector);},
    /* 0xFC                            */ function(){},
    /* 0xFD                            */ function(){},
    /* 0xFE CP d8       [2 8]     z1hc */ function(){let v=addressSpace.read(PC+1);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;},
    /* 0xFF RST 38H     [1 16]         */ function(){addressSpace.push16(PC+1);PC=0x38;}
    ];

    const OPCODES_EX = [
 
    ];


    function step() {
        OPCODES[addressSpace.read(PC)]();
    }

    //while (!stopped) OPCODES[addressSpace.read(PC)]();

    return {
       run: function() {

       // Instruction Extender (0xCB)

       }
    };
}