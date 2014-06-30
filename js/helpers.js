var url = document.location.href;
var repoRegex = /github\.com\/(.+)\/(.+)\/issues/;

function repoOwner() {
  var match = url.match(repoRegex);
  return match ? match[1] : null;
}

function repoName() {
  var match = url.match(repoRegex);
  return match ? match[2] : null;
}

function repoTuple() {
  var match = url.match(repoRegex);
  return match ? match[1] + '/' + match[2] : null;
}

exports.repoOwner = repoOwner;
exports.repoName = repoName;
exports.repoTuple = repoTuple;
