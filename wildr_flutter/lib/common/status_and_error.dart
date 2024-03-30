class StatusAndMessage {
  final bool isSuccessful;
  final String message;

  const StatusAndMessage({required this.isSuccessful, required this.message});

  @override
  String toString() => 'StatusAndError{isSuccessful:'
      ' $isSuccessful, message: $message}';
}
