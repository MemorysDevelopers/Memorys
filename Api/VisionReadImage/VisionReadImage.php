<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

const IMAGE_SIZE_FIXED = 2000;

function OutLog($logText) {
  // 出力ログファイル名
  $nowDay = date('Ymd');
  $outlogFileName = $nowDay . '.log';

  // ログ出力内容
  $content = date('Y/m/d H:i:s') . ' : ' . $logText . "\n";

  // ログ出力
  $f = fopen('./Log/' . $outlogFileName, 'a');
  fwrite($f, $content);
  fclose($f);
}

function GetAspectRatioSize($imageWidth, $imageHeight) {
  // 縦横比を求める
  $aspectRatio = IMAGE_SIZE_FIXED / (($imageWidth >= $imageHeight) ? $imageWidth : $imageHeight);

  $resizeImageWidth = $imageWidth * $aspectRatio;
  $resizeImageHeight = $imageHeight * $aspectRatio;

  return ['imageWidth' => $resizeImageWidth, 'imageHeight' => $resizeImageHeight];
}

function ImageResize($resizeFile) {
  $fileType = mime_content_type($resizeFile);
  list($width, $hight) = getimagesize($resizeFile);

  $baseImage;
  if ($fileType == 'image/jpeg') {
    $baseImage = imagecreatefromjpeg($resizeFile);

  } else if ($fileType == 'image/png') {
    $baseImage = imagecreatefrompng($resizeFile);

  }

  // 縦横比を維持した状態でサイズ調整を行う
  $aspectRatioSize = GetAspectRatioSize($width, $hight);

  $image = imagecreatetruecolor($aspectRatioSize['imageWidth'], $aspectRatioSize['imageHeight']);
  
  // ログ出力
  OutLog('元横幅：' . $width . ' / 元縦幅：' . $hight . ' / 調整後の横幅：' . $aspectRatioSize['imageWidth'] . ' / 調整後の縦幅：' . $aspectRatioSize['imageHeight']);

  imagecopyresampled($image, $baseImage, 0, 0, 0, 0, $aspectRatioSize['imageWidth'], $aspectRatioSize['imageHeight'], $width, $hight);

  $resizeFilePath = 'resize_' . $resizeFile;
  if ($fileType == 'image/jpeg') {
    imagejpeg($image, $resizeFilePath);

  } else if ($fileType == 'image/png') {
    imagepng($image, $resizeFilePath);

  }

  return $resizeFilePath;
}

$file = $_FILES['visionImage']['name'];
$path = $_FILES['visionImage']['tmp_name'];
move_uploaded_file($path, $file);
$resizeFilePath = ImageResize($file);

// POST用のクエリパラメータを作成する
$f = fopen($resizeFilePath, 'r');

$query = strval(base64_encode(fread($f, 100000000)));

// 一時保存したファイルを削除する
unlink($resizeFilePath);
unlink($file);
fclose($f);

$functions = new PostFunctions();
$response = $functions->ExecutePost($query, VISION_API);

echo $response;