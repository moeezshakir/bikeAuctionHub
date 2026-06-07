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

    if (!isset($data['email'])) {
        $response = ['status' => false, 'error' => 'Invalid form data'];
        echo json_encode($response);
        exit;
    }

    $email = $data['email'];

    // Check if the email exists in the database
    $stmt = $pdo->prepare("SELECT * FROM rrh_registered_user WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        $response = ['status' => false, 'error' => 'Email not found'];
        echo json_encode($response);
        exit;
    }

    // Generate new OTP
    $otp = rand(10000, 99999); // Change to random_int() for better security

    // Set OTP expiration time (e.g., 10 minutes from now)
    $expiration_time = date('Y-m-d H:i:s', strtotime('+10 minutes'));

    // Insert/update OTP in otp_verification table
    $otpInsertStmt = $pdo->prepare("INSERT INTO otp_verification (user_id, otp, expiration_time) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE otp = VALUES(otp), expiration_time = VALUES(expiration_time)");
    $otpInsertStmt->execute([$user['id'], $otp, $expiration_time]);

    // Prepare response with user ID and OTP
    $response = [
        'status' => true,
        'message' => 'OTP has been resent successfully.',
        'otp' => $otp,
        'user_id' => $user['id'] // Include user ID in the response
    ];
} catch (PDOException $e) {
    error_log('PDOException: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'Database error.'];
} catch (Exception $e) {
    error_log('Exception: ' . $e->getMessage());
    $response = ['status' => false, 'error' => 'An unexpected error occurred.'];
}

echo json_encode($response);
