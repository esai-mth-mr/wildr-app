import re

emoji_pattern = re.compile("["
                               u"\U0001F600-\U0001F64F"  # emoticons
                               u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                               u"\U0001F680-\U0001F6FF"  # transport & map symbols
                               u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                               u"\U00002702-\U000027B0"
                               u"\U000024C2-\U0001F251"
                               "]+", flags=re.UNICODE)

def text_process(text):
    
    # Converting string to lower case
    text = text.lower()
    
    # Removing all emojies
    text = emoji_pattern.sub(r'', text)
    
    # Removing the RT 
    text = re.sub(r'^RT[\s]+', '', text)
    
    # Removing the hyperlink
    text = re.sub(r'https?:\/\/.*[\r\n]*', '', text)
    
    # Removing all contractions
    text = re.sub(r"can\'t", "can not", text)
    text = re.sub(r"n\'t", " not", text)
    text = re.sub(r"\'re", " are", text)
    text = re.sub(r"\'s", " is", text)
    text = re.sub(r"\'d", " would", text)
    text = re.sub(r"\'ll", " will", text)
    text = re.sub(r"\'t", " not", text)
    text = re.sub(r"\'ve", " have", text)
    text = re.sub(r"\'m", " am", text)
    
    # Removing @ tags
    text = re.sub(r'@[a-zA-Z0-9]+_?[a-zA-Z0-9]+', ' user ', text)
    text = re.sub(r'_+', ' ', text)
    text = re.sub(r"[^\w\s\d]", ' ', text)
    text = " ".join(text.split()) # Removes all extra whitespace
    
    return text