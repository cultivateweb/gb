// 4213440 ticks per second

// Бит 	Прерывание
// 4 	Joypad
// 3 	Serial I/O transfer complete
// 2 	Timer overflow
// 1 	LCDC
// 0 	V-Blank

const CLOCK = 4194304; //Hz

const OPCODE_CYCLE = [4,12,8,8,4,4,8,4,20,8,8,8,4,4,8,4,4,12,8,8,4,4,8,4,12,8,8,8,4,4,8,4,12,12,8,8,4,4,8,4,12,8,8,8,4,4,8,4,12,12,8,8,12,12,12,4,12,8,8,8,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,8,8,8,8,8,8,4,8,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,4,4,4,4,4,4,8,4,20,12,16,16,24,16,8,16,20,16,16,4,24,24,8,16,20,12,16,0,24,16,8,16,20,16,16,0,24,0,8,16,12,12,8,0,0,16,8,16,16,4,16,0,0,0,8,16,12,12,8,4,0,16,8,16,12,8,16,4,0,0,8,16];

export function initLR35902(addressSpace) {
    // let stopped = false;
    // let intEnable = false;
    
    // register F[znhc0000]
    let z = 1; // Zero Flag       – флаг установлен (бит равен 1), если результат последней математической операции равен нулю или два операнда оказались равными при сравнении.
    let n = 0; // Subtract Flag   – флаг установлен, если последней операцией было вычитание.
    let h = 1; // Half Carry Flag – флаг установлен, если в результате последней математической операции произошел перенос из младшего полу-байта.
    let c = 1; // Carry Flag      – флаг установлен, если в результате последней математической операции произошел перенос.

    let A = CGB ? 0x11 : 0x01; // accumulator
    let B = 0x00;
    let C = 0x13;
    let D = 0x00;
    let E = 0xD8;
    let H = 0x01;
    let L = 0x4D;

    let PC = 0x0100; // program counter 
    let SP = 0xFFFE; // stack pointer

    let IME = false; // interrupt master enable




    const CGB;

    let CGBDoubleSpeed;

    let Halted;
	let HaltBug;

	let DIDelay;
	let EIDelay;

    function SYNC_WITH_CPU(clockDelta){
	    let adjustedClockDelta = clockDelta;	
        if (CGBDoubleSpeed) adjustedClockDelta >>= 1;
        GPU.Step(adjustedClockDelta, MMU);		
        DIV.Step(adjustedClockDelta);			
        TIMA.Step(adjustedClockDelta, INT);		
        Serial.Step(adjustedClockDelta, INT);	
        Joypad.Step(INT);						
        Sound.Step(adjustedClockDelta);
    }
    
    // let readIO8bit = addressSpace.readIO8bit;
    // let writeIO8bit = addressSpace.writeIO8bit;

    let read = addressSpace.read;
    let write = addressSpace.write;

    function push16(word) {
        write(--SP,word>>>8);write(--SP,word&0xFF);
        SP = (SP + 0x010000) % 0x010000; //TODO: ???
    }

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

    ];

    const OPCODES_EX = [
 
    ];


    function step() {
        let opcode = read(PC++);

        //Halt bug occurs when HALT executed while IME = 0
        //CPU continues to run but instruction after HALT 
        //is executed twice.
        if (!Halted && HaltBug) {
            HaltBug = false;
            PC--;
        }

        //Delaying until next instruction is executed
        if (DIDelay > 0 && DIDelay-- == 1) IME = false;
        if (EIDelay > 0 && EIDelay-- == 1) IME = true;

        OPCODES[opcode]();

        //int.step()
    }

    //while (!stopped) OPCODES[addressSpace.read(PC)]();

    return {
       run: function() {

       // Instruction Extender (0xCB)

       }
    };
}