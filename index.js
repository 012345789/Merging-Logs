'use strict'

const LogSource = require('./lib/log-source')
const Printer = require('./lib/printer')

// Variable to control merges perform under various "load"
const sourceCount = 20

/**
 * A LogSource only has one method: pop() which will return a LogEntry.
 * 
 * A LogEntry is simply an object of the form:
 * {
 * 		date: Date,
 * 		msg: String,
 * }
 *
 * All LogEntries from a given LogSource are in chronological order.
 * Eventually a LogSource will end and return boolean false.
 *
 * Call `printer.print(logEntry)` to print each entry of the merged output as they are ready.
 * This function will ensure that what you print is in fact in chronological order.
 * 'printer.done()' will show a few stats on the run time and errors.
 */

const syncLogSources = []
for (let i = 0; i < sourceCount; i++) {
	syncLogSources.push(new LogSource())
}
require('./merges/sync-sorted-merge')(syncLogSources, new Printer())

/**
 * For this part:
 * A LogSource has only one method: popAsync() which returns a promise that resolves with a LogEntry,
 * or boolean false once the LogSource has ended.
 */

const asyncLogSources = []
for (let i = 0; i < sourceCount; i++) {
	asyncLogSources.push(new LogSource())
}
require('./merges/async-sorted-merge')(asyncLogSources, new Printer())