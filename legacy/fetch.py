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
  #Obviously the number of savings week by week so we need to fetch this first.
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
    try:
      matches = []
      query = re.compile("((?P<price_limit>~\$([<>=]|<=|>=)\d+(\.\d\d)?))?\s*((?P<op>&|\|))?\s*(?P<reg_query>.*)")
     
      qElems = query.search(item).groupdict()
      priceLim = qElems['price_limit']
      operator = qElems['op']
      rest = qElems['reg_query']
      if priceLim: 
        matches = searchByPrice(priceLim)
        if operator == '&':
          matches = set(matches).intersection(search(rest))
        else:
          matches = set(matches).union(search(rest))
      else:
        matches = search(rest)
      if len(matches) == 0: print "Sorry, no matching savings were found"
      for match in matches:
        print lineEntry(match[0], match[1])
    except:
      print "Sorry, that input broke something : (, try again with something less ridic"

def lineEntry(item, price):
    return 'Possible match\t|cost: %s%s|item: %s' % (price, '\t\t' if len(price) < 7 else '\t',  item)

def searchByPrice(item):
    ops = {'<': (lambda x, y: x < y), '>': (lambda x,y:x > y), '<=': (lambda x, y: x <= y), '>=' : (lambda x, y: x >=y), '=' : (lambda x,y: x == y)}
    opre = re.compile("~\$(?P<opcode>[<>=]|<=|>=)(?P<price>\d+(\.\d\d)?)")
    res = opre.search(item)
    
    op = ops[res.groupdict()['opcode']]
    possible_matches = []
    for el, price in savingsDict.items():
      if 'for' in price:
        if op(float(price.split()[2]), float(res.groupdict()['price'])):
          possible_matches.append((el, price))
      elif op(float(price), float(res.groupdict()['price'])):
        possible_matches.append((el, price))
      
    return possible_matches

def search(item):
    try:
      item_re = re.compile(item, re.I)
    except:
      return 'Whoa, that input broke this whole thing... maybe try something less ridiculous'
    possible_matches = []
    for (item, price) in savingsDict.items():
      if item_re.search(item):
        possible_matches.append((item, price))
    return possible_matches
 

class PageReader(threading.Thread):

  def __init__(self, opener, baseURL, pageNum):
    threading.Thread.__init__(self)
    self.opener = opener
    self.baseURL = baseURL
    self.pageNum = pageNum

  def run(self):
    #reads each item and it's price via regular expressions
    rsp = self.opener.open("%s%s%s" % (self.baseURL, "?page=", str(self.pageNum)))
    body = rsp.read()
    h4 = re.compile("<h4>(?P<item>[^<]+)</h4>\s*<p\s*class=\"price\">(?P<dollar>[^<]+)<span>(?P<cents>\d+)")
    matches = h4.findall(body)
    for match in matches:
      savingsDict[match[0]] = '%s.%s' % (match[1], match[2])


if __name__ == '__main__':
  setup()
