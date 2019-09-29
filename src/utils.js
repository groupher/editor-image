
/**
 * dynamically load script
 * see https://stackoverflow.com/questions/14521108/dynamically-load-js-inside-js
 * @param {*} url
 * @param {*} func callback function
 * @param {*} location
 */
export const loadJS = function (url, func, location) {
  // url is URL of external file, func is the code
  // to be called from the file, location is the location to
  // insert the <script> element

  let scriptTag = document.createElement('script');

  scriptTag.src = url;

  scriptTag.onload = func;
  scriptTag.onreadystatechange = func;

  location.appendChild(scriptTag);
};

export const holder = 1;