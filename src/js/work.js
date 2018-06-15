console.log("igothere");
chrome.storage.sync.get(['appState'], ({appState}) => {
  if (appState !== 'recess') {
    let body = document.getElementsByTagName('body');
    body.innerHTML = '<img src="../../icons/image.png">';
  }
});