import BlogPad from "blogpad";

window.onload = function () {
  let pad = new BlogPad();
  pad.init({
    textarea: document.getElementById("id_content"),
    toolbar: true,
    heading: true,
  });
};
