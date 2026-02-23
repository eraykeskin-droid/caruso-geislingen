<?php
require 'vendor/autoload.php';
require_once 'db.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

/**
 * Helper to format date in German: "Sonntag, 22. Februar 2026"
 */
function formatGermanDate($dateStr)
{
    if (!$dateStr)
        return '';
    $date = new DateTime($dateStr);
    $days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    $months = ['', 'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    return $days[$date->format('w')] . ', ' . $date->format('j') . '. ' . $months[$date->format('n')] . ' ' . $date->format('Y');
}

/**
 * Types: 
 * - ADMIN_NOTIFICATION: Send to Cafe Caruso Team (New request)
 * - CUSTOMER_RECEIPT: Send to Customer (Incoming request)
 * - CUSTOMER_CONFIRMED: Send to Customer (Confirmed)
 * - CUSTOMER_REJECTED: Send to Customer (Rejected)
 */
function sendReservationMail($resData, $type = 'ADMIN_NOTIFICATION')
{
    global $pdo;
    $mail = new PHPMailer(true);

    try {
        // --- FETCH SETTINGS FROM DATABASE --- //
        $stmt = $pdo->query("SELECT setting_key, setting_value FROM website_settings");
        $settings = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

        $brandName = $settings['contact_name'];
        $street = $settings['contact_street'];
        $city = $settings['contact_city'];
        $phone = $settings['contact_phone'];
        $email = $settings['contact_email'];

        // --- SMTP SERVER SETTINGS --- //
        $mail->isSMTP();
        $mail->Host = 'smtp.ionos.de';
        $mail->SMTPAuth = true;
        $mail->Username = 'reservierungen@caruso-geislingen.de';
        $mail->Password = 'Carusoischgeil123';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';

        $mail->setFrom('reservierungen@caruso-geislingen.de', $brandName);

        $adminEmail = 'reservierungen@caruso-geislingen.de';
        $customerEmail = $resData['email'];
        $customerName = $resData['name'];

        $mail->isHTML(true);

        // --- Brand Colors --- //
        $brandGold = '#C5A059';
        $bgDark = '#0a0a0a';
        $cardBg = '#141414';
        $borderCol = 'rgba(255,255,255,0.1)';

        // --- Embedded Logo --- //
        // Try PNG first (best for Gmail compatibility), fallback to SVG
        $logoPathPng = dirname(__DIR__) . '/images/caruso-logo-white.png';
        $logoPathSvg = dirname(__DIR__) . '/images/caruso-logo-white.svg';

        if (file_exists($logoPathPng)) {
            $mail->addEmbeddedImage($logoPathPng, 'caruso_logo');
            $logoHtml = "<img src='cid:caruso_logo' alt='$brandName Logo'>";
        }
        elseif (file_exists($logoPathSvg)) {
            $mail->addEmbeddedImage($logoPathSvg, 'caruso_logo');
            $logoHtml = "<img src='cid:caruso_logo' alt='$brandName Logo'>";
        }
        else {
            // Fallback to text if image missing
            $logoHtml = "<h2 style='color: $brandGold; margin: 0; font-style: italic;'>$brandName</h2>";
        }

        // --- Shared Template Start --- //
        $htmlHeader = "
        <!DOCTYPE html>
        <html lang='de'>
        <head>
            <meta charset='utf-8'>
            <meta name='viewport' content='width=device-width, initial-scale=1.0'>
            <meta name='color-scheme' content='dark'>
            <meta name='supported-color-schemes' content='dark'>
            <style>
                :root {
                    color-scheme: dark;
                    supported-color-schemes: dark;
                }
                body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
                table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
                img { -ms-interpolation-mode: bicubic; }
                body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important; background-color: $bgDark !important; color: #ffffff !important; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: $bgDark !important; }
                .card { background-color: $cardBg !important; padding: 40px; border: 1px solid $borderCol; }
                .logo { text-align: center; margin-bottom: 40px; }
                .logo img { height: 60px; width: auto; }
                .gold { color: $brandGold; }
                h1 { font-style: italic; text-transform: uppercase; letter-spacing: 1px; margin-top: 0; font-size: 22px; border-left: 3px solid $brandGold; padding-left: 15px; margin-bottom: 30px; font-weight: 900; }
                .details-box { background-color: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 25px; margin: 30px 0; }
                .detail-table { width: 100%; border-collapse: collapse; }
                .detail-label { color: #9ca3af; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 4px; }
                .detail-value { color: #ffffff; font-size: 15px; font-weight: bold; padding-bottom: 20px; }
                .detail-value-last { padding-bottom: 0; }
                .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 40px; line-height: 1.8; }
                .btn { display: inline-block; padding: 14px 30px; background-color: $brandGold; color: #000000 !important; text-decoration: none; font-weight: bold; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 20px; }
                .btn-outline { border: 1px solid rgba(255,255,255,0.2); background: transparent; color: #ffffff !important; }
                .calendar-buttons { margin-top: 25px; text-align: center; }
                .cal-btn { display: inline-block; padding: 8px 15px; border: 1px solid rgba(255,255,255,0.1); color: #9ca3af !important; text-decoration: none; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; margin: 5px; background: rgba(255,255,255,0.03); }
                .cal-btn:hover { border-color: $brandGold; color: $brandGold !important; }
                p { line-height: 1.6; font-size: 14px; color: #d1d5db; }
                b { color: #ffffff; }
            </style>
        </head>
        <body style='background-color: $bgDark !important; background: $bgDark; color: #ffffff !important; margin: 0; padding: 0; width: 100% !important; -webkit-font-smoothing: antialiased;'>
            <table width='100%' cellpadding='0' cellspacing='0' border='0' style='background-color: $bgDark; margin: 0; padding: 0;'>
                <tr>
                    <td align='center' style='padding: 40px 20px; background-color: $bgDark;'>
                        <!-- Container -->
                        <table width='100%' cellpadding='0' cellspacing='0' border='0' style='max-width: 600px; margin: 0 auto; background-color: $bgDark;'>
                            <tr>
                                <td>
                                    <div class='logo'>
                                        $logoHtml
                                    </div>
                                    <div style='background-color: $cardBg !important; background: $cardBg; padding: 40px; border: 1px solid $borderCol; color: #ffffff;'>
        ";

        $htmlFooter = "
                                    </div>
                                    <div class='footer'>
                                        <b style='color: #ffffff;'>$brandName</b><br>
                                        $street, $city<br>
                                        <a href='tel:" . str_replace(' ', '', $phone) . "' style='color:#6b7280; text-decoration:none;'>$phone</a> | 
                                        <a href='https://caruso-geislingen.de' style='color:#6b7280; text-decoration:none;'>caruso-geislingen.de</a>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
        ";

        // --- Calendar Link Helpers --- //
        $calTitle = urlencode("Reservierung Café Caruso");
        $calDate = str_replace('-', '', $resData['date']);
        $calTimeStart = str_replace(':', '', substr($resData['time'], 0, 5)) . "00";
        // End time + 2 hours
        $endH = (int)substr($resData['time'], 0, 2) + 2;
        $calTimeEnd = str_pad($endH, 2, "0", STR_PAD_LEFT) . substr($calTimeStart, 2, 4);

        $calDetails = urlencode("Danke für deine Reservierung im $brandName!\n\nDetails:\nName: {$resData['name']}\nGäste: {$resData['guests']}\n\nWir freuen uns auf deinen Besuch!");
        $calLocation = urlencode("$street, $city");

        $appleCal = "https://caruso-geislingen.de/api/ics.php?date=" . urlencode($resData['date']) . "&time=" . urlencode($resData['time']) . "&name=" . urlencode($resData['name']) . "&guests=" . urlencode($resData['guests']) . "&address=$calLocation";
        $googleCal = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=$calTitle&dates=$calDate" . "T" . "$calTimeStart/$calDate" . "T" . "$calTimeEnd&details=$calDetails&location=$calLocation";
        $outlookCal = "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=$calTitle&startdt=$resData[date]T$resData[time]&enddt=$resData[date]T$calTimeEnd&body=$calDetails&location=$calLocation";

        // --- Helpers --- //
        $guestDisplay = (int)$resData['guests'] === 1 ? '1 Person' : ((int)$resData['guests'] >= 11 ? 'Mehr als 10 (siehe Bemerkung)' : $resData['guests'] . ' Personen');
        $prettyDate = formatGermanDate($resData['date']);

        switch ($type) {
            case 'ADMIN_NOTIFICATION':
                $mail->addAddress($adminEmail, 'Caruso Team');
                $mail->addAddress('eraykeskin@gmail.com', 'Eray Keskin');
                $mail->Subject = "Neue Reservierungsanfrage: {$resData['name']}";
                $mail->Body = $htmlHeader . "
                    <h1>Neue Anfrage</h1>
                    <p>Hallo Team, es ist eine neue Reservierungsanfrage eingegangen:</p>
                    <div class='details-box'>
                        <table class='detail-table'>
                            <tr>
                                <td class='detail-label'>Kunde</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>{$resData['name']}</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Datum</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>$prettyDate</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Uhrzeit</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>" . substr($resData['time'], 0, 5) . " Uhr</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Gäste</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>$guestDisplay</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Kontakt</td>
                            </tr>
                            <tr>
                                <td class='detail-value detail-value-last'>{$resData['phone']}<br>{$resData['email']}</td>
                            </tr>
                        </table>
                    </div>
                    " . ($resData['comment'] ? "<p style='font-size:12px; margin-top: 20px; border-left: 2px solid $brandGold; padding-left: 10px;'><b>Bemerkung:</b><br>{$resData['comment']}</p>" : "") . "
                    <div style='text-align:center; margin-top: 30px;'>
                        <a href='https://caruso-geislingen.de/admin' class='btn'>Zum Admin-Panel</a>
                    </div>
                " . $htmlFooter;
                break;

            case 'CUSTOMER_RECEIPT':
                $mail->addAddress($customerEmail, $customerName);
                $mail->Subject = "Anfrage erhalten - $brandName";
                $mail->Body = $htmlHeader . "
                    <h1>Anfrage erhalten</h1>
                    <p>Hallo $customerName,</p>
                    <p>vielen Dank für deine Reservierungsanfrage im $brandName!</p>
                    <p>Wir haben deine Reservierung erhalten und prüfen die Verfügbarkeit.<br>Du hörst in Kürze von uns!</p>
                    <div class='details-box'>
                        <table class='detail-table'>
                            <tr>
                                <td class='detail-label'>Datum</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>$prettyDate</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Uhrzeit</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>" . substr($resData['time'], 0, 5) . " Uhr</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Personen</td>
                            </tr>
                            <tr>
                                <td class='detail-value detail-value-last'>$guestDisplay</td>
                            </tr>
                        </table>
                    </div>
                    " . ($resData['comment'] ? "<p style='font-size:13px; margin-bottom: 30px; border-left: 2px solid $brandGold; padding-left: 10px; color: #e5e7eb;'><b>Deine Bemerkung:</b><br>{$resData['comment']}</p>" : "") . "
                    <p>Beste Grüße,<br>Dein Caruso Team</p>
                " . $htmlFooter;
                break;

            case 'CUSTOMER_CONFIRMED':
                $mail->addAddress($customerEmail, $customerName);
                $mail->Subject = "Reservierung bestätigt! - $brandName";
                $mail->Body = $htmlHeader . "
                    <h1 style='border-left-color: #22c55e;'>Bestätigt!</h1>
                    <p>Gute Nachrichten, $customerName,</p>
                    <p>deine Reservierung im $brandName wurde soeben <b style='color:#22c55e'>bestätigt</b>.<br>Wir freuen uns auf deinen Besuch!</p>
                    <div class='details-box' style='border-color: rgba(34, 197, 94, 0.3);'>
                        <table class='detail-table'>
                            <tr>
                                <td class='detail-label'>Datum</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>$prettyDate</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Uhrzeit</td>
                            </tr>
                            <tr>
                                <td class='detail-value'>" . substr($resData['time'], 0, 5) . " Uhr</td>
                            </tr>
                            <tr>
                                <td class='detail-label'>Gäste</td>
                            </tr>
                            <tr>
                                <td class='detail-value detail-value-last'>$guestDisplay</td>
                            </tr>
                        </table>
                    </div>
                    " . ($resData['comment'] ? "<p style='font-size:13px; margin-bottom: 30px; border-left: 2px solid #22c55e; padding-left: 10px; color: #e5e7eb;'><b>Deine Bemerkung:</b><br>{$resData['comment']}</p>" : "") . "
                    <div class='calendar-buttons'>
                        <p style='font-size:12px; margin-bottom: 15px;'>Termin vormerken:</p>
                        <a href='$appleCal' class='cal-btn' target='_blank'>Apple Kalender</a>
                        <a href='$googleCal' class='cal-btn' target='_blank'>Google Kalender</a>
                        <a href='$outlookCal' class='cal-btn' target='_blank'>Outlook / Office</a>
                    </div>
                    <p style='margin-top:40px;'>Bis bald,<br>Dein Caruso Team</p>
                " . $htmlFooter;
                break;

            case 'CUSTOMER_REJECTED':
                $mail->addAddress($customerEmail, $customerName);
                $mail->Subject = "Reservierung abgelehnt - $brandName";
                $reason = !empty($resData['rejection_reason']) ? $resData['rejection_reason'] : 'Leider sind wir zu diesem Zeitpunkt bereits ausgebucht.';
                $mail->Body = $htmlHeader . "
                    <h1 style='border-left-color: #ef4444; color: #ffffff;'>Abgelehnt</h1>
                    <p>Hallo $customerName,</p>
                    <p>deine Reservierung im $brandName wurde leider <b style='color:#ef4444'>abgelehnt</b>.</p>
                    
                    <div style='background-color: #1a1a1a; background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.3); padding: 25px; margin: 30px 0;'>
                        <p class='detail-label' style='color:#ef4444;'>Grund der Ablehnung:</p>
                        <p style='color:#ffffff; margin-top:5px; font-size: 15px; margin-bottom: 25px;'>\"{$reason}\"</p>
                        
                        <div style='border-top: 1px solid rgba(255,255,255,0.1); padding-top: 25px;'>
                            <table class='detail-table'>
                                <tr>
                                    <td class='detail-label'>Datum</td>
                                </tr>
                                <tr>
                                    <td class='detail-value' style='color: #9ca3af; text-decoration: line-through;'>$prettyDate</td>
                                </tr>
                                <tr>
                                    <td class='detail-label'>Uhrzeit</td>
                                </tr>
                                <tr>
                                    <td class='detail-value' style='color: #9ca3af; text-decoration: line-through;'>" . substr($resData['time'], 0, 5) . " Uhr</td>
                                </tr>
                                <tr>
                                    <td class='detail-label'>Gäste</td>
                                </tr>
                                <tr>
                                    <td class='detail-value detail-value-last' style='color: #9ca3af; text-decoration: line-through;'>$guestDisplay</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <p>Wir hoffen, dich ein anderes Mal bei uns begrüßen zu dürfen. Versuche es doch gerne an einem anderen Tag oder zu einer anderen Uhrzeit noch einmal!</p>
                    <div style='margin-top: 30px; text-align: center;'>
                        <a href='https://caruso-geislingen.de/reservieren' class='btn'>Neuen Termin anfragen</a>
                    </div>
                    
                    <p style='margin-top:40px;'>Beste Grüße,<br>Dein Caruso Team</p>
                " . $htmlFooter;
                break;
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