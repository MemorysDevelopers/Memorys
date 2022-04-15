<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $queryUserId = '';
  foreach ($_POST['userId'] as $receiveUserId) {
    // where in 句用の条件を作成する
    $queryUserId .= ($queryUserId == '') ? '' : ',';
    $queryUserId .= $receiveUserId;
  }
  $paramTrendQuery = http_build_query(['param' => '{"userId":"' . $queryUserId . '","isSearchInvitationUsers":"0"}']);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramTrendQuery, MAIN_HOST . DB_API_SELECT_IDEA_TREND);
  // 改行コードを削る
  $response = str_replace("\n", '', str_replace("\r", '', $response));

  if ($response != '0') {
    // 取得したトレンド情報からトップトレンドを選別する
    $selectCount = (int)$_POST['selectCount'];

    $selectTopTrends = '{';
    $loopCount = 0;
    //$responseList = explode(', ', rtrim(ltrim(trim($response), '{'), '}'));
    $responseList = json_decode($response, true);

    foreach ($responseList as $responseUserId => $trendInfoList) {
      foreach ($trendInfoList as $index => $trendInfo) {
        $trend = key($trendInfo);
        $trendCount = $trendInfo[key($trendInfo)];

        $decodeTrend = urldecode($trend);

        // ひらがな以外が含まれるトレンドを対象とする
        if (preg_match('/[^あ-ん0-9\|□：\"\-]/', $decodeTrend) != 0) {
          $selectTopTrends .= '"' . urlencode($decodeTrend) . '":"' . $trendCount . '",';
          $loopCount++;
        }

        if ($loopCount >= $selectCount) {
          break;
        }
      }
    }
    $selectTopTrends = rtrim($selectTopTrends, ',');
    $selectTopTrends .= '}';

    $response = $selectTopTrends;
  }

  echo $response;

} catch(Exception $e) {

  echo '0';

}