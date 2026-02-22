<?php
// public/api/ics.php
header('Content-Type: text/calendar; charset=utf-8');
header('Content-Disposition: attachment; filename="Caruso_Reservierung.ics"');

$date = $_GET['date'] ?? '';
$time = $_GET['time'] ?? '';
$name = $_GET['name'] ?? '';
$guests = $_GET['guests'] ?? '';
$address = $_GET['address'] ?? 'Hauptstraße 36, 73312 Geislingen an der Steige';

if (!$date || !$time) {
    die("Invalid parameters");
}

try {
    $startStr = $date . ' ' . $time;
    // Assume local time for the restaurant is Europe/Berlin
    $startObj = new DateTime($startStr, new DateTimeZone('Europe/Berlin'));
    $startObj->setTimezone(new DateTimeZone('UTC'));
    $dtStart = $startObj->format('Ymd\THis\Z');

    $endObj = clone $startObj;
    $endObj->modify('+2 hours');
    $dtEnd = $endObj->format('Ymd\THis\Z');
}
catch (Exception $e) {
    die("Date error");
}

$dtStamp = gmdate('Ymd\THis\Z');
$uid = uniqid('res_', true) . "@caruso-geislingen.de";

// Escaping newlines for ICS using \n
$description = "Danke für deine Reservierung im Café Caruso!\\n\\nDetails:\\nName: $name\\nGäste: $guests\\n\\nWir freuen uns auf deinen Besuch!";

echo "BEGIN:VCALENDAR\r\n";
echo "VERSION:2.0\r\n";
echo "PRODID:-//Cafe Caruso//Reservierung//DE\r\n";
echo "CALSCALE:GREGORIAN\r\n";
echo "BEGIN:VEVENT\r\n";
echo "DTSTAMP:$dtStamp\r\n";
echo "UID:$uid\r\n";
echo "DTSTART:$dtStart\r\n";
echo "DTEND:$dtEnd\r\n";
echo "SUMMARY:Reservierung Café Caruso\r\n";
echo "DESCRIPTION:$description\r\n";
echo "LOCATION:$address\r\n";
echo "END:VEVENT\r\n";
echo "END:VCALENDAR\r\n";
?>