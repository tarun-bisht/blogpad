window.onload=function ()
{
    editor=new BlogEditor();
    editor.create(document.getElementById("id_content"),toolbar=true, heading=true);
}