// Copyright 2009 Sander Dijkhuis <sander@pleft.com>
// Lazy browser checking for the first test phase.

// From http://msdn.microsoft.com/en-us/library/ms537509(VS.85).aspx
function getInternetExplorerVersion()
{
  var rv = -1; // Return value assumes failure.
  if (navigator.appName == 'Microsoft Internet Explorer') {
    var ua = navigator.userAgent;
    var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
    if (re.exec(ua) != null)
      rv = parseFloat( RegExp.$1 );
  }
  return rv;
}

(function() {
  if (document.cookie.indexOf('ignoreBrowserCheck') != '-1')
    return;

  if (/(Firefox-4\.0|Firefox|Minefield|Shiretoko|Namoroka)[\/\s](\d+\.\d+)/.test(navigator.userAgent)) {
    var v = new Number(RegExp.$2)
    if (v >= 2.0) {
      return;
    }
  }

  if (getInternetExplorerVersion() != -1 && getInternetExplorerVersion() >= 7)
    return;

  var webkit = parseFloat(navigator.userAgent.split('AppleWebKit/')[1]) ||
               undefined;
  if (webkit && webkit > 530)
    return;

  onload = function() {
    var div = document.createElement('div');
    div.className = 'bn-notice';
    document.body.insertBefore(div, document.body.firstChild);
    
    var close = document.createElement('a');
    close.className = 'bn-close';
    close.innerHTML = 'Hide';
    close.href = 'javascript:closeBrowserNotice()';
    div.appendChild(close);
    
    div.innerHTML +=
"<b>" + gettext('The Web browser that you are using is currently not supported by Pleft.') + "</b><br>"
+ gettext('For the best experience and safer Web browsing, we recommend that you use one of these:') + "<br><br> \
<a href='http://www.google.com/chrome/'><img src='/static/images/browsers/chrome.png'> Google Chrome</a> \
<a href='http://www.mozilla.com/'><img src='/static/images/browsers/firefox.png'> Firefox 3.6</a> \
<a href='http://www.microsoft.com/windows/internet-explorer/'><img src='/static/images/browsers/explorer.png'> Internet Explorer 8</a> \
<a href='http://www.apple.com/safari/'><img src='/static/images/browsers/safari.png'> Safari 4</a>";
    
    window.closeBrowserNotice = function() {
      var date = new Date();
      date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
      document.cookie = 'ignoreBrowserCheck=1; expires='+ date + '; path=/';
      div.style.display = 'none';
    };
  };
})();
