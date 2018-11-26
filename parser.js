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