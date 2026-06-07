<?php
header('Access-Control-Allow-Origin: *');
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

ini_set('log_errors', 1);
ini_set('error_log', 'php-error.log');
error_reporting(E_ALL);

$response = [];

try {
    $pdo = new PDO("mysql:host=localhost;dbname=if0_36679809_ridehub", "root", "");
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Check if all required fields are set
    if (!isset($data['userId'], $data['cnic'], $data['recoveryEmail'], $data['recoveryPhoneNumber'])) {
        $response = ['status' => false, 'error' => 'Invalid form data'];
        echo json_encode($response);
        exit;
    }

    $userId = $data['userId'];
    $cnic = $data['cnic'];
    $recoveryEmail = $data['recoveryEmail'];
    $recoveryPhoneNumber = $data['recoveryPhoneNumber'];

    // Check if the user ID exists in the rrh_user_requiredinfo table
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM rrh_user_requiredinfo WHERE userId = ?");
    $stmt->execute([$userId]);
    $exists = $stmt->fetchColumn();

    if ($exists) {
        // Update existing record
        $updateStmt = $pdo->prepare("UPDATE rrh_user_requiredinfo SET cnic = ?, recoveryEmail = ?, recoveryPhoneNumber = ? WHERE userId = ?");
        $updateStmt->execute([$cnic, $recoveryEmail, $recoveryPhoneNumber, $userId]);
        $response = ['status' => true, 'message' => 'User info updated successfully'];
    } else {
        // Insert new record
        $insertStmt = $pdo->prepare("INSERT INTO rrh_user_requiredinfo (userId, cnic, recoveryEmail, recoveryPhoneNumber) VALUES (?, ?, ?, ?)");
        $insertStmt->execute([$userId, $cnic, $recoveryEmail, $recoveryPhoneNumber]);
        $response = ['status' => true, 'message' => 'User info inserted successfully'];
    }
} catch (PDOException $e) {
    error_log('PDOException: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'Database error.'];
} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'An unexpected error occurred.'];
}

echo json_encode($response);
