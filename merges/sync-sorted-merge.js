'use strict'

module.exports = (logSources, printer) => {
	var logs = initializeLogs();

	while (logs.length > 0) {
		let first = logs.shift();
		let logSource = first.logSource;

		let replacementLogOrFalse = logSources[logSource].pop();
		if (replacementLogOrFalse) {
			insert(logs, new Log(replacementLogOrFalse, logSource));
		}

		printer.print(first.log);
	}

	function initializeLogs() {
		var logs = [];

		for (let i = 0; i < logSources.length; i++) {
			let currLogOrFalse = logSources[i].pop();
			if (currLogOrFalse) logs.push(new Log(currLogOrFalse, i));
		}

		logs.sort(function (a, b) {
			if (a.log.date > b.log.date) {
				return 1;
			} else if (a.log.date < b.log.date) {
				return -1;
			}
			else {
				return 0;
			}
		});

		return logs;
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
			
			if (arr[middle].log.date >= elem.log.date && (middle === 0 || arr[middle-1].log.date <= elem.log.date)) {
				return middle;
			} else if (arr[middle].log.date <= elem.log.date && (arr[middle+1] == null || arr[middle+1].log.date >= elem.log.date)) {
				return middle+1;
			} else if (arr[middle].log.date > elem.log.date) {
				endRange = middle;
			} else if (arr[middle].log.date < elem.log.date) {
				startRange = middle;
			}
		}
	}

	function Log(log, logSource) {
		var self = this;
		self.log = log;
		self.logSource = logSource;
	}

	printer.done();
}