import re

banned_words = ['a55', 'a55hole', 'aeolus', 'ahole', 'analprobe', 'anilingus', 'areola', 'areole', 'arian', 'aryan', 'assbang', 'assbanged', 'assbangs', 'assfuck', 'assfucker', 'assh0le', 'asshat', 'assho1e', 'ass hole', 'assholes', 'assmaster', 'assmunch', 'asswipe', 'asswipes', 'azazel', 'azz', 'b1tch', 'ballsack', 'barf', 'bastard', 'bastards', 'beaner', 'beardedclam', 'beastiality', 'beatch', 'beeyotch', 'beotch', 'biatch', 'bigtits', 'big tits', 'bimbo', 'bitched', 'bitches', 'bitchy', 'blow job', 'blowjob', 'blowjobs', 'bollock', 'bollocks', 'bollok', 'boned', 'boner', 'boners', 'boob', 'boobies', 'boobs', 'booby', 'booger', 'bootee', 'bootie', 'booty', 'boozer', 'boozy', 'bosomy', 'breasts', 'bukkake', 'bullshit', 'bull shit', 'bullshits', 'bullshitted', 'bullturds', 'bung', 'busty', 'butt fuck', 'buttfuck', 'buttfucker', 'buttfucker', 'buttplug', 'c.0.c.k', 'c.o.c.k.', 'c.u.n.t', 'c0ck', 'c-0-c-k', 'caca', 'cahone', 'cameltoe', 'carpetmuncher', 'cawk', 'cervix', 'chinc', 'chincs', 'chink', 'chink', 'chode', 'chodes', 'cl1t', 'clit', 'clitoris', 'clitorus', 'clits', 'clitty', 'c-o-c-k', 'cockblock', 'cockholster', 'cockknocker', 'cocks', 'cocksmoker', 'cocksucker', 'cock sucker', 'coital', 'coon', 'coons', 'corksucker', 'crackwhore', 'crap', 'crappy', 'cum', 'cummin', 'cumming', 'cumshot', 'cumshots', 'cumslut', 'cumstain', 'cunilingus', 'cunnilingus', 'cunny', 'cunt', 'c-u-n-t', 'cuntface', 'cunthunter', 'cuntlick', 'cuntlicker', 'cunts', 'd0ng', 'd0uch3', 'd0uche', 'd1ck', 'd1ld0', 'd1ldo', 'dago', 'dagos', 'dawgie-style', 'dickbag', 'dickdipper', 'dickface', 'dickflipper', 'dickhead', 'dickheads', 'dickish', 'dick-ish', 'dickripper', 'dicksipper', 'dickweed', 'dickwhipper', 'dickzipper', 'diddle', 'dike', 'dildo', 'dildos', 'diligaf', 'dillweed', 'dimwit', 'dingle', 'dipship', 'doggie-style', 'doggy-style', 'doosh', 'dopey', 'douch3', 'douche', 'douchebag', 'douchebags', 'douchey', 'dumass', 'dumbass', 'dumbasses', 'ejaculate', 'erect', 'erection', 'essohbee', 'extacy', 'extasy', 'f.u.c.k', 'fack', 'fag', 'fagg', 'fagged', 'faggit', 'faggot', 'fagot', 'fags', 'faig', 'faigt', 'fannybandit', 'fartknocker', 'felch', 'felcher', 'felching', 'fellate', 'fellatio', 'feltch', 'feltcher', 'fisted', 'fisting', 'floozy', 'foad', 'fondle', 'freex', 'frigg', 'frigga', 'fuck', 'f-u-c-k', 'fuckass', 'fucked', 'fucked', 'fucker', 'fuckface', 'fuckin', 'fucking', 'fucknugget', 'fucknut', 'fuckoff', 'fucks', 'fucktard', 'fuck-tard', 'fuckup', 'fuckwad', 'fuckwit', 'fudgepacker', 'fuk', 'fvck', 'fxck', 'gae', 'gai', 'ganja', 'gey', 'gfy', 'ghay', 'ghey', 'gigolo', 'glans', 'goatse', 'godamn', 'godamnit', 'goddam', 'goddammit', 'goddamn', 'goldenshower', 'gonad', 'gonads', 'gook', 'gooks', 'gringo', 'gspot', 'g-spot', 'gtfo', 'guido', 'h0m0', 'h0mo', 'handjob', 'hard on', 'he11', 'hebe', 'heeb', 'heroin', 'herp', 'herpes', 'herpy', 'hitler', 'hobag', 'hom0', 'homey', 'homo', 'homoey', 'honky', 'hooch', 'hooker', 'hoor', 'hootch', 'hooter', 'hooters', 'horny', 'hussy', 'hymen', 'inbred', 'incest', 'injun', 'j3rk0ff', 'jackass', 'jackhole', 'jackoff', 'jap', 'arse', 'japs', 'jerk', 'jerk0ff', 'jerked', 'jerkoff', 'jism', 'jiz', 'jizm', 'jizz', 'jizzed', 'junkie', 'junky', 'kike', 'kikes', 'kinky', 'kkk', 'klan', 'knobend', 'kooch', 'kooches', 'kootch', 'kraut', 'kyke', 'lech', 'leper', 'lesbo', 'lesbos', 'lez', 'lezbian', 'lezbians', 'lezbo', 'lezbos', 'lezzie', 'lezzies', 'lezzy', 'lmfao', 'lube', 'lusty', 'masterbate', 'masterbating', 'masterbation', 'masturbate', 'masturbating', 'masturbation', 'menstruate', 'menstruation', 'meth', 'm-fucking', 'mofo', 'molest', 'moolie', 'moron', 'motherfucka', 'motherfucker', 'motherfucking', 'mtherfucker', 'mthrfucker', 'mthrfucking', 'muff', 'muffdiver', 'muthafuckaz', 'muthafucker', 'mutherfucker', 'mutherfucking', 'muthrfucking', 'nads', 'nappy', 'negro', 'nigga', 'niggah', 'niggas', 'niggaz', 'nigger', 'nigger', 'niggers', 'niggle', 'niglet', 'nimrod', 'ninny', 'nipple', 'nooky', 'nympho', 'orgasm', 'orgasmic', 'orgies', 'orgy', 'p.u.s.s.y.', 'paddy', 'paki', 'pantie', 'panties', 'panty', 'pastie', 'pasty', 'pcp', 'pecker', 'pedo', 'pedophile', 'pedophilia', 'pedophiliac', 'pee', 'peepee', 'penetrate', 'penetration', 'penial', 'penile', 'penis', 'peyote', 'phalli', 'phuck', 'pimp', 'pinko', 'piss', 'pissed', 'pissoff', 'piss-off', 'polack', 'pollock', 'poon', 'poontang', 'porn', 'porno', 'pornography', 'prig', 'prostitute', 'pube', 'pubic', 'pubis', 'punkass', 'punky', 'pussies', 'pussypounder', 'puto', 'queaf', 'queef', 'queef', 'queer', 'queero', 'queers', 'quicky', 'quim', 'racy', 'rape', 'raped', 'raper', 'rapist', 'raunch', 'reefer', 'reetard', 'reich', 'retard', 'retarded', 'rimjob', 'ritard', 'rtard', 'r-tard', 'rum', 'rumprammer', 'ruski', 's.h.i.t.', 's.o.b.', 's0b', 'sadism', 'sadist', 'scag', 'scantily', 'schizo', 'schlong', 'screw', 'screwed', 'scrog', 'scrud', 'seduce', 'semen', 'sex', 'sexual', 'sh1t', 's-h-1-t', 'shamedame', 'shit', 's-h-i-t', 'shite', 'shiteater', 'shitface', 'shithead', 'shithole', 'shithouse', 'shits', 'shitt', 'shitted', 'shitter', 'shitty', 'shiz', 'sissy', 'skag', 'slave', 'sleaze', 'sleazy', 'slut', 'slutdumper', 'slutkiss', 'sluts', 'smegma', 'smut', 'smutty', 'sniper', 'snuff', 's-o-b', 'sodom', 'souse', 'soused', 'sperm', 'spic', 'spick', 'spik', 'spiks', 'spooge', 'spunk', 'stfu', 'stiffy', 'stoned', 'strip', 'stroke', 'stupid', 'suck', 'sucked', 'sucking', 'sumofabiatch', 't1t', 'tard', 'tawdry', 'teabagging', 'teat', 'terd', 'teste', 'testee', 'tit', 'titfuck', 'titi', 'tits', 'tittiefucker', 'titties', 'titty', 'tittyfuck', 'tittyfucker', 'toke', 'toots', 'tubgirl', 'turd', 'tush', 'twat', 'twats', 'urinal', 'urine', 'uterus', 'vag', 'valium', 'viagra', 'vixen', 'voyeur', 'vulgar', 'wank', 'wanker', 'wazoo', 'wedgie', 'weenie', 'weewee', 'weiner', 'wetback', 'wh0re', 'wh0reface', 'whitey', 'whiz', 'whoralicious', 'whore', 'whorealicious', 'whored', 'whoreface', 'whorehopper', 'whorehouse', 'whores', 'whoring', 'wigger', 'wop', 'wtf', 'x-rated', 'bitch', 'hoe', 'xxx', 'yeasty', 'yobbo', 'zoophile', 'pussy', 'ugly']

prohibitedWords = banned_words
big_regex = re.compile(r'\b|\b'.join(map(re.escape, prohibitedWords)))

emoji_pattern = re.compile("["
                               u"\U0001F600-\U0001F64F"  # emoticons
                               u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                               u"\U0001F680-\U0001F6FF"  # transport & map symbols
                               u"\U0001F1E0-\U0001F1FF"  # flags (iOS)
                               u"\U00002702-\U000027B0"
                               u"\U000024C2-\U0001F251"
                               "]+", flags=re.UNICODE)

def text_process(text):

    text = emoji_pattern.sub(r'', text)

    text = re.sub(r"^RT[\s]+", "", text)
    
    text = re.sub(r"https?:\/\/.*[\r\n]*", "", text)
    
    text = re.sub(r"@[a-zA-Z]+_?[a-zA-Z]+", "person", text)
    
    text = re.sub(r"[^\w\s]", "", text)

    text = re.sub(r"\\n", " ", text)
    
    text = re.sub(r"\\n", " ", text)
    
    text = text.lower()
    
    text = big_regex.sub(text + " bannedwordpresent", text)
    
    text = re.sub(r"[\d]", "", text)
    
    return text