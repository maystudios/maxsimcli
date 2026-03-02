#!/usr/bin/env node
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") {
		for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
			key = keys[i];
			if (!__hasOwnProp.call(to, key) && key !== except) {
				__defProp(to, key, {
					get: ((k) => from[k]).bind(null, key),
					enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
				});
			}
		}
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));

//#endregion
let node_fs = require("node:fs");
node_fs = __toESM(node_fs);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_os = require("node:os");
node_os = __toESM(node_os);
let node_process = require("node:process");
node_process = __toESM(node_process);
let node_tty = require("node:tty");
node_tty = __toESM(node_tty);
let figlet = require("figlet");
figlet = __toESM(figlet);
let node_util = require("node:util");
let node_async_hooks = require("node:async_hooks");
let node_readline = require("node:readline");
node_readline = __toESM(node_readline);
let node_crypto = require("node:crypto");
node_crypto = __toESM(node_crypto);
let node_child_process = require("node:child_process");

//#region ../../../../../node_modules/universalify/index.js
var require_universalify = /* @__PURE__ */ __commonJSMin(((exports) => {
	exports.fromCallback = function(fn) {
		return Object.defineProperty(function(...args) {
			if (typeof args[args.length - 1] === "function") fn.apply(this, args);
			else return new Promise((resolve, reject) => {
				args.push((err, res) => err != null ? reject(err) : resolve(res));
				fn.apply(this, args);
			});
		}, "name", { value: fn.name });
	};
	exports.fromPromise = function(fn) {
		return Object.defineProperty(function(...args) {
			const cb = args[args.length - 1];
			if (typeof cb !== "function") return fn.apply(this, args);
			else {
				args.pop();
				fn.apply(this, args).then((r) => cb(null, r), cb);
			}
		}, "name", { value: fn.name });
	};
}));

//#endregion
//#region ../../../../../node_modules/graceful-fs/polyfills.js
var require_polyfills = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var constants = require("constants");
	var origCwd = process.cwd;
	var cwd = null;
	var platform = process.env.GRACEFUL_FS_PLATFORM || process.platform;
	process.cwd = function() {
		if (!cwd) cwd = origCwd.call(process);
		return cwd;
	};
	try {
		process.cwd();
	} catch (er) {}
	if (typeof process.chdir === "function") {
		var chdir = process.chdir;
		process.chdir = function(d) {
			cwd = null;
			chdir.call(process, d);
		};
		if (Object.setPrototypeOf) Object.setPrototypeOf(process.chdir, chdir);
	}
	module.exports = patch;
	function patch(fs) {
		if (constants.hasOwnProperty("O_SYMLINK") && process.version.match(/^v0\.6\.[0-2]|^v0\.5\./)) patchLchmod(fs);
		if (!fs.lutimes) patchLutimes(fs);
		fs.chown = chownFix(fs.chown);
		fs.fchown = chownFix(fs.fchown);
		fs.lchown = chownFix(fs.lchown);
		fs.chmod = chmodFix(fs.chmod);
		fs.fchmod = chmodFix(fs.fchmod);
		fs.lchmod = chmodFix(fs.lchmod);
		fs.chownSync = chownFixSync(fs.chownSync);
		fs.fchownSync = chownFixSync(fs.fchownSync);
		fs.lchownSync = chownFixSync(fs.lchownSync);
		fs.chmodSync = chmodFixSync(fs.chmodSync);
		fs.fchmodSync = chmodFixSync(fs.fchmodSync);
		fs.lchmodSync = chmodFixSync(fs.lchmodSync);
		fs.stat = statFix(fs.stat);
		fs.fstat = statFix(fs.fstat);
		fs.lstat = statFix(fs.lstat);
		fs.statSync = statFixSync(fs.statSync);
		fs.fstatSync = statFixSync(fs.fstatSync);
		fs.lstatSync = statFixSync(fs.lstatSync);
		if (fs.chmod && !fs.lchmod) {
			fs.lchmod = function(path, mode, cb) {
				if (cb) process.nextTick(cb);
			};
			fs.lchmodSync = function() {};
		}
		if (fs.chown && !fs.lchown) {
			fs.lchown = function(path, uid, gid, cb) {
				if (cb) process.nextTick(cb);
			};
			fs.lchownSync = function() {};
		}
		if (platform === "win32") fs.rename = typeof fs.rename !== "function" ? fs.rename : (function(fs$rename) {
			function rename(from, to, cb) {
				var start = Date.now();
				var backoff = 0;
				fs$rename(from, to, function CB(er) {
					if (er && (er.code === "EACCES" || er.code === "EPERM" || er.code === "EBUSY") && Date.now() - start < 6e4) {
						setTimeout(function() {
							fs.stat(to, function(stater, st) {
								if (stater && stater.code === "ENOENT") fs$rename(from, to, CB);
								else cb(er);
							});
						}, backoff);
						if (backoff < 100) backoff += 10;
						return;
					}
					if (cb) cb(er);
				});
			}
			if (Object.setPrototypeOf) Object.setPrototypeOf(rename, fs$rename);
			return rename;
		})(fs.rename);
		fs.read = typeof fs.read !== "function" ? fs.read : (function(fs$read) {
			function read(fd, buffer, offset, length, position, callback_) {
				var callback;
				if (callback_ && typeof callback_ === "function") {
					var eagCounter = 0;
					callback = function(er, _, __) {
						if (er && er.code === "EAGAIN" && eagCounter < 10) {
							eagCounter++;
							return fs$read.call(fs, fd, buffer, offset, length, position, callback);
						}
						callback_.apply(this, arguments);
					};
				}
				return fs$read.call(fs, fd, buffer, offset, length, position, callback);
			}
			if (Object.setPrototypeOf) Object.setPrototypeOf(read, fs$read);
			return read;
		})(fs.read);
		fs.readSync = typeof fs.readSync !== "function" ? fs.readSync : (function(fs$readSync) {
			return function(fd, buffer, offset, length, position) {
				var eagCounter = 0;
				while (true) try {
					return fs$readSync.call(fs, fd, buffer, offset, length, position);
				} catch (er) {
					if (er.code === "EAGAIN" && eagCounter < 10) {
						eagCounter++;
						continue;
					}
					throw er;
				}
			};
		})(fs.readSync);
		function patchLchmod(fs) {
			fs.lchmod = function(path, mode, callback) {
				fs.open(path, constants.O_WRONLY | constants.O_SYMLINK, mode, function(err, fd) {
					if (err) {
						if (callback) callback(err);
						return;
					}
					fs.fchmod(fd, mode, function(err) {
						fs.close(fd, function(err2) {
							if (callback) callback(err || err2);
						});
					});
				});
			};
			fs.lchmodSync = function(path, mode) {
				var fd = fs.openSync(path, constants.O_WRONLY | constants.O_SYMLINK, mode);
				var threw = true;
				var ret;
				try {
					ret = fs.fchmodSync(fd, mode);
					threw = false;
				} finally {
					if (threw) try {
						fs.closeSync(fd);
					} catch (er) {}
					else fs.closeSync(fd);
				}
				return ret;
			};
		}
		function patchLutimes(fs) {
			if (constants.hasOwnProperty("O_SYMLINK") && fs.futimes) {
				fs.lutimes = function(path, at, mt, cb) {
					fs.open(path, constants.O_SYMLINK, function(er, fd) {
						if (er) {
							if (cb) cb(er);
							return;
						}
						fs.futimes(fd, at, mt, function(er) {
							fs.close(fd, function(er2) {
								if (cb) cb(er || er2);
							});
						});
					});
				};
				fs.lutimesSync = function(path, at, mt) {
					var fd = fs.openSync(path, constants.O_SYMLINK);
					var ret;
					var threw = true;
					try {
						ret = fs.futimesSync(fd, at, mt);
						threw = false;
					} finally {
						if (threw) try {
							fs.closeSync(fd);
						} catch (er) {}
						else fs.closeSync(fd);
					}
					return ret;
				};
			} else if (fs.futimes) {
				fs.lutimes = function(_a, _b, _c, cb) {
					if (cb) process.nextTick(cb);
				};
				fs.lutimesSync = function() {};
			}
		}
		function chmodFix(orig) {
			if (!orig) return orig;
			return function(target, mode, cb) {
				return orig.call(fs, target, mode, function(er) {
					if (chownErOk(er)) er = null;
					if (cb) cb.apply(this, arguments);
				});
			};
		}
		function chmodFixSync(orig) {
			if (!orig) return orig;
			return function(target, mode) {
				try {
					return orig.call(fs, target, mode);
				} catch (er) {
					if (!chownErOk(er)) throw er;
				}
			};
		}
		function chownFix(orig) {
			if (!orig) return orig;
			return function(target, uid, gid, cb) {
				return orig.call(fs, target, uid, gid, function(er) {
					if (chownErOk(er)) er = null;
					if (cb) cb.apply(this, arguments);
				});
			};
		}
		function chownFixSync(orig) {
			if (!orig) return orig;
			return function(target, uid, gid) {
				try {
					return orig.call(fs, target, uid, gid);
				} catch (er) {
					if (!chownErOk(er)) throw er;
				}
			};
		}
		function statFix(orig) {
			if (!orig) return orig;
			return function(target, options, cb) {
				if (typeof options === "function") {
					cb = options;
					options = null;
				}
				function callback(er, stats) {
					if (stats) {
						if (stats.uid < 0) stats.uid += 4294967296;
						if (stats.gid < 0) stats.gid += 4294967296;
					}
					if (cb) cb.apply(this, arguments);
				}
				return options ? orig.call(fs, target, options, callback) : orig.call(fs, target, callback);
			};
		}
		function statFixSync(orig) {
			if (!orig) return orig;
			return function(target, options) {
				var stats = options ? orig.call(fs, target, options) : orig.call(fs, target);
				if (stats) {
					if (stats.uid < 0) stats.uid += 4294967296;
					if (stats.gid < 0) stats.gid += 4294967296;
				}
				return stats;
			};
		}
		function chownErOk(er) {
			if (!er) return true;
			if (er.code === "ENOSYS") return true;
			if (!process.getuid || process.getuid() !== 0) {
				if (er.code === "EINVAL" || er.code === "EPERM") return true;
			}
			return false;
		}
	}
}));

//#endregion
//#region ../../../../../node_modules/graceful-fs/legacy-streams.js
var require_legacy_streams = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var Stream$1 = require("stream").Stream;
	module.exports = legacy;
	function legacy(fs) {
		return {
			ReadStream,
			WriteStream
		};
		function ReadStream(path, options) {
			if (!(this instanceof ReadStream)) return new ReadStream(path, options);
			Stream$1.call(this);
			var self = this;
			this.path = path;
			this.fd = null;
			this.readable = true;
			this.paused = false;
			this.flags = "r";
			this.mode = 438;
			this.bufferSize = 64 * 1024;
			options = options || {};
			var keys = Object.keys(options);
			for (var index = 0, length = keys.length; index < length; index++) {
				var key = keys[index];
				this[key] = options[key];
			}
			if (this.encoding) this.setEncoding(this.encoding);
			if (this.start !== void 0) {
				if ("number" !== typeof this.start) throw TypeError("start must be a Number");
				if (this.end === void 0) this.end = Infinity;
				else if ("number" !== typeof this.end) throw TypeError("end must be a Number");
				if (this.start > this.end) throw new Error("start must be <= end");
				this.pos = this.start;
			}
			if (this.fd !== null) {
				process.nextTick(function() {
					self._read();
				});
				return;
			}
			fs.open(this.path, this.flags, this.mode, function(err, fd) {
				if (err) {
					self.emit("error", err);
					self.readable = false;
					return;
				}
				self.fd = fd;
				self.emit("open", fd);
				self._read();
			});
		}
		function WriteStream(path, options) {
			if (!(this instanceof WriteStream)) return new WriteStream(path, options);
			Stream$1.call(this);
			this.path = path;
			this.fd = null;
			this.writable = true;
			this.flags = "w";
			this.encoding = "binary";
			this.mode = 438;
			this.bytesWritten = 0;
			options = options || {};
			var keys = Object.keys(options);
			for (var index = 0, length = keys.length; index < length; index++) {
				var key = keys[index];
				this[key] = options[key];
			}
			if (this.start !== void 0) {
				if ("number" !== typeof this.start) throw TypeError("start must be a Number");
				if (this.start < 0) throw new Error("start must be >= zero");
				this.pos = this.start;
			}
			this.busy = false;
			this._queue = [];
			if (this.fd === null) {
				this._open = fs.open;
				this._queue.push([
					this._open,
					this.path,
					this.flags,
					this.mode,
					void 0
				]);
				this.flush();
			}
		}
	}
}));

//#endregion
//#region ../../../../../node_modules/graceful-fs/clone.js
var require_clone = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = clone;
	var getPrototypeOf = Object.getPrototypeOf || function(obj) {
		return obj.__proto__;
	};
	function clone(obj) {
		if (obj === null || typeof obj !== "object") return obj;
		if (obj instanceof Object) var copy = { __proto__: getPrototypeOf(obj) };
		else var copy = Object.create(null);
		Object.getOwnPropertyNames(obj).forEach(function(key) {
			Object.defineProperty(copy, key, Object.getOwnPropertyDescriptor(obj, key));
		});
		return copy;
	}
}));

//#endregion
//#region ../../../../../node_modules/graceful-fs/graceful-fs.js
var require_graceful_fs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	var fs = require("fs");
	var polyfills = require_polyfills();
	var legacy = require_legacy_streams();
	var clone = require_clone();
	var util = require("util");
	/* istanbul ignore next - node 0.x polyfill */
	var gracefulQueue;
	var previousSymbol;
	/* istanbul ignore else - node 0.x polyfill */
	if (typeof Symbol === "function" && typeof Symbol.for === "function") {
		gracefulQueue = Symbol.for("graceful-fs.queue");
		previousSymbol = Symbol.for("graceful-fs.previous");
	} else {
		gracefulQueue = "___graceful-fs.queue";
		previousSymbol = "___graceful-fs.previous";
	}
	function noop() {}
	function publishQueue(context, queue) {
		Object.defineProperty(context, gracefulQueue, { get: function() {
			return queue;
		} });
	}
	var debug = noop;
	if (util.debuglog) debug = util.debuglog("gfs4");
	else if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) debug = function() {
		var m = util.format.apply(util, arguments);
		m = "GFS4: " + m.split(/\n/).join("\nGFS4: ");
		console.error(m);
	};
	if (!fs[gracefulQueue]) {
		publishQueue(fs, global[gracefulQueue] || []);
		fs.close = (function(fs$close) {
			function close(fd, cb) {
				return fs$close.call(fs, fd, function(err) {
					if (!err) resetQueue();
					if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
			Object.defineProperty(close, previousSymbol, { value: fs$close });
			return close;
		})(fs.close);
		fs.closeSync = (function(fs$closeSync) {
			function closeSync(fd) {
				fs$closeSync.apply(fs, arguments);
				resetQueue();
			}
			Object.defineProperty(closeSync, previousSymbol, { value: fs$closeSync });
			return closeSync;
		})(fs.closeSync);
		if (/\bgfs4\b/i.test(process.env.NODE_DEBUG || "")) process.on("exit", function() {
			debug(fs[gracefulQueue]);
			require("assert").equal(fs[gracefulQueue].length, 0);
		});
	}
	if (!global[gracefulQueue]) publishQueue(global, fs[gracefulQueue]);
	module.exports = patch(clone(fs));
	if (process.env.TEST_GRACEFUL_FS_GLOBAL_PATCH && !fs.__patched) {
		module.exports = patch(fs);
		fs.__patched = true;
	}
	function patch(fs) {
		polyfills(fs);
		fs.gracefulify = patch;
		fs.createReadStream = createReadStream;
		fs.createWriteStream = createWriteStream;
		var fs$readFile = fs.readFile;
		fs.readFile = readFile;
		function readFile(path, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			return go$readFile(path, options, cb);
			function go$readFile(path, options, cb, startTime) {
				return fs$readFile(path, options, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$readFile,
						[
							path,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$writeFile = fs.writeFile;
		fs.writeFile = writeFile;
		function writeFile(path, data, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			return go$writeFile(path, data, options, cb);
			function go$writeFile(path, data, options, cb, startTime) {
				return fs$writeFile(path, data, options, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$writeFile,
						[
							path,
							data,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$appendFile = fs.appendFile;
		if (fs$appendFile) fs.appendFile = appendFile;
		function appendFile(path, data, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			return go$appendFile(path, data, options, cb);
			function go$appendFile(path, data, options, cb, startTime) {
				return fs$appendFile(path, data, options, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$appendFile,
						[
							path,
							data,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$copyFile = fs.copyFile;
		if (fs$copyFile) fs.copyFile = copyFile;
		function copyFile(src, dest, flags, cb) {
			if (typeof flags === "function") {
				cb = flags;
				flags = 0;
			}
			return go$copyFile(src, dest, flags, cb);
			function go$copyFile(src, dest, flags, cb, startTime) {
				return fs$copyFile(src, dest, flags, function(err) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$copyFile,
						[
							src,
							dest,
							flags,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		var fs$readdir = fs.readdir;
		fs.readdir = readdir;
		var noReaddirOptionVersions = /^v[0-5]\./;
		function readdir(path, options, cb) {
			if (typeof options === "function") cb = options, options = null;
			var go$readdir = noReaddirOptionVersions.test(process.version) ? function go$readdir(path, options, cb, startTime) {
				return fs$readdir(path, fs$readdirCallback(path, options, cb, startTime));
			} : function go$readdir(path, options, cb, startTime) {
				return fs$readdir(path, options, fs$readdirCallback(path, options, cb, startTime));
			};
			return go$readdir(path, options, cb);
			function fs$readdirCallback(path, options, cb, startTime) {
				return function(err, files) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$readdir,
						[
							path,
							options,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else {
						if (files && files.sort) files.sort();
						if (typeof cb === "function") cb.call(this, err, files);
					}
				};
			}
		}
		if (process.version.substr(0, 4) === "v0.8") {
			var legStreams = legacy(fs);
			ReadStream = legStreams.ReadStream;
			WriteStream = legStreams.WriteStream;
		}
		var fs$ReadStream = fs.ReadStream;
		if (fs$ReadStream) {
			ReadStream.prototype = Object.create(fs$ReadStream.prototype);
			ReadStream.prototype.open = ReadStream$open;
		}
		var fs$WriteStream = fs.WriteStream;
		if (fs$WriteStream) {
			WriteStream.prototype = Object.create(fs$WriteStream.prototype);
			WriteStream.prototype.open = WriteStream$open;
		}
		Object.defineProperty(fs, "ReadStream", {
			get: function() {
				return ReadStream;
			},
			set: function(val) {
				ReadStream = val;
			},
			enumerable: true,
			configurable: true
		});
		Object.defineProperty(fs, "WriteStream", {
			get: function() {
				return WriteStream;
			},
			set: function(val) {
				WriteStream = val;
			},
			enumerable: true,
			configurable: true
		});
		var FileReadStream = ReadStream;
		Object.defineProperty(fs, "FileReadStream", {
			get: function() {
				return FileReadStream;
			},
			set: function(val) {
				FileReadStream = val;
			},
			enumerable: true,
			configurable: true
		});
		var FileWriteStream = WriteStream;
		Object.defineProperty(fs, "FileWriteStream", {
			get: function() {
				return FileWriteStream;
			},
			set: function(val) {
				FileWriteStream = val;
			},
			enumerable: true,
			configurable: true
		});
		function ReadStream(path, options) {
			if (this instanceof ReadStream) return fs$ReadStream.apply(this, arguments), this;
			else return ReadStream.apply(Object.create(ReadStream.prototype), arguments);
		}
		function ReadStream$open() {
			var that = this;
			open(that.path, that.flags, that.mode, function(err, fd) {
				if (err) {
					if (that.autoClose) that.destroy();
					that.emit("error", err);
				} else {
					that.fd = fd;
					that.emit("open", fd);
					that.read();
				}
			});
		}
		function WriteStream(path, options) {
			if (this instanceof WriteStream) return fs$WriteStream.apply(this, arguments), this;
			else return WriteStream.apply(Object.create(WriteStream.prototype), arguments);
		}
		function WriteStream$open() {
			var that = this;
			open(that.path, that.flags, that.mode, function(err, fd) {
				if (err) {
					that.destroy();
					that.emit("error", err);
				} else {
					that.fd = fd;
					that.emit("open", fd);
				}
			});
		}
		function createReadStream(path, options) {
			return new fs.ReadStream(path, options);
		}
		function createWriteStream(path, options) {
			return new fs.WriteStream(path, options);
		}
		var fs$open = fs.open;
		fs.open = open;
		function open(path, flags, mode, cb) {
			if (typeof mode === "function") cb = mode, mode = null;
			return go$open(path, flags, mode, cb);
			function go$open(path, flags, mode, cb, startTime) {
				return fs$open(path, flags, mode, function(err, fd) {
					if (err && (err.code === "EMFILE" || err.code === "ENFILE")) enqueue([
						go$open,
						[
							path,
							flags,
							mode,
							cb
						],
						err,
						startTime || Date.now(),
						Date.now()
					]);
					else if (typeof cb === "function") cb.apply(this, arguments);
				});
			}
		}
		return fs;
	}
	function enqueue(elem) {
		debug("ENQUEUE", elem[0].name, elem[1]);
		fs[gracefulQueue].push(elem);
		retry();
	}
	var retryTimer;
	function resetQueue() {
		var now = Date.now();
		for (var i = 0; i < fs[gracefulQueue].length; ++i) if (fs[gracefulQueue][i].length > 2) {
			fs[gracefulQueue][i][3] = now;
			fs[gracefulQueue][i][4] = now;
		}
		retry();
	}
	function retry() {
		clearTimeout(retryTimer);
		retryTimer = void 0;
		if (fs[gracefulQueue].length === 0) return;
		var elem = fs[gracefulQueue].shift();
		var fn = elem[0];
		var args = elem[1];
		var err = elem[2];
		var startTime = elem[3];
		var lastTime = elem[4];
		if (startTime === void 0) {
			debug("RETRY", fn.name, args);
			fn.apply(null, args);
		} else if (Date.now() - startTime >= 6e4) {
			debug("TIMEOUT", fn.name, args);
			var cb = args.pop();
			if (typeof cb === "function") cb.call(null, err);
		} else {
			var sinceAttempt = Date.now() - lastTime;
			var sinceStart = Math.max(lastTime - startTime, 1);
			if (sinceAttempt >= Math.min(sinceStart * 1.2, 100)) {
				debug("RETRY", fn.name, args);
				fn.apply(null, args.concat([startTime]));
			} else fs[gracefulQueue].push(elem);
		}
		if (retryTimer === void 0) retryTimer = setTimeout(retry, 0);
	}
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/fs/index.js
var require_fs = /* @__PURE__ */ __commonJSMin(((exports) => {
	const u = require_universalify().fromCallback;
	const fs = require_graceful_fs();
	const api = [
		"access",
		"appendFile",
		"chmod",
		"chown",
		"close",
		"copyFile",
		"cp",
		"fchmod",
		"fchown",
		"fdatasync",
		"fstat",
		"fsync",
		"ftruncate",
		"futimes",
		"glob",
		"lchmod",
		"lchown",
		"lutimes",
		"link",
		"lstat",
		"mkdir",
		"mkdtemp",
		"open",
		"opendir",
		"readdir",
		"readFile",
		"readlink",
		"realpath",
		"rename",
		"rm",
		"rmdir",
		"stat",
		"statfs",
		"symlink",
		"truncate",
		"unlink",
		"utimes",
		"writeFile"
	].filter((key) => {
		return typeof fs[key] === "function";
	});
	Object.assign(exports, fs);
	api.forEach((method) => {
		exports[method] = u(fs[method]);
	});
	exports.exists = function(filename, callback) {
		if (typeof callback === "function") return fs.exists(filename, callback);
		return new Promise((resolve) => {
			return fs.exists(filename, resolve);
		});
	};
	exports.read = function(fd, buffer, offset, length, position, callback) {
		if (typeof callback === "function") return fs.read(fd, buffer, offset, length, position, callback);
		return new Promise((resolve, reject) => {
			fs.read(fd, buffer, offset, length, position, (err, bytesRead, buffer) => {
				if (err) return reject(err);
				resolve({
					bytesRead,
					buffer
				});
			});
		});
	};
	exports.write = function(fd, buffer, ...args) {
		if (typeof args[args.length - 1] === "function") return fs.write(fd, buffer, ...args);
		return new Promise((resolve, reject) => {
			fs.write(fd, buffer, ...args, (err, bytesWritten, buffer) => {
				if (err) return reject(err);
				resolve({
					bytesWritten,
					buffer
				});
			});
		});
	};
	exports.readv = function(fd, buffers, ...args) {
		if (typeof args[args.length - 1] === "function") return fs.readv(fd, buffers, ...args);
		return new Promise((resolve, reject) => {
			fs.readv(fd, buffers, ...args, (err, bytesRead, buffers) => {
				if (err) return reject(err);
				resolve({
					bytesRead,
					buffers
				});
			});
		});
	};
	exports.writev = function(fd, buffers, ...args) {
		if (typeof args[args.length - 1] === "function") return fs.writev(fd, buffers, ...args);
		return new Promise((resolve, reject) => {
			fs.writev(fd, buffers, ...args, (err, bytesWritten, buffers) => {
				if (err) return reject(err);
				resolve({
					bytesWritten,
					buffers
				});
			});
		});
	};
	if (typeof fs.realpath.native === "function") exports.realpath.native = u(fs.realpath.native);
	else process.emitWarning("fs.realpath.native is not a function. Is fs being monkey-patched?", "Warning", "fs-extra-WARN0003");
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/mkdirs/utils.js
var require_utils$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const path$11 = require("path");
	module.exports.checkPath = function checkPath(pth) {
		if (process.platform === "win32") {
			if (/[<>:"|?*]/.test(pth.replace(path$11.parse(pth).root, ""))) {
				const error = /* @__PURE__ */ new Error(`Path contains invalid characters: ${pth}`);
				error.code = "EINVAL";
				throw error;
			}
		}
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/mkdirs/make-dir.js
var require_make_dir = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_fs();
	const { checkPath } = require_utils$1();
	const getMode = (options) => {
		const defaults = { mode: 511 };
		if (typeof options === "number") return options;
		return {
			...defaults,
			...options
		}.mode;
	};
	module.exports.makeDir = async (dir, options) => {
		checkPath(dir);
		return fs.mkdir(dir, {
			mode: getMode(options),
			recursive: true
		});
	};
	module.exports.makeDirSync = (dir, options) => {
		checkPath(dir);
		return fs.mkdirSync(dir, {
			mode: getMode(options),
			recursive: true
		});
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/mkdirs/index.js
var require_mkdirs = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const { makeDir: _makeDir, makeDirSync } = require_make_dir();
	const makeDir = u(_makeDir);
	module.exports = {
		mkdirs: makeDir,
		mkdirsSync: makeDirSync,
		mkdirp: makeDir,
		mkdirpSync: makeDirSync,
		ensureDir: makeDir,
		ensureDirSync: makeDirSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/path-exists/index.js
var require_path_exists = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const fs = require_fs();
	function pathExists(path) {
		return fs.access(path).then(() => true).catch(() => false);
	}
	module.exports = {
		pathExists: u(pathExists),
		pathExistsSync: fs.existsSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/util/utimes.js
var require_utimes = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_fs();
	const u = require_universalify().fromPromise;
	async function utimesMillis(path, atime, mtime) {
		const fd = await fs.open(path, "r+");
		let closeErr = null;
		try {
			await fs.futimes(fd, atime, mtime);
		} finally {
			try {
				await fs.close(fd);
			} catch (e) {
				closeErr = e;
			}
		}
		if (closeErr) throw closeErr;
	}
	function utimesMillisSync(path, atime, mtime) {
		const fd = fs.openSync(path, "r+");
		fs.futimesSync(fd, atime, mtime);
		return fs.closeSync(fd);
	}
	module.exports = {
		utimesMillis: u(utimesMillis),
		utimesMillisSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/util/stat.js
var require_stat = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_fs();
	const path$10 = require("path");
	const u = require_universalify().fromPromise;
	function getStats(src, dest, opts) {
		const statFunc = opts.dereference ? (file) => fs.stat(file, { bigint: true }) : (file) => fs.lstat(file, { bigint: true });
		return Promise.all([statFunc(src), statFunc(dest).catch((err) => {
			if (err.code === "ENOENT") return null;
			throw err;
		})]).then(([srcStat, destStat]) => ({
			srcStat,
			destStat
		}));
	}
	function getStatsSync(src, dest, opts) {
		let destStat;
		const statFunc = opts.dereference ? (file) => fs.statSync(file, { bigint: true }) : (file) => fs.lstatSync(file, { bigint: true });
		const srcStat = statFunc(src);
		try {
			destStat = statFunc(dest);
		} catch (err) {
			if (err.code === "ENOENT") return {
				srcStat,
				destStat: null
			};
			throw err;
		}
		return {
			srcStat,
			destStat
		};
	}
	async function checkPaths(src, dest, funcName, opts) {
		const { srcStat, destStat } = await getStats(src, dest, opts);
		if (destStat) {
			if (areIdentical(srcStat, destStat)) {
				const srcBaseName = path$10.basename(src);
				const destBaseName = path$10.basename(dest);
				if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) return {
					srcStat,
					destStat,
					isChangingCase: true
				};
				throw new Error("Source and destination must not be the same.");
			}
			if (srcStat.isDirectory() && !destStat.isDirectory()) throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
			if (!srcStat.isDirectory() && destStat.isDirectory()) throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
		}
		if (srcStat.isDirectory() && isSrcSubdir(src, dest)) throw new Error(errMsg(src, dest, funcName));
		return {
			srcStat,
			destStat
		};
	}
	function checkPathsSync(src, dest, funcName, opts) {
		const { srcStat, destStat } = getStatsSync(src, dest, opts);
		if (destStat) {
			if (areIdentical(srcStat, destStat)) {
				const srcBaseName = path$10.basename(src);
				const destBaseName = path$10.basename(dest);
				if (funcName === "move" && srcBaseName !== destBaseName && srcBaseName.toLowerCase() === destBaseName.toLowerCase()) return {
					srcStat,
					destStat,
					isChangingCase: true
				};
				throw new Error("Source and destination must not be the same.");
			}
			if (srcStat.isDirectory() && !destStat.isDirectory()) throw new Error(`Cannot overwrite non-directory '${dest}' with directory '${src}'.`);
			if (!srcStat.isDirectory() && destStat.isDirectory()) throw new Error(`Cannot overwrite directory '${dest}' with non-directory '${src}'.`);
		}
		if (srcStat.isDirectory() && isSrcSubdir(src, dest)) throw new Error(errMsg(src, dest, funcName));
		return {
			srcStat,
			destStat
		};
	}
	async function checkParentPaths(src, srcStat, dest, funcName) {
		const srcParent = path$10.resolve(path$10.dirname(src));
		const destParent = path$10.resolve(path$10.dirname(dest));
		if (destParent === srcParent || destParent === path$10.parse(destParent).root) return;
		let destStat;
		try {
			destStat = await fs.stat(destParent, { bigint: true });
		} catch (err) {
			if (err.code === "ENOENT") return;
			throw err;
		}
		if (areIdentical(srcStat, destStat)) throw new Error(errMsg(src, dest, funcName));
		return checkParentPaths(src, srcStat, destParent, funcName);
	}
	function checkParentPathsSync(src, srcStat, dest, funcName) {
		const srcParent = path$10.resolve(path$10.dirname(src));
		const destParent = path$10.resolve(path$10.dirname(dest));
		if (destParent === srcParent || destParent === path$10.parse(destParent).root) return;
		let destStat;
		try {
			destStat = fs.statSync(destParent, { bigint: true });
		} catch (err) {
			if (err.code === "ENOENT") return;
			throw err;
		}
		if (areIdentical(srcStat, destStat)) throw new Error(errMsg(src, dest, funcName));
		return checkParentPathsSync(src, srcStat, destParent, funcName);
	}
	function areIdentical(srcStat, destStat) {
		return destStat.ino !== void 0 && destStat.dev !== void 0 && destStat.ino === srcStat.ino && destStat.dev === srcStat.dev;
	}
	function isSrcSubdir(src, dest) {
		const srcArr = path$10.resolve(src).split(path$10.sep).filter((i) => i);
		const destArr = path$10.resolve(dest).split(path$10.sep).filter((i) => i);
		return srcArr.every((cur, i) => destArr[i] === cur);
	}
	function errMsg(src, dest, funcName) {
		return `Cannot ${funcName} '${src}' to a subdirectory of itself, '${dest}'.`;
	}
	module.exports = {
		checkPaths: u(checkPaths),
		checkPathsSync,
		checkParentPaths: u(checkParentPaths),
		checkParentPathsSync,
		isSrcSubdir,
		areIdentical
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/util/async.js
var require_async = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	async function asyncIteratorConcurrentProcess(iterator, fn) {
		const promises = [];
		for await (const item of iterator) promises.push(fn(item).then(() => null, (err) => err ?? /* @__PURE__ */ new Error("unknown error")));
		await Promise.all(promises.map((promise) => promise.then((possibleErr) => {
			if (possibleErr !== null) throw possibleErr;
		})));
	}
	module.exports = { asyncIteratorConcurrentProcess };
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/copy/copy.js
var require_copy$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_fs();
	const path$9 = require("path");
	const { mkdirs } = require_mkdirs();
	const { pathExists } = require_path_exists();
	const { utimesMillis } = require_utimes();
	const stat = require_stat();
	const { asyncIteratorConcurrentProcess } = require_async();
	async function copy(src, dest, opts = {}) {
		if (typeof opts === "function") opts = { filter: opts };
		opts.clobber = "clobber" in opts ? !!opts.clobber : true;
		opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
		if (opts.preserveTimestamps && process.arch === "ia32") process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0001");
		const { srcStat, destStat } = await stat.checkPaths(src, dest, "copy", opts);
		await stat.checkParentPaths(src, srcStat, dest, "copy");
		if (!await runFilter(src, dest, opts)) return;
		const destParent = path$9.dirname(dest);
		if (!await pathExists(destParent)) await mkdirs(destParent);
		await getStatsAndPerformCopy(destStat, src, dest, opts);
	}
	async function runFilter(src, dest, opts) {
		if (!opts.filter) return true;
		return opts.filter(src, dest);
	}
	async function getStatsAndPerformCopy(destStat, src, dest, opts) {
		const srcStat = await (opts.dereference ? fs.stat : fs.lstat)(src);
		if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
		if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
		if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
		if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
		if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
		throw new Error(`Unknown file: ${src}`);
	}
	async function onFile(srcStat, destStat, src, dest, opts) {
		if (!destStat) return copyFile(srcStat, src, dest, opts);
		if (opts.overwrite) {
			await fs.unlink(dest);
			return copyFile(srcStat, src, dest, opts);
		}
		if (opts.errorOnExist) throw new Error(`'${dest}' already exists`);
	}
	async function copyFile(srcStat, src, dest, opts) {
		await fs.copyFile(src, dest);
		if (opts.preserveTimestamps) {
			if (fileIsNotWritable(srcStat.mode)) await makeFileWritable(dest, srcStat.mode);
			const updatedSrcStat = await fs.stat(src);
			await utimesMillis(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
		}
		return fs.chmod(dest, srcStat.mode);
	}
	function fileIsNotWritable(srcMode) {
		return (srcMode & 128) === 0;
	}
	function makeFileWritable(dest, srcMode) {
		return fs.chmod(dest, srcMode | 128);
	}
	async function onDir(srcStat, destStat, src, dest, opts) {
		if (!destStat) await fs.mkdir(dest);
		await asyncIteratorConcurrentProcess(await fs.opendir(src), async (item) => {
			const srcItem = path$9.join(src, item.name);
			const destItem = path$9.join(dest, item.name);
			if (await runFilter(srcItem, destItem, opts)) {
				const { destStat } = await stat.checkPaths(srcItem, destItem, "copy", opts);
				await getStatsAndPerformCopy(destStat, srcItem, destItem, opts);
			}
		});
		if (!destStat) await fs.chmod(dest, srcStat.mode);
	}
	async function onLink(destStat, src, dest, opts) {
		let resolvedSrc = await fs.readlink(src);
		if (opts.dereference) resolvedSrc = path$9.resolve(process.cwd(), resolvedSrc);
		if (!destStat) return fs.symlink(resolvedSrc, dest);
		let resolvedDest = null;
		try {
			resolvedDest = await fs.readlink(dest);
		} catch (e) {
			if (e.code === "EINVAL" || e.code === "UNKNOWN") return fs.symlink(resolvedSrc, dest);
			throw e;
		}
		if (opts.dereference) resolvedDest = path$9.resolve(process.cwd(), resolvedDest);
		if (resolvedSrc !== resolvedDest) {
			if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
			if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
		}
		await fs.unlink(dest);
		return fs.symlink(resolvedSrc, dest);
	}
	module.exports = copy;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/copy/copy-sync.js
var require_copy_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_graceful_fs();
	const path$8 = require("path");
	const mkdirsSync = require_mkdirs().mkdirsSync;
	const utimesMillisSync = require_utimes().utimesMillisSync;
	const stat = require_stat();
	function copySync(src, dest, opts) {
		if (typeof opts === "function") opts = { filter: opts };
		opts = opts || {};
		opts.clobber = "clobber" in opts ? !!opts.clobber : true;
		opts.overwrite = "overwrite" in opts ? !!opts.overwrite : opts.clobber;
		if (opts.preserveTimestamps && process.arch === "ia32") process.emitWarning("Using the preserveTimestamps option in 32-bit node is not recommended;\n\n	see https://github.com/jprichardson/node-fs-extra/issues/269", "Warning", "fs-extra-WARN0002");
		const { srcStat, destStat } = stat.checkPathsSync(src, dest, "copy", opts);
		stat.checkParentPathsSync(src, srcStat, dest, "copy");
		if (opts.filter && !opts.filter(src, dest)) return;
		const destParent = path$8.dirname(dest);
		if (!fs.existsSync(destParent)) mkdirsSync(destParent);
		return getStats(destStat, src, dest, opts);
	}
	function getStats(destStat, src, dest, opts) {
		const srcStat = (opts.dereference ? fs.statSync : fs.lstatSync)(src);
		if (srcStat.isDirectory()) return onDir(srcStat, destStat, src, dest, opts);
		else if (srcStat.isFile() || srcStat.isCharacterDevice() || srcStat.isBlockDevice()) return onFile(srcStat, destStat, src, dest, opts);
		else if (srcStat.isSymbolicLink()) return onLink(destStat, src, dest, opts);
		else if (srcStat.isSocket()) throw new Error(`Cannot copy a socket file: ${src}`);
		else if (srcStat.isFIFO()) throw new Error(`Cannot copy a FIFO pipe: ${src}`);
		throw new Error(`Unknown file: ${src}`);
	}
	function onFile(srcStat, destStat, src, dest, opts) {
		if (!destStat) return copyFile(srcStat, src, dest, opts);
		return mayCopyFile(srcStat, src, dest, opts);
	}
	function mayCopyFile(srcStat, src, dest, opts) {
		if (opts.overwrite) {
			fs.unlinkSync(dest);
			return copyFile(srcStat, src, dest, opts);
		} else if (opts.errorOnExist) throw new Error(`'${dest}' already exists`);
	}
	function copyFile(srcStat, src, dest, opts) {
		fs.copyFileSync(src, dest);
		if (opts.preserveTimestamps) handleTimestamps(srcStat.mode, src, dest);
		return setDestMode(dest, srcStat.mode);
	}
	function handleTimestamps(srcMode, src, dest) {
		if (fileIsNotWritable(srcMode)) makeFileWritable(dest, srcMode);
		return setDestTimestamps(src, dest);
	}
	function fileIsNotWritable(srcMode) {
		return (srcMode & 128) === 0;
	}
	function makeFileWritable(dest, srcMode) {
		return setDestMode(dest, srcMode | 128);
	}
	function setDestMode(dest, srcMode) {
		return fs.chmodSync(dest, srcMode);
	}
	function setDestTimestamps(src, dest) {
		const updatedSrcStat = fs.statSync(src);
		return utimesMillisSync(dest, updatedSrcStat.atime, updatedSrcStat.mtime);
	}
	function onDir(srcStat, destStat, src, dest, opts) {
		if (!destStat) return mkDirAndCopy(srcStat.mode, src, dest, opts);
		return copyDir(src, dest, opts);
	}
	function mkDirAndCopy(srcMode, src, dest, opts) {
		fs.mkdirSync(dest);
		copyDir(src, dest, opts);
		return setDestMode(dest, srcMode);
	}
	function copyDir(src, dest, opts) {
		const dir = fs.opendirSync(src);
		try {
			let dirent;
			while ((dirent = dir.readSync()) !== null) copyDirItem(dirent.name, src, dest, opts);
		} finally {
			dir.closeSync();
		}
	}
	function copyDirItem(item, src, dest, opts) {
		const srcItem = path$8.join(src, item);
		const destItem = path$8.join(dest, item);
		if (opts.filter && !opts.filter(srcItem, destItem)) return;
		const { destStat } = stat.checkPathsSync(srcItem, destItem, "copy", opts);
		return getStats(destStat, srcItem, destItem, opts);
	}
	function onLink(destStat, src, dest, opts) {
		let resolvedSrc = fs.readlinkSync(src);
		if (opts.dereference) resolvedSrc = path$8.resolve(process.cwd(), resolvedSrc);
		if (!destStat) return fs.symlinkSync(resolvedSrc, dest);
		else {
			let resolvedDest;
			try {
				resolvedDest = fs.readlinkSync(dest);
			} catch (err) {
				if (err.code === "EINVAL" || err.code === "UNKNOWN") return fs.symlinkSync(resolvedSrc, dest);
				throw err;
			}
			if (opts.dereference) resolvedDest = path$8.resolve(process.cwd(), resolvedDest);
			if (resolvedSrc !== resolvedDest) {
				if (stat.isSrcSubdir(resolvedSrc, resolvedDest)) throw new Error(`Cannot copy '${resolvedSrc}' to a subdirectory of itself, '${resolvedDest}'.`);
				if (stat.isSrcSubdir(resolvedDest, resolvedSrc)) throw new Error(`Cannot overwrite '${resolvedDest}' with '${resolvedSrc}'.`);
			}
			return copyLink(resolvedSrc, dest);
		}
	}
	function copyLink(resolvedSrc, dest) {
		fs.unlinkSync(dest);
		return fs.symlinkSync(resolvedSrc, dest);
	}
	module.exports = copySync;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/copy/index.js
var require_copy = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	module.exports = {
		copy: u(require_copy$1()),
		copySync: require_copy_sync()
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/remove/index.js
var require_remove = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_graceful_fs();
	const u = require_universalify().fromCallback;
	function remove(path, callback) {
		fs.rm(path, {
			recursive: true,
			force: true
		}, callback);
	}
	function removeSync(path) {
		fs.rmSync(path, {
			recursive: true,
			force: true
		});
	}
	module.exports = {
		remove: u(remove),
		removeSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/empty/index.js
var require_empty = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const fs = require_fs();
	const path$7 = require("path");
	const mkdir = require_mkdirs();
	const remove = require_remove();
	const emptyDir = u(async function emptyDir(dir) {
		let items;
		try {
			items = await fs.readdir(dir);
		} catch {
			return mkdir.mkdirs(dir);
		}
		return Promise.all(items.map((item) => remove.remove(path$7.join(dir, item))));
	});
	function emptyDirSync(dir) {
		let items;
		try {
			items = fs.readdirSync(dir);
		} catch {
			return mkdir.mkdirsSync(dir);
		}
		items.forEach((item) => {
			item = path$7.join(dir, item);
			remove.removeSync(item);
		});
	}
	module.exports = {
		emptyDirSync,
		emptydirSync: emptyDirSync,
		emptyDir,
		emptydir: emptyDir
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/ensure/file.js
var require_file = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const path$6 = require("path");
	const fs = require_fs();
	const mkdir = require_mkdirs();
	async function createFile(file) {
		let stats;
		try {
			stats = await fs.stat(file);
		} catch {}
		if (stats && stats.isFile()) return;
		const dir = path$6.dirname(file);
		let dirStats = null;
		try {
			dirStats = await fs.stat(dir);
		} catch (err) {
			if (err.code === "ENOENT") {
				await mkdir.mkdirs(dir);
				await fs.writeFile(file, "");
				return;
			} else throw err;
		}
		if (dirStats.isDirectory()) await fs.writeFile(file, "");
		else await fs.readdir(dir);
	}
	function createFileSync(file) {
		let stats;
		try {
			stats = fs.statSync(file);
		} catch {}
		if (stats && stats.isFile()) return;
		const dir = path$6.dirname(file);
		try {
			if (!fs.statSync(dir).isDirectory()) fs.readdirSync(dir);
		} catch (err) {
			if (err && err.code === "ENOENT") mkdir.mkdirsSync(dir);
			else throw err;
		}
		fs.writeFileSync(file, "");
	}
	module.exports = {
		createFile: u(createFile),
		createFileSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/ensure/link.js
var require_link = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const path$5 = require("path");
	const fs = require_fs();
	const mkdir = require_mkdirs();
	const { pathExists } = require_path_exists();
	const { areIdentical } = require_stat();
	async function createLink(srcpath, dstpath) {
		let dstStat;
		try {
			dstStat = await fs.lstat(dstpath);
		} catch {}
		let srcStat;
		try {
			srcStat = await fs.lstat(srcpath);
		} catch (err) {
			err.message = err.message.replace("lstat", "ensureLink");
			throw err;
		}
		if (dstStat && areIdentical(srcStat, dstStat)) return;
		const dir = path$5.dirname(dstpath);
		if (!await pathExists(dir)) await mkdir.mkdirs(dir);
		await fs.link(srcpath, dstpath);
	}
	function createLinkSync(srcpath, dstpath) {
		let dstStat;
		try {
			dstStat = fs.lstatSync(dstpath);
		} catch {}
		try {
			const srcStat = fs.lstatSync(srcpath);
			if (dstStat && areIdentical(srcStat, dstStat)) return;
		} catch (err) {
			err.message = err.message.replace("lstat", "ensureLink");
			throw err;
		}
		const dir = path$5.dirname(dstpath);
		if (fs.existsSync(dir)) return fs.linkSync(srcpath, dstpath);
		mkdir.mkdirsSync(dir);
		return fs.linkSync(srcpath, dstpath);
	}
	module.exports = {
		createLink: u(createLink),
		createLinkSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/ensure/symlink-paths.js
var require_symlink_paths = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const path$4 = require("path");
	const fs = require_fs();
	const { pathExists } = require_path_exists();
	const u = require_universalify().fromPromise;
	/**
	* Function that returns two types of paths, one relative to symlink, and one
	* relative to the current working directory. Checks if path is absolute or
	* relative. If the path is relative, this function checks if the path is
	* relative to symlink or relative to current working directory. This is an
	* initiative to find a smarter `srcpath` to supply when building symlinks.
	* This allows you to determine which path to use out of one of three possible
	* types of source paths. The first is an absolute path. This is detected by
	* `path.isAbsolute()`. When an absolute path is provided, it is checked to
	* see if it exists. If it does it's used, if not an error is returned
	* (callback)/ thrown (sync). The other two options for `srcpath` are a
	* relative url. By default Node's `fs.symlink` works by creating a symlink
	* using `dstpath` and expects the `srcpath` to be relative to the newly
	* created symlink. If you provide a `srcpath` that does not exist on the file
	* system it results in a broken symlink. To minimize this, the function
	* checks to see if the 'relative to symlink' source file exists, and if it
	* does it will use it. If it does not, it checks if there's a file that
	* exists that is relative to the current working directory, if does its used.
	* This preserves the expectations of the original fs.symlink spec and adds
	* the ability to pass in `relative to current working direcotry` paths.
	*/
	async function symlinkPaths(srcpath, dstpath) {
		if (path$4.isAbsolute(srcpath)) {
			try {
				await fs.lstat(srcpath);
			} catch (err) {
				err.message = err.message.replace("lstat", "ensureSymlink");
				throw err;
			}
			return {
				toCwd: srcpath,
				toDst: srcpath
			};
		}
		const dstdir = path$4.dirname(dstpath);
		const relativeToDst = path$4.join(dstdir, srcpath);
		if (await pathExists(relativeToDst)) return {
			toCwd: relativeToDst,
			toDst: srcpath
		};
		try {
			await fs.lstat(srcpath);
		} catch (err) {
			err.message = err.message.replace("lstat", "ensureSymlink");
			throw err;
		}
		return {
			toCwd: srcpath,
			toDst: path$4.relative(dstdir, srcpath)
		};
	}
	function symlinkPathsSync(srcpath, dstpath) {
		if (path$4.isAbsolute(srcpath)) {
			if (!fs.existsSync(srcpath)) throw new Error("absolute srcpath does not exist");
			return {
				toCwd: srcpath,
				toDst: srcpath
			};
		}
		const dstdir = path$4.dirname(dstpath);
		const relativeToDst = path$4.join(dstdir, srcpath);
		if (fs.existsSync(relativeToDst)) return {
			toCwd: relativeToDst,
			toDst: srcpath
		};
		if (!fs.existsSync(srcpath)) throw new Error("relative srcpath does not exist");
		return {
			toCwd: srcpath,
			toDst: path$4.relative(dstdir, srcpath)
		};
	}
	module.exports = {
		symlinkPaths: u(symlinkPaths),
		symlinkPathsSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/ensure/symlink-type.js
var require_symlink_type = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_fs();
	const u = require_universalify().fromPromise;
	async function symlinkType(srcpath, type) {
		if (type) return type;
		let stats;
		try {
			stats = await fs.lstat(srcpath);
		} catch {
			return "file";
		}
		return stats && stats.isDirectory() ? "dir" : "file";
	}
	function symlinkTypeSync(srcpath, type) {
		if (type) return type;
		let stats;
		try {
			stats = fs.lstatSync(srcpath);
		} catch {
			return "file";
		}
		return stats && stats.isDirectory() ? "dir" : "file";
	}
	module.exports = {
		symlinkType: u(symlinkType),
		symlinkTypeSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/ensure/symlink.js
var require_symlink = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const path$3 = require("path");
	const fs = require_fs();
	const { mkdirs, mkdirsSync } = require_mkdirs();
	const { symlinkPaths, symlinkPathsSync } = require_symlink_paths();
	const { symlinkType, symlinkTypeSync } = require_symlink_type();
	const { pathExists } = require_path_exists();
	const { areIdentical } = require_stat();
	async function createSymlink(srcpath, dstpath, type) {
		let stats;
		try {
			stats = await fs.lstat(dstpath);
		} catch {}
		if (stats && stats.isSymbolicLink()) {
			const [srcStat, dstStat] = await Promise.all([fs.stat(srcpath), fs.stat(dstpath)]);
			if (areIdentical(srcStat, dstStat)) return;
		}
		const relative = await symlinkPaths(srcpath, dstpath);
		srcpath = relative.toDst;
		const toType = await symlinkType(relative.toCwd, type);
		const dir = path$3.dirname(dstpath);
		if (!await pathExists(dir)) await mkdirs(dir);
		return fs.symlink(srcpath, dstpath, toType);
	}
	function createSymlinkSync(srcpath, dstpath, type) {
		let stats;
		try {
			stats = fs.lstatSync(dstpath);
		} catch {}
		if (stats && stats.isSymbolicLink()) {
			if (areIdentical(fs.statSync(srcpath), fs.statSync(dstpath))) return;
		}
		const relative = symlinkPathsSync(srcpath, dstpath);
		srcpath = relative.toDst;
		type = symlinkTypeSync(relative.toCwd, type);
		const dir = path$3.dirname(dstpath);
		if (fs.existsSync(dir)) return fs.symlinkSync(srcpath, dstpath, type);
		mkdirsSync(dir);
		return fs.symlinkSync(srcpath, dstpath, type);
	}
	module.exports = {
		createSymlink: u(createSymlink),
		createSymlinkSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/ensure/index.js
var require_ensure = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { createFile, createFileSync } = require_file();
	const { createLink, createLinkSync } = require_link();
	const { createSymlink, createSymlinkSync } = require_symlink();
	module.exports = {
		createFile,
		createFileSync,
		ensureFile: createFile,
		ensureFileSync: createFileSync,
		createLink,
		createLinkSync,
		ensureLink: createLink,
		ensureLinkSync: createLinkSync,
		createSymlink,
		createSymlinkSync,
		ensureSymlink: createSymlink,
		ensureSymlinkSync: createSymlinkSync
	};
}));

//#endregion
//#region ../../../../../node_modules/jsonfile/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function stringify(obj, { EOL = "\n", finalEOL = true, replacer = null, spaces } = {}) {
		const EOF = finalEOL ? EOL : "";
		return JSON.stringify(obj, replacer, spaces).replace(/\n/g, EOL) + EOF;
	}
	function stripBom(content) {
		if (Buffer.isBuffer(content)) content = content.toString("utf8");
		return content.replace(/^\uFEFF/, "");
	}
	module.exports = {
		stringify,
		stripBom
	};
}));

//#endregion
//#region ../../../../../node_modules/jsonfile/index.js
var require_jsonfile$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	let _fs;
	try {
		_fs = require_graceful_fs();
	} catch (_) {
		_fs = require("fs");
	}
	const universalify = require_universalify();
	const { stringify, stripBom } = require_utils();
	async function _readFile(file, options = {}) {
		if (typeof options === "string") options = { encoding: options };
		const fs = options.fs || _fs;
		const shouldThrow = "throws" in options ? options.throws : true;
		let data = await universalify.fromCallback(fs.readFile)(file, options);
		data = stripBom(data);
		let obj;
		try {
			obj = JSON.parse(data, options ? options.reviver : null);
		} catch (err) {
			if (shouldThrow) {
				err.message = `${file}: ${err.message}`;
				throw err;
			} else return null;
		}
		return obj;
	}
	const readFile = universalify.fromPromise(_readFile);
	function readFileSync(file, options = {}) {
		if (typeof options === "string") options = { encoding: options };
		const fs = options.fs || _fs;
		const shouldThrow = "throws" in options ? options.throws : true;
		try {
			let content = fs.readFileSync(file, options);
			content = stripBom(content);
			return JSON.parse(content, options.reviver);
		} catch (err) {
			if (shouldThrow) {
				err.message = `${file}: ${err.message}`;
				throw err;
			} else return null;
		}
	}
	async function _writeFile(file, obj, options = {}) {
		const fs = options.fs || _fs;
		const str = stringify(obj, options);
		await universalify.fromCallback(fs.writeFile)(file, str, options);
	}
	const writeFile = universalify.fromPromise(_writeFile);
	function writeFileSync(file, obj, options = {}) {
		const fs = options.fs || _fs;
		const str = stringify(obj, options);
		return fs.writeFileSync(file, str, options);
	}
	module.exports = {
		readFile,
		readFileSync,
		writeFile,
		writeFileSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/json/jsonfile.js
var require_jsonfile = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const jsonFile = require_jsonfile$1();
	module.exports = {
		readJson: jsonFile.readFile,
		readJsonSync: jsonFile.readFileSync,
		writeJson: jsonFile.writeFile,
		writeJsonSync: jsonFile.writeFileSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/output-file/index.js
var require_output_file = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const fs = require_fs();
	const path$2 = require("path");
	const mkdir = require_mkdirs();
	const pathExists = require_path_exists().pathExists;
	async function outputFile(file, data, encoding = "utf-8") {
		const dir = path$2.dirname(file);
		if (!await pathExists(dir)) await mkdir.mkdirs(dir);
		return fs.writeFile(file, data, encoding);
	}
	function outputFileSync(file, ...args) {
		const dir = path$2.dirname(file);
		if (!fs.existsSync(dir)) mkdir.mkdirsSync(dir);
		fs.writeFileSync(file, ...args);
	}
	module.exports = {
		outputFile: u(outputFile),
		outputFileSync
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/json/output-json.js
var require_output_json = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { stringify } = require_utils();
	const { outputFile } = require_output_file();
	async function outputJson(file, data, options = {}) {
		await outputFile(file, stringify(data, options), options);
	}
	module.exports = outputJson;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/json/output-json-sync.js
var require_output_json_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const { stringify } = require_utils();
	const { outputFileSync } = require_output_file();
	function outputJsonSync(file, data, options) {
		outputFileSync(file, stringify(data, options), options);
	}
	module.exports = outputJsonSync;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/json/index.js
var require_json = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	const jsonFile = require_jsonfile();
	jsonFile.outputJson = u(require_output_json());
	jsonFile.outputJsonSync = require_output_json_sync();
	jsonFile.outputJSON = jsonFile.outputJson;
	jsonFile.outputJSONSync = jsonFile.outputJsonSync;
	jsonFile.writeJSON = jsonFile.writeJson;
	jsonFile.writeJSONSync = jsonFile.writeJsonSync;
	jsonFile.readJSON = jsonFile.readJson;
	jsonFile.readJSONSync = jsonFile.readJsonSync;
	module.exports = jsonFile;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/move/move.js
var require_move$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_fs();
	const path$1 = require("path");
	const { copy } = require_copy();
	const { remove } = require_remove();
	const { mkdirp } = require_mkdirs();
	const { pathExists } = require_path_exists();
	const stat = require_stat();
	async function move(src, dest, opts = {}) {
		const overwrite = opts.overwrite || opts.clobber || false;
		const { srcStat, isChangingCase = false } = await stat.checkPaths(src, dest, "move", opts);
		await stat.checkParentPaths(src, srcStat, dest, "move");
		const destParent = path$1.dirname(dest);
		if (path$1.parse(destParent).root !== destParent) await mkdirp(destParent);
		return doRename(src, dest, overwrite, isChangingCase);
	}
	async function doRename(src, dest, overwrite, isChangingCase) {
		if (!isChangingCase) {
			if (overwrite) await remove(dest);
			else if (await pathExists(dest)) throw new Error("dest already exists.");
		}
		try {
			await fs.rename(src, dest);
		} catch (err) {
			if (err.code !== "EXDEV") throw err;
			await moveAcrossDevice(src, dest, overwrite);
		}
	}
	async function moveAcrossDevice(src, dest, overwrite) {
		await copy(src, dest, {
			overwrite,
			errorOnExist: true,
			preserveTimestamps: true
		});
		return remove(src);
	}
	module.exports = move;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/move/move-sync.js
var require_move_sync = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const fs = require_graceful_fs();
	const path = require("path");
	const copySync = require_copy().copySync;
	const removeSync = require_remove().removeSync;
	const mkdirpSync = require_mkdirs().mkdirpSync;
	const stat = require_stat();
	function moveSync(src, dest, opts) {
		opts = opts || {};
		const overwrite = opts.overwrite || opts.clobber || false;
		const { srcStat, isChangingCase = false } = stat.checkPathsSync(src, dest, "move", opts);
		stat.checkParentPathsSync(src, srcStat, dest, "move");
		if (!isParentRoot(dest)) mkdirpSync(path.dirname(dest));
		return doRename(src, dest, overwrite, isChangingCase);
	}
	function isParentRoot(dest) {
		const parent = path.dirname(dest);
		return path.parse(parent).root === parent;
	}
	function doRename(src, dest, overwrite, isChangingCase) {
		if (isChangingCase) return rename(src, dest, overwrite);
		if (overwrite) {
			removeSync(dest);
			return rename(src, dest, overwrite);
		}
		if (fs.existsSync(dest)) throw new Error("dest already exists.");
		return rename(src, dest, overwrite);
	}
	function rename(src, dest, overwrite) {
		try {
			fs.renameSync(src, dest);
		} catch (err) {
			if (err.code !== "EXDEV") throw err;
			return moveAcrossDevice(src, dest, overwrite);
		}
	}
	function moveAcrossDevice(src, dest, overwrite) {
		copySync(src, dest, {
			overwrite,
			errorOnExist: true,
			preserveTimestamps: true
		});
		return removeSync(src);
	}
	module.exports = moveSync;
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/move/index.js
var require_move = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const u = require_universalify().fromPromise;
	module.exports = {
		move: u(require_move$1()),
		moveSync: require_move_sync()
	};
}));

//#endregion
//#region ../../../../../node_modules/fs-extra/lib/index.js
var require_lib$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = {
		...require_fs(),
		...require_copy(),
		...require_empty(),
		...require_ensure(),
		...require_json(),
		...require_mkdirs(),
		...require_move(),
		...require_output_file(),
		...require_path_exists(),
		...require_remove()
	};
}));

//#endregion
//#region ../../../../../node_modules/chalk/source/vendor/ansi-styles/index.js
var import_lib = /* @__PURE__ */ __toESM(require_lib$1());
const ANSI_BACKGROUND_OFFSET = 10;
const wrapAnsi16 = (offset = 0) => (code) => `\u001B[${code + offset}m`;
const wrapAnsi256 = (offset = 0) => (code) => `\u001B[${38 + offset};5;${code}m`;
const wrapAnsi16m = (offset = 0) => (red, green, blue) => `\u001B[${38 + offset};2;${red};${green};${blue}m`;
const styles$1 = {
	modifier: {
		reset: [0, 0],
		bold: [1, 22],
		dim: [2, 22],
		italic: [3, 23],
		underline: [4, 24],
		overline: [53, 55],
		inverse: [7, 27],
		hidden: [8, 28],
		strikethrough: [9, 29]
	},
	color: {
		black: [30, 39],
		red: [31, 39],
		green: [32, 39],
		yellow: [33, 39],
		blue: [34, 39],
		magenta: [35, 39],
		cyan: [36, 39],
		white: [37, 39],
		blackBright: [90, 39],
		gray: [90, 39],
		grey: [90, 39],
		redBright: [91, 39],
		greenBright: [92, 39],
		yellowBright: [93, 39],
		blueBright: [94, 39],
		magentaBright: [95, 39],
		cyanBright: [96, 39],
		whiteBright: [97, 39]
	},
	bgColor: {
		bgBlack: [40, 49],
		bgRed: [41, 49],
		bgGreen: [42, 49],
		bgYellow: [43, 49],
		bgBlue: [44, 49],
		bgMagenta: [45, 49],
		bgCyan: [46, 49],
		bgWhite: [47, 49],
		bgBlackBright: [100, 49],
		bgGray: [100, 49],
		bgGrey: [100, 49],
		bgRedBright: [101, 49],
		bgGreenBright: [102, 49],
		bgYellowBright: [103, 49],
		bgBlueBright: [104, 49],
		bgMagentaBright: [105, 49],
		bgCyanBright: [106, 49],
		bgWhiteBright: [107, 49]
	}
};
const modifierNames = Object.keys(styles$1.modifier);
const foregroundColorNames = Object.keys(styles$1.color);
const backgroundColorNames = Object.keys(styles$1.bgColor);
const colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
	const codes = /* @__PURE__ */ new Map();
	for (const [groupName, group] of Object.entries(styles$1)) {
		for (const [styleName, style] of Object.entries(group)) {
			styles$1[styleName] = {
				open: `\u001B[${style[0]}m`,
				close: `\u001B[${style[1]}m`
			};
			group[styleName] = styles$1[styleName];
			codes.set(style[0], style[1]);
		}
		Object.defineProperty(styles$1, groupName, {
			value: group,
			enumerable: false
		});
	}
	Object.defineProperty(styles$1, "codes", {
		value: codes,
		enumerable: false
	});
	styles$1.color.close = "\x1B[39m";
	styles$1.bgColor.close = "\x1B[49m";
	styles$1.color.ansi = wrapAnsi16();
	styles$1.color.ansi256 = wrapAnsi256();
	styles$1.color.ansi16m = wrapAnsi16m();
	styles$1.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
	styles$1.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
	Object.defineProperties(styles$1, {
		rgbToAnsi256: {
			value(red, green, blue) {
				if (red === green && green === blue) {
					if (red < 8) return 16;
					if (red > 248) return 231;
					return Math.round((red - 8) / 247 * 24) + 232;
				}
				return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
			},
			enumerable: false
		},
		hexToRgb: {
			value(hex) {
				const matches = /[a-f\d]{6}|[a-f\d]{3}/i.exec(hex.toString(16));
				if (!matches) return [
					0,
					0,
					0
				];
				let [colorString] = matches;
				if (colorString.length === 3) colorString = [...colorString].map((character) => character + character).join("");
				const integer = Number.parseInt(colorString, 16);
				return [
					integer >> 16 & 255,
					integer >> 8 & 255,
					integer & 255
				];
			},
			enumerable: false
		},
		hexToAnsi256: {
			value: (hex) => styles$1.rgbToAnsi256(...styles$1.hexToRgb(hex)),
			enumerable: false
		},
		ansi256ToAnsi: {
			value(code) {
				if (code < 8) return 30 + code;
				if (code < 16) return 90 + (code - 8);
				let red;
				let green;
				let blue;
				if (code >= 232) {
					red = ((code - 232) * 10 + 8) / 255;
					green = red;
					blue = red;
				} else {
					code -= 16;
					const remainder = code % 36;
					red = Math.floor(code / 36) / 5;
					green = Math.floor(remainder / 6) / 5;
					blue = remainder % 6 / 5;
				}
				const value = Math.max(red, green, blue) * 2;
				if (value === 0) return 30;
				let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
				if (value === 2) result += 60;
				return result;
			},
			enumerable: false
		},
		rgbToAnsi: {
			value: (red, green, blue) => styles$1.ansi256ToAnsi(styles$1.rgbToAnsi256(red, green, blue)),
			enumerable: false
		},
		hexToAnsi: {
			value: (hex) => styles$1.ansi256ToAnsi(styles$1.hexToAnsi256(hex)),
			enumerable: false
		}
	});
	return styles$1;
}
const ansiStyles = assembleStyles();

//#endregion
//#region ../../../../../node_modules/chalk/source/vendor/supports-color/index.js
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : node_process.default.argv) {
	const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
	const position = argv.indexOf(prefix + flag);
	const terminatorPosition = argv.indexOf("--");
	return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
const { env } = node_process.default;
let flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) flagForceColor = 0;
else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) flagForceColor = 1;
function envForceColor() {
	if ("FORCE_COLOR" in env) {
		if (env.FORCE_COLOR === "true") return 1;
		if (env.FORCE_COLOR === "false") return 0;
		return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
	}
}
function translateLevel(level) {
	if (level === 0) return false;
	return {
		level,
		hasBasic: true,
		has256: level >= 2,
		has16m: level >= 3
	};
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
	const noFlagForceColor = envForceColor();
	if (noFlagForceColor !== void 0) flagForceColor = noFlagForceColor;
	const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
	if (forceColor === 0) return 0;
	if (sniffFlags) {
		if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) return 3;
		if (hasFlag("color=256")) return 2;
	}
	if ("TF_BUILD" in env && "AGENT_NAME" in env) return 1;
	if (haveStream && !streamIsTTY && forceColor === void 0) return 0;
	const min = forceColor || 0;
	if (env.TERM === "dumb") return min;
	if (node_process.default.platform === "win32") {
		const osRelease = node_os.default.release().split(".");
		if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) return Number(osRelease[2]) >= 14931 ? 3 : 2;
		return 1;
	}
	if ("CI" in env) {
		if ([
			"GITHUB_ACTIONS",
			"GITEA_ACTIONS",
			"CIRCLECI"
		].some((key) => key in env)) return 3;
		if ([
			"TRAVIS",
			"APPVEYOR",
			"GITLAB_CI",
			"BUILDKITE",
			"DRONE"
		].some((sign) => sign in env) || env.CI_NAME === "codeship") return 1;
		return min;
	}
	if ("TEAMCITY_VERSION" in env) return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
	if (env.COLORTERM === "truecolor") return 3;
	if (env.TERM === "xterm-kitty") return 3;
	if (env.TERM === "xterm-ghostty") return 3;
	if (env.TERM === "wezterm") return 3;
	if ("TERM_PROGRAM" in env) {
		const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
		switch (env.TERM_PROGRAM) {
			case "iTerm.app": return version >= 3 ? 3 : 2;
			case "Apple_Terminal": return 2;
		}
	}
	if (/-256(color)?$/i.test(env.TERM)) return 2;
	if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) return 1;
	if ("COLORTERM" in env) return 1;
	return min;
}
function createSupportsColor(stream, options = {}) {
	return translateLevel(_supportsColor(stream, {
		streamIsTTY: stream && stream.isTTY,
		...options
	}));
}
const supportsColor = {
	stdout: createSupportsColor({ isTTY: node_tty.default.isatty(1) }),
	stderr: createSupportsColor({ isTTY: node_tty.default.isatty(2) })
};

//#endregion
//#region ../../../../../node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, replacer) {
	let index = string.indexOf(substring);
	if (index === -1) return string;
	const substringLength = substring.length;
	let endIndex = 0;
	let returnValue = "";
	do {
		returnValue += string.slice(endIndex, index) + substring + replacer;
		endIndex = index + substringLength;
		index = string.indexOf(substring, endIndex);
	} while (index !== -1);
	returnValue += string.slice(endIndex);
	return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
	let endIndex = 0;
	let returnValue = "";
	do {
		const gotCR = string[index - 1] === "\r";
		returnValue += string.slice(endIndex, gotCR ? index - 1 : index) + prefix + (gotCR ? "\r\n" : "\n") + postfix;
		endIndex = index + 1;
		index = string.indexOf("\n", endIndex);
	} while (index !== -1);
	returnValue += string.slice(endIndex);
	return returnValue;
}

//#endregion
//#region ../../../../../node_modules/chalk/source/index.js
const { stdout: stdoutColor, stderr: stderrColor } = supportsColor;
const GENERATOR = Symbol("GENERATOR");
const STYLER = Symbol("STYLER");
const IS_EMPTY = Symbol("IS_EMPTY");
const levelMapping = [
	"ansi",
	"ansi",
	"ansi256",
	"ansi16m"
];
const styles = Object.create(null);
const applyOptions = (object, options = {}) => {
	if (options.level && !(Number.isInteger(options.level) && options.level >= 0 && options.level <= 3)) throw new Error("The `level` option should be an integer from 0 to 3");
	const colorLevel = stdoutColor ? stdoutColor.level : 0;
	object.level = options.level === void 0 ? colorLevel : options.level;
};
const chalkFactory = (options) => {
	const chalk = (...strings) => strings.join(" ");
	applyOptions(chalk, options);
	Object.setPrototypeOf(chalk, createChalk.prototype);
	return chalk;
};
function createChalk(options) {
	return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansiStyles)) styles[styleName] = { get() {
	const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
	Object.defineProperty(this, styleName, { value: builder });
	return builder;
} };
styles.visible = { get() {
	const builder = createBuilder(this, this[STYLER], true);
	Object.defineProperty(this, "visible", { value: builder });
	return builder;
} };
const getModelAnsi = (model, level, type, ...arguments_) => {
	if (model === "rgb") {
		if (level === "ansi16m") return ansiStyles[type].ansi16m(...arguments_);
		if (level === "ansi256") return ansiStyles[type].ansi256(ansiStyles.rgbToAnsi256(...arguments_));
		return ansiStyles[type].ansi(ansiStyles.rgbToAnsi(...arguments_));
	}
	if (model === "hex") return getModelAnsi("rgb", level, type, ...ansiStyles.hexToRgb(...arguments_));
	return ansiStyles[type][model](...arguments_);
};
for (const model of [
	"rgb",
	"hex",
	"ansi256"
]) {
	styles[model] = { get() {
		const { level } = this;
		return function(...arguments_) {
			const styler = createStyler(getModelAnsi(model, levelMapping[level], "color", ...arguments_), ansiStyles.color.close, this[STYLER]);
			return createBuilder(this, styler, this[IS_EMPTY]);
		};
	} };
	const bgModel = "bg" + model[0].toUpperCase() + model.slice(1);
	styles[bgModel] = { get() {
		const { level } = this;
		return function(...arguments_) {
			const styler = createStyler(getModelAnsi(model, levelMapping[level], "bgColor", ...arguments_), ansiStyles.bgColor.close, this[STYLER]);
			return createBuilder(this, styler, this[IS_EMPTY]);
		};
	} };
}
const proto = Object.defineProperties(() => {}, {
	...styles,
	level: {
		enumerable: true,
		get() {
			return this[GENERATOR].level;
		},
		set(level) {
			this[GENERATOR].level = level;
		}
	}
});
const createStyler = (open, close, parent) => {
	let openAll;
	let closeAll;
	if (parent === void 0) {
		openAll = open;
		closeAll = close;
	} else {
		openAll = parent.openAll + open;
		closeAll = close + parent.closeAll;
	}
	return {
		open,
		close,
		openAll,
		closeAll,
		parent
	};
};
const createBuilder = (self, _styler, _isEmpty) => {
	const builder = (...arguments_) => applyStyle(builder, arguments_.length === 1 ? "" + arguments_[0] : arguments_.join(" "));
	Object.setPrototypeOf(builder, proto);
	builder[GENERATOR] = self;
	builder[STYLER] = _styler;
	builder[IS_EMPTY] = _isEmpty;
	return builder;
};
const applyStyle = (self, string) => {
	if (self.level <= 0 || !string) return self[IS_EMPTY] ? "" : string;
	let styler = self[STYLER];
	if (styler === void 0) return string;
	const { openAll, closeAll } = styler;
	if (string.includes("\x1B")) while (styler !== void 0) {
		string = stringReplaceAll(string, styler.close, styler.open);
		styler = styler.parent;
	}
	const lfIndex = string.indexOf("\n");
	if (lfIndex !== -1) string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
	return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, styles);
const chalk = createChalk();
const chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });

//#endregion
//#region ../../../../../node_modules/mimic-function/index.js
const copyProperty = (to, from, property, ignoreNonConfigurable) => {
	if (property === "length" || property === "prototype") return;
	if (property === "arguments" || property === "caller") return;
	const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
	const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);
	if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) return;
	Object.defineProperty(to, property, fromDescriptor);
};
const canCopyProperty = function(toDescriptor, fromDescriptor) {
	return toDescriptor === void 0 || toDescriptor.configurable || toDescriptor.writable === fromDescriptor.writable && toDescriptor.enumerable === fromDescriptor.enumerable && toDescriptor.configurable === fromDescriptor.configurable && (toDescriptor.writable || toDescriptor.value === fromDescriptor.value);
};
const changePrototype = (to, from) => {
	const fromPrototype = Object.getPrototypeOf(from);
	if (fromPrototype === Object.getPrototypeOf(to)) return;
	Object.setPrototypeOf(to, fromPrototype);
};
const wrappedToString = (withName, fromBody) => `/* Wrapped ${withName}*/\n${fromBody}`;
const toStringDescriptor = Object.getOwnPropertyDescriptor(Function.prototype, "toString");
const toStringName = Object.getOwnPropertyDescriptor(Function.prototype.toString, "name");
const changeToString = (to, from, name) => {
	const withName = name === "" ? "" : `with ${name.trim()}() `;
	const newToString = wrappedToString.bind(null, withName, from.toString());
	Object.defineProperty(newToString, "name", toStringName);
	const { writable, enumerable, configurable } = toStringDescriptor;
	Object.defineProperty(to, "toString", {
		value: newToString,
		writable,
		enumerable,
		configurable
	});
};
function mimicFunction(to, from, { ignoreNonConfigurable = false } = {}) {
	const { name } = to;
	for (const property of Reflect.ownKeys(from)) copyProperty(to, from, property, ignoreNonConfigurable);
	changePrototype(to, from);
	changeToString(to, from, name);
	return to;
}

//#endregion
//#region ../../../../../node_modules/restore-cursor/node_modules/onetime/index.js
const calledFunctions = /* @__PURE__ */ new WeakMap();
const onetime = (function_, options = {}) => {
	if (typeof function_ !== "function") throw new TypeError("Expected a function");
	let returnValue;
	let callCount = 0;
	const functionName = function_.displayName || function_.name || "<anonymous>";
	const onetime = function(...arguments_) {
		calledFunctions.set(onetime, ++callCount);
		if (callCount === 1) {
			returnValue = function_.apply(this, arguments_);
			function_ = void 0;
		} else if (options.throw === true) throw new Error(`Function \`${functionName}\` can only be called once`);
		return returnValue;
	};
	mimicFunction(onetime, function_);
	calledFunctions.set(onetime, callCount);
	return onetime;
};
onetime.callCount = (function_) => {
	if (!calledFunctions.has(function_)) throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
	return calledFunctions.get(function_);
};

//#endregion
//#region ../../../../../node_modules/restore-cursor/node_modules/signal-exit/dist/mjs/signals.js
/**
* This is not the set of all possible signals.
*
* It IS, however, the set of all signals that trigger
* an exit on either Linux or BSD systems.  Linux is a
* superset of the signal names supported on BSD, and
* the unknown signals just fail to register, so we can
* catch that easily enough.
*
* Windows signals are a different set, since there are
* signals that terminate Windows processes, but don't
* terminate (or don't even exist) on Posix systems.
*
* Don't bother with SIGKILL.  It's uncatchable, which
* means that we can't fire any callbacks anyway.
*
* If a user does happen to register a handler on a non-
* fatal signal like SIGWINCH or something, and then
* exit, it'll end up firing `process.emit('exit')`, so
* the handler will be fired anyway.
*
* SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
* artificially, inherently leave the process in a
* state from which it is not safe to try and enter JS
* listeners.
*/
const signals$1 = [];
signals$1.push("SIGHUP", "SIGINT", "SIGTERM");
if (process.platform !== "win32") signals$1.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
if (process.platform === "linux") signals$1.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");

//#endregion
//#region ../../../../../node_modules/restore-cursor/node_modules/signal-exit/dist/mjs/index.js
const processOk$1 = (process) => !!process && typeof process === "object" && typeof process.removeListener === "function" && typeof process.emit === "function" && typeof process.reallyExit === "function" && typeof process.listeners === "function" && typeof process.kill === "function" && typeof process.pid === "number" && typeof process.on === "function";
const kExitEmitter$1 = Symbol.for("signal-exit emitter");
const global$2 = globalThis;
const ObjectDefineProperty$1 = Object.defineProperty.bind(Object);
var Emitter$1 = class {
	emitted = {
		afterExit: false,
		exit: false
	};
	listeners = {
		afterExit: [],
		exit: []
	};
	count = 0;
	id = Math.random();
	constructor() {
		if (global$2[kExitEmitter$1]) return global$2[kExitEmitter$1];
		ObjectDefineProperty$1(global$2, kExitEmitter$1, {
			value: this,
			writable: false,
			enumerable: false,
			configurable: false
		});
	}
	on(ev, fn) {
		this.listeners[ev].push(fn);
	}
	removeListener(ev, fn) {
		const list = this.listeners[ev];
		const i = list.indexOf(fn);
		/* c8 ignore start */
		if (i === -1) return;
		/* c8 ignore stop */
		if (i === 0 && list.length === 1) list.length = 0;
		else list.splice(i, 1);
	}
	emit(ev, code, signal) {
		if (this.emitted[ev]) return false;
		this.emitted[ev] = true;
		let ret = false;
		for (const fn of this.listeners[ev]) ret = fn(code, signal) === true || ret;
		if (ev === "exit") ret = this.emit("afterExit", code, signal) || ret;
		return ret;
	}
};
var SignalExitBase$1 = class {};
const signalExitWrap$1 = (handler) => {
	return {
		onExit(cb, opts) {
			return handler.onExit(cb, opts);
		},
		load() {
			return handler.load();
		},
		unload() {
			return handler.unload();
		}
	};
};
var SignalExitFallback$1 = class extends SignalExitBase$1 {
	onExit() {
		return () => {};
	}
	load() {}
	unload() {}
};
var SignalExit$1 = class extends SignalExitBase$1 {
	/* c8 ignore start */
	#hupSig = process$8.platform === "win32" ? "SIGINT" : "SIGHUP";
	/* c8 ignore stop */
	#emitter = new Emitter$1();
	#process;
	#originalProcessEmit;
	#originalProcessReallyExit;
	#sigListeners = {};
	#loaded = false;
	constructor(process) {
		super();
		this.#process = process;
		this.#sigListeners = {};
		for (const sig of signals$1) this.#sigListeners[sig] = () => {
			const listeners = this.#process.listeners(sig);
			let { count } = this.#emitter;
			/* c8 ignore start */
			const p = process;
			if (typeof p.__signal_exit_emitter__ === "object" && typeof p.__signal_exit_emitter__.count === "number") count += p.__signal_exit_emitter__.count;
			/* c8 ignore stop */
			if (listeners.length === count) {
				this.unload();
				const ret = this.#emitter.emit("exit", null, sig);
				/* c8 ignore start */
				const s = sig === "SIGHUP" ? this.#hupSig : sig;
				if (!ret) process.kill(process.pid, s);
			}
		};
		this.#originalProcessReallyExit = process.reallyExit;
		this.#originalProcessEmit = process.emit;
	}
	onExit(cb, opts) {
		/* c8 ignore start */
		if (!processOk$1(this.#process)) return () => {};
		/* c8 ignore stop */
		if (this.#loaded === false) this.load();
		const ev = opts?.alwaysLast ? "afterExit" : "exit";
		this.#emitter.on(ev, cb);
		return () => {
			this.#emitter.removeListener(ev, cb);
			if (this.#emitter.listeners["exit"].length === 0 && this.#emitter.listeners["afterExit"].length === 0) this.unload();
		};
	}
	load() {
		if (this.#loaded) return;
		this.#loaded = true;
		this.#emitter.count += 1;
		for (const sig of signals$1) try {
			const fn = this.#sigListeners[sig];
			if (fn) this.#process.on(sig, fn);
		} catch (_) {}
		this.#process.emit = (ev, ...a) => {
			return this.#processEmit(ev, ...a);
		};
		this.#process.reallyExit = (code) => {
			return this.#processReallyExit(code);
		};
	}
	unload() {
		if (!this.#loaded) return;
		this.#loaded = false;
		signals$1.forEach((sig) => {
			const listener = this.#sigListeners[sig];
			/* c8 ignore start */
			if (!listener) throw new Error("Listener not defined for signal: " + sig);
			/* c8 ignore stop */
			try {
				this.#process.removeListener(sig, listener);
			} catch (_) {}
			/* c8 ignore stop */
		});
		this.#process.emit = this.#originalProcessEmit;
		this.#process.reallyExit = this.#originalProcessReallyExit;
		this.#emitter.count -= 1;
	}
	#processReallyExit(code) {
		/* c8 ignore start */
		if (!processOk$1(this.#process)) return 0;
		this.#process.exitCode = code || 0;
		/* c8 ignore stop */
		this.#emitter.emit("exit", this.#process.exitCode, null);
		return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
	}
	#processEmit(ev, ...args) {
		const og = this.#originalProcessEmit;
		if (ev === "exit" && processOk$1(this.#process)) {
			if (typeof args[0] === "number") this.#process.exitCode = args[0];
			/* c8 ignore start */
			const ret = og.call(this.#process, ev, ...args);
			/* c8 ignore start */
			this.#emitter.emit("exit", this.#process.exitCode, null);
			/* c8 ignore stop */
			return ret;
		} else return og.call(this.#process, ev, ...args);
	}
};
const process$8 = globalThis.process;
const { onExit: onExit$1, load: load$1, unload: unload$1 } = signalExitWrap$1(processOk$1(process$8) ? new SignalExit$1(process$8) : new SignalExitFallback$1());

//#endregion
//#region ../../../../../node_modules/restore-cursor/index.js
const terminal = node_process.default.stderr.isTTY ? node_process.default.stderr : node_process.default.stdout.isTTY ? node_process.default.stdout : void 0;
const restoreCursor = terminal ? onetime(() => {
	onExit$1(() => {
		terminal.write("\x1B[?25h");
	}, { alwaysLast: true });
}) : () => {};

//#endregion
//#region ../../../../../node_modules/cli-cursor/index.js
let isHidden = false;
const cliCursor = {};
cliCursor.show = (writableStream = node_process.default.stderr) => {
	if (!writableStream.isTTY) return;
	isHidden = false;
	writableStream.write("\x1B[?25h");
};
cliCursor.hide = (writableStream = node_process.default.stderr) => {
	if (!writableStream.isTTY) return;
	restoreCursor();
	isHidden = true;
	writableStream.write("\x1B[?25l");
};
cliCursor.toggle = (force, writableStream) => {
	if (force !== void 0) isHidden = force;
	if (isHidden) cliCursor.show(writableStream);
	else cliCursor.hide(writableStream);
};

//#endregion
//#region ../../../../../node_modules/cli-spinners/spinners.json
var spinners_default = {
	dots: {
		"interval": 80,
		"frames": [
			"⠋",
			"⠙",
			"⠹",
			"⠸",
			"⠼",
			"⠴",
			"⠦",
			"⠧",
			"⠇",
			"⠏"
		]
	},
	dots2: {
		"interval": 80,
		"frames": [
			"⣾",
			"⣽",
			"⣻",
			"⢿",
			"⡿",
			"⣟",
			"⣯",
			"⣷"
		]
	},
	dots3: {
		"interval": 80,
		"frames": [
			"⠋",
			"⠙",
			"⠚",
			"⠞",
			"⠖",
			"⠦",
			"⠴",
			"⠲",
			"⠳",
			"⠓"
		]
	},
	dots4: {
		"interval": 80,
		"frames": [
			"⠄",
			"⠆",
			"⠇",
			"⠋",
			"⠙",
			"⠸",
			"⠰",
			"⠠",
			"⠰",
			"⠸",
			"⠙",
			"⠋",
			"⠇",
			"⠆"
		]
	},
	dots5: {
		"interval": 80,
		"frames": [
			"⠋",
			"⠙",
			"⠚",
			"⠒",
			"⠂",
			"⠂",
			"⠒",
			"⠲",
			"⠴",
			"⠦",
			"⠖",
			"⠒",
			"⠐",
			"⠐",
			"⠒",
			"⠓",
			"⠋"
		]
	},
	dots6: {
		"interval": 80,
		"frames": [
			"⠁",
			"⠉",
			"⠙",
			"⠚",
			"⠒",
			"⠂",
			"⠂",
			"⠒",
			"⠲",
			"⠴",
			"⠤",
			"⠄",
			"⠄",
			"⠤",
			"⠴",
			"⠲",
			"⠒",
			"⠂",
			"⠂",
			"⠒",
			"⠚",
			"⠙",
			"⠉",
			"⠁"
		]
	},
	dots7: {
		"interval": 80,
		"frames": [
			"⠈",
			"⠉",
			"⠋",
			"⠓",
			"⠒",
			"⠐",
			"⠐",
			"⠒",
			"⠖",
			"⠦",
			"⠤",
			"⠠",
			"⠠",
			"⠤",
			"⠦",
			"⠖",
			"⠒",
			"⠐",
			"⠐",
			"⠒",
			"⠓",
			"⠋",
			"⠉",
			"⠈"
		]
	},
	dots8: {
		"interval": 80,
		"frames": [
			"⠁",
			"⠁",
			"⠉",
			"⠙",
			"⠚",
			"⠒",
			"⠂",
			"⠂",
			"⠒",
			"⠲",
			"⠴",
			"⠤",
			"⠄",
			"⠄",
			"⠤",
			"⠠",
			"⠠",
			"⠤",
			"⠦",
			"⠖",
			"⠒",
			"⠐",
			"⠐",
			"⠒",
			"⠓",
			"⠋",
			"⠉",
			"⠈",
			"⠈"
		]
	},
	dots9: {
		"interval": 80,
		"frames": [
			"⢹",
			"⢺",
			"⢼",
			"⣸",
			"⣇",
			"⡧",
			"⡗",
			"⡏"
		]
	},
	dots10: {
		"interval": 80,
		"frames": [
			"⢄",
			"⢂",
			"⢁",
			"⡁",
			"⡈",
			"⡐",
			"⡠"
		]
	},
	dots11: {
		"interval": 100,
		"frames": [
			"⠁",
			"⠂",
			"⠄",
			"⡀",
			"⢀",
			"⠠",
			"⠐",
			"⠈"
		]
	},
	dots12: {
		"interval": 80,
		"frames": [
			"⢀⠀",
			"⡀⠀",
			"⠄⠀",
			"⢂⠀",
			"⡂⠀",
			"⠅⠀",
			"⢃⠀",
			"⡃⠀",
			"⠍⠀",
			"⢋⠀",
			"⡋⠀",
			"⠍⠁",
			"⢋⠁",
			"⡋⠁",
			"⠍⠉",
			"⠋⠉",
			"⠋⠉",
			"⠉⠙",
			"⠉⠙",
			"⠉⠩",
			"⠈⢙",
			"⠈⡙",
			"⢈⠩",
			"⡀⢙",
			"⠄⡙",
			"⢂⠩",
			"⡂⢘",
			"⠅⡘",
			"⢃⠨",
			"⡃⢐",
			"⠍⡐",
			"⢋⠠",
			"⡋⢀",
			"⠍⡁",
			"⢋⠁",
			"⡋⠁",
			"⠍⠉",
			"⠋⠉",
			"⠋⠉",
			"⠉⠙",
			"⠉⠙",
			"⠉⠩",
			"⠈⢙",
			"⠈⡙",
			"⠈⠩",
			"⠀⢙",
			"⠀⡙",
			"⠀⠩",
			"⠀⢘",
			"⠀⡘",
			"⠀⠨",
			"⠀⢐",
			"⠀⡐",
			"⠀⠠",
			"⠀⢀",
			"⠀⡀"
		]
	},
	dots13: {
		"interval": 80,
		"frames": [
			"⣼",
			"⣹",
			"⢻",
			"⠿",
			"⡟",
			"⣏",
			"⣧",
			"⣶"
		]
	},
	dots14: {
		"interval": 80,
		"frames": [
			"⠉⠉",
			"⠈⠙",
			"⠀⠹",
			"⠀⢸",
			"⠀⣰",
			"⢀⣠",
			"⣀⣀",
			"⣄⡀",
			"⣆⠀",
			"⡇⠀",
			"⠏⠀",
			"⠋⠁"
		]
	},
	dots8Bit: {
		"interval": 80,
		"frames": [
			"⠀",
			"⠁",
			"⠂",
			"⠃",
			"⠄",
			"⠅",
			"⠆",
			"⠇",
			"⡀",
			"⡁",
			"⡂",
			"⡃",
			"⡄",
			"⡅",
			"⡆",
			"⡇",
			"⠈",
			"⠉",
			"⠊",
			"⠋",
			"⠌",
			"⠍",
			"⠎",
			"⠏",
			"⡈",
			"⡉",
			"⡊",
			"⡋",
			"⡌",
			"⡍",
			"⡎",
			"⡏",
			"⠐",
			"⠑",
			"⠒",
			"⠓",
			"⠔",
			"⠕",
			"⠖",
			"⠗",
			"⡐",
			"⡑",
			"⡒",
			"⡓",
			"⡔",
			"⡕",
			"⡖",
			"⡗",
			"⠘",
			"⠙",
			"⠚",
			"⠛",
			"⠜",
			"⠝",
			"⠞",
			"⠟",
			"⡘",
			"⡙",
			"⡚",
			"⡛",
			"⡜",
			"⡝",
			"⡞",
			"⡟",
			"⠠",
			"⠡",
			"⠢",
			"⠣",
			"⠤",
			"⠥",
			"⠦",
			"⠧",
			"⡠",
			"⡡",
			"⡢",
			"⡣",
			"⡤",
			"⡥",
			"⡦",
			"⡧",
			"⠨",
			"⠩",
			"⠪",
			"⠫",
			"⠬",
			"⠭",
			"⠮",
			"⠯",
			"⡨",
			"⡩",
			"⡪",
			"⡫",
			"⡬",
			"⡭",
			"⡮",
			"⡯",
			"⠰",
			"⠱",
			"⠲",
			"⠳",
			"⠴",
			"⠵",
			"⠶",
			"⠷",
			"⡰",
			"⡱",
			"⡲",
			"⡳",
			"⡴",
			"⡵",
			"⡶",
			"⡷",
			"⠸",
			"⠹",
			"⠺",
			"⠻",
			"⠼",
			"⠽",
			"⠾",
			"⠿",
			"⡸",
			"⡹",
			"⡺",
			"⡻",
			"⡼",
			"⡽",
			"⡾",
			"⡿",
			"⢀",
			"⢁",
			"⢂",
			"⢃",
			"⢄",
			"⢅",
			"⢆",
			"⢇",
			"⣀",
			"⣁",
			"⣂",
			"⣃",
			"⣄",
			"⣅",
			"⣆",
			"⣇",
			"⢈",
			"⢉",
			"⢊",
			"⢋",
			"⢌",
			"⢍",
			"⢎",
			"⢏",
			"⣈",
			"⣉",
			"⣊",
			"⣋",
			"⣌",
			"⣍",
			"⣎",
			"⣏",
			"⢐",
			"⢑",
			"⢒",
			"⢓",
			"⢔",
			"⢕",
			"⢖",
			"⢗",
			"⣐",
			"⣑",
			"⣒",
			"⣓",
			"⣔",
			"⣕",
			"⣖",
			"⣗",
			"⢘",
			"⢙",
			"⢚",
			"⢛",
			"⢜",
			"⢝",
			"⢞",
			"⢟",
			"⣘",
			"⣙",
			"⣚",
			"⣛",
			"⣜",
			"⣝",
			"⣞",
			"⣟",
			"⢠",
			"⢡",
			"⢢",
			"⢣",
			"⢤",
			"⢥",
			"⢦",
			"⢧",
			"⣠",
			"⣡",
			"⣢",
			"⣣",
			"⣤",
			"⣥",
			"⣦",
			"⣧",
			"⢨",
			"⢩",
			"⢪",
			"⢫",
			"⢬",
			"⢭",
			"⢮",
			"⢯",
			"⣨",
			"⣩",
			"⣪",
			"⣫",
			"⣬",
			"⣭",
			"⣮",
			"⣯",
			"⢰",
			"⢱",
			"⢲",
			"⢳",
			"⢴",
			"⢵",
			"⢶",
			"⢷",
			"⣰",
			"⣱",
			"⣲",
			"⣳",
			"⣴",
			"⣵",
			"⣶",
			"⣷",
			"⢸",
			"⢹",
			"⢺",
			"⢻",
			"⢼",
			"⢽",
			"⢾",
			"⢿",
			"⣸",
			"⣹",
			"⣺",
			"⣻",
			"⣼",
			"⣽",
			"⣾",
			"⣿"
		]
	},
	dotsCircle: {
		"interval": 80,
		"frames": [
			"⢎ ",
			"⠎⠁",
			"⠊⠑",
			"⠈⠱",
			" ⡱",
			"⢀⡰",
			"⢄⡠",
			"⢆⡀"
		]
	},
	sand: {
		"interval": 80,
		"frames": [
			"⠁",
			"⠂",
			"⠄",
			"⡀",
			"⡈",
			"⡐",
			"⡠",
			"⣀",
			"⣁",
			"⣂",
			"⣄",
			"⣌",
			"⣔",
			"⣤",
			"⣥",
			"⣦",
			"⣮",
			"⣶",
			"⣷",
			"⣿",
			"⡿",
			"⠿",
			"⢟",
			"⠟",
			"⡛",
			"⠛",
			"⠫",
			"⢋",
			"⠋",
			"⠍",
			"⡉",
			"⠉",
			"⠑",
			"⠡",
			"⢁"
		]
	},
	line: {
		"interval": 130,
		"frames": [
			"-",
			"\\",
			"|",
			"/"
		]
	},
	line2: {
		"interval": 100,
		"frames": [
			"⠂",
			"-",
			"–",
			"—",
			"–",
			"-"
		]
	},
	rollingLine: {
		"interval": 80,
		"frames": [
			"/  ",
			" - ",
			" \\ ",
			"  |",
			"  |",
			" \\ ",
			" - ",
			"/  "
		]
	},
	pipe: {
		"interval": 100,
		"frames": [
			"┤",
			"┘",
			"┴",
			"└",
			"├",
			"┌",
			"┬",
			"┐"
		]
	},
	simpleDots: {
		"interval": 400,
		"frames": [
			".  ",
			".. ",
			"...",
			"   "
		]
	},
	simpleDotsScrolling: {
		"interval": 200,
		"frames": [
			".  ",
			".. ",
			"...",
			" ..",
			"  .",
			"   "
		]
	},
	star: {
		"interval": 70,
		"frames": [
			"✶",
			"✸",
			"✹",
			"✺",
			"✹",
			"✷"
		]
	},
	star2: {
		"interval": 80,
		"frames": [
			"+",
			"x",
			"*"
		]
	},
	flip: {
		"interval": 70,
		"frames": [
			"_",
			"_",
			"_",
			"-",
			"`",
			"`",
			"'",
			"´",
			"-",
			"_",
			"_",
			"_"
		]
	},
	hamburger: {
		"interval": 100,
		"frames": [
			"☱",
			"☲",
			"☴"
		]
	},
	growVertical: {
		"interval": 120,
		"frames": [
			"▁",
			"▃",
			"▄",
			"▅",
			"▆",
			"▇",
			"▆",
			"▅",
			"▄",
			"▃"
		]
	},
	growHorizontal: {
		"interval": 120,
		"frames": [
			"▏",
			"▎",
			"▍",
			"▌",
			"▋",
			"▊",
			"▉",
			"▊",
			"▋",
			"▌",
			"▍",
			"▎"
		]
	},
	balloon: {
		"interval": 140,
		"frames": [
			" ",
			".",
			"o",
			"O",
			"@",
			"*",
			" "
		]
	},
	balloon2: {
		"interval": 120,
		"frames": [
			".",
			"o",
			"O",
			"°",
			"O",
			"o",
			"."
		]
	},
	noise: {
		"interval": 100,
		"frames": [
			"▓",
			"▒",
			"░"
		]
	},
	bounce: {
		"interval": 120,
		"frames": [
			"⠁",
			"⠂",
			"⠄",
			"⠂"
		]
	},
	boxBounce: {
		"interval": 120,
		"frames": [
			"▖",
			"▘",
			"▝",
			"▗"
		]
	},
	boxBounce2: {
		"interval": 100,
		"frames": [
			"▌",
			"▀",
			"▐",
			"▄"
		]
	},
	triangle: {
		"interval": 50,
		"frames": [
			"◢",
			"◣",
			"◤",
			"◥"
		]
	},
	binary: {
		"interval": 80,
		"frames": [
			"010010",
			"001100",
			"100101",
			"111010",
			"111101",
			"010111",
			"101011",
			"111000",
			"110011",
			"110101"
		]
	},
	arc: {
		"interval": 100,
		"frames": [
			"◜",
			"◠",
			"◝",
			"◞",
			"◡",
			"◟"
		]
	},
	circle: {
		"interval": 120,
		"frames": [
			"◡",
			"⊙",
			"◠"
		]
	},
	squareCorners: {
		"interval": 180,
		"frames": [
			"◰",
			"◳",
			"◲",
			"◱"
		]
	},
	circleQuarters: {
		"interval": 120,
		"frames": [
			"◴",
			"◷",
			"◶",
			"◵"
		]
	},
	circleHalves: {
		"interval": 50,
		"frames": [
			"◐",
			"◓",
			"◑",
			"◒"
		]
	},
	squish: {
		"interval": 100,
		"frames": ["╫", "╪"]
	},
	toggle: {
		"interval": 250,
		"frames": ["⊶", "⊷"]
	},
	toggle2: {
		"interval": 80,
		"frames": ["▫", "▪"]
	},
	toggle3: {
		"interval": 120,
		"frames": ["□", "■"]
	},
	toggle4: {
		"interval": 100,
		"frames": [
			"■",
			"□",
			"▪",
			"▫"
		]
	},
	toggle5: {
		"interval": 100,
		"frames": ["▮", "▯"]
	},
	toggle6: {
		"interval": 300,
		"frames": ["ဝ", "၀"]
	},
	toggle7: {
		"interval": 80,
		"frames": ["⦾", "⦿"]
	},
	toggle8: {
		"interval": 100,
		"frames": ["◍", "◌"]
	},
	toggle9: {
		"interval": 100,
		"frames": ["◉", "◎"]
	},
	toggle10: {
		"interval": 100,
		"frames": [
			"㊂",
			"㊀",
			"㊁"
		]
	},
	toggle11: {
		"interval": 50,
		"frames": ["⧇", "⧆"]
	},
	toggle12: {
		"interval": 120,
		"frames": ["☗", "☖"]
	},
	toggle13: {
		"interval": 80,
		"frames": [
			"=",
			"*",
			"-"
		]
	},
	arrow: {
		"interval": 100,
		"frames": [
			"←",
			"↖",
			"↑",
			"↗",
			"→",
			"↘",
			"↓",
			"↙"
		]
	},
	arrow2: {
		"interval": 80,
		"frames": [
			"⬆️ ",
			"↗️ ",
			"➡️ ",
			"↘️ ",
			"⬇️ ",
			"↙️ ",
			"⬅️ ",
			"↖️ "
		]
	},
	arrow3: {
		"interval": 120,
		"frames": [
			"▹▹▹▹▹",
			"▸▹▹▹▹",
			"▹▸▹▹▹",
			"▹▹▸▹▹",
			"▹▹▹▸▹",
			"▹▹▹▹▸"
		]
	},
	bouncingBar: {
		"interval": 80,
		"frames": [
			"[    ]",
			"[=   ]",
			"[==  ]",
			"[=== ]",
			"[====]",
			"[ ===]",
			"[  ==]",
			"[   =]",
			"[    ]",
			"[   =]",
			"[  ==]",
			"[ ===]",
			"[====]",
			"[=== ]",
			"[==  ]",
			"[=   ]"
		]
	},
	bouncingBall: {
		"interval": 80,
		"frames": [
			"( ●    )",
			"(  ●   )",
			"(   ●  )",
			"(    ● )",
			"(     ●)",
			"(    ● )",
			"(   ●  )",
			"(  ●   )",
			"( ●    )",
			"(●     )"
		]
	},
	smiley: {
		"interval": 200,
		"frames": ["😄 ", "😝 "]
	},
	monkey: {
		"interval": 300,
		"frames": [
			"🙈 ",
			"🙈 ",
			"🙉 ",
			"🙊 "
		]
	},
	hearts: {
		"interval": 100,
		"frames": [
			"💛 ",
			"💙 ",
			"💜 ",
			"💚 ",
			"💗 "
		]
	},
	clock: {
		"interval": 100,
		"frames": [
			"🕛 ",
			"🕐 ",
			"🕑 ",
			"🕒 ",
			"🕓 ",
			"🕔 ",
			"🕕 ",
			"🕖 ",
			"🕗 ",
			"🕘 ",
			"🕙 ",
			"🕚 "
		]
	},
	earth: {
		"interval": 180,
		"frames": [
			"🌍 ",
			"🌎 ",
			"🌏 "
		]
	},
	material: {
		"interval": 17,
		"frames": [
			"█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"███▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"████▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"██████▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"███████▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"████████▁▁▁▁▁▁▁▁▁▁▁▁",
			"█████████▁▁▁▁▁▁▁▁▁▁▁",
			"█████████▁▁▁▁▁▁▁▁▁▁▁",
			"██████████▁▁▁▁▁▁▁▁▁▁",
			"███████████▁▁▁▁▁▁▁▁▁",
			"█████████████▁▁▁▁▁▁▁",
			"██████████████▁▁▁▁▁▁",
			"██████████████▁▁▁▁▁▁",
			"▁██████████████▁▁▁▁▁",
			"▁██████████████▁▁▁▁▁",
			"▁██████████████▁▁▁▁▁",
			"▁▁██████████████▁▁▁▁",
			"▁▁▁██████████████▁▁▁",
			"▁▁▁▁█████████████▁▁▁",
			"▁▁▁▁██████████████▁▁",
			"▁▁▁▁██████████████▁▁",
			"▁▁▁▁▁██████████████▁",
			"▁▁▁▁▁██████████████▁",
			"▁▁▁▁▁██████████████▁",
			"▁▁▁▁▁▁██████████████",
			"▁▁▁▁▁▁██████████████",
			"▁▁▁▁▁▁▁█████████████",
			"▁▁▁▁▁▁▁█████████████",
			"▁▁▁▁▁▁▁▁████████████",
			"▁▁▁▁▁▁▁▁████████████",
			"▁▁▁▁▁▁▁▁▁███████████",
			"▁▁▁▁▁▁▁▁▁███████████",
			"▁▁▁▁▁▁▁▁▁▁██████████",
			"▁▁▁▁▁▁▁▁▁▁██████████",
			"▁▁▁▁▁▁▁▁▁▁▁▁████████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁██████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
			"█▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
			"██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
			"██▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
			"███▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
			"████▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
			"█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
			"█████▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
			"██████▁▁▁▁▁▁▁▁▁▁▁▁▁█",
			"████████▁▁▁▁▁▁▁▁▁▁▁▁",
			"█████████▁▁▁▁▁▁▁▁▁▁▁",
			"█████████▁▁▁▁▁▁▁▁▁▁▁",
			"█████████▁▁▁▁▁▁▁▁▁▁▁",
			"█████████▁▁▁▁▁▁▁▁▁▁▁",
			"███████████▁▁▁▁▁▁▁▁▁",
			"████████████▁▁▁▁▁▁▁▁",
			"████████████▁▁▁▁▁▁▁▁",
			"██████████████▁▁▁▁▁▁",
			"██████████████▁▁▁▁▁▁",
			"▁██████████████▁▁▁▁▁",
			"▁██████████████▁▁▁▁▁",
			"▁▁▁█████████████▁▁▁▁",
			"▁▁▁▁▁████████████▁▁▁",
			"▁▁▁▁▁████████████▁▁▁",
			"▁▁▁▁▁▁███████████▁▁▁",
			"▁▁▁▁▁▁▁▁█████████▁▁▁",
			"▁▁▁▁▁▁▁▁█████████▁▁▁",
			"▁▁▁▁▁▁▁▁▁█████████▁▁",
			"▁▁▁▁▁▁▁▁▁█████████▁▁",
			"▁▁▁▁▁▁▁▁▁▁█████████▁",
			"▁▁▁▁▁▁▁▁▁▁▁████████▁",
			"▁▁▁▁▁▁▁▁▁▁▁████████▁",
			"▁▁▁▁▁▁▁▁▁▁▁▁███████▁",
			"▁▁▁▁▁▁▁▁▁▁▁▁███████▁",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁███████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁████",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁███",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁██",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁█",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁",
			"▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁"
		]
	},
	moon: {
		"interval": 80,
		"frames": [
			"🌑 ",
			"🌒 ",
			"🌓 ",
			"🌔 ",
			"🌕 ",
			"🌖 ",
			"🌗 ",
			"🌘 "
		]
	},
	runner: {
		"interval": 140,
		"frames": ["🚶 ", "🏃 "]
	},
	pong: {
		"interval": 80,
		"frames": [
			"▐⠂       ▌",
			"▐⠈       ▌",
			"▐ ⠂      ▌",
			"▐ ⠠      ▌",
			"▐  ⡀     ▌",
			"▐  ⠠     ▌",
			"▐   ⠂    ▌",
			"▐   ⠈    ▌",
			"▐    ⠂   ▌",
			"▐    ⠠   ▌",
			"▐     ⡀  ▌",
			"▐     ⠠  ▌",
			"▐      ⠂ ▌",
			"▐      ⠈ ▌",
			"▐       ⠂▌",
			"▐       ⠠▌",
			"▐       ⡀▌",
			"▐      ⠠ ▌",
			"▐      ⠂ ▌",
			"▐     ⠈  ▌",
			"▐     ⠂  ▌",
			"▐    ⠠   ▌",
			"▐    ⡀   ▌",
			"▐   ⠠    ▌",
			"▐   ⠂    ▌",
			"▐  ⠈     ▌",
			"▐  ⠂     ▌",
			"▐ ⠠      ▌",
			"▐ ⡀      ▌",
			"▐⠠       ▌"
		]
	},
	shark: {
		"interval": 120,
		"frames": [
			"▐|\\____________▌",
			"▐_|\\___________▌",
			"▐__|\\__________▌",
			"▐___|\\_________▌",
			"▐____|\\________▌",
			"▐_____|\\_______▌",
			"▐______|\\______▌",
			"▐_______|\\_____▌",
			"▐________|\\____▌",
			"▐_________|\\___▌",
			"▐__________|\\__▌",
			"▐___________|\\_▌",
			"▐____________|\\▌",
			"▐____________/|▌",
			"▐___________/|_▌",
			"▐__________/|__▌",
			"▐_________/|___▌",
			"▐________/|____▌",
			"▐_______/|_____▌",
			"▐______/|______▌",
			"▐_____/|_______▌",
			"▐____/|________▌",
			"▐___/|_________▌",
			"▐__/|__________▌",
			"▐_/|___________▌",
			"▐/|____________▌"
		]
	},
	dqpb: {
		"interval": 100,
		"frames": [
			"d",
			"q",
			"p",
			"b"
		]
	},
	weather: {
		"interval": 100,
		"frames": [
			"☀️ ",
			"☀️ ",
			"☀️ ",
			"🌤 ",
			"⛅️ ",
			"🌥 ",
			"☁️ ",
			"🌧 ",
			"🌨 ",
			"🌧 ",
			"🌨 ",
			"🌧 ",
			"🌨 ",
			"⛈ ",
			"🌨 ",
			"🌧 ",
			"🌨 ",
			"☁️ ",
			"🌥 ",
			"⛅️ ",
			"🌤 ",
			"☀️ ",
			"☀️ "
		]
	},
	christmas: {
		"interval": 400,
		"frames": ["🌲", "🎄"]
	},
	grenade: {
		"interval": 80,
		"frames": [
			"،  ",
			"′  ",
			" ´ ",
			" ‾ ",
			"  ⸌",
			"  ⸊",
			"  |",
			"  ⁎",
			"  ⁕",
			" ෴ ",
			"  ⁓",
			"   ",
			"   ",
			"   "
		]
	},
	point: {
		"interval": 125,
		"frames": [
			"∙∙∙",
			"●∙∙",
			"∙●∙",
			"∙∙●",
			"∙∙∙"
		]
	},
	layer: {
		"interval": 150,
		"frames": [
			"-",
			"=",
			"≡"
		]
	},
	betaWave: {
		"interval": 80,
		"frames": [
			"ρββββββ",
			"βρβββββ",
			"ββρββββ",
			"βββρβββ",
			"ββββρββ",
			"βββββρβ",
			"ββββββρ"
		]
	},
	fingerDance: {
		"interval": 160,
		"frames": [
			"🤘 ",
			"🤟 ",
			"🖖 ",
			"✋ ",
			"🤚 ",
			"👆 "
		]
	},
	fistBump: {
		"interval": 80,
		"frames": [
			"🤜　　　　🤛 ",
			"🤜　　　　🤛 ",
			"🤜　　　　🤛 ",
			"　🤜　　🤛　 ",
			"　　🤜🤛　　 ",
			"　🤜✨🤛　　 ",
			"🤜　✨　🤛　 "
		]
	},
	soccerHeader: {
		"interval": 80,
		"frames": [
			" 🧑⚽️       🧑 ",
			"🧑  ⚽️      🧑 ",
			"🧑   ⚽️     🧑 ",
			"🧑    ⚽️    🧑 ",
			"🧑     ⚽️   🧑 ",
			"🧑      ⚽️  🧑 ",
			"🧑       ⚽️🧑  ",
			"🧑      ⚽️  🧑 ",
			"🧑     ⚽️   🧑 ",
			"🧑    ⚽️    🧑 ",
			"🧑   ⚽️     🧑 ",
			"🧑  ⚽️      🧑 "
		]
	},
	mindblown: {
		"interval": 160,
		"frames": [
			"😐 ",
			"😐 ",
			"😮 ",
			"😮 ",
			"😦 ",
			"😦 ",
			"😧 ",
			"😧 ",
			"🤯 ",
			"💥 ",
			"✨ ",
			"　 ",
			"　 ",
			"　 "
		]
	},
	speaker: {
		"interval": 160,
		"frames": [
			"🔈 ",
			"🔉 ",
			"🔊 ",
			"🔉 "
		]
	},
	orangePulse: {
		"interval": 100,
		"frames": [
			"🔸 ",
			"🔶 ",
			"🟠 ",
			"🟠 ",
			"🔶 "
		]
	},
	bluePulse: {
		"interval": 100,
		"frames": [
			"🔹 ",
			"🔷 ",
			"🔵 ",
			"🔵 ",
			"🔷 "
		]
	},
	orangeBluePulse: {
		"interval": 100,
		"frames": [
			"🔸 ",
			"🔶 ",
			"🟠 ",
			"🟠 ",
			"🔶 ",
			"🔹 ",
			"🔷 ",
			"🔵 ",
			"🔵 ",
			"🔷 "
		]
	},
	timeTravel: {
		"interval": 100,
		"frames": [
			"🕛 ",
			"🕚 ",
			"🕙 ",
			"🕘 ",
			"🕗 ",
			"🕖 ",
			"🕕 ",
			"🕔 ",
			"🕓 ",
			"🕒 ",
			"🕑 ",
			"🕐 "
		]
	},
	aesthetic: {
		"interval": 80,
		"frames": [
			"▰▱▱▱▱▱▱",
			"▰▰▱▱▱▱▱",
			"▰▰▰▱▱▱▱",
			"▰▰▰▰▱▱▱",
			"▰▰▰▰▰▱▱",
			"▰▰▰▰▰▰▱",
			"▰▰▰▰▰▰▰",
			"▰▱▱▱▱▱▱"
		]
	},
	dwarfFortress: {
		"interval": 80,
		"frames": [
			" ██████£££  ",
			"☺██████£££  ",
			"☺██████£££  ",
			"☺▓█████£££  ",
			"☺▓█████£££  ",
			"☺▒█████£££  ",
			"☺▒█████£££  ",
			"☺░█████£££  ",
			"☺░█████£££  ",
			"☺ █████£££  ",
			" ☺█████£££  ",
			" ☺█████£££  ",
			" ☺▓████£££  ",
			" ☺▓████£££  ",
			" ☺▒████£££  ",
			" ☺▒████£££  ",
			" ☺░████£££  ",
			" ☺░████£££  ",
			" ☺ ████£££  ",
			"  ☺████£££  ",
			"  ☺████£££  ",
			"  ☺▓███£££  ",
			"  ☺▓███£££  ",
			"  ☺▒███£££  ",
			"  ☺▒███£££  ",
			"  ☺░███£££  ",
			"  ☺░███£££  ",
			"  ☺ ███£££  ",
			"   ☺███£££  ",
			"   ☺███£££  ",
			"   ☺▓██£££  ",
			"   ☺▓██£££  ",
			"   ☺▒██£££  ",
			"   ☺▒██£££  ",
			"   ☺░██£££  ",
			"   ☺░██£££  ",
			"   ☺ ██£££  ",
			"    ☺██£££  ",
			"    ☺██£££  ",
			"    ☺▓█£££  ",
			"    ☺▓█£££  ",
			"    ☺▒█£££  ",
			"    ☺▒█£££  ",
			"    ☺░█£££  ",
			"    ☺░█£££  ",
			"    ☺ █£££  ",
			"     ☺█£££  ",
			"     ☺█£££  ",
			"     ☺▓£££  ",
			"     ☺▓£££  ",
			"     ☺▒£££  ",
			"     ☺▒£££  ",
			"     ☺░£££  ",
			"     ☺░£££  ",
			"     ☺ £££  ",
			"      ☺£££  ",
			"      ☺£££  ",
			"      ☺▓££  ",
			"      ☺▓££  ",
			"      ☺▒££  ",
			"      ☺▒££  ",
			"      ☺░££  ",
			"      ☺░££  ",
			"      ☺ ££  ",
			"       ☺££  ",
			"       ☺££  ",
			"       ☺▓£  ",
			"       ☺▓£  ",
			"       ☺▒£  ",
			"       ☺▒£  ",
			"       ☺░£  ",
			"       ☺░£  ",
			"       ☺ £  ",
			"        ☺£  ",
			"        ☺£  ",
			"        ☺▓  ",
			"        ☺▓  ",
			"        ☺▒  ",
			"        ☺▒  ",
			"        ☺░  ",
			"        ☺░  ",
			"        ☺   ",
			"        ☺  &",
			"        ☺ ☼&",
			"       ☺ ☼ &",
			"       ☺☼  &",
			"      ☺☼  & ",
			"      ‼   & ",
			"     ☺   &  ",
			"    ‼    &  ",
			"   ☺    &   ",
			"  ‼     &   ",
			" ☺     &    ",
			"‼      &    ",
			"      &     ",
			"      &     ",
			"     &   ░  ",
			"     &   ▒  ",
			"    &    ▓  ",
			"    &    £  ",
			"   &    ░£  ",
			"   &    ▒£  ",
			"  &     ▓£  ",
			"  &     ££  ",
			" &     ░££  ",
			" &     ▒££  ",
			"&      ▓££  ",
			"&      £££  ",
			"      ░£££  ",
			"      ▒£££  ",
			"      ▓£££  ",
			"      █£££  ",
			"     ░█£££  ",
			"     ▒█£££  ",
			"     ▓█£££  ",
			"     ██£££  ",
			"    ░██£££  ",
			"    ▒██£££  ",
			"    ▓██£££  ",
			"    ███£££  ",
			"   ░███£££  ",
			"   ▒███£££  ",
			"   ▓███£££  ",
			"   ████£££  ",
			"  ░████£££  ",
			"  ▒████£££  ",
			"  ▓████£££  ",
			"  █████£££  ",
			" ░█████£££  ",
			" ▒█████£££  ",
			" ▓█████£££  ",
			" ██████£££  ",
			" ██████£££  "
		]
	},
	fish: {
		"interval": 80,
		"frames": [
			"~~~~~~~~~~~~~~~~~~~~",
			"> ~~~~~~~~~~~~~~~~~~",
			"º> ~~~~~~~~~~~~~~~~~",
			"(º> ~~~~~~~~~~~~~~~~",
			"((º> ~~~~~~~~~~~~~~~",
			"<((º> ~~~~~~~~~~~~~~",
			"><((º> ~~~~~~~~~~~~~",
			" ><((º> ~~~~~~~~~~~~",
			"~ ><((º> ~~~~~~~~~~~",
			"~~ <>((º> ~~~~~~~~~~",
			"~~~ ><((º> ~~~~~~~~~",
			"~~~~ <>((º> ~~~~~~~~",
			"~~~~~ ><((º> ~~~~~~~",
			"~~~~~~ <>((º> ~~~~~~",
			"~~~~~~~ ><((º> ~~~~~",
			"~~~~~~~~ <>((º> ~~~~",
			"~~~~~~~~~ ><((º> ~~~",
			"~~~~~~~~~~ <>((º> ~~",
			"~~~~~~~~~~~ ><((º> ~",
			"~~~~~~~~~~~~ <>((º> ",
			"~~~~~~~~~~~~~ ><((º>",
			"~~~~~~~~~~~~~~ <>((º",
			"~~~~~~~~~~~~~~~ ><((",
			"~~~~~~~~~~~~~~~~ <>(",
			"~~~~~~~~~~~~~~~~~ ><",
			"~~~~~~~~~~~~~~~~~~ <",
			"~~~~~~~~~~~~~~~~~~~~"
		]
	}
};

//#endregion
//#region ../../../../../node_modules/cli-spinners/index.js
var cli_spinners_default = spinners_default;
const spinnersList = Object.keys(spinners_default);

//#endregion
//#region ../../../../../node_modules/yoctocolors/base.js
const hasColors = node_tty.default?.WriteStream?.prototype?.hasColors?.() ?? false;
const format = (open, close) => {
	if (!hasColors) return (input) => input;
	const openCode = `\u001B[${open}m`;
	const closeCode = `\u001B[${close}m`;
	return (input) => {
		const string = input + "";
		let index = string.indexOf(closeCode);
		if (index === -1) return openCode + string + closeCode;
		let result = openCode;
		let lastIndex = 0;
		const replaceCode = (close === 22 ? closeCode : "") + openCode;
		while (index !== -1) {
			result += string.slice(lastIndex, index) + replaceCode;
			lastIndex = index + closeCode.length;
			index = string.indexOf(closeCode, lastIndex);
		}
		result += string.slice(lastIndex) + closeCode;
		return result;
	};
};
const reset = format(0, 0);
const bold = format(1, 22);
const dim = format(2, 22);
const italic = format(3, 23);
const underline = format(4, 24);
const overline = format(53, 55);
const inverse = format(7, 27);
const hidden = format(8, 28);
const strikethrough = format(9, 29);
const black = format(30, 39);
const red = format(31, 39);
const green = format(32, 39);
const yellow = format(33, 39);
const blue = format(34, 39);
const magenta = format(35, 39);
const cyan = format(36, 39);
const white = format(37, 39);
const gray = format(90, 39);
const bgBlack = format(40, 49);
const bgRed = format(41, 49);
const bgGreen = format(42, 49);
const bgYellow = format(43, 49);
const bgBlue = format(44, 49);
const bgMagenta = format(45, 49);
const bgCyan = format(46, 49);
const bgWhite = format(47, 49);
const bgGray = format(100, 49);
const redBright = format(91, 39);
const greenBright = format(92, 39);
const yellowBright = format(93, 39);
const blueBright = format(94, 39);
const magentaBright = format(95, 39);
const cyanBright = format(96, 39);
const whiteBright = format(97, 39);
const bgRedBright = format(101, 49);
const bgGreenBright = format(102, 49);
const bgYellowBright = format(103, 49);
const bgBlueBright = format(104, 49);
const bgMagentaBright = format(105, 49);
const bgCyanBright = format(106, 49);
const bgWhiteBright = format(107, 49);

//#endregion
//#region ../../../../../node_modules/is-unicode-supported/index.js
function isUnicodeSupported$1() {
	const { env } = node_process.default;
	const { TERM, TERM_PROGRAM } = env;
	if (node_process.default.platform !== "win32") return TERM !== "linux";
	return Boolean(env.WT_SESSION) || Boolean(env.TERMINUS_SUBLIME) || env.ConEmuTask === "{cmd::Cmder}" || TERM_PROGRAM === "Terminus-Sublime" || TERM_PROGRAM === "vscode" || TERM === "xterm-256color" || TERM === "alacritty" || TERM === "rxvt-unicode" || TERM === "rxvt-unicode-256color" || env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}

//#endregion
//#region ../../../../../node_modules/log-symbols/symbols.js
const _isUnicodeSupported = isUnicodeSupported$1();
const info = blue(_isUnicodeSupported ? "ℹ" : "i");
const success = green(_isUnicodeSupported ? "✔" : "√");
const warning = yellow(_isUnicodeSupported ? "⚠" : "‼");
const error = red(_isUnicodeSupported ? "✖" : "×");

//#endregion
//#region ../../../../../node_modules/ansi-regex/index.js
function ansiRegex({ onlyFirst = false } = {}) {
	return new RegExp(`(?:\\u001B\\][\\s\\S]*?(?:\\u0007|\\u001B\\u005C|\\u009C))|[\\u001B\\u009B][[\\]()#;?]*(?:\\d{1,4}(?:[;:]\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]`, onlyFirst ? void 0 : "g");
}

//#endregion
//#region ../../../../../node_modules/ora/node_modules/strip-ansi/index.js
const regex = ansiRegex();
function stripAnsi(string) {
	if (typeof string !== "string") throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
	return string.replace(regex, "");
}

//#endregion
//#region ../../../../../node_modules/get-east-asian-width/lookup-data.js
const ambiguousRanges = [
	161,
	161,
	164,
	164,
	167,
	168,
	170,
	170,
	173,
	174,
	176,
	180,
	182,
	186,
	188,
	191,
	198,
	198,
	208,
	208,
	215,
	216,
	222,
	225,
	230,
	230,
	232,
	234,
	236,
	237,
	240,
	240,
	242,
	243,
	247,
	250,
	252,
	252,
	254,
	254,
	257,
	257,
	273,
	273,
	275,
	275,
	283,
	283,
	294,
	295,
	299,
	299,
	305,
	307,
	312,
	312,
	319,
	322,
	324,
	324,
	328,
	331,
	333,
	333,
	338,
	339,
	358,
	359,
	363,
	363,
	462,
	462,
	464,
	464,
	466,
	466,
	468,
	468,
	470,
	470,
	472,
	472,
	474,
	474,
	476,
	476,
	593,
	593,
	609,
	609,
	708,
	708,
	711,
	711,
	713,
	715,
	717,
	717,
	720,
	720,
	728,
	731,
	733,
	733,
	735,
	735,
	768,
	879,
	913,
	929,
	931,
	937,
	945,
	961,
	963,
	969,
	1025,
	1025,
	1040,
	1103,
	1105,
	1105,
	8208,
	8208,
	8211,
	8214,
	8216,
	8217,
	8220,
	8221,
	8224,
	8226,
	8228,
	8231,
	8240,
	8240,
	8242,
	8243,
	8245,
	8245,
	8251,
	8251,
	8254,
	8254,
	8308,
	8308,
	8319,
	8319,
	8321,
	8324,
	8364,
	8364,
	8451,
	8451,
	8453,
	8453,
	8457,
	8457,
	8467,
	8467,
	8470,
	8470,
	8481,
	8482,
	8486,
	8486,
	8491,
	8491,
	8531,
	8532,
	8539,
	8542,
	8544,
	8555,
	8560,
	8569,
	8585,
	8585,
	8592,
	8601,
	8632,
	8633,
	8658,
	8658,
	8660,
	8660,
	8679,
	8679,
	8704,
	8704,
	8706,
	8707,
	8711,
	8712,
	8715,
	8715,
	8719,
	8719,
	8721,
	8721,
	8725,
	8725,
	8730,
	8730,
	8733,
	8736,
	8739,
	8739,
	8741,
	8741,
	8743,
	8748,
	8750,
	8750,
	8756,
	8759,
	8764,
	8765,
	8776,
	8776,
	8780,
	8780,
	8786,
	8786,
	8800,
	8801,
	8804,
	8807,
	8810,
	8811,
	8814,
	8815,
	8834,
	8835,
	8838,
	8839,
	8853,
	8853,
	8857,
	8857,
	8869,
	8869,
	8895,
	8895,
	8978,
	8978,
	9312,
	9449,
	9451,
	9547,
	9552,
	9587,
	9600,
	9615,
	9618,
	9621,
	9632,
	9633,
	9635,
	9641,
	9650,
	9651,
	9654,
	9655,
	9660,
	9661,
	9664,
	9665,
	9670,
	9672,
	9675,
	9675,
	9678,
	9681,
	9698,
	9701,
	9711,
	9711,
	9733,
	9734,
	9737,
	9737,
	9742,
	9743,
	9756,
	9756,
	9758,
	9758,
	9792,
	9792,
	9794,
	9794,
	9824,
	9825,
	9827,
	9829,
	9831,
	9834,
	9836,
	9837,
	9839,
	9839,
	9886,
	9887,
	9919,
	9919,
	9926,
	9933,
	9935,
	9939,
	9941,
	9953,
	9955,
	9955,
	9960,
	9961,
	9963,
	9969,
	9972,
	9972,
	9974,
	9977,
	9979,
	9980,
	9982,
	9983,
	10045,
	10045,
	10102,
	10111,
	11094,
	11097,
	12872,
	12879,
	57344,
	63743,
	65024,
	65039,
	65533,
	65533,
	127232,
	127242,
	127248,
	127277,
	127280,
	127337,
	127344,
	127373,
	127375,
	127376,
	127387,
	127404,
	917760,
	917999,
	983040,
	1048573,
	1048576,
	1114109
];
const fullwidthRanges = [
	12288,
	12288,
	65281,
	65376,
	65504,
	65510
];
const halfwidthRanges = [
	8361,
	8361,
	65377,
	65470,
	65474,
	65479,
	65482,
	65487,
	65490,
	65495,
	65498,
	65500,
	65512,
	65518
];
const narrowRanges = [
	32,
	126,
	162,
	163,
	165,
	166,
	172,
	172,
	175,
	175,
	10214,
	10221,
	10629,
	10630
];
const wideRanges = [
	4352,
	4447,
	8986,
	8987,
	9001,
	9002,
	9193,
	9196,
	9200,
	9200,
	9203,
	9203,
	9725,
	9726,
	9748,
	9749,
	9776,
	9783,
	9800,
	9811,
	9855,
	9855,
	9866,
	9871,
	9875,
	9875,
	9889,
	9889,
	9898,
	9899,
	9917,
	9918,
	9924,
	9925,
	9934,
	9934,
	9940,
	9940,
	9962,
	9962,
	9970,
	9971,
	9973,
	9973,
	9978,
	9978,
	9981,
	9981,
	9989,
	9989,
	9994,
	9995,
	10024,
	10024,
	10060,
	10060,
	10062,
	10062,
	10067,
	10069,
	10071,
	10071,
	10133,
	10135,
	10160,
	10160,
	10175,
	10175,
	11035,
	11036,
	11088,
	11088,
	11093,
	11093,
	11904,
	11929,
	11931,
	12019,
	12032,
	12245,
	12272,
	12287,
	12289,
	12350,
	12353,
	12438,
	12441,
	12543,
	12549,
	12591,
	12593,
	12686,
	12688,
	12773,
	12783,
	12830,
	12832,
	12871,
	12880,
	42124,
	42128,
	42182,
	43360,
	43388,
	44032,
	55203,
	63744,
	64255,
	65040,
	65049,
	65072,
	65106,
	65108,
	65126,
	65128,
	65131,
	94176,
	94180,
	94192,
	94198,
	94208,
	101589,
	101631,
	101662,
	101760,
	101874,
	110576,
	110579,
	110581,
	110587,
	110589,
	110590,
	110592,
	110882,
	110898,
	110898,
	110928,
	110930,
	110933,
	110933,
	110948,
	110951,
	110960,
	111355,
	119552,
	119638,
	119648,
	119670,
	126980,
	126980,
	127183,
	127183,
	127374,
	127374,
	127377,
	127386,
	127488,
	127490,
	127504,
	127547,
	127552,
	127560,
	127568,
	127569,
	127584,
	127589,
	127744,
	127776,
	127789,
	127797,
	127799,
	127868,
	127870,
	127891,
	127904,
	127946,
	127951,
	127955,
	127968,
	127984,
	127988,
	127988,
	127992,
	128062,
	128064,
	128064,
	128066,
	128252,
	128255,
	128317,
	128331,
	128334,
	128336,
	128359,
	128378,
	128378,
	128405,
	128406,
	128420,
	128420,
	128507,
	128591,
	128640,
	128709,
	128716,
	128716,
	128720,
	128722,
	128725,
	128728,
	128732,
	128735,
	128747,
	128748,
	128756,
	128764,
	128992,
	129003,
	129008,
	129008,
	129292,
	129338,
	129340,
	129349,
	129351,
	129535,
	129648,
	129660,
	129664,
	129674,
	129678,
	129734,
	129736,
	129736,
	129741,
	129756,
	129759,
	129770,
	129775,
	129784,
	131072,
	196605,
	196608,
	262141
];

//#endregion
//#region ../../../../../node_modules/get-east-asian-width/utilities.js
/**
Binary search on a sorted flat array of [start, end] pairs.

@param {number[]} ranges - Flat array of inclusive [start, end] range pairs, e.g. [0, 5, 10, 20].
@param {number} codePoint - The value to search for.
@returns {boolean} Whether the value falls within any of the ranges.
*/
const isInRange = (ranges, codePoint) => {
	let low = 0;
	let high = Math.floor(ranges.length / 2) - 1;
	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const i = mid * 2;
		if (codePoint < ranges[i]) high = mid - 1;
		else if (codePoint > ranges[i + 1]) low = mid + 1;
		else return true;
	}
	return false;
};

//#endregion
//#region ../../../../../node_modules/get-east-asian-width/lookup.js
const minimumAmbiguousCodePoint = ambiguousRanges[0];
const maximumAmbiguousCodePoint = ambiguousRanges.at(-1);
const minimumFullWidthCodePoint = fullwidthRanges[0];
const maximumFullWidthCodePoint = fullwidthRanges.at(-1);
const minimumHalfWidthCodePoint = halfwidthRanges[0];
const maximumHalfWidthCodePoint = halfwidthRanges.at(-1);
const minimumNarrowCodePoint = narrowRanges[0];
const maximumNarrowCodePoint = narrowRanges.at(-1);
const minimumWideCodePoint = wideRanges[0];
const maximumWideCodePoint = wideRanges.at(-1);
const commonCjkCodePoint = 19968;
const [wideFastPathStart, wideFastPathEnd] = findWideFastPathRange(wideRanges);
function findWideFastPathRange(ranges) {
	let fastPathStart = ranges[0];
	let fastPathEnd = ranges[1];
	for (let index = 0; index < ranges.length; index += 2) {
		const start = ranges[index];
		const end = ranges[index + 1];
		if (commonCjkCodePoint >= start && commonCjkCodePoint <= end) return [start, end];
		if (end - start > fastPathEnd - fastPathStart) {
			fastPathStart = start;
			fastPathEnd = end;
		}
	}
	return [fastPathStart, fastPathEnd];
}
const isAmbiguous = (codePoint) => {
	if (codePoint < minimumAmbiguousCodePoint || codePoint > maximumAmbiguousCodePoint) return false;
	return isInRange(ambiguousRanges, codePoint);
};
const isFullWidth$1 = (codePoint) => {
	if (codePoint < minimumFullWidthCodePoint || codePoint > maximumFullWidthCodePoint) return false;
	return isInRange(fullwidthRanges, codePoint);
};
const isWide = (codePoint) => {
	if (codePoint >= wideFastPathStart && codePoint <= wideFastPathEnd) return true;
	if (codePoint < minimumWideCodePoint || codePoint > maximumWideCodePoint) return false;
	return isInRange(wideRanges, codePoint);
};

//#endregion
//#region ../../../../../node_modules/get-east-asian-width/index.js
function validate(codePoint) {
	if (!Number.isSafeInteger(codePoint)) throw new TypeError(`Expected a code point, got \`${typeof codePoint}\`.`);
}
function eastAsianWidth(codePoint, { ambiguousAsWide = false } = {}) {
	validate(codePoint);
	if (isFullWidth$1(codePoint) || isWide(codePoint) || ambiguousAsWide && isAmbiguous(codePoint)) return 2;
	return 1;
}

//#endregion
//#region ../../../../../node_modules/ora/node_modules/string-width/index.js
/**
Logic:
- Segment graphemes to match how terminals render clusters.
- Width rules:
1. Skip non-printing clusters (Default_Ignorable, Control, pure Mark, lone Surrogates). Tabs are ignored by design.
2. RGI emoji clusters (\p{RGI_Emoji}) are double-width.
3. Minimally-qualified/unqualified emoji clusters (ZWJ sequences with 2+ Extended_Pictographic, or keycap sequences) are double-width.
4. Otherwise use East Asian Width of the cluster's first visible code point, and add widths for trailing Halfwidth/Fullwidth Forms within the same cluster (e.g., dakuten/handakuten/prolonged sound mark).
*/
const segmenter = new Intl.Segmenter();
const zeroWidthClusterRegex = /* @__PURE__ */ new RegExp("^(?:\\p{Default_Ignorable_Code_Point}|\\p{Control}|\\p{Format}|\\p{Mark}|\\p{Surrogate})+$", "v");
const leadingNonPrintingRegex = /* @__PURE__ */ new RegExp("^[\\p{Default_Ignorable_Code_Point}\\p{Control}\\p{Format}\\p{Mark}\\p{Surrogate}]+", "v");
const rgiEmojiRegex = /* @__PURE__ */ new RegExp("^\\p{RGI_Emoji}$", "v");
const unqualifiedKeycapRegex = /^[\d#*]\u20E3$/;
const extendedPictographicRegex = /\p{Extended_Pictographic}/gu;
function isDoubleWidthNonRgiEmojiSequence(segment) {
	if (segment.length > 50) return false;
	if (unqualifiedKeycapRegex.test(segment)) return true;
	if (segment.includes("‍")) {
		const pictographics = segment.match(extendedPictographicRegex);
		return pictographics !== null && pictographics.length >= 2;
	}
	return false;
}
function baseVisible(segment) {
	return segment.replace(leadingNonPrintingRegex, "");
}
function isZeroWidthCluster(segment) {
	return zeroWidthClusterRegex.test(segment);
}
function trailingHalfwidthWidth(segment, eastAsianWidthOptions) {
	let extra = 0;
	if (segment.length > 1) {
		for (const char of segment.slice(1)) if (char >= "＀" && char <= "￯") extra += eastAsianWidth(char.codePointAt(0), eastAsianWidthOptions);
	}
	return extra;
}
function stringWidth(input, options = {}) {
	if (typeof input !== "string" || input.length === 0) return 0;
	const { ambiguousIsNarrow = true, countAnsiEscapeCodes = false } = options;
	let string = input;
	if (!countAnsiEscapeCodes && (string.includes("\x1B") || string.includes(""))) string = stripAnsi(string);
	if (string.length === 0) return 0;
	if (/^[\u0020-\u007E]*$/.test(string)) return string.length;
	let width = 0;
	const eastAsianWidthOptions = { ambiguousAsWide: !ambiguousIsNarrow };
	for (const { segment } of segmenter.segment(string)) {
		if (isZeroWidthCluster(segment)) continue;
		if (rgiEmojiRegex.test(segment) || isDoubleWidthNonRgiEmojiSequence(segment)) {
			width += 2;
			continue;
		}
		const codePoint = baseVisible(segment).codePointAt(0);
		width += eastAsianWidth(codePoint, eastAsianWidthOptions);
		width += trailingHalfwidthWidth(segment, eastAsianWidthOptions);
	}
	return width;
}

//#endregion
//#region ../../../../../node_modules/is-interactive/index.js
function isInteractive({ stream = process.stdout } = {}) {
	return Boolean(stream && stream.isTTY && process.env.TERM !== "dumb" && !("CI" in process.env));
}

//#endregion
//#region ../../../../../node_modules/stdin-discarder/index.js
const ASCII_ETX_CODE = 3;
var StdinDiscarder = class {
	#activeCount = 0;
	#stdin;
	#stdinWasPaused = false;
	#stdinWasRaw = false;
	#handleInputBound = (chunk) => {
		if (!chunk?.length) return;
		if ((typeof chunk === "string" ? chunk.codePointAt(0) : chunk[0]) === ASCII_ETX_CODE) if (node_process.default.listenerCount("SIGINT") > 0) node_process.default.emit("SIGINT");
		else node_process.default.kill(node_process.default.pid, "SIGINT");
	};
	start() {
		this.#activeCount++;
		if (this.#activeCount === 1) this.#realStart();
	}
	stop() {
		if (this.#activeCount === 0) return;
		if (--this.#activeCount === 0) this.#realStop();
	}
	#realStart() {
		const { stdin } = node_process.default;
		if (node_process.default.platform === "win32" || !stdin?.isTTY || typeof stdin.setRawMode !== "function") {
			this.#stdin = void 0;
			return;
		}
		this.#stdin = stdin;
		this.#stdinWasPaused = stdin.isPaused();
		this.#stdinWasRaw = Boolean(stdin.isRaw);
		stdin.setRawMode(true);
		stdin.prependListener("data", this.#handleInputBound);
		if (this.#stdinWasPaused) stdin.resume();
	}
	#realStop() {
		if (!this.#stdin) return;
		const stdin = this.#stdin;
		stdin.off("data", this.#handleInputBound);
		if (stdin.isTTY) stdin.setRawMode?.(this.#stdinWasRaw);
		if (this.#stdinWasPaused) stdin.pause();
		this.#stdin = void 0;
		this.#stdinWasPaused = false;
		this.#stdinWasRaw = false;
	}
};
const stdinDiscarder = new StdinDiscarder();
var stdin_discarder_default = Object.freeze(stdinDiscarder);

//#endregion
//#region ../../../../../node_modules/ora/index.js
const RENDER_DEFERRAL_TIMEOUT = 200;
const SYNCHRONIZED_OUTPUT_ENABLE = "\x1B[?2026h";
const SYNCHRONIZED_OUTPUT_DISABLE = "\x1B[?2026l";
const activeHooksPerStream = /* @__PURE__ */ new Map();
var Ora = class {
	#linesToClear = 0;
	#frameIndex = -1;
	#lastFrameTime = 0;
	#options;
	#spinner;
	#stream;
	#id;
	#hookedStreams = /* @__PURE__ */ new Map();
	#isInternalWrite = false;
	#drainHandler;
	#deferRenderTimer;
	#isDiscardingStdin = false;
	color;
	#internalWrite(fn) {
		this.#isInternalWrite = true;
		try {
			return fn();
		} finally {
			this.#isInternalWrite = false;
		}
	}
	#tryRender() {
		if (this.isSpinning) this.render();
	}
	#stringifyChunk(chunk, encoding) {
		if (chunk === void 0 || chunk === null) return "";
		if (typeof chunk === "string") return chunk;
		if (Buffer.isBuffer(chunk) || ArrayBuffer.isView(chunk)) {
			const normalizedEncoding = typeof encoding === "string" && encoding && encoding !== "buffer" ? encoding : "utf8";
			return Buffer.from(chunk).toString(normalizedEncoding);
		}
		return String(chunk);
	}
	#chunkTerminatesLine(chunkString) {
		if (!chunkString) return false;
		const lastCharacter = chunkString.at(-1);
		return lastCharacter === "\n" || lastCharacter === "\r";
	}
	#scheduleRenderDeferral() {
		if (this.#deferRenderTimer) return;
		this.#deferRenderTimer = setTimeout(() => {
			this.#deferRenderTimer = void 0;
			if (this.isSpinning) this.#tryRender();
		}, RENDER_DEFERRAL_TIMEOUT);
		if (typeof this.#deferRenderTimer?.unref === "function") this.#deferRenderTimer.unref();
	}
	#clearRenderDeferral() {
		if (this.#deferRenderTimer) {
			clearTimeout(this.#deferRenderTimer);
			this.#deferRenderTimer = void 0;
		}
	}
	#buildOutputLine(symbol, text, prefixText, suffixText) {
		const fullPrefixText = this.#getFullPrefixText(prefixText, " ");
		const fullText = typeof text === "string" ? (symbol ? " " : "") + text : "";
		const fullSuffixText = this.#getFullSuffixText(suffixText, " ");
		return fullPrefixText + symbol + fullText + fullSuffixText;
	}
	constructor(options) {
		if (typeof options === "string") options = { text: options };
		this.#options = {
			color: "cyan",
			stream: node_process.default.stderr,
			discardStdin: true,
			hideCursor: true,
			...options
		};
		this.color = this.#options.color;
		this.#stream = this.#options.stream;
		if (typeof this.#options.isEnabled !== "boolean") this.#options.isEnabled = isInteractive({ stream: this.#stream });
		if (typeof this.#options.isSilent !== "boolean") this.#options.isSilent = false;
		const userInterval = this.#options.interval;
		this.spinner = this.#options.spinner;
		this.#options.interval = userInterval;
		this.text = this.#options.text;
		this.prefixText = this.#options.prefixText;
		this.suffixText = this.#options.suffixText;
		this.indent = this.#options.indent;
		if (node_process.default.env.NODE_ENV === "test") {
			this._stream = this.#stream;
			this._isEnabled = this.#options.isEnabled;
			Object.defineProperty(this, "_linesToClear", {
				get() {
					return this.#linesToClear;
				},
				set(newValue) {
					this.#linesToClear = newValue;
				}
			});
			Object.defineProperty(this, "_frameIndex", { get() {
				return this.#frameIndex;
			} });
			Object.defineProperty(this, "_lineCount", { get() {
				const columns = this.#stream.columns ?? 80;
				const prefixText = typeof this.#options.prefixText === "function" ? "" : this.#options.prefixText;
				const suffixText = typeof this.#options.suffixText === "function" ? "" : this.#options.suffixText;
				const fullPrefixText = typeof prefixText === "string" && prefixText !== "" ? prefixText + " " : "";
				const fullSuffixText = typeof suffixText === "string" && suffixText !== "" ? " " + suffixText : "";
				const fullText = " ".repeat(this.#options.indent) + fullPrefixText + "-" + (typeof this.#options.text === "string" ? " " + this.#options.text : "") + fullSuffixText;
				return this.#computeLineCountFrom(fullText, columns);
			} });
		}
	}
	get indent() {
		return this.#options.indent;
	}
	set indent(indent = 0) {
		if (!(indent >= 0 && Number.isInteger(indent))) throw new Error("The `indent` option must be an integer from 0 and up");
		this.#options.indent = indent;
	}
	get interval() {
		return this.#options.interval ?? this.#spinner.interval ?? 100;
	}
	get spinner() {
		return this.#spinner;
	}
	set spinner(spinner) {
		this.#frameIndex = -1;
		this.#options.interval = void 0;
		if (typeof spinner === "object") {
			if (!Array.isArray(spinner.frames) || spinner.frames.length === 0 || spinner.frames.some((frame) => typeof frame !== "string")) throw new Error("The given spinner must have a non-empty `frames` array of strings");
			if (spinner.interval !== void 0 && !(Number.isInteger(spinner.interval) && spinner.interval > 0)) throw new Error("`spinner.interval` must be a positive integer if provided");
			this.#spinner = spinner;
		} else if (!isUnicodeSupported$1()) this.#spinner = cli_spinners_default.line;
		else if (spinner === void 0) this.#spinner = cli_spinners_default.dots;
		else if (spinner !== "default" && cli_spinners_default[spinner]) this.#spinner = cli_spinners_default[spinner];
		else throw new Error(`There is no built-in spinner named '${spinner}'. See https://github.com/sindresorhus/cli-spinners/blob/main/spinners.json for a full list.`);
	}
	get text() {
		return this.#options.text;
	}
	set text(value = "") {
		this.#options.text = value;
	}
	get prefixText() {
		return this.#options.prefixText;
	}
	set prefixText(value = "") {
		this.#options.prefixText = value;
	}
	get suffixText() {
		return this.#options.suffixText;
	}
	set suffixText(value = "") {
		this.#options.suffixText = value;
	}
	get isSpinning() {
		return this.#id !== void 0;
	}
	#formatAffix(value, separator, placeBefore = false) {
		const resolved = typeof value === "function" ? value() : value;
		if (typeof resolved === "string" && resolved !== "") return placeBefore ? separator + resolved : resolved + separator;
		return "";
	}
	#getFullPrefixText(prefixText = this.#options.prefixText, postfix = " ") {
		return this.#formatAffix(prefixText, postfix, false);
	}
	#getFullSuffixText(suffixText = this.#options.suffixText, prefix = " ") {
		return this.#formatAffix(suffixText, prefix, true);
	}
	#computeLineCountFrom(text, columns) {
		let count = 0;
		for (const line of (0, node_util.stripVTControlCharacters)(text).split("\n")) count += Math.max(1, Math.ceil(stringWidth(line) / columns));
		return count;
	}
	get isEnabled() {
		return this.#options.isEnabled && !this.#options.isSilent;
	}
	set isEnabled(value) {
		if (typeof value !== "boolean") throw new TypeError("The `isEnabled` option must be a boolean");
		this.#options.isEnabled = value;
	}
	get isSilent() {
		return this.#options.isSilent;
	}
	set isSilent(value) {
		if (typeof value !== "boolean") throw new TypeError("The `isSilent` option must be a boolean");
		this.#options.isSilent = value;
	}
	frame() {
		const now = Date.now();
		if (this.#frameIndex === -1 || now - this.#lastFrameTime >= this.interval) {
			this.#frameIndex = (this.#frameIndex + 1) % this.#spinner.frames.length;
			this.#lastFrameTime = now;
		}
		const { frames } = this.#spinner;
		let frame = frames[this.#frameIndex];
		if (this.color) frame = chalk[this.color](frame);
		const fullPrefixText = this.#getFullPrefixText(this.#options.prefixText, " ");
		const fullText = typeof this.text === "string" ? " " + this.text : "";
		const fullSuffixText = this.#getFullSuffixText(this.#options.suffixText, " ");
		return fullPrefixText + frame + fullText + fullSuffixText;
	}
	clear() {
		if (!this.isEnabled || !this.#stream.isTTY) return this;
		this.#internalWrite(() => {
			this.#stream.cursorTo(0);
			for (let index = 0; index < this.#linesToClear; index++) {
				if (index > 0) this.#stream.moveCursor(0, -1);
				this.#stream.clearLine(1);
			}
			if (this.#options.indent) this.#stream.cursorTo(this.#options.indent);
		});
		this.#linesToClear = 0;
		return this;
	}
	#hookStream(stream) {
		if (!stream || this.#hookedStreams.has(stream) || !stream.isTTY || typeof stream.write !== "function") return;
		if (activeHooksPerStream.has(stream)) console.warn("[ora] Multiple concurrent spinners detected. This may cause visual corruption. Use one spinner at a time.");
		const originalWrite = stream.write;
		this.#hookedStreams.set(stream, originalWrite);
		activeHooksPerStream.set(stream, this);
		stream.write = (chunk, encoding, callback) => this.#hookedWrite(stream, originalWrite, chunk, encoding, callback);
	}
	/**
	Intercept stream writes while spinner is active to handle external writes cleanly without visual corruption.
	Hooks process stdio streams and the active spinner stream so console.log(), console.error(), and direct writes stay tidy.
	*/
	#installHook() {
		if (!this.isEnabled || this.#hookedStreams.size > 0) return;
		const streamsToHook = new Set([
			this.#stream,
			node_process.default.stdout,
			node_process.default.stderr
		]);
		for (const stream of streamsToHook) this.#hookStream(stream);
	}
	#uninstallHook() {
		for (const [stream, originalWrite] of this.#hookedStreams) {
			stream.write = originalWrite;
			if (activeHooksPerStream.get(stream) === this) activeHooksPerStream.delete(stream);
		}
		this.#hookedStreams.clear();
	}
	#hookedWrite(stream, originalWrite, chunk, encoding, callback) {
		if (typeof encoding === "function") {
			callback = encoding;
			encoding = void 0;
		}
		if (this.#isInternalWrite) return originalWrite.call(stream, chunk, encoding, callback);
		this.clear();
		const chunkString = this.#stringifyChunk(chunk, encoding);
		const chunkTerminatesLine = this.#chunkTerminatesLine(chunkString);
		const writeResult = originalWrite.call(stream, chunk, encoding, callback);
		if (chunkTerminatesLine) this.#clearRenderDeferral();
		else if (chunkString.length > 0) this.#scheduleRenderDeferral();
		if (this.isSpinning && !this.#deferRenderTimer) this.render();
		return writeResult;
	}
	render() {
		if (!this.isEnabled || this.#drainHandler || this.#deferRenderTimer) return this;
		const useSynchronizedOutput = this.#stream.isTTY;
		let shouldDisableSynchronizedOutput = false;
		try {
			if (useSynchronizedOutput) {
				this.#internalWrite(() => this.#stream.write(SYNCHRONIZED_OUTPUT_ENABLE));
				shouldDisableSynchronizedOutput = true;
			}
			this.clear();
			let frameContent = this.frame();
			const columns = this.#stream.columns ?? 80;
			const actualLineCount = this.#computeLineCountFrom(frameContent, columns);
			const consoleHeight = this.#stream.rows;
			if (consoleHeight && consoleHeight > 1 && actualLineCount > consoleHeight) {
				const lines = frameContent.split("\n");
				const maxLines = consoleHeight - 1;
				frameContent = [...lines.slice(0, maxLines), "... (content truncated to fit terminal)"].join("\n");
			}
			if (this.#internalWrite(() => this.#stream.write(frameContent)) === false && this.#stream.isTTY) {
				this.#drainHandler = () => {
					this.#drainHandler = void 0;
					this.#tryRender();
				};
				this.#stream.once("drain", this.#drainHandler);
			}
			this.#linesToClear = this.#computeLineCountFrom(frameContent, columns);
		} finally {
			if (shouldDisableSynchronizedOutput) this.#internalWrite(() => this.#stream.write(SYNCHRONIZED_OUTPUT_DISABLE));
		}
		return this;
	}
	start(text) {
		if (text) this.text = text;
		if (this.isSilent) return this;
		if (!this.isEnabled) {
			const symbol = this.text ? "-" : "";
			const line = " ".repeat(this.#options.indent) + this.#buildOutputLine(symbol, this.text, this.#options.prefixText, this.#options.suffixText);
			if (line.trim() !== "") this.#internalWrite(() => this.#stream.write(line + "\n"));
			return this;
		}
		if (this.isSpinning) return this;
		if (this.#options.hideCursor) cliCursor.hide(this.#stream);
		if (this.#options.discardStdin && node_process.default.stdin.isTTY) {
			stdin_discarder_default.start();
			this.#isDiscardingStdin = true;
		}
		this.#installHook();
		this.render();
		this.#id = setInterval(this.render.bind(this), this.interval);
		return this;
	}
	stop() {
		clearInterval(this.#id);
		this.#id = void 0;
		this.#frameIndex = -1;
		this.#lastFrameTime = 0;
		this.#clearRenderDeferral();
		this.#uninstallHook();
		if (this.#drainHandler) {
			this.#stream.removeListener("drain", this.#drainHandler);
			this.#drainHandler = void 0;
		}
		if (this.isEnabled) {
			this.clear();
			if (this.#options.hideCursor) cliCursor.show(this.#stream);
		}
		if (this.#isDiscardingStdin) {
			this.#isDiscardingStdin = false;
			stdin_discarder_default.stop();
		}
		return this;
	}
	succeed(text) {
		return this.stopAndPersist({
			symbol: success,
			text
		});
	}
	fail(text) {
		return this.stopAndPersist({
			symbol: error,
			text
		});
	}
	warn(text) {
		return this.stopAndPersist({
			symbol: warning,
			text
		});
	}
	info(text) {
		return this.stopAndPersist({
			symbol: info,
			text
		});
	}
	stopAndPersist(options = {}) {
		if (this.isSilent) return this;
		const symbol = options.symbol ?? " ";
		const text = options.text ?? this.text;
		const prefixText = options.prefixText ?? this.#options.prefixText;
		const suffixText = options.suffixText ?? this.#options.suffixText;
		const textToWrite = this.#buildOutputLine(symbol, text, prefixText, suffixText) + "\n";
		this.stop();
		this.#internalWrite(() => this.#stream.write(textToWrite));
		return this;
	}
};
function ora(options) {
	return new Ora(options);
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/key.js
const isUpKey = (key, keybindings = []) => key.name === "up" || keybindings.includes("vim") && key.name === "k" || keybindings.includes("emacs") && key.ctrl && key.name === "p";
const isDownKey = (key, keybindings = []) => key.name === "down" || keybindings.includes("vim") && key.name === "j" || keybindings.includes("emacs") && key.ctrl && key.name === "n";
const isBackspaceKey = (key) => key.name === "backspace";
const isTabKey = (key) => key.name === "tab";
const isNumberKey = (key) => "1234567890".includes(key.name);
const isEnterKey = (key) => key.name === "enter" || key.name === "return";

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/errors.js
var AbortPromptError = class extends Error {
	name = "AbortPromptError";
	message = "Prompt was aborted";
	constructor(options) {
		super();
		this.cause = options?.cause;
	}
};
var CancelPromptError = class extends Error {
	name = "CancelPromptError";
	message = "Prompt was canceled";
};
var ExitPromptError = class extends Error {
	name = "ExitPromptError";
};
var HookError = class extends Error {
	name = "HookError";
};
var ValidationError = class extends Error {
	name = "ValidationError";
};

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/hook-engine.js
const hookStorage = new node_async_hooks.AsyncLocalStorage();
function createStore(rl) {
	return {
		rl,
		hooks: [],
		hooksCleanup: [],
		hooksEffect: [],
		index: 0,
		handleChange() {}
	};
}
function withHooks(rl, cb) {
	const store = createStore(rl);
	return hookStorage.run(store, () => {
		function cycle(render) {
			store.handleChange = () => {
				store.index = 0;
				render();
			};
			store.handleChange();
		}
		return cb(cycle);
	});
}
function getStore() {
	const store = hookStorage.getStore();
	if (!store) throw new HookError("[Inquirer] Hook functions can only be called from within a prompt");
	return store;
}
function readline() {
	return getStore().rl;
}
function withUpdates(fn) {
	const wrapped = (...args) => {
		const store = getStore();
		let shouldUpdate = false;
		const oldHandleChange = store.handleChange;
		store.handleChange = () => {
			shouldUpdate = true;
		};
		const returnValue = fn(...args);
		if (shouldUpdate) oldHandleChange();
		store.handleChange = oldHandleChange;
		return returnValue;
	};
	return node_async_hooks.AsyncResource.bind(wrapped);
}
function withPointer(cb) {
	const store = getStore();
	const { index } = store;
	const returnValue = cb({
		get() {
			return store.hooks[index];
		},
		set(value) {
			store.hooks[index] = value;
		},
		initialized: index in store.hooks
	});
	store.index++;
	return returnValue;
}
function handleChange() {
	getStore().handleChange();
}
const effectScheduler = {
	queue(cb) {
		const store = getStore();
		const { index } = store;
		store.hooksEffect.push(() => {
			store.hooksCleanup[index]?.();
			const cleanFn = cb(readline());
			if (cleanFn != null && typeof cleanFn !== "function") throw new ValidationError("useEffect return value must be a cleanup function or nothing.");
			store.hooksCleanup[index] = cleanFn;
		});
	},
	run() {
		const store = getStore();
		withUpdates(() => {
			store.hooksEffect.forEach((effect) => {
				effect();
			});
			store.hooksEffect.length = 0;
		})();
	},
	clearAll() {
		const store = getStore();
		store.hooksCleanup.forEach((cleanFn) => {
			cleanFn?.();
		});
		store.hooksEffect.length = 0;
		store.hooksCleanup.length = 0;
	}
};

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/use-state.js
function useState(defaultValue) {
	return withPointer((pointer) => {
		const setState = node_async_hooks.AsyncResource.bind(function setState(newValue) {
			if (pointer.get() !== newValue) {
				pointer.set(newValue);
				handleChange();
			}
		});
		if (pointer.initialized) return [pointer.get(), setState];
		const value = typeof defaultValue === "function" ? defaultValue() : defaultValue;
		pointer.set(value);
		return [value, setState];
	});
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/use-effect.js
function useEffect(cb, depArray) {
	withPointer((pointer) => {
		const oldDeps = pointer.get();
		if (!Array.isArray(oldDeps) || depArray.some((dep, i) => !Object.is(dep, oldDeps[i]))) effectScheduler.queue(cb);
		pointer.set(depArray);
	});
}

//#endregion
//#region ../../../../../node_modules/@inquirer/figures/dist/index.js
function isUnicodeSupported() {
	if (node_process.default.platform !== "win32") return node_process.default.env["TERM"] !== "linux";
	return Boolean(node_process.default.env["WT_SESSION"]) || Boolean(node_process.default.env["TERMINUS_SUBLIME"]) || node_process.default.env["ConEmuTask"] === "{cmd::Cmder}" || node_process.default.env["TERM_PROGRAM"] === "Terminus-Sublime" || node_process.default.env["TERM_PROGRAM"] === "vscode" || node_process.default.env["TERM"] === "xterm-256color" || node_process.default.env["TERM"] === "alacritty" || node_process.default.env["TERMINAL_EMULATOR"] === "JetBrains-JediTerm";
}
const common = {
	circleQuestionMark: "(?)",
	questionMarkPrefix: "(?)",
	square: "█",
	squareDarkShade: "▓",
	squareMediumShade: "▒",
	squareLightShade: "░",
	squareTop: "▀",
	squareBottom: "▄",
	squareLeft: "▌",
	squareRight: "▐",
	squareCenter: "■",
	bullet: "●",
	dot: "․",
	ellipsis: "…",
	pointerSmall: "›",
	triangleUp: "▲",
	triangleUpSmall: "▴",
	triangleDown: "▼",
	triangleDownSmall: "▾",
	triangleLeftSmall: "◂",
	triangleRightSmall: "▸",
	home: "⌂",
	heart: "♥",
	musicNote: "♪",
	musicNoteBeamed: "♫",
	arrowUp: "↑",
	arrowDown: "↓",
	arrowLeft: "←",
	arrowRight: "→",
	arrowLeftRight: "↔",
	arrowUpDown: "↕",
	almostEqual: "≈",
	notEqual: "≠",
	lessOrEqual: "≤",
	greaterOrEqual: "≥",
	identical: "≡",
	infinity: "∞",
	subscriptZero: "₀",
	subscriptOne: "₁",
	subscriptTwo: "₂",
	subscriptThree: "₃",
	subscriptFour: "₄",
	subscriptFive: "₅",
	subscriptSix: "₆",
	subscriptSeven: "₇",
	subscriptEight: "₈",
	subscriptNine: "₉",
	oneHalf: "½",
	oneThird: "⅓",
	oneQuarter: "¼",
	oneFifth: "⅕",
	oneSixth: "⅙",
	oneEighth: "⅛",
	twoThirds: "⅔",
	twoFifths: "⅖",
	threeQuarters: "¾",
	threeFifths: "⅗",
	threeEighths: "⅜",
	fourFifths: "⅘",
	fiveSixths: "⅚",
	fiveEighths: "⅝",
	sevenEighths: "⅞",
	line: "─",
	lineBold: "━",
	lineDouble: "═",
	lineDashed0: "┄",
	lineDashed1: "┅",
	lineDashed2: "┈",
	lineDashed3: "┉",
	lineDashed4: "╌",
	lineDashed5: "╍",
	lineDashed6: "╴",
	lineDashed7: "╶",
	lineDashed8: "╸",
	lineDashed9: "╺",
	lineDashed10: "╼",
	lineDashed11: "╾",
	lineDashed12: "−",
	lineDashed13: "–",
	lineDashed14: "‐",
	lineDashed15: "⁃",
	lineVertical: "│",
	lineVerticalBold: "┃",
	lineVerticalDouble: "║",
	lineVerticalDashed0: "┆",
	lineVerticalDashed1: "┇",
	lineVerticalDashed2: "┊",
	lineVerticalDashed3: "┋",
	lineVerticalDashed4: "╎",
	lineVerticalDashed5: "╏",
	lineVerticalDashed6: "╵",
	lineVerticalDashed7: "╷",
	lineVerticalDashed8: "╹",
	lineVerticalDashed9: "╻",
	lineVerticalDashed10: "╽",
	lineVerticalDashed11: "╿",
	lineDownLeft: "┐",
	lineDownLeftArc: "╮",
	lineDownBoldLeftBold: "┓",
	lineDownBoldLeft: "┒",
	lineDownLeftBold: "┑",
	lineDownDoubleLeftDouble: "╗",
	lineDownDoubleLeft: "╖",
	lineDownLeftDouble: "╕",
	lineDownRight: "┌",
	lineDownRightArc: "╭",
	lineDownBoldRightBold: "┏",
	lineDownBoldRight: "┎",
	lineDownRightBold: "┍",
	lineDownDoubleRightDouble: "╔",
	lineDownDoubleRight: "╓",
	lineDownRightDouble: "╒",
	lineUpLeft: "┘",
	lineUpLeftArc: "╯",
	lineUpBoldLeftBold: "┛",
	lineUpBoldLeft: "┚",
	lineUpLeftBold: "┙",
	lineUpDoubleLeftDouble: "╝",
	lineUpDoubleLeft: "╜",
	lineUpLeftDouble: "╛",
	lineUpRight: "└",
	lineUpRightArc: "╰",
	lineUpBoldRightBold: "┗",
	lineUpBoldRight: "┖",
	lineUpRightBold: "┕",
	lineUpDoubleRightDouble: "╚",
	lineUpDoubleRight: "╙",
	lineUpRightDouble: "╘",
	lineUpDownLeft: "┤",
	lineUpBoldDownBoldLeftBold: "┫",
	lineUpBoldDownBoldLeft: "┨",
	lineUpDownLeftBold: "┥",
	lineUpBoldDownLeftBold: "┩",
	lineUpDownBoldLeftBold: "┪",
	lineUpDownBoldLeft: "┧",
	lineUpBoldDownLeft: "┦",
	lineUpDoubleDownDoubleLeftDouble: "╣",
	lineUpDoubleDownDoubleLeft: "╢",
	lineUpDownLeftDouble: "╡",
	lineUpDownRight: "├",
	lineUpBoldDownBoldRightBold: "┣",
	lineUpBoldDownBoldRight: "┠",
	lineUpDownRightBold: "┝",
	lineUpBoldDownRightBold: "┡",
	lineUpDownBoldRightBold: "┢",
	lineUpDownBoldRight: "┟",
	lineUpBoldDownRight: "┞",
	lineUpDoubleDownDoubleRightDouble: "╠",
	lineUpDoubleDownDoubleRight: "╟",
	lineUpDownRightDouble: "╞",
	lineDownLeftRight: "┬",
	lineDownBoldLeftBoldRightBold: "┳",
	lineDownLeftBoldRightBold: "┯",
	lineDownBoldLeftRight: "┰",
	lineDownBoldLeftBoldRight: "┱",
	lineDownBoldLeftRightBold: "┲",
	lineDownLeftRightBold: "┮",
	lineDownLeftBoldRight: "┭",
	lineDownDoubleLeftDoubleRightDouble: "╦",
	lineDownDoubleLeftRight: "╥",
	lineDownLeftDoubleRightDouble: "╤",
	lineUpLeftRight: "┴",
	lineUpBoldLeftBoldRightBold: "┻",
	lineUpLeftBoldRightBold: "┷",
	lineUpBoldLeftRight: "┸",
	lineUpBoldLeftBoldRight: "┹",
	lineUpBoldLeftRightBold: "┺",
	lineUpLeftRightBold: "┶",
	lineUpLeftBoldRight: "┵",
	lineUpDoubleLeftDoubleRightDouble: "╩",
	lineUpDoubleLeftRight: "╨",
	lineUpLeftDoubleRightDouble: "╧",
	lineUpDownLeftRight: "┼",
	lineUpBoldDownBoldLeftBoldRightBold: "╋",
	lineUpDownBoldLeftBoldRightBold: "╈",
	lineUpBoldDownLeftBoldRightBold: "╇",
	lineUpBoldDownBoldLeftRightBold: "╊",
	lineUpBoldDownBoldLeftBoldRight: "╉",
	lineUpBoldDownLeftRight: "╀",
	lineUpDownBoldLeftRight: "╁",
	lineUpDownLeftBoldRight: "┽",
	lineUpDownLeftRightBold: "┾",
	lineUpBoldDownBoldLeftRight: "╂",
	lineUpDownLeftBoldRightBold: "┿",
	lineUpBoldDownLeftBoldRight: "╃",
	lineUpBoldDownLeftRightBold: "╄",
	lineUpDownBoldLeftBoldRight: "╅",
	lineUpDownBoldLeftRightBold: "╆",
	lineUpDoubleDownDoubleLeftDoubleRightDouble: "╬",
	lineUpDoubleDownDoubleLeftRight: "╫",
	lineUpDownLeftDoubleRightDouble: "╪",
	lineCross: "╳",
	lineBackslash: "╲",
	lineSlash: "╱"
};
const specialMainSymbols = {
	tick: "✔",
	info: "ℹ",
	warning: "⚠",
	cross: "✘",
	squareSmall: "◻",
	squareSmallFilled: "◼",
	circle: "◯",
	circleFilled: "◉",
	circleDotted: "◌",
	circleDouble: "◎",
	circleCircle: "ⓞ",
	circleCross: "ⓧ",
	circlePipe: "Ⓘ",
	radioOn: "◉",
	radioOff: "◯",
	checkboxOn: "☒",
	checkboxOff: "☐",
	checkboxCircleOn: "ⓧ",
	checkboxCircleOff: "Ⓘ",
	pointer: "❯",
	triangleUpOutline: "△",
	triangleLeft: "◀",
	triangleRight: "▶",
	lozenge: "◆",
	lozengeOutline: "◇",
	hamburger: "☰",
	smiley: "㋡",
	mustache: "෴",
	star: "★",
	play: "▶",
	nodejs: "⬢",
	oneSeventh: "⅐",
	oneNinth: "⅑",
	oneTenth: "⅒"
};
const specialFallbackSymbols = {
	tick: "√",
	info: "i",
	warning: "‼",
	cross: "×",
	squareSmall: "□",
	squareSmallFilled: "■",
	circle: "( )",
	circleFilled: "(*)",
	circleDotted: "( )",
	circleDouble: "( )",
	circleCircle: "(○)",
	circleCross: "(×)",
	circlePipe: "(│)",
	radioOn: "(*)",
	radioOff: "( )",
	checkboxOn: "[×]",
	checkboxOff: "[ ]",
	checkboxCircleOn: "(×)",
	checkboxCircleOff: "( )",
	pointer: ">",
	triangleUpOutline: "∆",
	triangleLeft: "◄",
	triangleRight: "►",
	lozenge: "♦",
	lozengeOutline: "◊",
	hamburger: "≡",
	smiley: "☺",
	mustache: "┌─┐",
	star: "✶",
	play: "►",
	nodejs: "♦",
	oneSeventh: "1/7",
	oneNinth: "1/9",
	oneTenth: "1/10"
};
const mainSymbols = {
	...common,
	...specialMainSymbols
};
const fallbackSymbols = {
	...common,
	...specialFallbackSymbols
};
const shouldUseMain = isUnicodeSupported();
const figures = shouldUseMain ? mainSymbols : fallbackSymbols;
const replacements = Object.entries(specialMainSymbols);

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/theme.js
const defaultTheme = {
	prefix: {
		idle: (0, node_util.styleText)("blue", "?"),
		done: (0, node_util.styleText)("green", figures.tick)
	},
	spinner: {
		interval: 80,
		frames: [
			"⠋",
			"⠙",
			"⠹",
			"⠸",
			"⠼",
			"⠴",
			"⠦",
			"⠧",
			"⠇",
			"⠏"
		].map((frame) => (0, node_util.styleText)("yellow", frame))
	},
	style: {
		answer: (text) => (0, node_util.styleText)("cyan", text),
		message: (text) => (0, node_util.styleText)("bold", text),
		error: (text) => (0, node_util.styleText)("red", `> ${text}`),
		defaultAnswer: (text) => (0, node_util.styleText)("dim", `(${text})`),
		help: (text) => (0, node_util.styleText)("dim", text),
		highlight: (text) => (0, node_util.styleText)("cyan", text),
		key: (text) => (0, node_util.styleText)("cyan", (0, node_util.styleText)("bold", `<${text}>`))
	}
};

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/make-theme.js
function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;
	let proto = value;
	while (Object.getPrototypeOf(proto) !== null) proto = Object.getPrototypeOf(proto);
	return Object.getPrototypeOf(value) === proto;
}
function deepMerge(...objects) {
	const output = {};
	for (const obj of objects) for (const [key, value] of Object.entries(obj)) {
		const prevValue = output[key];
		output[key] = isPlainObject(prevValue) && isPlainObject(value) ? deepMerge(prevValue, value) : value;
	}
	return output;
}
function makeTheme(...themes) {
	return deepMerge(...[defaultTheme, ...themes.filter((theme) => theme != null)]);
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/use-prefix.js
function usePrefix({ status = "idle", theme }) {
	const [showLoader, setShowLoader] = useState(false);
	const [tick, setTick] = useState(0);
	const { prefix, spinner } = makeTheme(theme);
	useEffect(() => {
		if (status === "loading") {
			let tickInterval;
			let inc = -1;
			const delayTimeout = setTimeout(() => {
				setShowLoader(true);
				tickInterval = setInterval(() => {
					inc = inc + 1;
					setTick(inc % spinner.frames.length);
				}, spinner.interval);
			}, 300);
			return () => {
				clearTimeout(delayTimeout);
				clearInterval(tickInterval);
			};
		} else setShowLoader(false);
	}, [status]);
	if (showLoader) return spinner.frames[tick];
	return typeof prefix === "string" ? prefix : prefix[status === "loading" ? "idle" : status] ?? prefix["idle"];
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/use-memo.js
function useMemo(fn, dependencies) {
	return withPointer((pointer) => {
		const prev = pointer.get();
		if (!prev || prev.dependencies.length !== dependencies.length || prev.dependencies.some((dep, i) => dep !== dependencies[i])) {
			const value = fn();
			pointer.set({
				value,
				dependencies
			});
			return value;
		}
		return prev.value;
	});
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/use-ref.js
function useRef(val) {
	return useState({ current: val })[0];
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/use-keypress.js
function useKeypress(userHandler) {
	const signal = useRef(userHandler);
	signal.current = userHandler;
	useEffect((rl) => {
		let ignore = false;
		const handler = withUpdates((_input, event) => {
			if (ignore) return;
			signal.current(event, rl);
		});
		rl.input.on("keypress", handler);
		return () => {
			ignore = true;
			rl.input.removeListener("keypress", handler);
		};
	}, []);
}

//#endregion
//#region ../../../../../node_modules/cli-width/index.js
var require_cli_width = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	module.exports = cliWidth;
	function normalizeOpts(options) {
		const defaultOpts = {
			defaultWidth: 0,
			output: process.stdout,
			tty: require("tty")
		};
		if (!options) return defaultOpts;
		Object.keys(defaultOpts).forEach(function(key) {
			if (!options[key]) options[key] = defaultOpts[key];
		});
		return options;
	}
	function cliWidth(options) {
		const opts = normalizeOpts(options);
		if (opts.output.getWindowSize) return opts.output.getWindowSize()[0] || opts.defaultWidth;
		if (opts.tty.getWindowSize) return opts.tty.getWindowSize()[1] || opts.defaultWidth;
		if (opts.output.columns) return opts.output.columns;
		if (process.env.CLI_WIDTH) {
			const width = parseInt(process.env.CLI_WIDTH, 10);
			if (!isNaN(width) && width !== 0) return width;
		}
		return opts.defaultWidth;
	}
}));

//#endregion
//#region ../../../../../node_modules/fast-string-truncated-width/dist/utils.js
const getCodePointsLength = (() => {
	const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
	return (input) => {
		let surrogatePairsNr = 0;
		SURROGATE_PAIR_RE.lastIndex = 0;
		while (SURROGATE_PAIR_RE.test(input)) surrogatePairsNr += 1;
		return input.length - surrogatePairsNr;
	};
})();
const isFullWidth = (x) => {
	return x === 12288 || x >= 65281 && x <= 65376 || x >= 65504 && x <= 65510;
};
const isWideNotCJKTNotEmoji = (x) => {
	return x === 8987 || x === 9001 || x >= 12272 && x <= 12287 || x >= 12289 && x <= 12350 || x >= 12441 && x <= 12543 || x >= 12549 && x <= 12591 || x >= 12593 && x <= 12686 || x >= 12688 && x <= 12771 || x >= 12783 && x <= 12830 || x >= 12832 && x <= 12871 || x >= 12880 && x <= 19903 || x >= 65040 && x <= 65049 || x >= 65072 && x <= 65106 || x >= 65108 && x <= 65126 || x >= 65128 && x <= 65131 || x >= 127488 && x <= 127490 || x >= 127504 && x <= 127547 || x >= 127552 && x <= 127560 || x >= 131072 && x <= 196605 || x >= 196608 && x <= 262141;
};

//#endregion
//#region ../../../../../node_modules/fast-string-truncated-width/dist/index.js
const ANSI_RE = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]|\u001b\]8;[^;]*;.*?(?:\u0007|\u001b\u005c)/y;
const CONTROL_RE = /[\x00-\x08\x0A-\x1F\x7F-\x9F]{1,1000}/y;
const CJKT_WIDE_RE = /(?:(?![\uFF61-\uFF9F\uFF00-\uFFEF])[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Tangut}]){1,1000}/uy;
const TAB_RE = /\t{1,1000}/y;
const EMOJI_RE = /[\u{1F1E6}-\u{1F1FF}]{2}|\u{1F3F4}[\u{E0061}-\u{E007A}]{2}[\u{E0030}-\u{E0039}\u{E0061}-\u{E007A}]{1,3}\u{E007F}|(?:\p{Emoji}\uFE0F\u20E3?|\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation})(?:\u200D(?:\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F\u20E3?))*/uy;
const LATIN_RE = /(?:[\x20-\x7E\xA0-\xFF](?!\uFE0F)){1,1000}/y;
const MODIFIER_RE = /\p{M}+/gu;
const NO_TRUNCATION$1 = {
	limit: Infinity,
	ellipsis: ""
};
const getStringTruncatedWidth = (input, truncationOptions = {}, widthOptions = {}) => {
	const LIMIT = truncationOptions.limit ?? Infinity;
	const ELLIPSIS = truncationOptions.ellipsis ?? "";
	const ELLIPSIS_WIDTH = truncationOptions?.ellipsisWidth ?? (ELLIPSIS ? getStringTruncatedWidth(ELLIPSIS, NO_TRUNCATION$1, widthOptions).width : 0);
	const ANSI_WIDTH = 0;
	const CONTROL_WIDTH = widthOptions.controlWidth ?? 0;
	const TAB_WIDTH = widthOptions.tabWidth ?? 8;
	const EMOJI_WIDTH = widthOptions.emojiWidth ?? 2;
	const FULL_WIDTH_WIDTH = 2;
	const REGULAR_WIDTH = widthOptions.regularWidth ?? 1;
	const WIDE_WIDTH = widthOptions.wideWidth ?? FULL_WIDTH_WIDTH;
	const PARSE_BLOCKS = [
		[LATIN_RE, REGULAR_WIDTH],
		[ANSI_RE, ANSI_WIDTH],
		[CONTROL_RE, CONTROL_WIDTH],
		[TAB_RE, TAB_WIDTH],
		[EMOJI_RE, EMOJI_WIDTH],
		[CJKT_WIDE_RE, WIDE_WIDTH]
	];
	let indexPrev = 0;
	let index = 0;
	let length = input.length;
	let lengthExtra = 0;
	let truncationEnabled = false;
	let truncationIndex = length;
	let truncationLimit = Math.max(0, LIMIT - ELLIPSIS_WIDTH);
	let unmatchedStart = 0;
	let unmatchedEnd = 0;
	let width = 0;
	let widthExtra = 0;
	outer: while (true) {
		if (unmatchedEnd > unmatchedStart || index >= length && index > indexPrev) {
			const unmatched = input.slice(unmatchedStart, unmatchedEnd) || input.slice(indexPrev, index);
			lengthExtra = 0;
			for (const char of unmatched.replaceAll(MODIFIER_RE, "")) {
				const codePoint = char.codePointAt(0) || 0;
				if (isFullWidth(codePoint)) widthExtra = FULL_WIDTH_WIDTH;
				else if (isWideNotCJKTNotEmoji(codePoint)) widthExtra = WIDE_WIDTH;
				else widthExtra = REGULAR_WIDTH;
				if (width + widthExtra > truncationLimit) truncationIndex = Math.min(truncationIndex, Math.max(unmatchedStart, indexPrev) + lengthExtra);
				if (width + widthExtra > LIMIT) {
					truncationEnabled = true;
					break outer;
				}
				lengthExtra += char.length;
				width += widthExtra;
			}
			unmatchedStart = unmatchedEnd = 0;
		}
		if (index >= length) break outer;
		for (let i = 0, l = PARSE_BLOCKS.length; i < l; i++) {
			const [BLOCK_RE, BLOCK_WIDTH] = PARSE_BLOCKS[i];
			BLOCK_RE.lastIndex = index;
			if (BLOCK_RE.test(input)) {
				lengthExtra = BLOCK_RE === CJKT_WIDE_RE ? getCodePointsLength(input.slice(index, BLOCK_RE.lastIndex)) : BLOCK_RE === EMOJI_RE ? 1 : BLOCK_RE.lastIndex - index;
				widthExtra = lengthExtra * BLOCK_WIDTH;
				if (width + widthExtra > truncationLimit) truncationIndex = Math.min(truncationIndex, index + Math.floor((truncationLimit - width) / BLOCK_WIDTH));
				if (width + widthExtra > LIMIT) {
					truncationEnabled = true;
					break outer;
				}
				width += widthExtra;
				unmatchedStart = indexPrev;
				unmatchedEnd = index;
				index = indexPrev = BLOCK_RE.lastIndex;
				continue outer;
			}
		}
		index += 1;
	}
	return {
		width: truncationEnabled ? truncationLimit : width,
		index: truncationEnabled ? truncationIndex : length,
		truncated: truncationEnabled,
		ellipsed: truncationEnabled && LIMIT >= ELLIPSIS_WIDTH
	};
};

//#endregion
//#region ../../../../../node_modules/fast-string-width/dist/index.js
const NO_TRUNCATION = {
	limit: Infinity,
	ellipsis: "",
	ellipsisWidth: 0
};
const fastStringWidth = (input, options = {}) => {
	return getStringTruncatedWidth(input, NO_TRUNCATION, options).width;
};

//#endregion
//#region ../../../../../node_modules/fast-wrap-ansi/lib/main.js
const ESC$1 = "\x1B";
const CSI = "";
const END_CODE = 39;
const ANSI_ESCAPE_BELL = "\x07";
const ANSI_CSI = "[";
const ANSI_OSC = "]";
const ANSI_SGR_TERMINATOR = "m";
const ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
const GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");
const getClosingCode = (openingCode) => {
	if (openingCode >= 30 && openingCode <= 37) return 39;
	if (openingCode >= 90 && openingCode <= 97) return 39;
	if (openingCode >= 40 && openingCode <= 47) return 49;
	if (openingCode >= 100 && openingCode <= 107) return 49;
	if (openingCode === 1 || openingCode === 2) return 22;
	if (openingCode === 3) return 23;
	if (openingCode === 4) return 24;
	if (openingCode === 7) return 27;
	if (openingCode === 8) return 28;
	if (openingCode === 9) return 29;
	if (openingCode === 0) return 0;
};
const wrapAnsiCode = (code) => `${ESC$1}${ANSI_CSI}${code}${ANSI_SGR_TERMINATOR}`;
const wrapAnsiHyperlink = (url) => `${ESC$1}${ANSI_ESCAPE_LINK}${url}${ANSI_ESCAPE_BELL}`;
const wrapWord = (rows, word, columns) => {
	const characters = word[Symbol.iterator]();
	let isInsideEscape = false;
	let isInsideLinkEscape = false;
	let lastRow = rows.at(-1);
	let visible = lastRow === void 0 ? 0 : fastStringWidth(lastRow);
	let currentCharacter = characters.next();
	let nextCharacter = characters.next();
	let rawCharacterIndex = 0;
	while (!currentCharacter.done) {
		const character = currentCharacter.value;
		const characterLength = fastStringWidth(character);
		if (visible + characterLength <= columns) rows[rows.length - 1] += character;
		else {
			rows.push(character);
			visible = 0;
		}
		if (character === ESC$1 || character === CSI) {
			isInsideEscape = true;
			isInsideLinkEscape = word.startsWith(ANSI_ESCAPE_LINK, rawCharacterIndex + 1);
		}
		if (isInsideEscape) {
			if (isInsideLinkEscape) {
				if (character === ANSI_ESCAPE_BELL) {
					isInsideEscape = false;
					isInsideLinkEscape = false;
				}
			} else if (character === ANSI_SGR_TERMINATOR) isInsideEscape = false;
		} else {
			visible += characterLength;
			if (visible === columns && !nextCharacter.done) {
				rows.push("");
				visible = 0;
			}
		}
		currentCharacter = nextCharacter;
		nextCharacter = characters.next();
		rawCharacterIndex += character.length;
	}
	lastRow = rows.at(-1);
	if (!visible && lastRow !== void 0 && lastRow.length && rows.length > 1) rows[rows.length - 2] += rows.pop();
};
const stringVisibleTrimSpacesRight = (string) => {
	const words = string.split(" ");
	let last = words.length;
	while (last) {
		if (fastStringWidth(words[last - 1])) break;
		last--;
	}
	if (last === words.length) return string;
	return words.slice(0, last).join(" ") + words.slice(last).join("");
};
const exec = (string, columns, options = {}) => {
	if (options.trim !== false && string.trim() === "") return "";
	let returnValue = "";
	let escapeCode;
	let escapeUrl;
	const words = string.split(" ");
	let rows = [""];
	let rowLength = 0;
	for (let index = 0; index < words.length; index++) {
		const word = words[index];
		if (options.trim !== false) {
			const row = rows.at(-1) ?? "";
			const trimmed = row.trimStart();
			if (row.length !== trimmed.length) {
				rows[rows.length - 1] = trimmed;
				rowLength = fastStringWidth(trimmed);
			}
		}
		if (index !== 0) {
			if (rowLength >= columns && (options.wordWrap === false || options.trim === false)) {
				rows.push("");
				rowLength = 0;
			}
			if (rowLength || options.trim === false) {
				rows[rows.length - 1] += " ";
				rowLength++;
			}
		}
		const wordLength = fastStringWidth(word);
		if (options.hard && wordLength > columns) {
			const remainingColumns = columns - rowLength;
			const breaksStartingThisLine = 1 + Math.floor((wordLength - remainingColumns - 1) / columns);
			if (Math.floor((wordLength - 1) / columns) < breaksStartingThisLine) rows.push("");
			wrapWord(rows, word, columns);
			rowLength = fastStringWidth(rows.at(-1) ?? "");
			continue;
		}
		if (rowLength + wordLength > columns && rowLength && wordLength) {
			if (options.wordWrap === false && rowLength < columns) {
				wrapWord(rows, word, columns);
				rowLength = fastStringWidth(rows.at(-1) ?? "");
				continue;
			}
			rows.push("");
			rowLength = 0;
		}
		if (rowLength + wordLength > columns && options.wordWrap === false) {
			wrapWord(rows, word, columns);
			rowLength = fastStringWidth(rows.at(-1) ?? "");
			continue;
		}
		rows[rows.length - 1] += word;
		rowLength += wordLength;
	}
	if (options.trim !== false) rows = rows.map((row) => stringVisibleTrimSpacesRight(row));
	const preString = rows.join("\n");
	let inSurrogate = false;
	for (let i = 0; i < preString.length; i++) {
		const character = preString[i];
		returnValue += character;
		if (!inSurrogate) {
			inSurrogate = character >= "\ud800" && character <= "\udbff";
			if (inSurrogate) continue;
		} else inSurrogate = false;
		if (character === ESC$1 || character === CSI) {
			GROUP_REGEX.lastIndex = i + 1;
			const groups = GROUP_REGEX.exec(preString)?.groups;
			if (groups?.code !== void 0) {
				const code = Number.parseFloat(groups.code);
				escapeCode = code === END_CODE ? void 0 : code;
			} else if (groups?.uri !== void 0) escapeUrl = groups.uri.length === 0 ? void 0 : groups.uri;
		}
		if (preString[i + 1] === "\n") {
			if (escapeUrl) returnValue += wrapAnsiHyperlink("");
			const closingCode = escapeCode ? getClosingCode(escapeCode) : void 0;
			if (escapeCode && closingCode) returnValue += wrapAnsiCode(closingCode);
		} else if (character === "\n") {
			if (escapeCode && getClosingCode(escapeCode)) returnValue += wrapAnsiCode(escapeCode);
			if (escapeUrl) returnValue += wrapAnsiHyperlink(escapeUrl);
		}
	}
	return returnValue;
};
const CRLF_OR_LF = /\r?\n/;
function wrapAnsi(string, columns, options) {
	return String(string).normalize().split(CRLF_OR_LF).map((line) => exec(line, columns, options)).join("\n");
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/utils.js
var import_cli_width = /* @__PURE__ */ __toESM(require_cli_width(), 1);
/**
* Force line returns at specific width. This function is ANSI code friendly and it'll
* ignore invisible codes during width calculation.
* @param {string} content
* @param {number} width
* @return {string}
*/
function breakLines(content, width) {
	return content.split("\n").flatMap((line) => wrapAnsi(line, width, {
		trim: false,
		hard: true
	}).split("\n").map((str) => str.trimEnd())).join("\n");
}
/**
* Returns the width of the active readline, or 80 as default value.
* @returns {number}
*/
function readlineWidth() {
	return (0, import_cli_width.default)({
		defaultWidth: 80,
		output: readline().output
	});
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/pagination/use-pagination.js
function usePointerPosition({ active, renderedItems, pageSize, loop }) {
	const state = useRef({
		lastPointer: active,
		lastActive: void 0
	});
	const { lastPointer, lastActive } = state.current;
	const middle = Math.floor(pageSize / 2);
	const renderedLength = renderedItems.reduce((acc, item) => acc + item.length, 0);
	const defaultPointerPosition = renderedItems.slice(0, active).reduce((acc, item) => acc + item.length, 0);
	let pointer = defaultPointerPosition;
	if (renderedLength > pageSize) if (loop) {
		/**
		* Creates the next position for the pointer considering an infinitely
		* looping list of items to be rendered on the page.
		*
		* The goal is to progressively move the cursor to the middle position as the user move down, and then keep
		* the cursor there. When the user move up, maintain the cursor position.
		*/
		pointer = lastPointer;
		if (lastActive != null && lastActive < active && active - lastActive < pageSize) pointer = Math.min(middle, Math.abs(active - lastActive) === 1 ? Math.min(lastPointer + (renderedItems[lastActive]?.length ?? 0), Math.max(defaultPointerPosition, lastPointer)) : lastPointer + active - lastActive);
	} else {
		/**
		* Creates the next position for the pointer considering a finite list of
		* items to be rendered on a page.
		*
		* The goal is to keep the pointer in the middle of the page whenever possible, until
		* we reach the bounds of the list (top or bottom). In which case, the cursor moves progressively
		* to the bottom or top of the list.
		*/
		const spaceUnderActive = renderedItems.slice(active).reduce((acc, item) => acc + item.length, 0);
		pointer = spaceUnderActive < pageSize - middle ? pageSize - spaceUnderActive : Math.min(defaultPointerPosition, middle);
	}
	state.current.lastPointer = pointer;
	state.current.lastActive = active;
	return pointer;
}
function usePagination({ items, active, renderItem, pageSize, loop = true }) {
	const width = readlineWidth();
	const bound = (num) => (num % items.length + items.length) % items.length;
	const renderedItems = items.map((item, index) => {
		if (item == null) return [];
		return breakLines(renderItem({
			item,
			index,
			isActive: index === active
		}), width).split("\n");
	});
	const renderedLength = renderedItems.reduce((acc, item) => acc + item.length, 0);
	const renderItemAtIndex = (index) => renderedItems[index] ?? [];
	const pointer = usePointerPosition({
		active,
		renderedItems,
		pageSize,
		loop
	});
	const activeItem = renderItemAtIndex(active).slice(0, pageSize);
	const activeItemPosition = pointer + activeItem.length <= pageSize ? pointer : pageSize - activeItem.length;
	const pageBuffer = Array.from({ length: pageSize });
	pageBuffer.splice(activeItemPosition, activeItem.length, ...activeItem);
	const itemVisited = new Set([active]);
	let bufferPointer = activeItemPosition + activeItem.length;
	let itemPointer = bound(active + 1);
	while (bufferPointer < pageSize && !itemVisited.has(itemPointer) && (loop && renderedLength > pageSize ? itemPointer !== active : itemPointer > active)) {
		const linesToAdd = renderItemAtIndex(itemPointer).slice(0, pageSize - bufferPointer);
		pageBuffer.splice(bufferPointer, linesToAdd.length, ...linesToAdd);
		itemVisited.add(itemPointer);
		bufferPointer += linesToAdd.length;
		itemPointer = bound(itemPointer + 1);
	}
	bufferPointer = activeItemPosition - 1;
	itemPointer = bound(active - 1);
	while (bufferPointer >= 0 && !itemVisited.has(itemPointer) && (loop && renderedLength > pageSize ? itemPointer !== active : itemPointer < active)) {
		const lines = renderItemAtIndex(itemPointer);
		const linesToAdd = lines.slice(Math.max(0, lines.length - bufferPointer - 1));
		pageBuffer.splice(bufferPointer - linesToAdd.length + 1, linesToAdd.length, ...linesToAdd);
		itemVisited.add(itemPointer);
		bufferPointer -= linesToAdd.length;
		itemPointer = bound(itemPointer - 1);
	}
	return pageBuffer.filter((line) => typeof line === "string").join("\n");
}

//#endregion
//#region ../../../../../node_modules/mute-stream/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	const Stream = require("stream");
	var MuteStream = class extends Stream {
		#isTTY = null;
		constructor(opts = {}) {
			super(opts);
			this.writable = this.readable = true;
			this.muted = false;
			this.on("pipe", this._onpipe);
			this.replace = opts.replace;
			this._prompt = opts.prompt || null;
			this._hadControl = false;
		}
		#destSrc(key, def) {
			if (this._dest) return this._dest[key];
			if (this._src) return this._src[key];
			return def;
		}
		#proxy(method, ...args) {
			if (typeof this._dest?.[method] === "function") this._dest[method](...args);
			if (typeof this._src?.[method] === "function") this._src[method](...args);
		}
		get isTTY() {
			if (this.#isTTY !== null) return this.#isTTY;
			return this.#destSrc("isTTY", false);
		}
		set isTTY(val) {
			this.#isTTY = val;
		}
		get rows() {
			return this.#destSrc("rows");
		}
		get columns() {
			return this.#destSrc("columns");
		}
		mute() {
			this.muted = true;
		}
		unmute() {
			this.muted = false;
		}
		_onpipe(src) {
			this._src = src;
		}
		pipe(dest, options) {
			this._dest = dest;
			return super.pipe(dest, options);
		}
		pause() {
			if (this._src) return this._src.pause();
		}
		resume() {
			if (this._src) return this._src.resume();
		}
		write(c) {
			if (this.muted) {
				if (!this.replace) return true;
				if (c.match(/^\u001b/)) {
					if (c.indexOf(this._prompt) === 0) {
						c = c.slice(this._prompt.length);
						c = c.replace(/./g, this.replace);
						c = this._prompt + c;
					}
					this._hadControl = true;
					return this.emit("data", c);
				} else {
					if (this._prompt && this._hadControl && c.indexOf(this._prompt) === 0) {
						this._hadControl = false;
						this.emit("data", this._prompt);
						c = c.slice(this._prompt.length);
					}
					c = c.toString().replace(/./g, this.replace);
				}
			}
			this.emit("data", c);
		}
		end(c) {
			if (this.muted) if (c && this.replace) c = c.toString().replace(/./g, this.replace);
			else c = null;
			if (c) this.emit("data", c);
			this.emit("end");
		}
		destroy(...args) {
			return this.#proxy("destroy", ...args);
		}
		destroySoon(...args) {
			return this.#proxy("destroySoon", ...args);
		}
		close(...args) {
			return this.#proxy("close", ...args);
		}
	};
	module.exports = MuteStream;
}));

//#endregion
//#region ../../../../../node_modules/@inquirer/core/node_modules/signal-exit/dist/mjs/signals.js
/**
* This is not the set of all possible signals.
*
* It IS, however, the set of all signals that trigger
* an exit on either Linux or BSD systems.  Linux is a
* superset of the signal names supported on BSD, and
* the unknown signals just fail to register, so we can
* catch that easily enough.
*
* Windows signals are a different set, since there are
* signals that terminate Windows processes, but don't
* terminate (or don't even exist) on Posix systems.
*
* Don't bother with SIGKILL.  It's uncatchable, which
* means that we can't fire any callbacks anyway.
*
* If a user does happen to register a handler on a non-
* fatal signal like SIGWINCH or something, and then
* exit, it'll end up firing `process.emit('exit')`, so
* the handler will be fired anyway.
*
* SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
* artificially, inherently leave the process in a
* state from which it is not safe to try and enter JS
* listeners.
*/
const signals = [];
signals.push("SIGHUP", "SIGINT", "SIGTERM");
if (process.platform !== "win32") signals.push("SIGALRM", "SIGABRT", "SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
if (process.platform === "linux") signals.push("SIGIO", "SIGPOLL", "SIGPWR", "SIGSTKFLT");

//#endregion
//#region ../../../../../node_modules/@inquirer/core/node_modules/signal-exit/dist/mjs/index.js
const processOk = (process) => !!process && typeof process === "object" && typeof process.removeListener === "function" && typeof process.emit === "function" && typeof process.reallyExit === "function" && typeof process.listeners === "function" && typeof process.kill === "function" && typeof process.pid === "number" && typeof process.on === "function";
const kExitEmitter = Symbol.for("signal-exit emitter");
const global$1 = globalThis;
const ObjectDefineProperty = Object.defineProperty.bind(Object);
var Emitter = class {
	emitted = {
		afterExit: false,
		exit: false
	};
	listeners = {
		afterExit: [],
		exit: []
	};
	count = 0;
	id = Math.random();
	constructor() {
		if (global$1[kExitEmitter]) return global$1[kExitEmitter];
		ObjectDefineProperty(global$1, kExitEmitter, {
			value: this,
			writable: false,
			enumerable: false,
			configurable: false
		});
	}
	on(ev, fn) {
		this.listeners[ev].push(fn);
	}
	removeListener(ev, fn) {
		const list = this.listeners[ev];
		const i = list.indexOf(fn);
		/* c8 ignore start */
		if (i === -1) return;
		/* c8 ignore stop */
		if (i === 0 && list.length === 1) list.length = 0;
		else list.splice(i, 1);
	}
	emit(ev, code, signal) {
		if (this.emitted[ev]) return false;
		this.emitted[ev] = true;
		let ret = false;
		for (const fn of this.listeners[ev]) ret = fn(code, signal) === true || ret;
		if (ev === "exit") ret = this.emit("afterExit", code, signal) || ret;
		return ret;
	}
};
var SignalExitBase = class {};
const signalExitWrap = (handler) => {
	return {
		onExit(cb, opts) {
			return handler.onExit(cb, opts);
		},
		load() {
			return handler.load();
		},
		unload() {
			return handler.unload();
		}
	};
};
var SignalExitFallback = class extends SignalExitBase {
	onExit() {
		return () => {};
	}
	load() {}
	unload() {}
};
var SignalExit = class extends SignalExitBase {
	/* c8 ignore start */
	#hupSig = process$1.platform === "win32" ? "SIGINT" : "SIGHUP";
	/* c8 ignore stop */
	#emitter = new Emitter();
	#process;
	#originalProcessEmit;
	#originalProcessReallyExit;
	#sigListeners = {};
	#loaded = false;
	constructor(process) {
		super();
		this.#process = process;
		this.#sigListeners = {};
		for (const sig of signals) this.#sigListeners[sig] = () => {
			const listeners = this.#process.listeners(sig);
			let { count } = this.#emitter;
			/* c8 ignore start */
			const p = process;
			if (typeof p.__signal_exit_emitter__ === "object" && typeof p.__signal_exit_emitter__.count === "number") count += p.__signal_exit_emitter__.count;
			/* c8 ignore stop */
			if (listeners.length === count) {
				this.unload();
				const ret = this.#emitter.emit("exit", null, sig);
				/* c8 ignore start */
				const s = sig === "SIGHUP" ? this.#hupSig : sig;
				if (!ret) process.kill(process.pid, s);
			}
		};
		this.#originalProcessReallyExit = process.reallyExit;
		this.#originalProcessEmit = process.emit;
	}
	onExit(cb, opts) {
		/* c8 ignore start */
		if (!processOk(this.#process)) return () => {};
		/* c8 ignore stop */
		if (this.#loaded === false) this.load();
		const ev = opts?.alwaysLast ? "afterExit" : "exit";
		this.#emitter.on(ev, cb);
		return () => {
			this.#emitter.removeListener(ev, cb);
			if (this.#emitter.listeners["exit"].length === 0 && this.#emitter.listeners["afterExit"].length === 0) this.unload();
		};
	}
	load() {
		if (this.#loaded) return;
		this.#loaded = true;
		this.#emitter.count += 1;
		for (const sig of signals) try {
			const fn = this.#sigListeners[sig];
			if (fn) this.#process.on(sig, fn);
		} catch (_) {}
		this.#process.emit = (ev, ...a) => {
			return this.#processEmit(ev, ...a);
		};
		this.#process.reallyExit = (code) => {
			return this.#processReallyExit(code);
		};
	}
	unload() {
		if (!this.#loaded) return;
		this.#loaded = false;
		signals.forEach((sig) => {
			const listener = this.#sigListeners[sig];
			/* c8 ignore start */
			if (!listener) throw new Error("Listener not defined for signal: " + sig);
			/* c8 ignore stop */
			try {
				this.#process.removeListener(sig, listener);
			} catch (_) {}
			/* c8 ignore stop */
		});
		this.#process.emit = this.#originalProcessEmit;
		this.#process.reallyExit = this.#originalProcessReallyExit;
		this.#emitter.count -= 1;
	}
	#processReallyExit(code) {
		/* c8 ignore start */
		if (!processOk(this.#process)) return 0;
		this.#process.exitCode = code || 0;
		/* c8 ignore stop */
		this.#emitter.emit("exit", this.#process.exitCode, null);
		return this.#originalProcessReallyExit.call(this.#process, this.#process.exitCode);
	}
	#processEmit(ev, ...args) {
		const og = this.#originalProcessEmit;
		if (ev === "exit" && processOk(this.#process)) {
			if (typeof args[0] === "number") this.#process.exitCode = args[0];
			/* c8 ignore start */
			const ret = og.call(this.#process, ev, ...args);
			/* c8 ignore start */
			this.#emitter.emit("exit", this.#process.exitCode, null);
			/* c8 ignore stop */
			return ret;
		} else return og.call(this.#process, ev, ...args);
	}
};
const process$1 = globalThis.process;
const { onExit, load, unload } = signalExitWrap(processOk(process$1) ? new SignalExit(process$1) : new SignalExitFallback());

//#endregion
//#region ../../../../../node_modules/@inquirer/ansi/dist/index.js
const ESC = "\x1B[";
/** Move cursor to first column */
const cursorLeft = ESC + "G";
/** Hide the cursor */
const cursorHide = ESC + "?25l";
/** Show the cursor */
const cursorShow = ESC + "?25h";
/** Move cursor up by count rows */
const cursorUp = (rows = 1) => rows > 0 ? `${ESC}${rows}A` : "";
/** Move cursor down by count rows */
const cursorDown = (rows = 1) => rows > 0 ? `${ESC}${rows}B` : "";
/** Move cursor to position (x, y) */
const cursorTo = (x, y) => {
	if (typeof y === "number" && !Number.isNaN(y)) return `${ESC}${y + 1};${x + 1}H`;
	return `${ESC}${x + 1}G`;
};
const eraseLine = ESC + "2K";
/** Erase the specified number of lines above the cursor */
const eraseLines = (lines) => lines > 0 ? (eraseLine + cursorUp(1)).repeat(lines - 1) + eraseLine + cursorLeft : "";

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/screen-manager.js
const height = (content) => content.split("\n").length;
const lastLine = (content) => content.split("\n").pop() ?? "";
var ScreenManager = class {
	height = 0;
	extraLinesUnderPrompt = 0;
	cursorPos;
	rl;
	constructor(rl) {
		this.rl = rl;
		this.cursorPos = rl.getCursorPos();
	}
	write(content) {
		this.rl.output.unmute();
		this.rl.output.write(content);
		this.rl.output.mute();
	}
	render(content, bottomContent = "") {
		const rawPromptLine = (0, node_util.stripVTControlCharacters)(lastLine(content));
		let prompt = rawPromptLine;
		if (this.rl.line.length > 0) prompt = prompt.slice(0, -this.rl.line.length);
		this.rl.setPrompt(prompt);
		this.cursorPos = this.rl.getCursorPos();
		const width = readlineWidth();
		content = breakLines(content, width);
		bottomContent = breakLines(bottomContent, width);
		if (rawPromptLine.length % width === 0) content += "\n";
		let output = content + (bottomContent ? "\n" + bottomContent : "");
		const bottomContentHeight = Math.floor(rawPromptLine.length / width) - this.cursorPos.rows + (bottomContent ? height(bottomContent) : 0);
		if (bottomContentHeight > 0) output += cursorUp(bottomContentHeight);
		output += cursorTo(this.cursorPos.cols);
		/**
		* Render and store state for future re-rendering
		*/
		this.write(cursorDown(this.extraLinesUnderPrompt) + eraseLines(this.height) + output);
		this.extraLinesUnderPrompt = bottomContentHeight;
		this.height = height(output);
	}
	checkCursorPos() {
		const cursorPos = this.rl.getCursorPos();
		if (cursorPos.cols !== this.cursorPos.cols) {
			this.write(cursorTo(cursorPos.cols));
			this.cursorPos = cursorPos;
		}
	}
	done({ clearContent }) {
		this.rl.setPrompt("");
		let output = cursorDown(this.extraLinesUnderPrompt);
		output += clearContent ? eraseLines(this.height) : "\n";
		output += cursorShow;
		this.write(output);
		this.rl.close();
	}
};

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/promise-polyfill.js
var PromisePolyfill = class extends Promise {
	static withResolver() {
		let resolve;
		let reject;
		return {
			promise: new Promise((res, rej) => {
				resolve = res;
				reject = rej;
			}),
			resolve,
			reject
		};
	}
};

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/create-prompt.js
var import_lib$1 = /* @__PURE__ */ __toESM(require_lib(), 1);
const nativeSetImmediate = globalThis.setImmediate;
function getCallSites() {
	const _prepareStackTrace = Error.prepareStackTrace;
	let result = [];
	try {
		Error.prepareStackTrace = (_, callSites) => {
			const callSitesWithoutCurrent = callSites.slice(1);
			result = callSitesWithoutCurrent;
			return callSitesWithoutCurrent;
		};
		(/* @__PURE__ */ new Error()).stack;
	} catch {
		return result;
	}
	Error.prepareStackTrace = _prepareStackTrace;
	return result;
}
function createPrompt(view) {
	const callSites = getCallSites();
	const prompt = (config, context = {}) => {
		const { input = process.stdin, signal } = context;
		const cleanups = /* @__PURE__ */ new Set();
		const output = new import_lib$1.default();
		output.pipe(context.output ?? process.stdout);
		output.mute();
		const rl = node_readline.createInterface({
			terminal: true,
			input,
			output
		});
		const screen = new ScreenManager(rl);
		const { promise, resolve, reject } = PromisePolyfill.withResolver();
		const cancel = () => reject(new CancelPromptError());
		if (signal) {
			const abort = () => reject(new AbortPromptError({ cause: signal.reason }));
			if (signal.aborted) {
				abort();
				return Object.assign(promise, { cancel });
			}
			signal.addEventListener("abort", abort);
			cleanups.add(() => signal.removeEventListener("abort", abort));
		}
		cleanups.add(onExit((code, signal) => {
			reject(new ExitPromptError(`User force closed the prompt with ${code} ${signal}`));
		}));
		const sigint = () => reject(new ExitPromptError(`User force closed the prompt with SIGINT`));
		rl.on("SIGINT", sigint);
		cleanups.add(() => rl.removeListener("SIGINT", sigint));
		return withHooks(rl, (cycle) => {
			const hooksCleanup = node_async_hooks.AsyncResource.bind(() => effectScheduler.clearAll());
			rl.on("close", hooksCleanup);
			cleanups.add(() => rl.removeListener("close", hooksCleanup));
			const startCycle = () => {
				const checkCursorPos = () => screen.checkCursorPos();
				rl.input.on("keypress", checkCursorPos);
				cleanups.add(() => rl.input.removeListener("keypress", checkCursorPos));
				cycle(() => {
					try {
						const nextView = view(config, (value) => {
							setImmediate(() => resolve(value));
						});
						if (nextView === void 0) {
							const callerFilename = callSites[1]?.getFileName();
							throw new Error(`Prompt functions must return a string.\n    at ${callerFilename}`);
						}
						const [content, bottomContent] = typeof nextView === "string" ? [nextView] : nextView;
						screen.render(content, bottomContent);
						effectScheduler.run();
					} catch (error) {
						reject(error);
					}
				});
			};
			if ("readableFlowing" in input) nativeSetImmediate(startCycle);
			else startCycle();
			return Object.assign(promise.then((answer) => {
				effectScheduler.clearAll();
				return answer;
			}, (error) => {
				effectScheduler.clearAll();
				throw error;
			}).finally(() => {
				cleanups.forEach((cleanup) => cleanup());
				screen.done({ clearContent: Boolean(context.clearPromptOnDone) });
				output.end();
			}).then(() => promise), { cancel });
		});
	};
	return prompt;
}

//#endregion
//#region ../../../../../node_modules/@inquirer/core/dist/lib/Separator.js
/**
* Separator object
* Used to space/separate choices group
*/
var Separator = class {
	separator = (0, node_util.styleText)("dim", Array.from({ length: 15 }).join(figures.line));
	type = "separator";
	constructor(separator) {
		if (separator) this.separator = separator;
	}
	static isSeparator(choice) {
		return Boolean(choice && typeof choice === "object" && "type" in choice && choice.type === "separator");
	}
};

//#endregion
//#region ../../../../../node_modules/@inquirer/confirm/dist/index.js
function getBooleanValue(value, defaultValue) {
	let answer = defaultValue !== false;
	if (/^(y|yes)/i.test(value)) answer = true;
	else if (/^(n|no)/i.test(value)) answer = false;
	return answer;
}
function boolToString(value) {
	return value ? "Yes" : "No";
}
var dist_default$1 = createPrompt((config, done) => {
	const { transformer = boolToString } = config;
	const [status, setStatus] = useState("idle");
	const [value, setValue] = useState("");
	const theme = makeTheme(config.theme);
	const prefix = usePrefix({
		status,
		theme
	});
	useKeypress((key, rl) => {
		if (status !== "idle") return;
		if (isEnterKey(key)) {
			const answer = getBooleanValue(value, config.default);
			setValue(transformer(answer));
			setStatus("done");
			done(answer);
		} else if (isTabKey(key)) {
			const answer = boolToString(!getBooleanValue(value, config.default));
			rl.clearLine(0);
			rl.write(answer);
			setValue(answer);
		} else setValue(rl.line);
	});
	let formattedValue = value;
	let defaultValue = "";
	if (status === "done") formattedValue = theme.style.answer(value);
	else defaultValue = ` ${theme.style.defaultAnswer(config.default === false ? "y/N" : "Y/n")}`;
	return `${prefix} ${theme.style.message(config.message, status)}${defaultValue} ${formattedValue}`;
});

//#endregion
//#region ../../../../../node_modules/@inquirer/select/dist/index.js
const selectTheme = {
	icon: { cursor: figures.pointer },
	style: {
		disabled: (text) => (0, node_util.styleText)("dim", text),
		description: (text) => (0, node_util.styleText)("cyan", text),
		keysHelpTip: (keys) => keys.map(([key, action]) => `${(0, node_util.styleText)("bold", key)} ${(0, node_util.styleText)("dim", action)}`).join((0, node_util.styleText)("dim", " • "))
	},
	i18n: { disabledError: "This option is disabled and cannot be selected." },
	indexMode: "hidden",
	keybindings: []
};
function isSelectable(item) {
	return !Separator.isSeparator(item) && !item.disabled;
}
function isNavigable(item) {
	return !Separator.isSeparator(item);
}
function normalizeChoices(choices) {
	return choices.map((choice) => {
		if (Separator.isSeparator(choice)) return choice;
		if (typeof choice !== "object" || choice === null || !("value" in choice)) {
			const name = String(choice);
			return {
				value: choice,
				name,
				short: name,
				disabled: false
			};
		}
		const name = choice.name ?? String(choice.value);
		const normalizedChoice = {
			value: choice.value,
			name,
			short: choice.short ?? name,
			disabled: choice.disabled ?? false
		};
		if (choice.description) normalizedChoice.description = choice.description;
		return normalizedChoice;
	});
}
var dist_default = createPrompt((config, done) => {
	const { loop = true, pageSize = 7 } = config;
	const theme = makeTheme(selectTheme, config.theme);
	const { keybindings } = theme;
	const [status, setStatus] = useState("idle");
	const prefix = usePrefix({
		status,
		theme
	});
	const searchTimeoutRef = useRef();
	const searchEnabled = !keybindings.includes("vim");
	const items = useMemo(() => normalizeChoices(config.choices), [config.choices]);
	const bounds = useMemo(() => {
		const first = items.findIndex(isNavigable);
		const last = items.findLastIndex(isNavigable);
		if (first === -1) throw new ValidationError("[select prompt] No selectable choices. All choices are disabled.");
		return {
			first,
			last
		};
	}, [items]);
	const defaultItemIndex = useMemo(() => {
		if (!("default" in config)) return -1;
		return items.findIndex((item) => isSelectable(item) && item.value === config.default);
	}, [config.default, items]);
	const [active, setActive] = useState(defaultItemIndex === -1 ? bounds.first : defaultItemIndex);
	const selectedChoice = items[active];
	const [errorMsg, setError] = useState();
	useKeypress((key, rl) => {
		clearTimeout(searchTimeoutRef.current);
		if (errorMsg) setError(void 0);
		if (isEnterKey(key)) if (selectedChoice.disabled) setError(theme.i18n.disabledError);
		else {
			setStatus("done");
			done(selectedChoice.value);
		}
		else if (isUpKey(key, keybindings) || isDownKey(key, keybindings)) {
			rl.clearLine(0);
			if (loop || isUpKey(key, keybindings) && active !== bounds.first || isDownKey(key, keybindings) && active !== bounds.last) {
				const offset = isUpKey(key, keybindings) ? -1 : 1;
				let next = active;
				do
					next = (next + offset + items.length) % items.length;
				while (!isNavigable(items[next]));
				setActive(next);
			}
		} else if (isNumberKey(key) && !Number.isNaN(Number(rl.line))) {
			const selectedIndex = Number(rl.line) - 1;
			let selectableIndex = -1;
			const position = items.findIndex((item) => {
				if (Separator.isSeparator(item)) return false;
				selectableIndex++;
				return selectableIndex === selectedIndex;
			});
			const item = items[position];
			if (item != null && isSelectable(item)) setActive(position);
			searchTimeoutRef.current = setTimeout(() => {
				rl.clearLine(0);
			}, 700);
		} else if (isBackspaceKey(key)) rl.clearLine(0);
		else if (searchEnabled) {
			const searchTerm = rl.line.toLowerCase();
			const matchIndex = items.findIndex((item) => {
				if (Separator.isSeparator(item) || !isSelectable(item)) return false;
				return item.name.toLowerCase().startsWith(searchTerm);
			});
			if (matchIndex !== -1) setActive(matchIndex);
			searchTimeoutRef.current = setTimeout(() => {
				rl.clearLine(0);
			}, 700);
		}
	});
	useEffect(() => () => {
		clearTimeout(searchTimeoutRef.current);
	}, []);
	const message = theme.style.message(config.message, status);
	const helpLine = theme.style.keysHelpTip([["↑↓", "navigate"], ["⏎", "select"]]);
	let separatorCount = 0;
	const page = usePagination({
		items,
		active,
		renderItem({ item, isActive, index }) {
			if (Separator.isSeparator(item)) {
				separatorCount++;
				return ` ${item.separator}`;
			}
			const cursor = isActive ? theme.icon.cursor : " ";
			const indexLabel = theme.indexMode === "number" ? `${index + 1 - separatorCount}. ` : "";
			if (item.disabled) {
				const disabledLabel = typeof item.disabled === "string" ? item.disabled : "(disabled)";
				const disabledCursor = isActive ? theme.icon.cursor : "-";
				return theme.style.disabled(`${disabledCursor} ${indexLabel}${item.name} ${disabledLabel}`);
			}
			return (isActive ? theme.style.highlight : (x) => x)(`${cursor} ${indexLabel}${item.name}`);
		},
		pageSize,
		loop
	});
	if (status === "done") return [
		prefix,
		message,
		theme.style.answer(selectedChoice.short)
	].filter(Boolean).join(" ");
	const { description } = selectedChoice;
	return `${[
		[prefix, message].filter(Boolean).join(" "),
		page,
		" ",
		description ? theme.style.description(description) : "",
		errorMsg ? theme.style.error(errorMsg) : "",
		helpLine
	].filter(Boolean).join("\n").trimEnd()}${cursorHide}`;
});

//#endregion
//#region ../../../../../node_modules/minimist/index.js
var require_minimist = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	function hasKey(obj, keys) {
		var o = obj;
		keys.slice(0, -1).forEach(function(key) {
			o = o[key] || {};
		});
		return keys[keys.length - 1] in o;
	}
	function isNumber(x) {
		if (typeof x === "number") return true;
		if (/^0x[0-9a-f]+$/i.test(x)) return true;
		return /^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/.test(x);
	}
	function isConstructorOrProto(obj, key) {
		return key === "constructor" && typeof obj[key] === "function" || key === "__proto__";
	}
	module.exports = function(args, opts) {
		if (!opts) opts = {};
		var flags = {
			bools: {},
			strings: {},
			unknownFn: null
		};
		if (typeof opts.unknown === "function") flags.unknownFn = opts.unknown;
		if (typeof opts.boolean === "boolean" && opts.boolean) flags.allBools = true;
		else [].concat(opts.boolean).filter(Boolean).forEach(function(key) {
			flags.bools[key] = true;
		});
		var aliases = {};
		function aliasIsBoolean(key) {
			return aliases[key].some(function(x) {
				return flags.bools[x];
			});
		}
		Object.keys(opts.alias || {}).forEach(function(key) {
			aliases[key] = [].concat(opts.alias[key]);
			aliases[key].forEach(function(x) {
				aliases[x] = [key].concat(aliases[key].filter(function(y) {
					return x !== y;
				}));
			});
		});
		[].concat(opts.string).filter(Boolean).forEach(function(key) {
			flags.strings[key] = true;
			if (aliases[key]) [].concat(aliases[key]).forEach(function(k) {
				flags.strings[k] = true;
			});
		});
		var defaults = opts.default || {};
		var argv = { _: [] };
		function argDefined(key, arg) {
			return flags.allBools && /^--[^=]+$/.test(arg) || flags.strings[key] || flags.bools[key] || aliases[key];
		}
		function setKey(obj, keys, value) {
			var o = obj;
			for (var i = 0; i < keys.length - 1; i++) {
				var key = keys[i];
				if (isConstructorOrProto(o, key)) return;
				if (o[key] === void 0) o[key] = {};
				if (o[key] === Object.prototype || o[key] === Number.prototype || o[key] === String.prototype) o[key] = {};
				if (o[key] === Array.prototype) o[key] = [];
				o = o[key];
			}
			var lastKey = keys[keys.length - 1];
			if (isConstructorOrProto(o, lastKey)) return;
			if (o === Object.prototype || o === Number.prototype || o === String.prototype) o = {};
			if (o === Array.prototype) o = [];
			if (o[lastKey] === void 0 || flags.bools[lastKey] || typeof o[lastKey] === "boolean") o[lastKey] = value;
			else if (Array.isArray(o[lastKey])) o[lastKey].push(value);
			else o[lastKey] = [o[lastKey], value];
		}
		function setArg(key, val, arg) {
			if (arg && flags.unknownFn && !argDefined(key, arg)) {
				if (flags.unknownFn(arg) === false) return;
			}
			var value = !flags.strings[key] && isNumber(val) ? Number(val) : val;
			setKey(argv, key.split("."), value);
			(aliases[key] || []).forEach(function(x) {
				setKey(argv, x.split("."), value);
			});
		}
		Object.keys(flags.bools).forEach(function(key) {
			setArg(key, defaults[key] === void 0 ? false : defaults[key]);
		});
		var notFlags = [];
		if (args.indexOf("--") !== -1) {
			notFlags = args.slice(args.indexOf("--") + 1);
			args = args.slice(0, args.indexOf("--"));
		}
		for (var i = 0; i < args.length; i++) {
			var arg = args[i];
			var key;
			var next;
			if (/^--.+=/.test(arg)) {
				var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
				key = m[1];
				var value = m[2];
				if (flags.bools[key]) value = value !== "false";
				setArg(key, value, arg);
			} else if (/^--no-.+/.test(arg)) {
				key = arg.match(/^--no-(.+)/)[1];
				setArg(key, false, arg);
			} else if (/^--.+/.test(arg)) {
				key = arg.match(/^--(.+)/)[1];
				next = args[i + 1];
				if (next !== void 0 && !/^(-|--)[^-]/.test(next) && !flags.bools[key] && !flags.allBools && (aliases[key] ? !aliasIsBoolean(key) : true)) {
					setArg(key, next, arg);
					i += 1;
				} else if (/^(true|false)$/.test(next)) {
					setArg(key, next === "true", arg);
					i += 1;
				} else setArg(key, flags.strings[key] ? "" : true, arg);
			} else if (/^-[^-]+/.test(arg)) {
				var letters = arg.slice(1, -1).split("");
				var broken = false;
				for (var j = 0; j < letters.length; j++) {
					next = arg.slice(j + 2);
					if (next === "-") {
						setArg(letters[j], next, arg);
						continue;
					}
					if (/[A-Za-z]/.test(letters[j]) && next[0] === "=") {
						setArg(letters[j], next.slice(1), arg);
						broken = true;
						break;
					}
					if (/[A-Za-z]/.test(letters[j]) && /-?\d+(\.\d*)?(e-?\d+)?$/.test(next)) {
						setArg(letters[j], next, arg);
						broken = true;
						break;
					}
					if (letters[j + 1] && letters[j + 1].match(/\W/)) {
						setArg(letters[j], arg.slice(j + 2), arg);
						broken = true;
						break;
					} else setArg(letters[j], flags.strings[letters[j]] ? "" : true, arg);
				}
				key = arg.slice(-1)[0];
				if (!broken && key !== "-") if (args[i + 1] && !/^(-|--)[^-]/.test(args[i + 1]) && !flags.bools[key] && (aliases[key] ? !aliasIsBoolean(key) : true)) {
					setArg(key, args[i + 1], arg);
					i += 1;
				} else if (args[i + 1] && /^(true|false)$/.test(args[i + 1])) {
					setArg(key, args[i + 1] === "true", arg);
					i += 1;
				} else setArg(key, flags.strings[key] ? "" : true, arg);
			} else {
				if (!flags.unknownFn || flags.unknownFn(arg) !== false) argv._.push(flags.strings._ || !isNumber(arg) ? arg : Number(arg));
				if (opts.stopEarly) {
					argv._.push.apply(argv._, args.slice(i + 1));
					break;
				}
			}
		}
		Object.keys(defaults).forEach(function(k) {
			if (!hasKey(argv, k.split("."))) {
				setKey(argv, k.split("."), defaults[k]);
				(aliases[k] || []).forEach(function(x) {
					setKey(argv, x.split("."), defaults[k]);
				});
			}
		});
		if (opts["--"]) argv["--"] = notFlags.slice();
		else notFlags.forEach(function(k) {
			argv._.push(k);
		});
		return argv;
	};
}));

//#endregion
//#region src/adapters/base.ts
var import_minimist = /* @__PURE__ */ __toESM(require_minimist());
/**
* @maxsim/adapters — Shared base utilities extracted from bin/install.js
*/
/**
* Expand ~ to home directory (shell doesn't expand in env vars passed to node)
*/
function expandTilde(filePath) {
	if (filePath && filePath.startsWith("~/")) return node_path.join(node_os.homedir(), filePath.slice(2));
	return filePath;
}
/**
* Process Co-Authored-By lines based on attribution setting.
* @param content - File content to process
* @param attribution - null=remove, undefined=keep default, string=replace
*/
function processAttribution(content, attribution) {
	if (attribution === null) return content.replace(/(\r?\n){2}Co-Authored-By:.*$/gim, "");
	if (attribution === void 0) return content;
	const safeAttribution = attribution.replace(/\$/g, "$$$$");
	return content.replace(/Co-Authored-By:.*$/gim, `Co-Authored-By: ${safeAttribution}`);
}
/**
* Build a hook command path using forward slashes for cross-platform compatibility.
*/
function buildHookCommand(configDir, hookName) {
	return `node "${configDir.replace(/\\/g, "/") + "/hooks/" + hookName}"`;
}
/**
* Read and parse settings.json, returning empty object if it doesn't exist.
*/
function readSettings(settingsPath) {
	if (node_fs.existsSync(settingsPath)) try {
		return JSON.parse(node_fs.readFileSync(settingsPath, "utf8"));
	} catch {
		return {};
	}
	return {};
}
/**
* Write settings.json with proper formatting.
*/
function writeSettings(settingsPath, settings) {
	node_fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + "\n");
}

//#endregion
//#region src/adapters/claude.ts
/**
* @maxsim/adapters — Claude Code adapter
*
* Ports the Claude-specific logic from bin/install.js:
*   - getGlobalDir('claude', ...)  (lines 135-142)
*   - getDirName('claude')         (line 49)
*   - getConfigDirFromHome('claude', isGlobal) (lines 58-72)
*   - copyWithPathReplacement for Claude (lines 839-892)
*/
/**
* Get the global config directory for Claude Code.
* Priority: explicitDir > CLAUDE_CONFIG_DIR env > ~/.claude
*/
function getGlobalDir$1(explicitDir) {
	if (explicitDir) return expandTilde(explicitDir);
	if (process.env.CLAUDE_CONFIG_DIR) return expandTilde(process.env.CLAUDE_CONFIG_DIR);
	return node_path.join(node_os.homedir(), ".claude");
}
/**
* Get the config directory path relative to home for hook templating.
* Used for path.join(homeDir, '<configDir>', ...) replacement in hooks.
*/
function getConfigDirFromHome$1(isGlobal) {
	return "'.claude'";
}
/**
* Transform markdown content for Claude Code installation.
* For Claude, this is path replacement only — no frontmatter conversion needed.
* Replaces ~/.claude/ and ./.claude/ references with the actual install path prefix.
*/
function transformContent(content, pathPrefix) {
	const globalClaudeRegex = /~\/\.claude\//g;
	const localClaudeRegex = /\.\/\.claude\//g;
	let result = content.replace(globalClaudeRegex, pathPrefix);
	result = result.replace(localClaudeRegex, `./.claude/`);
	return result;
}
/**
* Claude Code adapter configuration.
* Claude uses nested command structure (commands/maxsim/*.md).
*/
const claudeAdapter = {
	runtime: "claude",
	dirName: ".claude",
	getGlobalDir: getGlobalDir$1,
	getConfigDirFromHome: getConfigDirFromHome$1,
	transformContent,
	commandStructure: "nested"
};

//#endregion
//#region src/install/shared.ts
const pkg = JSON.parse(node_fs.readFileSync(node_path.resolve(__dirname, "..", "package.json"), "utf-8"));
const templatesRoot = node_path.resolve(__dirname, "assets", "templates");
const builtInSkills = [
	"tdd",
	"systematic-debugging",
	"verification-before-completion",
	"simplify",
	"code-review",
	"memory-management",
	"using-maxsim"
];
/**
* Get the global config directory, using the Claude adapter
*/
function getGlobalDir(explicitDir = null) {
	return claudeAdapter.getGlobalDir(explicitDir);
}
/**
* Get the config directory path relative to home for hook templating
*/
function getConfigDirFromHome(isGlobal) {
	return claudeAdapter.getConfigDirFromHome(isGlobal);
}
/**
* Get the local directory name
*/
function getDirName() {
	return claudeAdapter.dirName;
}
/**
* Recursively remove a directory, handling Windows read-only file attributes.
* fs-extra handles cross-platform edge cases (EPERM on Windows, symlinks, etc.)
*/
function safeRmDir(dirPath) {
	import_lib.default.removeSync(dirPath);
}
/**
* Recursively copy a directory (dereferences symlinks)
*/
function copyDirRecursive(src, dest) {
	import_lib.default.copySync(src, dest, { dereference: true });
}
/**
* Verify a directory exists and contains files.
* If expectedFiles is provided, also checks that those specific files exist inside the directory.
*/
function verifyInstalled(dirPath, description, expectedFiles) {
	if (!node_fs.existsSync(dirPath)) {
		console.error(`  \u2717 Failed to install ${description}: directory not created`);
		return false;
	}
	try {
		if (node_fs.readdirSync(dirPath).length === 0) {
			console.error(`  \u2717 Failed to install ${description}: directory is empty`);
			return false;
		}
	} catch (e) {
		console.error(`  \u2717 Failed to install ${description}: ${e.message}`);
		return false;
	}
	if (expectedFiles && expectedFiles.length > 0) {
		const missing = expectedFiles.filter((f) => !node_fs.existsSync(node_path.join(dirPath, f)));
		if (missing.length > 0) {
			console.error(`  \u2717 Failed to install ${description}: missing files: ${missing.join(", ")}`);
			return false;
		}
	}
	return true;
}
/**
* Verify a file exists
*/
function verifyFileInstalled(filePath, description) {
	if (!node_fs.existsSync(filePath)) {
		console.error(`  \u2717 Failed to install ${description}: file not created`);
		return false;
	}
	return true;
}
/**
* Verify that all major install components are present. Uses the manifest
* (if available) to check individual files; otherwise falls back to
* directory-level checks.
*
* Returns an object with `complete` (boolean) and `missing` (list of
* component names that are absent or incomplete).
*/
function verifyInstallComplete(configDir, _runtime, manifest = null) {
	const missing = [];
	if (manifest && manifest.files) {
		for (const relPath of Object.keys(manifest.files)) if (!node_fs.existsSync(node_path.join(configDir, relPath))) missing.push(relPath);
		return {
			complete: missing.length === 0,
			missing
		};
	}
	const components = [
		{
			dir: node_path.join(configDir, "maxsim"),
			label: "maxsim (workflows/templates)"
		},
		{
			dir: node_path.join(configDir, "agents"),
			label: "agents"
		},
		{
			dir: node_path.join(configDir, "commands", "maxsim"),
			label: "commands"
		},
		{
			dir: node_path.join(configDir, "hooks"),
			label: "hooks"
		}
	];
	for (const { dir, label } of components) if (!node_fs.existsSync(dir)) missing.push(label);
	else try {
		if (node_fs.readdirSync(dir).length === 0) missing.push(label);
	} catch {
		missing.push(label);
	}
	return {
		complete: missing.length === 0,
		missing
	};
}

//#endregion
//#region src/install/adapters.ts
let attributionCached = false;
let attributionValue;
/**
* Get commit attribution setting for Claude Code
* @returns null = remove, undefined = keep default, string = custom
*/
function getCommitAttribution(explicitConfigDir) {
	if (attributionCached) return attributionValue;
	const attr = readSettings(node_path.join(getGlobalDir(explicitConfigDir), "settings.json")).attribution;
	if (!attr || attr.commit === void 0) attributionValue = void 0;
	else if (attr.commit === "") attributionValue = null;
	else attributionValue = attr.commit;
	attributionCached = true;
	return attributionValue;
}

//#endregion
//#region src/install/dashboard.ts
/** Check whether the current process is running with admin/root privileges. */
function isElevated() {
	if (process.platform === "win32") try {
		(0, node_child_process.execSync)("net session", { stdio: "pipe" });
		return true;
	} catch {
		return false;
	}
	return process.getuid?.() === 0;
}
/**
* Add a firewall rule to allow inbound traffic on the given port.
* Handles Windows (netsh), Linux (ufw / iptables), and macOS (no rule needed).
*/
function applyFirewallRule(port) {
	const platform = process.platform;
	try {
		if (platform === "win32") {
			const cmd = `netsh advfirewall firewall add rule name="MAXSIM Dashboard" dir=in action=allow protocol=TCP localport=${port}`;
			if (isElevated()) {
				(0, node_child_process.execSync)(cmd, { stdio: "pipe" });
				console.log(chalk.green("  ✓ Windows Firewall rule added for port " + port));
			} else {
				console.log(chalk.gray("  Requesting administrator privileges for firewall rule..."));
				(0, node_child_process.execSync)(`powershell -NoProfile -Command "${`Start-Process cmd -ArgumentList '/c ${cmd}' -Verb RunAs -Wait`}"`, { stdio: "pipe" });
				console.log(chalk.green("  ✓ Windows Firewall rule added for port " + port));
			}
		} else if (platform === "linux") {
			const sudoPrefix = isElevated() ? "" : "sudo ";
			try {
				(0, node_child_process.execSync)(`${sudoPrefix}ufw allow ${port}/tcp`, { stdio: "pipe" });
				console.log(chalk.green("  ✓ UFW rule added for port " + port));
			} catch {
				try {
					(0, node_child_process.execSync)(`${sudoPrefix}iptables -A INPUT -p tcp --dport ${port} -j ACCEPT`, { stdio: "pipe" });
					console.log(chalk.green("  ✓ iptables rule added for port " + port));
				} catch {
					console.log(chalk.yellow(`  \u26a0 Could not add firewall rule automatically. Run: sudo ufw allow ${port}/tcp`));
				}
			}
		} else if (platform === "darwin") console.log(chalk.gray("  macOS: No firewall rule needed (inbound connections are allowed by default)"));
	} catch (err) {
		console.warn(chalk.yellow(`  \u26a0 Firewall rule failed: ${err.message}`));
		console.warn(chalk.gray(`  You may need to manually allow port ${port} through your firewall.`));
	}
}
/**
* Handle the `dashboard` subcommand — refresh assets, install node-pty, launch server
*/
async function runDashboardSubcommand(argv) {
	const { spawn: spawnDash, execSync: execSyncDash } = await import("node:child_process");
	const dashboardAssetSrc = node_path.resolve(__dirname, "assets", "dashboard");
	const installDir = node_path.join(process.cwd(), ".claude");
	const installDashDir = node_path.join(installDir, "dashboard");
	if (node_fs.existsSync(dashboardAssetSrc)) {
		const nodeModulesDir = node_path.join(installDashDir, "node_modules");
		const nodeModulesTmp = node_path.join(installDir, "_dashboard_node_modules_tmp");
		const hadNodeModules = node_fs.existsSync(nodeModulesDir);
		if (hadNodeModules) node_fs.renameSync(nodeModulesDir, nodeModulesTmp);
		safeRmDir(installDashDir);
		node_fs.mkdirSync(installDashDir, { recursive: true });
		copyDirRecursive(dashboardAssetSrc, installDashDir);
		if (hadNodeModules && node_fs.existsSync(nodeModulesTmp)) node_fs.renameSync(nodeModulesTmp, nodeModulesDir);
		const dashConfigPath = node_path.join(installDir, "dashboard.json");
		if (!node_fs.existsSync(dashConfigPath)) node_fs.writeFileSync(dashConfigPath, JSON.stringify({ projectCwd: process.cwd() }, null, 2) + "\n");
	}
	const localDashboard = node_path.join(process.cwd(), ".claude", "dashboard", "server.js");
	const globalDashboard = node_path.join(node_os.homedir(), ".claude", "dashboard", "server.js");
	let serverPath = null;
	if (node_fs.existsSync(localDashboard)) serverPath = localDashboard;
	else if (node_fs.existsSync(globalDashboard)) serverPath = globalDashboard;
	if (!serverPath) {
		console.log(chalk.yellow("\n  Dashboard not available.\n"));
		console.log("  Install MAXSIM first: " + chalk.cyan("npx maxsimcli@latest") + "\n");
		process.exit(0);
	}
	const forceNetwork = !!argv["network"];
	const dashboardDir = node_path.dirname(serverPath);
	const dashboardConfigPath = node_path.join(node_path.dirname(dashboardDir), "dashboard.json");
	let projectCwd = process.cwd();
	let networkMode = forceNetwork;
	if (node_fs.existsSync(dashboardConfigPath)) try {
		const config = JSON.parse(node_fs.readFileSync(dashboardConfigPath, "utf8"));
		if (config.projectCwd) projectCwd = config.projectCwd;
		if (!forceNetwork) networkMode = config.networkMode ?? false;
	} catch {}
	const dashDirForPty = node_path.dirname(serverPath);
	const ptyModulePath = node_path.join(dashDirForPty, "node_modules", "node-pty");
	if (!node_fs.existsSync(ptyModulePath)) {
		console.log(chalk.gray("  Installing node-pty for terminal support..."));
		try {
			const dashPkgPath = node_path.join(dashDirForPty, "package.json");
			if (!node_fs.existsSync(dashPkgPath)) node_fs.writeFileSync(dashPkgPath, "{\"private\":true}\n");
			execSyncDash("npm install node-pty --save-optional --no-audit --no-fund --loglevel=error", {
				cwd: dashDirForPty,
				stdio: "inherit",
				timeout: 12e4
			});
		} catch {
			console.warn(chalk.yellow("  node-pty installation failed — terminal will be unavailable."));
		}
	}
	console.log(chalk.blue("Starting dashboard..."));
	console.log(chalk.gray(`  Project: ${projectCwd}`));
	console.log(chalk.gray(`  Server:  ${serverPath}`));
	if (networkMode) console.log(chalk.gray("  Network: enabled (local network access + QR code)"));
	console.log("");
	spawnDash(process.execPath, [serverPath], {
		cwd: dashboardDir,
		detached: true,
		stdio: "ignore",
		env: {
			...process.env,
			MAXSIM_PROJECT_CWD: projectCwd,
			MAXSIM_NETWORK_MODE: networkMode ? "1" : "0",
			NODE_ENV: "production"
		}
	}).unref();
	const POLL_INTERVAL_MS = 500;
	const POLL_TIMEOUT_MS = 2e4;
	const HEALTH_TIMEOUT_MS = 1e3;
	const DEFAULT_PORT = 3333;
	const PORT_RANGE_END = 3343;
	let foundUrl = null;
	const deadline = Date.now() + POLL_TIMEOUT_MS;
	while (Date.now() < deadline) {
		await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
		for (let p = DEFAULT_PORT; p <= PORT_RANGE_END; p++) try {
			const controller = new AbortController();
			const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
			const res = await fetch(`http://localhost:${p}/api/health`, { signal: controller.signal });
			clearTimeout(timer);
			if (res.ok) {
				if ((await res.json()).status === "ok") {
					foundUrl = `http://localhost:${p}`;
					break;
				}
			}
		} catch {}
		if (foundUrl) break;
	}
	if (foundUrl) console.log(chalk.green(`  Dashboard ready at ${foundUrl}`));
	else console.log(chalk.yellow("\n  Dashboard did not respond after 20s. The server may still be starting — check http://localhost:3333"));
	process.exit(0);
}

//#endregion
//#region src/install/hooks.ts
/**
* Clean up orphaned files from previous MAXSIM versions
*/
function cleanupOrphanedFiles(configDir) {
	for (const relPath of ["hooks/maxsim-notify.sh", "hooks/statusline.js"]) {
		const fullPath = node_path.join(configDir, relPath);
		if (node_fs.existsSync(fullPath)) {
			node_fs.unlinkSync(fullPath);
			console.log(`  ${chalk.green("✓")} Removed orphaned ${relPath}`);
		}
	}
}
/**
* Clean up orphaned hook registrations from settings.json
*/
function cleanupOrphanedHooks(settings) {
	const orphanedHookPatterns = [
		"maxsim-notify.sh",
		"hooks/statusline.js",
		"maxsim-intel-index.js",
		"maxsim-intel-session.js",
		"maxsim-intel-prune.js"
	];
	let cleanedHooks = false;
	const hooks = settings.hooks;
	if (hooks) for (const eventType of Object.keys(hooks)) {
		const hookEntries = hooks[eventType];
		if (Array.isArray(hookEntries)) hooks[eventType] = hookEntries.filter((entry) => {
			if (entry.hooks && Array.isArray(entry.hooks)) {
				if (entry.hooks.some((h) => h.command && orphanedHookPatterns.some((pattern) => h.command.includes(pattern)))) {
					cleanedHooks = true;
					return false;
				}
			}
			return true;
		});
	}
	if (cleanedHooks) console.log(`  ${chalk.green("✓")} Removed orphaned hook registrations`);
	const statusLine = settings.statusLine;
	if (statusLine && statusLine.command && statusLine.command.includes("statusline.js") && !statusLine.command.includes("maxsim-statusline.js")) {
		statusLine.command = statusLine.command.replace(/statusline\.js/, "maxsim-statusline.js");
		console.log(`  ${chalk.green("✓")} Updated statusline path (statusline.js \u2192 maxsim-statusline.js)`);
	}
	return settings;
}
/**
* Install hook files and configure settings.json
*/
function installHookFiles(targetDir, isGlobal, failures) {
	let hooksSrc = null;
	const bundledHooksDir = node_path.resolve(__dirname, "assets", "hooks");
	if (node_fs.existsSync(bundledHooksDir)) hooksSrc = bundledHooksDir;
	else console.warn(`  ${chalk.yellow("!")} bundled hooks not found - hooks will not be installed`);
	if (hooksSrc) {
		const spinner = ora({
			text: "Installing hooks...",
			color: "cyan"
		}).start();
		const hooksDest = node_path.join(targetDir, "hooks");
		node_fs.mkdirSync(hooksDest, { recursive: true });
		const hookEntries = node_fs.readdirSync(hooksSrc);
		const configDirReplacement = getConfigDirFromHome(isGlobal);
		for (const entry of hookEntries) {
			const srcFile = node_path.join(hooksSrc, entry);
			if (node_fs.statSync(srcFile).isFile() && entry.endsWith(".cjs") && !entry.includes(".d.")) {
				const destName = entry.replace(/\.cjs$/, ".js");
				const destFile = node_path.join(hooksDest, destName);
				let content = node_fs.readFileSync(srcFile, "utf8");
				content = content.replace(/'\.claude'/g, configDirReplacement);
				node_fs.writeFileSync(destFile, content);
			}
		}
		if (verifyInstalled(hooksDest, "hooks")) spinner.succeed(chalk.green("✓") + " Installed hooks (bundled)");
		else {
			spinner.fail("Failed to install hooks");
			failures.push("hooks");
		}
	}
}
/**
* Configure hooks and statusline in settings.json
*/
function configureSettingsHooks(targetDir, isGlobal) {
	const dirName = getDirName();
	const settingsPath = node_path.join(targetDir, "settings.json");
	const settings = cleanupOrphanedHooks(readSettings(settingsPath));
	const statuslineCommand = isGlobal ? buildHookCommand(targetDir, "maxsim-statusline.js") : "node " + dirName + "/hooks/maxsim-statusline.js";
	const updateCheckCommand = isGlobal ? buildHookCommand(targetDir, "maxsim-check-update.js") : "node " + dirName + "/hooks/maxsim-check-update.js";
	const contextMonitorCommand = isGlobal ? buildHookCommand(targetDir, "maxsim-context-monitor.js") : "node " + dirName + "/hooks/maxsim-context-monitor.js";
	if (!settings.hooks) settings.hooks = {};
	const installHooks = settings.hooks;
	if (!installHooks.SessionStart) installHooks.SessionStart = [];
	if (!installHooks.SessionStart.some((entry) => entry.hooks && entry.hooks.some((h) => h.command && h.command.includes("maxsim-check-update")))) {
		installHooks.SessionStart.push({ hooks: [{
			type: "command",
			command: updateCheckCommand
		}] });
		console.log(`  ${chalk.green("✓")} Configured update check hook`);
	}
	if (!installHooks.PostToolUse) installHooks.PostToolUse = [];
	if (!installHooks.PostToolUse.some((entry) => entry.hooks && entry.hooks.some((h) => h.command && h.command.includes("maxsim-context-monitor")))) {
		installHooks.PostToolUse.push({ hooks: [{
			type: "command",
			command: contextMonitorCommand
		}] });
		console.log(`  ${chalk.green("✓")} Configured context window monitor hook`);
	}
	return {
		settingsPath,
		settings,
		statuslineCommand,
		updateCheckCommand,
		contextMonitorCommand
	};
}
/**
* Handle statusline configuration — returns true if MAXSIM statusline should be installed
*/
async function handleStatusline(settings, isInteractive, forceStatusline) {
	if (!(settings.statusLine != null)) return true;
	if (forceStatusline) return true;
	if (!isInteractive) {
		console.log(chalk.yellow("⚠") + " Skipping statusline (already configured)");
		console.log("  Use " + chalk.cyan("--force-statusline") + " to replace\n");
		return false;
	}
	const statusLine = settings.statusLine;
	const existingCmd = statusLine.command || statusLine.url || "(custom)";
	console.log();
	console.log(chalk.yellow("⚠  Existing statusline detected"));
	console.log();
	console.log("  Your current statusline:");
	console.log("    " + chalk.dim(`command: ${existingCmd}`));
	console.log();
	console.log("  MAXSIM includes a statusline showing:");
	console.log("    • Model name");
	console.log("    • Current task (from todo list)");
	console.log("    • Context window usage (color-coded)");
	console.log();
	return await dist_default$1({
		message: "Replace with MAXSIM statusline?",
		default: false
	});
}
/**
* Apply statusline config, then print completion message
*/
function finishInstall(settingsPath, settings, statuslineCommand, shouldInstallStatusline, isGlobal = true) {
	if (shouldInstallStatusline) {
		settings.statusLine = {
			type: "command",
			command: statuslineCommand
		};
		console.log(`  ${chalk.green("✓")} Configured statusline`);
	}
	if (settingsPath && settings) writeSettings(settingsPath, settings);
	console.log(`
  ${chalk.green("Done!")} Launch Claude Code and run ${chalk.cyan("/maxsim:help")}.

  ${chalk.cyan("Join the community:")} https://discord.gg/5JJgD5svVS
`);
}

//#endregion
//#region src/install/manifest.ts
const MANIFEST_NAME = "maxsim-file-manifest.json";
/**
* Compute SHA256 hash of file contents
*/
function fileHash(filePath) {
	const content = node_fs.readFileSync(filePath);
	return node_crypto.createHash("sha256").update(content).digest("hex");
}
/**
* Recursively collect all files in dir with their hashes
*/
function generateManifest(dir, baseDir) {
	if (!baseDir) baseDir = dir;
	const manifest = {};
	if (!node_fs.existsSync(dir)) return manifest;
	const entries = node_fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = node_path.join(dir, entry.name);
		const relPath = node_path.relative(baseDir, fullPath).replace(/\\/g, "/");
		if (entry.isDirectory()) Object.assign(manifest, generateManifest(fullPath, baseDir));
		else manifest[relPath] = fileHash(fullPath);
	}
	return manifest;
}
/**
* Write file manifest after installation for future modification detection
*/
function writeManifest(configDir) {
	const maxsimDir = node_path.join(configDir, "maxsim");
	const commandsDir = node_path.join(configDir, "commands", "maxsim");
	const agentsDir = node_path.join(configDir, "agents");
	const manifest = {
		version: pkg.version,
		timestamp: (/* @__PURE__ */ new Date()).toISOString(),
		files: {}
	};
	const maxsimHashes = generateManifest(maxsimDir);
	for (const [rel, hash] of Object.entries(maxsimHashes)) manifest.files["maxsim/" + rel] = hash;
	if (node_fs.existsSync(commandsDir)) {
		const cmdHashes = generateManifest(commandsDir);
		for (const [rel, hash] of Object.entries(cmdHashes)) manifest.files["commands/maxsim/" + rel] = hash;
	}
	if (node_fs.existsSync(agentsDir)) {
		for (const file of node_fs.readdirSync(agentsDir)) if (file.startsWith("maxsim-") && file.endsWith(".md")) manifest.files["agents/" + file] = fileHash(node_path.join(agentsDir, file));
	}
	const skillsManifestDir = node_path.join(configDir, "skills");
	if (node_fs.existsSync(skillsManifestDir)) {
		const skillHashes = generateManifest(skillsManifestDir);
		for (const [rel, hash] of Object.entries(skillHashes)) manifest.files["skills/" + rel] = hash;
	}
	node_fs.writeFileSync(node_path.join(configDir, MANIFEST_NAME), JSON.stringify(manifest, null, 2));
	return manifest;
}
/**
* Read an existing manifest from the config directory, or return null if none exists / is invalid
*/
function readManifest(configDir) {
	const manifestPath = node_path.join(configDir, MANIFEST_NAME);
	if (!node_fs.existsSync(manifestPath)) return null;
	try {
		return JSON.parse(node_fs.readFileSync(manifestPath, "utf8"));
	} catch {
		return null;
	}
}

//#endregion
//#region src/install/patches.ts
const PATCHES_DIR_NAME = "maxsim-local-patches";
/**
* Detect user-modified MAXSIM files by comparing against install manifest.
*/
function saveLocalPatches(configDir) {
	const manifest = readManifest(configDir);
	if (!manifest) return [];
	const patchesDir = node_path.join(configDir, PATCHES_DIR_NAME);
	const modified = [];
	for (const [relPath, originalHash] of Object.entries(manifest.files || {})) {
		const fullPath = node_path.join(configDir, relPath);
		if (!node_fs.existsSync(fullPath)) continue;
		if (fileHash(fullPath) !== originalHash) {
			const backupPath = node_path.join(patchesDir, relPath);
			node_fs.mkdirSync(node_path.dirname(backupPath), { recursive: true });
			node_fs.copyFileSync(fullPath, backupPath);
			modified.push(relPath);
		}
	}
	if (modified.length > 0) {
		const meta = {
			backed_up_at: (/* @__PURE__ */ new Date()).toISOString(),
			from_version: manifest.version,
			files: modified
		};
		node_fs.writeFileSync(node_path.join(patchesDir, "backup-meta.json"), JSON.stringify(meta, null, 2));
		console.log("  " + chalk.yellow("i") + "  Found " + modified.length + " locally modified MAXSIM file(s) — backed up to maxsim-local-patches/");
		for (const f of modified) console.log("     " + chalk.dim(f));
	}
	return modified;
}
/**
* After install, report backed-up patches for user to reapply.
*/
function reportLocalPatches(configDir) {
	const patchesDir = node_path.join(configDir, PATCHES_DIR_NAME);
	const metaPath = node_path.join(patchesDir, "backup-meta.json");
	if (!node_fs.existsSync(metaPath)) return [];
	let meta;
	try {
		meta = JSON.parse(node_fs.readFileSync(metaPath, "utf8"));
	} catch {
		return [];
	}
	if (meta.files && meta.files.length > 0) {
		console.log("");
		console.log("  " + chalk.yellow("Local patches detected") + " (from v" + meta.from_version + "):");
		for (const f of meta.files) console.log("     " + chalk.cyan(f));
		console.log("");
		console.log("  Your modifications are saved in " + chalk.cyan(PATCHES_DIR_NAME + "/"));
		console.log("  Run " + chalk.cyan("/maxsim:reapply-patches") + " to merge them into the new version.");
		console.log("  Or manually compare and merge the files.");
		console.log("");
	}
	return meta.files || [];
}

//#endregion
//#region src/install/copy.ts
/**
* Recursively copy directory, replacing paths in .md files
* Deletes existing destDir first to remove orphaned files from previous versions
*/
function copyWithPathReplacement(srcDir, destDir, pathPrefix, explicitConfigDir, isCommand = false) {
	if (node_fs.existsSync(destDir)) node_fs.rmSync(destDir, { recursive: true });
	node_fs.mkdirSync(destDir, { recursive: true });
	const entries = node_fs.readdirSync(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		const srcPath = node_path.join(srcDir, entry.name);
		const destPath = node_path.join(destDir, entry.name);
		if (entry.isDirectory()) copyWithPathReplacement(srcPath, destPath, pathPrefix, explicitConfigDir, isCommand);
		else if (entry.name.endsWith(".md")) {
			let content = node_fs.readFileSync(srcPath, "utf8");
			const globalClaudeRegex = /~\/\.claude\//g;
			const localClaudeRegex = /\.\/\.claude\//g;
			content = content.replace(globalClaudeRegex, pathPrefix);
			content = content.replace(localClaudeRegex, "./.claude/");
			content = processAttribution(content, getCommitAttribution(explicitConfigDir));
			node_fs.writeFileSync(destPath, content);
		} else node_fs.copyFileSync(srcPath, destPath);
	}
}

//#endregion
//#region src/install/uninstall.ts
/**
* Uninstall MAXSIM from the specified directory
*/
function uninstall(isGlobal, explicitConfigDir = null) {
	const dirName = getDirName();
	const targetDir = isGlobal ? getGlobalDir(explicitConfigDir) : node_path.join(process.cwd(), dirName);
	const locationLabel = isGlobal ? targetDir.replace(node_os.homedir(), "~") : targetDir.replace(process.cwd(), ".");
	console.log(`  Uninstalling MAXSIM from ${chalk.cyan("Claude Code")} at ${chalk.cyan(locationLabel)}\n`);
	if (!node_fs.existsSync(targetDir)) {
		console.log(`  ${chalk.yellow("⚠")} Directory does not exist: ${locationLabel}`);
		console.log(`  Nothing to uninstall.\n`);
		return;
	}
	let removedCount = 0;
	const maxsimCommandsDir = node_path.join(targetDir, "commands", "maxsim");
	if (node_fs.existsSync(maxsimCommandsDir)) {
		node_fs.rmSync(maxsimCommandsDir, { recursive: true });
		removedCount++;
		console.log(`  ${chalk.green("✓")} Removed commands/maxsim/`);
	}
	{
		const skillsDir = node_path.join(targetDir, "skills");
		if (node_fs.existsSync(skillsDir)) {
			let skillCount = 0;
			for (const skill of builtInSkills) {
				const skillDir = node_path.join(skillsDir, skill);
				if (node_fs.existsSync(skillDir)) {
					node_fs.rmSync(skillDir, { recursive: true });
					skillCount++;
				}
			}
			if (skillCount > 0) {
				removedCount++;
				console.log(`  ${chalk.green("✓")} Removed ${skillCount} MAXSIM skills`);
			}
		}
		const legacySkillsDir = node_path.join(targetDir, "agents", "skills");
		if (node_fs.existsSync(legacySkillsDir)) {
			node_fs.rmSync(legacySkillsDir, { recursive: true });
			console.log(`  ${chalk.green("✓")} Removed legacy agents/skills/ directory`);
		}
	}
	const maxsimDir = node_path.join(targetDir, "maxsim");
	if (node_fs.existsSync(maxsimDir)) {
		node_fs.rmSync(maxsimDir, { recursive: true });
		removedCount++;
		console.log(`  ${chalk.green("✓")} Removed maxsim/`);
	}
	const agentsDir = node_path.join(targetDir, "agents");
	if (node_fs.existsSync(agentsDir)) {
		const files = node_fs.readdirSync(agentsDir);
		let agentCount = 0;
		for (const file of files) if (file.startsWith("maxsim-") && file.endsWith(".md")) {
			node_fs.unlinkSync(node_path.join(agentsDir, file));
			agentCount++;
		}
		if (agentCount > 0) {
			removedCount++;
			console.log(`  ${chalk.green("✓")} Removed ${agentCount} MAXSIM agents`);
		}
	}
	const hooksDir = node_path.join(targetDir, "hooks");
	if (node_fs.existsSync(hooksDir)) {
		const maxsimHooks = [
			"maxsim-statusline.js",
			"maxsim-check-update.js",
			"maxsim-check-update.sh",
			"maxsim-context-monitor.js"
		];
		let hookCount = 0;
		for (const hook of maxsimHooks) {
			const hookPath = node_path.join(hooksDir, hook);
			if (node_fs.existsSync(hookPath)) {
				node_fs.unlinkSync(hookPath);
				hookCount++;
			}
		}
		if (hookCount > 0) {
			removedCount++;
			console.log(`  ${chalk.green("✓")} Removed ${hookCount} MAXSIM hooks`);
		}
	}
	const pkgJsonPath = node_path.join(targetDir, "package.json");
	if (node_fs.existsSync(pkgJsonPath)) try {
		if (node_fs.readFileSync(pkgJsonPath, "utf8").trim() === "{\"type\":\"commonjs\"}") {
			node_fs.unlinkSync(pkgJsonPath);
			removedCount++;
			console.log(`  ${chalk.green("✓")} Removed MAXSIM package.json`);
		}
	} catch {}
	const settingsPath = node_path.join(targetDir, "settings.json");
	if (node_fs.existsSync(settingsPath)) {
		const settings = readSettings(settingsPath);
		let settingsModified = false;
		const statusLine = settings.statusLine;
		if (statusLine && statusLine.command && statusLine.command.includes("maxsim-statusline")) {
			delete settings.statusLine;
			settingsModified = true;
			console.log(`  ${chalk.green("✓")} Removed MAXSIM statusline from settings`);
		}
		const settingsHooks = settings.hooks;
		if (settingsHooks && settingsHooks.SessionStart) {
			const before = settingsHooks.SessionStart.length;
			settingsHooks.SessionStart = settingsHooks.SessionStart.filter((entry) => {
				if (entry.hooks && Array.isArray(entry.hooks)) return !entry.hooks.some((h) => h.command && (h.command.includes("maxsim-check-update") || h.command.includes("maxsim-statusline")));
				return true;
			});
			if (settingsHooks.SessionStart.length < before) {
				settingsModified = true;
				console.log(`  ${chalk.green("✓")} Removed MAXSIM hooks from settings`);
			}
			if (settingsHooks.SessionStart.length === 0) delete settingsHooks.SessionStart;
		}
		if (settingsHooks && settingsHooks.PostToolUse) {
			const before = settingsHooks.PostToolUse.length;
			settingsHooks.PostToolUse = settingsHooks.PostToolUse.filter((entry) => {
				if (entry.hooks && Array.isArray(entry.hooks)) return !entry.hooks.some((h) => h.command && h.command.includes("maxsim-context-monitor"));
				return true;
			});
			if (settingsHooks.PostToolUse.length < before) {
				settingsModified = true;
				console.log(`  ${chalk.green("✓")} Removed context monitor hook from settings`);
			}
			if (settingsHooks.PostToolUse.length === 0) delete settingsHooks.PostToolUse;
		}
		if (settingsHooks && Object.keys(settingsHooks).length === 0) delete settings.hooks;
		if (settingsModified) {
			writeSettings(settingsPath, settings);
			removedCount++;
		}
	}
	if (removedCount === 0) console.log(`  ${chalk.yellow("⚠")} No MAXSIM files found to remove.`);
	console.log(`
  ${chalk.green("Done!")} MAXSIM has been uninstalled from Claude Code.
  Your other files and settings have been preserved.
`);
}

//#endregion
//#region src/install/index.ts
const argv = (0, import_minimist.default)(process.argv.slice(2), {
	boolean: [
		"global",
		"local",
		"claude",
		"uninstall",
		"help",
		"version",
		"force-statusline",
		"network"
	],
	string: ["config-dir"],
	alias: {
		g: "global",
		l: "local",
		u: "uninstall",
		h: "help",
		c: "config-dir"
	}
});
const hasGlobal = !!argv["global"];
const hasLocal = !!argv["local"];
const hasUninstall = !!argv["uninstall"];
const banner = "\n" + chalk.cyan(figlet.default.textSync("MAXSIM", { font: "ANSI Shadow" }).split("\n").map((line) => "  " + line).join("\n")) + "\n\n  MAXSIM " + chalk.dim("v" + pkg.version) + "\n  A meta-prompting, context engineering and spec-driven\n  development system for Claude Code.\n";
const explicitConfigDir = argv["config-dir"] || null;
const hasHelp = !!argv["help"];
const hasVersion = !!argv["version"];
const forceStatusline = !!argv["force-statusline"];
for (const flag of [
	"opencode",
	"gemini",
	"codex",
	"both",
	"all"
]) if (argv[flag]) {
	console.error(`Error: The --${flag} flag is no longer supported. MAXSIM v2.0 is Claude Code only.`);
	process.exit(1);
}
if (hasVersion) {
	console.log(pkg.version);
	process.exit(0);
}
console.log(banner);
if (hasHelp) {
	console.log(`  ${chalk.yellow("Usage:")} npx maxsimcli [options]\n\n  ${chalk.yellow("Options:")}\n    ${chalk.cyan("-g, --global")}              Install globally (to config directory)\n    ${chalk.cyan("-l, --local")}               Install locally (to current directory)\n    ${chalk.cyan("-u, --uninstall")}           Uninstall MAXSIM (remove all MAXSIM files)\n    ${chalk.cyan("-c, --config-dir <path>")}   Specify custom config directory\n    ${chalk.cyan("-h, --help")}                Show this help message\n    ${chalk.cyan("--force-statusline")}        Replace existing statusline config\n\n  ${chalk.yellow("Examples:")}\n    ${chalk.dim("# Interactive install (prompts for location)")}\n    npx maxsimcli\n\n    ${chalk.dim("# Install globally")}\n    npx maxsimcli --global\n\n    ${chalk.dim("# Install to current project only")}\n    npx maxsimcli --local\n\n    ${chalk.dim("# Install to custom config directory")}\n    npx maxsimcli --global --config-dir ~/.claude-work\n\n    ${chalk.dim("# Uninstall MAXSIM globally")}\n    npx maxsimcli --global --uninstall\n\n  ${chalk.yellow("Notes:")}\n    The --config-dir option is useful when you have multiple configurations.\n    It takes priority over the CLAUDE_CONFIG_DIR environment variable.\n`);
	process.exit(0);
}
async function install(isGlobal) {
	const runtime = "claude";
	const dirName = getDirName();
	const src = templatesRoot;
	const targetDir = isGlobal ? getGlobalDir(explicitConfigDir) : node_path.join(process.cwd(), dirName);
	const locationLabel = isGlobal ? targetDir.replace(node_os.homedir(), "~") : targetDir.replace(process.cwd(), ".");
	const pathPrefix = isGlobal ? `${targetDir.replace(/\\/g, "/")}/` : `./${dirName}/`;
	console.log(`  Installing for ${chalk.cyan("Claude Code")} to ${chalk.cyan(locationLabel)}\n`);
	const failures = [];
	const existingManifest = readManifest(targetDir);
	const isAlreadyCurrent = existingManifest !== null && existingManifest.version === pkg.version;
	if (existingManifest !== null) {
		const { complete, missing } = verifyInstallComplete(targetDir, runtime, existingManifest);
		if (!complete) console.log(`  ${chalk.yellow("!")} Previous install (v${existingManifest.version}) is incomplete — ${missing.length} missing file(s). Re-installing.`);
		else if (isAlreadyCurrent) console.log(`  ${chalk.dim(`Version ${pkg.version} already installed — upgrading in place`)}`);
	}
	saveLocalPatches(targetDir);
	cleanupOrphanedFiles(targetDir);
	let spinner = ora({
		text: "Installing commands...",
		color: "cyan"
	}).start();
	const commandsDir = node_path.join(targetDir, "commands");
	node_fs.mkdirSync(commandsDir, { recursive: true });
	const maxsimSrc = node_path.join(src, "commands", "maxsim");
	const maxsimDest = node_path.join(commandsDir, "maxsim");
	copyWithPathReplacement(maxsimSrc, maxsimDest, pathPrefix, explicitConfigDir, true);
	if (verifyInstalled(maxsimDest, "commands/maxsim")) spinner.succeed(chalk.green("✓") + " Installed commands/maxsim");
	else {
		spinner.fail("Failed to install commands/maxsim");
		failures.push("commands/maxsim");
	}
	spinner = ora({
		text: "Installing workflows and templates...",
		color: "cyan"
	}).start();
	const skillDest = node_path.join(targetDir, "maxsim");
	const maxsimSubdirs = [
		"workflows",
		"templates",
		"references"
	];
	if (node_fs.existsSync(skillDest)) node_fs.rmSync(skillDest, { recursive: true });
	node_fs.mkdirSync(skillDest, { recursive: true });
	for (const subdir of maxsimSubdirs) {
		const subdirSrc = node_path.join(src, subdir);
		if (node_fs.existsSync(subdirSrc)) copyWithPathReplacement(subdirSrc, node_path.join(skillDest, subdir), pathPrefix, explicitConfigDir);
	}
	if (verifyInstalled(skillDest, "maxsim")) spinner.succeed(chalk.green("✓") + " Installed maxsim");
	else {
		spinner.fail("Failed to install maxsim");
		failures.push("maxsim");
	}
	const agentsSrc = node_path.join(src, "agents");
	if (node_fs.existsSync(agentsSrc)) {
		spinner = ora({
			text: "Installing agents...",
			color: "cyan"
		}).start();
		const agentsDest = node_path.join(targetDir, "agents");
		node_fs.mkdirSync(agentsDest, { recursive: true });
		if (node_fs.existsSync(agentsDest)) {
			for (const file of node_fs.readdirSync(agentsDest)) if (file.startsWith("maxsim-") && file.endsWith(".md")) node_fs.unlinkSync(node_path.join(agentsDest, file));
		}
		const agentEntries = node_fs.readdirSync(agentsSrc, { withFileTypes: true });
		for (const entry of agentEntries) if (entry.isFile() && entry.name.endsWith(".md")) {
			let content = node_fs.readFileSync(node_path.join(agentsSrc, entry.name), "utf8");
			content = content.replace(/~\/\.claude\//g, pathPrefix);
			content = processAttribution(content, getCommitAttribution(explicitConfigDir));
			node_fs.writeFileSync(node_path.join(agentsDest, entry.name), content);
		}
		if (verifyInstalled(agentsDest, "agents")) spinner.succeed(chalk.green("✓") + " Installed agents");
		else {
			spinner.fail("Failed to install agents");
			failures.push("agents");
		}
	}
	const legacySkillsDir = node_path.join(targetDir, "agents", "skills");
	if (node_fs.existsSync(legacySkillsDir)) {
		node_fs.rmSync(legacySkillsDir, { recursive: true });
		console.log(`  ${chalk.green("✓")} Removed legacy agents/skills/ directory`);
	}
	const skillsSrc = node_path.join(src, "skills");
	if (node_fs.existsSync(skillsSrc)) {
		spinner = ora({
			text: "Installing skills...",
			color: "cyan"
		}).start();
		const skillsDest = node_path.join(targetDir, "skills");
		if (node_fs.existsSync(skillsDest)) for (const skill of builtInSkills) {
			const skillDir = node_path.join(skillsDest, skill);
			if (node_fs.existsSync(skillDir)) node_fs.rmSync(skillDir, { recursive: true });
		}
		import_lib.default.copySync(skillsSrc, skillsDest, { overwrite: true });
		const skillEntries = node_fs.readdirSync(skillsDest, { withFileTypes: true });
		for (const entry of skillEntries) if (entry.isDirectory()) {
			const skillMd = node_path.join(skillsDest, entry.name, "SKILL.md");
			if (node_fs.existsSync(skillMd)) {
				let content = node_fs.readFileSync(skillMd, "utf8");
				content = content.replace(/~\/\.claude\//g, pathPrefix);
				content = processAttribution(content, getCommitAttribution(explicitConfigDir));
				node_fs.writeFileSync(skillMd, content);
			}
		}
		const installedSkillDirs = node_fs.readdirSync(skillsDest, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
		if (installedSkillDirs > 0) spinner.succeed(chalk.green("✓") + ` Installed ${installedSkillDirs} skills to skills/`);
		else {
			spinner.fail("Failed to install skills");
			failures.push("skills");
		}
	}
	const changelogSrc = node_path.join(src, "..", "CHANGELOG.md");
	const changelogDest = node_path.join(targetDir, "maxsim", "CHANGELOG.md");
	if (node_fs.existsSync(changelogSrc)) {
		spinner = ora({
			text: "Installing CHANGELOG.md...",
			color: "cyan"
		}).start();
		node_fs.copyFileSync(changelogSrc, changelogDest);
		if (verifyFileInstalled(changelogDest, "CHANGELOG.md")) spinner.succeed(chalk.green("✓") + " Installed CHANGELOG.md");
		else {
			spinner.fail("Failed to install CHANGELOG.md");
			failures.push("CHANGELOG.md");
		}
	}
	const claudeMdSrc = node_path.join(src, "CLAUDE.md");
	const claudeMdDest = node_path.join(targetDir, "CLAUDE.md");
	if (node_fs.existsSync(claudeMdSrc)) {
		spinner = ora({
			text: "Installing CLAUDE.md...",
			color: "cyan"
		}).start();
		node_fs.copyFileSync(claudeMdSrc, claudeMdDest);
		if (verifyFileInstalled(claudeMdDest, "CLAUDE.md")) spinner.succeed(chalk.green("✓") + " Installed CLAUDE.md");
		else {
			spinner.fail("Failed to install CLAUDE.md");
			failures.push("CLAUDE.md");
		}
	}
	const versionDest = node_path.join(targetDir, "maxsim", "VERSION");
	node_fs.writeFileSync(versionDest, pkg.version);
	if (verifyFileInstalled(versionDest, "VERSION")) console.log(`  ${chalk.green("✓")} Wrote VERSION (${pkg.version})`);
	else failures.push("VERSION");
	const pkgJsonDest = node_path.join(targetDir, "package.json");
	node_fs.writeFileSync(pkgJsonDest, "{\"type\":\"commonjs\"}\n");
	console.log(`  ${chalk.green("✓")} Wrote package.json (CommonJS mode)`);
	const toolSrc = node_path.resolve(__dirname, "cli.cjs");
	const binDir = node_path.join(targetDir, "maxsim", "bin");
	const toolDest = node_path.join(binDir, "maxsim-tools.cjs");
	if (node_fs.existsSync(toolSrc)) {
		node_fs.mkdirSync(binDir, { recursive: true });
		node_fs.copyFileSync(toolSrc, toolDest);
		console.log(`  ${chalk.green("✓")} Installed maxsim-tools.cjs`);
	} else {
		console.warn(`  ${chalk.yellow("!")} cli.cjs not found at ${toolSrc} — maxsim-tools.cjs not installed`);
		failures.push("maxsim-tools.cjs");
	}
	const mcpSrc = node_path.resolve(__dirname, "mcp-server.cjs");
	const mcpDest = node_path.join(binDir, "mcp-server.cjs");
	if (node_fs.existsSync(mcpSrc)) {
		node_fs.mkdirSync(binDir, { recursive: true });
		node_fs.copyFileSync(mcpSrc, mcpDest);
		console.log(`  ${chalk.green("✓")} Installed mcp-server.cjs`);
	} else console.warn(`  ${chalk.yellow("!")} mcp-server.cjs not found — MCP server not installed`);
	installHookFiles(targetDir, isGlobal, failures);
	const dashboardSrc = node_path.resolve(__dirname, "assets", "dashboard");
	if (node_fs.existsSync(dashboardSrc)) {
		let networkMode = false;
		try {
			networkMode = await dist_default$1({
				message: "Allow dashboard to be accessible on your local network? (adds firewall rule, enables QR code)",
				default: false
			});
		} catch {}
		spinner = ora({
			text: "Installing dashboard...",
			color: "cyan"
		}).start();
		const dashboardDest = node_path.join(targetDir, "dashboard");
		safeRmDir(dashboardDest);
		copyDirRecursive(dashboardSrc, dashboardDest);
		const dashboardConfigDest = node_path.join(targetDir, "dashboard.json");
		const projectCwd = isGlobal ? targetDir : process.cwd();
		node_fs.writeFileSync(dashboardConfigDest, JSON.stringify({
			projectCwd,
			networkMode
		}, null, 2) + "\n");
		if (node_fs.existsSync(node_path.join(dashboardDest, "server.js"))) spinner.succeed(chalk.green("✓") + " Installed dashboard");
		else spinner.succeed(chalk.green("✓") + " Installed dashboard (server.js not found in bundle)");
		if (networkMode) applyFirewallRule(3333);
	}
	const mcpJsonPath = isGlobal ? node_path.join(targetDir, "..", ".mcp.json") : node_path.join(process.cwd(), ".mcp.json");
	let mcpConfig = {};
	let skipMcpConfig = false;
	if (node_fs.existsSync(mcpJsonPath)) {
		node_fs.copyFileSync(mcpJsonPath, mcpJsonPath + ".bak");
		try {
			mcpConfig = JSON.parse(node_fs.readFileSync(mcpJsonPath, "utf-8"));
		} catch {
			console.warn(`  ${chalk.yellow("!")} .mcp.json is corrupted (invalid JSON). Backup saved to .mcp.json.bak`);
			let startFresh = true;
			try {
				startFresh = await dist_default$1({
					message: ".mcp.json is corrupted. Start with a fresh config? (No = abort MCP setup)",
					default: true
				});
			} catch {}
			if (!startFresh) {
				console.log(`  ${chalk.yellow("!")} Skipping .mcp.json configuration`);
				skipMcpConfig = true;
			}
		}
	}
	if (!skipMcpConfig) {
		const mcpServers = mcpConfig.mcpServers ?? {};
		mcpServers["maxsim"] = {
			command: "node",
			args: [".claude/maxsim/bin/mcp-server.cjs"],
			env: {}
		};
		mcpConfig.mcpServers = mcpServers;
		node_fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2) + "\n", "utf-8");
		console.log(`  ${chalk.green("✓")} Configured .mcp.json for MCP server auto-discovery`);
	}
	if (failures.length > 0) {
		console.error(`\n  ${chalk.yellow("Installation incomplete!")} Failed: ${failures.join(", ")}`);
		process.exit(1);
	}
	writeManifest(targetDir);
	console.log(`  ${chalk.green("✓")} Wrote file manifest (${MANIFEST_NAME})`);
	reportLocalPatches(targetDir);
	const { settingsPath, settings, statuslineCommand } = configureSettingsHooks(targetDir, isGlobal);
	return {
		settingsPath,
		settings,
		statuslineCommand,
		runtime
	};
}
/**
* Prompt for install location
*/
async function promptLocation() {
	if (!process.stdin.isTTY) {
		console.log(chalk.yellow("Non-interactive terminal detected, defaulting to global install") + "\n");
		return true;
	}
	const globalPath = getGlobalDir(explicitConfigDir).replace(node_os.homedir(), "~");
	return await dist_default({
		message: "Where would you like to install?",
		choices: [{
			name: "Global  " + chalk.dim(`(${globalPath})`) + "  — available in all projects",
			value: "global"
		}, {
			name: "Local   " + chalk.dim("(./.claude)") + "  — this project only",
			value: "local"
		}]
	}) === "global";
}
/**
* Prompt whether to enable Agent Teams (experimental feature)
*/
async function promptAgentTeams() {
	console.log();
	console.log(chalk.cyan("  Agent Teams") + chalk.dim(" (experimental)"));
	console.log(chalk.dim("  Coordinate multiple Claude Code instances working in parallel."));
	console.log(chalk.dim("  Enables CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS in settings.json."));
	console.log();
	return dist_default$1({
		message: "Enable Agent Teams?",
		default: false
	});
}
/**
* Install MAXSIM for Claude Code
*/
async function installForClaude(isGlobal, isInteractive) {
	const result = await install(isGlobal);
	let shouldInstallStatusline = false;
	if (result.settings) shouldInstallStatusline = await handleStatusline(result.settings, isInteractive, forceStatusline);
	let enableAgentTeams = false;
	if (isInteractive) enableAgentTeams = await promptAgentTeams();
	if (enableAgentTeams && result.settings) {
		const env = result.settings.env ?? {};
		env["CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS"] = "1";
		result.settings.env = env;
	}
	finishInstall(result.settingsPath, result.settings, result.statuslineCommand, shouldInstallStatusline, isGlobal);
}
const subcommand = argv._[0];
(async () => {
	if (subcommand === "dashboard") {
		await runDashboardSubcommand(argv);
		return;
	}
	if (hasGlobal && hasLocal) {
		console.error(chalk.yellow("Cannot specify both --global and --local"));
		process.exit(1);
	} else if (explicitConfigDir && hasLocal) {
		console.error(chalk.yellow("Cannot use --config-dir with --local"));
		process.exit(1);
	} else if (hasUninstall) {
		if (!hasGlobal && !hasLocal) {
			console.error(chalk.yellow("--uninstall requires --global or --local"));
			process.exit(1);
		}
		uninstall(hasGlobal, explicitConfigDir);
	} else if (hasGlobal || hasLocal) await installForClaude(hasGlobal, false);
	else if (!process.stdin.isTTY) {
		console.log(chalk.yellow("Non-interactive terminal detected, defaulting to global install") + "\n");
		await installForClaude(true, false);
	} else await installForClaude(await promptLocation(), true);
})().catch((err) => {
	if (err instanceof Error && err.message.includes("User force closed")) {
		console.log("\n" + chalk.yellow("Installation cancelled") + "\n");
		process.exit(0);
	}
	console.error(chalk.red("Unexpected error:"), err);
	process.exit(1);
});

//#endregion
//# sourceMappingURL=install.cjs.map