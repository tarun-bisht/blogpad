import blogpad from "blogpad";

window.onload=function ()
{
    let pad = new blogpad();
    pad.create(document.getElementById("id_content"),true, true);
}