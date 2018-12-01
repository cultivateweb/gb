(()=>{
    const MNEM_NODE = 0;
    const LEN_CYC_NODE = 2;
    const FLAG_NODE = 4;

    const LEN = 0;
    const CYC = 1;

    function cols(tr) { return Array.from(tr.querySelectorAll("td:nth-child(n+2)")); }

    function parseCol_(arr, nodes) {
        let elem = 0;
        if (nodes.length > 4) 
            elem = nodes[LEN_CYC_NODE].textContent
                                      .replace(new RegExp(String.fromCharCode(160), "g")," ")
                                      .split("  ")[LEN];
        arr.push(elem);
        return arr;
    }

    function parseCol(r, c, arr, nodes) {
        const opcode = "0x" + r.toString(16).toUpperCase() + c.toString(16).toUpperCase();
        let elem = "";
        let mnem = "";
        if (nodes.length > 4) {
            mnem = nodes[MNEM_NODE].textContent;
            let _mnem = mnem.split(" ");
            if (_mnem.length > 1)
                switch (_mnem[0]) {
                    case "STOP":
                        elem = "stop();";
                    break;   
                    case "PUSH":
                      elem = "push(" + _mnem[1] + ");";
                    break;
                    case "POP":
                        elem = "pop(" + _mnem[1] + ");";
                    break;
                    case "ADD":
                        elem = "add(" + _mnem[1] + ");";
                    break;                    
                    case "INC":
                        elem = "inc(" + _mnem[1] + ");";
                    break;
                    case "DEC":
                        elem = "dec(" + _mnem[1] + ");";
                    break;
                    // ADD
                    // CCF          
                    // INC 
                    // DEC 
                    // JR 
                    // CPL 
                    // ADC 
                    // SUB 
                    // SBC 
                    // AND 
                    // XOR 
                    // OR 
                    // CP 
                    // RET 
                    // JP 
                    // CALL 
                    // RST          
                    // PREFIX 
                    // LDH 
                    case "LD":
                      let mov = "mov";
                      let params = _mnem[1].split(",");
                      if (params[0] == "d16") {
                        mov = "mov16ToRam";
                      }
                      if (params[1] == "d16") {
                        mov = "mov16FromRam";
                      }
                      elem = mov + "("+params.toString()+");";
                    break;
                    default:
                }
            else
                switch (mnem) {
                    case "DAA":
                        elem = "dda();";
                    break;                    
                    case "RRA":
                        elem = "rra();";
                    break;                    
                    case "RLA":
                        elem = "rla();";
                    break;                    
                    case "NOP":
                        elem = "nop();";
                    break;                    
                    case "RLCA":
                        elem = "rlca();";
                    break;                    
                    case "RRCA":
                        elem = "rrca();";
                    break;                    
                    case "RETI":
                        elem = "reti();";
                    break;                    
                    case "DI":
                        elem = "di();";
                    break;                    
                    case "EI":
                        elem = "ei();";
                    break;                    
                    case "HALT":
                        elem = "halt();";
                    break;                    
                }
        }           
        // let __mnem = "";
        // if (mnem) __mnem = mnem; 
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

(()=>{
    let legend = Array.from(document.querySelectorAll("body>table:nth-child(13)>tbody:nth-child(1)>tr:nth-child(1)>td:nth-child(1)>table:nth-child(1) tr"))
                      .reduce((obj, tr)=>(obj[tr.childNodes[0].attributes['bgcolor'].textContent]=tr.childNodes[2].textContent, obj), {})

    function parser(r,c,childNodes) {
        let comm = "", setFlag = "", cycles = "";
        if (childNodes.length > 4) {
            let name = childNodes[0].textContent, len = childNodes[2].textContent, flag = childNodes[4].textContent; 
            comm = "//"+name+" {"+len+"} "+(flag=="- - - -"?"":flag)+"\n";
            
            setFlag = flag.split(" ")
                          .filter(f=>f!="-")
                          .map(f=> "ZNHC".indexOf(f)==-1?"//"+f:"    "+f+" = 1;")
                          .join("\n") + "\n";

            len = len.replace(new RegExp(String.fromCharCode(160), "g")," ")
                     .split("  ");

            cycles = "    cycles = " + len[1].replace("/", ";\n    cycles = ") + ";\n";
            if (len[0] > 1) cycles = cycles + "    PC = PC + " + (len[0] - 1)  + ";\n";
        }
        return "case 0x"+r.toString(16).toUpperCase()+c.toString(16).toUpperCase()+":"+comm+setFlag+cycles+"break;\n"
    }
    
    function set(obj, bgcolor, str) {
        let key = "none";
        if (bgcolor) key = bgcolor.textContent;
        if (!obj[key]) obj[key] = [];
        obj[key].push(str);
        return obj;
    }
    
    function marge(obj, o) {
        Object.keys(o).forEach(bgcolor => (obj[bgcolor] = obj[bgcolor]||[], obj[bgcolor] = obj[bgcolor].concat(o[bgcolor])))
        return obj;
    }
  
    let obj = Array.from(document.querySelectorAll("table")[0].querySelectorAll("tr:nth-child(n+2)"))
                   .reduce((obj, tr, itr) => marge(obj, Array.from(tr.querySelectorAll("td:nth-child(n+2)"))
                                                             .reduce((obj,td,itd) => set(obj, td.attributes['bgcolor'], parser(itr,itd,td.childNodes)), {})
                   ), {});
    console.log(Object.keys(obj).reduce((str,bgcolor)=>str+"\n// "+legend[bgcolor]+"\n"+obj[bgcolor].reduce((_str,s)=>_str+s, ""), ""));
})();



