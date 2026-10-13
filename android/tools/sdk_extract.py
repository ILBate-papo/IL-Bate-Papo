import urllib.request,struct,zlib,sys
from pathlib import Path
url,wanted,destination=sys.argv[1:]
total=int(urllib.request.urlopen(urllib.request.Request(url,method='HEAD'),timeout=20).headers['Content-Length'])
def chunk(a,b):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'Range':f'bytes={a}-{b}'}),timeout=30) as response:
  data=response.read()
  if response.status!=206:raise ValueError('Range not honored')
  return data
tail=chunk(max(0,total-65557),total-1);offset=tail.rfind(b'PK\x05\x06')
record=struct.unpack_from('<4s4H2IH',tail,offset);central=chunk(record[6],record[6]+record[5]-1);position=0
while position<len(central):
 fields=struct.unpack_from('<4s6H3I5H2I',central,position);name=central[position+46:position+46+fields[10]].decode()
 if name.endswith(wanted):
  header=struct.unpack('<4s5H3I2H',chunk(fields[-1],fields[-1]+29));start=fields[-1]+30+header[-2]+header[-1]
  raw=chunk(start,start+fields[8]-1);data=zlib.decompress(raw,-15) if fields[4]==8 else raw
  if zlib.crc32(data)&0xffffffff!=fields[7]:raise ValueError('CRC mismatch')
  Path(destination).write_bytes(data);print('Extracted',name,len(data));break
 position+=46+fields[10]+fields[11]+fields[12]
else:raise ValueError('File not found')
