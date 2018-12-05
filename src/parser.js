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
            if (_mnem.length > 1)
                switch (_mnem[0]) {
                    // case "STOP":   elem = "STOP();"; break;   
                    case "PUSH":   elem = "addressSpace.write(--SP,"+_mnem[1][0]+");addressSpace.write(--SP,"+_mnem[1][1]+");"; break;
                    case "POP":    elem = _mnem[1][1]+"=addressSpace.read(SP++);"+_mnem[1][0]+"=addressSpace.read(SP++);"; break;
                    // case "ADD":    elem = "ADD(" + _mnem[1] + ");"; break;                    
                    case "INC":    
                        switch (_mnem[1]) {
                            case "A":
                            case "L":
                            case "H":
                            case "E":
                            case "D":
                            case "C":
                            case "B": elem = _mnem[1]+"=increment("+_mnem[1]+");"; break;
                            case "(HL)": elem = "let HL=H<<8|L;addressSpace.write(HL,addressSpace.read(HL)+1);";
                            break;
                            default: elem = "let val="+_mnem[1][0]+"<<8|"+_mnem[1][1]+"+1;"+_mnem[1][0]+"=val>>>8;"+_mnem[1][1]+"=val&0xFF;";
                        } 
                    break;
                    case "DEC":
                        switch (_mnem[1]) {
                            case "A":
                            case "L":
                            case "H":
                            case "E":
                            case "D":
                            case "C":
                            case "B": elem = _mnem[1]+"=decrement("+_mnem[1]+");"; break;
                            case "(HL)": elem = "let HL=H<<8|L;addressSpace.write(HL,addressSpace.read(HL)-1);";
                            break;
                            default: elem = "let val="+_mnem[1][0]+"<<8|"+_mnem[1][1]+"-1;"+_mnem[1][0]+"=val>>>8;"+_mnem[1][1]+"=val&0xFF;";
                        } 
                    break;
                    case "LD":
                        let params = _mnem[1].split(",");
                        if (params.length == 2) {// && params[0] != params[1]
                            if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                    elem = params[0]+"="+params[1]+";";
                                } else if (REGISTERS_16_BIT.indexOf(params[1].replace("(", "").replace(")", "")) != -1) {
                                    let params1 = params[1].replace("(", "").replace(")", "");
                                    elem = params[0]+"=addressSpace.read("+params1[0]+"<<8|"+params1[1]+");";
                                } else if (params[1] == "d8") {
                                    elem = params[0]+"=addressSpace.read(PC+1);";
                                } else if (params[1] == "(HL+)") {
                                    elem = "let HL=H<<8|L;"+params[0]+"=addressSpace.read(HL++);if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[1] == "(HL-)") {
                                    elem = "let HL=H<<8|L;"+params[0]+"=addressSpace.read(HL--);if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;}";
                                } else if (params[1] == "(C)") {
                                    elem = params[0]+"=addressSpace.read(0xFF00|C);";
                                } else if (params[1] == "(a16)") {
                                    elem = params[0]+"=addressSpace.read(addressSpace.read(PC+2)<<8|addressSpace.read(PC+1)));";
                                } else {
                                    elem = "/*none1*/";
                                }
                            } else if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[0].replace("(", "").replace(")", "")) != -1) {
                                    let params1 = params[0].replace("(", "").replace(")", "");
                                    elem = "addressSpace.write("+params1[0]+"<<8|"+params1[1]+","+params[1]+");";
                                } else if (params[0] == "(HL+)") {
                                    elem = "let HL=H<<8|L;addressSpace.write(HL++,"+params[1]+");if(HL>0xFFFF){H=0;L=0;}else{H=HL>>>8;L=HL&0xFF;";
                                } else if (params[0] == "(HL-)") {
                                    elem = "let HL=H<<8|L;addressSpace.write(HL--,"+params[1]+");if(HL<0){H=0xFF;L=0xFF;}else{H=HL>>>8;L=HL&0xFF;";
                                } else if (params[0] == "(C)") {
                                    elem = "addressSpace.write(0xFF00|C,"+params[1]+");";
                                } else if (params[0] == "(a16)") {
                                    elem = "addressSpace.write(addressSpace.read(PC+2)<<8|addressSpace.read(PC+1),"+params[1]+");";
                                } else {
                                    elem = "/*none2*/";
                                }
                            } else if (params[1] == "d16") {
                                elem = _mnem[1][1]+"=addressSpace.read(PC+1);"+_mnem[1][0]+"=addressSpace.read(PC+2);";
                            } else if (_mnem[1] == "HL,SP+r8") {                      
                                elem = "let data=addressSpace.read(PC+1); data=data<128?data:(data-256); let HL=(SP+);H=HL>>>8;L=HL&0xFF;F=F&0b01110000";
                            //* 0xF8 LD HL,SP+r8  PC=PC+1; HL = add16(SP, signImmediate8()); Z = 0;

                            // var val = 0;
                            // val = getAddress(PC|0)|0;
                            // if(val >= 128){
                            //    return ((val|0) - 256)|0;
                            // }
                            // return val|0;
                            
                            // function add16(a, b){
                            //     if (b < 0) b = b + 65536;
                            //     FN = 0;
                            //     if (a + b >= 65536) 
                            //        FC = 1;
                            //     else 
                            //        FC = 0;
                            //     
                            //     if ((a % 4096) + b % 4096 >= 4096)
                            //        FH = 1;
                            //     else 
                            //        FH = 0;
                            //     
                            //     return (a + b) % 65536;
                            //  }
                            } else if (_mnem[1] == "SP,HL") {
                                elem = "SP=H<<8|L;";
                            } else if (_mnem[1] == "(a16),SP") {
                                elem = "let addr=addressSpace.read(PC+2)<<8|addressSpace.read(PC+1);addressSpace.write(addr,SP&0xFF);addressSpace.write(addr+1,SP>>>8);";
                            } else if (_mnem[1] == "(HL),d8") {
                                elem = "addressSpace.write(H<<8|L,addressSpace.read(PC+1));";
                            } else {
                                elem = "/*none3*/";
                            }
                        }
                    break;
// d8  means immediate 8 bit data
// d16 means immediate 16 bit data
// a8  means 8 bit unsigned data, which are added to $FF00 in certain instructions (replacement for missing IN and OUT instructions)
// a16 means 16 bit address
// r8  means 8 bit signed data, which are added to program counter

// LD A,(C) has alternative mnemonic LD A,($FF00+C)
// LD C,(A) has alternative mnemonic LD ($FF00+C),A
// LDH A,(a8) has alternative mnemonic LD A,($FF00+a8)
// LDH (a8),A has alternative mnemonic LD ($FF00+a8),A
// LD A,(HL+) has alternative mnemonic LD A,(HLI) or LDI A,(HL)
// LD (HL+),A has alternative mnemonic LD (HLI),A or LDI (HL),A
// LD A,(HL-) has alternative mnemonic LD A,(HLD) or LDD A,(HL)
// LD (HL-),A has alternative mnemonic LD (HLD),A or LDD (HL),A
// LD HL,SP+r8 has alternative mnemonic LDHL SP,r8
                    
                    // case "ADD":    elem = "ADD("+_mnem[1]+");"; break;   
                    // case "CCF":    elem = "CCF("+_mnem[1]+");"; break;             
                    // case "JR":     elem = "JR("+_mnem[1]+");"; break;   
                    // case "CPL":    elem = "CPL("+_mnem[1]+");"; break;    
                    // case "ADC":    elem = "ADC("+_mnem[1]+");"; break;    
                    // case "SUB":    elem = "SUB("+_mnem[1]+");"; break;    
                    // case "SBC":    elem = "SBC("+_mnem[1]+");"; break;    
                    // case "AND":    elem = "AND("+_mnem[1]+");"; break;    
                    // case "XOR":    elem = "XOR("+_mnem[1]+");"; break;    
                    // case "OR":     elem = "OR("+_mnem[1]+");"; break;   
                    // case "CP":     elem = "CP("+_mnem[1]+");"; break;   
                    // case "RET":    elem = "RET("+_mnem[1]+");"; break;    
                    // case "JP":     elem = "JP("+_mnem[1]+");"; break;   
                    // case "CALL":   elem = "CALL("+_mnem[1]+");"; break;     
                    // case "RST":    elem = "RST("+_mnem[1]+");"; break;             
                    // case "PREFIX": elem = "PREFIX("+_mnem[1]+");"; break;       
                    // case "LDH":    elem = "LDH("+_mnem[1]+");"; break;    
                    default:
                        elem = _mnem[0] + "("+_mnem[1]+");";
                }
            else
                switch (mnem) {
                    // DAA
                    // RRA
                    // RLA
                    // RLCA
                    // RRCA
                    // RETI
                    case "NOP":  break;                    
                    case "DI":   elem = "IME=false;";   break;
                    case "EI":   elem = "IME=true;interrupt();";   break;
                    case "HALT": elem = "if (IME) STOP();"; break;
                    default: elem = mnem + "();";
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

// (()=>{
//     let legend = Array.from(document.querySelectorAll("body>table:nth-child(13)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>table:nth-child(1) tr"))
//                       .reduce((obj, tr)=>(obj[tr.childNodes[0].attributes['bgcolor'].textContent]=tr.childNodes[2].textContent, obj), {})

//     function parser(r,c,childNodes) {
//         let comm = "", setFlag = "", cycles = "";
//         if (childNodes.length > 4) {
//             let name = childNodes[0].textContent, len = childNodes[2].textContent, flag = childNodes[4].textContent; 
//             comm = "//"+name+" {"+len+"} "+(flag=="- - - -"?"":flag)+"\n";
            
//             setFlag = flag.split(" ")
//                           .filter(f=>f!="-")
//                           .map(f=> "ZNHC".indexOf(f)==-1?"//"+f:"    "+f+" = 1;")
//                           .join("\n") + "\n";

//             len = len.replace(new RegExp(String.fromCharCode(160), "g")," ")
//                      .split("  ");

//             cycles = "    cycles = " + len[1].replace("/", ";\n    cycles = ") + ";\n";
//             if (len[0] > 1) cycles = cycles + "    PC = PC + " + (len[0] - 1)  + ";\n";
//         }
//         return "case 0x"+r.toString(16).toUpperCase()+c.toString(16).toUpperCase()+":"+comm+setFlag+cycles+"break;\n"
//     }
    
//     function set(obj, bgcolor, str) {
//         let key = "none";
//         if (bgcolor) key = bgcolor.textContent;
//         if (!obj[key]) obj[key] = [];
//         obj[key].push(str);
//         return obj;
//     }
    
//     function marge(obj, o) {
//         Object.keys(o).forEach(bgcolor => (obj[bgcolor] = obj[bgcolor]||[], obj[bgcolor] = obj[bgcolor].concat(o[bgcolor])))
//         return obj;
//     }
  
//     let obj = Array.from(document.querySelectorAll("table")[0].querySelectorAll("tr:nth-child(n+2)"))
//                    .reduce((obj, tr, itr) => marge(obj, Array.from(tr.querySelectorAll("td:nth-child(n+2)"))
//                                                              .reduce((obj,td,itd) => set(obj, td.attributes['bgcolor'], parser(itr,itd,td.childNodes)), {})
//                    ), {});
//     console.log(Object.keys(obj).reduce((str,bgcolor)=>str+"\n// "+legend[bgcolor]+"\n"+obj[bgcolor].reduce((_str,s)=>_str+s, ""), ""));
// })();



