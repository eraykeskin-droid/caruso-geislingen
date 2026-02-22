<?php
// auth-helper.php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Checks if the user is logged in and has one of the allowed roles.
 * Returns 401 if not logged in, 403 if role not allowed.
 */
function requireLogin($allowedRoles = ['admin', 'staff'])
{
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header('Content-Type: application/json', true, 401);
        echo json_encode(['success' => false, 'error' => 'Nicht angemeldet']);
        exit;
    }

    $userRole = $_SESSION['admin_role'] ?? 'staff';
    if (!in_array($userRole, $allowedRoles)) {
        header('Content-Type: application/json', true, 403);
        echo json_encode(['success' => false, 'error' => 'Keine Berechtigung']);
        exit;
    }

    return $userRole;
}
?>
