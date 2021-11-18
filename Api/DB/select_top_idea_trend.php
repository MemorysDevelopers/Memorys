<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $paramTrendQuery = http_build_query(['param' => '{"userId":"' . $_POST['userId'] . '"}']);

  $functions = new PostFunctions();
  $response = $functions->ExecutePost($paramTrendQuery, MAIN_HOST . DB_API_SELECT_IDEA_TREND);
  // 改行コードを削る
  $response = str_replace("\n", '', str_replace("\r", '', $response));

  if ($response != '0') {
    // 取得したトレンド情報からトップトレンドを選別する
    $selectCount = (int)$_POST['selectCount'];

    $selectTopTrends = '{';
    $loopCount = 0;
    $responseList = explode(', ', rtrim(ltrim(trim($response), '{'), '}'));

    foreach ($responseList as $trendInfo) {
      $trend = trim(explode(': ', $trendInfo)[0], "'");
      $trendCount = explode(': ', $trendInfo)[1];

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
    $selectTopTrends = rtrim($selectTopTrends, ',');
    $selectTopTrends .= '}';

    $response = $selectTopTrends;
  }

  echo $response;

} catch(Exception $e) {

  echo '0';

}