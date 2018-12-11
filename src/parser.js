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
        let flags = "";
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
                        flags = "";
                        if (_mnem[1][1] == "F") flags = "let F=z<<7|n<<6|h<<5|n<<4;";
                        elem = flags+"addressSpace.write(--SP,"+_mnem[1][0]+");addressSpace.write(--SP,"+_mnem[1][1]+");"; 
                    break;
                    case "POP":    
                        /* 0xC1 POP BC */
                        /* 0xD1 POP DE */
                        /* 0xE1 POP HL */
                        /* 0xF1 POP AF */
                        flags = "";
                        if (_mnem[1][1] == "F") flags = "z=F>>7&1;n=F>>6&1;h=F>>5&1;c=F>>4&1;";
                        elem = (flags==""?"":"let ")+_mnem[1][1]+"=addressSpace.read(SP++);"+flags+_mnem[1][0]+"=addressSpace.read(SP++);"; 
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
                                elem = "n=0;z=h="+_mnem[1]+">0xFE;if(z)"+_mnem[1]+"=0;else{h="+_mnem[1]+"%16==15;"+_mnem[1]+"+=1;}";
                            break;
                            case "(HL)": 
                                /* 0x34 INC (HL) */
                                elem = "let HL=H<<8|L;let v=addressSpace.read(HL);n=0;z=h=v>0xFE;if(z)v=0;else{h=v%16==15;v+=1;}addressSpace.write(HL,v);";
                            break;
                            default: 
                                /* 0x03 INC BC */
                                /* 0x13 INC DE */
                                /* 0x23 INC HL */
                                /* 0x33 INC SP */
                                elem = "if(++"+_mnem[1][1]+">0xFF){"+_mnem[1][1]+"=0;if(++"+_mnem[1][0]+">0xFF)"+_mnem[1][0]+"=0;}";
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
                                elem = "n=1;if("+_mnem[1]+"==0){z=0;h=1;"+_mnem[1]+"=0xFF;}else if("+_mnem[1]+"==1){z=1;h=0;"+_mnem[1]+"=0;}else{z=0;h="+_mnem[1]+"%16==0;"+_mnem[1]+"-=1;}";
                            break;
                            case "(HL)": 
                                /* 0x35 DEC (HL) */
                                elem = "let HL=H<<8|L;let v=addressSpace.read(HL);n=1;if(v==0){z=0;h=1;v=0xFF;}else if(v==1){z=1;h=0;v=0;}else{z=0;h=v%16==0;v-=1;}addressSpace.write(HL,v);";
                            break;
                            default: 
                                /* 0x0B DEC BC */
                                /* 0x1B DEC DE */
                                /* 0x2B DEC HL */
                                /* 0x3B DEC SP */
                                elem = "if(--"+_mnem[1][1]+"<0){"+_mnem[1][1]+"=0xFF;if(--"+_mnem[1][0]+"<0)"+_mnem[1][0]+"=0xFF;}";
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
                                elem = "let v=addressSpace.read(PC+1);v=v<0x80?v:(v-0x0100);let s=SP+v;if(v<0)v+=65536;n=0;c=s>65535;h=(SP%4096)+(v%4096)>4095;let HL=s%65536;H=HL>>>8;L=HL&0xFF;z=0;";
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
                                    elem = "let v="+params[1]+";let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                                } else if (params[1] == "(HL)") {
                                    /* 0x86 ADD A,(HL) */
                                    elem = "let v=addressSpace.read(H<<8|L);let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                                } else if (params[1] == "d8") {
                                    /* 0xC6 ADD A,d8 */
                                    elem = "let v=addressSpace.read(PC+1);let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                                }                                
                            } else if (REGISTERS_16_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[1]) != -1) {
                                    /* 0x09 ADD HL,BC */
                                    /* 0x19 ADD HL,DE */
                                    /* 0x29 ADD HL,HL */
                                    /* 0x39 ADD HL,SP */
                                    elem = "let "+params[0]+"="+params[0][0]+"<<8|"+params[0][1]+";let "+params[1]+"="+params[1][0]+"<<8|"+params[1][1]+";let s="+params[0]+"+"+params[1]+";if("+params[1]+"<0)"+params[1]+"+=65536;n=0;c=s>65535;h="+params[0]+"%4096+"+params[1]+"%4096>4095;"+params[0]+"=s%65536;";
                                } else if (params[1] == "r8") {
                                    /* 0xE8 ADD SP,r8 */
                                    elem = "let v=addressSpace.read(PC+1);v=v<0x80?v:(v-0x0100);if(v<0)v=v+0x010000;let s=SP+v;n=0;c=s>255;h=SP%16+v%16>15;SP=s%256;z=0;";
                                }
                            }
                        }
                    break;   
                    case "ADC":    
                        if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                            /* 0x88 ADC A,B */
                            /* 0x89 ADC A,C */
                            /* 0x8A ADC A,D */
                            /* 0x8B ADC A,E */
                            /* 0x8C ADC A,H */
                            /* 0x8D ADC A,L */
                            /* 0x8F ADC A,A */
                            elem = "let v="+params[1]+"+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                        } else if (params[1] == "(HL)") {
                            /* 0x8E ADC A,(HL) */
                            elem = "let v=addressSpace.read(H<<8|L)+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                        } else if (params[1] == "d8") {
                            /* 0xCE ADC A,d8 */
                            elem = "let v=addressSpace.read(PC+1)+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                        }
                    break;    
                    case "SUB":
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0x90 SUB B */
                            /* 0x91 SUB C */
                            /* 0x92 SUB D */
                            /* 0x93 SUB E */
                            /* 0x94 SUB H */
                            /* 0x95 SUB L */
                            /* 0x97 SUB A */
                            elem = "let v="+_mnem[1]+";let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0x96 SUB (HL) */
                            elem = "let v=addressSpace.read(H<<8|L);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        } else if (_mnem[1] == "d8") {
                            /* 0xD6 SUB d8 */
                            elem = "let v=addressSpace.read(PC+1);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        }
                    break;    
                    case "SBC":    
                        if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                            /* 0x98 SBC A,B */
                            /* 0x99 SBC A,C */
                            /* 0x9A SBC A,D */
                            /* 0x9B SBC A,E */
                            /* 0x9C SBC A,H */
                            /* 0x9D SBC A,L */
                            /* 0x9F SBC A,A */
                            elem = "let v="+params[1]+"+c;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        } else if (params[0] == "(HL)") {
                            /* 0x9E SBC A,(HL) */
                            elem = "let v=addressSpace.read(H<<8|L)+c;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        } else if (params[0] == "d8") {
                            /* 0xDE SBC A,d8 */   
                            elem = "let v=addressSpace.read(PC+1)+c;let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        }
                    break;    
                    case "AND":    
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xA0 AND B */
                            /* 0xA1 AND C */
                            /* 0xA2 AND D */
                            /* 0xA3 AND E */
                            /* 0xA4 AND H */
                            /* 0xA5 AND L */
                            /* 0xA7 AND A */
                            elem = "A=A&"+_mnem[1]+";h=1;n=c=0;z=!A;";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xA6 AND (HL) */
                            elem = "A=A&addressSpace.read(H<<8|L);h=1;n=c=0;z=!A;";
                        } else if (_mnem[1] == "d8") {
                            /* 0xE6 AND d8 */                    
                            elem = "A=A&addressSpace.read(PC+1);h=1;n=c=0;z=!A;";
                        }
                    break;    
                    case "XOR":    
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xA8 XOR B */
                            /* 0xA9 XOR C */
                            /* 0xAA XOR D */
                            /* 0xAB XOR E */
                            /* 0xAC XOR H */
                            /* 0xAD XOR L */
                            /* 0xAF XOR A */
                            elem = "A=A^"+_mnem[1]+";n=h=c=0;z=!A;";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xAE XOR (HL) */
                            elem = "A=A^addressSpace.read(H<<8|L);n=h=c=0;z=!A;";
                        } else if (_mnem[1] == "d8") {
                            /* 0xEE XOR d8 */                    
                            elem = "A=A^addressSpace.read(PC+1);n=h=c=0;z=!A;";
                        }
                    break;    
                    case "OR":     
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xB0 OR B */
                            /* 0xB1 OR C */
                            /* 0xB2 OR D */
                            /* 0xB3 OR E */
                            /* 0xB4 OR H */
                            /* 0xB5 OR L */
                            /* 0xB7 OR A */
                            elem = "A=A|"+_mnem[1]+";n=h=c=0;z=!A;";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xB6 OR (HL) */
                            elem = "A=A|addressSpace.read(H<<8|L);n=h=c=0;z=!A;";
                        } else if (_mnem[1] == "d8") {
                            /* 0xF6 OR d8 */                    
                            elem = "A=A|addressSpace.read(PC+1);n=h=c=0;z=!A;";
                        }
                    break;   
                    case "CP":     
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xB8 CP B */
                            /* 0xB9 CP C */
                            /* 0xBA CP D */
                            /* 0xBB CP E */
                            /* 0xBC CP H */
                            /* 0xBD CP L */
                            /* 0xBF CP A */
                            elem = "let v="+_mnem[1]+";let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xBE CP (HL) */
                            elem = "let v=addressSpace.read(H<<8|L);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;";
                        } else if (_mnem[1] == "d8") {
                            /* 0xFE CP d8 */
                            elem = "let v=addressSpace.read(PC+1);let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;";
                        }
                    break;   
                    case "RET":   
                        switch(_mnem[1]) {
                            case "NZ":
                                /* 0xC0 RET NZ */
                                elem = "if(z)cycle=8;else{PC=addressSpace.read(SP+1)<<8|addressSpace.read(SP);SP=(SP+2)%0x010000;}";
                            break;
                            case "Z":
                                /* 0xC8 RET Z */
                                elem = "if(z){PC=addressSpace.read(SP+1)<<8|addressSpace.read(SP);SP=(SP+2)%0x010000;}else cycle=8;";
                            break;
                            case "NC":
                                /* 0xD0 RET NC */
                                elem = "if(c)cycle=8;else{PC=addressSpace.read(SP+1)<<8|addressSpace.read(SP);SP=(SP+2)%0x010000;}";
                            break;
                            case "C":
                                /* 0xD8 RET C */
                                elem = "if(c){PC=addressSpace.read(SP+1)<<8|addressSpace.read(SP);SP=(SP+2)%0x010000;}else cycle=8;";
                            break;
                        }
                    break;    
                    case "STOP":   
                        /* 0x10 STOP 0 */
                        elem = "stopped=true;";
                    break;   
                    case "JR":
                        switch (_mnem[1]) {
                            case "r8":
                                /* 0x18 JR r8 */
                                elem = "let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;";
                            break;
                            case "NZ,r8":
                                /* 0x20 JR NZ,r8 */
                                elem = "if(z)cycle=8;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}";
                            break;
                            case "Z,r8":
                                /* 0x28 JR Z,r8 */
                                elem = "if(z){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=8;";
                            break;
                            case "NC,r8":
                                /* 0x30 JR NC,r8 */
                                elem = "if(c)cycle=8;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}";
                            break;
                            case "C,r8":
                                /* 0x38 JR C,r8 */
                                elem = "if(c){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=8;";
                            break;
                        }                        
                    break;   
                    case "JP":
                        switch (_mnem[1]) {
                            case "NZ,a16":
                                /* 0xC2 JP NZ,a16 */
                                elem = "if(z)cycle=12;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}";
                            break;
                            case "a16":
                                /* 0xC3 JP a16 */
                                elem = "PC=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);";
                            break;
                            case "Z,a16":
                                /* 0xCA JP Z,a16 */
                                elem = "if(z){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=12;";
                            break;
                            case "NC,a16":
                                /* 0xD2 JP NC,a16 */
                                elem = "if(c)cycle=12;else{let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}";
                            break;
                            case "C,a16":
                                /* 0xDA JP C,a16 */
                                elem = "if(c){let byte=addressSpace.read(PC+1);byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=12;";
                            break;
                            case "(HL)":
                                /* 0xE9 JP (HL) */
                                elem = "PC=H<<8|L";
                            break;
                        }
                    break;   
                    case "CALL":   
                        switch (_mnem[1]) {
                            case "NZ,a16":
                                /* 0xC4 CALL NZ,a16 */
                                elem = "if(z)cycle=12;else{SP=SP-2;addressSpace.write(SP,PC+1);PC=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);SP=(SP+0x010000)%0x010000;}";
                            break;
                            case "Z,a16":
                                /* 0xCC CALL Z,a16 */
                                elem = "if(z){SP=SP-2;addressSpace.write(SP,PC+1);PC=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);SP=(SP+0x010000)%0x010000;}else cycle=12;";
                            break;
                            case "a16":
                                /* 0xCD CALL a16 */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);SP=(SP+0x010000)%0x010000;";
                            break;
                            case "NC,a16":
                                /* 0xD4 CALL NC,a16 */
                                elem = "if(c)cycle=12;else{SP=SP-2;addressSpace.write(SP,PC+1);PC=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);SP=(SP+0x010000)%0x010000;}";
                            break;
                            case "C,a16":
                                /* 0xDC CALL C,a16 */
                                elem = "if(c){SP=SP-2;addressSpace.write(SP,PC+1);PC=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);SP=(SP+0x010000)%0x010000;}else cycle=12;";
                            break;
                        }
                    break;     
                    case "RST":
                        switch (_mnem[1]) {
                            case "00H":
                                /* 0xC7 RST 00H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=0;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "08H":
                                /* 0xCF RST 08H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=8;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "10H":
                                /* 0xD7 RST 10H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=16;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "18H":
                                /* 0xDF RST 18H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=24;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "20H":
                                /* 0xE7 RST 20H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=32;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "28H":
                                /* 0xEF RST 28H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=40;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "30H":
                                /* 0xF7 RST 30H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=48;SP=(SP+0x010000)%0x010000;";
                            break;
                            case "38H":
                                /* 0xFF RST 38H */
                                elem = "SP=SP-2;addressSpace.write(SP,PC+1);PC=56;SP=(SP+0x010000)%0x010000;";
                            break;
                        }
                    break;             
                    case "PREFIX": 
                        /* 0xCB PREFIX CB */
                        elem = "";
                    break;       
                    case "LDH":    
                        if (_mnem[1] == "(a8),A") {
                            /* 0xE0 LDH (a8),A */
                            elem = "addressSpace.write(0xFF<<8|addressSpace.read(PC+1),A);";
                        } else if (_mnem[1] == "A,(a8)") {
                            /* 0xF0 LDH A,(a8) */
                            elem = "A=addressSpace.read(0xFF00|addressSpace.read(PC+1));";
                        }
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
                        elem = "DAA();";
                    break;
                    case "RRA":
                        /* 0x1F RRA */
                        elem = "cbinstruction(31);";
                    break;
                    case "RLA":
                        /* 0x17 RLA */
                        elem = "cbinstruction(23);";
                    break;
                    case "RLCA":
                        /* 0x07 RLCA */
                        elem = "cbinstruction(7);";
                    break;
                    case "RRCA":
                        /* 0x0F RRCA */
                        elem = "cbinstruction(15);";
                    break;
                    case "CCF":    
                        /* 0x3F CCF */
                        elem = "c=1-c;n=h=0;";
                    break;
                    case "SCF":    
                        /* 0x37 SCF */
                        elem = "c=1;n=h=0;";
                    break;
                    case "CPL":    
                        /* 0x2F CPL */
                        elem = "A=A^0xFF;n=h=1;";
                    break;    
                    case "RET":  
                        /* 0xC9 RET */
                        elem = "PC=addressSpace.read(SP+1)<<8|addressSpace.read(SP);SP=(SP+2)%0x010000;";
                    break;
                    case "RETI":
                        /* 0xD9 RETI */
                        elem = "IME=true;PC=addressSpace.read(SP+1)<<8|addressSpace.read(SP);SP=(SP+2)%0x010000;";
                    break;
                    case "DI":   
                        /* 0xF3 DI */
                        elem = "IME=false;";   
                    break;
                    case "EI":   
                        /* 0xFB EI */
                        // this.executeInt = function(){
                        //     var intvector = this.io8bit[15];

                        //     if (intvector&1  && this.intEnable&1  && this.z80.interrupt(64)) intvector&=~1;
                        //     if (intvector&2  && this.intEnable&2  && this.z80.interrupt(72)) intvector&=~2;
                        //     if (intvector&4  && this.intEnable&4  && this.z80.interrupt(80)) intvector&=~4;
                        //     if (intvector&8  && this.intEnable&8  && this.z80.interrupt(88)) intvector&=~8;
                        //     if (intvector&16 && this.intEnable&16 && this.z80.interrupt(96)) intvector&=~16;

                        //     this.io8bit[15] = intvector;
                        //  }
                      
                        // function interrupt(address){
                        //     if(IME){
                        //        IME=false;

                        // address = address|0;
                        // RSP = RSP-2|0;
                        // putAddress16(RSP, PC);
                        // PC = address;
                        // RSP = (RSP + 0x10000|0) % 0x10000|0;
                  
                        //        call(address);
                        //        stopped=false;
                        //        return 1;
                        //     }
                        //     return 0;
                        //  }
                        elem = "IME=true;();";   
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