import urllib2
import getpass
import re
import threading


savingsDict = {}
items = []

def setup():
  uname = raw_input("Username: ")
  passwd = getpass.getpass()

  proxy = urllib2.ProxyHandler({'http':'http://%s:%s@www-cache.ecs.vuw.ac.nz:8080' % (uname, passwd)})
  opener = urllib2.build_opener(proxy)
  opener.addheaders = [('Cookie', 'new-world-shopping=[{"Id":999,"Text":"My Shopping List","IsActive":true,"Items":[]}]; new-world-favs=[]; new-world-store-id=storenodeid=1260; __utma=264539792.719371236.1344048292.1350954418.1350957064.15; __utmb=264539792.16.10.1350957064; __utmc=264539792; __utmz=264539792.1346741146.5.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=new%20world; xlaABMclient=flash=1&lasttime=23/10/2012 14:56:59&banners=7,6,; __atuvc=8%7C39%2C2%7C40%2C86%7C41%2C59%7C42%2C21%7C43')]

  baseURL = 'http://www.newworld.co.nz/savings/'

  resp = opener.open(baseURL)
  page = resp.read()

  max_pages = re.compile('title="Last page" class="arrow" href="/savings/\?page=(?P<npages>\d+)')
  m = max_pages.search(page)
  num_pages =  m.group('npages')
  print 'Scraping the New World website'
  for i in xrange(int(num_pages)):
    r = PageReader(opener, baseURL, i)
    r.start()  
  while threading.active_count() > 1:
     continue
  print 'Done scraping'

  while True:
    item = raw_input('What are you looking for today? (or \'q\' to quit)\n')
    if item == 'q': break
    item_re = re.compile(item, re.I)
    possible_matches = []
    for item in items:
      if item_re.search(item):
        possible_matches.append(item)
    if len(possible_matches) == 0:
      print 'Sorry, no savings found for input keyword(s)'
    for possible in possible_matches:
      print 'Possible match\t|cost: %s%s|item: %s' % (savingsDict[possible], '\t\t' if len(savingsDict[possible]) < 7 else '\t',  possible)
 

class PageReader(threading.Thread):

  def __init__(self, opener, baseURL, pageNum):
    threading.Thread.__init__(self)
    self.opener = opener
    self.baseURL = baseURL
    self.pageNum = pageNum
    savingsDict[pageNum] = {}

  def run(self):

    rsp = self.opener.open("%s%s%s" % (self.baseURL, "?page=", str(self.pageNum)))
    body = rsp.read()
    h4 = re.compile("<h4>(?P<item>[^<]+)</h4>\s*<p\s*class=\"price\">(?P<dollar>[^<]+)<span>(?P<cents>\d+)")
    matches = h4.findall(body)
    for match in matches:
      savingsDict[match[0]] = '%s.%s' % (match[1], match[2])
      items.append(match[0])


if __name__ == '__main__':
  setup()
