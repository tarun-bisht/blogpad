window.onload = function () {
  let pad = new blogpad();
  pad.init({
    textarea: document.getElementById("id_content"),
    toolbar: true,
    heading: true,
  });
};
