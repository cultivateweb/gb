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
                            case "B": elem = "increment("+_mnem[1]+");"; break;
                            case "(HL)": elem = "addressSpace.write(word(H,L),addressSpace.read(word(H,L))+1);";
                            break;
                            default: elem = "let val=word("+_mnem[1][0]+","+_mnem[1][1]+")+1;"+_mnem[1][0]+"=hi(val);"+_mnem[1][1]+"=lo(val);";
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
                            case "B": elem = "decrement("+_mnem[1]+");"; break;
                            case "(HL)": elem = "addressSpace.write(word(H,L),addressSpace.read(word(H,L))-1);";
                            break;
                            default: elem = "let val=word("+_mnem[1][0]+","+_mnem[1][1]+")-1;"+_mnem[1][0]+"=hi(val);"+_mnem[1][1]+"=lo(val);";
                        } 
                    break;
                    case "LD":
                        let params = _mnem[1].split(",");
                        if (params.length == 2 && params[0] != params[1]) {
                            if (REGISTERS_8_BIT.indexOf(params[0]) != -1) {
                                if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                    elem = params[0]+"="+params[1]+";";
                                } else if (REGISTERS_16_BIT.indexOf(params[1].replace("(", "").replace(")", "")) != -1) {
                                    let params1 = params[1].replace("(", "").replace(")", "");
                                    elem = params[0]+"=addressSpace.read(word("+params1[0]+","+params1[1]+"));";
                                } else if (params[1] == "d8") {    
                                    elem = params[0]+"=addressSpace.read(++PC);";
                                } else {
                                    /* 0x2A LD A,(HL+)   */
                                    /* 0x3A LD A,(HL-)   */
                                    /* 0xF2 LD A,(C)     */
                                    /* 0xFA LD A,(a16)   */
                                }
                            } else if (REGISTERS_8_BIT.indexOf(params[1]) != -1) {
                                if (REGISTERS_16_BIT.indexOf(params[0].replace("(", "").replace(")", "")) != -1) {
                                    let params1 = params[0].replace("(", "").replace(")", "");
                                    elem = "addressSpace.write(word("+params1[0]+","+params1[1]+"),"+params[1]+");";
                                }
                                /* 0x22 LD (HL+),A   */
                                /* 0x32 LD (HL-),A   */
                                /* 0xE2 LD (C),A     */
                                /* 0xEA LD (a16),A   */
                            } else if (params[1] == "d16") {
                                elem = _mnem[1][1]+"=addressSpace.read(++PC);"+_mnem[1][0]+"=addressSpace.read(++PC);";
                            }
                        }

                        /* 0xF8 LD HL,SP+r8  */
                        /* 0xF9 LD SP,HL     */
                        /* 0x08 LD (a16),SP  */
                        /* 0x36 LD (HL),d8   */
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
                    // NOP
                    // RLCA
                    // RRCA
                    // RETI
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
        return cols(tr).reduce((arr, td, c) => 
                                  parseCol(r, c, arr, td.childNodes), 
                               []); 
    }

    let rows = document.querySelectorAll("table")[0]
                       .querySelectorAll("tr:nth-child(n+2)");

    document.querySelector("pre").innerHTML = 
        Array.from(rows)
             .reduce((arr, tr, r) => arr.concat( parseRow(tr, r) ), 
                     [])
             .toString();
})();


// (()=>{
//     const A = 0;
//     const F = 1;
//     const B = 2;
//     const C = 3;
//     const D = 4;
//     const E = 5;
//     const H = 6;
//     const L = 7;
    
//     const AF = 0; //accumulator+flag registers
//     const BC = 1;
//     const DE = 2;
//     const HL = 3;
//     const PC = 4; // program counter 
//     const SP = 5; // stack pointer
    
//     // const d16 = 6;
    
//     // flag masks of register F [Z N H C 0 0 0 0]
//     const FLAG_MASK_SET_Z = 0b10000000; // Zero Flag
//     const FLAG_MASK_SET_N = 0b01000000; // Subtract Flag
//     const FLAG_MASK_SET_H = 0b00100000; // Half Carry Flag
//     const FLAG_MASK_SET_C = 0b00010000; // Carry Flag
    
//     const FLAG_MASK_UNSET_Z = 0b01110000;
//     const FLAG_MASK_UNSET_N = 0b10110000;
//     const FLAG_MASK_UNSET_H = 0b11010000;
//     const FLAG_MASK_UNSET_C = 0b11100000;
    
//         const REGISTERS = new Uint16Array([0x0100, 0x0013, 0x00D8, 0x014D, 0x0100, 0xFFFE]);
    
//         function word(lo, hi) { return hi << 8 | lo; }
    
//         function hi(word) { return word >>> 8; }
//         function lo(word) { return word & 0xFF; }
    
//         function increment(value8bit) {
//             let F = lo(REGISTERS[AF]);
//             let flagN = false, flagH = false, flagZ = (F & FLAG_MASK_SET_Z) == FLAG_MASK_SET_Z;
//             if (value8bit > 254) {
//                 flagN = flagH = true;
//                 value8bit = 0;
//             } else {
//                 flagZ = false;
//                 if (value8bit % 16 == 15) flagH = true;
//                 value8bit = value8bit + 1;
//             }
//             F = flagZ ? (F | FLAG_MASK_SET_Z) : (F & FLAG_MASK_UNSET_Z);
//             F = flagN ? (F | FLAG_MASK_SET_N) : (F & FLAG_MASK_UNSET_N);
//             F = flagH ? (F | FLAG_MASK_SET_H) : (F & FLAG_MASK_UNSET_H);
//             REGISTERS[AF] = word(F, hi(REGISTERS[AF]));
//             return value8bit;
//         }
//     REGISTERS.forEach((e, i)=>console.log(i, e.toString(2)));
//     console.log(increment(255));
//     REGISTERS.forEach((e, i)=>console.log(i, e.toString(2)));
// })();

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



