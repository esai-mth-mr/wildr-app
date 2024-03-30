# USERS index
### name -> users
```
{
  "settings": {
      "analysis": {
          "analyzer": {
              "handle_analyzer": {
                  "type": "custom",
                  "tokenizer": "handle_tokenizer",
                  "filter": [
                      "lowercase"
                  ]
              }
          },
          "tokenizer": {
              "handle_ngram": {
                  "type": "ngram",
                  "min_gram": 2,
                  "max_gram": 3
              },
              "handle_tokenizer": {
                  "type": "char_group",
                  "tokenize_on_chars": [
                      "whitespace",
                      "-",
                      "_"
                  ]
              }
          }
      }
  },
  "mappings": {
      "properties": {
            "handle": {
                "type": "text",
                "analyzer": "handle_analyzer",
                "search_analyzer": "handle_analyzer"
            },
            "name": {
                "type": "text"
            },
            "imageUrl": {
                "type": "keyword",
                "index": false
            }
      }
  }
}
```

### CURL LOCAL
```
curl -XPUT --insecure -u 'admin:admin' 'http://localhost:9200/users' -d '{"settings":{"analysis":{"analyzer":{"handle_analyzer":{"type":"custom","tokenizer":"handle_tokenizer","filter":["lowercase"]}},"tokenizer":{"handle_ngram":{"type":"ngram","min_gram":2,"max_gram":3},"handle_tokenizer":{"type":"char_group","tokenize_on_chars":["whitespace","-","_"]}}}},"mappings":{"properties":{"handle":{"type":"text","analyzer":"handle_analyzer","search_analyzer":"handle_analyzer"},"name":{"type":"text"}, "imageUrl": {"type": "keyword", "index": false}}}}' -H 'Content-Type: application/json'
```
### CURL
```
curl -XPUT -u 'USERNAME:PASSWORD' 'endpoint/users' -d '{"settings":{"analysis":{"analyzer":{"handle_analyzer":{"type":"custom","tokenizer":"handle_tokenizer","filter":["lowercase"]}},"tokenizer":{"handle_ngram":{"type":"ngram","min_gram":2,"max_gram":3},"handle_tokenizer":{"type":"char_group","tokenize_on_chars":["whitespace","-","_"]}}}},"mappings":{"properties":{"handle":{"type":"text","analyzer":"handle_analyzer","search_analyzer":"handle_analyzer"},"name":{"type":"text"}, "imageUrl": {"type": "keyword", "index": false}}}}' -H 'Content-Type: application/json'
```

## CURL (SSH TUNNEL)
```
curl -k --location --request PUT 'https://localhost:8080/users' \                          
--header 'Authorization: Basic xxxxx' \
--header 'Content-Type: application/json' \
--data-raw '{
  "settings": {
      "analysis": {
          "analyzer": {
              "handle_analyzer": {
                  "type": "custom",
                  "tokenizer": "handle_tokenizer",
                  "filter": [
                      "lowercase"
                  ]
              }
          },
          "tokenizer": {
              "handle_ngram": {
                  "type": "ngram",
                  "min_gram": 2,
                  "max_gram": 3
              },
              "handle_tokenizer": {
                  "type": "char_group",
                  "tokenize_on_chars": [
                      "whitespace",
                      "-",
                      "_"
                  ]
              }
          }
      }
  },
  "mappings": {
      "properties": {
            "handle": {
                "type": "text",
                "analyzer": "handle_analyzer",
                "search_analyzer": "handle_analyzer"
            },
            "name": {
                "type": "text"
            },
            "imageUrl": {
                "type": "keyword",
                "index": false
            }
      }
  }
}'
```


# POST_CONTENT index
### name -> post_content
```
{
    "mappings": {
        "properties": {
            "content": {
                "type": "text"
            },
            "users": {
                "type": "keyword"
            },
            "thumbUrl": {
                "type": "keyword",
                "index": false
           },
            "post_type": {
                "type": "keyword",
                "index": false
            }
        }
    }
}
```
## CURL LOCAL
```
curl -XPUT --insecure -u 'admin:admin' 'https://localhost:9200/post_content' -d '{"mappings":{"properties":{"content":{"type":"text"},"users":{"type":"keyword"}, "post_type": {"type": "keyword", "index": false}, "thumbUrl": {"type": "keyword", "index": false}}}}' -H 'Content-Type: application/json'
```
## CURL
```
curl -XPUT -u 'USERNAME:PASSWORD' 'endpoint/post_content' -d '{"mappings":{"properties":{"content":{"type":"text"},"users":{"type":"keyword"}, "post_type": {"type": "keyword", "index": false}, "thumbUrl": {"type": "keyword", "index": false}}}}' -H 'Content-Type: application/json'
```
## CURL (SSH tunnel)
```
curl -k --location --request PUT 'https://localhost:8080/post_content' \                   
--header 'Authorization: Basic xxxxxxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "mappings": {
        "properties": {
            "content": {
                "type": "text"
            },
            "users": {
                "type": "keyword"
            },
            "thumbUrl": {
                "type": "keyword",
                "index": false
           },
            "post_type": {
                "type": "keyword",
                "index": false
            }
        }
    }
}'
```




# HASHTAG index
### name -> hashtags
```
{
    "settings": {
        "analysis": {
            "analyzer": {
                "hashtag_analyzer": {
                    "type": "custom",
                    "tokenizer": "hashtag_tokenizer"
                }
            },
            "tokenizer": {
                "hashtag_ngram": {
                    "type": "ngram",
                    "min_gram": 2,
                    "max_gram": 3
                },
                "hashtag_tokenizer": {
                    "type": "char_group",
                    "tokenize_on_chars": [
                        "_"
                    ]
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "tag_name": {
                "type": "text",
                "analyzer": "hashtag_analyzer",
                "search_analyzer": "hashtag_analyzer"
            }
        }
    }
}
```

### CURL ->
```
curl -XPUT -u 'USERNAME:PASSWORD' 'AWS:ENDPOINT/hashtags' -d '{ "settings": { "analysis": { "analyzer": { "hashtag*analyzer": { "type": "custom", "tokenizer": "hashtag_tokenizer" } }, "tokenizer": { "hashtag_ngram": { "type": "ngram", "min_gram": 2, "max_gram": 3 }, "hashtag_tokenizer": { "type": "char_group", "tokenize_on_chars": [ "*" ] } } } }, "mappings": { "properties": { "tag_name": { "type": "text", "analyzer": "hashtag_analyzer", "search_analyzer": "hashtag_analyzer" } } } }' -H 'Content-Type: application/json'
```

## CURL (SSH tunnel)->
```
curl -k --location --request PUT 'https://localhost:8080/hashtags' \                            
--header 'Authorization: Basic xxxxxxxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "settings": {
        "analysis": {
            "analyzer": {
                "hashtag_analyzer": {
                    "type": "custom",
                    "tokenizer": "hashtag_tokenizer"
                }
            },
            "tokenizer": {
                "hashtag_ngram": {
                    "type": "ngram",
                    "min_gram": 2,
                    "max_gram": 3
                },
                "hashtag_tokenizer": {
                    "type": "char_group",
                    "tokenize_on_chars": [
                        "_"
                    ]
                }
            }
        }
    },
    "mappings": {
        "properties": {
            "tag_name": {
                "type": "text",
                "analyzer": "hashtag_analyzer",
                "search_analyzer": "hashtag_analyzer"
            }
        }
    }
}'
```


# DELETE (only) CONTENT
https://search-wildr-v1-dev-local-nncxtsgboyeilatrjiw2y3sdzy.us-west-2.es.amazonaws.com/index_name/_delete_by_query

{"query": {"match_all": {}}}

### CURL ->
curl -XPUT -u 'USERNAME:PASSWORD' 'AWS:ENDPOINT/index_name/_delete_by_query' -d '{"query": {"match_all": {}}}' -H 'Content-Type: application/json'


### Create SSH tunnel ->
sh -i ~/.ssh/wildr-eb-dev-1.key ec2-user@i-0a143e0b13a37ad6b -NL 8080:vpc-wildr-dev-1-3ktzei5dn6v5iu7eu2j3uwyibq.us-west-2.es.amazonaws.com:443




Create SSH Tunnel

```ssh -i ~/.ssh/wildr-eb-dev-1.key ec2-user@i-064a0fbe6843b5c8e -NL 8080:vpc-wildr-dev-1....:443```
!! No ```https://```