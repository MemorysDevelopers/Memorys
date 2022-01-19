<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

const INVITATION_RATIO = 0.5;  // [50%]の適合率の場合にコミュニティ招待対象とする
const MAX_MATCH_IDEA_TREND_JUDGE_COUNT = 10;

// 対象ユーザー（複数指定可）のアイデア情報を取得する
function GetIdeaTrendOfUser($userIdList) {
  // POST用のクエリパラメータを作成する
  $queryUserId = '';
  foreach ($userIdList as $receiveUserId) {
    // where in 句用の条件を作成する
    $queryUserId .= ($queryUserId == '') ? '' : ',';
    $queryUserId .= $receiveUserId;
  }
  $paramTrendQuery = http_build_query(['param' => '{"userId":"' . $queryUserId . '","isSearchInvitationUsers":"1"}']);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramTrendQuery, MAIN_HOST . DB_API_SELECT_IDEA_TREND);
  // 改行コードを削る
  return str_replace("\n", '', str_replace("\r", '', $response));
}

// ユーザー毎のアイデア出現回数情報を整理したリストを作成する
function CreateIdeaCountList($ideaTrendListForEachUser) {

  // ユーザー毎のアイデア出現回数情報を整理したリスト
  $ideaCountForEachUser = [];

  if ($ideaTrendListForEachUser != '0') {
    $ideaTrendArrayForEachUser = json_decode($ideaTrendListForEachUser, true);

    foreach ($ideaTrendArrayForEachUser as $userId => $trendInfoList) {
      // ユーザーのアイデア出現回数情報を初期化
      $ideaCountForEachUser[$userId]['list'] = [];
      $ideaCountForEachUser[$userId]['total'] = 0;

      foreach ($trendInfoList as $index => $trendInfo) {
        $trend = key($trendInfo);
        $trendCount = $trendInfo[key($trendInfo)];

        $decodeTrend = urldecode($trend);

        // ひらがな以外が含まれるトレンドを対象とする
        if (preg_match('/[^あ-ん0-9\|□：\"\-]/', $decodeTrend) != 0) {
          $ideaCountForEachUser[$userId]['list'][urlencode($decodeTrend)] = $trendCount;
          $ideaCountForEachUser[$userId]['total'] += $trendCount;
        }
      }
    }

    return $ideaCountForEachUser;

  } else {
    return [];
  }
}

// トップアイデアトレンド情報のリストを作成する
function CreateTopIdeaTrendList($ideaList) {
  $addListCount = 0;
  $topIdeaTrendList = [];
  foreach ($ideaList as $idea => $ideaCount) {
    array_push($topIdeaTrendList, $idea);
    $addListCount++;

    if ($addListCount >= MAX_MATCH_IDEA_TREND_JUDGE_COUNT){
      break;
    }
  }
  return $topIdeaTrendList;
}

// 招待ユーザーを選出する
function SelectInvitationUser($hostIdeaCountList, $invitationIdeaCountList) {

  // ホストユーザーID
  $hostUserId = array_keys($hostIdeaCountList)[0];

  // 招待対象として選出されたユーザーIDリスト
  $selectInvitationUserIdList = [];

  // ホストアイデアの出現回数の合計値
  $totalHostIdeaCount = $hostIdeaCountList[$hostUserId]['total'];

  // アイデアトレンドの一致があるか否か
  $isMatchIdeaTrend = false;
  $matchIdeaTrendJudgeCount;

  // 招待候補ユーザーのアイデア出現回数を処理する
  foreach ($invitationIdeaCountList as $invitationUserId => $invitationIdeaCountForEachUser) {

    // ホストアイデア出現回数との差分
    $totalHostIdeaDifferenceValue = 0;

    $hostIdeaList = $hostIdeaCountList[$hostUserId]['list'];
    $invitationIdeaList = $invitationIdeaCountForEachUser['list'];

    // ホストアイデア出現回数を処理する
    foreach ($hostIdeaList as $hostIdea => $hostIdeaCount) {
      
      // ホストアイデア出現回数との差分を求めていく
      if (array_key_exists($hostIdea, $invitationIdeaList)) {
        $invitationIdeaCount = $invitationIdeaList[$hostIdea];
        $hostIdeaDifferenceCount = abs($hostIdeaCount - $invitationIdeaCount);
        $analogyValue = $hostIdeaCount - $hostIdeaDifferenceCount;
        $totalHostIdeaDifferenceValue += ($analogyValue < 0) ? 0 : $analogyValue;
      }
    
    }

    // アイデアの類似率を求める
    $analogyRate = $totalHostIdeaDifferenceValue / $totalHostIdeaCount;

    // 類似率にて判定する
    if ($analogyRate >= INVITATION_RATIO) {
      // 招待ユーザーIDとして追加する
      array_push($selectInvitationUserIdList, $invitationUserId);
    
    // アイデアトレンドの一致によって判定する
    } else {
      
      $hostTopIdeaTrendList = CreateTopIdeaTrendList($hostIdeaList);
      $invitationTopIdeaTrendList = CreateTopIdeaTrendList($invitationIdeaList);

      if (count(array_diff($hostTopIdeaTrendList, $invitationTopIdeaTrendList)) < MAX_MATCH_IDEA_TREND_JUDGE_COUNT) {
        // 招待ユーザーIDとして追加する
        array_push($selectInvitationUserIdList, $invitationUserId);
      }

    }
  }

  return $selectInvitationUserIdList;
}

try {

  // ***************************
  // ホスト用のアイデアを取得する
  // ***************************

  $hostResponse = GetIdeaTrendOfUser($_POST['hostUserId']);


  // ***********************************
  // 招待対象ユーザー用のアイデアを取得する
  // ***********************************

  $invitationResponse = GetIdeaTrendOfUser($_POST['invitationUserId']);



  // ************************************************
  // アイデアの類似率に従って、招待対象ユーザーを選定する
  // ************************************************

  $hostIdeaCountList = CreateIdeaCountList($hostResponse);
  $invitationIdeaCountList = CreateIdeaCountList($invitationResponse);

  $invitationUserList = SelectInvitationUser($hostIdeaCountList, $invitationIdeaCountList);

  echo json_encode($invitationUserList);

} catch(Exception $e) {

  echo '0';

}