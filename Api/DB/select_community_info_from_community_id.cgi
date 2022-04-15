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

# 指定のコミュニティメンバー情報を取得する
def GetCommunityMemberInfo(communityId):
  cur = con.cursor()
  sql = "select member_id, community_id, member_name from community_members where community_id = '" + communityId + "' "
  OutLog(sql);
  cur.execute(sql)

  # 取得したコミュニティ情報をオブジェクト化する
  communityMemberInfo = []
  for row in cur:
    communityMemberInfo.append({'memberId': row[0], 'communityId': row[1], 'memberName': row[2]});
  
  return communityMemberInfo

# 指定コミュニティの詳細情報を取得する
def GetCommunityDetailsInfo(communityId):
  cur = con.cursor()
  sql = "select community_id, host_id, community_name, description, idea_trend_list, image_name from community_info where community_id = '" + communityId + "' "
  OutLog(sql);
  cur.execute(sql)

  # 取得したコミュニティ情報をオブジェクト化する
  communityDetailsInfo = {}
  for row in cur:
    communityDetailsInfo['communityId'] = row[0]
    communityDetailsInfo['hostId'] = row[1]
    communityDetailsInfo['communityName'] = row[2]
    communityDetailsInfo['description'] = row[3]
    communityDetailsInfo['ideaTrendList'] = row[4]
    communityDetailsInfo['imageName'] = row[5]
  
  return communityDetailsInfo

def OutLog(logContent):
  datenow = datetime.datetime.now()
  f = open('./Log/' + datenow.strftime('%Y%m%d') + '_db.log', 'a', encoding='utf-8')
  f.write(datenow.strftime('%Y/%m/%d %H:%M:%S') + ' : ' + logContent + NEW_LINE)
  f.close()


# API戻り値
responseApi = '1'

# コミュニティID
communityId = ''

try:

  param = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]
  paramJson = json.loads(param)

  communityId = paramJson['communityId']

  # コミュニティの詳細情報を取得する
  communityInfo = {}
  communityInfo['memberInfo'] = GetCommunityMemberInfo(communityId)
  communityInfo['detailsInfo'] = GetCommunityDetailsInfo(communityId)
  
  responseApi = json.dumps(communityInfo)

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)