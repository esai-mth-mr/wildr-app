class GqlQueriesReport {
  static const String kGetStrikeReport = r'''
  query getStrikeReport($getStrikeReportInput: GetStrikeReportInput!){
    getStrikeReport(input: $getStrikeReportInput){
        __typename
        ...on ReviewReportRequest{
            __typename
            id
            readableId
            updatedAt
            createdAt
            comment
            violatedGuideline
            link
        }
        ... on SmartError{
            __typename
            message
        }
    }
  }
  ''';
}
