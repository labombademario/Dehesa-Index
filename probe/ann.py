import sys
t = open('probe-out/%s.txt' % sys.argv[1], errors='replace').read()
t = t[-3500:].replace('%', '%25').replace('\r', '').replace('\n', '%0A')
print('::notice title=probe-%s::%s' % (sys.argv[1], t))
