<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

// POST用のクエリパラメータを作成する
$query = http_build_query(['memorys' => $_POST['memorys']]);

$functions = new PostFunctions();
$response = $functions->ExecutePost($query, ANALYSIS_API_HOST . SEARCH_AI_API);

echo $response;