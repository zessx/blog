// Debouncer
function debounce(funct, timeout) {
   var timeoutID , timeout = timeout || 200;
   return function () {
      var scope = this , args = arguments;
      clearTimeout( timeoutID );
      timeoutID = setTimeout( function () {
          funct.apply( scope , Array.prototype.slice.call( args ) );
      } , timeout );
   }
}

// setAttribute multiple
Element.prototype.setAttributes = function(attrs) {
  for(var key in attrs) {
    this.setAttribute(key, attrs[key]);
  }
}

// Trianglified header
var points = [],
    polygons = [],
    oldWidth = 0;
function trianglifyLimit() {
    limit = window.innerHeight - window.pageYOffset;
    polygons.forEach(function(polygon, index) {
        if(window.pageYOffset == 0 || Math.max.apply(null, polygon.getAttribute('points').replace(new RegExp(/[\d\.]+\,/g), '').split(' ').map(function(element) { return parseFloat(element); })) < limit) {
            polygon.classList.add('visible');
        } else {
            polygon.classList.remove('visible');
        }
    });
}
function trianglify() {
  if(oldWidth == window.innerWidth) {
    return;
  }
  var header = document.querySelector('.page-content header'),
      svg = document.querySelector('#canvas'),
      svgBackground = document.querySelector('#canvas-background'),
      svgPolygons = document.querySelector('#canvas-polygons'),
      svgMask = document.querySelector('#canvas-mask');

  points = [];
  polygons = [];
  oldWidth = window.innerWidth;
  while (svgPolygons.firstChild) {
      svgPolygons.removeChild(svgPolygons.firstChild);
  }
  while (svgMask.firstChild) {
      svgMask.removeChild(svgMask.firstChild);
  }

  var margin = 30,
      fullWidth = window.innerWidth - margin * 2,
      fullHeight = header.classList.contains('small-header') ? 300 : window.innerHeight - margin * 2,
      attributes = {
        'class': header.classList.contains('small-header') ? 'small' : '',
        'width': fullWidth,
        'height': fullHeight
      }

  svg.setAttributes(attributes);
  svgPolygons.setAttributes(attributes);
  svgBackground.setAttributes(attributes);

  var unitSize = (fullWidth+fullHeight)/20;
      numPointsX = Math.ceil(fullWidth/unitSize)+1;
      numPointsY = Math.ceil(fullHeight/unitSize)+1;
      unitWidth = Math.ceil(fullWidth/(numPointsX-1));
      unitHeight = Math.ceil(fullHeight/(numPointsY-1));

  for(var y = 0; y < numPointsY; y++) {
      for(var x = 0; x < numPointsX; x++) {
          points.push([
              unitWidth * x + ((x == 0 || x == numPointsX - 1) ? 0 : (Math.random() * unitWidth - unitWidth / 2) / 1.4),
              unitHeight * y + ((y == 0 || y == numPointsY - 1) ? 0 : (Math.random() * unitHeight - unitHeight / 2) / 1.4)
          ]);
      }
  }

  for(var i = 0; i < points.length; i++) {
      if(i % numPointsX != numPointsX - 1 && i <= numPointsY * numPointsX - numPointsX - 1) {
          var rando = Math.floor(Math.random()*2);
          for(var n = 0; n < 2; n++) {
              var polygon = document.createElementNS(svg.namespaceURI, 'polygon'),
                  coords = '';
              if(rando==0) {
                  if(n==0) {
                      coords = points[i].join(',')+' '+points[i+numPointsX].join(',')+' '+points[i+numPointsX+1].join(',');
                  } else if(n==1) {
                      coords = points[i].join(',')+' '+points[i+1].join(',')+' '+points[i+numPointsX+1].join(',');
                  }
              } else if(rando==1) {
                  if(n==0) {
                      coords = points[i].join(',')+' '+points[i+numPointsX].join(',')+' '+points[i+1].join(',');
                  } else if(n==1) {
                      coords = points[i+numPointsX].join(',')+' '+points[i+1].join(',')+' '+points[i+numPointsX+1].join(',');
                  }
              }
              polygon.setAttributes({
                'points': coords,
                'fill': 'rgba(0,0,0,'+(Math.random()/4)+')'
              });
              polygonClone = polygon.cloneNode();
              polygons.push(polygon);
              polygons.push(polygonClone);
              svgPolygons.appendChild(polygonClone);
              svgMask.appendChild(polygon);
          }
      }
  }

  trianglifyLimit();
  document.addEventListener('scroll', trianglifyLimit);
}
document.addEventListener('DOMContentLoaded', trianglify);
window.addEventListener('resize', debounce(trianglify, 50));

// Headings' anchors
function headingAnchors() {
  var headings = document.querySelectorAll('h2[id], h3[id], h4[id]');
  Array.prototype.forEach.call(headings, function(el, i){
    var link = document.createElement('a');
    link.setAttributes({
      'name': el.getAttribute('id'),
      'href': '#' + el.getAttribute('id'),
      'aria-label': el.innerText
    });
    el.removeAttribute('id');
    el.appendChild(link);
  });
}
document.addEventListener('DOMContentLoaded', headingAnchors, false);

// Open social links in new tab
function socialLinksInNewTab() {
  var links = document.querySelectorAll('#partager-block a');
  Array.prototype.forEach.call(links, function(el, i){
    el.setAttribute('target', '_blank');
  });
}
document.addEventListener('DOMContentLoaded', socialLinksInNewTab, false);

// Enable search in Jekyll
var months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
function jekyllSearch() {
  var searchInput   = document.querySelector('.jekyll-search-input');
  var searchResults = document.querySelector('.jekyll-search-results');
  if (searchInput) {
    SimpleJekyllSearch({
      searchInput: searchInput,
      resultsContainer: searchResults,
      json: '/search.json',
      noResultsText: '<p style="text-align:center">Aucun résultat</p>',
      fuzzy: false,
      templateMiddleware: function(prop, value, template){
        if (prop === 'date') {
          var date = new Date(value);
          return ('00'+date.getDate()).substr(-2) +' '+ months[date.getMonth()] +' '+ date.getFullYear();
        } else if (prop === 'update') {
          if (value == "") {
            return "";
          }
          var date = new Date(value);
          return '<p class="update"><label>Mise à jour :</label> '+ ('00'+date.getDate()).substr(-2) +' '+ months[date.getMonth()] +' '+ date.getFullYear() +'</p>';
        } else if (prop === 'tags') {
          return value.replace(/([^,]+),/g, '<li><a href="/tag/$1">$1</a></li>');
        }
      },
      searchResultTemplate: '\
        <article data-color="{class}">\
          <aside>\
            <p class="date">{date}</p>\
            {update}\
            <div class="article-preview">\
              <h2><a href="{url}">{title}</a></h2>\
              {description}\
            </div>\
            <ul class="tags">{tags}</ul>\
          </aside>\
        </article>\
      '
    });
  }
}
document.addEventListener('DOMContentLoaded', jekyllSearch, false);

// Double click on code block to select all
function selectCode() {
  Array.prototype.forEach.call(document.querySelectorAll('pre code'), function(code, index){
    code.addEventListener('dblclick', function(event) {
        var code = event.target;
        if (document.body.createTextRange) { // ms
          var range = document.body.createTextRange();
          range.moveToElementText(code);
          range.select();
        } else if (window.getSelection) { // moz, opera, webkit
          var selection = window.getSelection();
          var range = document.createRange();
          range.selectNodeContents(code);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      },
      false
    );
  });
}
document.addEventListener('DOMContentLoaded', selectCode, false);

// Infinite load
function infiniteLoad() {
  var allPosts = [],
      isFetchingPosts = false,
      shouldFetchPosts = true,
      postsToLoad = document.querySelectorAll('.articles article').length,
      loadNewPostsThreshold = 3000,
      request = new XMLHttpRequest();
  request.open('GET', '/search.json', true);
  request.onload = function() {
    if (request.status >= 200 && request.status < 400) {
      var data = JSON.parse(request.responseText);
      if(loader = document.querySelector('.loader')) {
        if(tag = loader.getAttribute('data-tag')) {
          for (var i = 0; i < data.length; i++) {
            if(data[i].tags.indexOf(tag) >= 0) {
              allPosts.push(data[i])
            }
          };
        } else {
          allPosts = data;
        }
      }
      if(allPosts.length <= postsToLoad) {
        disableFetching();
      }
      document.addEventListener('scroll', scroller, false);
    }
  };
  request.send();

  if(document.querySelectorAll('.loader').length < 1) {
    shouldFetchPosts = false;
  }
  function scroller() {
    if(!shouldFetchPosts || isFetchingPosts) return;
    var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    if(scrollTop + window.innerHeight + 100 > document.body.offsetHeight) {
      fetchPosts();
    }
  }

  function fetchPosts() {
    if (!allPosts) return;
    isFetchingPosts = true;
    var loadedPosts = 0,
        postCount = document.querySelectorAll('.articles article').length,
        callback = function() {
          loadedPosts++;
          var postIndex = postCount + loadedPosts;

          if(postIndex > allPosts.length-1) {
            disableFetching();
            return;
          }

          if(loadedPosts < postsToLoad) {
            fetchPostWithIndex(postIndex, callback);
          } else {
            isFetchingPosts = false;
          }
        };
    fetchPostWithIndex(postCount + loadedPosts, callback);
  }

  function fetchPostWithIndex(index, callback) {
    var postURL = allPosts[index].url;
    var request = new XMLHttpRequest();
    request.open('GET', postURL, true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        var data = document.createElement('div');
        data.innerHTML = request.responseText;
        var posts = data.querySelectorAll('article');
        Array.prototype.forEach.call(posts, function(post, index){
          if(loader = document.querySelector('.loader')) {
            if(tag = loader.getAttribute('data-tag')) {
              post.setAttribute('data-color', tag);
            }
          }
          post.classList.remove('full-article');
          document.querySelector('.articles').appendChild(post);
        });
        callback();
      }
    };
    request.send();
  }

  function disableFetching() {
    shouldFetchPosts = false;
    isFetchingPosts = false;
    if(loader = document.querySelector('.loader')) {
      loader.classList.add('end');
    }
  }

}
document.addEventListener('DOMContentLoaded', infiniteLoad, false);
