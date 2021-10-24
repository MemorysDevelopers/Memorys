<?php

$isSuccessSendMail = '0';

if ($_POST['txtMailAddress'] && $_POST['txtInquiryContent']) {
  $_SendMail = new Inquiry();
  // お問合せ送信
  if ($_SendMail->SendInquiry($_POST))
    $isSuccessSendMail = '1';
  else
    $isSuccessSendMail = '0';
}

// お問い合わせ結果
echo $isSuccessSendMail;


class Inquiry {
  // 送信先アドレス
  private const TO_MAIL_ADDRESS = 'lowtone03@gmail.com';
  private const FROM_MAIL_ADDRESS = 'lowtone03@yururito.gradation.jp';
  private const FROM = 'Inquiry';
  private const FROM_NAME = 'Memorys';
  
  // お問合せ送信
  public function SendInquiry($inputs) {
    try {
      mb_language('japanese');
      mb_internal_encoding('UTF-8');

      $subject = '【Memorys からのお問合せ】';
      $body = "*********************************************************\n\n"
              . '■返信先メールアドレス：' . $inputs['txtMailAddress'] . "\n"
              . '■お問合せ内容：' . "\n" . $inputs['txtInquiryContent'] . "\n\n"
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