'use strict';

var fs = require('fs');
var path = require('path');
var objectAssign = require('object-assign');
var template = require('lodash.template');
var file = (function(){
	var file = {};
	var pathSeparatorRe = /[\/\\]/g;
	file.exists = function() {
	    var filepath = path.join.apply(path, arguments);
	    return fs.existsSync(filepath);
	};
	file.mkdir = function(dirpath, mode) {
	    // Set directory mode in a strict-mode-friendly way.
	    if (mode == null) {
	        mode = parseInt('0777', 8) & (~process.umask());
	    }
	    dirpath.split(pathSeparatorRe).reduce(function(parts, part) {
	        parts += part + '/';
	        var subpath = path.resolve(parts);
	        if (!file.exists(subpath)) {
	            try {
	                fs.mkdirSync(subpath, mode);
	            } catch (e) {
	                throw file.error('Unable to create directory "' + subpath + '" (Error code: ' + e.code + ').', e);
	            }
	        }
	        return parts;
	    }, '');
	};
	file.error = function(message, error){
	    return new Error(['\u001b[31m', message, '\u001b[39m'].join(""));
	};
	file.write = function(filepath, contents, options) {
	    if (!options) { options = {}; }
	    // Create path, if necessary.
	    file.mkdir(path.dirname(filepath));
	    try {
	        // Actually write file.
	        fs.writeFileSync(filepath, contents, 'mode' in options ? { mode: options.mode } : {});
	        return true;
	    } catch (e) {
	        throw file.error('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').', e);
	    }
	};
	return file;

})();

var crxAutoReload = function(options) {
    options = objectAssign({
        extensionDir: '/tmp'
    }, options);

    var reloadHTML = path.normalize(options.extensionDir + '/reload.html');
    var reloadJs = path.normalize(options.extensionDir + '/reload.js');
    if (!file.exists(reloadJs)) {
        var fileTpl = fs.readFileSync(path.resolve(__dirname, 'reload.js.tpl'));
        var tmpl = template(fileTpl);
        var reloadJsSrc = tmpl({ 'reloadFile': path.basename(reloadHTML) });
        file.write(reloadJs, reloadJsSrc);
    }
    file.write(reloadHTML, new Date().getTime().toString());
};


module.exports = crxAutoReload;