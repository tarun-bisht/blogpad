import "../styles/main.scss";

export default function BlogPad() {
  //globals
  const input_style =
    "outline:none;margin:5px;padding:5px;width:180px;height:2rem;border-radius:7px 7px 7px 7px;border:1px solid #DDD;box-shadow:0 0 5px #aaa;";
  const button_style =
    "outline:none;cursor:pointer;display:block;margin:10px;width:4rem;height:2rem;border:1px solid #DDD;box-shadow:0 0 5px #aaa;";
  const commands = {
    style: [
      "bold",
      "italic",
      "underline",
      "strikeThrough",
      "subscript",
      "superscript",
    ],
    format: [
      "justifyLeft",
      "justifyCenter",
      "justifyRight",
      "foreColor",
      "backColor",
      "textSize",
    ],
    add: [
      "createLink",
      "insertHeading",
      "insertCode",
      "insertImage",
      "insertHorizontalRule",
    ],
  };
  const toolbar_btn_style =
    "background:#fff;display:block;text-align:center;width:fit-content;height:fit-content;padding:5px;border-radius:1rem 0 1rem 0;margin:5px;border:1px solid #ddd;box-shadow:0 0 3px #aaa;cursor:pointer;";
  const colors = [
    "000000",
    "FF4E00",
    "061A40",
    "FFBE0B",
    "CC0000",
    "00CC00",
    "0000CC",
    "CE2D79",
    "0A3C78",
    "FFFFFF",
    "320E3B",
    "A72608",
  ];
  let image_prompt = undefined;
  let link_prompt = undefined;
  let selection = undefined;
  let font_counter = 3;

  var last_focused = undefined;
  var container = null;

  function setup(heading) {
    if (heading) {
      create_heading(true, "Title...");
    }
    last_focused = create_paragraph(true, "Write Content Here...");
  }

  // UTILS FUNCTIONS

  function place_caret_to_end(element) {
    // Reference: https://stackoverflow.com/questions/4233265/contenteditable-set-caret-at-the-end-of-the-text-cross-browser
    if (
      typeof window.getSelection != "undefined" &&
      typeof document.createRange != "undefined"
    ) {
      let range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      let sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
      let textRange = document.body.createTextRange();
      textRange.moveToElementText(element);
      textRange.collapse(false);
      textRange.select();
    }
    element.focus();
  }
  function save_selection() {
    let select = null;
    try {
      select = window.getSelection().getRangeAt(0);
    } catch {
      select = null;
    }
    return select;
  }
  function retrieveHTMLFromClipboard(pasteEvent, callback) {
    let html_data = pasteEvent.clipboardData.getData("text/html");
    let data = undefined;
    if (html_data) {
      data = [];
      let parser = new DOMParser();
      let body = parser.parseFromString(html_data, "text/html").body;
      clean_nodes(body);
      let all_tags = body.querySelectorAll("*");
      for (let index = 0; index < all_tags.length; index++) {
        all_tags[index].removeAttribute("style");
        all_tags[index].removeAttribute("class");
        all_tags[index].removeAttribute("dir");
        all_tags[index].removeAttribute("id");
      }
      while (body.innerText.trim().length > 0) {
        let node = body.firstChild;
        if (node.nodeName == "#text") {
          if (node.wholeText.trim().length > 0) {
            data.push({ tag: "P", html: node.wholeText.trim() });
          }
          body.removeChild(node);
        } else {
          if (check_node_for_data_tags(node)) {
            if (node.tagName == "A") {
              data.push({
                tag: "A",
                link: node.getAttribute("href"),
                html: node.innerHTML,
              });
            } else if (node.tagName == "IMG") {
              data.push({
                tag: "IMG",
                link: node.getAttribute("src"),
                alt: node.getAttribute("alt"),
              });
            } else {
              data.push({ tag: node.tagName, html: node.innerHTML });
            }
            body.removeChild(node);
          } else {
            body.removeChild(node);
            if (node.innerHTML != undefined) {
              body.innerHTML = node.innerHTML + body.innerHTML;
            }
          }
        }
      }
    }
    callback(data);
  }
  function retrieveImageFromClipboardAsBase64(
    pasteEvent,
    callback,
    imageFormat
  ) {
    if (pasteEvent.clipboardData == false) {
      if (typeof callback == "function") {
        callback(undefined);
      }
    }
    let items = pasteEvent.clipboardData.items;
    if (items == undefined) {
      if (typeof callback == "function") {
        callback(undefined);
      }
    }
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") == -1) continue;
      let blob = items[i].getAsFile();
      let mycanvas = document.createElement("canvas");
      let ctx = mycanvas.getContext("2d");
      let img = new Image();
      img.onload = function () {
        mycanvas.width = this.width;
        mycanvas.height = this.height;
        ctx.drawImage(img, 0, 0);
        if (typeof callback == "function") {
          callback(mycanvas.toDataURL(imageFormat || "image/png"));
        }
      };
      let URLObj = window.URL || window.webkitURL;
      img.src = URLObj.createObjectURL(blob);
    }
  }
  function check_node_for_data_tags(node) {
    let data_nodes = [
      "P",
      "SPAN",
      "IMG",
      "PRE",
      "CODE",
      "A",
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "LI",
    ];
    if (data_nodes.indexOf(node.tagName) < 0) return false;
    return true;
  }
  function clean_nodes(node) {
    //https://www.sitepoint.com/removing-useless-nodes-from-the-dom/
    for (let index = 0; index < node.childNodes.length; index++) {
      let child = node.childNodes[index];
      if (
        child.nodeType === Node.COMMENT_NODE ||
        (child.nodeType === Node.TEXT_NODE && !/\S/.test(child.nodeValue))
      ) {
        node.removeChild(child);
        index--;
      } else if (child.nodeType === Node.DOCUMENT_POSITION_DISCONNECTED) {
        clean_nodes(child);
      }
    }
  }

  // BUTTON PRESS EVENTS
  function backspace_press(evt) {
    if (container.childElementCount > 1) {
      let element = evt.target.previousSibling;
      if (element != null) {
        place_caret_to_end(element);
      }
      evt.target.parentNode.removeChild(evt.target);
    }
  }
  function enter_press(evt) {
    let next = evt.target.nextSibling;
    if (evt.target.innerText.trim().length > 0) {
      evt.target.innerHTML = evt.target.innerHTML.trim();
      if (next == null || next.innerText.trim().length > 0) {
        create_paragraph(true, "Write Content Here...");
      } else {
        place_caret_to_end(next);
      }
    } else {
      if (next != null) {
        place_caret_to_end(next);
        evt.target.parentNode.removeChild(evt.target);
      }
    }
  }
  function enter_press_no_trim(evt) {
    let next = evt.target.nextSibling;
    if (next == null || next.innerText.trim().length > 0) {
      create_paragraph(true, "Write Content Here...");
    } else {
      place_caret_to_end(next);
    }
  }
  function onpaste(event) {
    retrieveImageFromClipboardAsBase64(event, function (imageDataBase64) {
      if (imageDataBase64) {
        create_image(imageDataBase64);
      }
    });
    retrieveHTMLFromClipboard(event, function (data) {
      if (event.target.innerText.trim().length > 0) {
        event.target.innerHTML = event.target.innerHTML.trim();
      } else {
        if (event.target != null) {
          if (event.target.previousSibling != null) {
            place_caret_to_end(event.target.previousSibling);
            event.target.parentNode.removeChild(event.target);
          } else {
            event.target.parentNode.removeChild(event.target);
          }
        }
      }
      if (data) {
        let inline_container = undefined;
        for (let index = 0; index < data.length; index++) {
          let element = data[index];
          if (
            element["tag"] == "P" ||
            element["tag"] == "LI" ||
            element["tag"] == "H5" ||
            element["tag"] == "H6"
          ) {
            inline_container = undefined;
            let p = create_paragraph(true, "Write Content Here...");
            p.innerHTML = element["html"];
            place_caret_to_end(p);
          } else if (element["tag"] == "PRE" || element["tag"] == "CODE") {
            inline_container = undefined;
            let code = create_code(true, 'print("Hello World")');
            code.innerHTML = element["html"];
            place_caret_to_end(code);
          } else if (element["tag"] == "A") {
            inline_container = undefined;
            if (event.target.innerText.trim().length > 0) {
              let link = create_link(element["link"]);
              link.innerHTML = element["html"];
              event.target.append(link);
              place_caret_to_end(event.target);
            } else {
              let p = create_paragraph(true, "Write Content Here...");
              let link = create_link(element["link"]);
              link.innerHTML = element["html"];
              p.append(link);
              place_caret_to_end(p);
            }
          } else if (element["tag"] == "IMG") {
            inline_container = undefined;
            create_image(element["link"], element["alt"]);
          } else if (element["tag"] == "SPAN") {
            if (inline_container == undefined) {
              inline_container = create_paragraph(
                true,
                "Write Content Here..."
              );
            }
            inline_container.innerHTML =
              inline_container.innerHTML + element["html"];
            place_caret_to_end(inline_container);
          } else if (
            element["tag"] == "H1" ||
            element["tag"] == "H2" ||
            element["tag"] == "H3" ||
            element["tag"] == "H4"
          ) {
            inline_container = undefined;
            let heading = create_small_heading(true, "Title...");
            heading.innerHTML = element["html"];
            place_caret_to_end(heading);
          }
        }
      } else {
        let plain_text = event.clipboardData.getData("text/plain");
        let p = create_paragraph(true, "Write Content Here...");
        p.innerHTML = plain_text.trim();
        place_caret_to_end(p);
      }
    });
  }

  // CREATING ELEMENTS FOR EDITOR
  function create_tag(tag_name, editable = false, placeholder = "Text Here") {
    let tag = document.createElement(tag_name);
    tag.setAttribute("placeholder", placeholder);
    tag.contentEditable = editable;
    if (last_focused != undefined) {
      container.insertBefore(tag, last_focused.nextSibling);
    } else {
      container.append(tag);
    }
    tag.onfocus = function () {
      last_focused = tag;
    };
    return tag;
  }
  function create_heading(editable = false, placeholder = "Text Here") {
    let heading = create_tag("h1", editable, placeholder);
    heading.style =
      "margin-bottom:3rem;font-weight:400;font-size:42px;line-height:1.25;";
    heading.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 13) {
        evt.preventDefault();
        evt.target.innerHTML = evt.target.innerHTML.trim();
        if (container.lastChild == evt.target) {
          create_paragraph(true, "Write Content Here...");
        } else {
          place_caret_to_end(evt.target.nextSibling);
        }
      }
    });
    heading.addEventListener("paste", function (evt) {
      evt.preventDefault();
      let plain_text = evt.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, plain_text);
    });
    heading.focus();
    return heading;
  }
  function create_small_heading(editable = false, placeholder = "Text Here") {
    let heading = create_tag("h3", editable, placeholder);
    heading.style =
      "margin-bottom:3rem;font-weight:400;font-size:32px;line-height:1.25;";
    heading.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 8) {
        if (evt.target.innerText.trim().length < 1) {
          evt.preventDefault();
          backspace_press(evt);
        }
      } else if (evt.keyCode == 13) {
        evt.preventDefault();
        enter_press(evt);
      }
    });
    heading.addEventListener("paste", function (evt) {
      evt.preventDefault();
      let plain_text = evt.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, plain_text);
    });
    heading.focus();
    return heading;
  }
  function create_paragraph(editable = false, placeholder = "Text Here") {
    let p = create_tag("p", editable, placeholder);
    p.style =
      "margin-bottom:1.5rem;font-size:21px;color:rgba(0,0,0,.84);line-height:1.58;letter-spacing:-.003em;font-weight:400;";
    p.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 8) {
        if (evt.target.innerText.trim().length < 1) {
          evt.preventDefault();
          backspace_press(evt);
        }
      } else if (evt.keyCode == 13) {
        evt.preventDefault();
        enter_press(evt);
      }
    });
    p.addEventListener("paste", function (evt) {
      evt.preventDefault();
      onpaste(evt);
      evt.stopPropagation();
    });
    p.focus();
    return p;
  }
  function create_code(editable = false, placeholder = "Code Here") {
    let code = create_tag("code", editable, placeholder);
    code.style =
      "display:block;font-size:14px;background-color:#eee;border-radius:20px;margin-bottom:1.5rem;padding:2rem;overflow-x:scroll;white-space:pre;";
    code.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 8) {
        if (evt.target.innerText.trim().length < 1) {
          evt.preventDefault();
          backspace_press(evt);
        }
      } else if (evt.ctrlKey && evt.keyCode == 13) {
        evt.preventDefault();
        enter_press(evt);
      }
    });
    code.addEventListener("paste", function (evt) {
      evt.preventDefault();
      let plain_text = evt.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, plain_text);
    });
    code.focus();
    return code;
  }
  function create_link(url) {
    let a = document.createElement("a");
    a.setAttribute("href", url);
    return a;
  }
  function create_image(imageLink, alt_text = "") {
    let figure = create_tag("figure", false, "");
    let image = document.createElement("img");
    let caption = create_tag("figcaption", true, "Image Caption Here..");
    figure.append(image);
    figure.append(caption);
    image.setAttribute("src", imageLink);
    image.setAttribute("alt", alt_text);
    figure.setAttribute("tabindex", 0);
    figure.style =
      "display:flex;flex-flow:column;margin:auto;margin-top:3rem;margin-bottom:3rem;width:fit-content";
    image.style = "width:720px;max-width:100%;height:auto;";
    caption.style = "padding:5px;background:#ddd;text-align:center;";
    caption.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 8) {
        event.stopPropagation();
      } else if (evt.keyCode == 13) {
        evt.preventDefault();
        figure.focus();
        event.stopPropagation();
      }
    });
    figure.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 8) {
        evt.preventDefault();
        backspace_press(evt);
      } else if (evt.keyCode == 13) {
        evt.preventDefault();
        enter_press_no_trim(evt);
      } else if (evt.ctrlKey && evt.shiftKey) {
        evt.preventDefault();
        change_image_popup(image);
      } else if (evt.ctrlKey && evt.keyCode == 38) {
        switch (image.style.width) {
          case "720px":
            image.style.width = "1080px";
            break;
          case "1080px":
            image.style.width = "480px";
            break;
          case "480px":
            image.style.width = "720px";
            break;
          default:
            break;
        }
      }
    });
    figure.ondblclick = function () {
      change_image_popup(image);
    };
    caption.addEventListener("paste", function (evt) {
      evt.preventDefault();
      let plain_text = evt.clipboardData.getData("text/plain");
      document.execCommand("insertHTML", false, plain_text);
    });
    caption.ondblclick = function (event) {
      event.stopPropagation();
    };
    figure.focus();
    return figure;
  }
  function create_break() {
    let break_div = create_tag("div", false, "");
    break_div.style = "margin-top:1rem;";
    let end = document.createElement("div");
    end.innerHTML = "...";
    end.style =
      "margin:1.5rem 0;position:relative;top:-10px;letter-spacing:5rem;font-size:32px;font-weight:800;text-align:center";
    break_div.append(end);
    break_div.setAttribute("tabindex", 0);
    break_div.addEventListener("keydown", function (evt) {
      if (evt.keyCode == 8) {
        evt.preventDefault();
        backspace_press(evt);
      } else if (evt.keyCode == 13) {
        evt.preventDefault();
        enter_press_no_trim(evt);
      }
    });
    break_div.focus();
    return break_div;
  }

  // LINK, IMAGE CHANGERS
  function change_image(url, alt) {
    let child = last_focused.firstElementChild;
    if (child.tagName == "IMG") {
      let img = child;
      img.setAttribute("src", url);
      img.setAttribute("alt", alt);
    }
  }
  function change_image_popup(image) {
    let inputs = image_prompt.inputs();
    inputs[0].value = image.getAttribute("src");
    inputs[1].value = image.getAttribute("alt");
    image_prompt.ok().setAttribute("status", "change");
    image_prompt.show();
  }

  //TOOLBAR
  function Toolbar() {
    const toolbar = `<button action="bold"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg></button>
            <button action="italic"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg></button>
            <button action="underline"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg></button>
            <button action="justifyLeft"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z"/><path d="M0 0h24v24H0z" fill="none"/></svg></button>
            <button action="justifyCenter"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z"/><path d="M0 0h24v24H0z" fill="none"/></svg></button>
            <button action="justifyRight"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z"/><path d="M0 0h24v24H0z" fill="none"/></svg></button>
            <div action="foreColor"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M5 17v2h14v-2H5zm4.5-4.2h5l.9 2.2h2.1L12.75 4h-1.5L6.5 15h2.1l.9-2.2zM12 5.98L13.87 11h-3.74L12 5.98z"/><path d="M0 0h24v24H0z" fill="none"/></svg></div>
            <div action="backColor"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg></div>
            <button action="insertHeading"><svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24" viewBox="0 0 24 24" width="24"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M2.5,4v3h5v12h3V7h5V4H2.5z M21.5,9h-9v3h3v7h3v-7h3V9z"/></g></g></g></svg></button>
            <button action="textSize"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/></svg></button>
            <button action="createLink"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg></button>
            <button action="subscript"><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="24" height="24" viewBox="0 0 24 24" version="1.1" id="svg827" sodipodi:docname="subscript.svg" inkscape:version="0.92.4 (5da689c313, 2019-01-14)"><metadata   id="metadata833">  <rdf:RDF>    <cc:Work       rdf:about="">      <dc:format>image/svg+xml</dc:format> <dc:type  rdf:resource="http://purl.org/dc/dcmitype/StillImage" />      <dc:title></dc:title>    </cc:Work>  </rdf:RDF></metadata><defs   id="defs831" /><sodipodi:namedview   pagecolor="#ffffff"   bordercolor="#666666"   borderopacity="1"   objecttolerance="10"   gridtolerance="10"   guidetolerance="10"   inkscape:pageopacity="0"   inkscape:pageshadow="2"   inkscape:window-width="1366"   inkscape:window-height="705"   id="namedview829"   showgrid="false"   inkscape:zoom="12.020815"   inkscape:cx="21.209716"   inkscape:cy="15.558705"   inkscape:window-x="-8"   inkscape:window-y="-8"   inkscape:window-maximized="1"   inkscape:current-layer="svg827"   inkscape:snap-grids="true" /><path   d="m 13.487263,14.4021 v 2.604825 h -2.91574 L 8.7021554,13.07625 8.4199869,12.421125 Q 8.3259307,12.2808 8.2906597,12.0936 h -0.035271 q -0.011757,0.0465 -0.029393,0.1014 -0.017635,0.05475 -0.04115,0.124725 -0.023514,0.0705 -0.035271,0.1014 -0.1175703,0.312 -0.2939255,0.686325 L 6.0333116,17.006925 H 3 V 14.4021 H 4.5048988 L 6.821032,9.8630998 4.645983,5.6204248 H 3.035271 v -2.620425 h 3.244938 l 1.634226,3.55635 q 0.023514,0.06225 0.2704115,0.655125 0.094056,0.140325 0.1293272,0.327525 h 0.035271 q 0.035271,-0.1404 0.1293273,-0.327525 l 0.2939256,-0.655125 1.6459834,-3.55635 h 3.021555 v 2.620425 H 11.970608 L 9.8073156,9.7850998 12.205749,14.4021 Z M 21,17.78685 V 21 h -6.043109 l -0.04703,-0.421125 q -0.03527,-0.701925 -0.03527,-0.717525 0,-0.99825 0.305683,-1.824975 0.305683,-0.82665 0.764206,-1.349175 0.458524,-0.522525 0.98759,-1.013925 0.529066,-0.491325 0.98759,-0.85005 0.458524,-0.358725 0.764206,-0.842325 0.305683,-0.483525 0.305683,-0.99825 0,-0.592725 -0.346833,-0.97485 -0.346832,-0.382125 -0.82887,-0.382125 -0.599607,0 -1.140431,0.608325 -0.164598,0.171525 -0.423253,0.592725 l -1.234487,-1.43505 q 0.305683,-0.577125 0.740693,-1.02945 0.940561,-1.0138502 2.21032,-1.0138502 1.293272,0 2.09275,0.9280502 0.799477,0.92805 0.799477,2.4723 0,1.02945 -0.405617,1.8483 -0.405617,0.818925 -0.98759,1.34145 -0.581972,0.522525 -1.169824,0.97485 -0.587851,0.452325 -1.02286,0.982725 -0.43501,0.530325 -0.482038,1.138575 h 2.727628 V 17.78685 Z" id="path825" inkscape:connector-curvature="0" style="stroke-width:0.01354198" /></svg></button>
            <button action="superscript"><svg xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:cc="http://creativecommons.org/ns#" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg" xmlns="http://www.w3.org/2000/svg" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="24" height="24" viewBox="0 0 24 24" version="1.1" id="svg1404"   sodipodi:docname="superscript.svg"   inkscape:version="0.92.4 (5da689c313, 2019-01-14)">  <metadata id="metadata1410">  <rdf:RDF>  <cc:Work  rdf:about=""> <dc:format>image/svg+xml</dc:format>        <dc:type           rdf:resource="http://purl.org/dc/dcmitype/StillImage" />        <dc:title></dc:title>      </cc:Work>    </rdf:RDF>  </metadata>  <defs     id="defs1408" />  <sodipodi:namedview     pagecolor="#ffffff"     bordercolor="#666666"     borderopacity="1"     objecttolerance="10"     gridtolerance="10"     guidetolerance="10"     inkscape:pageopacity="0"     inkscape:pageshadow="2"     inkscape:window-width="1366"     inkscape:window-height="705"     id="namedview1406"     showgrid="false"     inkscape:zoom="11.9198"     inkscape:cx="4.2865186"     inkscape:cy="11.76311"     inkscape:window-x="-8"     inkscape:window-y="-8"     inkscape:window-maximized="1"     inkscape:current-layer="svg1404" />  <path     d="M 13.50098,18.83273 V 21 H 10.58143 L 8.70961,17.72963 8.42708,17.18457 q -0.0942,-0.1168 -0.1295,-0.27253 h -0.0353 q -0.0118,0.0389 -0.0294,0.0844 -0.0177,0.0454 -0.0412,0.10382 -0.0236,0.0584 -0.0353,0.0844 -0.11772,0.25955 -0.29431,0.57102 L 6.03735,21 H 3 V 18.83273 H 4.50687 L 6.82603,15.05624 4.64814,11.52632 H 3.03532 V 9.34607 H 6.2845 l 1.63636,2.9589 q 0.0236,0.0519 0.27077,0.54507 0.0942,0.11679 0.12949,0.27253 h 0.0353 q 0.0353,-0.1168 0.1295,-0.27253 l 0.29431,-0.54507 1.64813,-2.9589 h 3.02551 v 2.18025 h -1.47155 l -2.16612,3.46503 2.40157,3.84138 z M 21,10.02091 v 2.67339 h -6.05101 l -0.0353,-0.35039 q -0.0471,-0.36338 -0.0471,-0.59697 0,-0.83057 0.30608,-1.51839 0.30608,-0.68781 0.76521,-1.12257 0.45912,-0.43475 0.98888,-0.84354 0.52976,-0.4088 0.98888,-0.70728 0.45912,-0.29849 0.76521,-0.7008 0.30608,-0.40231 0.30608,-0.83057 0,-0.49315 -0.34729,-0.8111 -0.34728,-0.31795 -0.82995,-0.31795 -0.60039,0 -1.14192,0.50613 -0.16482,0.14275 -0.42381,0.49315 L 15.00786,4.70007 Q 15.31394,4.2199 15.74952,3.84355 16.72663,3 17.96273,3 q 1.29496,0 2.09549,0.77217 0.80052,0.77217 0.80052,2.05696 0,0.72675 -0.28842,1.3367 -0.28843,0.60995 -0.72989,0.99279 -0.44147,0.38284 -0.95945,0.75919 -0.51799,0.37635 -0.96534,0.65537 -0.44735,0.27902 -0.77109,0.66835 -0.32374,0.38933 -0.35906,0.81759 h 2.7312 v -1.03821 z"     id="path1402"     inkscape:connector-curvature="0"     style="stroke-width:0.01236034" /></svg></button>
            <button action="strikeThrough"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z"/></svg></button>
            <button action="insertCode"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg></button>
            <button action="insertImage"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"/><path d="M0 0h24v24H0z" fill="none"/></svg></button>
            <button action="insertHorizontalRule"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24"><defs><path id="a" d="M0 0h24v24H0V0z"/></defs><clipPath id="b"><use xlink:href="#a" overflow="visible"/></clipPath><path clip-path="url(#b)" d="M19.5 9.5c-1.03 0-1.9.62-2.29 1.5h-2.92c-.39-.88-1.26-1.5-2.29-1.5s-1.9.62-2.29 1.5H6.79c-.39-.88-1.26-1.5-2.29-1.5C3.12 9.5 2 10.62 2 12s1.12 2.5 2.5 2.5c1.03 0 1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5s1.9-.62 2.29-1.5h2.92c.39.88 1.26 1.5 2.29 1.5 1.38 0 2.5-1.12 2.5-2.5s-1.12-2.5-2.5-2.5z"/></svg></button>`;
    const tool_container = document.createElement("div");
    tool_container.innerHTML = toolbar;
    tool_container.style =
      "position:sticky;display:flex;flex-wrap:wrap;top:0;left:0;width:100%;justify-content:center;padding:5px";
    for (let index = 0; index < tool_container.childElementCount; index++) {
      tool_container.children[index].style = toolbar_btn_style;
    }
    return tool_container;
  }

  // TOOLS FUNCTIONALITIES
  function insertImage(evt) {
    let inputs = image_prompt.inputs();
    let url = inputs[0].value;
    let alt = inputs[1].value;
    if (url == null || url == "") {
      alert("Invalid URL Specified");
    } else {
      if (image_prompt.ok().getAttribute("status") == "add") {
        create_image(url, alt);
      } else if (image_prompt.ok().getAttribute("status") == "change") {
        change_image(url, alt);
        image_prompt.ok().setAttribute("status", "add");
      }
    }
  }
  function createLink(evt) {
    if (last_focused.tagName != "CODE") {
      let url = link_prompt.inputs()[0].value;
      if (url == null || url == "") {
        alert("Invalid URL");
      } else {
        selection.surroundContents(create_link(url));
        selection = undefined;
      }
    }
  }
  function apply_color(evt, format_cmd) {
    document.execCommand("styleWithCSS", false, true);
    document.execCommand(format_cmd, false, evt.target.getAttribute("value"));
  }
  function increase_font() {
    document.execCommand("fontSize", false, font_counter);
    font_counter += 1;
    if (font_counter > 7) font_counter = 1;
  }
  function tool_functionality(cmd) {
    if (cmd == "textSize") {
      increase_font();
    } else if (
      commands["style"].indexOf(cmd) >= 0 ||
      commands["format"].indexOf(cmd) >= 0
    ) {
      document.execCommand(cmd, false, null);
    } else if (cmd == "insertCode") {
      create_code(true, 'print("Hello World")');
    } else if (cmd == "insertHeading") {
      create_small_heading(true, "Title...");
    } else if (cmd == "insertHorizontalRule") {
      create_break();
    } else {
      console.warn("The specified tool do not exist.");
    }
  }
  function getEditorData(editor, style) {
    let container_html = editor.innerHTML;
    let parser = new DOMParser();
    let data = parser.parseFromString(container_html, "text/html");
    let all_tags = data.querySelectorAll("*");
    for (let index = 0; index < all_tags.length; index++) {
      let element = all_tags[index];
      element.removeAttribute("placeholder");
      element.removeAttribute("contenteditable");
      element.removeAttribute("spellcheck");
      if (!style) {
        element.removeAttribute("style");
      }
    }
    clean_nodes(data);
    return data.body.innerHTML;
  }
  function setEditorData(textarea, editor) {
    if (textarea.value) {
      editor.innerHTML = "";
      let container_html = textarea.value;
      let parser = new DOMParser();
      let data = parser.parseFromString(container_html, "text/html");
      let editor_data = data.body.children;
      for (let index = 0; index < editor_data.length; index++) {
        if (editor_data[index].tagName == "H1") {
          let heading = create_heading(true, "Title...");
          heading.innerHTML = editor_data[index].innerHTML;
          place_caret_to_end(heading);
        } else if (editor_data[index].tagName == "H3") {
          let heading = create_small_heading(true, "Title...");
          heading.innerHTML = editor_data[index].innerHTML;
          place_caret_to_end(heading);
        } else if (editor_data[index].tagName == "P") {
          let paragraph = create_paragraph(true, "Write Content Here...");
          paragraph.innerHTML = editor_data[index].innerHTML;
          place_caret_to_end(paragraph);
        } else if (editor_data[index].tagName == "CODE") {
          let code = create_code(true, 'print("Hello World")');
          code.innerHTML = editor_data[index].innerHTML;
          place_caret_to_end(code);
        } else if (editor_data[index].tagName == "FIGURE") {
          const image = editor_data[index].firstElementChild;
          const caption = editor_data[index].lastElementChild;
          let fig = create_image(
            image.getAttribute("src"),
            image.getAttribute("alt")
          );
          fig.firstElementChild.style.width = image.style.width;
          fig.lastElementChild.innerHTML = caption.innerHTML;
        } else if (editor_data[index].tagName == "DIV") {
          create_break();
        }
      }
    }
  }

  // INTITIAL SETUP
  function setupEditor(editorContainer, heading) {
    container = editorContainer;
    if (container === null) {
      throw Error("No container found had to specify one");
    }
    setup(heading);
  }

  // EDITOR FUNCTIONALITIES PUBLIC FUNCTIONS
  this.init = function ({ textarea, toolbar = true, heading = true }) {
    if (textarea === undefined) {
      throw Error("pass textarea html element to function");
    }

    if (textarea.tagName === "TEXTAREA") {
      const editor_container = document.createElement("div");
      textarea.parentElement.append(editor_container);
      const editor_div = document.createElement("div");
      editor_div.setAttribute("class", "blog-editor");
      textarea.style.display = "none";
      setupEditor(editor_div, heading);
      if (toolbar) {
        const toolbar = Toolbar();
        toolbar.setAttribute("class", "blog-toolbar");
        editor_container.append(toolbar);
        this.setEditorToolbar(toolbar);
      }
      editor_container.append(editor_div);
      editor_container.append(textarea);
      setEditorData(textarea, editor_div);
      window.onkeyup = function () {
        textarea.value = getEditorData(textarea, true);
      };
    } else {
      throw Error("only textarea html element can be converted to blog editor");
    }
  };
  this.setEditorToolbar = function (toolbar) {
    for (let index = 0; index < toolbar.childElementCount; index++) {
      let child = toolbar.children[index];
      let cmd = child.getAttribute("action");
      if (cmd.endsWith("Color")) {
        let pallete = new ColorPallete(child, colors, apply_color, cmd);
        pallete.hide();
        child.onmouseover = function () {
          pallete.show();
        };
        child.onmouseout = function () {
          pallete.hide();
        };
      } else if (cmd == "insertImage") {
        image_prompt = new PromptBox(
          [
            { placeholder: "Enter Image URL", value: "" },
            { placeholder: "Enter alt text", value: "" },
          ],
          insertImage,
          input_style,
          button_style
        );
        image_prompt.ok().setAttribute("status", "add");
        child.onclick = function () {
          image_prompt.show();
          return false;
        };
      } else if (cmd == "createLink") {
        link_prompt = new PromptBox(
          [{ placeholder: "Enter URL Here", value: "" }],
          createLink,
          input_style,
          button_style
        );
        child.onclick = function () {
          selection = save_selection();
          if (selection != undefined && selection.toString().length > 0) {
            link_prompt.show();
            return false;
          }
        };
        document.addEventListener("keydown", function (evt) {
          if (evt.ctrlKey && evt.keyCode == 76) {
            evt.preventDefault();
            selection = save_selection();
            if (selection.startContainer.parentElement.tagName == "A") {
              document.execCommand("unlink", false, null);
            } else if (selection.startContainer.nodeName == "#text") {
              if (selection != undefined && selection.toString().length > 0) {
                link_prompt.show();
              }
            }
          }
        });
      } else {
        child.onclick = function (evt) {
          if (last_focused.tagName != "CODE") {
            tool_functionality(cmd);
            return false;
          }
          return false;
        };
      }
    }
  };
  this.editorData = function (style = false) {
    return getEditorData(container, style);
  };
  this.toolSupported = function () {
    return commands;
  };
}

// PROMPT BOX
function PromptBox(inputs, onOKclick, input_css = "", button_css = "") {
  let prompt_show_style =
    "position:fixed;top:0;left:0;width:100%;height:100vh;z-index:100;background:rgb(0,0,0,0.1);";
  let prompt_hide_style = "display:none;";
  let create_prompt = function () {
    let container = document.createElement("div");
    let box = document.createElement("div");
    box.style =
      "position:relative;top:40%;left:0;display:flex;flex-direction:column;align-items:center;justify-content:space-around;padding:5px;width:250px;background:#fff;height:180px;margin:auto;border-radius:10px 0 0 0;border:1px solid #ddd;box-shadow:5px 5px 7px #777;";
    for (let index = 0; index < inputs.length; index++) {
      let obj = inputs[index];
      let input = document.createElement("input");
      input.setAttribute("placeholder", obj["placeholder"]);
      input.value = obj["value"];
      input.style = input_css;
      box.append(input);
      input.addEventListener("keydown", function (evt) {
        if (evt.keyCode == 13) {
          onOKclick(evt);
          container.style = prompt_hide_style;
        }
      });
      input.addEventListener("paste", function (evt) {
        evt.stopPropagation();
      });
    }
    let bottom = document.createElement("div");
    bottom.style =
      "display:flex;justify-content:space-around;width:100%;margin-top:2rem;";
    let cancel = document.createElement("button");
    cancel.style = button_css;
    cancel.innerHTML = "Close";
    cancel.onclick = function () {
      container.style = prompt_hide_style;
    };
    bottom.append(cancel);
    let ok = document.createElement("button");
    ok.style = button_css;
    ok.innerHTML = "Ok";
    ok.onclick = function (evt) {
      onOKclick(evt);
      container.style = prompt_hide_style;
    };
    bottom.append(ok);
    box.append(bottom);
    container.append(box);
    document.body.append(container);
    container.style = prompt_hide_style;
    return container;
  };
  let prompt = create_prompt();
  let clear_inputs = function () {
    let prompt_box = prompt.firstElementChild;
    for (let index = 0; index < prompt_box.children.length - 1; index++) {
      prompt_box.children[index].value = "";
    }
  };
  this.inputs = function () {
    let input = {};
    let prompt_box = prompt.firstElementChild;
    for (let index = 0; index < prompt_box.children.length - 1; index++) {
      input[index] = prompt_box.children[index];
    }
    return input;
  };
  this.ok = function () {
    return prompt.firstElementChild.lastElementChild.lastElementChild;
  };
  this.show = function () {
    prompt.style = prompt_show_style;
  };
  this.hide = function () {
    prompt.style = prompt_hide_style;
    clear_inputs();
  };
}

//COLOR PALLETE
function ColorPallete(
  container,
  colors,
  color_click,
  format_cmd = "foreColor"
) {
  let pallete_show_style =
    "display:flex;flex-wrap:wrap;justify-content:center;position:absolute;padding:5px;width:160px;background:#fff;height:120px;border-radius:10px 0 0 0;border:1px solid #ddd;box-shadow:0 0 5px #aaa;";
  let color_style =
    "outline:none;cursor:pointer;display:block;margin:5px 5px 0 0;width:2rem;height:2rem;border-radius:7px 7px 7px 7px;border:1px solid #DDD;box-shadow:0 0 5px #aaa;";
  let pallete_hide_style = "display:none";
  let create_pallete = function () {
    let box = document.createElement("div");
    for (let index = 0; index < colors.length; index++) {
      let color = document.createElement("button");
      color.setAttribute("value", "#" + colors[index]);
      color.style = color_style + "background-color:#" + colors[index] + ";";
      box.append(color);
      color.onclick = function (evt) {
        color_click(evt, format_cmd);
        return false;
      };
    }
    container.append(box);
    box.style = pallete_hide_style;
    return box;
  };
  let pallete = create_pallete();
  this.show = function () {
    pallete.style = pallete_show_style;
  };
  this.hide = function () {
    pallete.style = pallete_hide_style;
  };
}
