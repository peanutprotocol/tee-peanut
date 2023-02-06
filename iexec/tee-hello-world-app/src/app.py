import os
import sys
import json
from pyfiglet import Figlet
import random

iexec_out = os.environ['IEXEC_OUT']

# Do whatever you want (let's write hello world here)
text = 'Hello, {}!'.format(sys.argv[1] if len(sys.argv) > 1 else "World")
text = Figlet().renderText(text) # Let's add some art for e.g.
print(text)


# 1. take some input somehow with tx_hash


# 2. check blockchain explorers


# 3. sign voucher


# Append some results in /iexec_out/
with open(iexec_out + '/result.txt', 'w+') as fout:
    fout.write(text)

# Declare everything is computed
with open(iexec_out + '/computed.json', 'w+') as f:
    json.dump({ "deterministic-output-path" : iexec_out + '/result.txt' }, f)
