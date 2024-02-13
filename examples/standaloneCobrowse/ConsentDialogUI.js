function Consent () {
  const container = document.createElement('div');
  function content (title, description) {
    return '\
      <div style="background: rgba(50, 50, 50, 0.4); position: fixed; z-index: 2147483647; bottom: 0; top: 0; left: 0; right: 0">\
        <div style="color: #333; font-family:sans-serif; line-height:140%; position:fixed; padding:25px; background:white; border-radius:15px; z-index:2147483647; top:50px; left:50%; width:75%; max-width:350px; transform:translateX(-50%); box-shadow:0px 0px 15px #33333322;">\
          <div style="text-align:center; margin-top:10px; margin-bottom:20px"><b>' + title + '</b></div>\
          <div>' + description + '</div>\
          <div style="float:right; margin-top:40px; color:rgb(0, 122, 255);">\
            <a class="cobrowse-deny" style="cursor:pointer; padding:10px;">Deny</a>\
            <a class="cobrowse-allow" style="cursor:pointer; padding:10px; font-weight: bold;">Allow</a>\
          </div>\
        </div>\
      </div>\
    ';
  }

  this.show = function (title, description) {
    return new Promise(function (resolve) {
      container.innerHTML = content(title, description);
      container.querySelector('.cobrowse-allow').addEventListener('click', function () { resolve(true); this.hide(); }.bind(this));
      container.querySelector('.cobrowse-deny').addEventListener('click', function () { resolve(false); this.hide(); }.bind(this));
      if (document.body) document.body.appendChild(container);
    }.bind(this));
  }.bind(this);

  this.hide = function () {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };
}
