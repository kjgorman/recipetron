#######################################################
# A simple tool that scrapes the savings from the NW  #
# website and let's you search it.                    #
#                                                     #
#######################################################

import urllib2
import getpass
import re
import threading
from sys import argv
import sys

savingsDict = {}
items = [] #pretty redundant storing these all here. was thinking of weakref-ing them
           #or something but couldn't be bothered basically

def setup():

  #only needed for the uni proxy
  if len(argv) > 1 and argv[1] == '-p':
    uname = raw_input("Username: ")
    passwd = getpass.getpass()
    proxy = urllib2.ProxyHandler({'http':'http://%s:%s@www-cache.ecs.vuw.ac.nz:8080' % (uname, passwd)})
    opener = urllib2.build_opener(proxy)
  else:
    opener = urllib2.build_opener()

  #Attach a bunch of stuff. Ideally in future there would be a method of deriving store node's from a location
  #name so that it's not always fixed to Thorndon NW.
  opener.addheaders = [('Cookie', 'new-world-shopping=[{"Id":999,"Text":"My Shopping List","IsActive":true,"Items":[]}]; new-world-favs=[]; new-world-store-id=storenodeid=1260; __utma=264539792.719371236.1344048292.1350954418.1350957064.15; __utmb=264539792.16.10.1350957064; __utmc=264539792; __utmz=264539792.1346741146.5.3.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=new%20world; xlaABMclient=flash=1&lasttime=23/10/2012 14:56:59&banners=7,6,; __atuvc=8%7C39%2C2%7C40%2C86%7C41%2C59%7C42%2C21%7C43')]

  baseURL = 'http://www.newworld.co.nz/savings/'

  try:
    resp = opener.open(baseURL)
  except IOError, e:
    if e.__str__() == 'HTTP Error 407: Proxy Authentication Required':
      print 'HTTP Error 407: You got blocked by a proxy, maybe use the -p option to authenticate?'
      sys.exit(1)

  page = resp.read()
  #Obviouslt the number of savings week by week so we need to fetch this first.
  max_pages = re.compile('title="Last page" class="arrow" href="/savings/\?page=(?P<npages>\d+)')
  m = max_pages.search(page)
  num_pages =  m.group('npages')
  #and then we can start scraping all the pages in parallel
  print 'Scraping the New World website'
  for i in xrange(int(num_pages)):
    r = PageReader(opener, baseURL, i)
    r.start()  

  #hang out here until the data is all loaded up
  while threading.active_count() > 1:
     continue
  print 'Done scraping'

  #and now simply loop through queries
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
    #reads each item and it's price via regular expressions
    rsp = self.opener.open("%s%s%s" % (self.baseURL, "?page=", str(self.pageNum)))
    body = rsp.read()
    h4 = re.compile("<h4>(?P<item>[^<]+)</h4>\s*<p\s*class=\"price\">(?P<dollar>[^<]+)<span>(?P<cents>\d+)")
    matches = h4.findall(body)
    for match in matches:
      savingsDict[match[0]] = '%s.%s' % (match[1], match[2])
      items.append(match[0])


if __name__ == '__main__':
  setup()
