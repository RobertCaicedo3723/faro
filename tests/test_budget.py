import concurrent.futures
from contextlib import closing
import re
import sqlite3
import tempfile
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
SQL=re.search(r"prepare\('(UPDATE faro_budget SET reserved=reserved\+\?.+?)'\)", (ROOT/'app/api/faro/route.ts').read_text(encoding='utf-8')).group(1)
class BudgetTest(unittest.TestCase):
 def test_atomic_reservations(self):
  with tempfile.TemporaryDirectory(prefix='faro-budget-') as directory:
   path=Path(directory)/'budget.sqlite'
   with closing(sqlite3.connect(path,isolation_level=None)) as db:
    db.execute('CREATE TABLE faro_budget(id TEXT PRIMARY KEY, spent INTEGER, reserved INTEGER)')
    db.execute("INSERT INTO faro_budget VALUES('project',63119,0)")
   def reserve(_):
    with closing(sqlite3.connect(path,timeout=10,isolation_level=None)) as db:
     return db.execute(SQL,(30000,'project',30000,500000)).rowcount
   with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
    successes=sum(pool.map(reserve,range(40)))
   with closing(sqlite3.connect(path,isolation_level=None)) as db:
    spent,reserved=db.execute('SELECT spent,reserved FROM faro_budget').fetchone()
   self.assertEqual(successes,14)
   self.assertEqual(reserved,420000)
   self.assertLessEqual(spent+reserved,500000)
 def test_sql_has_budget_guard(self):
  self.assertIn('spent+reserved+?<=?',SQL)
 def test_no_browser_reset_endpoint(self):
  source=(ROOT/'app/api/faro/route.ts').read_text(encoding='utf-8')
  self.assertNotIn('DELETE FROM faro_budget',source)
  self.assertNotIn('SET spent=0',source)
if __name__=='__main__':unittest.main()
