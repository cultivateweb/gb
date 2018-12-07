(()=>{
    const MNEM_NODE = 0;
    const LEN_CYC_NODE = 2;
    const FLAG_NODE = 4;

    const LEN = 0;
    const CYC = 1;

    function cols(tr) { return Array.from(tr.querySelectorAll("td:nth-child(n+2)")); }

    /*function parseCol_(arr, nodes) {
        let elem = 0;
        if (nodes.length > 4) 
            elem = nodes[LEN_CYC_NODE].textContent
                                      .replace(new RegExp(String.fromCharCode(160), "g")," ")
                                      .split("  ")[LEN];
        arr.push(elem);
        return arr;
    }*/
    
    const REGISTERS_8_BIT = ["A", "B", "C", "D", "E", "H", "L"];
    const REGISTERS_16_BIT = ["AF", "BC", "DE", "HL", "PC", "SP"];

    function parseCol(r, c, arr, nodes) {
        const opcode = "0x" + r.toString(16).toUpperCase() + c.toString(16).toUpperCase();
        let elem = "";
        let mnem = "";
        if (nodes.length > 4) {
            mnem = nodes[MNEM_NODE].textContent;
            let _mnem = mnem.split(" ");
            if (_mnem.length > 1) {
                let params = _mnem[1].split(",");
                switch (_mnem[0]) {
                    case "PUSH":   
                        /* 0xC5 PUSH BC */
                        /* 0xD5 PUSH DE */
                        /* 0xE5 PUSH HL */
                        /* 0xF5 PUSH AF */
                        elem = "addressSpace.write(--SP,"+_mnem[1][0]+");addressSpace.write(--SP,"+_mnem[1][1]+");"; 
                    break;
                    case "POP":    
                        /* 0xC1 POP BC */
                        /* 0xD1 POP DE */
                        /* 0xE1 POP HL */
                        /* 0xF1 POP AF */
                        elem = _mnem[1][1]+"=addressSpace.read(SP++);"+_mnem[1][0]+"=addressSpace.read(SP++);"; 
                    break;
                    case "INC":    
                        switch (_mnem[1]) {
                            case "A": case "L": case "H": case "E": case "D": case "C": case "B": 
                                /* 0x04 INC B */
                                /* 0x0C INC C */
                                /* 0x14 INC D */
                                /* 0x1C INC E */
                                /* 0x24 INC H */
                                /* 0x2C INC L */
                                /* 0x3C INC A */
                                elem = "F=F&0x90;if("+_mnem[1]+">0xFE){F=F|0x60;"+_mnem[1]+"=0;}else{F=F&0x70;if("+_mnem[1]+"%0x10==0x0F)F=F|0x20;"+_mnem[1]+"++;}";
                            break;
                            case "(HL)": 
                                /* 0x34 INC (HL) */
                                elem = "let HL=H<<8|L;addressSpace.write(HL,addressSpace.read(HL)+1);";
                            break;
                            default: 
                                /* 0x03 INC BC */
                                /* 0x13 INC DE */
                                /* 0x23 INC HL */
                                /* 0x33 INC SP */
                                elem = "let val="+_mnem[1][0]+"<<8|"+_mnem[1][1]+"+1;"+_mnem[1][0]+"=val>>>8;"+_mnem[1][1]+"=val&0xFF;";
                        } 
                    break;
                    case "DEC":
                        switch (_mnem[1]) {
                            case "A": case "L": case "H": case "E": case "D": case "C": case "B": 
                                /* 0x05 DEC B */
                                /* 0x0D DEC C */
                                /* 0x15 DEC D */
                                /* 0x1D DEC E */
                                /* 0x25 DEC H */
                                /* 0x2D DEC L */
                                /* 0x3D DEC A */
                                elem = "F=F&0xD0|0x40;if("+_mnem[1]+"==0){F=F&0x70|0x20;"+_mnem[1]+"=0xFF;}else if("+_mnem[1]+"==1){F=F|0x80;}else{F=F&0x70;if("+_mnem[1]+"%0x10==0)F=F|0x20;"+_mnem[1]+"--;}";
                            break;
                            case "(HL)": 
                                /* 0x35 DEC (HL) */
                                elem = "let HL=H<<8|L;addressSpace.write(HL,addressSpace.read(HL)-1);";
                            break;
                            default: 
                                /* 0x0B DEC BC */
                                /* 0x1B DEC DE */
                                /* 0x2B DEC HL */
                                /* 0x3B DEC SP */
                                elem = "let val="+_mnem[1][0]+"<<8|"+_mnem[1][1]+"-1;"+_mnem[1][0]+"=val>>>8;"+_mnem[1][1]+"=val&0xFF;";
                        } 
                    break;
                    case "LD":                        
                        if (params.length == 2) {
                            if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                    /* 0x40 LD B,B */
                                    /* 0x41 LD B,C */
                                    /* 0x42 LD B,D */
                                    /* 0x43 LD B,E */
                                    /* 0x44 LD B,H */
                                    /* 0x45 LD B,L */
                                    /* 0x47 LD B,A */
                                    /* 0x48 LD C,B */
                                    /* 0x49 LD C,C */
                                    /* 0x4A LD C,D */
                                    /* 0x4B LD C,E */
                                    /* 0x4C LD C,H */
                                    /* 0x4D LD C,L */
                                    /* 0x4F LD C,A */
                                    /* 0x50 LD D,B */
                                    /* 0x51 LD D,C */
                                    /* 0x52 LD D,D */
                                    /* 0x53 LD D,E */
                                    /* 0x54 LD D,H */
                                    /* 0x55 LD D,L */
                                    /* 0x57 LD D,A */
                                    /* 0x58 LD E,B */
                                    /* 0x59 LD E,C */
                                    /* 0x5A LD E,D */
                                    /* 0x5B LD E,E */
                                    /* 0x5C LD E,H */
                                    /* 0x5D LD E,L */
                                    /* 0x5F LD E,A */
                                    /* 0x60 LD H,B */
                                    /* 0x61 LD H,C */
                                    /* 0x62 LD H,D */
                                    /* 0x63 LD H,E */
                                    /* 0x64 LD H,H */
                                    /* 0x65 LD H,L */
                                    /* 0x67 LD H,A */
                                    /* 0x68 LD L,B */
                                    /* 0x69 LD L,C */
                                    /* 0x6A LD L,D */
                                    /* 0x6B LD L,E */
                                    /* 0x6C LD L,H */
                                    /* 0x6D LD L,L */
                                    /* 0x6F LD L,A */
                                    /* 0x78 LD A,B */
                                    /* 0x79 LD A,C */
                                    /* 0x7A LD A,D */
                                    /* 0x7B LD A,E */
                                    /* 0x7C LD A,H */
                                    /* 0x7D LD A,L */
                                    /* 0x7F LD A,A */
                                    elem = params[0]+"="+params[1]+";";
                                } else if (REGISTERS_16_BIT.indexOf(params[1].replace("(", "").replace(")", "")) != -1) {
                                    /* 0x0A LD A,(BC) */
                                    /* 0x1A LD A,(DE) */
                                    /* 0x46 LD B,(HL) */
                                    /* 0x4E LD C,(HL) */
                                    /* 0x56 LD D,(HL) */
                                    /* 0x5E LD E,(HL) */
                                    /* 0x66 LD H,(HL) */
                                    /* 0x6E LD L,(HL) */
                                    /* 0x7E LD A,(HL) */
                                    let params1 = params[1].replace("(", "").replace(")", "");
                                    elem = params[0]+"=addressSpace.read("+params1[0]+"<<8|"+params1[1]+");";
                                } else if (params[1] == "d8") {
                                    /* 0x06 LD B,d8 */
                                    /* 0x0E LD C,d8 */
                                    /* 0x16 LD D,d8 */
                                    /* 0x1E LD E,d8 */
                                    /* 0x26 LD H,d8 */
                                    /* 0x2E LD L,d8 */
                                    /* 0x3E LD A,d8 */
                                    elem = params[0]+"=addressSpace.read(PC+1);";
                                } else if (params[1] == "(HL+)") {
                                    /* 0x2A LD A,(HL+) */
                                    elem = "let HL=H<<8|L;"+params[0]+"=addressSpace.read(HL++);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[1] == "(HL-)") {
                                    /* 0x3A LD A,(HL-) */
                                    elem = "let HL=H<<8|L;"+params[0]+"=addressSpace.read(HL--);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[1] == "(C)") {
                                    /* 0xF2 LD A,(C) */
                                    elem = params[0]+"=addressSpace.read(0xFF00|C);";
                                } else if (params[1] == "(a16)") {
                                    /* 0xFA LD A,(a16) */
                                    elem = params[0]+"=addressSpace.read(addressSpace.read(PC+2)<<8|addressSpace.read(PC+1));";
                                }
                            } else if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[0].replace("(", "").replace(")", "")) != -1) {
                                    /* 0x02 LD (BC),A */
                                    /* 0x12 LD (DE),A */
                                    /* 0x70 LD (HL),B */
                                    /* 0x71 LD (HL),C */
                                    /* 0x72 LD (HL),D */
                                    /* 0x73 LD (HL),E */
                                    /* 0x74 LD (HL),H */
                                    /* 0x75 LD (HL),L */
                                    /* 0x77 LD (HL),A */
                                    let params1 = params[0].replace("(", "").replace(")", "");
                                    elem = "addressSpace.write("+params1[0]+"<<8|"+params1[1]+","+params[1]+");";
                                } else if (params[0] == "(HL+)") {
                                    /* 0x22 LD (HL+),A */
                                    elem = "let HL=H<<8|L;addressSpace.write(HL++,"+params[1]+");if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[0] == "(HL-)") {
                                    /* 0x32 LD (HL-),A */
                                    elem = "let HL=H<<8|L;addressSpace.write(HL--,"+params[1]+");if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[0] == "(C)") {
                                    /* 0xE2 LD (C),A */
                                    elem = "addressSpace.write(0xFF00|C,"+params[1]+");";
                                } else if (params[0] == "(a16)") {
                                    /* 0xEA LD (a16),A */
                                    elem = "addressSpace.write(addressSpace.read(PC+2)<<8|addressSpace.read(PC+1),"+params[1]+");";
                                }
                            } else if (params[1] == "d16") {
                                /* 0x01 LD BC,d16 */
                                /* 0x11 LD DE,d16 */
                                /* 0x21 LD HL,d16 */
                                /* 0x31 LD SP,d16 */
                                elem = _mnem[1][1]+"=addressSpace.read(PC+1);"+_mnem[1][0]+"=addressSpace.read(PC+2);";
                            } else if (_mnem[1] == "HL,SP+r8") {                      
                                /* 0xF8 LD HL,SP+r8 */
                                elem = "let data=addressSpace.read(PC+1);data=data<0x80?data:(data-0x0100);if(data<0)data=data+0x010000;F=F&0xB0;F=(+(SP+data>0xFFFF)<<4)|F&0xEF;F=(+((SP%0x1000)+data%0x1000>0x0FFF)<<5)|F&0xDF;let HL=(SP+data)%0x010000;H=HL>>>8;L=HL&0xFF;F=F&0x70";
                            } else if (_mnem[1] == "SP,HL") {
                                /* 0xF9 LD SP,HL */
                                elem = "SP=H<<8|L;";
                            } else if (_mnem[1] == "(a16),SP") {
                                /* 0x08 LD (a16),SP */
                                elem = "let addr=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);addressSpace.write(addr,SP&0xFF);addressSpace.write(addr+1,SP>>>8);";
                            } else if (_mnem[1] == "(HL),d8") {
                                /* 0x36 LD (HL),d8 */
                                elem = "addressSpace.write(H<<8|L,addressSpace.read(PC+1));";
                            }
                        }
                    break;                    
                    case "ADD":                        
                        if (params.length == 2) {
                            if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                    /* 0x80 ADD A,B */
                                    /* 0x81 ADD A,C */
                                    /* 0x82 ADD A,D */
                                    /* 0x83 ADD A,E */
                                    /* 0x84 ADD A,H */
                                    /* 0x85 ADD A,L */
                                    /* 0x87 ADD A,A */
                                    elem = "let v="+params[1]+";let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;";
                                } else if (params[1] == "(HL)") {
                                    /* 0x86 ADD A,(HL) */
                                    elem = "let v=addressSpace.read(H<<8|L);let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;";
                                } else if (params[1] == "d8") {
                                    /* 0xC6 ADD A,d8 */
                                    elem = "let v=addressSpace.read(PC+1);let s=A+v;F=F&0xB0;F=(+(s>0xFF)<<4)|F&0xEF;F=(+(((s)%0x0100)==0)<<7)|F&0x7F;F=(+((A%0x010)+(v%0x010)>0x0F)<<5)|F&0xDF;A=s%0x0100;";
                                }                                
                            } else if (REGISTERS_16_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[1]) != -1) {
                                    /* 0x09 ADD HL,BC */
                                    /* 0x19 ADD HL,DE */
                                    /* 0x29 ADD HL,HL */
                                    /* 0x39 ADD HL,SP */
                                    elem = "let "+params[0]+"="+params[0][0]+"<<8|"+params[0][1]+";let "+params[1]+"="+params[1][0]+"<<8|"+params[1][1]+";if("+params[1]+"<0)"+params[1]+"="+params[1]+"+0x010000;F=F&0xB0;F=(+("+params[0]+"+"+params[1]+">0xFFFF)<<4)|F&0xEF;F=(+(("+params[0]+"%0x1000)+"+params[1]+"%0x1000>0x0FFF)<<5)|F&0xDF;"+params[0]+"=("+params[0]+"+"+params[1]+")%0x010000;"+params[0][0]+"="+params[0]+">>>8;"+params[0][1]+"="+params[0]+"&0xFF;F=F&0x70";
                                } else if (params[1] == "r8") {
                                    /* 0xE8 ADD SP,r8 */
                                    elem = "let data=addressSpace.read(PC+1);data=data<0x80?data:(data-0x0100);if(data<0)data=data+0x010000;F=F&0xB0;F=(+(SP+data>0xFFFF)<<4)|F&0xEF;F=(+((SP%0x1000)+data%0x1000>0x0FFF)<<5)|F&0xDF;SP=(SP+data)%0x010000;F=F&0x70";
                                }
                            }
                        }
                    break;   
                    case "STOP":   
                        /* 0x10 STOP 0 */
                        elem = "stopped=1;";
                    break;   
                    case "JR":     
                        /* 0x18 JR r8        */
                        /* 0x20 JR NZ,r8     */
                        /* 0x28 JR Z,r8      */
                        /* 0x30 JR NC,r8     */
                        /* 0x38 JR C,r8      */
                        elem = "";
                    break;   
                    case "ADC":    
                        /* 0x88 ADC A,B      */
                        /* 0x89 ADC A,C      */
                        /* 0x8A ADC A,D      */
                        /* 0x8B ADC A,E      */
                        /* 0x8C ADC A,H      */
                        /* 0x8D ADC A,L      */
                        /* 0x8E ADC A,(HL)   */
                        /* 0x8F ADC A,A      */                    
                        /* 0xCE ADC A,d8     */
                        elem = "";
                    break;    
                    case "SUB":    
                        /* 0x90 SUB B        */
                        /* 0x91 SUB C        */
                        /* 0x92 SUB D        */
                        /* 0x93 SUB E        */
                        /* 0x94 SUB H        */
                        /* 0x95 SUB L        */
                        /* 0x96 SUB (HL)     */
                        /* 0x97 SUB A        */
                        /* 0xD6 SUB d8       */                    
                        elem = "";
                    break;    
                    case "SBC":    
                        /* 0x98 SBC A,B      */
                        /* 0x99 SBC A,C      */
                        /* 0x9A SBC A,D      */
                        /* 0x9B SBC A,E      */
                        /* 0x9C SBC A,H      */
                        /* 0x9D SBC A,L      */
                        /* 0x9E SBC A,(HL)   */
                        /* 0x9F SBC A,A      */
                        /* 0xDE SBC A,d8     */                    
                        elem = "";
                    break;    
                    case "AND":    
                        /* 0xA0 AND B        */
                        /* 0xA1 AND C        */
                        /* 0xA2 AND D        */
                        /* 0xA3 AND E        */
                        /* 0xA4 AND H        */
                        /* 0xA5 AND L        */
                        /* 0xA6 AND (HL)     */
                        /* 0xA7 AND A        */
                        /* 0xE6 AND d8       */                    
                        elem = "";
                    break;    
                    case "XOR":    
                        /* 0xA8 XOR B        */
                        /* 0xA9 XOR C        */
                        /* 0xAA XOR D        */
                        /* 0xAB XOR E        */
                        /* 0xAC XOR H        */
                        /* 0xAD XOR L        */
                        /* 0xAE XOR (HL)     */
                        /* 0xAF XOR A        */
                        /* 0xEE XOR d8       */                    
                        elem = "";
                    break;    
                    case "OR":     
                        /* 0xB0 OR B         */
                        /* 0xB1 OR C         */
                        /* 0xB2 OR D         */
                        /* 0xB3 OR E         */
                        /* 0xB4 OR H         */
                        /* 0xB5 OR L         */
                        /* 0xB6 OR (HL)      */
                        /* 0xB7 OR A         */
                        /* 0xF6 OR d8        */                    
                        elem = "";
                    break;   
                    case "CP":     
                        /* 0xB8 CP B         */
                        /* 0xB9 CP C         */
                        /* 0xBA CP D         */
                        /* 0xBB CP E         */
                        /* 0xBC CP H         */
                        /* 0xBD CP L         */
                        /* 0xBE CP (HL)      */
                        /* 0xBF CP A         */
                        /* 0xFE CP d8        */                    
                        elem = "";
                    break;   
                    case "RET":    
                        /* 0xC0 RET NZ       */
                        /* 0xC8 RET Z        */
                        /* 0xC9 RET          */
                        /* 0xD0 RET NC       */
                        /* 0xD8 RET C        */                    
                        elem = "";
                    break;    
                    case "JP":     
                        /* 0xC2 JP NZ,a16    */
                        /* 0xC3 JP a16       */
                        /* 0xCA JP Z,a16     */
                        /* 0xD2 JP NC,a16    */
                        /* 0xDA JP C,a16     */
                        /* 0xE9 JP (HL)      */                    
                        elem = "";
                    break;   
                    case "CALL":   
                        /* 0xC4 CALL NZ,a16  */
                        /* 0xCC CALL Z,a16   */
                        /* 0xCD CALL a16     */
                        /* 0xD4 CALL NC,a16  */
                        /* 0xDC CALL C,a16   */                    
                        elem = "";
                    break;     
                    case "RST":    
                        /* 0xC7 RST 00H      */
                        /* 0xCF RST 08H      */
                        /* 0xD7 RST 10H      */
                        /* 0xDF RST 18H      */
                        /* 0xE7 RST 20H      */
                        /* 0xEF RST 28H      */
                        /* 0xF7 RST 30H      */
                        /* 0xFF RST 38H      */                    
                        elem = "";
                    break;             
                    case "PREFIX": 
                        /* 0xCB PREFIX CB */
                        elem = "";
                    break;       
                    case "LDH":    
                        /* 0xE0 LDH (a8),A   */
                        /* 0xF0 LDH A,(a8)   */
                        elem = "";
                    break;    
                }
            } else
                switch (mnem) {
                    case "NOP":  
                        /* 0x00 NOP */
                        elem = "";
                    break;                    
                    case "DAA":
                        /* 0x27 DAA */
                        elem = "if(F>>6&0b00000001==0){if(F>>5&0b00000001==0!=0||(A&0xF)>9)A+=0x06;if(F>>4&0b00000001==0!= 0||A>0x9F)A+=0x60;}else{if(F>>5&0b00000001==0!=0)A=(A-6)&0xFF;if(F>>4&0b00000001==0!=0)A-=0x60;}if((A&0x100)==0x100)F=F|0b00010000;A&=0xFF;F=(+(A==0)<<7)|(F&0b01010000);";
                    break;
                    case "RRA":
                        /* 0x1F RRA */
                        elem = "let bit=A&0b00000001;A=A>>1|F>>4&0b00000001;F=bit<<4|F&0b00000000;";
                    break;
                    case "RLA":
                        /* 0x17 RLA */
                        elem = "let bit=A>>7;A=A<<1|F>>4&0b00000001;F=bit<<4|F&0b00000000;";
                    break;
                    case "RLCA":
                        /* 0x07 RLCA */
                        elem = "let bit=A>>7;A=A<<1|bit; F=((~(A|~A+1)>>31&0b00000001)<<7|F&0b01110000)&(bit<<4|F&0b10000000);";
                    break;
                    case "RRCA":
                        /* 0x0F RRCA */
                        elem = "let bit=A&0b00000001;A=A>>1|bit<<7;F=bit<<4|F&0b00000000;";
                    break;
                    case "CCF":    
                        /* 0x3F CCF */
                        elem = "F=F&0b10010000&(1-(F>>4&0b00000001)<<4|F&0b11100000);";
                    break;             
                    case "CPL":    
                        /* 0x2F CPL */
                        elem = "A=~A;F=F|0b01100000;";
                    break;    
                    case "RETI":
                        /* 0xD9 RETI */
                        elem = "DELAYED_JUMP(StackPopWord());IME=1;";
                    break;
                    case "DI":   
                        /* 0xF3 DI */
                        elem = "IME=false;";   
                    break;
                    case "EI":   
                        /* 0xFB EI */
                        elem = "IME=true;interrupt();";   
                    break;
                    case "HALT": 
                        /* 0x76 HALT */
                        elem = "if(IME)stopped=1;"; 
                    break;
                }
        }           
        mnem += " ".repeat(13 - mnem.length);
        arr.push("\n/* "+opcode+" "+mnem+"*/ function(){" + elem + "}");
        return arr;
    }

    function parseRow(tr, r) { 
        return cols(tr).reduce( (arr, td, c) => parseCol(r, c, arr, td.childNodes), [] );
    }

    let rows = document.querySelectorAll("table")[0]
                       .querySelectorAll("tr:nth-child(n+2)");

    document.querySelector("pre").innerHTML = 
        Array.from(rows)
             .reduce( (arr, tr, r) => arr.concat(parseRow(tr, r)), [] )
             .toString();
})();