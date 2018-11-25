(function(){

    const pre = document.querySelector("pre");

    function createFileInput(action) {
        const file = document.createElement("input");
        file.type = "file";
        file.addEventListener("change", action);
        return file;
    }

    function loadROM() {
        
    }

    const file = createFileInput(e => {
        if (file.files.length > 0) {            
            const reader = new FileReader();
            reader.addEventListener("load", event => {
                console.log(event.target.result);
                //console.log();
                let rom = new Uint8Array(event.target.result);

                let s = 0x134;
                while (rom[s] != 0) {
                    pre.innerHTML = pre.innerHTML + String.fromCharCode(rom[s++]);
                }
                pre.innerHTML = pre.innerHTML + "\n";
                switch(rom[0x0147]){
                    case 0x0000:  
                        pre.innerHTML = pre.innerHTML + "ROM ONLY"; 
                        break;
                    case 0x0001:  
                        pre.innerHTML = pre.innerHTML + "MBC1"; 
                        break;
                    case 0x0002:  
                        pre.innerHTML = pre.innerHTML + "MBC1+RAM"; 
                        break;
                    case 0x0003:  
                        pre.innerHTML = pre.innerHTML + "MBC1+RAM+BATTERY"; 
                        break;
                    case 0x0005:  
                        pre.innerHTML = pre.innerHTML + "MBC2"; 
                        break;
                    case 0x0006:  
                        pre.innerHTML = pre.innerHTML + "MBC2+BATTERY"; 
                        break;
                    case 0x0008:  
                        pre.innerHTML = pre.innerHTML + "ROM+RAM"; 
                        break;
                    case 0x0009:  
                        pre.innerHTML = pre.innerHTML + "ROM+RAM+BATTERY"; 
                        break;
                    default: 
                        pre.innerHTML = pre.innerHTML + "Unknown ("+rom[0x0147]+")"; 
                        break;
                 }
                 pre.innerHTML = pre.innerHTML + "\n";
                 pre.innerHTML = pre.innerHTML + (2*Math.pow(2,rom[0x0148]))*16+"KB ROM";
                 pre.innerHTML = pre.innerHTML + "\n";
                 switch(rom[0x0149]){
                    case 0x0000: 
                        pre.innerHTML = pre.innerHTML + " - No RAM"; 
                        break;
                    case 0x0001: 
                        pre.innerHTML = pre.innerHTML + " - 2 KB RAM"; 
                        break;
                    case 0x0002: 
                        pre.innerHTML = pre.innerHTML + " - 8 KB RAM"; 
                        break;
                    case 0x0003: 
                        pre.innerHTML = pre.innerHTML + " - 32 KB RAM"; 
                        break;
                 }
                 pre.innerHTML = pre.innerHTML + "\n";
              

                //

                // event.target.result
                //reader.result.charCodeAt();

            });
            //reader.readAsBinaryString(file.files[0]);
            reader.readAsArrayBuffer(file.files[0]);
        }
    });


    document.querySelector("input").addEventListener("click", () => file.click());




    // CPU LR35902
//  let    PC  = 0x0000
    //   , RA  = 0x0001
    //   , RB  = 0x0000
    //   , RC  = 0x0013
    //   , RD  = 0x0000
    //   , RE  = 0x00D8
    //   , RHL = 0x014D
    //   , RSP = 0xFFFE

    //   , FZ  = 0b0
    //   , FN  = 0b0
    //   , FH  = 0b0
    //   , FC  = 0b0

    // 8-bit register
    let A = 0x00
      , B = 0x00
      , C = 0x00
      , D = 0x00
      , E = 0x00
      , F = 0x00
      , H = 0x00
      , L = 0x00

      , AF
      , BC
      , DE
      , HL

    // 16-bit register
      , PC = 0x0100
      , SP = 0x0000
    ;
    // Zero Flag (Z)
    // Substract Flag (N) 
    // Half Carry Flag (H)
    // Carry Flag (С)

    // IME


    // let Complement = 0;
    // for (let i = 0x134; i <= 0x14C; i++) {
    //     Complement = Complement - ROM[i] - 1; 
    // }
    // if (Complement != ROM[0x14D]) {
    //     //проверка не пройдена 
    // }


    // MMC

    // if (foreign.start) PC = foreign.start;



    let ROM = []; // ПЗУ

    let RAM = []; // ОЗУ








    let opcode = 0x00;

           if (opcode == 0x00) { // NOP
        // PC=(PC+1)|0; return 4
    } else if (opcode == 0x01) { // LD BC,d16
        // var data = 0; PC=(PC+1)|0; data = immediate16()|0; RB = data >> 8; RC = data & 0xFF; PC=(PC+2)|0; return 12
    }

    














})();