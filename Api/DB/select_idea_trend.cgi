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

# URIをエンコードする
def UriEncode(uriText, encode):
  return urllib.parse.quote(uriText, encoding=encode)

# URIをデコードする
def UriDecode(uriText, encode):
  return urllib.parse.unquote(uriText, encoding=encode)

def Encode(text, encode):
  return text.encode(encode)

def Decode(text, encode):
  return text.decode(encode)

# 指定ユーザーの記録しているアイデア情報を取得する
def GetIdeaTrendList(userId):
  # 対象ユーザーのidea_trend内のアイデア情報を取得する
  cur = con.cursor()
  sql = "select idea, count from idea_trend where user_id = '" + userId + "'" + " order by count desc "
  OutLog(sql)
  cur.execute(sql)

  # 取得したアイデア情報をオブジェクト化する
  ideaTrendList = {}
  for row in cur:
    ideaTrendList[UriEncode(str(row[0]),'utf-8')] = row[1]
  
  return ideaTrendList


def OutLog(logContent):
  datenow = datetime.datetime.now()
  f = open('./Log/' + datenow.strftime('%Y%m%d') + '_db.log', 'a', encoding='utf-8')
  f.write(datenow.strftime('%Y/%m/%d %H:%M:%S') + ' : ' + logContent + NEW_LINE)
  f.close()


# API戻り値
responseApi = '1'

# 更新値振り分けリスト
divideList = {}

# ユーザーID
userId = ''
# トレンド取得数
selectCount = 0

try:

  param = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]
  paramJson = json.loads(param)

  userId = paramJson['userId']

  # 更新前に登録されているアイデア情報を取得する
  ideaTrendList = GetIdeaTrendList(userId)
  responseApi = ideaTrendList

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)