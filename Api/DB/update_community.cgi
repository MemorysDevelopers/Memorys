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

# コミュニティIDの最大値を取得する
def GetMaxCommunityId():
  cur = con.cursor()
  sql = "select max(cast(community_id as int)) from community_info "
  cur.execute(sql)

  maxCommunityId = '00000000'
  for row in cur:
    if type(row[0]) is str:
      maxCommunityId = row[0]
  
  return maxCommunityId

# コミュニティ情報を更新する
def UpdateCommunity(updateCommunityInfo):
  sql = ''
  
  try:
    cur = con.cursor()
    sql = "update community_members set member_name = ? where member_id = '" + updateCommunityInfo['userId'] + "' "

    OutLog('member_name = {1} , member_id = {2} , sql = {0}'.format(sql, updateCommunityInfo['memberName'], updateCommunityInfo['userId']))

    # エスケープ用文字列
    escapeMemberName = Decode(Encode(updateCommunityInfo['memberName'], 'utf-8'), 'utf-8')

    cur.execute(sql, (escapeMemberName, ))


    cur = con.cursor()
    sql = "update community_info set community_name = ?, description = ?, image_name = '" + updateCommunityInfo['imageName'] + "' where community_id = '" + updateCommunityInfo['communityId'] + "' "

    OutLog('community_id = {1} , community_name = {2} , description = {3} , image_name = {4} , sql = {0}'.format(sql, updateCommunityInfo['communityId'], updateCommunityInfo['communityName'], updateCommunityInfo['description'], updateCommunityInfo['imageName']))

    # エスケープ用文字列
    escapeCommunityName = Decode(Encode(updateCommunityInfo['communityName'], 'utf-8'), 'utf-8')
    escapeDescription = Decode(Encode(updateCommunityInfo['description'], 'utf-8'), 'utf-8')

    cur.execute(sql, (escapeCommunityName, escapeDescription))

    return updateCommunityInfo['communityId']

  except Exception as e:
    con.rollback()
    OutLog('Database Error : {0} : {1}'.format(e, sql) + traceback.format_exc())
    raise

# コミュニティ情報を新規登録する
def InsertCommunity(updateCommunityInfo):
  sql = ''

  try:
    # 新たなコミュニティIDを生成する
    maxCommunityId = GetMaxCommunityId();
    registCommunityId = str(int(maxCommunityId) + 1).zfill(8);

    cur = con.cursor()
    sql = "insert into community_members(member_id, community_id, member_name) values('" + updateCommunityInfo['userId'] + "', '" + registCommunityId + "', ?)"

    OutLog('member_id = {1} , community_id = {2} , member_name = {3} , sql = {0}'.format(sql, updateCommunityInfo['userId'], registCommunityId, updateCommunityInfo['memberName']))

    # エスケープ用文字列
    escapeMemberName = Decode(Encode(updateCommunityInfo['memberName'], 'utf-8'), 'utf-8')

    cur.execute(sql, (escapeMemberName, ))


    cur = con.cursor()
    sql = "insert into community_info(community_id, host_id, community_name, description, idea_trend_list, image_name) values('" + registCommunityId + "', '" + updateCommunityInfo['userId'] + "', ?, ?, '" + updateCommunityInfo['ideaTrendList'] + "', '" + updateCommunityInfo['imageName'] + "')"

    OutLog('community_id = {1} , host_id = {2} , community_name = {3} , description = {4} , idea_trend_list = {5} , image_name = {6} , sql = {0}'.format(sql, registCommunityId, updateCommunityInfo['userId'], updateCommunityInfo['communityName'], updateCommunityInfo['description'], updateCommunityInfo['ideaTrendList'], updateCommunityInfo['imageName']))

    # エスケープ用文字列
    escapeCommunityName = Decode(Encode(updateCommunityInfo['communityName'], 'utf-8'), 'utf-8')
    escapeDescription = Decode(Encode(updateCommunityInfo['description'], 'utf-8'), 'utf-8')

    cur.execute(sql, (escapeCommunityName, escapeDescription))

    return registCommunityId

  except Exception as e:
    if 'UNIQUE constraint failed' in ('{0}').format(e):
      updateCommunityId = UpdateCommunity(updateCommunityInfo)
      return updateCommunityId
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
responseApi = ''

try:

  param = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]
  paramJson = json.loads(param.replace('\n', '|ｶｲｷﾞｮｳ|'))

  updateCommunityInfo = {}
  updateCommunityInfo['userId'] = paramJson['userId']
  updateCommunityInfo['communityId'] = paramJson['communityId']
  updateCommunityInfo['memberName'] = paramJson['memberName']
  updateCommunityInfo['ideaTrendList'] = paramJson['ideaTrendList']
  updateCommunityInfo['communityName'] = paramJson['communityName']
  updateCommunityInfo['description'] = paramJson['description']
  updateCommunityInfo['imageName'] = paramJson['imageName']

  try:
  
    # 新規登録処理を実行する
    returnCommunityId = InsertCommunity(updateCommunityInfo)

    con.commit()

    # 登録対象のコミュニティIDをレスポンスとして設定する
    responseApi = '{"communityId":"' + returnCommunityId + '"}'

  except Exception as e:
    responseApi = '0'

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)