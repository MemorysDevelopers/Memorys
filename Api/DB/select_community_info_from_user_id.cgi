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

# 対象ユーザーがコミュニティに所属しているか否かを判定する
def IsAffiliationCommunity(userId):
  cur = con.cursor()
  sql = "select member_id from community_members where member_id = '" + userId + "'"
  OutLog(sql);
  cur.execute(sql)

  # 取得したコミュニティ情報をオブジェクト化する
  isAffiliation = False
  for row in cur:
    isAffiliation = True
  
  return isAffiliation

# 対象ユーザーがコミュニティに所属しているか否かを判定する
def GetSelfCommunityMemberInfo(userId):
  cur = con.cursor()
  sql = "select member_id, community_id, member_name from community_members where member_id = '" + userId + "'"
  OutLog(sql);
  cur.execute(sql)

  # 取得したコミュニティ情報をオブジェクト化する
  selfCommunityMemberInfo = {}
  for row in cur:
    selfCommunityMemberInfo['memberId'] = row[0]
    selfCommunityMemberInfo['communityId'] = row[1]
    selfCommunityMemberInfo['memberName'] = row[2]
  
  return selfCommunityMemberInfo

# 対象ユーザーの所属コミュニティメンバー情報を取得する
def GetcommunityMemberInfo(userId):
  cur = con.cursor()
  sql = "select cm1.member_id, cm1.community_id, cm1.member_name from community_members cm1 where exists(select cm2.member_id from community_members cm2 where cm2.member_id = '" + userId + "' and cm2.community_id = cm1.community_id) order by cm1.member_id "
  OutLog(sql);
  cur.execute(sql)

  # 取得したコミュニティ情報をオブジェクト化する
  communityMemberInfo = []
  for row in cur:
    communityMemberInfo.append({'memberId': row[0], 'communityId': row[1], 'memberName': row[2]});
  
  return communityMemberInfo

# 対象コミュニティの詳細情報を取得する
def GetCommunityDetailsInfo(userId):
  cur = con.cursor()
  sql = "select ci.community_id, ci.host_id, ci.community_name, ci.description, ci.idea_trend_list, ci.image_name from community_info ci where exists(select cm.member_id from community_members cm where cm.member_id = '" + userId + "' and cm.community_id = ci.community_id)"
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

# ユーザーID
userId = ''

try:

  param = UriDecode(sys.stdin.readline(), 'utf-8').split('=')[1]
  paramJson = json.loads(param)

  userId = paramJson['userId']

  # 指定ユーザーのコミュニティ所在情報を取得する
  isAffiliation = IsAffiliationCommunity(userId)

  # コミュニティに所属している場合は、コミュニティの詳細情報を取得する
  communityInfo = {}
  if isAffiliation:
    communityInfo['selfMemberInfo'] = GetSelfCommunityMemberInfo(userId)
    communityInfo['memberInfo'] = GetcommunityMemberInfo(userId)
    communityInfo['detailsInfo'] = GetCommunityDetailsInfo(userId)
  
  responseApi = json.dumps(communityInfo) if isAffiliation else '0'

except Exception as e:
  OutLog('Error : {0} '.format(e) + traceback.format_exc())
  responseApi = '0'

con.close

print('Content-type: text/plain\n')
print(responseApi)