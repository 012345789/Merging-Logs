'use strict'

module.exports = (logSources, printer) => {
	const P = require('bluebird');

	var logs = populateLogs();
	var stash = {};
	var drainedSources = 0;

	logs.then(process);

	function process(logs) {
		logs.sort(function (a, b) {
			if (a.log.date > b.log.date) {
				return -1;
			} else if (a.log.date < b.log.date) {
				return 1;
			} else {
				return 0;
			}
		});

		setupStash();

		printLoop(logs);

		function printLoop(logs) {
			if (drainedSources === logSources.length) {
				printer.done();
			} else {
				let last = logs.pop();
				let logSource = last.logSource;

				enqueueNextLog(logs, logSource).then(function(logsResult) {
					var logs = logsResult;
					printLoop(logs);
				});

				printer.print(last.log);
			}
		}
	}

	function populateLogs() {
		var logsPromises = [];

		for (let i = 0; i < logSources.length; i++) {
			let currLogOrFalsePromise = logSources[i].popAsync();
			logsPromises.push(currLogOrFalsePromise);
		}

		return P.all(logsPromises).then(function(logs) {
			for (let i = 0; i < logs.length; i++) {
				let log = logs[i];
				if (log === false) {
					drainedSources++;
					stash[i] = {
						feed: 0,
						store: stash[i] && stash[i].store ? stash[i].store : [],
						status: "drained"
					};
				} else {
					logs[i] = new Log(logs[i], i);
				}
			}
			return logs;
		});
	}

	function setupStash() {
		for (let i = 0; i < logSources.length; i++) {
			stash[i] = {
				feed: stash[i] && stash[i].feed ? stash[i].feed : 2,
				store: [],
				status: stash[i] && stash[i].status ? stash[i].status : "standby"
			};

			refillStash(i);
			refillStash(i);
		}
	}

	function refillStash(logSource) {
		var currLogOrFalsePromise = logSources[logSource].popAsync();
		stash[logSource].status = "resolving";
		return currLogOrFalsePromise.then(function (currLogOrFalse) { 
			if (currLogOrFalse) {
				stash[logSource].status = "standby";
				stash[logSource].store.unshift(currLogOrFalse);
			} else {
				stash[logSource].status = "drained";
				stash[logSource].feed = 0;
				drainedSources++;
			}
		});
	}

	// Inserts logs from the stash to the logs collection to be printed.
	function enqueueNextLog(logs, logSource) {
		var replacementLog = stash[logSource].store.pop();
		if (replacementLog) {
			insert(logs, new Log(replacementLog, logSource));
			return P.resolve(logs);
		} else if (stash[logSource].status !== "drained") {
			return refillStash(logSource).then(function () {
				enqueueNextLog(logs, logSource);
				return logs;
			});
		}
	}

	function insert(arr, elem) {
		var positionToInsertAt = binarySearch(arr, elem);
		arr.splice(positionToInsertAt, 0, elem);
	}

	function binarySearch(arr, elem) {
		var startRange = 0;
		var endRange = arr.length;
		
		while (true) {
			var middle = Math.floor((endRange - startRange) * 0.5) + startRange;
			if (arr[middle].log.date <= elem.log.date && (middle === 0 || arr[middle-1].log.date >= elem.log.date)) {
				return middle;
			} else if (arr[middle].log.date >= elem.log.date && (arr[middle+1] == null || arr[middle+1].log.date <= elem.log.date)) {
				return middle+1;
			} else if (arr[middle].log.date < elem.log.date) {
				endRange = middle;
			} else if (arr[middle].log.date > elem.log.date) {
				startRange = middle;
			}
		}
	}

	function Log(log, logSource) {
		var self = this;
		self.log = log;
		self.logSource = logSource;
	}
}