// 4213440 ticks per second

const CLOCK = 4194304; //Hz

// flag masks of register F [Z N H C 0 0 0 0]
const FLAG_MASK_SET_Z = 0b10000000; // Zero Flag
const FLAG_MASK_SET_N = 0b01000000; // Subtract Flag
const FLAG_MASK_SET_H = 0b00100000; // Half Carry Flag
const FLAG_MASK_SET_C = 0b00010000; // Carry Flag

const FLAG_MASK_UNSET_Z = 0b01110000;
const FLAG_MASK_UNSET_N = 0b10110000;
const FLAG_MASK_UNSET_H = 0b11010000;
const FLAG_MASK_UNSET_C = 0b11100000;

const OPCODE_LENGTTHS = [1,3,1,1,1,1,2,1,3,1,1,1,1,1,2,1,2,3,1,1,1,
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

const OPCODE_CYCLES1 = [4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,
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

const OPCODE_CYCLES2 = [4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,
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
                                
function word(hi,lo) { return hi << 8 | lo; }

function hi(word) { return word >>> 8; }
function lo(word) { return word & 0xFF; }

export function initLR35902(addressSpace) {
    let IME = false; // interrupt master enable

    let A = 0x01; // accumulator
    let F = 0x00; // flag registers
    let B = 0x00;
    let C = 0x13;
    let D = 0x00;
    let E = 0xD8;
    let H = 0x01;
    let L = 0x4D;
    
    let PC = 0x0100; // program counter 
    let SP = 0xFFFE; // stack pointer

    // function hi(r){return REGISTERS[r] >>> 8;}
    // function lo(r){return REGISTERS[r] & 0xFF;}            

    function increment(value8bit) {
        F = F & FLAG_MASK_UNSET_N & FLAG_MASK_UNSET_H;
        if (value8bit > 254) {
            F = F | FLAG_MASK_SET_N | FLAG_MASK_SET_H;
            value8bit = 0;
        } else {
            F = F & FLAG_MASK_UNSET_Z;
            if (value8bit % 16 == 15) F = F | FLAG_MASK_SET_H;
            value8bit = value8bit + 1;
        }        
        return value8bit;
    }

    function decrement(value8bit) {
        F = F & FLAG_MASK_UNSET_H | FLAG_MASK_SET_N;
        if (value8bit == 0) {
            F = F & FLAG_MASK_UNSET_Z | FLAG_MASK_SET_H;
            value8bit = 255;
        } else if (value8bit == 1) {
            F = F | FLAG_MASK_SET_Z;
        } else {
            F = F & FLAG_MASK_UNSET_Z;
            if (value8bit % 16 == 0) F = F | FLAG_MASK_SET_H;
            value8bit = value8bit - 1;
        }
        return value8bit;
    }

    let stopped = 0;
    function STOP(){ stopped = 1; }
    function resume(){ stopped = 0; }
  
    // http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html
    //
    //                  |INS reg|← Instruction mnemonic
    // Length in bytes →|  2 8  |← Duration in cycles
    //                  |Z N H C|← Flags affected
    function exec(opcode) {
        switch (opcode) {
            case 0xCB://PREFIX CB {1  4} 
                PC = PC + 1; 
                cbinstruction(
                    addressSpace.read(PC)
                );
                PC = PC + 1; 
                cycles = 4; //8?
            break;
            case 0x08://LD (a16),SP {3  20} 
                addressSpace.write( addressSpace.read(PC = PC + 1), lo(SP) );
                addressSpace.write( addressSpace.read(PC = PC + 1), hi(SP) );
                PC = PC + 1;
                cycles = 20;
            break;            
        }
    }

    const OPCODES = [
        /* 0x00 NOP          */ function(){},
        /* 0x01 LD BC,d16    */ function(){C=addressSpace.read(++PC);B=addressSpace.read(++PC);},
        /* 0x02 LD (BC),A    */ function(){addressSpace.write(word(B,C),A);},
        /* 0x03 INC BC       */ function(){let val=word(B,C)+1;B=hi(val);C=lo(val);},
        /* 0x04 INC B        */ function(){increment(B);},
        /* 0x05 DEC B        */ function(){decrement(B);},
        /* 0x06 LD B,d8      */ function(){B=addressSpace.read(++PC);},

    ];

    return {
        run: function() {

    // Instruction Extender (0xCB)

        }
    };
}