# Blogpad &middot; [![Live URL](https://img.shields.io/badge/Live%20URL-Live%20Project%20URL-red)](https://www.tarunbisht.com/blogpad/live.html)

A simplistic medium style blog WYSIWYG editor for website.

[![Live URL](https://img.shields.io/badge/Live%20URL-Live%20Project%20URL-red)](https://www.tarunbisht.com/blogpad/live.html)

<img src="icon.png" width="200" height="200" alt="Blogpad icon logo">

## Features

- Written in Vanilla JS so no other dependency required.
- Easy to integrate into website.
- Inbuilt code block for code writing.
- Paste contents into editor, formats content automatically as we paste.
- Image and code pasting into editor.
- Basic editing toolbar, which is also customizable.
- Retrieve data from editor using JS easily with or without style applied.

## Installation

- Installation using cdn

```html
<link rel="stylesheet" href="https://unpkg.com/blogpad@1.0.0/dist/blogpad.min.css"
/>
<script defer src="https://unpkg.com/blogpad@1.0.0/dist/blogpad.umd.js"></script>
```

- Installation using npm

```bash
npm install blogpad
```

## Getting Started

- Create a html template with a textarea that will be converted to blogpad editor by this library. Assign an id to textarea so that we can pass that element to library.

```html
<div>
  <textarea id="id_content"></textarea>
</div>
```

- Link CDN of library to your html file

- Create a new JS file and link it to html and copy the contents below

```javascript
// on window load
window.onload = function () {
  // create a new blogpad instance
  let pad = new blogpad();
  // initialize textarea as blogpad editor
  pad.init({
    textarea: document.getElementById("id_content"),
    toolbar: true,
    heading: true,
  });
};
```

## Toolbar Actions

| Action               | Description                                                                                                 |
| -------------------- | ----------------------------------------------------------------------------------------------------------- |
| bold                 | Make selected text bold                                                                                     |
| italic               | Make selected text italic                                                                                   |
| underline            | Underline selected text                                                                                     |
| justifyLeft          | Justify selected content to left                                                                            |
| justifyCenter        | Justify selected content to center                                                                          |
| justifyRight         | Justify selected content to right                                                                           |
| foreColor            | Create a basic color pallete which color foreground                                                         |
| backColor            | Create a basic color pallete which color background                                                         |
| insertHeading        | Insert a H3 tag below the selected paragraph, can be used for subheadings in blogs                          |
| textSize             | Change font size of selected text, repeated clicks on this action button will cycle through different sizes |
| createLink           | Convert selected text into a link                                                                           |
| subscript            | Subscript selected text                                                                                     |
| superscript          | Superscript selected text                                                                                   |
| strikeThrough        | Create a strike line in selected text                                                                       |
| insertCode           | Insert code bar to write some code in blog                                                                  |
| insertImage          | Insert an image from link provided                                                                          |
| insertHorizontalRule | Insert a horizontal line to seperate blog sections                                                          |

## API Reference

### Blogpad Top-Level API

`blogpad` is entry point to the Blogpad library. The top-level APIs are available on the `blogpad` global. If you use ES6 with npm, you can write `import blogpad from 'blogpad'`. If you use ES5 with npm, you can write var `blogpad = require('blogpad')`

### Creating a new blogpad instance

blogpad abstracts all the editor functionalities, we need to create an instance of blogpad in order to use editor functionalities.

```javascript
pad = new blogpad();
```

### Initializing editor on created instance

```javascript
pad = new blogpad();
pad.init({
  textarea: document.getElementById("id_content"),
  toolbar: true,
  heading: true,
});
```

#### Arguments

- `textarea` (textarea element) : a textarea element that will be initialized as blog editor and manipulated by library. Default is `undefined`.
- `toolbar` (boolean) : whether to enable toolbar for editor or not. Default is `true`
- `heading` (boolean) : whether to create a blog Title editor or not. Default is `true`

### Setting up a editor toolbar

By default if `toolbar = true` is passed to the `init` function it will create a toolbar out of the box. But if someone want to customize toolbar position or styling (buttons, icons etc.) then a toolbar can be setup manually by using `setEditorToolbar` function. We need to pass a custom toolbar to the function which contains toolbar buttons with defined actions in `action` attribute. A list of actions provided can be found above. An example of integrating custom toolbar is shown below.

```html
<textarea id="id_content"></textarea>
<div id="editor_toolbar">
  <button action="bold">Bold</button>
  <button action="italic">Italic</button>
  <button action="underline">Bold</button>
  <button action="italic">foreColor</button>
</div>
```

```javascript
pad = new blogpad();
pad.init({
  textarea: document.getElementById("id_content"),
  toolbar: false,
  heading: true,
});
pad.setEditorToolbar(document.getElementById("editor_toolbar"));
```

#### Arguments

- `toolbar` (toolbar parent) : A custom toolbar parent element with action buttons inside. Default is `undefined`.

## Getting data from editor

Getting data from editor is very simple, we can use `editorData` function to get written contents of editor. This function can return content with style so that output looks same as it seems which is the idea behind WYSIWYG editor or bare output without style which can be styled with external stylesheet.

```javascript
// get editor data with style
content = pad.editorData(true);
// get editor data without style
content = pad.editorData(false);
```

#### Arguments

- `style` (boolean) : get editor data with style applied or not. Default is `true`.

### Getting supported action lists

We can also look defined actions for toolbar using `toolSupported` function. This will return all the tools actions that are currently supported by editor.

```javascript
console.log(pad.toolSupported());
```

## License

[MIT](https://en.wikipedia.org/wiki/MIT_License)

## Contributions

Improvements to project or new feature requests are welcomed, open an issue and describe improvements or new feature description.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/tarun-bisht/blogpad/blob/master/LICENSE) [![npm version](https://img.shields.io/npm/v/react.svg?style=flat)](https://www.npmjs.com/package/blogpad) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) [![Live URL](https://img.shields.io/badge/Live%20URL-Live%20Project%20URL-red)](../example/index.html)
