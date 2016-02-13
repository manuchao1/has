#!/usr/bin/env python
import os
import glob

import pyinotify
import asyncio
import pyjade

def compile_jade(fname):
	with open(fname, 'r') as fid:
		jade_text = fid.read()

	html_text = pyjade.simple_convert(jade_text)

	with open(os.path.join('./compiled/', fname[:-5]+'.html'), 'w') as out:
		out.write(html_text)


class EventHandler(pyinotify.ProcessEvent):
  def process_IN_CLOSE_WRITE(self, ev):
    if not ev.pathname.endswith('.jade'):
      return

    path, fname = os.path.split(ev.pathname)

    if fname in include_files:
       files = set(glob.glob('*.jade')) - include_files
    else:
       files = [fname]

    for fname in files:
      try:
        compile_jade(fname)
        print('{} updated.'.format(fname))
      except Exception as e:
        print(e)

include_files = set([
  'head.jade',
  'foot.jade',
  'nav.jade',
])

def main():
  files = set(glob.glob('*.jade')) - include_files
  for fname in files:
    try:
      compile_jade(fname)
      print('{} updated.'.format(fname))
    except Exception as e:
      print(e)

  wm = pyinotify.WatchManager()
  handler = EventHandler()
  mask = pyinotify.IN_CLOSE_WRITE
  notifier = pyinotify.Notifier(wm, handler)
  wdd = wm.add_watch('.', mask, rec=True)

  notifier.loop()


if __name__ == '__main__':
  main()

