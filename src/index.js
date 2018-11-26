import {initGB89}         from './GB89.js';
import {initLR35902}      from './LR35902.js';
import {initAddressSpace} from './gb-address-space.js';
import {initCartridge}    from './gb-cartridge.js';

function initXMLHttpRequest(url, loaded) {
    var http = new XMLHttpRequest();
    http.open("GET", url);
    http.responseType = "arraybuffer";
    http.addEventListener("readystatechange", () => {
        if (http.readyState == 4 && http.status == 200) loaded(http.response);
    });
    return http;
}

let cartridge;

initXMLHttpRequest("tetris.gb", r => {
    initGB89(
        initLR35902(
            initAddressSpace(
                cartridge = initCartridge(
                    new Uint8Array(r)
                )
            )
        )
    ).run();
    console.log("loaded: " + cartridge.title);
}).send();

// const pre = document.querySelector("pre");

// function createFileInput(action) {
//     const file = document.createElement("input");
//     file.type = "file";
//     file.addEventListener("change", action);
//     return file;
// }

// const file = createFileInput(e => {
//     if (file.files.length > 0) {            
//         const reader = new FileReader();
//         reader.addEventListener("load", event => {
//             //console.log(event.target.result);
//             let rom = new Uint8Array(event.target.result);
//             let inf = info(rom);
//             console.log(inf);
//         });
//         reader.readAsArrayBuffer(file.files[0]);
//     }
// });

// document.querySelector("button").addEventListener("click", () => file.click());