<?php
require 'vendor/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function sendReservationMail($resData, $isUpdate)
{
    $mail = new PHPMailer(true);

    try {
        // --- SMTP SERVER SETTINGS --- //
        $mail->isSMTP();
        $mail->Host = 'smtp.ionos.de'; // Your IONOS SMTP server
        $mail->SMTPAuth = true;
        $mail->Username = 'info@cafe-caruso.de'; // Your full email address
        $mail->Password = 'DEIN_EMAIL_PASSWORT_HIER'; // Your Email Password
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS; // or ENCRYPTION_STARTTLS
        $mail->Port = 465; // 465 for SMTPS, 587 for STARTTLS
        $mail->CharSet = 'UTF-8';

        // --- SENDER INFO --- //
        $mail->setFrom('info@cafe-caruso.de', 'Café Caruso Reservierung');

        // --- RECIPIENTS --- //
        // 1. Send copy to the Admin (Restaurant)
        $mail->addAddress('info@cafe-caruso.de', 'Caruso Team');

        // 2. Add Customer as CC or BCC (Optional, or send a separate email)
        // $mail->addCC($resData['email'], $resData['name']); 

        $mail->isHTML(true);

        if ($isUpdate) {
            $mail->Subject = "Reservierung Aktualisiert: {$resData['name']} ({$resData['date']})";
            $mail->Body = "
            <h3>Die Reservierung wurde aktualisiert/bearbeitet.</h3>
            <b>Kunde:</b> {$resData['name']}<br>
            <b>Datum:</b> {$resData['date']} um {$resData['time']}<br>
            <b>Personen:</b> {$resData['guests']}<br>
            <b>Telefon:</b> {$resData['phone']}<br>
            <b>E-Mail:</b> {$resData['email']}<br>
            <b>Kommentar:</b> {$resData['comment']}<br>
            <b>ID:</b> " . ($resData['id'] ?? 'Keine') . "<br>
            <b>Status:</b> {$resData['status']}
            ";
        }
        else {
            $mail->Subject = "Neue Reservierungsanfrage: {$resData['name']} ({$resData['date']})";
            $mail->Body = "
            <h3>Neue Reservierungsanfrage!</h3>
            <b>Kunde:</b> {$resData['name']}<br>
            <b>Datum:</b> {$resData['date']} um {$resData['time']}<br>
            <b>Personen:</b> {$resData['guests']}<br>
            <b>Telefon:</b> {$resData['phone']}<br>
            <b>E-Mail:</b> {$resData['email']}<br>
            <b>Kommentar:</b> {$resData['comment']}
            ";
        }

        $mail->send();
        return true;
    }
    catch (Exception $e) {
        error_log("Message could not be sent. Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>