<?php

require '../../Config/ApiPath.php';
require '../Functions/PostFunctions.php';

function ImageResize($resizeFile) {
  $fileType = mime_content_type($resizeFile);
  list($width, $hight) = getimagesize($resizeFile);

  $baseImage;
  if ($fileType == 'image/jpeg') {
    $baseImage = imagecreatefromjpeg($resizeFile);

  } else if ($fileType == 'image/png') {
    $baseImage = imagecreatefrompng($resizeFile);

  }

  $image = imagecreatetruecolor(1500, 1500);
  
  imagecopyresampled($image, $baseImage, 0, 0, 0, 0, 1500, 1500, $width, $hight);

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