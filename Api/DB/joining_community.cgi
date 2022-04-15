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

# コミュニティへ参加する
def JoiningCommunity(joiningCommunityInfo):
  sql = ''

  try:
    cur = con.cursor()
    sql = "insert into community_members(member_id, community_id, member_name) values('" + joiningCommunityInfo['userId'] + "', '" + joiningCommunityInfo['communityId'] + "', ?)"

    OutLog('member_id = {1} , community_id = {2} , member_name = {3} , sql = {0}'.format(sql, joiningCommunityInfo['userId'], joiningCommunityInfo['communityId'], joiningCommunityInfo['memberName']))

    # エスケープ用文字列
    escapeMemberName = Decode(Encode(joiningCommunityInfo['memberName'], 'utf-8'), 'utf-8')

    cur.execute(sql, (escapeMemberName, ))

  except Exception as e:
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

try:
  param = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]
  paramJson = json.loads(param)

  joiningCommunityInfo = {}
  joiningCommunityInfo['userId'] = paramJson['userId']
  joiningCommunityInfo['communityId'] = paramJson['communityId']
  joiningCommunityInfo['memberName'] = paramJson['memberName']

  try:
  
    # 新規登録処理を実行する
    JoiningCommunity(joiningCommunityInfo)

    con.commit()

  except Exception as e:
    responseApi = '0'

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)