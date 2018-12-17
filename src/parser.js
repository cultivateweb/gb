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
    const HL = "H<<8|L";
    const fromHL = "read("+HL+")";
    const d8 = "read(PC+1)";
    const d16 = "read16(PC+1)";
    const a16 = "read("+d16+")";
    const r8 = "let r8="+d8+";if(r8>127)r8=r8-256;";

    function parseCol(r, c, arr, nodes) {
        const opcode = "0x" + r.toString(16).toUpperCase() + c.toString(16).toUpperCase();
        let elem = "";
        let mnem = "";
        let len = "";
        let cyc = "";
        let flag = "";
        let flags = "";
        if (nodes.length > 4) {
            mnem = nodes[MNEM_NODE].textContent;
            let len_cyc = nodes[LEN_CYC_NODE].textContent.replace(new RegExp(String.fromCharCode(160), "g")," ").split("  ");
            len = len_cyc[0];
            cyc = len_cyc[1]
            flag = nodes[FLAG_NODE].textContent;
            let _mnem = mnem.split(" ");
            if (_mnem.length > 1) {
                let params = _mnem[1].split(",");

                console.log(mnem, ": ", params[0]||"", params[1]||"");

                switch (_mnem[0]) {
                    case "PUSH":
                        /* 0xC5 PUSH BC [1 16] */
                        /* 0xD5 PUSH DE [1 16] */
                        /* 0xE5 PUSH HL [1 16] */
                        /* 0xF5 PUSH AF [1 16] */                    
                        flags = "";
                        if (_mnem[1][1] == "F") flags = "let F=z<<7|n<<6|h<<5|c<<4;";
                        elem = flags+"push("+_mnem[1][0]+");push("+_mnem[1][1]+");"; 
                    break;
                    case "POP":    
                        /* 0xC1 POP BC [1 12] */
                        /* 0xD1 POP DE [1 12] */
                        /* 0xE1 POP HL [1 12] */
                        /* 0xF1 POP AF [1 12] znhc */
                        flags = "";
                        if (_mnem[1][1] == "F") flags = "z=F>>7&1;n=F>>6&1;h=F>>5&1;c=F>>4&1;";
                        elem = (flags==""?"":"let ")+_mnem[1][1]+"=pop();"+flags+_mnem[1][0]+"=pop();"; 
                    break;
                    case "INC":    
                        switch (_mnem[1]) {
                            case "A": case "L": case "H": case "E": case "D": case "C": case "B": 
                                /* 0x04 INC B [1 4] z0h- */
                                /* 0x0C INC C [1 4] z0h- */
                                /* 0x14 INC D [1 4] z0h- */
                                /* 0x1C INC E [1 4] z0h- */
                                /* 0x24 INC H [1 4] z0h- */
                                /* 0x2C INC L [1 4] z0h- */
                                /* 0x3C INC A [1 4] z0h- */
                                elem = "n=0;z=h="+_mnem[1]+">0xFE;if(z)"+_mnem[1]+"=0;else{h="+_mnem[1]+"%16==15;"+_mnem[1]+"+=1;}";
                            break;
                            case "(HL)": 
                                /* 0x34 INC (HL) [1 12] z0h- */
                                elem = "let HL="+fromHL+";let v=read(HL);n=0;z=h=v>0xFE;if(z)v=0;else{h=v%16==15;v+=1;}write(HL,v);";
                            break;
                            case "SP": 
                                /* 0x33 INC SP [1 8] */
                                elem = "if(++SP>0xFFFF)SP=0;";
                            break;
                            default: 
                                /* 0x03 INC BC [1 8] */
                                /* 0x13 INC DE [1 8] */
                                /* 0x23 INC HL [1 8] */
                                elem = "if(++"+_mnem[1][1]+">0xFF){"+_mnem[1][1]+"=0;if(++"+_mnem[1][0]+">0xFF)"+_mnem[1][0]+"=0;}";
                        } 
                    break;
                    case "DEC":
                        switch (_mnem[1]) {
                            case "A": case "L": case "H": case "E": case "D": case "C": case "B": 
                                /* 0x05 DEC B [1 4] z1h- */
                                /* 0x0D DEC C [1 4] z1h- */
                                /* 0x15 DEC D [1 4] z1h- */
                                /* 0x1D DEC E [1 4] z1h- */
                                /* 0x25 DEC H [1 4] z1h- */
                                /* 0x2D DEC L [1 4] z1h- */
                                /* 0x3D DEC A [1 4] z1h- */
                                elem = "n=1;if(!"+_mnem[1]+"){z=0;h=1;"+_mnem[1]+"=0xFF;}else if("+_mnem[1]+"==1){z=1;h="+_mnem[1]+"=0;}else{z=0;h="+_mnem[1]+"%16==0;"+_mnem[1]+"-=1;}";
                            break;
                            case "(HL)": 
                                /* 0x35 DEC (HL) [1 12] z1h- */
                                elem = "let HL="+fromHL+";let v=read(HL);n=1;if(v==0){z=0;h=1;v=0xFF;}else if(v==1){z=1;h=v=0;}else{z=0;h=v%16==0;v-=1;}write(HL,v);";
                            break;
                            case "SP": 
                                /* 0x3B DEC SP [1 8] */
                                elem = "if(--SP<0)SP=0xFFFF;";
                            break;
                            default: 
                                /* 0x0B DEC BC [1 8] */
                                /* 0x1B DEC DE [1 8] */
                                /* 0x2B DEC HL [1 8] */
                                elem = "if(--"+_mnem[1][1]+"<0){"+_mnem[1][1]+"=0xFF;if(--"+_mnem[1][0]+"<0)"+_mnem[1][0]+"=0xFF;}";
                        } 
                    break;
                    case "LD":                        
                        if (params.length == 2) {
                            if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                    /* 0x40 LD B,B [1 4] */
                                    /* 0x41 LD B,C [1 4] */
                                    /* 0x42 LD B,D [1 4] */
                                    /* 0x43 LD B,E [1 4] */
                                    /* 0x44 LD B,H [1 4] */
                                    /* 0x45 LD B,L [1 4] */
                                    /* 0x47 LD B,A [1 4] */
                                    /* 0x48 LD C,B [1 4] */
                                    /* 0x49 LD C,C [1 4] */
                                    /* 0x4A LD C,D [1 4] */
                                    /* 0x4B LD C,E [1 4] */
                                    /* 0x4C LD C,H [1 4] */
                                    /* 0x4D LD C,L [1 4] */
                                    /* 0x4F LD C,A [1 4] */
                                    /* 0x50 LD D,B [1 4] */
                                    /* 0x51 LD D,C [1 4] */
                                    /* 0x52 LD D,D [1 4] */
                                    /* 0x53 LD D,E [1 4] */
                                    /* 0x54 LD D,H [1 4] */
                                    /* 0x55 LD D,L [1 4] */
                                    /* 0x57 LD D,A [1 4] */
                                    /* 0x58 LD E,B [1 4] */
                                    /* 0x59 LD E,C [1 4] */
                                    /* 0x5A LD E,D [1 4] */
                                    /* 0x5B LD E,E [1 4] */
                                    /* 0x5C LD E,H [1 4] */
                                    /* 0x5D LD E,L [1 4] */
                                    /* 0x5F LD E,A [1 4] */
                                    /* 0x60 LD H,B [1 4] */
                                    /* 0x61 LD H,C [1 4] */
                                    /* 0x62 LD H,D [1 4] */
                                    /* 0x63 LD H,E [1 4] */
                                    /* 0x64 LD H,H [1 4] */
                                    /* 0x65 LD H,L [1 4] */
                                    /* 0x67 LD H,A [1 4] */
                                    /* 0x68 LD L,B [1 4] */
                                    /* 0x69 LD L,C [1 4] */
                                    /* 0x6A LD L,D [1 4] */
                                    /* 0x6B LD L,E [1 4] */
                                    /* 0x6C LD L,H [1 4] */
                                    /* 0x6D LD L,L [1 4] */
                                    /* 0x6F LD L,A [1 4] */
                                    /* 0x78 LD A,B [1 4] */
                                    /* 0x79 LD A,C [1 4] */
                                    /* 0x7A LD A,D [1 4] */
                                    /* 0x7B LD A,E [1 4] */
                                    /* 0x7C LD A,H [1 4] */
                                    /* 0x7D LD A,L [1 4] */
                                    /* 0x7F LD A,A [1 4] */
                                    elem = params[0]+"="+params[1]+";";
                                } else if (REGISTERS_16_BIT.indexOf(params[1].replace("(", "").replace(")", "")) != -1) {
                                    /* 0x0A LD A,(BC) [1 8] */
                                    /* 0x1A LD A,(DE) [1 8] */
                                    /* 0x46 LD B,(HL) [1 8] */
                                    /* 0x4E LD C,(HL) [1 8] */
                                    /* 0x56 LD D,(HL) [1 8] */
                                    /* 0x5E LD E,(HL) [1 8] */
                                    /* 0x66 LD H,(HL) [1 8] */
                                    /* 0x6E LD L,(HL) [1 8] */
                                    /* 0x7E LD A,(HL) [1 8] */
                                    let params1 = params[1].replace("(", "").replace(")", "");
                                    elem = params[0]+"=read("+params1[0]+"<<8|"+params1[1]+");";
                                } else if (params[1] == "d8") {
                                    /* 0x06 LD B,d8 [2 8] */
                                    /* 0x0E LD C,d8 [2 8] */
                                    /* 0x16 LD D,d8 [2 8] */
                                    /* 0x1E LD E,d8 [2 8] */
                                    /* 0x26 LD H,d8 [2 8] */
                                    /* 0x2E LD L,d8 [2 8] */
                                    /* 0x3E LD A,d8 [2 8] */
                                    elem = params[0]+"="+d8+";";
                                } else if (params[1] == "(HL+)") {
                                    /* 0x2A LD A,(HL+) [1 8] */
                                    elem = "let HL="+HL+";"+params[0]+"=read(HL++);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[1] == "(HL-)") {
                                    /* 0x3A LD A,(HL-) [1 8] */
                                    elem = "let HL="+HL+";"+params[0]+"=read(HL--);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[1] == "(C)") {
                                    /* 0xF2 LD A,(C) [2 8] */
                                    elem = params[0]+"=read(0xFF00|C);";
                                } else if (params[1] == "(a16)") {
                                    /* 0xFA LD A,(a16) [3 16] */
                                    elem = params[0]+"="+a16+";";
                                }
                            } else if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[0].replace("(", "").replace(")", "")) != -1) {
                                    /* 0x02 LD (BC),A [1 8] */
                                    /* 0x12 LD (DE),A [1 8] */
                                    /* 0x70 LD (HL),B [1 8] */
                                    /* 0x71 LD (HL),C [1 8] */
                                    /* 0x72 LD (HL),D [1 8] */
                                    /* 0x73 LD (HL),E [1 8] */
                                    /* 0x74 LD (HL),H [1 8] */
                                    /* 0x75 LD (HL),L [1 8] */
                                    /* 0x77 LD (HL),A [1 8] */
                                    let params1 = params[0].replace("(", "").replace(")", "");
                                    elem = "write("+params1[0]+"<<8|"+params1[1]+","+params[1]+");";
                                } else if (params[0] == "(HL+)") {
                                    /* 0x22 LD (HL+),A [1 8] */
                                    elem = "let HL="+HL+";write(HL++,"+params[1]+");if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[0] == "(HL-)") {
                                    /* 0x32 LD (HL-),A [1 8] */
                                    elem = "let HL="+HL+";write(HL--,"+params[1]+");if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[0] == "(C)") {
                                    /* 0xE2 LD (C),A [2 8] */
                                    elem = "write(0xFF00|C,"+params[1]+");";
                                } else if (params[0] == "(a16)") {
                                    /* 0xEA LD (a16),A [3 16] */
                                    elem = "write("+d16+","+params[1]+");";
                                }
                            } else if (params[1] == "d16") {
                                /* 0x01 LD BC,d16 [3 12] */
                                /* 0x11 LD DE,d16 [3 12] */
                                /* 0x21 LD HL,d16 [3 12] */
                                elem = _mnem[1][1]+"="+d8+";"+_mnem[1][0]+"=read(PC+2);";
                            } else if (_mnem[1] == "SP,d16") {
                                /* 0x31 LD SP,d16 [3 12] */
                                elem = "SP="+d16+";";
                            } else if (_mnem[1] == "HL,SP+r8") {
                                /* 0xF8 LD HL,SP+r8 [2 12] 00hc */
                                elem = r8+"let s=SP+r8;if(r8<0)r8+=65536;n=0;c=s>65535;h=(SP%4096)+(r8%4096)>4095;let HL=s%65536;H=HL>>>8;L=HL&0xFF;z=0;";
                            } else if (_mnem[1] == "SP,HL") {
                                /* 0xF9 LD SP,HL [1 8] */
                                elem = "SP="+HL+";";
                            } else if (_mnem[1] == "(a16),SP") {
                                /* 0x08 LD (a16),SP [3 20] */
                                elem = "write16("+d16+",SP);";
                            } else if (_mnem[1] == "(HL),d8") {
                                /* 0x36 LD (HL),d8 [2 12] */
                                elem = "write("+HL+","+d8+");";
                            }
                        }
                    break;                    
                    case "ADD":                        
                        if (params.length == 2) {
                            if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                    /* 0x80 ADD A,B [1 4] z0hc */
                                    /* 0x81 ADD A,C [1 4] z0hc */
                                    /* 0x82 ADD A,D [1 4] z0hc */
                                    /* 0x83 ADD A,E [1 4] z0hc */
                                    /* 0x84 ADD A,H [1 4] z0hc */
                                    /* 0x85 ADD A,L [1 4] z0hc */
                                    /* 0x87 ADD A,A [1 4] z0hc */
                                    elem = "let v="+params[1]+";let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                                } else if (params[1] == "(HL)") {
                                    /* 0x86 ADD A,(HL) [1 8] z0hc */
                                    elem = "let v="+fromHL+";let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                                } else if (params[1] == "d8") {
                                    /* 0xC6 ADD A,d8 [2 8] z0hc */
                                    elem = "let v="+d8+";let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                                }                                
                            } else if (REGISTERS_16_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[1]) != -1) {
                                    /* 0x09 ADD HL,BC [1 8] -0hc */
                                    /* 0x19 ADD HL,DE [1 8] -0hc */
                                    /* 0x29 ADD HL,HL [1 8] -0hc */
                                    elem = "let "+params[0]+"="+params[0][0]+"<<8|"+params[0][1]+";let "+params[1]+"="+params[1][0]+"<<8|"+params[1][1]+";let s="+params[0]+"+"+params[1]+";if("+params[1]+"<0)"+params[1]+"+=65536;n=0;c=s>65535;h="+params[0]+"%4096+"+params[1]+"%4096>4095;"+params[0]+"=s%65536;";
                                } else if (params[1] == "SP") {
                                    /* 0x39 ADD HL,SP [1 8] -0hc */
                                    elem = "let "+params[0]+"="+params[0][0]+"<<8|"+params[0][1]+";let s="+params[0]+"+SP;if(SP<0)SP+=65536;n=0;c=s>65535;h="+params[0]+"%4096+SP%4096>4095;"+params[0]+"=s%65536;";
                                } else if (params[1] == "r8") {
                                    /* 0xE8 ADD SP,r8 [2 16] 00hc */
                                    elem = r8+"if(r8<0)r8=r8+0x010000;let s=SP+r8;n=0;c=s>255;h=SP%16+r8%16>15;SP=s%256;z=0;";
                                }
                            }
                        }
                    break;   
                    case "ADC":    
                        if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                            /* 0x88 ADC A,B [1 4] z0hc */
                            /* 0x89 ADC A,C [1 4] z0hc */
                            /* 0x8A ADC A,D [1 4] z0hc */
                            /* 0x8B ADC A,E [1 4] z0hc */
                            /* 0x8C ADC A,H [1 4] z0hc */
                            /* 0x8D ADC A,L [1 4] z0hc */
                            /* 0x8F ADC A,A [1 4] z0hc */
                            elem = "let v="+params[1]+"+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                        } else if (params[1] == "(HL)") {
                            /* 0x8E ADC A,(HL) [1 8] z0hc */
                            elem = "let v="+fromHL+"+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                        } else if (params[1] == "d8") {
                            /* 0xCE ADC A,d8 [2 8] z0hc */
                            elem = "let v="+d8+"+c;let s=A+v;n=0;c=s>255;z=!(s%256);h=A%16+v%16>15;A=s%256;";
                        }
                    break;    
                    case "SUB":
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0x90 SUB B [1 4] z1hc */
                            /* 0x91 SUB C [1 4] z1hc */
                            /* 0x92 SUB D [1 4] z1hc */
                            /* 0x93 SUB E [1 4] z1hc */
                            /* 0x94 SUB H [1 4] z1hc */
                            /* 0x95 SUB L [1 4] z1hc */
                            /* 0x97 SUB A [1 4] z1hc */
                            elem = "let v="+_mnem[1]+";let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0x96 SUB (HL) [1 8] z1hc */
                            elem = "let v="+fromHL+";let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        } else if (_mnem[1] == "d8") {
                            /* 0xD6 SUB d8 [2 8] z1hc */
                            elem = "let v="+d8+";let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;A=(d+0x0100)%0x0100;";
                        }
                    break;    
                    case "SBC":    
                        if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                            /* 0x98 SBC A,B [1 4] z1hc */
                            /* 0x99 SBC A,C [1 4] z1hc */
                            /* 0x9A SBC A,D [1 4] z1hc */
                            /* 0x9B SBC A,E [1 4] z1hc */
                            /* 0x9C SBC A,H [1 4] z1hc */
                            /* 0x9D SBC A,L [1 4] z1hc */
                            /* 0x9F SBC A,A [1 4] z1hc */
                            elem = params[1];
                        } else if (params[1] == "(HL)") {
                            /* 0x9E SBC A,(HL) [1 8] z1hc */
                            elem = HL;
                        } else if (params[1] == "d8") {
                            /* 0xDE SBC A,d8 [2 8] z1hc */
                            elem = d8;
                        }
                        elem = "let v=" + elem + "+c;let d=A-v;z=!d;n=1;h=A%16-v%16<0;c=d<0;A=(d+0x0100)%0x0100;";
                    break;    
                    case "AND":    
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xA0 AND B [1 4] z010 */
                            /* 0xA1 AND C [1 4] z010 */
                            /* 0xA2 AND D [1 4] z010 */
                            /* 0xA3 AND E [1 4] z010 */
                            /* 0xA4 AND H [1 4] z010 */
                            /* 0xA5 AND L [1 4] z010 */
                            /* 0xA7 AND A [1 4] z010 */
                            elem = "A=A&"+_mnem[1]+";";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xA6 AND (HL) [1 8] z010 */
                            elem = "A=A&"+fromHL+";";
                        } else if (_mnem[1] == "d8") {
                            /* 0xE6 AND d8 [2 8] z010 */
                            elem = "A=A&"+d8+";";
                        }
                        elem += "z=!A;n=0;h=1;c=0;";
                    break;    
                    case "XOR":    
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xA8 XOR B [1 4] z000 */
                            /* 0xA9 XOR C [1 4] z000 */
                            /* 0xAA XOR D [1 4] z000 */
                            /* 0xAB XOR E [1 4] z000 */
                            /* 0xAC XOR H [1 4] z000 */
                            /* 0xAD XOR L [1 4] z000 */
                            /* 0xAF XOR A [1 4] z000 */
                            elem = "A=A^"+_mnem[1]+";";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xAE XOR (HL) [1 8] z000 */
                            elem = "A=A^"+fromHL+";";
                        } else if (_mnem[1] == "d8") {
                            /* 0xEE XOR d8 [2 8] z000 */
                            elem = "A=A^"+d8+";";
                        }
                        elem += "z=!A;n=h=c=0;";
                    break;    
                    case "OR":     
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xB0 OR B [1 4] z000 */
                            /* 0xB1 OR C [1 4] z000 */
                            /* 0xB2 OR D [1 4] z000 */
                            /* 0xB3 OR E [1 4] z000 */
                            /* 0xB4 OR H [1 4] z000 */
                            /* 0xB5 OR L [1 4] z000 */
                            /* 0xB7 OR A [1 4] z000 */
                            elem = "A=A|"+_mnem[1]+";";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xB6 OR (HL) [1 8] z000 */
                            elem = "A=A|"+fromHL+";";
                        } else if (_mnem[1] == "d8") {
                            /* 0xF6 OR d8 [2 8] z000 */
                            elem = "A=A|"+d8+";";
                        }
                        elem += "z=!A;n=h=c=0;";
                    break;   
                    case "CP":     
                        if (REGISTERS_8_BIT.indexOf(_mnem[1]) != -1) {
                            /* 0xB8 CP B [1 4] z1hc */
                            /* 0xB9 CP C [1 4] z1hc */
                            /* 0xBA CP D [1 4] z1hc */
                            /* 0xBB CP E [1 4] z1hc */
                            /* 0xBC CP H [1 4] z1hc */
                            /* 0xBD CP L [1 4] z1hc */
                            /* 0xBF CP A [1 4] z1hc */
                            elem = "let v="+_mnem[1]+";";
                        } else if (_mnem[1] == "(HL)") {
                            /* 0xBE CP (HL) [1 8] z1hc */
                            elem = "let v="+fromHL+";";
                        } else if (_mnem[1] == "d8") {
                            /* 0xFE CP d8 [2 8] z1hc */
                            elem = "let v="+d8+";";
                        }
                        elem += "let d=A-v;n=1;c=d<0;z=!d;h=A%16-v%16<0;";
                    break;   
                    case "RET":   
                        switch(_mnem[1]) {
                            case "NZ":
                                /* 0xC0 RET NZ [1 20/8] */
                                elem = "if(z)cycle=8;else{PC=pop16();}";
                            break;
                            case "Z":
                                /* 0xC8 RET Z [1 20/8] */
                                elem = "if(z){PC=pop16();}else cycle=8;";
                            break;
                            case "NC":
                                /* 0xD0 RET NC [1 20/8] */
                                elem = "if(c)cycle=8;else{PC=pop16();}";
                            break;
                            case "C":
                                /* 0xD8 RET C [1 20/8] */
                                elem = "if(c){PC=pop16();}else cycle=8;";
                            break;
                        }
                    break;    
                    case "STOP":   
                        /* 0x10 STOP 0 [2 4] */
                        elem = "stopped=true;";
                    break;   
                    case "JR":
                        switch (_mnem[1]) {
                            case "r8":
                                /* 0x18 JR r8 [2 12] */
                                elem = r8+"PC=PC+r8;";
                            break;
                            case "NZ,r8":
                                /* 0x20 JR NZ,r8 [2 12/8] */
                                elem = "if(z)cycle=8;else{"+r8+"PC=PC+r8;}";
                            break;
                            case "Z,r8":
                                /* 0x28 JR Z,r8 [2 12/8] */
                                elem = "if(z){"+r8+"PC=PC+r8;}else cycle=8;";
                            break;
                            case "NC,r8":
                                /* 0x30 JR NC,r8 [2 12/8] */
                                elem = "if(c)cycle=8;else{"+r8+"PC=PC+r8;}";
                            break;
                            case "C,r8":
                                /* 0x38 JR C,r8 [2 12/8] */                            
                                elem = "if(c){"+r8+"PC=PC+r8;}else cycle=8;";
                            break;
                        }                        
                    break;   
                    case "JP":
                        switch (_mnem[1]) {
                            case "NZ,a16":
                                /* 0xC2 JP NZ,a16 [3 16/12] */
                                elem = "if(z)cycle=12;else{let byte="+d8+";byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}";
                            break;
                            case "a16":
                                /* 0xC3 JP a16 [3 16] */
                                elem = "PC="+d16+";";
                            break;
                            case "Z,a16":
                                /* 0xCA JP Z,a16 [3 16/12] */
                                elem = "if(z){let byte="+d8+";byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=12;";
                            break;
                            case "NC,a16":
                                /* 0xD2 JP NC,a16 [3 16/12] */
                                elem = "if(c)cycle=12;else{let byte="+d8+";byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}";
                            break;
                            case "C,a16":
                                /* 0xDA JP C,a16 [3 16/12] */
                                elem = "if(c){let byte="+d8+";byte=byte<0x80?byte:(byte-0x0100);PC=PC+byte;}else cycle=12;";
                            break;
                            case "(HL)":
                                /* 0xE9 JP (HL) [1 4] */
                                elem = "PC="+HL+"";
                            break;
                        }
                    break;   
                    case "CALL":   
                        switch (_mnem[1]) {
                            case "NZ,a16":
                                /* 0xC4 CALL NZ,a16 [3 24/12] */
                                elem = "if(z)cycle=12;else{write16(SP-2,PC+2);PC="+d16+";SP=(SP+0x010000)%0x010000;}";
                            break;
                            case "Z,a16":
                                /* 0xCC CALL Z,a16 [3 24/12] */
                                elem = "if(z){write16(SP-2,PC+2);PC="+d16+";SP=(SP+0x010000)%0x010000;}else cycle=12;";
                            break;
                            case "a16":
                                /* 0xCD CALL a16 [3 24] */
                                elem = "write16(SP-2,PC+2);PC="+d16+";SP=(SP+0x010000)%0x010000;";
                            break;
                            case "NC,a16":
                                /* 0xD4 CALL NC,a16 [3 24/12] */
                                elem = "if(c)cycle=12;else{write16(SP-2,PC+2);PC="+d16+";SP=(SP+0x010000)%0x010000;}";
                            break;
                            case "C,a16":
                                /* 0xDC CALL C,a16 [3 24/12] */
                                elem = "if(c){write16(SP-2,PC+2);PC="+d16+";SP=(SP+0x010000)%0x010000;}else cycle=12;";
                            break;
                        }
                    break;     
                    case "RST":
                        /* 0xC7 RST 00H [1 16] */
                        /* 0xCF RST 08H [1 16] */
                        /* 0xD7 RST 10H [1 16] */
                        /* 0xDF RST 18H [1 16] */
                        /* 0xE7 RST 20H [1 16] */
                        /* 0xEF RST 28H [1 16] */
                        /* 0xF7 RST 30H [1 16] */
                        /* 0xFF RST 38H [1 16] */
                        elem = "push16(PC+1);PC=0x"+_mnem[1].replace("H","")+";";
                    break;             
                    case "PREFIX": 
                        /* 0xCB PREFIX CB [1 4] */
                        elem = "cbinstruction("+d8+");";
                    break;       
                    case "LDH":    
                        if (_mnem[1] == "(a8),A") {
                            /* 0xE0 LDH (a8),A [2 12] */
                            elem = "write(0xFF00|"+d8+",A);";
                        } else if (_mnem[1] == "A,(a8)") {
                            /* 0xF0 LDH A,(a8) [2 12] */                            
                            elem = "A=read(0xFF00|"+d8+");";
                        }
                    break;    
                }
            } else
                switch (mnem) {
                    case "NOP":  
                        /* 0x00 NOP [1 4] */
                        elem = "";
                    break;
                    case "DAA":
                        /* 0x27 DAA [1 4] z-0c */
                        elem = "DAA();";
                    break;
                    case "RRA":
                        /* 0x1F RRA [1 4] 000c */
                        elem = "cbinstruction(31);z=0;";
                    break;
                    case "RLA":
                        /* 0x17 RLA [1 4] 000c */
                        elem = "cbinstruction(23);z=0;";
                    break;
                    case "RLCA":
                        /* 0x07 RLCA [1 4] 000c */
                        elem = "cbinstruction(7);z=0;";
                    break;
                    case "RRCA":
                        /* 0x0F RRCA [1 4] 000c */
                        elem = "cbinstruction(15);z=0;";
                    break;
                    case "CCF":    
                        /* 0x3F CCF [1 4] -00c */
                        elem = "n=h=0;c=1-c;";
                    break;
                    case "SCF":    
                        /* 0x37 SCF [1 4] -001 */
                        elem = "n=h=0;c=1;";
                    break;
                    case "CPL":    
                        /* 0x2F CPL [1 4] -11- */
                        elem = "A=A^0xFF;n=h=1;";
                    break;    
                    case "RET":  
                        /* 0xC9 RET [1 16] */
                        elem = "PC=pop16();";
                    break;
                    case "RETI":
                        /* 0xD9 RETI [1 16] */
                        elem = "IME=true;PC=pop16();";
                    break;
                    case "DI":   
                        /* 0xF3 DI [1 4] */
                        elem = "IME=false;";   
                    break;
                    case "EI":   
                        /* 0xFB EI [1 4] */
                        elem = `IME=true;
                                                 let intvector = readIO8bit(15);
                                                 if (intvector & 0x01 && intEnable & 0x01 && interrupt(64)) intvector &= ~0x01;
                                                 if (intvector & 0x02 && intEnable & 0x02 && interrupt(72)) intvector &= ~0x02;
                                                 if (intvector & 0x04 && intEnable & 0x04 && interrupt(80)) intvector &= ~0x04;
                                                 if (intvector & 0x08 && intEnable & 0x08 && interrupt(88)) intvector &= ~0x08;
                                                 if (intvector & 0x10 && intEnable & 0x10 && interrupt(96)) intvector &= ~0x10;
                                                 writeIO8bit(15, intvector);`;   
                    break;
                    case "HALT": 
                        /* 0x76 HALT [1 4] */
                        elem = "if(IME)stopped=true;"; 
                    break;
                }
        }
        mnem += " ".repeat(11 - mnem.length);
        if (len) {
            mnem += " [" + len + " " + cyc + "]";
        }
        mnem += " ".repeat(21 - mnem.length);
        if (flag) {
            mnem += " " + flag.split(" ").join("").replace("----","").toLowerCase() + " ";
        }
        mnem += " ".repeat(27 - mnem.length);
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