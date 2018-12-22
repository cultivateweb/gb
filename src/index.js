import { init as initGB89         } from './GB89.js';
import { init as initLR35902      } from './LR35902.js';
import { init as initAddressSpace } from './address-space.js';
import { init as initCartridge    } from './cartridge.js';

function init(buffer) {
    console.log("init");

    let cartridge;

    let gb = initGB89(
        initLR35902(
            initAddressSpace(
                cartridge = initCartridge(
                    new Uint8Array(buffer)
                )
            )
        )
    );

    document.querySelector("h1").innerHTML += " - " + cartridge.title;
    console.log("loaded: " + cartridge.title);
    return gb;
}

fetch(new Request("tetris.gb")).then(response => response.arrayBuffer())
                               .then(buffer   => init(buffer).run());

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