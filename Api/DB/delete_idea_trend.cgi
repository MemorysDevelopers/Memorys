#!/usr/bin/python3.6
# ↑ それぞれのローカル環境に合わせたPythonファイルまでのパスの記載が必要です

import sys
import json
import datetime
import sqlite3
import urllib.parse
import traceback

# 定数
NEW_LINE = '\n'
DB_PATH = './memorys.db'

con = sqlite3.connect(DB_PATH)

# URIをデコードする
def UriDecode(uriText, encode):
  return urllib.parse.unquote(uriText, encoding=encode)

# 指定ユーザーのトレンド情報を削除する
def DeleteIdeaTrend(userId):
  sql = ''
  
  try:
    # 対象ユーザーのアイデアトレンド情報を削除する
    cur = con.cursor()
    sql = "delete from idea_trend where user_id = '" + userId + "' "

    OutLog('{0}'.format(sql))

    cur.execute(sql)
  except Exception as e:
    OutLog('Database Error : {0} : {1}'.format(e, sql) + traceback.format_exc())
    raise

def OutLog(logContent):
  datenow = datetime.datetime.now()
  f = open('./Log/' + datenow.strftime('%Y%m%d') + '_db.log', 'a', encoding='utf-8')
  f.write(datenow.strftime('%Y/%m/%d %H:%M:%S') + ' : ' + logContent + NEW_LINE)
  f.close()


# API戻り値
responseApi = '1'

# ユーザーID
userId = ''

try:

  userId = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]

  try:

    # 指定ユーザーのアイデアトレンド情報を削除する
    DeleteIdeaTrend(userId)

    con.commit()
  
  except Exception as e:
    con.rollback()
    responseApi = '0'

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)