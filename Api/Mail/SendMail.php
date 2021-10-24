<?php

$isSuccessSendMail = false;

if (isset($_POST['error'])) {
  $_SendMail = new SendMail();
  // エラー通知送信
  if ($_SendMail->ErrorAlert($_POST['error']))
    $isSuccessSendMail = true;
  else
    $isSuccessSendMail = false;
}


class SendMail {
  // 送信先アドレス
  private const TO_MAIL_ADDRESS = 'lowtone03@gmail.com';
  private const FROM_MAIL_ADDRESS = 'lowtone03@yururito.gradation.jp';
  private const FROM = 'Error';
  private const FROM_NAME = 'Memorys';
  
  // エラー通知送信
  public function ErrorAlert($error) {
    try {
      mb_language('japanese');
      mb_internal_encoding('UTF-8');

      $subject = '【Memorys Error Alert】';
      $body = "*********************************************************\n\n"
              . '■エラー内容：' . "\n" . $error . "\n\n"
              . "*********************************************************\n";
      $to = self::TO_MAIL_ADDRESS;
      $header = 'Content-Type: text/plain' . "\r\n"
                . 'Return-Path: ' . self::FROM_MAIL_ADDRESS . " \r\n"
                . 'From: ' . self::FROM . " \r\n"
                . 'Sender: ' . self::FROM . " \r\n"
                . 'Reply-To: ' . self::FROM_MAIL_ADDRESS . " \r\n"
                . 'Organization: ' . self::FROM_NAME . " \r\n"
                . 'X-Sender: ' . self::FROM_MAIL_ADDRESS . " \r\n"
                . 'X-Priority: 3' . " \r\n";

      return mb_send_mail($to, $subject, $body, $header);
    } catch (Exception $e) {
      return false;
    }
  }
}