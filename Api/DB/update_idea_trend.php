<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

try {

  // POST用のクエリパラメータを作成する
  $paramAnalysisTarget = http_build_query(['param' => $_POST['param']]);

  $functions = new PostFunctions();

  // 渡された文章を形態素解析する
  $analyzedTarget = $functions->ExecutePost($paramAnalysisTarget, ANALYSIS_API_HOST . MULTI_ANALYSIS_API);
  $analyzedList = json_decode($analyzedTarget);
  $analyzedJson = '{' . AnalyzedListToJsonInnerString(json_decode($_POST['param'])->analysisTarget, $analyzedList) . ',"userId":"' . $_POST['userId'] . '"}';

  // POST用のクエリパラメータを作成する
  $paramAnalyzedList = http_build_query(['param' => $analyzedJson]);
  $response = $functions->ExecutePost($paramAnalyzedList, MAIN_HOST . DB_API_UPDATE_IDEA_TREND);

  echo $response;

} catch(Exception $e) {

  echo '0';

}

// 形態素解析した結果配列から、出現回数を含めたJSON文字列を作成する
function AnalyzedListToJsonInnerString($analysisTarget, $analyzedList) {
  $json = '';
  $analysisCountList = [];

  foreach ($analyzedList as $memorysKey => $arrayAnalyzed) {
    foreach ($arrayAnalyzed as $index => $analyzedText) {
      if (!isset($analysisCountList[$analyzedText])) {
        $analysisCountList[$analyzedText] = 0;
      }
      $analysisCountList[$analyzedText] += preg_match_all('/' . urldecode($analyzedText) . '/', urldecode($analysisTarget->$memorysKey));
    }
  }

  foreach ($analysisCountList as $analyzedText => $analysisCount) {
    $json .= '"' . $analyzedText . '":"' . $analysisCount . '",';
  }

  $json = rtrim($json, ',');

  return $json;
}