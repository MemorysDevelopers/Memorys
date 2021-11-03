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
  sql = "select idea, count from idea_trend where user_id = '" + userId + "'"
  cur.execute(sql)

  # 取得したアイデア情報をオブジェクト化する
  ideaTrendList = {}
  for row in cur:
    ideaTrendList[row[0]] = row[1]
  
  return ideaTrendList
  
def DivideInsertUpdateList(paramIdeaList, ideaTrendList):
  divideResultList = {}
  insertIdeaTrendList = {}
  updateIdeaTrendList = {}
  for idea in paramIdeaList: # idea = 'アイデア内容' + '_' + 'Memorysキー'
    if idea != 'userId':
      if UriDecode(idea, 'utf-8') in ideaTrendList:
        updateIdeaTrendList[UriDecode(idea, 'utf-8')] = paramIdeaList[idea]
      else:
        insertIdeaTrendList[UriDecode(idea, 'utf-8')] = paramIdeaList[idea]
  
  divideResultList['insert'] = insertIdeaTrendList
  divideResultList['update'] = updateIdeaTrendList

  return divideResultList

# 指定ユーザーのトレンド情報を更新する
def UpdateIdeaTrend(userId, updateIdeaTrendList):
  sql = ''
  
  try:
    # 対象ユーザーのアイデア出現回数を更新する
    for idea in updateIdeaTrendList:

      cur = con.cursor()
      sql = "update idea_trend set count = (count + " + updateIdeaTrendList[idea] + ") where user_id = '" + userId + "' and idea = ? "

      OutLog('idea = {1} , sql = {0}'.format(sql, idea))

      # エスケープ用文字列
      escapeIdea = Decode(Encode(idea, 'utf-8'), 'utf-8')

      cur.execute(sql, (escapeIdea, ))

  except Exception as e:
    if 'UNIQUE constraint failed' in ('{0}').format(e):
      UpdateIdeaTrend(userId, updateIdeaTrendList)
    else:
      con.rollback()
      OutLog('Database Error : {0} : {1}'.format(e, sql) + traceback.format_exc())
      raise

# 指定ユーザーのトレンド情報を新規登録する
def InsertIdeaTrend(userId, insertIdeaTrendList):
  sql = ''

  try:
    for idea in insertIdeaTrendList:

      cur = con.cursor()
      sql = "insert into idea_trend(user_id, idea, count) values('" + userId + "', ?, " + insertIdeaTrendList[idea] + ")"

      OutLog('idea = {1} , sql = {0}'.format(sql, idea))

      # エスケープ用文字列
      escapeIdea = Decode(Encode(idea, 'utf-8'), 'utf-8')

      cur.execute(sql, (escapeIdea, ))

  except Exception as e:
    if 'UNIQUE constraint failed' in ('{0}').format(e):
      UpdateIdeaTrend(userId, insertIdeaTrendList)
    else:
      con.rollback()
      OutLog('Database Error : {0} : {1}'.format(e, sql) + traceback.format_exc())
      raise

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

try:

  param = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]
  paramJson = json.loads(param)

  userId = paramJson['userId']

  # 更新前に登録されているアイデア情報を取得する
  ideaTrendList = GetIdeaTrendList(userId)

  # 解析した単語を登録・更新それぞれにリストとして振り分ける
  divideList = DivideInsertUpdateList(paramJson, ideaTrendList);

  try:
  
    # 新規登録処理を実行する
    InsertIdeaTrend(userId, divideList['insert'])

    # 出現回数更新処理を実行する
    UpdateIdeaTrend(userId, divideList['update'])

    con.commit()

  except Exception as e:
    responseApi = '0'

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)