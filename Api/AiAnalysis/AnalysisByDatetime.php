<?php

// 過去年月情報により解析したデータを取得する
function GetAnalysisTargetDataList($memoryList, $analysisDateAgo, $executionCount) {
  $targetDataList = [];
  $analysisDateAgoStart;
  $analysisDateAgoEnd;

  foreach ($memoryList as $key => $memoryInfo) {
    $registDateTmp = strtotime($memoryInfo->registDate);
    $analysisDateAgoStart = strtotime('-1 month, ' . $analysisDateAgo, strtotime('now'));
    $analysisDateAgoEnd = strtotime('+1 month, ' . $analysisDateAgo, strtotime('now'));

    if ($registDateTmp >= $analysisDateAgoStart && $registDateTmp <= $analysisDateAgoEnd) {
      array_push($targetDataList, $memoryInfo);
    }
  };

  // 再帰処理により、データが抽出できるまで、もしくは500回抽出を試みるまで続ける
  return (count($targetDataList) === 0 && $executionCount <= 500) ?
    GetAnalysisTargetDataList($memoryList, $analysisDateAgo, ++$executionCount) : json_encode($targetDataList);
}



$memorys = json_decode($_POST['memorys']);

$analysisDateAgo = $memorys->analysisDateAgo;
$memoryList = $memorys->memoryList;

$targetDataListResult = GetAnalysisTargetDataList($memoryList, $analysisDateAgo, 0);
echo ($targetDataListResult) ? $targetDataListResult : '{}';
