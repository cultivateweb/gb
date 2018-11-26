import {info} from './cartridge.js';

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


var http = new XMLHttpRequest();
http.open("GET", "tetris.gb");
http.responseType = "arraybuffer";
http.addEventListener("readystatechange", () => {
    if (http.readyState == 4 && http.status == 200) {
        let rom = new Uint8Array(http.response);
        let inf = info(rom);
        console.log(inf);
    }
});
http.send();