// ignore_for_file: no_default_cases

import 'dart:core';
import 'dart:io';
import 'package:logger/logger.dart';
import 'package:path_provider/path_provider.dart';

// App-specific formatting of log lines.
//
// Example log line:
//
// [Wildr] 2023-11-12 19:39:58.441715 debug [SettingsPage] <message>
//
// - Note: [Wildr] is prefixed to simplify finding logs in the Console app on
//  the Mac.
class AppLogPrinter extends LogPrinter {
  // className of class performing logging, logged for each message for
  // traceability.
  final String className;

  AppLogPrinter({required this.className});

  @override
  List<String> log(LogEvent event) {
    // Returns UTC time.
    final time = event.time.toString();
    final level = _getLevel(event.level);
    final message = event.message;

    return ['[Wildr] $time $level $className $message'];
  }

  String _getLevel(Level level) {
    switch (level) {
      case Level.debug:
        return 'debug';
      case Level.info:
        return 'info';
      case Level.warning:
        return 'warn';
      case Level.error:
        return 'error';
      case Level.fatal:
        return 'fatal';
      default:
        return '';
    }
  }
}

// Outputs the logs to a log file in the App's application
// directory/app.log.
class AppFileOutput extends LogOutput {
  // Open file descriptor to log file.
  static IOSink? _file;

  static final AppFileOutput _instance = AppFileOutput._();
  factory AppFileOutput() => _instance;

  AppFileOutput._();

  // Initializes the log file, should only be called once.
  Future<void> initializeLogFile() async {
    assert(_file == null, 'Should not call this method more than once');
    final Directory appDocumentsDirectory =
        await getApplicationDocumentsDirectory();
    final File file = File('${appDocumentsDirectory.path}/app.log');
    _file = file.openWrite(mode: FileMode.append);
  }

  @override
  void output(OutputEvent event) {
    final file = _file;
    if (file == null) {
      return;
    }

    for (final line in event.lines) {
      file.writeln(line);
    }

    // TODO: Check file size and possibly truncate.
    file.flush();
  }

  void dispose() {
    _file?.close();
  }
}

// Name-space app's logging method.
class Logging {
  // Returns an app-specific logger that writes to both console and file.
  static Logger getLogger(String className) => Logger(
      filter: ProductionFilter(),
      printer: AppLogPrinter(className: className),
      output: MultiOutput([
        ConsoleOutput(),
        AppFileOutput(),
      ]),
    );
}
